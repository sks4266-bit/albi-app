// 자유게시판 신고 API
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

// POST: 신고
interface ReportRequest {
  reporterId: string;
  targetType: 'post' | 'comment';
  targetId: number;
  reason: 'spam' | 'abuse' | 'inappropriate' | 'other';
  description?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as ReportRequest;

    // 유효성 검사
    if (!body.reporterId || !body.targetType || !body.targetId || !body.reason) {
      return Response.json({
        success: false,
        error: '필수 정보를 모두 입력해주세요.'
      }, { status: 400, headers: corsHeaders });
    }

    if (!['post', 'comment'].includes(body.targetType)) {
      return Response.json({
        success: false,
        error: '올바른 신고 대상 타입이 아닙니다.'
      }, { status: 400, headers: corsHeaders });
    }

    if (!['spam', 'abuse', 'inappropriate', 'other'].includes(body.reason)) {
      return Response.json({
        success: false,
        error: '올바른 신고 사유가 아닙니다.'
      }, { status: 400, headers: corsHeaders });
    }

    // 중복 신고 확인 (24시간 이내)
    const existingReport = await context.env.DB.prepare(`
      SELECT id FROM board_reports 
      WHERE reporter_id = ? 
        AND target_type = ? 
        AND target_id = ? 
        AND created_at > datetime('now', '-1 day')
    `).bind(body.reporterId, body.targetType, body.targetId).first();

    if (existingReport) {
      return Response.json({
        success: false,
        error: '이미 신고한 내용입니다. (24시간 이내 중복 신고 불가)'
      }, { status: 400, headers: corsHeaders });
    }

    // 신고 삽입
    const result = await context.env.DB.prepare(`
      INSERT INTO board_reports (reporter_id, target_type, target_id, reason, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.reporterId,
      body.targetType,
      body.targetId,
      body.reason,
      body.description || null
    ).run();

    if (!result.success) {
      throw new Error('신고 등록 실패');
    }

    return Response.json({
      success: true,
      data: {
        reportId: result.meta.last_row_id,
        message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.'
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Report error:', error);
    return Response.json({
      success: false,
      error: '신고 처리 중 오류가 발생했습니다.'
    }, { status: 500, headers: corsHeaders });
  }
};
