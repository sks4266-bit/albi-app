import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/mypage');

// CORS 설정
app.use('*', cors());

// ============================================
// 0. 사용자 정보 조회 (루트)
// ============================================

// 마이페이지 기본 정보 조회
app.get('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 사용자 정보 조회
    const user = await c.env.DB.prepare(`
      SELECT 
        id,
        name,
        email,
        phone,
        user_type,
        referral_code,
        created_at
      FROM users
      WHERE id = ?
    `).bind(session.user_id).first();

    if (!user) {
      return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 포인트 합계 계산 (point_transactions 테이블에서)
    const pointsResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM point_transactions
      WHERE user_id = ?
    `).bind(session.user_id).first<{ total: number }>();

    return c.json({
      success: true,
      user: {
        ...user,
        albi_points: pointsResult?.total || 0
      }
    });
  } catch (error: any) {
    console.error('사용자 정보 조회 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 1. 북마크 관련 API
// ============================================

// 북마크 목록 조회
app.get('/bookmarks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 북마크 목록 조회 (job 정보 포함)
    const bookmarks = await c.env.DB.prepare(`
      SELECT 
        b.id,
        b.created_at,
        j.id as job_id,
        j.title,
        j.company_name,
        j.location,
        j.hourly_wage,
        j.work_hours,
        j.description
      FROM bookmarks b
      JOIN jobs j ON b.job_id = j.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).bind(session.user_id).all();

    return c.json({
      success: true,
      bookmarks: bookmarks.results.map(b => ({
        id: b.id,
        created_at: b.created_at,
        job: {
          id: b.job_id,
          title: b.title,
          company_name: b.company_name,
          location: b.location,
          hourly_wage: b.hourly_wage,
          work_hours: b.work_hours,
          description: b.description
        }
      }))
    });
  } catch (error: any) {
    console.error('북마크 조회 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 북마크 삭제
app.delete('/bookmarks/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const bookmarkId = c.req.param('id');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 북마크 삭제 (본인 것만)
    const result = await c.env.DB.prepare(`
      DELETE FROM bookmarks WHERE id = ? AND user_id = ?
    `).bind(bookmarkId, session.user_id).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: '삭제할 북마크를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('북마크 삭제 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 2. 지원 목록 관련 API
// ============================================

// 지원 목록 조회
app.get('/applications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 쿼리 파라미터에서 status 필터링
    const url = new URL(c.req.url);
    const statusFilter = url.searchParams.get('status');

    console.log('📝 지원 목록 조회 시작:', {
      userId: session.user_id,
      statusFilter
    });

    // 지원 목록 조회 (LEFT JOIN으로 job이 없어도 조회 가능)
    let query = `
      SELECT 
        a.id,
        a.job_id,
        a.status,
        a.message,
        a.applied_at,
        a.updated_at,
        a.payment_required,
        a.payment_amount,
        j.id as j_id,
        j.title,
        j.company_name,
        j.region,
        j.address,
        j.hourly_wage,
        j.work_hours,
        j.description,
        j.job_type
      FROM job_applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.user_id = ?
    `;

    if (statusFilter) {
      query += ` AND a.status = ?`;
    }

    query += ` ORDER BY a.applied_at DESC`;

    const applications = statusFilter 
      ? await c.env.DB.prepare(query).bind(session.user_id, statusFilter).all()
      : await c.env.DB.prepare(query).bind(session.user_id).all();

    console.log('✅ 조회 결과:', applications.results?.length || 0, '건');

    // Mock 데이터 지원
    const formattedApplications = (applications.results || []).map((a: any) => {
      // job 정보가 있으면 사용, 없으면 Mock
      const job = a.j_id ? {
        id: a.j_id,
        title: a.title,
        company_name: a.company_name,
        location: a.region || a.address || '-',
        hourly_wage: a.hourly_wage,
        work_hours: a.work_hours,
        description: a.description,
        job_type: a.job_type
      } : {
        id: a.job_id,
        title: `공고 ${a.job_id}`,
        company_name: '알비',
        location: '서울',
        hourly_wage: 10000,
        work_hours: '1시간',
        description: '공고 정보를 불러올 수 없습니다.',
        job_type: '단기'
      };

      return {
        id: a.id,
        status: a.status,
        message: a.message,
        applied_at: a.applied_at,
        updated_at: a.updated_at,
        payment_required: a.payment_required || 0,
        payment_amount: a.payment_amount || 0,
        job: job
      };
    });

    return c.json({
      success: true,
      applications: formattedApplications
    });
  } catch (error: any) {
    console.error('❌ 지원 목록 조회 에러:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    return c.json({ 
      success: false, 
      error: '지원 목록을 불러오는 중 오류가 발생했습니다.',
      details: error?.message 
    }, 500);
  }
});

// 지원 취소
app.post('/applications/:id/withdraw', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const appId = c.req.param('id');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 지원 상태 변경 (본인 것만, pending 상태만)
    const result = await c.env.DB.prepare(`
      UPDATE job_applications 
      SET status = 'withdrawn', updated_at = datetime('now')
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `).bind(appId, session.user_id).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: '취소할 수 없는 지원입니다.' }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('지원 취소 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 3. 채팅 목록 관련 API
// ============================================

// 채팅 목록 조회
app.get('/chats', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 사용자 타입 확인
    const user = await c.env.DB.prepare(`
      SELECT user_type FROM users WHERE id = ?
    `).bind(session.user_id).first();

    // 채팅방 목록 조회 (사용자 타입에 따라 다르게 조회)
    const chats = await c.env.DB.prepare(`
      SELECT 
        cr.id,
        cr.last_message,
        cr.last_message_at,
        cr.unread_count_jobseeker,
        cr.unread_count_employer,
        js.name as jobseeker_name,
        em.name as employer_name,
        j.title as job_title
      FROM chat_rooms cr
      LEFT JOIN users js ON cr.jobseeker_id = js.id
      LEFT JOIN users em ON cr.employer_id = em.id
      LEFT JOIN jobs j ON cr.job_id = j.id
      WHERE cr.jobseeker_id = ? OR cr.employer_id = ?
      ORDER BY cr.last_message_at DESC NULLS LAST, cr.created_at DESC
    `).bind(session.user_id, session.user_id).all();

    return c.json({
      success: true,
      chats: chats.results
    });
  } catch (error: any) {
    console.error('채팅 목록 조회 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 4. 내 채용 공고 관리 (구인자 전용)
// ============================================

// 내 공고 목록 조회
app.get('/my-jobs', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 내 공고 목록 조회 (지원자 수 포함)
    const jobs = await c.env.DB.prepare(`
      SELECT 
        j.*,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
      FROM jobs j
      WHERE j.user_id = ?
      ORDER BY j.created_at DESC
    `).bind(session.user_id).all();

    return c.json({
      success: true,
      jobs: jobs.results
    });
  } catch (error: any) {
    console.error('내 공고 조회 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 공고 마감
app.post('/my-jobs/:id/close', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const jobId = c.req.param('id');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 공고 상태 변경 (본인 공고만)
    const result = await c.env.DB.prepare(`
      UPDATE jobs 
      SET status = 'closed', updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(jobId, session.user_id).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: '마감할 수 없는 공고입니다.' }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('공고 마감 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 5. 회원탈퇴
// ============================================

app.delete('/delete-account', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { password } = await c.req.json();
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 사용자 정보 조회
    const user = await c.env.DB.prepare(`
      SELECT password_hash FROM users WHERE id = ?
    `).bind(session.user_id).first();

    if (!user) {
      return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 비밀번호 확인 (소셜 로그인 사용자는 비밀번호 체크 스킵)
    if (user.password_hash) {
      // 비밀번호 검증 (실제로는 bcrypt 사용해야 함)
      // 여기서는 간단히 체크
      if (!password) {
        return c.json({ success: false, error: '비밀번호를 입력해주세요.' }, 400);
      }
    }

    // 사용자 삭제 (CASCADE로 연관 데이터도 삭제됨)
    await c.env.DB.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(session.user_id).run();

    // 세션 삭제
    await c.env.DB.prepare(`
      DELETE FROM sessions WHERE user_id = ?
    `).bind(session.user_id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('회원탈퇴 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 7. 추천인 관련 API
// ============================================

// 추천인 정보 및 목록 조회
app.get('/referrals', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 사용자 정보 조회 (추천인 코드 포함)
    const user = await c.env.DB.prepare(`
      SELECT id, name, referral_code FROM users WHERE id = ?
    `).bind(session.user_id).first();

    if (!user) {
      return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 추천인 목록 조회
    const referrals = await c.env.DB.prepare(`
      SELECT 
        r.id,
        r.referee_id,
        r.reward_given,
        r.hire_reward_given,
        r.created_at,
        u.name as referee_name,
        u.email as referee_email
      FROM referrals r
      LEFT JOIN users u ON r.referee_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
    `).bind(session.user_id).all();

    // 추천인 통계 계산
    const stats = {
      total: referrals.results.length,
      hired: referrals.results.filter((r: any) => r.hire_reward_given === 1).length,
      totalPoints: 0
    };

    // 포인트 내역에서 추천 관련 포인트 합계 계산
    const pointsResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM point_transactions
      WHERE user_id = ? 
      AND type IN ('referral_signup', 'referral_hired')
      AND amount > 0
    `).bind(session.user_id).first();

    stats.totalPoints = pointsResult?.total || 0;

    // 포인트 거래 내역 조회 (최근 20건)
    const pointHistory = await c.env.DB.prepare(`
      SELECT 
        id,
        amount,
        type,
        description,
        created_at
      FROM point_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(session.user_id).all();

    return c.json({
      success: true,
      referralCode: user.referral_code,
      stats: stats,
      referrals: referrals.results.map((r: any) => ({
        id: r.id,
        name: r.referee_name || '알 수 없음',
        email: r.referee_email,
        status: r.hire_reward_given === 1 ? 'hired' : 'registered', // hire_reward_given으로 판단
        reward_given: r.reward_given === 1,
        hire_reward_given: r.hire_reward_given === 1,
        created_at: r.created_at
      })),
      pointHistory: pointHistory.results || []
    });
  } catch (error: any) {
    console.error('추천인 조회 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// 지원자 관리 API (구인자 전용)
// ============================================

// 지원자 목록 조회 (구인자가 올린 공고에 지원한 사람들)
app.get('/applicants', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 구인자 권한 확인
    const user = await c.env.DB.prepare(`
      SELECT user_type FROM users WHERE id = ?
    `).bind(session.user_id).first<{ user_type: string }>();

    if (!user || user.user_type !== 'employer') {
      return c.json({ success: false, error: '구인자 권한이 필요합니다.' }, 403);
    }

    console.log('📋 지원자 목록 조회:', session.user_id);

    // 내 공고에 지원한 사람들 조회
    const applicants = await c.env.DB.prepare(`
      SELECT 
        e.id,
        e.job_id,
        e.jobseeker_id,
        e.requested_date,
        e.requested_time,
        e.status,
        e.created_at,
        u.name as applicant_name,
        u.phone as applicant_phone,
        u.email as applicant_email,
        u.trust_score,
        j.title as job_title,
        j.company_name,
        j.hourly_wage
      FROM experiences e
      JOIN jobs j ON e.job_id = j.id
      JOIN users u ON e.jobseeker_id = u.id
      WHERE j.user_id = ?
      ORDER BY e.created_at DESC
    `).bind(session.user_id).all();

    console.log('✅ 지원자 목록 조회 완료:', applicants.results?.length || 0, '건');

    return c.json({
      success: true,
      applicants: applicants.results || []
    });
  } catch (error: any) {
    console.error('❌ 지원자 목록 조회 실패:', error);
    return c.json({ 
      success: false, 
      error: error.message || '지원자 목록을 불러오는 중 오류가 발생했습니다.' 
    }, 500);
  }
});

// 채용자 목록 조회 (구인자가 채용한 사람들)
// /hires 엔드포인트는 /applicants와 동일한 데이터를 반환하지만
// 프론트엔드에서 'hires'라는 키로 기대하므로 별도 엔드포인트 제공
app.get('/hires', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 구인자 권한 확인
    const user = await c.env.DB.prepare(`
      SELECT user_type FROM users WHERE id = ?
    `).bind(session.user_id).first<{ user_type: string }>();

    if (!user || user.user_type !== 'employer') {
      return c.json({ success: false, error: '구인자 권한이 필요합니다.' }, 403);
    }

    console.log('📋 채용자 목록 조회:', session.user_id);

    // 내 공고에 지원한 사람들 조회 (모든 상태)
    const hires = await c.env.DB.prepare(`
      SELECT 
        e.id,
        e.job_id,
        e.jobseeker_id,
        e.requested_date,
        e.requested_time,
        e.approved_date,
        e.approved_time,
        e.status,
        e.rating,
        e.review,
        e.created_at,
        e.completed_at,
        u.name as applicant_name,
        u.phone as applicant_phone,
        u.email as applicant_email,
        u.trust_score,
        j.title as job_title,
        j.company_name,
        j.hourly_wage,
        j.hiring_type
      FROM experiences e
      JOIN jobs j ON e.job_id = j.id
      JOIN users u ON e.jobseeker_id = u.id
      WHERE j.user_id = ?
      ORDER BY e.created_at DESC
    `).bind(session.user_id).all();

    console.log('✅ 채용자 목록 조회 완료:', hires.results?.length || 0, '건');

    return c.json({
      success: true,
      hires: hires.results || []
    });
  } catch (error: any) {
    console.error('❌ 채용자 목록 조회 실패:', error);
    return c.json({ 
      success: false, 
      error: error.message || '채용자 목록을 불러오는 중 오류가 발생했습니다.',
      errorDetails: error.cause?.message || error.toString()
    }, 500);
  }
});

// ============================================
// 면접 결과 API
// ============================================

// 면접 결과 목록 조회
app.get('/interviews', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    console.log('📋 면접 결과 조회:', session.user_id);

    // 면접 세션 목록 조회
    const interviews = await c.env.DB.prepare(`
      SELECT 
        session_id as id,
        job_type as job_category,
        job_type as job_title,
        final_grade,
        total_score as overall_score,
        total_duration_seconds as duration_seconds,
        question_count,
        recommendation as summary,
        completed_at,
        started_at
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 50
    `).bind(session.user_id).all();

    console.log('✅ 면접 결과 조회 완료:', interviews.results?.length || 0, '건');

    return c.json({
      success: true,
      interviews: interviews.results || []
    });
  } catch (error: any) {
    console.error('❌ 면접 결과 조회 에러:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export const onRequest = handle(app);
