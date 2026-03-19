/**
 * PortOne V2 결제 정보 조회 API
 * GET /api/subscription/payment-info?payment_id=xxx
 * 
 * 결제 완료 후 리다이렉트된 페이지에서 호출
 * PortOne API로부터 결제 정보를 가져옴
 */

interface Env {
  PORTONE_API_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'GET') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const url = new URL(context.request.url);
    const paymentId = url.searchParams.get('payment_id');

    if (!paymentId) {
      return Response.json({ 
        success: false, 
        message: 'payment_id가 필요합니다.' 
      }, { status: 400 });
    }

    const apiSecret = context.env.PORTONE_API_SECRET;

    if (!apiSecret) {
      console.error('❌ PORTONE_API_SECRET not configured');
      return Response.json({ 
        success: false, 
        message: 'PortOne API 설정이 필요합니다.' 
      }, { status: 500 });
    }

    // PortOne V2 API로 결제 정보 조회
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
        headers: { 
          'Authorization': `PortOne ${apiSecret}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ PortOne API error:', errorData);
      return Response.json({ 
        success: false, 
        message: '결제 정보 조회 실패',
        error: errorData
      }, { status: response.status });
    }

    const paymentData = await response.json();

    console.log('✅ Payment info retrieved:', {
      paymentId,
      status: paymentData.status,
      amount: paymentData.amount?.total
    });

    return Response.json({
      success: true,
      data: paymentData
    });

  } catch (error: any) {
    console.error('❌ Payment info error:', error);
    return Response.json({ 
      success: false, 
      message: '결제 정보 조회 중 오류가 발생했습니다.',
      error: error.message 
    }, { status: 500 });
  }
};
