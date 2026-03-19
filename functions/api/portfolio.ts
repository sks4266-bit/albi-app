/**
 * 포트폴리오 관리 API
 * POST /api/portfolio - 포트폴리오 생성/업데이트
 * GET /api/portfolio?user_id=XXX - 포트폴리오 목록 조회
 * GET /api/portfolio?portfolio_id=XXX - 특정 포트폴리오 조회
 */

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
}

interface PortfolioData {
  user_id: string;
  portfolio_id?: string; // 업데이트 시
  title: string;
  portfolio_type: 'resume' | 'cover_letter' | 'project_description' | 'self_introduction';
  template_id?: string;
  content: any; // JSON 객체
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // GET: 포트폴리오 조회
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const user_id = url.searchParams.get('user_id');
      const portfolio_id = url.searchParams.get('portfolio_id');

      // 특정 포트폴리오 조회
      if (portfolio_id) {
        const portfolio = await env.DB.prepare(`
          SELECT * FROM mentor_portfolios
          WHERE portfolio_id = ? AND status != 'deleted'
        `).bind(portfolio_id).first();

        if (!portfolio) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Portfolio not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // 최신 리뷰 조회
        const latestReview = await env.DB.prepare(`
          SELECT * FROM portfolio_reviews
          WHERE portfolio_id = ?
          ORDER BY reviewed_at DESC
          LIMIT 1
        `).bind(portfolio_id).first();

        return new Response(JSON.stringify({
          success: true,
          data: {
            ...portfolio,
            content: JSON.parse(portfolio.content),
            latest_review: latestReview ? {
              ...latestReview,
              improvements: JSON.parse(latestReview.improvements || '[]')
            } : null
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 사용자별 포트폴리오 목록 조회
      if (user_id) {
        const portfolios = await env.DB.prepare(`
          SELECT 
            p.*,
            r.score as latest_score,
            r.reviewed_at as latest_review_date
          FROM mentor_portfolios p
          LEFT JOIN portfolio_reviews r ON p.portfolio_id = r.portfolio_id
          WHERE p.user_id = ? AND p.status != 'deleted'
          GROUP BY p.portfolio_id
          ORDER BY p.updated_at DESC
        `).bind(user_id).all();

        return new Response(JSON.stringify({
          success: true,
          data: {
            portfolios: portfolios.results.map(p => ({
              ...p,
              content: JSON.parse(p.content),
              latest_score: p.latest_score,
              latest_review_date: p.latest_review_date
            }))
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'user_id or portfolio_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (error: any) {
      console.error('Get portfolio error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // POST: 포트폴리오 생성/업데이트
  if (request.method === 'POST') {
    try {
      const body = await request.json() as PortfolioData;
      const { user_id, portfolio_id, title, portfolio_type, template_id, content } = body;

      if (!user_id || !title || !portfolio_type || !content) {
        return new Response(JSON.stringify({
          success: false,
          error: 'user_id, title, portfolio_type, content are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const contentJson = JSON.stringify(content);
      const now = new Date().toISOString();

      // 업데이트
      if (portfolio_id) {
        const existing = await env.DB.prepare(`
          SELECT * FROM mentor_portfolios WHERE portfolio_id = ?
        `).bind(portfolio_id).first();

        if (!existing) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Portfolio not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const newVersion = (existing.version || 1) + 1;

        // 버전 히스토리 저장
        const version_id = 'ver_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await env.DB.prepare(`
          INSERT INTO portfolio_versions (
            version_id, portfolio_id, version_number, content, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(version_id, portfolio_id, existing.version, existing.content, now).run();

        // 포트폴리오 업데이트
        await env.DB.prepare(`
          UPDATE mentor_portfolios
          SET title = ?, content = ?, version = ?, updated_at = ?
          WHERE portfolio_id = ?
        `).bind(title, contentJson, newVersion, now, portfolio_id).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Portfolio updated successfully',
          portfolio_id: portfolio_id,
          version: newVersion
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 신규 생성
      const newPortfolioId = 'pf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      await env.DB.prepare(`
        INSERT INTO mentor_portfolios (
          portfolio_id, user_id, title, portfolio_type,
          template_id, content, version, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 'draft', ?, ?)
      `).bind(
        newPortfolioId,
        user_id,
        title,
        portfolio_type,
        template_id || null,
        contentJson,
        now,
        now
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Portfolio created successfully',
        portfolio_id: newPortfolioId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (error: any) {
      console.error('Create/Update portfolio error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // DELETE: 포트폴리오 삭제
  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const portfolio_id = url.searchParams.get('portfolio_id');

      if (!portfolio_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'portfolio_id is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 먼저 포트폴리오 존재 확인
      const existing = await env.DB.prepare(`
        SELECT portfolio_id, status FROM mentor_portfolios WHERE portfolio_id = ?
      `).bind(portfolio_id).first();

      if (!existing) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Portfolio not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      console.log('[DELETE] Found portfolio:', existing);

      // 소프트 삭제: status를 'deleted'로 변경
      const updateResult = await env.DB.prepare(`
        UPDATE mentor_portfolios 
        SET status = 'deleted', updated_at = ?
        WHERE portfolio_id = ?
      `).bind(new Date().toISOString(), portfolio_id).run();

      console.log('[DELETE] Update result:', {
        success: updateResult.success,
        changes: updateResult.meta?.changes,
        lastRowId: updateResult.meta?.last_row_id
      });

      // 업데이트 확인
      const verifyUpdated = await env.DB.prepare(`
        SELECT portfolio_id, status FROM mentor_portfolios WHERE portfolio_id = ?
      `).bind(portfolio_id).first();

      console.log('[DELETE] Verification:', verifyUpdated);

      if (!verifyUpdated || verifyUpdated.status !== 'deleted') {
        console.error('[DELETE] Update failed! Current status:', verifyUpdated?.status);
        return new Response(JSON.stringify({
          success: false,
          error: 'Delete operation failed - status not updated'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      console.log('[DELETE] Successfully marked as deleted:', portfolio_id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Portfolio deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (error: any) {
      console.error('Delete portfolio error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
};
