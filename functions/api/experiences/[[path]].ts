import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/experiences')

app.use('/*', cors())

// ========================================
// 체험 신청
// ========================================
app.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const body = await c.req.json()
    const { job_id, requested_date, requested_time, message } = body
    
    if (!job_id || !requested_date || !requested_time) {
      return c.json({ 
        success: false, 
        error: '공고 ID, 희망 날짜, 희망 시간은 필수입니다.' 
      }, 400)
    }
    
    // 공고 정보 조회
    const job = await c.env.DB.prepare(`
      SELECT user_id as employer_id FROM jobs WHERE id = ? AND status = 'active'
    `).bind(job_id).first<{ employer_id: string }>()
    
    if (!job) {
      return c.json({ success: false, error: '유효한 공고를 찾을 수 없습니다.' }, 404)
    }
    
    // 자기 자신의 공고에는 신청 불가
    if (job.employer_id === session.user_id) {
      return c.json({ success: false, error: '본인이 등록한 공고에는 신청할 수 없습니다.' }, 400)
    }
    
    // 중복 신청 확인
    const existing = await c.env.DB.prepare(`
      SELECT id FROM experiences 
      WHERE job_id = ? AND jobseeker_id = ? AND status IN ('pending', 'approved')
    `).bind(job_id, session.user_id).first()
    
    if (existing) {
      return c.json({ success: false, error: '이미 신청한 공고입니다.' }, 400)
    }
    
    // 사용자 포인트 및 신뢰도 점수 확인
    const user = await c.env.DB.prepare(`
      SELECT points, trust_score, user_type FROM users WHERE id = ?
    `).bind(session.user_id).first<{ points: number; trust_score: number; user_type: string }>()
    
    if (!user || user.points < 10) {
      return c.json({ success: false, error: '포인트가 부족합니다. (필요: 10P)' }, 400)
    }
    
    // 신뢰도 점수 확인 (구직자만, 50점 미만은 지원 제한)
    if (user.user_type === 'jobseeker') {
      const trustScore = user.trust_score !== null && user.trust_score !== undefined ? user.trust_score : 100
      if (trustScore < 50) {
        return c.json({ 
          success: false, 
          error: `신뢰도 점수가 너무 낮아 체험 신청이 제한됩니다. (현재: ${trustScore}점, 필요: 50점 이상)\n\n고객센터에 문의하여 신뢰도를 회복하세요.` 
        }, 403)
      }
    }
    
    // 체험 ID 생성
    const experienceId = crypto.randomUUID().substring(0, 16)
    
    // 트랜잭션 시작 (포인트 차감 + 체험 생성 + 포인트 내역 + 알림)
    
    // 1. 포인트 차감 (10P)
    await c.env.DB.prepare(`
      UPDATE users SET points = points - 10 WHERE id = ?
    `).bind(session.user_id).run()
    
    // 2. 체험 신청 생성
    await c.env.DB.prepare(`
      INSERT INTO experiences (
        id, job_id, jobseeker_id, employer_id,
        status, requested_date, requested_time, message, points_used, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 10, datetime('now'))
    `).bind(
      experienceId,
      job_id,
      session.user_id,
      job.employer_id,
      requested_date,
      requested_time,
      message || null
    ).run()
    
    // 3. 포인트 내역 추가
    await c.env.DB.prepare(`
      INSERT INTO point_transactions (
        id, user_id, amount, description, created_at
      ) VALUES (?, ?, -10, '1시간 체험 신청', datetime('now'))
    `).bind(crypto.randomUUID().substring(0, 16), session.user_id).run()
    
    // 4. 구인자에게 알림
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, data, created_at
      ) VALUES (?, ?, 'job', '새로운 체험 신청', '공고에 체험 신청이 접수되었습니다.', ?, datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      job.employer_id,
      JSON.stringify({ experience_id: experienceId, job_id })
    ).run()
    
    console.log('✅ 체험 신청 성공:', experienceId)
    
    return c.json({
      success: true,
      message: '체험 신청이 완료되었습니다. (10P 차감)',
      experienceId: experienceId
    })
    
  } catch (error: any) {
    console.error('체험 신청 오류:', error)
    return c.json({ success: false, error: '체험 신청 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 내 체험 목록 (구직자)
// ========================================
app.get('/my', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const { status } = c.req.query()
    
    let sql = `
      SELECT 
        e.id,
        e.status,
        e.requested_date,
        e.requested_time,
        e.approved_date,
        e.approved_time,
        e.message,
        e.rejection_reason,
        e.points_used,
        e.created_at,
        j.title as job_title,
        j.company_name,
        j.address as location,
        j.hourly_wage,
        u.name as employer_name
      FROM experiences e
      JOIN jobs j ON e.job_id = j.id
      JOIN users u ON e.employer_id = u.id
      WHERE e.jobseeker_id = ?
    `
    
    const params: any[] = [session.user_id]
    
    if (status) {
      sql += ` AND e.status = ?`
      params.push(status)
    }
    
    sql += ` ORDER BY e.created_at DESC`
    
    const experiences = await c.env.DB.prepare(sql).bind(...params).all()
    
    console.log('✅ 내 체험 목록 조회:', experiences.results?.length || 0, '건')
    
    return c.json({
      success: true,
      experiences: experiences.results || []
    })
    
  } catch (error: any) {
    console.error('내 체험 목록 조회 오류:', error)
    return c.json({ success: false, error: '체험 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 받은 체험 신청 목록 (구인자)
// ========================================
app.get('/received', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const { status } = c.req.query()
    
    let sql = `
      SELECT 
        e.id,
        e.status,
        e.requested_date,
        e.requested_time,
        e.approved_date,
        e.approved_time,
        e.message,
        e.created_at,
        j.title as job_title,
        j.id as job_id,
        u.name as jobseeker_name,
        u.phone as jobseeker_phone
      FROM experiences e
      JOIN jobs j ON e.job_id = j.id
      JOIN users u ON e.jobseeker_id = u.id
      WHERE e.employer_id = ?
    `
    
    const params: any[] = [session.user_id]
    
    if (status) {
      sql += ` AND e.status = ?`
      params.push(status)
    }
    
    sql += ` ORDER BY e.created_at DESC`
    
    const experiences = await c.env.DB.prepare(sql).bind(...params).all()
    
    console.log('✅ 받은 체험 신청 목록 조회:', experiences.results?.length || 0, '건')
    
    return c.json({
      success: true,
      experiences: experiences.results || []
    })
    
  } catch (error: any) {
    console.error('받은 체험 신청 목록 조회 오류:', error)
    return c.json({ success: false, error: '체험 신청 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 체험 신청 승인
// ========================================
app.put('/:id/approve', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const experienceId = c.req.param('id')
    const body = await c.req.json()
    const { approved_date, approved_time } = body
    
    // 체험 신청 확인
    const experience = await c.env.DB.prepare(`
      SELECT employer_id, jobseeker_id, status FROM experiences WHERE id = ?
    `).bind(experienceId).first<{ employer_id: string; jobseeker_id: string; status: string }>()
    
    if (!experience) {
      return c.json({ success: false, error: '체험 신청을 찾을 수 없습니다.' }, 404)
    }
    
    if (experience.employer_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    if (experience.status !== 'pending') {
      return c.json({ success: false, error: '대기 중인 신청만 승인할 수 있습니다.' }, 400)
    }
    
    // 승인 처리
    await c.env.DB.prepare(`
      UPDATE experiences
      SET status = 'approved',
          approved_date = ?,
          approved_time = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(approved_date || null, approved_time || null, experienceId).run()
    
    // 구직자에게 알림
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, data, created_at
      ) VALUES (?, ?, 'job', '체험 신청 승인', '체험 신청이 승인되었습니다!', ?, datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      experience.jobseeker_id,
      JSON.stringify({ experience_id: experienceId })
    ).run()
    
    console.log('✅ 체험 신청 승인:', experienceId)
    
    return c.json({
      success: true,
      message: '체험 신청이 승인되었습니다.'
    })
    
  } catch (error: any) {
    console.error('체험 신청 승인 오류:', error)
    return c.json({ success: false, error: '체험 신청 승인 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 체험 신청 거절
// ========================================
app.put('/:id/reject', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const experienceId = c.req.param('id')
    const body = await c.req.json()
    const { rejection_reason } = body
    
    // 체험 신청 확인
    const experience = await c.env.DB.prepare(`
      SELECT employer_id, jobseeker_id, status, points_used FROM experiences WHERE id = ?
    `).bind(experienceId).first<{ employer_id: string; jobseeker_id: string; status: string; points_used: number }>()
    
    if (!experience) {
      return c.json({ success: false, error: '체험 신청을 찾을 수 없습니다.' }, 404)
    }
    
    if (experience.employer_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    if (experience.status !== 'pending') {
      return c.json({ success: false, error: '대기 중인 신청만 거절할 수 있습니다.' }, 400)
    }
    
    // 거절 처리
    await c.env.DB.prepare(`
      UPDATE experiences
      SET status = 'rejected',
          rejection_reason = ?,
          points_refunded = 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(rejection_reason || null, experienceId).run()
    
    // 포인트 환불
    await c.env.DB.prepare(`
      UPDATE users SET points = points + ? WHERE id = ?
    `).bind(experience.points_used, experience.jobseeker_id).run()
    
    // 포인트 내역 추가
    await c.env.DB.prepare(`
      INSERT INTO point_transactions (
        id, user_id, amount, description, created_at
      ) VALUES (?, ?, ?, '체험 신청 거절 - 포인트 환불', datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      experience.jobseeker_id,
      experience.points_used
    ).run()
    
    // 구직자에게 알림
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, data, created_at
      ) VALUES (?, ?, 'job', '체험 신청 거절', '체험 신청이 거절되었습니다. 포인트가 환불되었습니다.', ?, datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      experience.jobseeker_id,
      JSON.stringify({ experience_id: experienceId })
    ).run()
    
    console.log('✅ 체험 신청 거절 및 포인트 환불:', experienceId)
    
    return c.json({
      success: true,
      message: '체험 신청이 거절되었습니다. 구직자에게 포인트가 환불되었습니다.'
    })
    
  } catch (error: any) {
    console.error('체험 신청 거절 오류:', error)
    return c.json({ success: false, error: '체험 신청 거절 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 체험 신청 취소 (구직자)
// ========================================
app.put('/:id/cancel', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const experienceId = c.req.param('id')
    
    // 체험 신청 확인
    const experience = await c.env.DB.prepare(`
      SELECT jobseeker_id, status, points_used FROM experiences WHERE id = ?
    `).bind(experienceId).first<{ jobseeker_id: string; status: string; points_used: number }>()
    
    if (!experience) {
      return c.json({ success: false, error: '체험 신청을 찾을 수 없습니다.' }, 404)
    }
    
    if (experience.jobseeker_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    if (experience.status !== 'pending') {
      return c.json({ success: false, error: '대기 중인 신청만 취소할 수 있습니다.' }, 400)
    }
    
    // 취소 처리
    await c.env.DB.prepare(`
      UPDATE experiences
      SET status = 'cancelled',
          points_refunded = 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(experienceId).run()
    
    // 포인트 환불
    await c.env.DB.prepare(`
      UPDATE users SET points = points + ? WHERE id = ?
    `).bind(experience.points_used, session.user_id).run()
    
    // 포인트 내역 추가
    await c.env.DB.prepare(`
      INSERT INTO point_transactions (
        id, user_id, amount, description, created_at
      ) VALUES (?, ?, ?, '체험 신청 취소 - 포인트 환불', datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      session.user_id,
      experience.points_used
    ).run()
    
    console.log('✅ 체험 신청 취소 및 포인트 환불:', experienceId)
    
    return c.json({
      success: true,
      message: '체험 신청이 취소되었습니다. 포인트가 환불되었습니다.'
    })
    
  } catch (error: any) {
    console.error('체험 신청 취소 오류:', error)
    return c.json({ success: false, error: '체험 신청 취소 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 체험 완료 처리 (구인자)
// ========================================
app.put('/:id/complete', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const experienceId = c.req.param('id')
    
    // 체험 신청 확인
    const experience = await c.env.DB.prepare(`
      SELECT employer_id, jobseeker_id, status FROM experiences WHERE id = ?
    `).bind(experienceId).first<{ employer_id: string; jobseeker_id: string; status: string }>()
    
    if (!experience) {
      return c.json({ success: false, error: '체험 신청을 찾을 수 없습니다.' }, 404)
    }
    
    if (experience.employer_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    if (experience.status !== 'approved') {
      return c.json({ success: false, error: '승인된 체험만 완료 처리할 수 있습니다.' }, 400)
    }
    
    // 완료 처리
    await c.env.DB.prepare(`
      UPDATE experiences
      SET status = 'completed',
          completed_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(experienceId).run()
    
    // 구직자에게 30P 지급
    await c.env.DB.prepare(`
      UPDATE users SET points = points + 30 WHERE id = ?
    `).bind(experience.jobseeker_id).run()
    
    // 포인트 내역 추가
    await c.env.DB.prepare(`
      INSERT INTO point_transactions (
        id, user_id, amount, description, created_at
      ) VALUES (?, ?, 30, '체험 완료 보상', datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      experience.jobseeker_id
    ).run()
    
    // 구직자에게 알림
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, data, created_at
      ) VALUES (?, ?, 'experience', '체험 완료 🎉', '체험이 완료되어 30P가 지급되었습니다!', ?, datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      experience.jobseeker_id,
      JSON.stringify({ experience_id: experienceId })
    ).run()
    
    console.log('✅ 체험 완료 처리 및 포인트 지급:', experienceId)
    
    return c.json({
      success: true,
      message: '체험이 완료되었습니다. 구직자에게 30P가 지급되었습니다.'
    })
    
  } catch (error: any) {
    console.error('체험 완료 처리 오류:', error)
    return c.json({ success: false, error: '체험 완료 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 체험 리뷰 작성 (구직자)
// ========================================
app.post('/:id/review', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const experienceId = c.req.param('id')
    const body = await c.req.json<{ rating: number; review: string }>()
    const { rating, review } = body
    
    if (!rating || rating < 1 || rating > 5) {
      return c.json({ success: false, error: '평점은 1~5 사이여야 합니다.' }, 400)
    }
    
    if (!review || review.trim().length < 10) {
      return c.json({ success: false, error: '리뷰는 최소 10자 이상 작성해주세요.' }, 400)
    }
    
    // 체험 신청 확인
    const experience = await c.env.DB.prepare(`
      SELECT jobseeker_id, status, job_id, review_submitted FROM experiences WHERE id = ?
    `).bind(experienceId).first<{ jobseeker_id: string; status: string; job_id: string; review_submitted: number }>()
    
    if (!experience) {
      return c.json({ success: false, error: '체험 신청을 찾을 수 없습니다.' }, 404)
    }
    
    if (experience.jobseeker_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    if (experience.status !== 'completed') {
      return c.json({ success: false, error: '완료된 체험만 리뷰를 작성할 수 있습니다.' }, 400)
    }
    
    if (experience.review_submitted === 1) {
      return c.json({ success: false, error: '이미 리뷰를 작성하셨습니다.' }, 400)
    }
    
    // 리뷰 저장
    await c.env.DB.prepare(`
      UPDATE experiences
      SET rating = ?,
          review = ?,
          review_submitted = 1,
          review_submitted_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(rating, review, experienceId).run()
    
    // 리뷰 작성 보상 10P 지급
    await c.env.DB.prepare(`
      UPDATE users SET points = points + 10 WHERE id = ?
    `).bind(session.user_id).run()
    
    // 포인트 내역 추가
    await c.env.DB.prepare(`
      INSERT INTO point_transactions (
        id, user_id, amount, description, created_at
      ) VALUES (?, ?, 10, '체험 리뷰 작성 보상', datetime('now'))
    `).bind(
      crypto.randomUUID().substring(0, 16),
      session.user_id
    ).run()
    
    console.log('✅ 체험 리뷰 작성 및 포인트 지급:', experienceId)
    
    return c.json({
      success: true,
      message: '리뷰가 등록되었습니다. 10P가 지급되었습니다!'
    })
    
  } catch (error: any) {
    console.error('체험 리뷰 작성 오류:', error)
    return c.json({ success: false, error: '체험 리뷰 작성 중 오류가 발생했습니다.' }, 500)
  }
})

export const onRequest = handle(app)
