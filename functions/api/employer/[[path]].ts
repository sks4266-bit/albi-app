// 구인자 전용 API - 지원자 관리
import type { Env } from '../../../src/types/env';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/employer', '');

  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // 인증 확인
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: '인증이 필요합니다.' }), {
      status: 401,
      headers,
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 토큰 검증
    const session = await env.DB.prepare(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')`
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ success: false, message: '유효하지 않은 세션입니다.' }), {
        status: 401,
        headers,
      });
    }

    const userId = session.user_id as string;

    // 구인자인지 확인
    const user = await env.DB.prepare(`SELECT user_type FROM users WHERE id = ?`)
      .bind(userId)
      .first();

    if (user?.user_type !== 'employer') {
      return new Response(JSON.stringify({ success: false, message: '구인자만 접근할 수 있습니다.' }), {
        status: 403,
        headers,
      });
    }

    // 라우팅
    if (path === '/applications' && request.method === 'GET') {
      return await handleGetApplications(request, env, userId, headers);
    } else if (path.match(/^\/applications\/[^/]+\/request-experience$/) && request.method === 'POST') {
      const applicationId = path.split('/')[2];
      return await handleRequestExperience(request, env, userId, applicationId, headers);
    } else if (path.match(/^\/applications\/[^/]+\/reject$/) && request.method === 'POST') {
      const applicationId = path.split('/')[2];
      return await handleRejectApplication(request, env, userId, applicationId, headers);
    } else {
      return new Response(JSON.stringify({ success: false, message: '잘못된 요청입니다.' }), {
        status: 404,
        headers,
      });
    }
  } catch (error) {
    console.error('Employer API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
};

// 지원자 목록 조회
async function handleGetApplications(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const jobId = url.searchParams.get('jobId') || '';
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      ja.*,
      j.title as job_title, j.location as job_location, j.hourly_wage as job_wage,
      u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
      ip.final_score as ai_score
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN users u ON ja.user_id = u.id
    LEFT JOIN interview_proposals ip ON ja.user_id = ip.user_id AND ja.job_id = ip.job_id
    WHERE j.user_id = ?
  `;
  const params: any[] = [userId];

  if (status) {
    query += ` AND ja.status = ?`;
    params.push(status);
  }

  if (jobId) {
    query += ` AND ja.job_id = ?`;
    params.push(jobId);
  }

  if (search) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY ja.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const applications = await env.DB.prepare(query).bind(...params).all();

  // 총 개수 조회
  let countQuery = `
    SELECT COUNT(*) as count
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN users u ON ja.user_id = u.id
    WHERE j.user_id = ?
  `;
  const countParams: any[] = [userId];

  if (status) {
    countQuery += ` AND ja.status = ?`;
    countParams.push(status);
  }

  if (jobId) {
    countQuery += ` AND ja.job_id = ?`;
    countParams.push(jobId);
  }

  if (search) {
    countQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }

  const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
  const total = (totalResult?.count as number) || 0;

  return new Response(
    JSON.stringify({
      success: true,
      applications: applications.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
    { headers }
  );
}

// 1시간 체험 신청
async function handleRequestExperience(
  request: Request,
  env: Env,
  userId: string,
  applicationId: string,
  headers: Record<string, string>
): Promise<Response> {
  // 1. 지원 정보 확인
  const application = await env.DB.prepare(
    `SELECT ja.*, j.user_id as employer_id, j.title as job_title
     FROM job_applications ja
     LEFT JOIN jobs j ON ja.job_id = j.id
     WHERE ja.id = ? AND j.user_id = ?`
  )
    .bind(applicationId, userId)
    .first();

  if (!application) {
    return new Response(JSON.stringify({ success: false, message: '지원 정보를 찾을 수 없습니다.' }), {
      status: 404,
      headers,
    });
  }

  if (application.status !== 'pending') {
    return new Response(JSON.stringify({ success: false, message: '이미 처리된 지원입니다.' }), {
      status: 400,
      headers,
    });
  }

  // 2. 상태 업데이트
  await env.DB.prepare(
    `UPDATE job_applications 
     SET status = 'experience_requested', updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(applicationId)
    .run();

  // 3. 구직자에게 알림 전송
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
     VALUES (?, ?, 'experience_requested', '1시간 체험 신청이 왔습니다 🎉', 
             ?, '/my-experiences.html', datetime('now'))`
  )
    .bind(
      notificationId,
      application.user_id,
      `${application.job_title} 공고의 사장님이 1시간 체험을 신청하셨습니다. 일정을 확인하고 응답해주세요.`
    )
    .run();

  return new Response(
    JSON.stringify({
      success: true,
      message: '1시간 체험 신청이 완료되었습니다.',
    }),
    { headers }
  );
}

// 불합격 처리
async function handleRejectApplication(
  request: Request,
  env: Env,
  userId: string,
  applicationId: string,
  headers: Record<string, string>
): Promise<Response> {
  // 1. 지원 정보 확인
  const application = await env.DB.prepare(
    `SELECT ja.*, j.user_id as employer_id, j.title as job_title
     FROM job_applications ja
     LEFT JOIN jobs j ON ja.job_id = j.id
     WHERE ja.id = ? AND j.user_id = ?`
  )
    .bind(applicationId, userId)
    .first();

  if (!application) {
    return new Response(JSON.stringify({ success: false, message: '지원 정보를 찾을 수 없습니다.' }), {
      status: 404,
      headers,
    });
  }

  if (application.status === 'hired' || application.status === 'rejected') {
    return new Response(JSON.stringify({ success: false, message: '이미 처리된 지원입니다.' }), {
      status: 400,
      headers,
    });
  }

  // 2. 상태 업데이트
  await env.DB.prepare(
    `UPDATE job_applications 
     SET status = 'rejected', updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(applicationId)
    .run();

  // 3. 구직자에게 알림 전송
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
     VALUES (?, ?, 'application_rejected', '지원 결과 안내', 
             ?, '/mypage', datetime('now'))`
  )
    .bind(
      notificationId,
      application.user_id,
      `${application.job_title} 공고에 대한 지원이 불합격 처리되었습니다. 다른 좋은 기회를 찾아보세요!`
    )
    .run();

  return new Response(
    JSON.stringify({
      success: true,
      message: '불합격 처리되었습니다.',
    }),
    { headers }
  );
}
