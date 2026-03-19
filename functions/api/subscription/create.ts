/**
 * PortOne V2 정기결제 시스템 - 구독 생성 API
 * POST /api/subscription/create
 * 
 * 사용자가 플랜을 선택하고 결제 요청 시 호출됨
 * payment_id, billing_key 생성 및 반환
 */

interface Env {
  DB: D1Database;
  PORTONE_STORE_ID: string;
  PORTONE_API_SECRET: string;
}

interface SubscriptionRequest {
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: string;
  amount: number;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await context.request.json() as SubscriptionRequest;
    const { user_id, user_name, user_email, plan_type, amount } = body;

    // Validation
    if (!user_id || !user_name || !user_email || !plan_type || !amount) {
      return Response.json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    // 플랜 검증
    const validPlans = ['basic', 'standard', 'premium', 'unlimited'];
    if (!validPlans.includes(plan_type)) {
      return Response.json({ 
        success: false, 
        message: '유효하지 않은 플랜입니다.' 
      }, { status: 400 });
    }

    // payment_id 생성 (PortOne V2 결제 ID - 고유해야 함)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const payment_id = `payment_${timestamp}_${randomStr}`;

    // billing_key 생성 (빌링키 - 고객별 고유 ID)
    const billing_key = `billing_${user_id}_${timestamp}`;

    // subscription_id 생성
    const subscription_id = `sub_${timestamp}_${randomStr}`;

    // D1에 구독 레코드 생성 (pending 상태)
    const db = context.env.DB;

    // 기존 pending 구독 삭제 (중복 방지)
    await db.prepare(`
      DELETE FROM mentor_subscriptions 
      WHERE user_id = ? AND status = 'pending'
    `).bind(user_id).run();

    await db.prepare(`
      INSERT INTO mentor_subscriptions (
        subscription_id, user_id, plan, price, status, 
        started_at, expires_at, next_payment_date
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now', '+30 days'), datetime('now', '+30 days'))
    `).bind(
      subscription_id,
      user_id,
      plan_type,
      amount
    ).run();

    console.log('✅ Subscription record created:', subscription_id);

    return Response.json({
      success: true,
      message: '구독 정보가 생성되었습니다.',
      data: {
        subscription_id,
        payment_id,
        billing_key,
        amount,
        plan_type
      }
    });

  } catch (error: any) {
    console.error('❌ Subscription create error:', error);
    return Response.json({ 
      success: false, 
      message: '구독 생성 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
