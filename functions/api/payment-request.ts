/**
 * 🎫 Toss Payments 결제 요청 API
 * 구독 결제를 위한 결제 정보 생성
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
    const { user_id, user_name, user_email } = body;
    
    if (!user_id || !user_name || !user_email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'user_id, user_name, user_email이 필요합니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 주문 ID 생성 (고유해야 함)
    const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const orderName = 'AI 멘토 프리미엄 구독 (월 ₩4,900)';
    const amount = 4900;
    
    // D1에 결제 대기 상태 저장
    const db = env.DB;
    await db.prepare(`
      INSERT INTO payment_requests (
        order_id, user_id, user_name, user_email, 
        amount, order_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(orderId, user_id, user_name, user_email, amount, orderName).run();
    
    console.log(`✅ Payment request created: ${orderId} for ${user_id}`);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        order_id: orderId,
        order_name: orderName,
        amount: amount,
        customer_name: user_name,
        customer_email: user_email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Payment request error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Payment request failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
