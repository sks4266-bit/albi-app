/**
 * 🎓 AI 멘토 대화 API (구독 기반)
 */

import OpenAI from 'openai';

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
    const { user_id, session_id, message } = body;
    
    if (!user_id || !message) {
      return new Response(JSON.stringify({
        success: false,
        message: 'user_id와 message가 필요합니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const db = env.DB;
    
    // 구독 확인
    const subscription = await db.prepare(`
      SELECT * FROM mentor_subscriptions
      WHERE user_id = ? AND status = 'active'
      AND expires_at > datetime('now')
      LIMIT 1
    `).bind(user_id).first();
    
    if (!subscription) {
      return new Response(JSON.stringify({
        success: false,
        message: '구독이 필요합니다',
        requires_subscription: true
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 메시지 제한 확인 (Unlimited 플랜은 message_limit이 NULL)
    const messageLimit = subscription.message_limit;
    const messagesUsed = subscription.total_messages_used || 0;
    
    if (messageLimit !== null && messagesUsed >= messageLimit) {
      return new Response(JSON.stringify({
        success: false,
        message: '이번 달 메시지 한도를 모두 사용했습니다',
        limit_exceeded: true,
        messages_used: messagesUsed,
        message_limit: messageLimit,
        plan: subscription.plan
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 세션 처리
    let currentSessionId = session_id;
    if (!currentSessionId) {
      currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await db.prepare(`
        INSERT INTO mentor_sessions (
          session_id, user_id, status, job_type
        ) VALUES (?, ?, 'active', 'general')
      `).bind(currentSessionId, user_id).run();
    }
    
    // 대화 히스토리 로드 (최근 5턴)
    const history = await db.prepare(`
      SELECT user_message, mentor_response
      FROM mentor_conversations
      WHERE session_id = ? AND user_id = ?
      ORDER BY turn_number DESC
      LIMIT 5
    `).bind(currentSessionId, user_id).all();
    
    // GPT-5 호출 (OpenAI 라이브러리 사용)
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || 'dummy-key',
      baseURL: env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
    });
    
    const messages: any[] = [{
      role: 'system',
      content: `당신은 알바천국의 전문 취업 멘토입니다. 따뜻하고 격려적이며 구체적인 조언을 제공합니다.`
    }];
    
    // 역순으로 추가 (오래된 것부터)
    const reversedHistory = (history.results || []).reverse();
    for (const conv of reversedHistory) {
      messages.push({ role: 'user', content: conv.user_message });
      messages.push({ role: 'assistant', content: conv.mentor_response });
    }
    
    messages.push({ role: 'user', content: message });
    
    const completion = await client.chat.completions.create({
      model: 'gpt-5',  // GenSpark LLM Proxy supported model
      messages,
      temperature: 0.7,
      max_tokens: 2000  // 응답 길이 증가
    });
    
    console.log('GPT Response:', JSON.stringify(completion, null, 2));
    
    const mentorResponse = completion.choices[0]?.message?.content?.trim() || '죄송합니다. 응답을 생성할 수 없습니다.';
    
    // 대화 저장
    const turnNumber = (history.results?.length || 0) + 1;
    await db.prepare(`
      INSERT INTO mentor_conversations (
        session_id, user_id, turn_number, user_message, mentor_response
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(currentSessionId, user_id, turnNumber, message, mentorResponse).run();
    
    // 세션 업데이트
    await db.prepare(`
      UPDATE mentor_sessions
      SET last_activity = CURRENT_TIMESTAMP,
          total_messages = total_messages + 1
      WHERE session_id = ?
    `).bind(currentSessionId).run();
    
    // 구독 사용량 업데이트
    await db.prepare(`
      UPDATE mentor_subscriptions
      SET total_messages_used = total_messages_used + 1
      WHERE subscription_id = ?
    `).bind(subscription.subscription_id).run();
    
    console.log(`✅ Mentor chat: ${user_id} → ${currentSessionId}`);
    
    // 남은 메시지 수 계산
    const messagesRemaining = subscription.message_limit 
      ? Math.max(0, subscription.message_limit - (messagesUsed + 1))
      : null; // null = 무제한
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        session_id: currentSessionId,
        mentor_response: mentorResponse,
        turn_number: turnNumber,
        subscription_status: 'active',
        expires_at: subscription.expires_at,
        messages_used: messagesUsed + 1,
        message_limit: subscription.message_limit,
        messages_remaining: messagesRemaining,
        plan: subscription.plan
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Mentor chat error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Chat failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
