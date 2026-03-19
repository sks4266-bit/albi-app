/**
 * ✅ Toss Payments 결제 승인 API
 * 결제 완료 후 서버에서 검증 및 승인
 */

export async function onRequest(context: any) {
  const { request, env } = context;
  
  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const body = await request.json();
    const { payment_key, order_id, amount } = body;
    
    if (!payment_key || !order_id || !amount) {
      return new Response(JSON.stringify({
        success: false,
        message: 'payment_key, order_id, amount가 필요합니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const db = env.DB;
    
    // 결제 요청 정보 조회
    const paymentRequest = await db.prepare(`
      SELECT * FROM payment_requests
      WHERE order_id = ? AND status = 'pending'
      LIMIT 1
    `).bind(order_id).first();
    
    if (!paymentRequest) {
      return new Response(JSON.stringify({
        success: false,
        message: '결제 요청을 찾을 수 없습니다'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 금액 검증
    if (paymentRequest.amount !== amount) {
      return new Response(JSON.stringify({
        success: false,
        message: '결제 금액이 일치하지 않습니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Toss Payments API로 결제 승인 요청
    const tossSecretKey = env.TOSS_SECRET_KEY;
    const encodedKey = btoa(tossSecretKey + ':');
    
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey: payment_key,
        orderId: order_id,
        amount: amount
      })
    });
    
    if (!tossResponse.ok) {
      const errorData = await tossResponse.json();
      console.error('❌ Toss API error:', errorData);
      
      // 결제 실패 상태 업데이트
      await db.prepare(`
        UPDATE payment_requests
        SET status = 'failed', payment_key = ?, error_message = ?
        WHERE order_id = ?
      `).bind(payment_key, JSON.stringify(errorData), order_id).run();
      
      return new Response(JSON.stringify({
        success: false,
        message: '결제 승인에 실패했습니다',
        error: errorData
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const tossData = await tossResponse.json();
    console.log('✅ Toss payment approved:', tossData);
    
    // 결제 성공 - D1 업데이트
    await db.prepare(`
      UPDATE payment_requests
      SET status = 'approved', 
          payment_key = ?,
          approved_at = CURRENT_TIMESTAMP,
          toss_response = ?
      WHERE order_id = ?
    `).bind(payment_key, JSON.stringify(tossData), order_id).run();
    
    // 구독 생성 또는 갱신
    const userId = paymentRequest.user_id;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30일 후
    
    // 기존 구독 확인
    const existingSubscription = await db.prepare(`
      SELECT * FROM mentor_subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId).first();
    
    if (existingSubscription) {
      // 기존 구독 갱신
      await db.prepare(`
        UPDATE mentor_subscriptions
        SET status = 'active',
            expires_at = ?,
            last_payment_date = CURRENT_TIMESTAMP,
            next_payment_date = ?
        WHERE subscription_id = ?
      `).bind(expiresAt, expiresAt, existingSubscription.subscription_id).run();
      
      console.log(`✅ Subscription renewed: ${existingSubscription.subscription_id}`);
    } else {
      // 새 구독 생성
      const subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await db.prepare(`
        INSERT INTO mentor_subscriptions (
          subscription_id, user_id, plan, price, status,
          started_at, expires_at, payment_method,
          last_payment_date, next_payment_date
        ) VALUES (?, ?, 'monthly', 4900, 'active', CURRENT_TIMESTAMP, ?, 'toss', CURRENT_TIMESTAMP, ?)
      `).bind(subscriptionId, userId, expiresAt, expiresAt).run();
      
      console.log(`✅ Subscription created: ${subscriptionId}`);
      
      // 환영 이메일 발송 (새 구독만)
      try {
        const emailResponse = await fetch(`${new URL(request.url).origin}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: paymentRequest.user_email,
            subject: '🎉 Albi AI 구독을 환영합니다!',
            template: 'subscription_welcome',
            data: {
              userName: paymentRequest.user_name,
              startDate: new Date().toLocaleDateString('ko-KR'),
              nextPaymentDate: new Date(expiresAt).toLocaleDateString('ko-KR')
            }
          })
        });
        
        const emailResult = await emailResponse.json();
        console.log('📧 Welcome email sent:', emailResult);
      } catch (emailError) {
        console.error('⚠️ Email sending failed:', emailError);
        // 이메일 실패해도 결제는 성공으로 처리
      }
      
      // 결제 영수증 이메일 발송
      try {
        const receiptResponse = await fetch(`${new URL(request.url).origin}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: paymentRequest.user_email,
            subject: '💳 Albi AI 결제 영수증',
            template: 'payment_receipt',
            data: {
              userName: paymentRequest.user_name,
              orderId: order_id,
              paymentDate: new Date().toLocaleString('ko-KR'),
              paymentMethod: tossData.method || '신용카드',
              startDate: new Date().toLocaleDateString('ko-KR'),
              expiresDate: new Date(expiresAt).toLocaleDateString('ko-KR')
            }
          })
        });
        
        const receiptResult = await receiptResponse.json();
        console.log('📧 Receipt email sent:', receiptResult);
      } catch (emailError) {
        console.error('⚠️ Receipt email failed:', emailError);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '결제가 완료되었습니다!',
      data: {
        order_id: order_id,
        payment_key: payment_key,
        amount: amount,
        approved_at: tossData.approvedAt,
        expires_at: expiresAt
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Payment approval error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Payment approval failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
