/**
 * 사용자 성장 통계 API
 * GET /api/growth-stats?user_id=XXX
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');

    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. 면접 세션 통계
    const sessionStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        AVG(CASE WHEN status = 'completed' THEN total_score ELSE NULL END) as avg_score,
        AVG(CASE WHEN status = 'completed' THEN total_duration_seconds ELSE NULL END) as avg_duration
      FROM interview_sessions
      WHERE user_id = ?
    `).bind(user_id).first();

    // 2. 최근 10개 세션의 점수 추이
    const scoreHistory = await env.DB.prepare(`
      SELECT 
        session_id,
        job_type,
        total_score,
        question_count,
        status,
        started_at
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY started_at DESC
      LIMIT 10
    `).bind(user_id).all();

    // 3. 직무별 평균 점수
    const jobTypeStats = await env.DB.prepare(`
      SELECT 
        job_type,
        COUNT(*) as sessions_count,
        AVG(total_score) as avg_score,
        MAX(total_score) as best_score
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      GROUP BY job_type
      ORDER BY avg_score DESC
    `).bind(user_id).all();

    // 4. AI 멘토 세션 통계
    const mentorStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages,
        AVG(LENGTH(user_message)) as avg_message_length
      FROM mentor_conversations
      WHERE user_id = ?
    `).bind(user_id).first();

    // 5. 구독 정보
    const subscription = await env.DB.prepare(`
      SELECT 
        subscription_id,
        plan,
        status,
        started_at,
        expires_at,
        total_messages_used
      FROM mentor_subscriptions
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 1
    `).bind(user_id).first();

    // 6. 최근 7일간 활동 데이터
    const activityData = await env.DB.prepare(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as sessions_count
      FROM interview_sessions
      WHERE user_id = ? 
        AND started_at >= datetime('now', '-7 days')
      GROUP BY DATE(started_at)
      ORDER BY date DESC
    `).bind(user_id).all();

    // 7. 강점/약점 분석 (최근 5개 세션)
    const recentSessions = await env.DB.prepare(`
      SELECT 
        session_id,
        total_score,
        recommendation
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY started_at DESC
      LIMIT 5
    `).bind(user_id).all();

    // 강점/약점 키워드 추출
    const recommendations = recentSessions.results.map(s => s.recommendation || '').join(' ');
    const strengths = extractKeywords(recommendations, ['자신감', '명확', '구체적', '긍정적', '열정', '적극적']);
    const weaknesses = extractKeywords(recommendations, ['부족', '불명확', '개선', '보완', '연습', '준비']);

    return new Response(JSON.stringify({
      success: true,
      data: {
        user_id,
        interview_stats: {
          total_sessions: sessionStats?.total_sessions || 0,
          completed_sessions: sessionStats?.completed_sessions || 0,
          completion_rate: sessionStats?.total_sessions > 0 
            ? Math.round((sessionStats.completed_sessions / sessionStats.total_sessions) * 100) 
            : 0,
          avg_score: sessionStats?.avg_score 
            ? Math.round(sessionStats.avg_score * 10) / 10 
            : 0,
          avg_duration_minutes: sessionStats?.avg_duration 
            ? Math.round(sessionStats.avg_duration / 60) 
            : 0
        },
        score_history: scoreHistory.results.reverse().map(s => ({
          session_id: s.session_id,
          job_type: s.job_type,
          score: s.total_score,
          questions: s.question_count,
          date: new Date(s.started_at).toLocaleDateString('ko-KR')
        })),
        job_type_stats: jobTypeStats.results.map(j => ({
          job_type: j.job_type,
          sessions: j.sessions_count,
          avg_score: Math.round(j.avg_score * 10) / 10,
          best_score: j.best_score
        })),
        mentor_stats: {
          total_sessions: mentorStats?.total_sessions || 0,
          total_messages: mentorStats?.total_messages || 0,
          avg_message_length: mentorStats?.avg_message_length 
            ? Math.round(mentorStats.avg_message_length) 
            : 0
        },
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          expires_at: subscription.expires_at,
          messages_used: subscription.total_messages_used,
          days_left: Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        } : null,
        activity_data: activityData.results.map(a => ({
          date: a.date,
          sessions: a.sessions_count
        })),
        insights: {
          strengths: strengths.slice(0, 5),
          weaknesses: weaknesses.slice(0, 5),
          total_improvement: sessionStats?.completed_sessions >= 2
            ? Math.round((scoreHistory.results[scoreHistory.results.length - 1]?.total_score - scoreHistory.results[0]?.total_score) * 100) / 100
            : 0
        }
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('Growth stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// 키워드 추출 헬퍼 함수
function extractKeywords(text: string, keywords: string[]): string[] {
  const found: string[] = [];
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  });
  return found;
}
