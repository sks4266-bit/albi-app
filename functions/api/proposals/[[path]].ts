// 1시간 체험 제안 관리 API
import type { Env } from '../../../src/types/env';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/proposals', '');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

    const userId = session.user_id as string;

    // 라우팅
    if (path === '/my' && request.method === 'GET') {
      // 내가 받은 제안 목록 (구직자)
      return await getMyProposals(env, userId, headers);
    } else if (path === '/sent' && request.method === 'GET') {
      // 내가 보낸 제안 목록 (구인자)
      return await getSentProposals(env, userId, headers);
    } else if (path.match(/^\/\w+\/accept$/) && request.method === 'PUT') {
      // 제안 수락
      const proposalId = path.split('/')[1];
      return await acceptProposal(env, userId, proposalId, headers);
    } else if (path.match(/^\/\w+\/reject$/) && request.method === 'PUT') {
      // 제안 거절
      const proposalId = path.split('/')[1];
      return await rejectProposal(env, userId, proposalId, headers);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: '잘못된 요청입니다.' }),
        { status: 404, headers }
      );
    }
  } catch (error) {
    console.error('Proposals API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
};

// 내가 받은 제안 목록 (구직자)
async function getMyProposals(
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const proposals = await env.DB.prepare(
      `SELECT 
        ip.*,
        u.name as employer_name,
        u.phone as employer_phone,
        u.email as employer_email
       FROM interview_proposals ip
       LEFT JOIN users u ON ip.employer_id = u.id
       WHERE ip.jobseeker_id = ?
       ORDER BY ip.created_at DESC
       LIMIT 50`
    )
      .bind(userId)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        proposals: proposals.results || []
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('내 제안 목록 조회 오류:', error);
    return new Response(
      JSON.stringify({ success: false, error: '제안 목록 조회 중 오류가 발생했습니다.' }),
      { status: 500, headers }
    );
  }
}

// 내가 보낸 제안 목록 (구인자)
async function getSentProposals(
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const proposals = await env.DB.prepare(
      `SELECT 
        ip.*,
        u.name as jobseeker_name,
        u.phone as jobseeker_phone,
        u.email as jobseeker_email
       FROM interview_proposals ip
       LEFT JOIN users u ON ip.jobseeker_id = u.id
       WHERE ip.employer_id = ?
       ORDER BY ip.created_at DESC
       LIMIT 50`
    )
      .bind(userId)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        proposals: proposals.results || []
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('보낸 제안 목록 조회 오류:', error);
    return new Response(
      JSON.stringify({ success: false, error: '제안 목록 조회 중 오류가 발생했습니다.' }),
      { status: 500, headers }
    );
  }
}

// 제안 수락
async function acceptProposal(
  env: Env,
  userId: string,
  proposalId: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    // 제안 확인
    const proposal = await env.DB.prepare(
      `SELECT * FROM interview_proposals WHERE id = ? AND jobseeker_id = ?`
    )
      .bind(proposalId, userId)
      .first();

    if (!proposal) {
      return new Response(
        JSON.stringify({ success: false, error: '제안을 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    if (proposal.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: '이미 처리된 제안입니다.' }),
        { status: 400, headers }
      );
    }

    // 제안 수락 처리
    await env.DB.prepare(
      `UPDATE interview_proposals 
       SET status = 'accepted', responded_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(proposalId)
      .run();

    // 구인자 정보 조회 (연락처 공유)
    const employer = await env.DB.prepare(
      `SELECT name, phone, email FROM users WHERE id = ?`
    )
      .bind(proposal.employer_id)
      .first();

    // 구인자에게 알림 발송
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await env.DB.prepare(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, data, created_at
      ) VALUES (?, ?, 'proposal_accepted', '체험 제안 수락!', ?, '/mypage', ?, datetime('now'))`
    )
      .bind(
        notificationId,
        proposal.employer_id,
        `구직자가 1시간 체험 제안을 수락했습니다! 연락처가 공유되었습니다.`,
        JSON.stringify({ proposal_id: proposalId, jobseeker_id: userId })
      )
      .run();

    console.log('✅ 제안 수락:', proposalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: '체험 제안을 수락했습니다! 구인자 연락처가 공유되었습니다.',
        employer_contact: {
          name: employer?.name,
          phone: employer?.phone,
          email: employer?.email
        }
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('제안 수락 오류:', error);
    return new Response(
      JSON.stringify({ success: false, error: '제안 수락 중 오류가 발생했습니다.' }),
      { status: 500, headers }
    );
  }
}

// 제안 거절
async function rejectProposal(
  env: Env,
  userId: string,
  proposalId: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    // 제안 확인
    const proposal = await env.DB.prepare(
      `SELECT * FROM interview_proposals WHERE id = ? AND jobseeker_id = ?`
    )
      .bind(proposalId, userId)
      .first();

    if (!proposal) {
      return new Response(
        JSON.stringify({ success: false, error: '제안을 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    if (proposal.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: '이미 처리된 제안입니다.' }),
        { status: 400, headers }
      );
    }

    // 제안 거절 처리
    await env.DB.prepare(
      `UPDATE interview_proposals 
       SET status = 'rejected', responded_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(proposalId)
      .run();

    // 구인자에게 알림 발송
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await env.DB.prepare(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, data, created_at
      ) VALUES (?, ?, 'proposal_rejected', '체험 제안 거절', ?, '/mypage', ?, datetime('now'))`
    )
      .bind(
        notificationId,
        proposal.employer_id,
        `구직자가 1시간 체험 제안을 거절했습니다.`,
        JSON.stringify({ proposal_id: proposalId, jobseeker_id: userId })
      )
      .run();

    console.log('✅ 제안 거절:', proposalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: '체험 제안을 거절했습니다.'
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('제안 거절 오류:', error);
    return new Response(
      JSON.stringify({ success: false, error: '제안 거절 중 오류가 발생했습니다.' }),
      { status: 500, headers }
    );
  }
}
