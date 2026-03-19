/**
 * 아임포트 정기결제 시스템 - 구독 해지 API
 * POST /api/subscription/cancel
 * 
 * 사용자가 마이페이지에서 구독 해지 요청
 * 다음 결제일 3일 전까지만 가능
 */

interface Env {
  DB: D1Database;
  IAMPORT_API_KEY: string;
  IAMPORT_API_SECRET: string;
}

interface CancelRequest {
  user_id: string;
  subscription_id: string;
  reason?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await context.request.json() as CancelRequest;
    const { user_id, subscription_id, reason } = body;

    if (!user_id || !subscription_id) {
      return Response.json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    const db = context.env.DB;

    // 구독 정보 조회
    const subscription = await db.prepare(`
      SELECT subscription_id, user_id, next_payment_date, status
      FROM mentor_subscriptions
      WHERE subscription_id = ? AND user_id = ? AND status = 'active'
    `).bind(subscription_id, user_id).first();

    if (!subscription) {
      return Response.json({ 
        success: false, 
        message: '활성화된 구독을 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 다음 결제일 3일 전까지만 해지 가능
    const nextPaymentDate = new Date(subscription.next_payment_date as string);
    const now = new Date();
    const daysUntilPayment = (nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilPayment < 3) {
      return Response.json({ 
        success: false, 
        message: '다음 결제일 3일 전까지만 해지 가능합니다. 다음 결제 후 해지해주세요.' 
      }, { status: 400 });
    }

    // 빌링키 조회
    const billingKey = await db.prepare(`
      SELECT customer_uid FROM billing_keys
      WHERE user_id = ? AND status = 'active'
    `).bind(user_id).first();

    if (!billingKey) {
      console.warn('⚠️ No billing key found for user:', user_id);
    }

    // 아임포트에 빌링키 삭제 요청 (선택 사항)
    if (billingKey) {
      const customer_uid = billingKey.customer_uid as string;

      // 토큰 발급 (위에서 이미 했지만 재사용 불가하므로 재발급)
      const tokenResp = await fetch('https://api.iamport.kr/users/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imp_key: context.env.IAMPORT_API_KEY || 'imp_apikey_test',
          imp_secret: context.env.IAMPORT_API_SECRET || 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f'
        })
      });

      const tokenJson = await tokenResp.json();
      const token = tokenJson.response?.access_token;

      if (token) {
        // 빌링키 삭제
        await fetch(`https://api.iamport.kr/subscribe/customers/${customer_uid}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // 빌링키 상태 업데이트
        await db.prepare(`
          UPDATE billing_keys SET status = 'revoked' WHERE customer_uid = ?
        `).bind(customer_uid).run();
      }
    }

    // 구독 상태 업데이트 (active → cancelled)
    await db.prepare(`
      UPDATE mentor_subscriptions
      SET status = 'cancelled', cancelled_at = datetime('now')
      WHERE subscription_id = ?
    `).bind(subscription_id).run();

    console.log('✅ Subscription cancelled:', subscription_id);

    return Response.json({
      success: true,
      message: '구독이 해지되었습니다. 현재 구독 기간 종료일까지 서비스를 이용하실 수 있습니다.',
      data: {
        subscription_id,
        cancelled_at: new Date().toISOString(),
        expires_at: subscription.next_payment_date
      }
    });

  } catch (error: any) {
    console.error('❌ Subscription cancel error:', error);
    return Response.json({ 
      success: false, 
      message: '구독 해지 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
