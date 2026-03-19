// 자유게시판 좋아요 토글 API
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS 요청 처리
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

// POST: 좋아요 토글
interface LikeRequest {
  userId: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const postId = context.params.id as string;
    const body = await context.request.json() as LikeRequest;

    if (!postId || !body.userId) {
      return Response.json({
        success: false,
        error: '게시글 ID와 사용자 ID가 필요합니다.'
      }, { status: 400, headers: corsHeaders });
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await context.env.DB.prepare(`
      SELECT id FROM board_likes WHERE post_id = ? AND user_id = ?
    `).bind(postId, body.userId).first();

    let action: 'liked' | 'unliked';

    if (existingLike) {
      // 좋아요 취소
      await context.env.DB.prepare(`
        DELETE FROM board_likes WHERE post_id = ? AND user_id = ?
      `).bind(postId, body.userId).run();

      await context.env.DB.prepare(`
        UPDATE board_posts 
        SET likes = likes - 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(postId).run();

      action = 'unliked';
    } else {
      // 좋아요 추가
      await context.env.DB.prepare(`
        INSERT INTO board_likes (post_id, user_id) VALUES (?, ?)
      `).bind(postId, body.userId).run();

      await context.env.DB.prepare(`
        UPDATE board_posts 
        SET likes = likes + 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(postId).run();

      action = 'liked';
    }

    return Response.json({
      success: true,
      data: {
        action,
        message: action === 'liked' ? '좋아요를 눌렀습니다. ❤️' : '좋아요를 취소했습니다.'
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Toggle like error:', error);
    return Response.json({
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.'
    }, { status: 500, headers: corsHeaders });
  }
};
