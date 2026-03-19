import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/auth')

app.use('/*', cors())

// ========================================
// 🔓 네이버 앱 연동 해제 콜백
// ========================================
// 네이버 앱인증 서비스에서 사용자가 연동 해제 시 호출되는 웹훅
app.post('/naver-unlink', async (c) => {
  try {
    // Basic Auth 검증
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('[Naver Unlink] Missing or invalid Authorization header')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    // Basic Auth 디코딩
    const base64Credentials = authHeader.substring(6) // "Basic " 제거
    const credentials = atob(base64Credentials)
    const [clientId, clientSecret] = credentials.split(':')
    
    // 클라이언트 ID/Secret 검증
    if (clientId !== c.env.NAVER_CLIENT_ID || clientSecret !== c.env.NAVER_CLIENT_SECRET) {
      console.error('[Naver Unlink] Invalid credentials')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    
    // 요청 본문 파싱
    const body = await c.req.json()
    const naverId = body.user_id || body.id || body.naver_id
    
    console.log('[Naver Unlink] Request received:', { naverId })
    
    if (!naverId) {
      console.error('[Naver Unlink] Missing user_id')
      return c.json({ success: false, error: 'Missing user_id' }, 400)
    }
    
    // DB에서 사용자 찾기
    const user = await c.env.DB.prepare(`
      SELECT id, name, email FROM users WHERE naver_id = ?
    `).bind(naverId).first()
    
    if (!user) {
      console.warn('[Naver Unlink] User not found:', naverId)
      // 사용자가 없어도 성공 응답 (네이버는 이미 연동 해제함)
      return c.json({ success: true, message: 'User not found but unlink accepted' })
    }
    
    console.log('[Naver Unlink] User found:', user.id, user.name)
    
    // 네이버 ID 제거 (NULL로 설정)
    await c.env.DB.prepare(`
      UPDATE users SET naver_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()
    
    console.log('✅ [Naver Unlink] Successfully unlinked:', user.id)
    
    // 해당 사용자의 모든 세션 삭제 (선택사항)
    await c.env.DB.prepare(`
      DELETE FROM sessions WHERE user_id = ?
    `).bind(user.id).run()
    
    console.log('✅ [Naver Unlink] Sessions deleted:', user.id)
    
    return c.json({
      success: true,
      message: 'Naver account unlinked successfully',
      user_id: user.id
    })
    
  } catch (error: any) {
    console.error('[Naver Unlink] Error:', error)
    return c.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, 500)
  }
})

export const onRequest = handle(app)
