// 자유게시판 댓글 작성 API
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

// POST: 댓글 작성
interface CommentRequest {
  userId?: string;
  authorName: string;
  content: string;
  isAnonymous?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const postId = context.params.id as string;
    const body = await context.request.json() as CommentRequest;

    if (!postId) {
      return Response.json({
        success: false,
        error: '게시글 ID가 필요합니다.'
      }, { status: 400, headers: corsHeaders });
    }

    // 유효성 검사
    if (!body.content || body.content.trim().length === 0) {
      return Response.json({
        success: false,
        error: '댓글 내용을 입력해주세요.'
      }, { status: 400, headers: corsHeaders });
    }

    if (body.content.length > 500) {
      return Response.json({
        success: false,
        error: '댓글은 500자 이내로 입력해주세요.'
      }, { status: 400, headers: corsHeaders });
    }

    // 게시글 존재 확인
    const post = await context.env.DB.prepare('SELECT id FROM board_posts WHERE id = ?').bind(postId).first();
    if (!post) {
      return Response.json({
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      }, { status: 404, headers: corsHeaders });
    }

    // 댓글 삽입
    const result = await context.env.DB.prepare(`
      INSERT INTO board_comments (post_id, user_id, author_name, content, is_anonymous)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      postId,
      body.userId || null,
      body.isAnonymous ? '익명' : (body.authorName || '알비사용자'),
      body.content.trim(),
      body.isAnonymous ? 1 : 0
    ).run();

    if (!result.success) {
      throw new Error('댓글 작성 실패');
    }

    // 게시글의 댓글 수 증가
    await context.env.DB.prepare(`
      UPDATE board_posts 
      SET comments_count = comments_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(postId).run();

    return Response.json({
      success: true,
      data: {
        commentId: result.meta.last_row_id,
        message: '댓글이 작성되었습니다. 💬'
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Create comment error:', error);
    return Response.json({
      success: false,
      error: '댓글 작성 중 오류가 발생했습니다.'
    }, { status: 500, headers: corsHeaders });
  }
};
