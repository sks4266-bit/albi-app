/**
 * 아임포트 정기결제 시스템 - 환불 요청 API
 * POST /api/subscription/refund
 * 
 * 청약철회 또는 중도해지 환불 요청
 */

interface Env {
  DB: D1Database;
  IAMPORT_API_KEY: string;
  IAMPORT_API_SECRET: string;
}

interface RefundRequest {
  user_id: string;
  subscription_id: string;
  refund_type: 'withdrawal' | 'cancellation'; // withdrawal=청약철회, cancellation=중도해지
  reason?: string;
  refund_holder?: string; // 환불 계좌 예금주 (계좌이체 환불 시)
  refund_bank?: string;   // 환불 은행
  refund_account?: string; // 환불 계좌번호
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await context.request.json() as RefundRequest;
    const { user_id, subscription_id, refund_type, reason } = body;

    if (!user_id || !subscription_id || !refund_type) {
      return Response.json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    const db = context.env.DB;

    // 1. 구독 정보 조회
    const subscription = await db.prepare(`
      SELECT subscription_id, user_id, plan, price, status, started_at, total_messages_used
      FROM mentor_subscriptions
      WHERE subscription_id = ? AND user_id = ?
    `).bind(subscription_id, user_id).first();

    if (!subscription) {
      return Response.json({ 
        success: false, 
        message: '구독 정보를 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 2. 최초 결제 내역 조회 (imp_uid 필요)
    const payment = await db.prepare(`
      SELECT id, imp_uid, merchant_uid, amount, paid_at, status
      FROM subscription_payments
      WHERE subscription_id = ? AND status = 'success'
      ORDER BY paid_at ASC
      LIMIT 1
    `).bind(subscription_id).first();

    if (!payment) {
      return Response.json({ 
        success: false, 
        message: '결제 내역을 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 3. 환불 금액 계산
    let refundAmount = 0;
    let isEligible = false;
    let refundReason = '';

    if (refund_type === 'withdrawal') {
      // 청약철회: 7일 이내 + 미사용 → 전액 환불
      const startedAt = new Date(subscription.started_at as string);
      const now = new Date();
      const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
      const messagesUsed = subscription.total_messages_used as number || 0;

      if (daysSinceStart <= 7 && messagesUsed === 0) {
        isEligible = true;
        refundAmount = payment.amount as number;
        refundReason = '청약철회 (7일 이내 + 미사용)';
      } else {
        return Response.json({ 
          success: false, 
          message: '청약철회 조건 불충족: 결제 후 7일 초과 또는 서비스 사용 내역 존재' 
        }, { status: 400 });
      }
    } else if (refund_type === 'cancellation') {
      // 중도해지: 일할 환불 (남은 일수 기준)
      const startedAt = new Date(subscription.started_at as string);
      const now = new Date();
      const totalDays = 30;
      const usedDays = Math.ceil((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, totalDays - usedDays);

      if (remainingDays > 0) {
        isEligible = true;
        refundAmount = Math.floor((payment.amount as number / totalDays) * remainingDays);
        refundReason = `중도해지 (${usedDays}일 사용, ${remainingDays}일 환불)`;
      } else {
        return Response.json({ 
          success: false, 
          message: '환불 가능 기간이 지났습니다.' 
        }, { status: 400 });
      }
    }

    if (!isEligible) {
      return Response.json({ 
        success: false, 
        message: '환불 조건을 충족하지 않습니다.' 
      }, { status: 400 });
    }

    // 4. 환불 요청 레코드 생성
    const refundResult = await db.prepare(`
      INSERT INTO refund_requests (
        subscription_id, user_id, payment_id, refund_type, refund_amount,
        reason, status, requested_at,
        refund_holder, refund_bank, refund_account
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'), ?, ?, ?)
    `).bind(
      subscription_id,
      user_id,
      payment.id,
      refund_type,
      refundAmount,
      reason || refundReason,
      body.refund_holder || '',
      body.refund_bank || '',
      body.refund_account || ''
    ).run();

    console.log('✅ Refund request created:', refundResult);

    // 5. 아임포트 환불 API 호출
    try {
      // 토큰 발급
      const tokenResponse = await fetch('https://api.iamport.kr/users/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imp_key: context.env.IAMPORT_API_KEY || 'imp_apikey_test',
          imp_secret: context.env.IAMPORT_API_SECRET || 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f'
        })
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.response?.access_token;

      if (!accessToken) {
        throw new Error('아임포트 토큰 발급 실패');
      }

      // 환불 요청
      const refundResponse = await fetch('https://api.iamport.kr/payments/cancel', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imp_uid: payment.imp_uid,
          amount: refundAmount,
          reason: reason || refundReason,
          refund_holder: body.refund_holder,
          refund_bank: body.refund_bank,
          refund_account: body.refund_account
        })
      });

      const refundData = await refundResponse.json();

      if (refundData.code === 0) {
        // 환불 성공
        await db.prepare(`
          UPDATE refund_requests 
          SET status = 'completed', 
              processed_at = datetime('now'),
              completed_at = datetime('now'),
              imp_uid = ?
          WHERE id = ?
        `).bind(refundData.response.imp_uid, refundResult.meta.last_row_id).run();

        // 구독 상태 업데이트
        await db.prepare(`
          UPDATE mentor_subscriptions 
          SET status = 'cancelled', cancelled_at = datetime('now')
          WHERE subscription_id = ?
        `).bind(subscription_id).run();

        // 결제 내역 환불 처리
        await db.prepare(`
          UPDATE subscription_payments 
          SET status = 'refunded', refunded_at = datetime('now'), refund_reason = ?
          WHERE imp_uid = ?
        `).bind(refundReason, payment.imp_uid).run();

        return Response.json({
          success: true,
          message: '환불이 완료되었습니다. 영업일 기준 3-7일 내 환불 예정입니다.',
          data: {
            refund_amount: refundAmount,
            refund_reason: refundReason,
            imp_uid: refundData.response.imp_uid
          }
        });
      } else {
        // 환불 실패
        console.error('❌ Iamport refund failed:', refundData);
        
        await db.prepare(`
          UPDATE refund_requests 
          SET status = 'rejected', 
              processed_at = datetime('now'),
              admin_note = ?
          WHERE id = ?
        `).bind(refundData.message || '환불 실패', refundResult.meta.last_row_id).run();

        return Response.json({ 
          success: false, 
          message: '환불 처리 실패: ' + (refundData.message || '알 수 없는 오류') 
        }, { status: 500 });
      }

    } catch (iamportError: any) {
      console.error('❌ Iamport API error:', iamportError);
      
      // 환불 요청은 DB에 저장했으므로 pending 상태 유지
      return Response.json({ 
        success: false, 
        message: '환불 요청이 접수되었으나 처리 중 오류가 발생했습니다. 관리자가 확인 후 처리합니다.',
        error: iamportError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Refund request error:', error);
    return Response.json({ 
      success: false, 
      message: '환불 요청 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
