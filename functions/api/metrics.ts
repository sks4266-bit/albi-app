/**
 * Performance Metrics API
 * Collects and stores performance metrics from the client
 */

interface Env {
  DB: D1Database;
}

interface MetricData {
  metric?: string;  // From performance-monitor.js
  metric_type?: string;  // Alternative field name
  value: number;
  grade?: string;
  url?: string;
  userAgent?: string;  // From performance-monitor.js
  user_agent?: string;  // Alternative field name
  timestamp: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // Parse request body
    const body = await request.json() as MetricData;
    
    // Support both field names (metric or metric_type)
    const metricType = body.metric || body.metric_type;
    
    // Validate required fields
    if (!metricType || body.value === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: metric/metric_type, value'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract metadata (support both field names)
    const url = body.url || new URL(request.url).pathname;
    const userAgent = body.userAgent || body.user_agent || request.headers.get('User-Agent') || 'Unknown';
    const timestamp = body.timestamp || Date.now();

    // Store in D1 database (create table if not exists)
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          value REAL NOT NULL,
          grade TEXT,
          url TEXT,
          user_agent TEXT,
          timestamp INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      await env.DB.prepare(`
        INSERT INTO performance_metrics (metric_type, value, grade, url, user_agent, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        metricType,
        body.value,
        body.grade || null,
        url,
        userAgent,
        timestamp
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Metric recorded successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (dbError) {
      console.error('[Metrics API] Database error:', dbError);
      
      // Return success even if DB fails (don't break the app)
      return new Response(JSON.stringify({
        success: true,
        message: 'Metric received (DB unavailable)'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};
