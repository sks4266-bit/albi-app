/**
 * 📈 면접 데이터 분석 API
 * 완료율, 평균 점수 추이, 이탈률, 등급 분포 등 심층 분석
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  console.log('📈 Interview analytics API called');
  
  try {
    const db = context.env.DB;
    const now = new Date().toISOString();
    
    // 1. 면접 완료율 (24시간)
    const completionStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_started,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
    `).first();
    
    const totalStarted = completionStats?.total_started || 0;
    const completed = completionStats?.completed || 0;
    const rejected = completionStats?.rejected || 0;
    const completionRate = totalStarted > 0 ? (completed / totalStarted * 100).toFixed(1) : 0;
    
    // 2. 평균 점수 추이 (최근 7일, 일별)
    const scoresTrend = await db.prepare(`
      SELECT 
        date(started_at) as date,
        AVG(total_score) as avg_score,
        COUNT(*) as count
      FROM interview_sessions
      WHERE started_at > datetime('now', '-7 days')
        AND status = 'completed'
      GROUP BY date(started_at)
      ORDER BY date
    `).all();
    
    // 3. 이탈률 분석 (질문 단계별)
    const dropoffAnalysis = await db.prepare(`
      SELECT 
        question_count,
        COUNT(*) as session_count,
        AVG(total_score) as avg_score_at_dropoff
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
        AND status != 'completed'
        AND question_count < 15
      GROUP BY question_count
      ORDER BY question_count
    `).all();
    
    // 4. 등급별 상세 통계 (24시간)
    const gradeStats = await db.prepare(`
      SELECT 
        final_grade,
        COUNT(*) as count,
        AVG(total_score) as avg_score,
        AVG(total_duration_seconds) as avg_duration,
        AVG(question_count) as avg_questions
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
        AND status = 'completed'
      GROUP BY final_grade
      ORDER BY 
        CASE final_grade
          WHEN 'S' THEN 1
          WHEN 'A' THEN 2
          WHEN 'B' THEN 3
          WHEN 'C' THEN 4
          WHEN 'D' THEN 5
          ELSE 6
        END
    `).all();
    
    // 5. 직무별 성과 비교 (24시간)
    const jobPerformance = await db.prepare(`
      SELECT 
        job_type,
        COUNT(*) as total_interviews,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE WHEN status = 'completed' THEN total_score ELSE NULL END) as avg_score,
        AVG(CASE WHEN status = 'completed' THEN total_duration_seconds ELSE NULL END) as avg_duration
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
      GROUP BY job_type
      ORDER BY total_interviews DESC
    `).all();
    
    // 6. 시간대별 면접 활동 (24시간)
    const hourlyActivity = await db.prepare(`
      SELECT 
        strftime('%H', started_at) as hour,
        COUNT(*) as interviews,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour
    `).all();
    
    // 7. 최고/최저 점수 면접 (24시간)
    const topInterviews = await db.prepare(`
      SELECT 
        session_id,
        job_type,
        final_grade,
        total_score,
        started_at
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
        AND status = 'completed'
      ORDER BY total_score DESC
      LIMIT 5
    `).all();
    
    const worstInterviews = await db.prepare(`
      SELECT 
        session_id,
        job_type,
        final_grade,
        total_score,
        started_at
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
        AND status = 'completed'
      ORDER BY total_score ASC
      LIMIT 5
    `).all();
    
    // 8. 평균 질문 응답 시간 (conversation 테이블 분석)
    const avgResponseTime = await db.prepare(`
      SELECT AVG(response_time_ms) as avg_ms
      FROM interview_conversations
      WHERE created_at > datetime('now', '-24 hours')
        AND turn_number > 0
    `).first();
    
    const analytics = {
      timestamp: now,
      period: '24h',
      completion: {
        total_started: totalStarted,
        completed: completed,
        rejected: rejected,
        in_progress: totalStarted - completed - rejected,
        completion_rate: parseFloat(completionRate)
      },
      scores_trend: {
        daily: scoresTrend?.results || []
      },
      dropoff_analysis: dropoffAnalysis?.results || [],
      grade_stats: gradeStats?.results || [],
      job_performance: jobPerformance?.results || [],
      hourly_activity: hourlyActivity?.results || [],
      top_interviews: topInterviews?.results || [],
      worst_interviews: worstInterviews?.results || [],
      avg_response_time_seconds: Math.round((avgResponseTime?.avg_ms || 0) / 1000)
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: analytics
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Analytics error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Failed to fetch analytics'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
