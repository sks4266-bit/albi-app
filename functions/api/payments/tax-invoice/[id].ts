// 세금계산서 조회 API
import type { Env } from '../../../src/types/env';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
       WHERE sessions.session_token = ? AND sessions.expires_at > datetime('now')`
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
    const invoiceId = params.id as string;

    // 세금계산서 조회 (결제 정보 및 공고 정보 포함)
    const invoice = await env.DB.prepare(
      `SELECT 
        tir.*,
        p.amount,
        p.user_id as payment_user_id,
        j.title as job_title,
        j.company_name
       FROM tax_invoice_requests tir
       LEFT JOIN payments p ON tir.payment_id = p.id
       LEFT JOIN jobs j ON p.job_id = j.id
       WHERE tir.id = ?`
    )
      .bind(invoiceId)
      .first();

    if (!invoice) {
      return new Response(
        JSON.stringify({ success: false, message: '세금계산서를 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    // 권한 확인 (본인이거나 관리자인 경우만 조회 가능)
    if (invoice.user_id !== userId && session.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, message: '접근 권한이 없습니다.' }),
        { status: 403, headers }
      );
    }

    // 발급된 세금계산서만 조회 가능
    if (invoice.status !== 'issued') {
      return new Response(
        JSON.stringify({ success: false, message: '아직 발급되지 않은 세금계산서입니다.' }),
        { status: 400, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          payment_id: invoice.payment_id,
          business_number: invoice.business_number,
          business_name: invoice.business_name,
          ceo_name: invoice.ceo_name,
          business_address: invoice.business_address,
          amount: invoice.amount,
          status: invoice.status,
          issued_at: invoice.issued_at,
          created_at: invoice.created_at,
          job_title: invoice.job_title,
          company_name: invoice.company_name,
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error('Tax invoice API error:', error);
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
