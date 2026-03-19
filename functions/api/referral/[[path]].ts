import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/referral')

app.use('/*', cors())

// ========================================
// 내 추천 코드 조회/생성
// ========================================
app.get('/my-code', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const userId = session.user_id
    
    // 기존 추천 코드 조회
    let referralCode = await c.env.DB.prepare(`
      SELECT referral_code FROM users WHERE id = ?
    `).bind(userId).first<{ referral_code: string | null }>()
    
    let code = referralCode?.referral_code
    
    // 추천 코드가 없으면 생성
    if (!code) {
      code = `ALBI${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // DB에 저장
      await c.env.DB.prepare(`
        UPDATE users SET referral_code = ? WHERE id = ?
      `).bind(code, userId).run()
      
      console.log('✅ 추천 코드 생성:', code)
    }
    
    // 추천 통계
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN reward_given = 1 THEN 1 ELSE 0 END) as rewarded_referrals
      FROM referrals
      WHERE referrer_id = ?
    `).bind(userId).first<{ total_referrals: number, rewarded_referrals: number }>()
    
    // 사용자 포인트
    const user = await c.env.DB.prepare(`
      SELECT points FROM users WHERE id = ?
    `).bind(userId).first<{ points: number }>()
    
    const origin = new URL(c.req.url).origin
    const inviteLink = `${origin}/signup.html?ref=${code}`
    
    return c.json({
      success: true,
      referralCode: code,
      inviteLink: inviteLink,
      points: user?.points || 0,
      stats: {
        totalReferrals: stats?.total_referrals || 0,
        rewardedReferrals: stats?.rewarded_referrals || 0
      }
    })
    
  } catch (error: any) {
    console.error('추천 코드 조회 오류:', error)
    return c.json({ success: false, error: '추천 코드 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 내 추천 목록 조회
// ========================================
app.get('/my-referrals', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const userId = session.user_id
    
    // 추천 목록 조회
    const referrals = await c.env.DB.prepare(`
      SELECT 
        r.id,
        r.referee_id,
        r.reward_given,
        r.created_at,
        u.name as referee_name,
        u.email as referee_email
      FROM referrals r
      LEFT JOIN users u ON r.referee_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `).bind(userId).all()
    
    return c.json({
      success: true,
      referrals: referrals.results || []
    })
    
  } catch (error: any) {
    console.error('추천 목록 조회 오류:', error)
    return c.json({ success: false, error: '추천 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 추천 코드로 가입 처리
// ========================================
// 주의: 이 엔드포인트는 더 이상 사용되지 않습니다.
// 추천 코드 처리는 /api/auth/signup.ts에서 직접 처리됩니다.
// 
// 이전 버전과의 호환성을 위해 엔드포인트는 남겨두되,
// signup API에서 이미 처리했다는 메시지를 반환합니다.
app.post('/apply-code', async (c) => {
  return c.json({
    success: false,
    error: '추천 코드는 회원가입 시 자동으로 처리됩니다. 회원가입 페이지에서 추천 코드를 입력해주세요.'
  }, 400)
})

export const onRequest = handle(app)
