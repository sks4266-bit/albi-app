/**
 * GET /api/bookmarks/list - 북마크 목록 조회
 */

import { handle } from 'hono/cloudflare-pages';

interface Env {
  DB: D1Database;
}

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { DB } = env;

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

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
    // 1. 북마크 목록만 먼저 조회
    const bookmarkList = await DB.prepare(`
      SELECT id, job_id, created_at
      FROM bookmarks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(session.userId).all();

    console.log('🔖 북마크 조회:', bookmarkList.results?.length || 0, '건');

    if (!bookmarkList.results || bookmarkList.results.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        bookmarks: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. 각 북마크의 job_id로 jobs 테이블 조회 시도
    console.log('🔍 북마크 원본 데이터:', JSON.stringify(bookmarkList.results));
    
    const formattedBookmarks = await Promise.all(
      (bookmarkList.results || []).map(async (bookmark: any) => {
        try {
          console.log(`🔍 북마크 처리 중 - ID: ${bookmark.id}, job_id: ${bookmark.job_id}`);
          
          const jobData = await DB.prepare(`
            SELECT id, title, company_name, location, hourly_wage, category, description
            FROM jobs
            WHERE id = ?
          `).bind(bookmark.job_id).first();

          // jobs 테이블에 없으면 Mock 데이터로 폴백
          if (!jobData) {
            console.log('⚠️ Mock 데이터 사용:', bookmark.job_id);
            return {
              id: bookmark.id,
              job_id: bookmark.job_id,
              created_at: bookmark.created_at,
              job: {
                id: bookmark.job_id,
                title: `공고 ${bookmark.job_id}`,
                company_name: '알비',
                location: '서울',
                hourly_wage: 10000,
                category: 'etc',
                description: '공고 정보를 불러올 수 없습니다.'
              }
            };
          }

          console.log(`✅ 북마크 처리 완료 - ID: ${bookmark.id}`);
          return {
            id: bookmark.id,
            job_id: bookmark.job_id,
            created_at: bookmark.created_at,
            job: {
              id: jobData.id,
              title: jobData.title,
              company_name: jobData.company_name,
              location: jobData.location,
              hourly_wage: jobData.hourly_wage,
              category: jobData.category,
              description: jobData.description
            }
          };
        } catch (bookmarkError: any) {
          console.error(`❌ 북마크 처리 실패 - ID: ${bookmark.id}, 에러:`, bookmarkError);
          // 에러가 발생해도 계속 진행 - Mock 데이터 반환
          return {
            id: bookmark.id,
            job_id: bookmark.job_id,
            created_at: bookmark.created_at,
            job: {
              id: bookmark.job_id,
              title: `공고 ${bookmark.job_id}`,
              company_name: '알비',
              location: '서울',
              hourly_wage: 10000,
              category: 'etc',
              description: '공고 정보를 불러올 수 없습니다.'
            }
          };
        }
      })
    );

    console.log('✅ 북마크 포맷 완료:', formattedBookmarks.length, '건');

    return new Response(JSON.stringify({ 
      success: true, 
      bookmarks: formattedBookmarks
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Get bookmarks error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `북마크 목록 조회 중 오류: ${error?.message || '알 수 없는 오류'}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
