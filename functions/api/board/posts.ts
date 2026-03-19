// 자유게시판 게시글 목록 조회 및 작성 API
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS 요청 처리 (CORS preflight)
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

// GET: 게시글 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const search = url.searchParams.get('search') || '';

    let query = `
      SELECT 
        id, user_id, author_name, title, content,
        is_anonymous, views, likes, comments_count, is_popular,
        datetime(created_at, '+9 hours') as created_at,
        datetime(updated_at, '+9 hours') as updated_at
      FROM board_posts
    `;

    const params: any[] = [];

    // 검색어가 있으면 제목 또는 내용에서 검색
    if (search) {
      query += ' WHERE title LIKE ? OR content LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await context.env.DB.prepare(query).bind(...params).all();

    // 전체 게시글 수 조회
    let countQuery = 'SELECT COUNT(*) as total FROM board_posts';
    if (search) {
      countQuery += ' WHERE title LIKE ? OR content LIKE ?';
    }
    const countParams = search ? [`%${search}%`, `%${search}%`] : [];
    const countResult = await context.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return Response.json({
      success: true,
      data: {
        posts: results,
        pagination: {
          page,
          limit,
          total: countResult?.total || 0,
          totalPages: Math.ceil((countResult?.total || 0) / limit)
        }
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Get posts error:', error);
    return Response.json({
      success: false,
      error: '게시글 목록 조회 중 오류가 발생했습니다.'
    }, { status: 500, headers: corsHeaders });
  }
};

// POST: 게시글 작성
interface PostRequest {
  userId?: string;
  authorName: string;
  title: string;
  content: string;
  isAnonymous?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as PostRequest;

    // 유효성 검사
    if (!body.title || !body.content) {
      return Response.json({
        success: false,
        error: '제목과 내용을 입력해주세요.'
      }, { status: 400, headers: corsHeaders });
    }

    if (body.title.length > 100) {
      return Response.json({
        success: false,
        error: '제목은 100자 이내로 입력해주세요.'
      }, { status: 400, headers: corsHeaders });
    }

    if (body.content.length > 5000) {
      return Response.json({
        success: false,
        error: '내용은 5000자 이내로 입력해주세요.'
      }, { status: 400, headers: corsHeaders });
    }

    // 게시글 삽입
    const result = await context.env.DB.prepare(`
      INSERT INTO board_posts (user_id, author_name, title, content, is_anonymous)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.userId || null,
      body.isAnonymous ? '익명' : (body.authorName || '알비사용자'),
      body.title.trim(),
      body.content.trim(),
      body.isAnonymous ? 1 : 0
    ).run();

    if (!result.success) {
      throw new Error('게시글 작성 실패');
    }

    return Response.json({
      success: true,
      data: {
        postId: result.meta.last_row_id,
        message: '게시글이 작성되었습니다! 📝'
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Create post error:', error);
    return Response.json({
      success: false,
      error: '게시글 작성 중 오류가 발생했습니다.'
    }, { status: 500, headers: corsHeaders });
  }
};
