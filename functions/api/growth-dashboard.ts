/**
 * 📊 사용자 성장 대시보드 API
 * 멘토링 진행 현황, 대화 통계, 성장 추이
 */

export async function onRequest(context: any) {
  const { request, env } = context;
  
  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const url = new URL(request.url);
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
    
    const db = env.DB;
    
    // 1. 구독 정보
    const subscription = await db.prepare(`
      SELECT * FROM mentor_subscriptions
      WHERE user_id = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `).bind(userId).first();
    
    // 2. 총 대화 수
    const totalConversations = await db.prepare(`
      SELECT COUNT(*) as count
      FROM mentor_conversations
      WHERE user_id = ?
    `).bind(userId).first();
    
    // 3. 총 세션 수
    const totalSessions = await db.prepare(`
      SELECT COUNT(*) as count
      FROM mentor_sessions
      WHERE user_id = ?
    `).bind(userId).first();
    
    // 4. 최근 7일 대화 추이
    const last7DaysActivity = await db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM mentor_conversations
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(userId).all();
    
    // 5. 최근 10개 대화
    const recentConversations = await db.prepare(`
      SELECT 
        mc.session_id,
        mc.turn_number,
        mc.user_message,
        mc.mentor_response,
        mc.created_at,
        ms.job_type
      FROM mentor_conversations mc
      LEFT JOIN mentor_sessions ms ON mc.session_id = ms.session_id
      WHERE mc.user_id = ?
      ORDER BY mc.created_at DESC
      LIMIT 10
    `).bind(userId).all();
    
    // 6. 활성 세션
    const activeSessions = await db.prepare(`
      SELECT *
      FROM mentor_sessions
      WHERE user_id = ? AND status = 'active'
      ORDER BY last_activity DESC
    `).bind(userId).all();
    
    // 7. 평균 응답 길이
    const avgResponseLength = await db.prepare(`
      SELECT AVG(LENGTH(mentor_response)) as avg_length
      FROM mentor_conversations
      WHERE user_id = ?
    `).bind(userId).first();
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        subscription: subscription || null,
        has_subscription: !!subscription,
        stats: {
          total_conversations: totalConversations?.count || 0,
          total_sessions: totalSessions?.count || 0,
          active_sessions: activeSessions?.results?.length || 0,
          avg_response_length: Math.round(avgResponseLength?.avg_length || 0)
        },
        activity: {
          last_7_days: last7DaysActivity?.results || []
        },
        recent_conversations: recentConversations?.results || [],
        active_sessions: activeSessions?.results || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Growth dashboard error:', error);
    
    // 빈 데이터 반환 (500 에러 대신 안전한 기본값)
    return new Response(JSON.stringify({
      success: true,
      data: {
        subscription: null,
        has_subscription: false,
        stats: {
          total_conversations: 0,
          total_sessions: 0,
          active_sessions: 0,
          avg_response_length: 0
        },
        activity: {
          last_7_days: []
        },
        recent_conversations: [],
        active_sessions: []
      },
      error: error?.message || 'Some data may be unavailable'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
