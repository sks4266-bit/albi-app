/**
 * 📥 CSV 데이터 내보내기 API
 * 면접 세션 데이터를 CSV 형식으로 다운로드
 */

interface Env {
  DB: D1Database;
}

// 토큰 검증 함수
function validateToken(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token));
    const age = Date.now() - decoded.timestamp;
    return age < 24 * 60 * 60 * 1000; // 24시간
  } catch {
    return false;
  }
}

// CSV 변환 함수
function toCSV(headers: string[], rows: any[][]): string {
  const csvHeaders = headers.join(',');
  const csvRows = rows.map(row => 
    row.map(cell => {
      // 셀에 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
  
  return `\uFEFF${csvHeaders}\n${csvRows}`; // UTF-8 BOM 추가
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  console.log('📥 CSV export request');
  
  try {
    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (!validateToken(token)) {
      return new Response('Token expired', { status: 401 });
    }
    
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'sessions';
    const days = parseInt(url.searchParams.get('days') || '7');
    
    if (type === 'sessions') {
      // 면접 세션 데이터
      const result = await db.prepare(`
        SELECT 
          session_id,
          user_id,
          job_type,
          region,
          expected_wage,
          final_grade,
          total_score,
          question_count,
          total_duration_seconds,
          status,
          recommendation,
          one_liner,
          started_at,
          completed_at
        FROM interview_sessions
        WHERE started_at > datetime('now', '-${days} days')
        ORDER BY started_at DESC
      `).all();
      
      const headers = [
        'Session ID',
        'User ID',
        'Job Type',
        'Region',
        'Expected Wage',
        'Grade',
        'Total Score',
        'Questions',
        'Duration (sec)',
        'Status',
        'Recommendation',
        'One Liner',
        'Started At',
        'Completed At'
      ];
      
      const rows = result.results.map((row: any) => [
        row.session_id,
        row.user_id,
        row.job_type,
        row.region || '',
        row.expected_wage || '',
        row.final_grade || '',
        row.total_score || '',
        row.question_count || '',
        row.total_duration_seconds || '',
        row.status || '',
        row.recommendation || '',
        row.one_liner || '',
        row.started_at || '',
        row.completed_at || ''
      ]);
      
      const csv = toCSV(headers, rows);
      const filename = `interview_sessions_${days}days_${new Date().toISOString().split('T')[0]}.csv`;
      
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } else if (type === 'conversations') {
      // 대화 데이터
      const result = await db.prepare(`
        SELECT 
          session_id,
          user_id,
          user_type,
          job_type,
          turn_number,
          question,
          answer,
          ai_response,
          score,
          response_time_ms,
          created_at
        FROM interview_conversations
        WHERE created_at > datetime('now', '-${days} days')
        ORDER BY created_at DESC
        LIMIT 10000
      `).all();
      
      const headers = [
        'Session ID',
        'User ID',
        'User Type',
        'Job Type',
        'Turn',
        'Question',
        'Answer',
        'AI Response',
        'Score',
        'Response Time (ms)',
        'Created At'
      ];
      
      const rows = result.results.map((row: any) => [
        row.session_id,
        row.user_id,
        row.user_type,
        row.job_type,
        row.turn_number,
        row.question || '',
        row.answer || '',
        row.ai_response || '',
        row.score || '',
        row.response_time_ms || '',
        row.created_at || ''
      ]);
      
      const csv = toCSV(headers, rows);
      const filename = `interview_conversations_${days}days_${new Date().toISOString().split('T')[0]}.csv`;
      
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid type. Use "sessions" or "conversations"'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ CSV export error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Export failed'
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
