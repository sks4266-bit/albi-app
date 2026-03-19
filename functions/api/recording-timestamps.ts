/**
 * 녹화 타임스탬프 API
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
        // 타임스탬프 조회
        const { results } = await env.DB.prepare(`
            SELECT 
                timestamp_seconds,
                question_index,
                question_text,
                event_type,
                event_data
            FROM recording_timestamps
            WHERE session_id = ?
            ORDER BY timestamp_seconds ASC
        `).bind(sessionId).all();

        return new Response(JSON.stringify({
            success: true,
            data: results || []
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[recording-timestamps] Error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
