/**
 * AI 스마트매칭 면접 결과 저장 API
 * 면접 결과를 D1 데이터베이스에 저장하고 마이페이지와 연동
 */

interface Env {
  DB: D1Database;
}

interface InterviewResult {
  user_id: string;
  job_type: string;
  final_grade: string;
  total_score: number;
  recommendation: string;
  strengths: string[];
  concerns: string[];
  conversation_data: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as InterviewResult;

    // 필수 필드 검증
    if (!body.user_id || !body.job_type) {
      return new Response(JSON.stringify({
        success: false,
        error: '필수 필드가 누락되었습니다 (user_id, job_type)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Save Interview] Saving result for user:', body.user_id);

    // 사용자가 실제로 DB에 존재하는지 확인
    let userId = body.user_id;
    try {
      const userCheck = await env.DB.prepare(`
        SELECT id FROM users WHERE id = ?
      `).bind(body.user_id).first();
      
      if (!userCheck) {
        console.log('[Save Interview] User not found in DB, setting user_id to NULL');
        userId = null; // DB에 없으면 NULL로 저장 (FOREIGN KEY 제약 우회)
      }
    } catch (err) {
      console.log('[Save Interview] User check failed, setting user_id to NULL');
      userId = null;
    }

    // interview_sessions 테이블에 저장
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await env.DB.prepare(`
      INSERT INTO interview_sessions (
        session_id,
        user_id,
        job_type,
        status,
        final_grade,
        total_score,
        recommendation,
        strengths,
        concerns,
        started_at,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      sessionId,
      userId,
      body.job_type,
      'completed',
      body.final_grade || 'C',
      body.total_score || 0,
      body.recommendation || '',
      JSON.stringify(body.strengths || []),
      JSON.stringify(body.concerns || [])
    ).run();

    console.log('[Save Interview] Saved successfully:', result);

    return new Response(JSON.stringify({
      success: true,
      data: {
        session_id: sessionId,
        user_id: body.user_id,
        saved_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[Save Interview] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: '면접 결과 저장 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};
