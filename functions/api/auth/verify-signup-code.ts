import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const { token, code } = await request.json();

    if (!token || !code) {
      return new Response(JSON.stringify({ error: '토큰과 인증번호를 입력해주세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 인증 정보 조회
    const verification = await env.DB.prepare(`
      SELECT * FROM phone_verifications
      WHERE code = ? AND type = 'signup' AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(code).first();

    if (!verification) {
      return new Response(JSON.stringify({ error: '잘못된 인증번호입니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 만료 시간 확인
    const expiresAt = new Date(verification.expires_at as string);
    const now = new Date();

    if (now > expiresAt) {
      return new Response(JSON.stringify({ error: '인증번호가 만료되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 인증 완료 처리
    await env.DB.prepare(`
      UPDATE phone_verifications
      SET used = 1
      WHERE id = ?
    `).bind(verification.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: '인증이 완료되었습니다.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('인증번호 확인 오류:', error);
    return new Response(JSON.stringify({ error: '인증번호 확인 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
