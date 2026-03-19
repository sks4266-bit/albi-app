// 관리자 로그인 API
import type { Env } from '../../../src/types/env';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const body = await request.json() as { username: string; password: string };
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, message: '아이디와 비밀번호를 입력해주세요.' }),
        { status: 400, headers }
      );
    }

    // 관리자 계정 하드코딩 (보안상 환경변수로 관리 권장)
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'albi2026!@';
    
    // 또는 DB에서 조회
    let adminUser = null;
    
    // 1. 하드코딩된 관리자 계정 확인
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      adminUser = {
        id: 'admin-master',
        username: ADMIN_USERNAME,
        name: '관리자',
        user_type: 'admin'
      };
    }
    
    // 2. DB에서 관리자 계정 확인 (선택사항)
    if (!adminUser) {
      const dbAdmin = await env.DB.prepare(
        `SELECT id, email, name, password, user_type 
         FROM users 
         WHERE email = ? AND user_type = 'admin'`
      )
        .bind(username)
        .first();

      if (dbAdmin && dbAdmin.password === await hashPassword(password)) {
        adminUser = {
          id: dbAdmin.id,
          username: dbAdmin.email,
          name: dbAdmin.name,
          user_type: dbAdmin.user_type
        };
      }
    }

    if (!adminUser) {
      return new Response(
        JSON.stringify({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
        { status: 401, headers }
      );
    }

    // 세션 ID 및 토큰 생성
    const sessionId = crypto.randomUUID();
    const sessionToken = generateToken();

    // 세션 저장 (DB에 저장하거나 메모리에만 저장)
    try {
      await env.DB.prepare(
        `INSERT INTO sessions (id, token, user_id, expires_at, created_at, last_active_at)
         VALUES (?, ?, ?, datetime('now', '+7 days'), datetime('now'), datetime('now'))
         ON CONFLICT(token) DO UPDATE SET
         user_id = excluded.user_id,
         expires_at = datetime('now', '+7 days'),
         last_active_at = datetime('now')`
      )
        .bind(sessionId, sessionToken, adminUser.id)
        .run();
    } catch (error) {
      console.error('세션 저장 오류:', error);
      // 세션 테이블이 없어도 토큰은 발급
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '로그인 성공',
        token: sessionToken,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          name: adminUser.name
        }
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
};

// 토큰 생성 함수
function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}

// 비밀번호 해시 함수 (Web Crypto API 사용)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
