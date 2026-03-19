/**
 * 📊 세션 통계 API
 * D1에 저장된 면접 세션 통계 제공
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  console.log('📊 Session stats API called');
  
  try {
    const db = context.env.DB;
    const now = new Date().toISOString();
    
    // 1. 활성 세션 수 (아직 만료되지 않음)
    const activeSessions = await db.prepare(`
      SELECT COUNT(*) as count
      FROM interview_session_cache
      WHERE expires_at > datetime('now')
    `).first();
    
    // 2. 최근 1시간 생성된 세션 수
    const recentSessions = await db.prepare(`
      SELECT COUNT(*) as count
      FROM interview_session_cache
      WHERE json_extract(engine_state, '$.createdAt') > datetime('now', '-1 hour')
    `).first();
    
    // 3. 직무별 세션 분포
    const jobTypeDistribution = await db.prepare(`
      SELECT 
        json_extract(engine_state, '$.jobType') as job_type,
        COUNT(*) as count
      FROM interview_session_cache
      WHERE expires_at > datetime('now')
      GROUP BY job_type
    `).all();
    
    // 4. 진행 단계별 분포
    const progressDistribution = await db.prepare(`
      SELECT 
        json_extract(engine_state, '$.questionCount') as question_count,
        COUNT(*) as count
      FROM interview_session_cache
      WHERE expires_at > datetime('now')
      GROUP BY question_count
      ORDER BY CAST(question_count AS INTEGER)
    `).all();
    
    // 5. 최근 10개 활성 세션
    const recentActiveSessions = await db.prepare(`
      SELECT 
        session_id,
        json_extract(engine_state, '$.jobType') as job_type,
        json_extract(engine_state, '$.questionCount') as question_count,
        json_extract(engine_state, '$.createdAt') as created_at,
        json_extract(engine_state, '$.lastActivity') as last_activity,
        expires_at
      FROM interview_session_cache
      WHERE expires_at > datetime('now')
      ORDER BY json_extract(engine_state, '$.lastActivity') DESC
      LIMIT 10
    `).all();
    
    // 6. 전체 세션 통계 (interview_sessions 테이블)
    const completedInterviews = await db.prepare(`
      SELECT COUNT(*) as count
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
    `).first();
    
    // 7. 등급별 분포 (최근 24시간)
    const gradeDistribution = await db.prepare(`
      SELECT 
        final_grade,
        COUNT(*) as count
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
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
    
    // 8. 평균 면접 시간 (완료된 면접)
    const avgDuration = await db.prepare(`
      SELECT AVG(total_duration_seconds) as avg_seconds
      FROM interview_sessions
      WHERE started_at > datetime('now', '-24 hours')
        AND status = 'completed'
    `).first();
    
    const stats = {
      timestamp: now,
      active_sessions: {
        total: activeSessions?.count || 0,
        recent_1h: recentSessions?.count || 0
      },
      job_type_distribution: jobTypeDistribution?.results || [],
      progress_distribution: progressDistribution?.results || [],
      recent_active_sessions: recentActiveSessions?.results || [],
      completed_interviews_24h: completedInterviews?.count || 0,
      grade_distribution_24h: gradeDistribution?.results || [],
      avg_interview_duration_seconds: Math.round(avgDuration?.avg_seconds || 0)
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Session stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Failed to fetch session stats'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
