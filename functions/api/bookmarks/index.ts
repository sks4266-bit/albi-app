/**
 * 북마크 API - 메인 엔드포인트
 * POST /api/bookmarks - 북마크 추가
 */

import type { Env } from '../../../src/types/env';

// 세션 검증 헬퍼
async function validateSession(db: D1Database, token: string): Promise<{ valid: boolean; userId?: string }> {
  if (!token) return { valid: false };

  try {
    const result = await db.prepare(`
      SELECT user_id FROM sessions 
      WHERE token = ? AND expires_at > datetime('now')
      LIMIT 1
    `).bind(token).first();

    if (!result) return { valid: false };
    return { valid: true, userId: result.user_id as string };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false };
  }
}

// POST /api/bookmarks - 북마크 추가
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  console.log('🔖 POST /api/bookmarks 요청 수신');

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: '로그인이 필요합니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const session = await validateSession(DB, token);
  if (!session.valid || !session.userId) {
    return new Response(JSON.stringify({ success: false, error: '유효하지 않은 세션입니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await context.request.json() as { job_id: string };
    const { job_id } = body;

    console.log('🔖 북마크 추가 요청:', { userId: session.userId, job_id });

    if (!job_id) {
      console.error('❌ job_id 누락');
      return new Response(JSON.stringify({ success: false, error: '공고 ID가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 이미 북마크 존재 여부 확인
    const existing = await DB.prepare(`
      SELECT id FROM bookmarks 
      WHERE user_id = ? AND job_id = ?
    `).bind(session.userId, job_id).first();

    if (existing) {
      console.log('⚠️ 이미 북마크 존재:', existing);
      return new Response(JSON.stringify({ success: false, error: '이미 관심 공고에 추가되어 있습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 북마크 추가
    const result = await DB.prepare(`
      INSERT INTO bookmarks (user_id, job_id, created_at)
      VALUES (?, ?, datetime('now'))
    `).bind(session.userId, job_id).run();

    console.log('✅ 북마크 추가 성공:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: '관심 공고에 추가되었습니다.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Add bookmark error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `북마크 추가 중 오류: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/bookmarks - 북마크 삭제 (job_id로)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // URL에서 job_id 추출
  const url = new URL(context.request.url);
  const job_id = url.searchParams.get('job_id');

  console.log('🗑️ DELETE /api/bookmarks 요청 수신:', { job_id });

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: '로그인이 필요합니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const session = await validateSession(DB, token);
  if (!session.valid || !session.userId) {
    return new Response(JSON.stringify({ success: false, error: '유효하지 않은 세션입니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!job_id) {
    return new Response(JSON.stringify({ success: false, error: '공고 ID가 필요합니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await DB.prepare(`
      DELETE FROM bookmarks 
      WHERE user_id = ? AND job_id = ?
    `).bind(session.userId, job_id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ success: false, error: '북마크를 찾을 수 없습니다.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ 북마크 삭제 성공:', { job_id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: '관심 공고에서 제거되었습니다.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Delete bookmark error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '북마크 삭제 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
