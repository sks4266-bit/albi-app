/**
 * 🔍 세션 상세 조회 API
 * 개별 세션의 모든 대화 내역과 상세 정보 조회
 */

interface Env {
  DB: D1Database;
}

// 토큰 검증 함수
function validateToken(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token));
    const age = Date.now() - decoded.timestamp;
    return age < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  console.log('🔍 Session detail request');
  
  try {
    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: '인증이 필요합니다'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const token = authHeader.substring(7);
    if (!validateToken(token)) {
      return new Response(JSON.stringify({
        success: false,
        message: '토큰이 만료되었습니다'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'session_id가 필요합니다'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 1. 세션 기본 정보
    const session = await db.prepare(`
      SELECT 
        session_id,
        user_id,
        job_type,
        region,
        expected_wage,
        final_grade,
        total_score,
        final_scores_json,
        question_count,
        total_duration_seconds,
        completion_rate,
        status,
        recommendation,
        strengths,
        concerns,
        one_liner,
        critical_reason,
        started_at,
        completed_at
      FROM interview_sessions
      WHERE session_id = ?
    `).bind(sessionId).first();
    
    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        message: '세션을 찾을 수 없습니다'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 2. 대화 내역
    const conversations = await db.prepare(`
      SELECT 
        id,
        turn_number,
        question,
        answer,
        ai_response,
        score,
        evaluation_json,
        response_time_ms,
        created_at
      FROM interview_conversations
      WHERE session_id = ?
      ORDER BY turn_number ASC
    `).bind(sessionId).all();
    
    // 3. 캐시된 엔진 상태 (활성 세션인 경우)
    let engineState = null;
    if (session.status === 'in_progress') {
      const cache = await db.prepare(`
        SELECT engine_state, last_activity
        FROM interview_session_cache
        WHERE session_id = ?
      `).bind(sessionId).first();
      
      if (cache) {
        try {
          engineState = JSON.parse(cache.engine_state as string);
        } catch (e) {
          console.error('Engine state parse error:', e);
        }
      }
    }
    
    // JSON 파싱
    let finalScores = {};
    try {
      if (session.final_scores_json) {
        finalScores = JSON.parse(session.final_scores_json as string);
      }
    } catch (e) {
      console.error('Scores parse error:', e);
    }
    
    const detail = {
      session: {
        ...session,
        final_scores: finalScores,
        strengths: session.strengths ? session.strengths.split(',') : [],
        concerns: session.concerns ? session.concerns.split(',') : []
      },
      conversations: conversations.results.map((conv: any) => {
        let evaluation = {};
        try {
          if (conv.evaluation_json) {
            evaluation = JSON.parse(conv.evaluation_json);
          }
        } catch (e) {
          console.error('Evaluation parse error:', e);
        }
        
        return {
          ...conv,
          evaluation
        };
      }),
      engine_state: engineState,
      statistics: {
        total_questions: conversations.results.length,
        avg_response_time: conversations.results.length > 0
          ? Math.round(
              conversations.results.reduce((sum: number, c: any) => sum + (c.response_time_ms || 0), 0) /
              conversations.results.length
            )
          : 0,
        avg_score: conversations.results.length > 0
          ? (
              conversations.results.reduce((sum: number, c: any) => sum + (c.score || 0), 0) /
              conversations.results.length
            ).toFixed(2)
          : 0
      }
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: detail
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Session detail error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Failed to fetch session detail'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
