/**
 * 결제 내역 조회 API
 * GET /api/payment-history?user_id=XXX
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');

    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 결제 내역 조회 (최신순)
    const payments = await env.DB.prepare(`
      SELECT 
        order_id,
        user_name,
        user_email,
        amount,
        order_name,
        status,
        payment_key,
        approved_at,
        created_at,
        toss_response
      FROM payment_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user_id).all();

    // 결제 통계
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_spent,
        MAX(approved_at) as last_payment_date
      FROM payment_requests
      WHERE user_id = ?
    `).bind(user_id).first();

    // Toss 응답에서 결제 수단 추출
    const paymentList = payments.results.map(payment => {
      let paymentMethod = '신용카드';
      let cardInfo = null;

      if (payment.toss_response) {
        try {
          const tossData = JSON.parse(payment.toss_response);
          paymentMethod = tossData.method || '신용카드';
          
          if (tossData.card) {
            cardInfo = {
              company: tossData.card.company || '카드사',
              number: tossData.card.number || '****',
              installment: tossData.card.installmentPlanMonths || 0
            };
          }
        } catch (e) {
          console.error('Toss response parse error:', e);
        }
      }

      return {
        order_id: payment.order_id,
        user_name: payment.user_name,
        user_email: payment.user_email,
        amount: payment.amount,
        order_name: payment.order_name,
        status: payment.status,
        payment_key: payment.payment_key,
        payment_method: paymentMethod,
        card_info: cardInfo,
        approved_at: payment.approved_at,
        created_at: payment.created_at
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        user_id,
        payments: paymentList,
        stats: {
          total_payments: stats?.total_payments || 0,
          successful_payments: stats?.successful_payments || 0,
          total_spent: stats?.total_spent || 0,
          last_payment_date: stats?.last_payment_date
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('Payment history error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
