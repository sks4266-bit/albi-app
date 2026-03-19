/**
 * 면접 이력 조회 API
 * 사용자의 모든 면접 이력을 조회하고 통계 제공
 */

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const email = url.searchParams.get('email');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: '이메일이 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { DB } = context.env;

    // 1. 사용자 확인
    const user = await DB.prepare(
      'SELECT id, email, name, created_at FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          user: null,
          interviews: [],
          statistics: null
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. 면접 이력 조회
    const interviews = await DB.prepare(`
      SELECT 
        id, session_id, company_name, company_industry, position, key_requirements,
        started_at, ended_at, duration_seconds,
        video_score, answer_score, final_score, final_grade, hiring_probability,
        status, created_at
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    // 3. 전체 면접 수
    const totalCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM interview_sessions WHERE user_id = ? AND status = "completed"'
    ).bind(user.id).first();

    // 4. 통계 계산
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_interviews,
        AVG(final_score) as avg_score,
        MAX(final_score) as max_score,
        MIN(final_score) as min_score,
        AVG(video_score) as avg_video_score,
        AVG(answer_score) as avg_answer_score,
        SUM(duration_seconds) as total_duration
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
    `).bind(user.id).first();

    // 5. 회사별 통계
    const companiesStats = await DB.prepare(`
      SELECT 
        company_name,
        COUNT(*) as interview_count,
        AVG(final_score) as avg_score,
        MAX(final_score) as max_score
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      GROUP BY company_name
      ORDER BY interview_count DESC
      LIMIT 5
    `).bind(user.id).all();

    // 6. 최근 성장 추이 (최근 10개)
    const recentTrend = await DB.prepare(`
      SELECT 
        final_score,
        video_score,
        answer_score,
        company_name,
        position,
        created_at
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(user.id).all();

    // JSON 필드 파싱
    const parsedInterviews = interviews.results.map((interview: any) => ({
      ...interview,
      keyRequirements: JSON.parse(interview.key_requirements || '[]')
    }));

    const statistics = {
      totalInterviews: stats?.total_interviews || 0,
      avgScore: Math.round(stats?.avg_score || 0),
      maxScore: stats?.max_score || 0,
      minScore: stats?.min_score || 0,
      avgVideoScore: Math.round(stats?.avg_video_score || 0),
      avgAnswerScore: Math.round(stats?.avg_answer_score || 0),
      totalDuration: stats?.total_duration || 0,
      totalHours: Math.floor((stats?.total_duration || 0) / 3600),
      companiesStats: companiesStats.results,
      recentTrend: recentTrend.results.map((t: any) => ({
        score: t.final_score,
        videoScore: t.video_score,
        answerScore: t.answer_score,
        company: t.company_name,
        position: t.position,
        date: t.created_at
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          memberSince: user.created_at
        },
        interviews: parsedInterviews,
        pagination: {
          total: totalCount?.count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount?.count || 0)
        },
        statistics
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[InterviewHistory] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '면접 이력 조회 실패'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
