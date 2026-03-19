// 사용자 관련 API
import type { Env } from '../../../src/types/env';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/users', '');

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
    return new Response(
      JSON.stringify({ success: false, message: '인증이 필요합니다.' }),
      { status: 401, headers }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 토큰 검증
    const session = await env.DB.prepare(
      `SELECT users.id, users.user_type 
       FROM sessions 
       JOIN users ON sessions.user_id = users.id
       WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, message: '유효하지 않은 세션입니다.' }),
        { status: 401, headers }
      );
    }

    const userId = session.id as string;

    // 라우팅
    if (path === '/referrer' && request.method === 'GET') {
      return await handleGetReferrer(env, headers, userId);
    } else if (path === '/referral/submit' && request.method === 'POST') {
      return await handleSubmitReferralCode(request, env, headers, userId);
    } else {
      return new Response(
        JSON.stringify({ success: false, message: '잘못된 요청입니다.' }),
        { status: 404, headers }
      );
    }
  } catch (error) {
    console.error('Users API Error:', error);
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

// 추천인 정보 조회
async function handleGetReferrer(
  env: Env,
  headers: Record<string, string>,
  userId: string
): Promise<Response> {
  try {
    // 사용자의 추천인 정보 조회
    const user = await env.DB.prepare(
      `SELECT referred_by FROM users WHERE id = ?`
    )
      .bind(userId)
      .first();

    if (!user || !user.referred_by) {
      return new Response(
        JSON.stringify({ success: true, referrer: null }),
        { headers }
      );
    }

    // 추천인 정보 조회
    const referrer = await env.DB.prepare(
      `SELECT id, name, email FROM users WHERE id = ?`
    )
      .bind(user.referred_by)
      .first();

    if (!referrer) {
      return new Response(
        JSON.stringify({ success: true, referrer: null }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        referrer: {
          id: referrer.id,
          name: referrer.name,
          email: referrer.email,
        },
      }),
      { headers }
    );
  } catch (error: any) {
    console.error('❌ Get referrer error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    return new Response(
      JSON.stringify({
        success: false,
        message: '추천인 정보 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 초대코드 제출
async function handleSubmitReferralCode(
  request: Request,
  env: Env,
  headers: Record<string, string>,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code || referral_code.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, message: '초대코드를 입력해주세요.' }),
        { status: 400, headers }
      );
    }

    const code = referral_code.trim().toUpperCase();

    // 1. 이미 추천인이 설정되어 있는지 확인
    const currentUser = await env.DB.prepare(
      `SELECT referred_by FROM users WHERE id = ?`
    )
      .bind(userId)
      .first();

    if (currentUser?.referred_by) {
      return new Response(
        JSON.stringify({ success: false, message: '이미 초대코드가 등록되어 있습니다.' }),
        { status: 400, headers }
      );
    }

    // 2. 초대코드로 추천인 찾기
    const referrer = await env.DB.prepare(
      `SELECT id, name, referral_code FROM users WHERE referral_code = ?`
    )
      .bind(code)
      .first();

    if (!referrer) {
      return new Response(
        JSON.stringify({ success: false, message: '유효하지 않은 초대코드입니다.' }),
        { status: 404, headers }
      );
    }

    // 3. 자기 자신의 코드인지 확인
    if (referrer.id === userId) {
      return new Response(
        JSON.stringify({ success: false, message: '자신의 초대코드는 사용할 수 없습니다.' }),
        { status: 400, headers }
      );
    }

    // 4. 추천인 설정
    await env.DB.prepare(
      `UPDATE users SET referred_by = ?, updated_at = datetime('now') WHERE id = ?`
    )
      .bind(referrer.id, userId)
      .run();

    // 5. 포인트 지급 (피추천인에게 20P)
    await env.DB.prepare(
      `INSERT INTO point_transactions (user_id, points, type, description, created_at)
       VALUES (?, 20, 'referral_bonus', ?, datetime('now'))`
    )
      .bind(userId, `친구 초대코드 입력 보너스 (추천인: ${referrer.name})`)
      .run();

    // 6. 포인트 잔액 업데이트
    await env.DB.prepare(
      `UPDATE users SET points = points + 20 WHERE id = ?`
    )
      .bind(userId)
      .run();

    // 7. 추천인에게도 포인트 지급 (30P)
    await env.DB.prepare(
      `INSERT INTO point_transactions (user_id, points, type, description, created_at)
       VALUES (?, 30, 'referral_reward', ?, datetime('now'))`
    )
      .bind(referrer.id, `친구 초대 보상 (추천받은 친구가 코드 입력함)`)
      .run();

    await env.DB.prepare(
      `UPDATE users SET points = points + 30 WHERE id = ?`
    )
      .bind(referrer.id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '초대코드가 등록되었습니다. 20P가 지급되었습니다!',
        referrer_name: referrer.name,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Submit referral code error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '초대코드 등록 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}
