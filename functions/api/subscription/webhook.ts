/**
 * PortOne V2 웹훅 수신 API
 * POST /api/subscription/webhook
 * 
 * PortOne에서 결제/빌링키 관련 이벤트 발생 시 호출됨
 * - 결제 완료/실패
 * - 빌링키 발급/해지
 * - 정기결제 성공/실패
 */

interface Env {
  DB: D1Database;
  PORTONE_API_SECRET: string;
  PORTONE_WEBHOOK_SECRET?: string; // 웹훅 시크릿 (선택)
}

interface PortOneWebhook {
  type: string; // 'Transaction.Ready', 'Transaction.Paid', 'Transaction.Failed', etc.
  timestamp: string;
  data: {
    transactionId?: string;
    paymentId?: string;
    billingKey?: string;
    status?: string;
    amount?: {
      total: number;
      currency: string;
    };
    customer?: {
      id: string;
      name?: string;
      email?: string;
    };
    failReason?: string;
    paidAt?: string;
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    // 요청 본문 읽기
    const rawBody = await context.request.text();
    const webhook = JSON.parse(rawBody) as PortOneWebhook;

    // 웹훅 시크릿 검증 (설정된 경우)
    if (context.env.PORTONE_WEBHOOK_SECRET) {
      const signature = context.request.headers.get('webhook-signature');
      
      if (!signature) {
        console.error('❌ Missing webhook signature');
        return Response.json({ 
          success: false, 
          message: 'Missing webhook signature' 
        }, { status: 401 });
      }

      const isValid = await verifyWebhookSignature(
        rawBody,
        signature,
        context.env.PORTONE_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return Response.json({ 
          success: false, 
          message: 'Invalid webhook signature' 
        }, { status: 401 });
      }

      console.log('✅ Webhook signature verified');
    }

    const db = context.env.DB;

    console.log('📥 Webhook received:', {
      type: webhook.type,
      timestamp: webhook.timestamp,
      paymentId: webhook.data?.paymentId,
      status: webhook.data?.status
    });

    // 웹훅 타입별 처리
    switch (webhook.type) {
      case 'Transaction.Paid':
        await handlePaymentSuccess(db, webhook);
        break;

      case 'Transaction.Failed':
        await handlePaymentFailed(db, webhook);
        break;

      case 'Transaction.Cancelled':
        await handlePaymentCancelled(db, webhook);
        break;

      case 'BillingKey.Issued':
        await handleBillingKeyIssued(db, webhook);
        break;

      case 'BillingKey.Deleted':
        await handleBillingKeyDeleted(db, webhook);
        break;

      default:
        console.log('⚠️ Unhandled webhook type:', webhook.type);
    }

    // 200 응답 (PortOne은 200이 아니면 재시도함)
    return Response.json({ 
      success: true, 
      message: 'Webhook processed',
      type: webhook.type 
    });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    
    // 500 에러를 반환하면 PortOne이 재시도함
    return Response.json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error.message 
    }, { status: 500 });
  }
};

/**
 * 결제 성공 처리
 */
async function handlePaymentSuccess(db: D1Database, webhook: PortOneWebhook) {
  const { paymentId, amount, customer, paidAt } = webhook.data;

  console.log('✅ Payment success:', paymentId);

  // subscription_payments 테이블 업데이트
  await db.prepare(`
    UPDATE subscription_payments
    SET status = 'success',
        paid_at = ?,
        pg_response = ?
    WHERE merchant_uid = ?
  `).bind(
    paidAt || new Date().toISOString(),
    JSON.stringify(webhook.data),
    paymentId
  ).run();

  // mentor_subscriptions 상태 업데이트
  await db.prepare(`
    UPDATE mentor_subscriptions
    SET status = 'active',
        last_payment_date = ?
    WHERE subscription_id IN (
      SELECT subscription_id FROM subscription_payments WHERE merchant_uid = ?
    )
  `).bind(
    paidAt || new Date().toISOString(),
    paymentId
  ).run();

  console.log('✅ Payment success processed');
}

/**
 * 결제 실패 처리
 */
async function handlePaymentFailed(db: D1Database, webhook: PortOneWebhook) {
  const { paymentId, failReason } = webhook.data;

  console.log('❌ Payment failed:', paymentId, failReason);

  // subscription_payments 테이블 업데이트
  await db.prepare(`
    UPDATE subscription_payments
    SET status = 'failed',
        failed_at = datetime('now'),
        fail_reason = ?,
        pg_response = ?
    WHERE merchant_uid = ?
  `).bind(
    failReason || 'Unknown error',
    JSON.stringify(webhook.data),
    paymentId
  ).run();

  console.log('✅ Payment failure processed');
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCancelled(db: D1Database, webhook: PortOneWebhook) {
  const { paymentId } = webhook.data;

  console.log('🔄 Payment cancelled:', paymentId);

  await db.prepare(`
    UPDATE subscription_payments
    SET status = 'cancelled',
        refunded_at = datetime('now'),
        pg_response = ?
    WHERE merchant_uid = ?
  `).bind(
    JSON.stringify(webhook.data),
    paymentId
  ).run();

  console.log('✅ Payment cancellation processed');
}

/**
 * 빌링키 발급 처리
 */
async function handleBillingKeyIssued(db: D1Database, webhook: PortOneWebhook) {
  const { billingKey, customer } = webhook.data;

  console.log('🔑 Billing key issued:', billingKey);

  // billing_keys 테이블에 저장
  await db.prepare(`
    INSERT OR REPLACE INTO billing_keys (
      user_id, customer_uid, billing_key, status, issued_at
    ) VALUES (?, ?, ?, 'active', datetime('now'))
  `).bind(
    customer?.id || 'unknown',
    billingKey,
    billingKey
  ).run();

  console.log('✅ Billing key saved');
}

/**
 * 빌링키 삭제 처리
 */
async function handleBillingKeyDeleted(db: D1Database, webhook: PortOneWebhook) {
  const { billingKey } = webhook.data;

  console.log('🗑️ Billing key deleted:', billingKey);

  await db.prepare(`
    UPDATE billing_keys
    SET status = 'revoked'
    WHERE billing_key = ?
  `).bind(billingKey).run();

  console.log('✅ Billing key revoked');
}

/**
 * 웹훅 서명 검증 (HMAC-SHA256)
 * PortOne 웹훅 시크릿을 사용한 요청 검증
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // 웹훅 시크릿에서 'whsec_' 접두사 제거
    const key = secret.startsWith('whsec_') ? secret.slice(7) : secret;
    
    // Base64 디코딩된 시크릿을 키로 사용
    const encoder = new TextEncoder();
    const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    
    // HMAC-SHA256 키 생성
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // 페이로드 서명 생성
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(payload)
    );

    // Base64 인코딩
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

    // 서명 비교
    return computedSignature === signature;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}
