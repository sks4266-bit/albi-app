/**
 * PortOne V2 정기결제 시스템 - 구독 확인 API
 * POST /api/subscription/confirm
 * 
 * PortOne 결제 성공 후 호출됨
 * 1. PortOne 서버에서 결제 정보 검증
 * 2. 빌링키 저장
 * 3. 구독 활성화
 */

interface Env {
  DB: D1Database;
  PORTONE_API_SECRET: string;
}

interface ConfirmRequest {
  payment_id: string;
  transaction_id?: string;
  billing_key?: string;
  paid_amount: number;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await context.request.json() as ConfirmRequest;
    const { payment_id, transaction_id, billing_key, paid_amount } = body;

    if (!payment_id) {
      return Response.json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    const db = context.env.DB;
    const apiSecret = context.env.PORTONE_API_SECRET;

    if (!apiSecret) {
      console.error('❌ PORTONE_API_SECRET not configured');
      return Response.json({ 
        success: false, 
        message: 'PortOne API 설정이 필요합니다.' 
      }, { status: 500 });
    }

    // 1. PortOne V2 API로 결제 정보 검증
    const paymentResponse = await fetch(`https://api.portone.io/payments/${encodeURIComponent(payment_id)}`, {
      method: 'GET',
      headers: { 
        'Authorization': `PortOne ${apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      console.error('❌ PortOne payment verification failed:', errorData);
      return Response.json({ 
        success: false, 
        message: '결제 검증 실패',
        error: errorData
      }, { status: 500 });
    }

    const paymentData = await paymentResponse.json();
    const payment = paymentData;

    console.log('✅ Payment verified:', payment);

    // 금액 검증
    if (payment.amount?.total !== paid_amount) {
      console.error('❌ Amount mismatch:', { 
        expected: paid_amount, 
        actual: payment.amount?.total 
      });
      return Response.json({ 
        success: false, 
        message: '결제 금액이 일치하지 않습니다.' 
      }, { status: 400 });
    }

    // 결제 상태 확인
    if (payment.status !== 'PAID') {
      return Response.json({ 
        success: false, 
        message: '결제가 완료되지 않았습니다.',
        status: payment.status
      }, { status: 400 });
    }

    // 2. 빌링키 정보 조회 (있는 경우)
    let billingKeyInfo = null;
    if (billing_key) {
      try {
        const billingResponse = await fetch(`https://api.portone.io/billing-keys/${encodeURIComponent(billing_key)}`, {
          method: 'GET',
          headers: { 
            'Authorization': `PortOne ${apiSecret}`,
            'Content-Type': 'application/json'
          }
        });

        if (billingResponse.ok) {
          billingKeyInfo = await billingResponse.json();
          console.log('✅ Billing key fetched:', billingKeyInfo);
        }
      } catch (error) {
        console.warn('⚠️ Billing key fetch failed:', error);
        // 빌링키 조회 실패해도 결제는 성공했으므로 계속 진행
      }
    }

    // 3. D1 Database에 빌링키 저장 (있는 경우)
    if (billing_key && billingKeyInfo) {
      await db.prepare(`
        INSERT OR REPLACE INTO billing_keys (
          user_id, customer_uid, card_name, card_number, 
          billing_key, status, issued_at, last_used_at
        ) VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
      `).bind(
        payment.customer?.id || payment.customer?.customerId || 'unknown',
        billing_key,
        billingKeyInfo.card?.name || 'Unknown Card',
        billingKeyInfo.card?.number || '****-****-****-****',
        billing_key
      ).run();
    }

    // 4. 구독 활성화 (pending → active)
    const customer_id = payment.customer?.id || payment.customer?.customerId || 'unknown';
    
    await db.prepare(`
      UPDATE mentor_subscriptions 
      SET status = 'active',
          started_at = datetime('now'),
          last_payment_date = datetime('now'),
          next_payment_date = datetime('now', '+30 days')
      WHERE subscription_id LIKE ? AND status = 'pending'
    `).bind(`sub_${timestamp}%`).run();

    // 5. 결제 내역 저장
    await db.prepare(`
      INSERT INTO subscription_payments (
        subscription_id, user_id, merchant_uid, imp_uid, customer_uid,
        amount, plan_type, status, pg_provider, pay_method,
        card_name, card_number, paid_at, pg_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, ?, ?, datetime('now'), ?)
    `).bind(
      payment_id,
      customer_id,
      payment_id,
      transaction_id || payment_id,
      billing_key || 'no-billing-key',
      paid_amount,
      payment.orderName || 'subscription',
      payment.pgProvider || 'portone',
      payment.method?.type || 'CARD',
      payment.method?.card?.name || billingKeyInfo?.card?.name || 'Unknown',
      payment.method?.card?.number || billingKeyInfo?.card?.number || '****',
      JSON.stringify(paymentData)
    ).run();

    console.log('✅ Subscription activated:', payment_id);

    // 6. 다음 결제일 계산 (30일 후)
    const now = new Date();
    const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextBillingDateStr = nextBillingDate.toLocaleDateString('ko-KR');

    return Response.json({
      success: true,
      message: '정기구독이 성공적으로 시작되었습니다!',
      data: {
        subscription_id: payment_id,
        next_billing_date: nextBillingDateStr,
        card_name: payment.method?.card?.name || 'Unknown',
        card_number: payment.method?.card?.number || '****',
        amount: paid_amount
      }
    });

  } catch (error: any) {
    console.error('❌ Subscription confirm error:', error);
    return Response.json({ 
      success: false, 
      message: '구독 확인 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
