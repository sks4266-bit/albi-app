import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/store')

app.use('/*', cors())

// ========================================
// 상품 목록 조회
// ========================================
app.get('/products', async (c) => {
  try {
    const products = [
      { 
        id: 1, 
        name: "스타벅스 아메리카노 (Tall)", 
        icon: "☕", 
        price: 400, 
        category: "카페", 
        popular: true,
        description: "스타벅스 전 매장에서 사용 가능한 아메리카노 톨 사이즈",
        validDays: 90
      },
      { 
        id: 2, 
        name: "GS25 모바일상품권 5천원", 
        icon: "🏪", 
        price: 400, 
        category: "편의점",
        description: "GS25 전국 매장에서 사용 가능",
        validDays: 90
      },
      { 
        id: 3, 
        name: "CU 모바일상품권 5천원", 
        icon: "🏪", 
        price: 400, 
        category: "편의점",
        description: "CU 전국 매장에서 사용 가능",
        validDays: 90
      },
      { 
        id: 4, 
        name: "배스킨라빈스 파인트", 
        icon: "🍦", 
        price: 600, 
        category: "디저트",
        description: "파인트 사이즈 아이스크림 1개",
        validDays: 90
      },
      { 
        id: 5, 
        name: "CGV 영화관람권", 
        icon: "🎬", 
        price: 800, 
        category: "문화", 
        popular: true,
        description: "CGV 전국 영화관에서 사용 가능 (평일/주말 모두)",
        validDays: 90
      },
      { 
        id: 6, 
        name: "BBQ 치킨 기프티콘", 
        icon: "🍗", 
        price: 1200, 
        category: "음식",
        description: "BBQ 황금올리브 치킨 교환권",
        validDays: 90
      },
      { 
        id: 7, 
        name: "카카오 이모티콘", 
        icon: "💬", 
        price: 200, 
        category: "디지털",
        description: "인기 이모티콘 중 선택 가능",
        validDays: 365
      },
      { 
        id: 8, 
        name: "올리브영 1만원권", 
        icon: "💄", 
        price: 800, 
        category: "뷰티",
        description: "올리브영 전 매장 및 온라인몰 사용 가능",
        validDays: 90
      },
      { 
        id: 9, 
        name: "도미노피자 기프티콘", 
        icon: "🍕", 
        price: 1200, 
        category: "음식",
        description: "도미노피자 라지 사이즈 교환권",
        validDays: 90
      },
      { 
        id: 10, 
        name: "투썸플레이스 케이크", 
        icon: "🍰", 
        price: 600, 
        category: "카페",
        description: "투썸플레이스 케이크 1개 교환권",
        validDays: 90
      },
      { 
        id: 11, 
        name: "메가커피 아이스 아메리카노", 
        icon: "☕", 
        price: 200, 
        category: "카페", 
        popular: true,
        description: "메가커피 아이스 아메리카노 교환권",
        validDays: 90
      },
      { 
        id: 12, 
        name: "교보문고 도서상품권 1만원", 
        icon: "📚", 
        price: 800, 
        category: "문화",
        description: "교보문고 전국 매장 및 온라인 사용 가능",
        validDays: 365
      }
    ];

    return c.json({
      success: true,
      products
    })
    
  } catch (error: any) {
    console.error('상품 목록 조회 오류:', error)
    return c.json({ success: false, error: '상품 목록을 불러올 수 없습니다.' }, 500)
  }
})

// ========================================
// 포인트 잔액 조회
// ========================================
app.get('/balance', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ?
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    // 사용자 포인트 조회
    const user = await c.env.DB.prepare(`
      SELECT points, name, email FROM users WHERE id = ?
    `).bind(session.user_id).first()
    
    if (!user) {
      return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404)
    }
    
    console.log('✅ 포인트 잔액 조회:', session.user_id, user.points)
    
    return c.json({
      success: true,
      points: user.points || 0,
      name: user.name,
      email: user.email
    })
    
  } catch (error: any) {
    console.error('포인트 조회 오류:', error)
    return c.json({ success: false, error: '포인트 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 상품 구매 (포인트 차감 및 기프티콘 발급)
// ========================================
app.post('/purchase', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ?
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    const body = await c.req.json()
    const { product_id, product_name, product_price, product_icon, product_category } = body
    
    if (!product_id || !product_price) {
      return c.json({ success: false, error: '상품 정보가 올바르지 않습니다.' }, 400)
    }
    
    // 사용자 포인트 확인
    const user = await c.env.DB.prepare(`
      SELECT points, name, email FROM users WHERE id = ?
    `).bind(session.user_id).first()
    
    if (!user) {
      return c.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, 404)
    }
    
    const currentPoints = user.points || 0
    
    if (currentPoints < product_price) {
      return c.json({ 
        success: false, 
        error: '포인트가 부족합니다.',
        currentPoints,
        requiredPoints: product_price,
        lackPoints: product_price - currentPoints
      }, 400)
    }
    
    // 포인트 차감
    const newPoints = currentPoints - product_price
    await c.env.DB.prepare(`
      UPDATE users SET points = ? WHERE id = ?
    `).bind(newPoints, session.user_id).run()
    
    // 기프티콘 코드 생성 (16자리 랜덤)
    const giftCode = Array.from({ length: 16 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
    
    // 구매 내역 저장
    const purchaseId = Array.from({ length: 16 }, () => 
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
    
    await c.env.DB.prepare(`
      INSERT INTO store_purchases (
        id, user_id, product_id, product_name, product_price, 
        product_icon, product_category, gift_code, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
    `).bind(
      purchaseId,
      session.user_id,
      product_id,
      product_name,
      product_price,
      product_icon,
      product_category,
      giftCode
    ).run()
    
    // 포인트 거래 내역 저장
    const transactionId = Array.from({ length: 16 }, () => 
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
    
    await c.env.DB.prepare(`
      INSERT INTO point_transactions (
        id, user_id, amount, type, description, balance_after, created_at
      ) VALUES (?, ?, ?, 'spend', ?, ?, datetime('now'))
    `).bind(
      transactionId,
      session.user_id,
      -product_price,
      `${product_name} 구매`,
      newPoints
    ).run()
    
    console.log('✅ 상품 구매 완료:', session.user_id, product_name, product_price, 'P')
    
    return c.json({
      success: true,
      message: '구매가 완료되었습니다.',
      giftCode,
      newPoints,
      userEmail: user.email,
      purchaseId
    })
    
  } catch (error: any) {
    console.error('상품 구매 오류:', error)
    return c.json({ success: false, error: '구매 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 구매 내역 조회
// ========================================
app.get('/purchases', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '로그인이 필요합니다.' }, 401)
    }
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_token = ?
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    // 구매 내역 조회
    const purchases = await c.env.DB.prepare(`
      SELECT 
        id, product_id, product_name, product_price, 
        product_icon, product_category, gift_code, 
        status, created_at
      FROM store_purchases
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(session.user_id).all()
    
    console.log('✅ 구매 내역 조회:', session.user_id, purchases.results?.length || 0, '건')
    
    return c.json({
      success: true,
      purchases: purchases.results || []
    })
    
  } catch (error: any) {
    console.error('구매 내역 조회 오류:', error)
    return c.json({ success: false, error: '구매 내역 조회 중 오류가 발생했습니다.' }, 500)
  }
})

export const onRequest = handle(app)
