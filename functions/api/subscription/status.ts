/**
 * 아임포트 정기결제 시스템 - 구독 조회 API
 * GET /api/subscription/status?user_id=xxx
 * 
 * 사용자의 현재 구독 상태 조회
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'GET') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return Response.json({ 
        success: false, 
        message: 'user_id가 필요합니다.' 
      }, { status: 400 });
    }

    const db = context.env.DB;

    // 활성 구독 조회
    const subscription = await db.prepare(`
      SELECT 
        subscription_id, user_id, plan, price, status,
        started_at, expires_at, next_payment_date, cancelled_at,
        total_messages_used
      FROM mentor_subscriptions
      WHERE user_id = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `).bind(userId).first();

    if (!subscription) {
      return Response.json({
        success: true,
        subscribed: false,
        message: '활성화된 구독이 없습니다.'
      });
    }

    // 빌링키 정보 조회
    const billingKey = await db.prepare(`
      SELECT card_name, card_number, issued_at
      FROM billing_keys
      WHERE user_id = ? AND status = 'active'
      LIMIT 1
    `).bind(userId).first();

    // 다음 결제일까지 남은 일수
    const nextPaymentDate = new Date(subscription.next_payment_date as string);
    const now = new Date();
    const daysUntilNextPayment = Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return Response.json({
      success: true,
      subscribed: true,
      data: {
        subscription_id: subscription.subscription_id,
        plan: subscription.plan,
        price: subscription.price,
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        next_payment_date: subscription.next_payment_date,
        days_until_next_payment: daysUntilNextPayment,
        total_messages_used: subscription.total_messages_used,
        card_info: billingKey ? {
          card_name: billingKey.card_name,
          card_number: billingKey.card_number,
          issued_at: billingKey.issued_at
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Subscription status error:', error);
    return Response.json({ 
      success: false, 
      message: '구독 조회 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
