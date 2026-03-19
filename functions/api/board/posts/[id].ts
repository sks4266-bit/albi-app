// 자유게시판 게시글 상세 조회 API
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS 요청 처리
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

// GET: 게시글 상세 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const postId = context.params.id as string;

    if (!postId) {
      return Response.json({
        success: false,
        error: '게시글 ID가 필요합니다.'
      }, { status: 400, headers: corsHeaders });
    }

    // 조회수 증가
    await context.env.DB.prepare(`
      UPDATE board_posts 
      SET views = views + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(postId).run();

    // 게시글 조회
    const post = await context.env.DB.prepare(`
      SELECT 
        id, user_id, author_name, title, content,
        is_anonymous, views, likes, comments_count, is_popular,
        datetime(created_at, '+9 hours') as created_at,
        datetime(updated_at, '+9 hours') as updated_at
      FROM board_posts
      WHERE id = ?
    `).bind(postId).first();

    if (!post) {
      return Response.json({
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      }, { status: 404, headers: corsHeaders });
    }

    // 댓글 조회
    const { results: comments } = await context.env.DB.prepare(`
      SELECT 
        id, user_id, author_name, content, is_anonymous, likes,
        datetime(created_at, '+9 hours') as created_at
      FROM board_comments
      WHERE post_id = ?
      ORDER BY created_at ASC
    `).bind(postId).all();

    return Response.json({
      success: true,
      data: {
        post,
        comments: comments || []
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Get post detail error:', error);
    return Response.json({
      success: false,
      error: '게시글 조회 중 오류가 발생했습니다.'
    }, { status: 500, headers: corsHeaders });
  }
};
