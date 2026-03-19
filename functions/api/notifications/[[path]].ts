import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/notifications')

app.use('/*', cors())

// ========================================
// 알림 목록 조회
// ========================================
app.get('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const { limit = '50', offset = '0', unread_only = 'false' } = c.req.query()
    
    let sql = `
      SELECT 
        id,
        type,
        title,
        message,
        link,
        related_id,
        is_read,
        created_at,
        read_at
      FROM notifications
      WHERE user_id = ?
    `
    
    const params: any[] = [session.user_id]
    
    // 읽지 않은 알림만 조회
    if (unread_only === 'true') {
      sql += ` AND is_read = 0`
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))
    
    const notifications = await c.env.DB.prepare(sql).bind(...params).all()
    
    // 읽지 않은 알림 개수
    const unreadCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).bind(session.user_id).first<{ count: number }>()
    
    console.log('✅ 알림 목록 조회:', notifications.results?.length || 0, '건')
    
    return c.json({
      success: true,
      notifications: notifications.results || [],
      unread_count: unreadCount?.count || 0
    })
    
  } catch (error: any) {
    console.error('❌ 알림 목록 조회 오류:', error)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error stack:', error?.stack)
    return c.json({ 
      success: false, 
      error: '알림 목록 조회 중 오류가 발생했습니다.',
      details: error?.message 
    }, 500)
  }
})

// ========================================
// 알림 읽음 처리
// ========================================
app.put('/:id/read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const notificationId = c.req.param('id')
    
    // 알림 소유자 확인
    const notification = await c.env.DB.prepare(`
      SELECT user_id FROM notifications WHERE id = ?
    `).bind(notificationId).first<{ user_id: string }>()
    
    if (!notification) {
      return c.json({ success: false, error: '알림을 찾을 수 없습니다.' }, 404)
    }
    
    if (notification.user_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    // 읽음 처리
    await c.env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = datetime('now')
      WHERE id = ?
    `).bind(notificationId).run()
    
    console.log('✅ 알림 읽음 처리:', notificationId)
    
    return c.json({
      success: true,
      message: '알림이 읽음 처리되었습니다.'
    })
    
  } catch (error: any) {
    console.error('알림 읽음 처리 오류:', error)
    return c.json({ success: false, error: '알림 읽음 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 모든 알림 읽음 처리
// ========================================
app.put('/read-all', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    // 모든 알림 읽음 처리
    await c.env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = datetime('now')
      WHERE user_id = ? AND is_read = 0
    `).bind(session.user_id).run()
    
    console.log('✅ 모든 알림 읽음 처리:', session.user_id)
    
    return c.json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.'
    })
    
  } catch (error: any) {
    console.error('모든 알림 읽음 처리 오류:', error)
    return c.json({ success: false, error: '알림 읽음 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 알림 삭제
// ========================================
app.delete('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const notificationId = c.req.param('id')
    
    // 알림 소유자 확인
    const notification = await c.env.DB.prepare(`
      SELECT user_id FROM notifications WHERE id = ?
    `).bind(notificationId).first<{ user_id: string }>()
    
    if (!notification) {
      return c.json({ success: false, error: '알림을 찾을 수 없습니다.' }, 404)
    }
    
    if (notification.user_id !== session.user_id) {
      return c.json({ success: false, error: '권한이 없습니다.' }, 403)
    }
    
    // 알림 삭제
    await c.env.DB.prepare(`
      DELETE FROM notifications WHERE id = ?
    `).bind(notificationId).run()
    
    console.log('✅ 알림 삭제:', notificationId)
    
    return c.json({
      success: true,
      message: '알림이 삭제되었습니다.'
    })
    
  } catch (error: any) {
    console.error('알림 삭제 오류:', error)
    return c.json({ success: false, error: '알림 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 알림 생성 (내부 API)
// ========================================
app.post('/create', async (c) => {
  try {
    const body = await c.req.json()
    const { user_id, type, title, message, data } = body
    
    if (!user_id || !type || !title || !message) {
      return c.json({ 
        success: false, 
        error: 'user_id, type, title, message는 필수입니다.' 
      }, 400)
    }
    
    // 알림 ID 생성
    const notificationId = crypto.randomUUID().substring(0, 16)
    
    // 알림 생성
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      notificationId,
      user_id,
      type,
      title,
      message,
      data || null
    ).run()
    
    console.log('✅ 알림 생성:', notificationId, type)
    
    return c.json({
      success: true,
      message: '알림이 생성되었습니다.',
      notificationId: notificationId
    })
    
  } catch (error: any) {
    console.error('알림 생성 오류:', error)
    return c.json({ success: false, error: '알림 생성 중 오류가 발생했습니다.' }, 500)
  }
})

export const onRequest = handle(app)
