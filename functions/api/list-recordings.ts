/**
 * 면접 녹화 목록 조회 API
 * - 사용자별 녹화 목록
 * - 페이지네이션 지원
 * - 필터링 & 정렬
 */

interface RecordingListRequest {
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'size' | 'duration';
  order?: 'asc' | 'desc';
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (context.request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const order = url.searchParams.get('order') || 'desc';
    
    const offset = (page - 1) * limit;

    // 정렬 컬럼 매핑
    const sortColumn: Record<string, string> = {
      date: 'created_at',
      size: 'size',
      duration: 'duration'
    };

    const column = sortColumn[sortBy] || 'created_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';

    // 총 개수 조회
    const countResult = await context.env.DB
      .prepare('SELECT COUNT(*) as total FROM interview_recordings WHERE user_id = ?')
      .bind(userId)
      .first() as { total: number };

    const total = countResult?.total || 0;

    // 녹화 목록 조회
    const recordings = await context.env.DB
      .prepare(`
        SELECT 
          r.recording_id,
          r.session_id,
          r.filename,
          r.content_type,
          r.size,
          r.duration,
          r.created_at,
          s.company_name,
          s.position,
          s.final_score,
          s.final_grade
        FROM interview_recordings r
        LEFT JOIN interview_sessions s ON r.session_id = s.session_id
        WHERE r.user_id = ?
        ORDER BY r.${column} ${orderDir}
        LIMIT ? OFFSET ?
      `)
      .bind(userId, limit, offset)
      .all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        recordings: recordings.results || [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch recordings:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch recordings'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
