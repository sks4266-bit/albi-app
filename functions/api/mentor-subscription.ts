/**
 * 🎓 AI 멘토 구독 API - 티어별 요금제
 * Basic: ₩2,900/월 (100회)
 * Standard: ₩4,900/월 (200회)
 * Premium: ₩9,900/월 (500회)
 * Unlimited: ₩19,900/월 (무제한)
 */

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  try {
    const db = env.DB;
    
    if (request.method === 'GET') {
      // 구독 상태 조회
      const userId = url.searchParams.get('user_id');
      
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          message: 'user_id가 필요합니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 활성 구독 조회
      const subscription = await db.prepare(`
        SELECT * FROM mentor_subscriptions
        WHERE user_id = ? AND status = 'active'
        AND expires_at > datetime('now')
        ORDER BY expires_at DESC
        LIMIT 1
      `).bind(userId).first();
      
      const hasActiveSubscription = !!subscription;
      const expiresAt = subscription?.expires_at;
      const messagesUsed = subscription?.total_messages_used || 0;
      const messageLimit = subscription?.message_limit;
      const plan = subscription?.plan || 'standard';
      
      // 플랜별 정보
      const planInfo = getPlanInfo(plan);
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          user_id: userId,
          has_subscription: hasActiveSubscription,
          subscription: subscription || null,
          expires_at: expiresAt,
          messages_used: messagesUsed,
          message_limit: messageLimit,
          messages_remaining: messageLimit ? Math.max(0, messageLimit - messagesUsed) : null,
          plan: planInfo
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
      
    } else if (request.method === 'POST') {
      // 구독 시작
      const body = await request.json();
      const { user_id, plan_type = 'standard' } = body;
      
      if (!user_id) {
        return new Response(JSON.stringify({
          success: false,
          message: 'user_id가 필요합니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 유효한 플랜인지 확인
      const validPlans = ['basic', 'standard', 'premium', 'unlimited'];
      if (!validPlans.includes(plan_type)) {
        return new Response(JSON.stringify({
          success: false,
          message: '유효하지 않은 플랜입니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 기존 활성 구독 확인
      const existing = await db.prepare(`
        SELECT * FROM mentor_subscriptions
        WHERE user_id = ? AND status = 'active'
        AND expires_at > datetime('now')
      `).bind(user_id).first();
      
      if (existing) {
        return new Response(JSON.stringify({
          success: false,
          message: '이미 활성 구독이 있습니다',
          subscription: existing
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 플랜 정보 가져오기
      const planInfo = getPlanInfo(plan_type);
      
      // 새 구독 생성
      const subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일
      
      await db.prepare(`
        INSERT INTO mentor_subscriptions (
          subscription_id, user_id, plan, price, status,
          started_at, expires_at, next_payment_date, message_limit
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(
        subscriptionId,
        user_id,
        plan_type,
        planInfo.price,
        now.toISOString(),
        expiresAt.toISOString(),
        expiresAt.toISOString(),
        planInfo.messageLimit
      ).run();
      
      // 대화 내역 저장
      await db.prepare(`
        INSERT INTO mentor_conversations (
          session_id, user_id, turn_number, user_message, mentor_response
        ) VALUES ('system', ?, 0, '구독 시작', ?)
      `).bind(user_id, `${planInfo.name} 플랜 구독이 시작되었습니다! ${planInfo.messageLimit ? `월 ${planInfo.messageLimit}회` : '무제한'} 대화가 가능합니다.`).run();
      
      console.log(`✅ 구독 시작: ${user_id} (${subscriptionId}) - ${plan_type}`);
      
      return new Response(JSON.stringify({
        success: true,
        message: '구독이 시작되었습니다!',
        data: {
          subscription_id: subscriptionId,
          user_id,
          plan: plan_type,
          plan_info: planInfo,
          price: planInfo.price,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          message_limit: planInfo.messageLimit,
          messages_remaining: planInfo.messageLimit
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Subscription error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 플랜 정보 반환 함수
function getPlanInfo(planType: string) {
  const plans: Record<string, any> = {
    basic: {
      name: 'Basic',
      price: 2900,
      messageLimit: 100,
      features: [
        '월 100회 멘토 대화',
        '기본 AI 멘토링'
      ]
    },
    standard: {
      name: 'Standard',
      price: 4900,
      messageLimit: 200,
      features: [
        '월 200회 멘토 대화',
        '전문 AI 멘토링',
        '과제 제출 & 피드백',
        '포트폴리오 리뷰'
      ]
    },
    premium: {
      name: 'Premium',
      price: 9900,
      messageLimit: 500,
      features: [
        '월 500회 멘토 대화',
        '최고급 AI 멘토링',
        '무제한 과제 & 피드백',
        '우선 포트폴리오 리뷰',
        '성장 분석 리포트'
      ]
    },
    unlimited: {
      name: 'Unlimited',
      price: 19900,
      messageLimit: null, // null = 무제한
      features: [
        '무제한 멘토 대화',
        'VIP AI 멘토링',
        '무제한 과제 & 피드백',
        '1:1 포트폴리오 컨설팅',
        '주간 성장 리포트',
        '취업 성공 보장 프로그램'
      ]
    }
  };
  
  return plans[planType] || plans.standard;
}
