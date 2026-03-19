/**
 * PortOne V2 정기결제 시스템 - 자동 결제 실행 API
 * POST /api/subscription/auto-billing
 * 
 * Cloudflare Cron Trigger 또는 외부 스케줄러에서 매일 호출
 * 다음 결제일이 오늘인 구독들을 찾아 자동 결제 실행
 */

interface Env {
  DB: D1Database;
  PORTONE_API_SECRET: string;
  PORTONE_STORE_ID: string;
  CRON_SECRET?: string; // Cron job 인증용 시크릿
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  // Cron Secret 검증 (설정된 경우)
  const cronSecret = context.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid or missing authorization');
      return Response.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
  }

  try {
    const db = context.env.DB;
    const apiSecret = context.env.PORTONE_API_SECRET;
    const storeId = context.env.PORTONE_STORE_ID;

    if (!apiSecret || !storeId) {
      return Response.json({ 
        success: false, 
        message: 'PortOne API 설정이 필요합니다.' 
      }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 오늘 결제해야 하는 활성 구독 조회
    const subscriptions = await db.prepare(`
      SELECT subscription_id, user_id, plan, price, next_payment_date
      FROM mentor_subscriptions
      WHERE status = 'active' 
        AND date(next_payment_date) = ?
    `).bind(today).all();

    if (!subscriptions.results || subscriptions.results.length === 0) {
      return Response.json({
        success: true,
        message: '오늘 결제할 구독이 없습니다.',
        processed: 0
      });
    }

    console.log(`🔄 Processing ${subscriptions.results.length} subscriptions for billing...`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // 각 구독별로 자동 결제 실행
    for (const sub of subscriptions.results) {
      const { subscription_id, user_id, plan, price } = sub;

      try {
        // 빌링키 조회
        const billingKeyRecord = await db.prepare(`
          SELECT customer_uid, billing_key, card_name, card_number
          FROM billing_keys
          WHERE user_id = ? AND status = 'active'
        `).bind(user_id).first();

        if (!billingKeyRecord) {
          console.error(`❌ No billing key for user ${user_id}`);
          failCount++;
          
          // 실패 로그 기록
          await db.prepare(`
            INSERT INTO scheduled_payment_logs (
              subscription_id, scheduled_date, execution_status, 
              attempt_count, last_attempt_at, error_message
            ) VALUES (?, ?, 'failed', 1, datetime('now'), ?)
          `).bind(subscription_id, today, '빌링키 없음').run();
          
          results.push({ subscription_id, status: 'failed', reason: '빌링키 없음' });
          continue;
        }

        const billing_key = billingKeyRecord.billing_key as string;

        // payment_id 생성 (자동결제용)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const payment_id = `auto_${timestamp}_${randomStr}`;

        // PortOne V2 빌링키로 결제 실행
        const paymentResponse = await fetch('https://api.portone.io/billing-keys/' + encodeURIComponent(billing_key) + '/pay', {
          method: 'POST',
          headers: { 
            'Authorization': `PortOne ${apiSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentId: payment_id,
            orderName: `알비 ${plan} 플랜 (월간 정기구독 - 자동결제)`,
            amount: {
              total: price,
              currency: 'KRW'
            },
            customer: {
              customerId: user_id
            }
          })
        });

        const paymentResult = await paymentResponse.json();

        if (paymentResponse.ok && paymentResult.status === 'PAID') {
          // 결제 성공
          successCount++;

          // 결제 내역 저장
          await db.prepare(`
            INSERT INTO subscription_payments (
              subscription_id, user_id, merchant_uid, imp_uid, customer_uid,
              amount, plan_type, status, pg_provider, pay_method,
              card_name, card_number, paid_at, pg_response
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, ?, ?, datetime('now'), ?)
          `).bind(
            subscription_id,
            user_id,
            payment_id,
            paymentResult.transactionId || payment_id,
            billing_key,
            price,
            plan,
            paymentResult.pgProvider || 'portone',
            'card',
            billingKeyRecord.card_name || 'Unknown',
            billingKeyRecord.card_number || '****',
            JSON.stringify(paymentResult)
          ).run();

          // 구독 정보 업데이트 (다음 결제일 +30일)
          await db.prepare(`
            UPDATE mentor_subscriptions
            SET last_payment_date = datetime('now'),
                next_payment_date = datetime('now', '+30 days'),
                expires_at = datetime('now', '+30 days')
            WHERE subscription_id = ?
          `).bind(subscription_id).run();

          // 성공 로그
          await db.prepare(`
            INSERT INTO scheduled_payment_logs (
              subscription_id, scheduled_date, execution_status,
              attempt_count, last_attempt_at
            ) VALUES (?, ?, 'success', 1, datetime('now'))
          `).bind(subscription_id, today).run();

          results.push({ subscription_id, status: 'success', amount: price });

        } else {
          // 결제 실패
          failCount++;

          // 실패 내역 저장
          await db.prepare(`
            INSERT INTO subscription_payments (
              subscription_id, user_id, merchant_uid, customer_uid,
              amount, plan_type, status, failed_at, fail_reason, pg_response
            ) VALUES (?, ?, ?, ?, ?, ?, 'failed', datetime('now'), ?, ?)
          `).bind(
            subscription_id,
            user_id,
            payment_id,
            billing_key,
            price,
            plan,
            paymentResult.message || '결제 실패',
            JSON.stringify(paymentResult)
          ).run();

          // 실패 로그
          await db.prepare(`
            INSERT INTO scheduled_payment_logs (
              subscription_id, scheduled_date, execution_status,
              attempt_count, last_attempt_at, error_message
            ) VALUES (?, ?, 'failed', 1, datetime('now'), ?)
          `).bind(subscription_id, today, paymentResult.message || '결제 실패').run();

          results.push({ 
            subscription_id, 
            status: 'failed', 
            reason: paymentResult.message 
          });

          // 3일 연속 실패 시 구독 자동 해지
          const failLogs = await db.prepare(`
            SELECT COUNT(*) as fail_count
            FROM scheduled_payment_logs
            WHERE subscription_id = ? AND execution_status = 'failed'
          `).bind(subscription_id).first();

          if (failLogs && (failLogs.fail_count as number) >= 3) {
            await db.prepare(`
              UPDATE mentor_subscriptions
              SET status = 'cancelled', cancelled_at = datetime('now')
              WHERE subscription_id = ?
            `).bind(subscription_id).run();

            console.warn(`⚠️ Subscription auto-cancelled (3 failures): ${subscription_id}`);
          }
        }

      } catch (paymentError: any) {
        console.error(`❌ Payment error for ${subscription_id}:`, paymentError);
        failCount++;
        results.push({ 
          subscription_id, 
          status: 'error', 
          reason: paymentError.message 
        });
      }
    }

    console.log(`✅ Auto-billing complete: ${successCount} success, ${failCount} failed`);

    return Response.json({
      success: true,
      message: `자동 결제 처리 완료: 성공 ${successCount}건, 실패 ${failCount}건`,
      processed: subscriptions.results.length,
      successCount,
      failCount,
      results
    });

  } catch (error: any) {
    console.error('❌ Auto-billing error:', error);
    return Response.json({ 
      success: false, 
      message: '자동 결제 처리 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
