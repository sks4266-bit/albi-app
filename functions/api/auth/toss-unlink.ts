import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
  TOSS_CLIENT_ID: string
  TOSS_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/auth')

app.use('/*', cors())

// ========================================
// 🔓 토스 앱인토스 연동 해제 콜백
// ========================================
// 앱인토스에서 사용자가 연동 해제 시 호출되는 웹훅
app.post('/toss-unlink', async (c) => {
  try {
    // Basic Auth 검증
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('[Toss Unlink] Missing or invalid Authorization header')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    // Basic Auth 디코딩
    const base64Credentials = authHeader.substring(6) // "Basic " 제거
    const credentials = atob(base64Credentials)
    const [clientId, clientSecret] = credentials.split(':')
    
    // 클라이언트 ID/Secret 검증
    if (clientId !== c.env.TOSS_CLIENT_ID || clientSecret !== c.env.TOSS_CLIENT_SECRET) {
      console.error('[Toss Unlink] Invalid credentials')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    // 요청 본문 파싱 (앱인토스는 GET 파라미터 또는 POST body로 전달)
    let userKey: string | null = null
    
    // POST 방식: body에서 userKey 추출
    if (c.req.method === 'POST') {
      const contentType = c.req.header('Content-Type') || ''
      
      if (contentType.includes('application/json')) {
        const body = await c.req.json()
        userKey = body.userKey || body.user_key || body.id
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.formData()
        userKey = formData.get('userKey') as string || formData.get('user_key') as string
      }
    }
    
    // GET 방식: query parameter에서 userKey 추출 (fallback)
    if (!userKey) {
      userKey = c.req.query('userKey') || c.req.query('user_key')
    }
    
    console.log('[Toss Unlink] Request received:', { userKey, method: c.req.method })
    
    if (!userKey) {
      console.error('[Toss Unlink] Missing userKey')
      return c.json({ success: false, error: 'Missing userKey' }, 400)
    }
    
    // DB에서 사용자 찾기
    const user = await c.env.DB.prepare(`
      SELECT id, name, email FROM users WHERE toss_user_key = ?
    `).bind(userKey).first()
    
    if (!user) {
      console.warn('[Toss Unlink] User not found:', userKey)
      // 사용자가 없어도 성공 응답 (토스는 이미 연동 해제함)
      return c.json({ success: true, message: 'User not found but unlink accepted' })
    }
    
    console.log('[Toss Unlink] User found:', user.id, user.name)
    
    // 토스 userKey 제거 (NULL로 설정)
    await c.env.DB.prepare(`
      UPDATE users SET toss_user_key = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()
    
    console.log('✅ [Toss Unlink] Successfully unlinked:', user.id)
    
    // 해당 사용자의 모든 세션 삭제
    await c.env.DB.prepare(`
      DELETE FROM sessions WHERE user_id = ?
    `).bind(user.id).run()
    
    console.log('✅ [Toss Unlink] Sessions deleted:', user.id)
    
    return c.json({
      success: true,
      message: 'Toss account unlinked successfully',
      user_id: user.id
    })
    
  } catch (error: any) {
    console.error('[Toss Unlink] Error:', error)
    return c.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, 500)
  }
})

// GET 방식도 지원 (앱인토스 콘솔에서 선택 가능)
app.get('/toss-unlink', async (c) => {
  try {
    // Basic Auth 검증
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('[Toss Unlink GET] Missing or invalid Authorization header')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    // Basic Auth 디코딩
    const base64Credentials = authHeader.substring(6)
    const credentials = atob(base64Credentials)
    const [clientId, clientSecret] = credentials.split(':')
    
    // 클라이언트 ID/Secret 검증
    if (clientId !== c.env.TOSS_CLIENT_ID || clientSecret !== c.env.TOSS_CLIENT_SECRET) {
      console.error('[Toss Unlink GET] Invalid credentials')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    // Query parameter에서 userKey 추출
    const userKey = c.req.query('userKey') || c.req.query('user_key')
    
    console.log('[Toss Unlink GET] Request received:', { userKey })
    
    if (!userKey) {
      console.error('[Toss Unlink GET] Missing userKey')
      return c.json({ success: false, error: 'Missing userKey' }, 400)
    }
    
    // DB에서 사용자 찾기
    const user = await c.env.DB.prepare(`
      SELECT id, name, email FROM users WHERE toss_user_key = ?
    `).bind(userKey).first()
    
    if (!user) {
      console.warn('[Toss Unlink GET] User not found:', userKey)
      return c.json({ success: true, message: 'User not found but unlink accepted' })
    }
    
    console.log('[Toss Unlink GET] User found:', user.id, user.name)
    
    // 토스 userKey 제거
    await c.env.DB.prepare(`
      UPDATE users SET toss_user_key = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()
    
    console.log('✅ [Toss Unlink GET] Successfully unlinked:', user.id)
    
    // 세션 삭제
    await c.env.DB.prepare(`
      DELETE FROM sessions WHERE user_id = ?
    `).bind(user.id).run()
    
    console.log('✅ [Toss Unlink GET] Sessions deleted:', user.id)
    
    return c.json({
      success: true,
      message: 'Toss account unlinked successfully',
      user_id: user.id
    })
    
  } catch (error: any) {
    console.error('[Toss Unlink GET] Error:', error)
    return c.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, 500)
  }
})

export const onRequest = handle(app)
