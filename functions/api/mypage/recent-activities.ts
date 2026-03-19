/**
 * 최근 활동 API
 * GET /api/mypage/recent-activities?user_id=xxx&limit=5
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const limit = parseInt(url.searchParams.get('limit') || '10');

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
    const activities: any[] = [];

    // 1. 최근 면접 세션
    const interviews = await env.DB.prepare(`
      SELECT 
        'interview' as type,
        id,
        job_type as title,
        completed_at as created_at,
        'fa-video' as icon
      FROM interview_sessions
      WHERE user_id = ?
        AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    if (interviews.results) {
      interviews.results.forEach((item: any) => {
        activities.push({
          type: item.type,
          title: `${item.title} 면접 완료`,
          created_at: item.created_at,
          icon: item.icon
        });
      });
    }

    // 시간순 정렬
    activities.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // 제한된 개수만 반환
    const limitedActivities = activities.slice(0, limit);

    return new Response(JSON.stringify({
      success: true,
      activities: limitedActivities,
      total: activities.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Recent activities API error:', error);
    
    // 에러 시 빈 배열 반환 (graceful degradation)
    return new Response(JSON.stringify({
      success: true,
      activities: [],
      total: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
