/**
 * 분석 스냅샷 API
 * Phase 8.2: 리플레이 시스템
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'session_id is required'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 분석 스냅샷 조회
        const { results } = await env.DB.prepare(`
            SELECT 
                timestamp_seconds,
                metrics,
                analysis_type
            FROM recording_analysis_snapshots
            WHERE session_id = ?
            ORDER BY timestamp_seconds ASC
        `).bind(sessionId).all();

        // JSON 파싱
        const snapshots = results.map(row => ({
            timestamp_seconds: row.timestamp_seconds,
            metrics: typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics,
            analysis_type: row.analysis_type
        }));

        return new Response(JSON.stringify({
            success: true,
            data: snapshots
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[analysis-snapshots] Error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
