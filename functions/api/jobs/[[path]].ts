import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/jobs')

app.use('/*', cors())

// ========================================
// 공고 목록 조회 (검색, 필터링)
// ========================================
app.get('/', async (c) => {
  try {
    const { 
      category, 
      location, 
      minWage, 
      search, 
      hiring_type,
      status = 'active',
      limit = '20',
      offset = '0'
    } = c.req.query()
    
    let sql = `
      SELECT 
        j.id,
        j.title,
        j.company_name,
        j.job_type as category,
        j.hourly_wage,
        j.address as location,
        j.description,
        j.work_hours,
        j.work_days,
        j.latitude,
        j.longitude,
        j.views,
        j.status,
        j.hiring_type,
        j.created_at,
        u.name as employer_name,
        j.user_id as employer_id
      FROM jobs j
      LEFT JOIN users u ON j.user_id = u.id
      WHERE j.status = ?
    `
    
    const params: any[] = [status]
    
    // 카테고리 필터
    if (category) {
      sql += ` AND j.job_type = ?`
      params.push(category)
    }
    
    // 지역 필터
    if (location) {
      sql += ` AND (j.address LIKE ? OR j.region LIKE ?)`
      params.push(`%${location}%`, `%${location}%`)
    }
    
    // 최저시급 필터
    if (minWage) {
      sql += ` AND j.hourly_wage >= ?`
      params.push(parseInt(minWage))
    }
    
    // 검색어
    if (search) {
      sql += ` AND (j.title LIKE ? OR j.description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }
    
    // 채용 방식 필터
    if (hiring_type) {
      sql += ` AND j.hiring_type = ?`
      params.push(hiring_type)
    }
    
    // 정렬 및 페이지네이션
    sql += ` ORDER BY j.is_urgent DESC, j.created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))
    
    const jobs = await c.env.DB.prepare(sql).bind(...params).all()
    
    // 전체 개수 조회
    let countSql = `SELECT COUNT(*) as total FROM jobs j WHERE j.status = ?`
    const countParams: any[] = [status]
    
    if (category) {
      countSql += ` AND j.job_type = ?`
      countParams.push(category)
    }
    if (location) {
      countSql += ` AND (j.address LIKE ? OR j.region LIKE ?)`
      countParams.push(`%${location}%`, `%${location}%`)
    }
    if (minWage) {
      countSql += ` AND j.hourly_wage >= ?`
      countParams.push(parseInt(minWage))
    }
    if (search) {
      countSql += ` AND (j.title LIKE ? OR j.description LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`)
    }
    if (hiring_type) {
      countSql += ` AND j.hiring_type = ?`
      countParams.push(hiring_type)
    }
    
    const countResult = await c.env.DB.prepare(countSql).bind(...countParams).first<{ total: number }>()
    
    console.log('✅ 공고 목록 조회:', jobs.results?.length || 0, '건')
    
    return c.json({
      success: true,
      jobs: jobs.results || [],
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    
  } catch (error: any) {
    console.error('공고 목록 조회 오류:', error)
    return c.json({ success: false, error: '공고 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 공고 상세 조회
// ========================================
app.get('/:id', async (c) => {
  try {
    const jobId = c.req.param('id')
    
    // 조회수 증가
    await c.env.DB.prepare(`
      UPDATE jobs SET views = views + 1 WHERE id = ?
    `).bind(jobId).run()
    
    // 공고 정보 조회
    const job = await c.env.DB.prepare(`
      SELECT 
        j.*,
        u.name as employer_name,
        u.phone as employer_phone,
        u.email as employer_email
      FROM jobs j
      LEFT JOIN users u ON j.user_id = u.id
      WHERE j.id = ?
    `).bind(jobId).first()
    
    if (!job) {
      return c.json({ success: false, error: '공고를 찾을 수 없습니다.' }, 404)
    }
    
    console.log('✅ 공고 상세 조회:', jobId)
    
    return c.json({
      success: true,
      job: job
    })
    
  } catch (error: any) {
    console.error('공고 상세 조회 오류:', error)
    return c.json({ success: false, error: '공고 상세 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 공고 등록
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
    
    // 사용자 정보 확인 (구인자만 등록 가능)
    const user = await c.env.DB.prepare(`
      SELECT user_type FROM users WHERE id = ?
    `).bind(session.user_id).first<{ user_type: string }>()
    
    if (!user || user.user_type !== 'employer') {
      return c.json({ success: false, error: '구인자만 공고를 등록할 수 있습니다.' }, 403)
    }
    
    const body = await c.req.json()
    const {
      title,
      company_name,
      hourly_wage,
      address,
      description,
      work_hours,
      work_days,
      total_work_hours,
      requirements,
      benefits,
      job_type = 'etc',
      region,
      latitude,
      longitude,
      contact_name,
      contact_phone,
      contact_email,
      experience_times,
      experienceTimes,
      hiring_type = 'trial'  // 기본값: 체험 후 채용
    } = body
    
    // 필수 필드 검증
    if (!title || !company_name || !hourly_wage || !address) {
      return c.json({ 
        success: false, 
        error: '제목, 회사명, 시급, 주소는 필수입니다.' 
      }, 400)
    }
    
    // 최저시급 검증 (2026년 기준 10,320원)
    if (hourly_wage < 10320) {
      return c.json({ 
        success: false, 
        error: '시급은 최저시급(10,320원) 이상이어야 합니다.' 
      }, 400)
    }
    
    // 공고 ID 생성
    const jobId = crypto.randomUUID().substring(0, 16)
    
    // 체험 시간 처리
    const expTimes = experience_times || experienceTimes || []
    const expTimesStr = Array.isArray(expTimes) ? JSON.stringify(expTimes) : expTimes
    
    // 공고 등록
    await c.env.DB.prepare(`
      INSERT INTO jobs (
        id, user_id, title, company_name, job_type, hourly_wage,
        work_hours, work_days, total_work_hours, address, region,
        latitude, longitude, description, requirements, benefits,
        contact_name, contact_phone, contact_email, experience_times,
        hiring_type, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).bind(
      jobId,
      session.user_id,
      title,
      company_name,
      job_type,
      hourly_wage,
      work_hours || null,
      work_days || null,
      total_work_hours || null,
      address,
      region || null,
      latitude || null,
      longitude || null,
      description || null,
      requirements || null,
      benefits || null,
      contact_name || null,
      contact_phone || null,
      contact_email || null,
      expTimesStr || null,
      hiring_type || 'trial'
    ).run()
    
    console.log('✅ 공고 등록 성공:', jobId)
    
    return c.json({
      success: true,
      message: '공고가 등록되었습니다.',
      jobId: jobId
    })
    
  } catch (error: any) {
    console.error('공고 등록 오류:', error)
    return c.json({ success: false, error: '공고 등록 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 공고 수정
// ========================================
app.put('/:id', async (c) => {
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
    
    const jobId = c.req.param('id')
    
    // 공고 소유자 확인
    const job = await c.env.DB.prepare(`
      SELECT user_id FROM jobs WHERE id = ?
    `).bind(jobId).first<{ user_id: string }>()
    
    if (!job) {
      return c.json({ success: false, error: '공고를 찾을 수 없습니다.' }, 404)
    }
    
    if (job.user_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    const body = await c.req.json()
    const {
      title,
      hourly_wage,
      location,
      region,
      address,
      latitude,
      longitude,
      description,
      work_schedule,
      requirements,
      benefits,
      category,
      job_type,
      tags,
      work_days,
      work_hours,
      experience_times,
      status
    } = body
    
    // job_type을 category로 매핑
    const finalCategory = job_type || category;
    const finalLocation = address || location;
    const finalRegion = region || location;
    
    // 최저시급 검증
    if (hourly_wage && hourly_wage < 10320) {
      return c.json({ 
        success: false, 
        error: '시급은 최저시급(10,320원) 이상이어야 합니다.' 
      }, 400)
    }
    
    // 공고 수정
    await c.env.DB.prepare(`
      UPDATE jobs SET
        title = COALESCE(?, title),
        hourly_wage = COALESCE(?, hourly_wage),
        address = COALESCE(?, address),
        region = COALESCE(?, region),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        description = COALESCE(?, description),
        work_schedule = COALESCE(?, work_schedule),
        requirements = COALESCE(?, requirements),
        benefits = COALESCE(?, benefits),
        job_type = COALESCE(?, job_type),
        tags = COALESCE(?, tags),
        work_days = COALESCE(?, work_days),
        work_hours = COALESCE(?, work_hours),
        experience_times = COALESCE(?, experience_times),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title || null,
      hourly_wage || null,
      finalLocation || null,
      finalRegion || null,
      latitude || null,
      longitude || null,
      description || null,
      work_schedule || null,
      requirements || null,
      benefits || null,
      finalCategory || null,
      tags || null,
      work_days || null,
      work_hours || null,
      experience_times || null,
      status || null,
      jobId
    ).run()
    
    console.log('✅ 공고 수정 성공:', jobId)
    
    return c.json({
      success: true,
      message: '공고가 수정되었습니다.'
    })
    
  } catch (error: any) {
    console.error('공고 수정 오류:', error)
    return c.json({ success: false, error: '공고 수정 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 공고 삭제 (상태 변경)
// ========================================
app.delete('/:id', async (c) => {
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
    
    const jobId = c.req.param('id')
    
    // 공고 소유자 확인
    const job = await c.env.DB.prepare(`
      SELECT user_id FROM jobs WHERE id = ?
    `).bind(jobId).first<{ user_id: string }>()
    
    if (!job) {
      return c.json({ success: false, error: '공고를 찾을 수 없습니다.' }, 404)
    }
    
    if (job.user_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    // 공고 비활성화 (soft delete)
    await c.env.DB.prepare(`
      UPDATE jobs SET status = 'closed' WHERE id = ?
    `).bind(jobId).run()
    
    console.log('✅ 공고 삭제 성공:', jobId)
    
    return c.json({
      success: true,
      message: '공고가 삭제되었습니다.'
    })
    
  } catch (error: any) {
    console.error('공고 삭제 오류:', error)
    return c.json({ success: false, error: '공고 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 내 공고 목록 조회
// ========================================
app.get('/my/list', async (c) => {
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
    
    // 내 공고 목록 조회
    const jobs = await c.env.DB.prepare(`
      SELECT 
        id, title, company_name, hourly_wage, address as location,
        job_type as category, status, views, created_at
      FROM jobs
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(session.user_id).all()
    
    console.log('✅ 내 공고 목록 조회:', jobs.results?.length || 0, '건')
    
    return c.json({
      success: true,
      jobs: jobs.results || []
    })
    
  } catch (error: any) {
    console.error('내 공고 목록 조회 오류:', error)
    return c.json({ success: false, error: '내 공고 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// AI 추천 공고 (면접 결과 기반)
// ========================================
app.get('/recommended', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      // 비로그인 상태에서도 추천 가능 (localStorage 데이터 기반)
      // 하지만 DB 저장된 면접 결과 우선
      console.log('⚠️ 비로그인 상태 - localStorage 기반 추천')
    }
    
    let userId: string | null = null
    let interviewResult: any = null
    
    // 로그인 상태면 세션 확인 및 최근 면접 결과 조회
    if (token) {
      const session = await c.env.DB.prepare(`
        SELECT user_id FROM sessions WHERE session_token = ?
      `).bind(token).first()
      
      if (session) {
        userId = session.user_id as string
        
        // 가장 최근 면접 결과 조회
        interviewResult = await c.env.DB.prepare(`
          SELECT * FROM interview_results
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `).bind(userId).first()
        
        console.log('✅ 사용자 면접 결과 조회:', userId, interviewResult ? '있음' : '없음')
      }
    }
    
    // 면접 결과가 없으면 요청 파라미터 확인
    const { job_type, final_grade, total_score, region, min_wage } = c.req.query()
    
    if (!interviewResult && !job_type) {
      return c.json({ 
        success: false, 
        error: '면접 결과 또는 검색 조건이 필요합니다.',
        message: 'AI 면접을 먼저 완료하거나 검색 조건을 입력해주세요.'
      }, 400)
    }
    
    // 추천 기준 설정
    const targetJobType = interviewResult?.job_type || job_type
    const targetGrade = interviewResult?.final_grade || final_grade || 'C'
    const targetScore = interviewResult?.total_score || parseInt(total_score || '70')
    const targetRegion = region || ''
    const minWage = min_wage ? parseInt(min_wage) : 10030 // 2026년 최저시급
    
    console.log('🎯 추천 기준:', { targetJobType, targetGrade, targetScore, targetRegion, minWage })
    
    // 공고 조회 쿼리
    let sql = `
      SELECT 
        j.id,
        j.title,
        j.company_name,
        j.job_type as category,
        j.hourly_wage,
        j.address as location,
        j.region,
        j.description,
        j.work_hours,
        j.work_days,
        j.latitude,
        j.longitude,
        j.views,
        j.created_at,
        u.name as employer_name,
        j.user_id as employer_id
      FROM jobs j
      LEFT JOIN users u ON j.user_id = u.id
      WHERE j.status = 'active'
    `
    
    const params: any[] = []
    
    // 1. 직무 타입 일치 (필수)
    if (targetJobType) {
      sql += ` AND j.job_type = ?`
      params.push(targetJobType)
    }
    
    // 2. 최저시급 이상
    sql += ` AND j.hourly_wage >= ?`
    params.push(minWage)
    
    // 3. 지역 필터 (있으면)
    if (targetRegion) {
      sql += ` AND (j.address LIKE ? OR j.region LIKE ?)`
      params.push(`%${targetRegion}%`, `%${targetRegion}%`)
    }
    
    // 정렬: 급한공고 우선, 시급 높은 순
    sql += ` ORDER BY j.is_urgent DESC, j.hourly_wage DESC, j.created_at DESC LIMIT 20`
    
    const result = await c.env.DB.prepare(sql).bind(...params).all()
    
    const jobs = result.results || []
    
    console.log(`✅ 추천 공고 ${jobs.length}건 조회 완료`)
    
    // 매칭 점수 계산 (간단한 알고리즘)
    const jobsWithScore = jobs.map((job: any) => {
      let matchScore = 50 // 기본 점수
      
      // 1. 직무 타입 일치 (+30점)
      if (job.category === targetJobType) {
        matchScore += 30
      }
      
      // 2. 면접 등급에 따른 보너스
      const gradeBonus: any = { 'S': 20, 'A': 15, 'B': 10, 'C': 5, 'F': 0 }
      matchScore += gradeBonus[targetGrade] || 0
      
      // 3. 시급 보너스 (높을수록 +점수)
      const wageBonus = Math.min(20, Math.floor((job.hourly_wage - minWage) / 500))
      matchScore += wageBonus
      
      // 4. 지역 일치 보너스
      if (targetRegion && (job.location?.includes(targetRegion) || job.region?.includes(targetRegion))) {
        matchScore += 10
      }
      
      // 최대 100점
      matchScore = Math.min(100, matchScore)
      
      return {
        ...job,
        match_score: matchScore,
        match_reason: generateMatchReason(matchScore, job, interviewResult)
      }
    })
    
    // 매칭 점수 순으로 정렬
    jobsWithScore.sort((a, b) => b.match_score - a.match_score)
    
    return c.json({
      success: true,
      total: jobsWithScore.length,
      jobs: jobsWithScore.slice(0, 10), // 상위 10개
      matching_info: {
        job_type: targetJobType,
        grade: targetGrade,
        score: targetScore,
        criteria: '직무 일치도, 면접 등급, 시급, 지역 기반 매칭'
      }
    })
    
  } catch (error: any) {
    console.error('추천 공고 조회 오류:', error)
    return c.json({ success: false, error: '추천 공고 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 매칭 이유 생성 헬퍼 함수
function generateMatchReason(score: number, job: any, interviewResult: any): string {
  const reasons: string[] = []
  
  if (interviewResult?.job_type === job.category) {
    const jobTypeNames: any = {
      'cafe': '카페',
      'cvs': '편의점',
      'restaurant': '음식점',
      'retail': '매장/판매',
      'fastfood': '패스트푸드'
    }
    reasons.push(`${jobTypeNames[job.category] || job.category} 직무 경험과 일치`)
  }
  
  if (interviewResult?.final_grade && ['S', 'A'].includes(interviewResult.final_grade)) {
    reasons.push('높은 면접 등급으로 우수 매칭')
  }
  
  if (job.hourly_wage > 12000) {
    reasons.push(`높은 시급 (${job.hourly_wage.toLocaleString()}원)`)
  }
  
  if (interviewResult?.strengths && interviewResult.strengths.length > 0) {
    reasons.push('회원님의 강점과 부합')
  }
  
  if (score >= 90) {
    return '🎯 최고 매칭! ' + reasons.slice(0, 2).join(', ')
  } else if (score >= 75) {
    return '✨ 우수 매칭! ' + reasons.slice(0, 2).join(', ')
  } else if (score >= 60) {
    return '👍 좋은 매칭! ' + reasons.slice(0, 2).join(', ')
  } else {
    return '📌 적합한 공고 - ' + (reasons[0] || '기본 조건 충족')
  }
}

export const onRequest = handle(app)
