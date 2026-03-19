/**
 * 사용자 피드백 API
 * POST /api/feedback
 */

export async function onRequest(context) {
  const { request, env } = context;

  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // POST만 허용
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { rating, comment, url, timestamp, userAgent } = await request.json();

    // 유효성 검사
    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid rating (must be 1-5)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // D1 데이터베이스에 저장
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    await env.DB.prepare(`
      INSERT INTO user_feedback (
        feedback_id,
        rating,
        comment,
        url,
        timestamp,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      feedbackId,
      rating,
      comment || null,
      url || null,
      timestamp || Date.now(),
      userAgent || null
    ).run();

    // 낮은 평점의 경우 즉시 알림 (선택사항)
    if (rating <= 2) {
      // TODO: 이메일 또는 Slack 알림
      console.log('[Feedback] Low rating alert:', { rating, comment, url });
    }

    return new Response(JSON.stringify({ 
      success: true,
      feedback_id: feedbackId,
      message: 'Thank you for your feedback!'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Feedback API] Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to save feedback',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
