/**
 * 마이페이지 통계 API
 * GET /api/mypage/stats?user_id=xxx
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'user_id is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 멘토 대화 수 (이번 달)
    const mentorChatsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM mentor_subscriptions
      WHERE user_id = ?
        AND strftime('%Y-%m', started_at) = strftime('%Y-%m', 'now')
    `).bind(userId).first();
    
    const mentorChats = mentorChatsResult?.count || 0;

    // 면접 횟수 (누적)
    const interviewsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM interview_sessions
      WHERE user_id = ?
    `).bind(userId).first();
    
    const interviews = interviewsResult?.count || 0;

    // 평균 점수
    const avgScoreResult = await env.DB.prepare(`
      SELECT AVG(total_score) as avg
      FROM interview_sessions
      WHERE user_id = ? AND total_score > 0
    `).bind(userId).first();
    
    const avgScore = avgScoreResult?.avg || 0;

    // 성장률 (지난 달 대비) - 평균 점수 기준
    const lastMonthScoreResult = await env.DB.prepare(`
      SELECT AVG(total_score) as avg
      FROM interview_sessions
      WHERE user_id = ?
        AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now', '-1 month')
    `).bind(userId).first();
    
    const lastMonthScore = lastMonthScoreResult?.avg || avgScore;
    const growthRate = lastMonthScore > 0 
      ? Math.round(((avgScore - lastMonthScore) / lastMonthScore) * 100)
      : 0;

    return new Response(JSON.stringify({
      success: true,
      stats: {
        mentor_chats: mentorChats,
        interviews: interviews,
        avg_score: avgScore,
        growth_rate: growthRate
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to load statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
