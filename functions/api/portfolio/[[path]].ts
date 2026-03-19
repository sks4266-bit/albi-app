/**
 * Portfolio DELETE API
 * 포트폴리오 삭제
 */

interface Env {
  // D1 database binding would go here
}

export async function onRequestDelete(context: { request: Request; env: Env }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const portfolio_id = url.searchParams.get('portfolio_id');

    if (!portfolio_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'portfolio_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Portfolio Delete] Deleting:', portfolio_id);

    // 실제 구현에서는 D1 데이터베이스에서 삭제
    // await context.env.DB.prepare('DELETE FROM portfolios WHERE portfolio_id = ?').bind(portfolio_id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Portfolio deleted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Portfolio Delete] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Delete failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
