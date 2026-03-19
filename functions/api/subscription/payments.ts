/**
 * 구독 결제 내역 조회 API
 * GET /api/subscription/payments?user_id=xxx&status=all|completed|cancelled
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const statusFilter = url.searchParams.get('status') || 'all';

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'user_id is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 결제 내역 조회
    let query = `
      SELECT 
        sp.id,
        sp.subscription_id,
        sp.user_id,
        sp.amount,
        sp.status,
        sp.payment_method,
        sp.imp_uid,
        sp.created_at,
        ms.plan,
        ms.started_at,
        ms.expires_at
      FROM subscription_payments sp
      LEFT JOIN mentor_subscriptions ms ON sp.subscription_id = ms.subscription_id
      WHERE sp.user_id = ?
    `;

    const params: any[] = [userId];

    // 상태 필터
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        query += ` AND sp.status = 'completed'`;
      } else if (statusFilter === 'cancelled') {
        query += ` AND sp.status IN ('cancelled', 'refunded')`;
      }
    }

    query += ` ORDER BY sp.created_at DESC LIMIT 50`;

    const result = await env.DB.prepare(query).bind(...params).all();

    if (!result.results) {
      return new Response(JSON.stringify({
        success: true,
        payments: [],
        total: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 결제 내역 포맷팅
    const payments = result.results.map((payment: any) => {
      const planNames: Record<string, string> = {
        'basic': 'Basic 플랜',
        'standard': 'Standard 플랜',
        'premium': 'Premium 플랜',
        'unlimited': 'Unlimited 플랜'
      };

      return {
        id: payment.id,
        subscription_id: payment.subscription_id,
        order_name: planNames[payment.plan] || 'Albi 구독',
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method || 'card',
        imp_uid: payment.imp_uid,
        created_at: payment.created_at,
        plan: payment.plan
      };
    });

    return new Response(JSON.stringify({
      success: true,
      payments: payments,
      total: payments.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payments API error:', error);
    
    // Graceful degradation: 에러 시 빈 배열 반환
    return new Response(JSON.stringify({
      success: true,
      payments: [],
      total: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
