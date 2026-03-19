// 구인자 → 구직자 1시간 체험 제안 API
import type { Env } from '../../../src/types/env';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다.' }),
        { status: 401, headers }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 세션 확인
    const session = await env.DB.prepare(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')`
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 세션입니다.' }),
        { status: 401, headers }
      );
    }

    const employerId = session.user_id as string;

    // 요청 데이터 파싱
    const body = await request.json() as {
      jobseekerId: string;
      matchScore: number;
      jobseekerGrade: string;
      jobseekerScore: number;
      employerRequirementId: string;
      message: string;
      proposedDate?: string;
      proposedTime?: string;
      hourlyWage?: number;
    };

    const {
      jobseekerId,
      matchScore,
      jobseekerGrade,
      jobseekerScore,
      employerRequirementId,
      message,
      proposedDate,
      proposedTime,
      hourlyWage
    } = body;

    if (!jobseekerId) {
      return new Response(
        JSON.stringify({ success: false, error: '구직자 ID가 필요합니다.' }),
        { status: 400, headers }
      );
    }

    // 구인자 정보 확인
    const employer = await env.DB.prepare(
      `SELECT name, phone, email FROM users WHERE id = ? AND user_type = 'employer'`
    )
      .bind(employerId)
      .first();

    if (!employer) {
      return new Response(
        JSON.stringify({ success: false, error: '구인자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    // 구직자 정보 확인
    const jobseeker = await env.DB.prepare(
      `SELECT name, phone, email FROM users WHERE id = ?`
    )
      .bind(jobseekerId)
      .first();

    if (!jobseeker) {
      return new Response(
        JSON.stringify({ success: false, error: '구직자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    // 중복 제안 확인 (24시간 이내)
    const existingProposal = await env.DB.prepare(
      `SELECT id FROM interview_proposals 
       WHERE employer_id = ? AND jobseeker_id = ? 
       AND status = 'pending'
       AND created_at > datetime('now', '-1 day')`
    )
      .bind(employerId, jobseekerId)
      .first();

    if (existingProposal) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '이미 해당 구직자에게 제안을 보냈습니다. 24시간 후 다시 시도해주세요.'
        }),
        { status: 400, headers }
      );
    }

    // 제안 ID 생성
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 제안 생성
    await env.DB.prepare(
      `INSERT INTO interview_proposals (
        id, employer_id, jobseeker_id, employer_requirement_id,
        message, match_score, jobseeker_grade, jobseeker_score,
        proposed_date, proposed_time, proposed_wage,
        status, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+7 days'), datetime('now'))`
    )
      .bind(
        proposalId,
        employerId,
        jobseekerId,
        employerRequirementId || null,
        message || '1시간 체험 제안을 드립니다!',
        matchScore || 0,
        jobseekerGrade || 'C',
        jobseekerScore || 0,
        proposedDate || null,
        proposedTime || null,
        hourlyWage || null
      )
      .run();

    // 구직자에게 알림 발송
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await env.DB.prepare(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, data, created_at
      ) VALUES (?, ?, 'proposal', '새로운 1시간 체험 제안', ?, '/mypage', ?, datetime('now'))`
    )
      .bind(
        notificationId,
        jobseekerId,
        `${employer.name || '사장님'}께서 1시간 체험을 제안하셨습니다! 지금 확인해보세요.`,
        JSON.stringify({ proposal_id: proposalId, employer_id: employerId })
      )
      .run();

    console.log('✅ 1시간 체험 제안 전송:', proposalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: '1시간 체험 제안이 전송되었습니다!',
        proposalId
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('1시간 체험 제안 전송 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: '1시간 체험 제안 전송 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
