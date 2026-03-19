import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
  KAKAO_CLIENT_ID: string
  KAKAO_CLIENT_SECRET: string
  KAKAO_REDIRECT_URI: string
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
  NAVER_REDIRECT_URI: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URI: string
  TOSS_CLIENT_ID: string
  TOSS_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/auth')

app.use('/*', cors())

// ========================================
// 🎯 카카오 로그인
// ========================================

// Step 1: 카카오 로그인 페이지로 리다이렉트
app.get('/kakao', (c) => {
  const clientId = c.env.KAKAO_CLIENT_ID
  // 항상 현재 도메인 사용 (커스텀 도메인 유지)
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/kakao/callback`
  
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
  
  return c.redirect(kakaoAuthUrl)
})

// Step 2: 카카오 콜백 처리
app.get('/kakao/callback', async (c) => {
  const code = c.req.query('code')
  
  if (!code) {
    return c.json({ success: false, error: '인증 코드가 없습니다.' }, 400)
  }
  
  try {
    const clientId = c.env.KAKAO_CLIENT_ID
    const clientSecret = c.env.KAKAO_CLIENT_SECRET
    // 항상 현재 도메인 사용 (커스텀 도메인 유지)
    const redirectUri = `${new URL(c.req.url).origin}/api/auth/kakao/callback`
    
    // 1. 액세스 토큰 요청
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code
      })
    })
    
    const tokenData = await tokenResponse.json() as any
    
    console.log('[Kakao OAuth] Token response:', tokenData)
    
    if (!tokenData.access_token) {
      console.error('[Kakao OAuth] Token error:', tokenData)
      return c.json({ 
        success: false, 
        error: '액세스 토큰 발급 실패',
        details: tokenData.error_description || tokenData.error || 'Unknown error',
        kakao_error: tokenData
      }, 400)
    }
    
    // 2. 사용자 정보 요청
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    const userData = await userResponse.json() as any
    
    // 3. 사용자 정보 추출 (undefined를 null로 변환)
    const kakaoId = userData.id
    const email = userData.kakao_account?.email || null
    const name = userData.kakao_account?.profile?.nickname || null
    const phone = userData.kakao_account?.phone_number || null
    
    console.log('[Kakao OAuth] User data:', { kakaoId, email, name, phone })
    
    // 4. DB에서 사용자 확인 (카카오 ID로만 검색)
    let existingUser = await c.env.DB.prepare(`
      SELECT * FROM users WHERE kakao_id = ?
    `).bind(kakaoId.toString()).first()
    
    // 이메일로도 확인 (카카오 ID가 없는 기존 사용자)
    if (!existingUser && email) {
      existingUser = await c.env.DB.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(email).first()
    }
    
    let userId
    
    if (existingUser) {
      // 기존 사용자 - 카카오 ID 업데이트
      userId = existingUser.id
      await c.env.DB.prepare(`
        UPDATE users SET kakao_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(kakaoId.toString(), userId).run()
    } else {
      // 신규 사용자 - 회원가입
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, phone, kakao_id, user_type, is_verified, created_at)
        VALUES (?, ?, ?, ?, ?, 'jobseeker', 1, CURRENT_TIMESTAMP)
      `).bind(userId, email, name, phone, kakaoId.toString()).run()
    }
    
    // 5. 세션 생성
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const sessionToken = sessionId // token과 id를 동일하게 사용
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일
    
    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(sessionId, userId, sessionToken, expiresAt).run()
    
    // 6. 로그인 완료 페이지로 리다이렉트
    const redirectUrl = `${new URL(c.req.url).origin}/auth-callback.html?session=${sessionId}&provider=kakao&name=${encodeURIComponent(name || '')}`
    
    return c.redirect(redirectUrl)
    
  } catch (error: any) {
    console.error('카카오 로그인 오류:', error)
    return c.json({ success: false, error: '카카오 로그인 중 오류가 발생했습니다.', details: error.message }, 500)
  }
})

// ========================================
// 🎯 네이버 로그인
// ========================================

// Step 1: 네이버 로그인 페이지로 리다이렉트
app.get('/naver', (c) => {
  const clientId = c.env.NAVER_CLIENT_ID
  // 항상 현재 도메인 사용 (커스텀 도메인 유지)
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/naver/callback`
  const state = Math.random().toString(36).substring(7)
  
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  
  return c.redirect(naverAuthUrl)
})

// Step 2: 네이버 콜백 처리
app.get('/naver/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  
  if (!code) {
    return c.json({ success: false, error: '인증 코드가 없습니다.' }, 400)
  }
  
  try {
    const clientId = c.env.NAVER_CLIENT_ID
    const clientSecret = c.env.NAVER_CLIENT_SECRET
    
    // 1. 액세스 토큰 요청
    const tokenResponse = await fetch(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`)
    
    const tokenData = await tokenResponse.json() as any
    
    if (!tokenData.access_token) {
      return c.json({ success: false, error: '액세스 토큰 발급 실패' }, 400)
    }
    
    // 2. 사용자 정보 요청
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    const userData = await userResponse.json() as any
    
    if (userData.resultcode !== '00') {
      return c.json({ success: false, error: '사용자 정보 조회 실패' }, 400)
    }
    
    // 3. 사용자 정보 추출 (undefined를 null로 변환)
    const naverId = userData.response.id
    const email = userData.response.email || null
    const name = userData.response.name || null
    const phone = userData.response.mobile || null
    
    console.log('[Naver OAuth] User data:', { naverId, email, name, phone })
    
    // 4. DB에서 사용자 확인 (네이버 ID로만 검색)
    let existingUser = await c.env.DB.prepare(`
      SELECT * FROM users WHERE naver_id = ?
    `).bind(naverId).first()
    
    // 이메일로도 확인 (네이버 ID가 없는 기존 사용자)
    if (!existingUser && email) {
      existingUser = await c.env.DB.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(email).first()
    }
    
    let userId
    
    if (existingUser) {
      userId = existingUser.id
      await c.env.DB.prepare(`
        UPDATE users SET naver_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(naverId, userId).run()
    } else {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, phone, naver_id, user_type, is_verified, created_at)
        VALUES (?, ?, ?, ?, ?, 'jobseeker', 1, CURRENT_TIMESTAMP)
      `).bind(userId, email, name, phone, naverId).run()
    }
    
    // 5. 세션 생성
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const sessionToken = sessionId // token과 id를 동일하게 사용
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(sessionId, userId, sessionToken, expiresAt).run()
    
    // 6. 로그인 완료 페이지로 리다이렉트
    const redirectUrl = `${new URL(c.req.url).origin}/auth-callback.html?session=${sessionId}&provider=naver&name=${encodeURIComponent(name || '')}`
    
    return c.redirect(redirectUrl)
    
  } catch (error: any) {
    console.error('네이버 로그인 오류:', error)
    return c.json({ success: false, error: '네이버 로그인 중 오류가 발생했습니다.', details: error.message }, 500)
  }
})

// ========================================
// 🎯 구글 로그인
// ========================================

// Step 1: 구글 로그인 페이지로 리다이렉트
app.get('/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID
  const origin = new URL(c.req.url).origin
  // 항상 현재 도메인 사용 (커스텀 도메인 유지)
  const redirectUri = `${origin}/api/auth/google/callback`
  
  console.log('[Google OAuth] Starting auth flow')
  console.log('[Google OAuth] Origin:', origin)
  console.log('[Google OAuth] Client ID exists:', !!clientId)
  console.log('[Google OAuth] Redirect URI:', redirectUri)
  
  const userAgent = c.req.header('user-agent') || ''
  console.log('[Google OAuth] User-Agent:', userAgent)
  
  if (!clientId) {
    console.error('[Google OAuth] GOOGLE_CLIENT_ID is not set!')
    return c.json({ success: false, error: 'Google OAuth가 설정되지 않았습니다.' }, 500)
  }
  
  // 모바일 WebView 감지
  const isWebView = userAgent.toLowerCase().includes('wv') || 
                    userAgent.toLowerCase().includes('webview')
  
  if (isWebView) {
    console.warn('[Google OAuth] WebView detected - redirecting to external browser hint')
    // WebView인 경우 사용자에게 외부 브라우저 사용 안내
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>외부 브라우저에서 열기</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 20px;
            text-align: center;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin: 50px auto;
            max-width: 400px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #333; font-size: 20px; margin-bottom: 15px; }
          p { color: #666; line-height: 1.6; margin-bottom: 20px; }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          }
          .icon { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🌐</div>
          <h1>외부 브라우저에서 열어주세요</h1>
          <p>Google 로그인은 보안상의 이유로 외부 브라우저(Safari, Chrome 등)에서만 가능합니다.</p>
          <p style="font-size: 14px; color: #999;">앱 내 브라우저가 아닌 기본 브라우저로 이 페이지를 열어주세요.</p>
          <a href="${origin}/login.html" class="btn">로그인 페이지로 돌아가기</a>
        </div>
        <script>
          // 외부 브라우저에서 열기 시도 (iOS)
          setTimeout(() => {
            const url = '${origin}/api/auth/google';
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, 1000);
        </script>
      </body>
      </html>
    `)
  }
  
  // 일반 브라우저인 경우 정상 진행
  // prompt=consent를 추가하여 매번 권한 화면 표시 (disallowed_useragent 우회)
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=consent&access_type=online`
  
  console.log('[Google OAuth] Auth URL:', googleAuthUrl)
  
  return c.redirect(googleAuthUrl)
})

// Step 2: 구글 콜백 처리
app.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')
  const origin = new URL(c.req.url).origin
  
  console.log('[Google OAuth Callback] Code:', code ? 'exists' : 'missing')
  console.log('[Google OAuth Callback] Error:', error || 'none')
  console.log('[Google OAuth Callback] Origin:', origin)
  
  if (error) {
    console.error('[Google OAuth Callback] OAuth error:', error)
    // 에러를 auth-callback.html로 전달
    return c.redirect(`${origin}/auth-callback.html?error=${encodeURIComponent(error)}&provider=google`)
  }
  
  if (!code) {
    console.error('[Google OAuth Callback] No code provided')
    return c.redirect(`${origin}/auth-callback.html?error=no_code&provider=google`)
  }
  
  try {
    const clientId = c.env.GOOGLE_CLIENT_ID
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET
    // 항상 현재 도메인 사용 (커스텀 도메인 유지)
    const redirectUri = `${origin}/api/auth/google/callback`
    
    console.log('[Google OAuth Callback] Client ID exists:', !!clientId)
    console.log('[Google OAuth Callback] Client Secret exists:', !!clientSecret)
    console.log('[Google OAuth Callback] Redirect URI:', redirectUri)
    
    if (!clientId || !clientSecret) {
      console.error('[Google OAuth Callback] Missing credentials!')
      return c.redirect(`${origin}/auth-callback.html?error=missing_credentials&provider=google`)
    }
    
    // 1. 액세스 토큰 요청
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })
    
    const tokenData = await tokenResponse.json() as any
    
    console.log('[Google OAuth Callback] Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Google OAuth Callback] Failed to get access token:', tokenData)
      const errorMsg = tokenData.error_description || tokenData.error || 'token_error'
      return c.redirect(`${origin}/auth-callback.html?error=${encodeURIComponent(errorMsg)}&provider=google`)
    }
    
    // 2. 사용자 정보 요청
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    const userData = await userResponse.json() as any
    
    // 3. 사용자 정보 추출 (undefined를 null로 변환)
    const googleId = userData.id
    const email = userData.email || null
    const name = userData.name || null
    
    console.log('[Google OAuth] User data:', { googleId, email, name })
    
    // 4. DB에서 사용자 확인 (구글 ID로만 검색)
    let existingUser = await c.env.DB.prepare(`
      SELECT * FROM users WHERE google_id = ?
    `).bind(googleId).first()
    
    // 이메일로도 확인 (구글 ID가 없는 기존 사용자)
    if (!existingUser && email) {
      existingUser = await c.env.DB.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(email).first()
    }
    
    let userId
    
    if (existingUser) {
      userId = existingUser.id
      await c.env.DB.prepare(`
        UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(googleId, userId).run()
    } else {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, google_id, user_type, is_verified, created_at)
        VALUES (?, ?, ?, ?, 'jobseeker', 1, CURRENT_TIMESTAMP)
      `).bind(userId, email, name, googleId).run()
    }
    
    // 5. 세션 생성
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const sessionToken = sessionId // token과 id를 동일하게 사용
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(sessionId, userId, sessionToken, expiresAt).run()
    
    // 6. 로그인 완료 페이지로 리다이렉트
    const redirectUrl = `${new URL(c.req.url).origin}/auth-callback.html?session=${sessionId}&provider=google&name=${encodeURIComponent(name || '')}`
    
    return c.redirect(redirectUrl)
    
  } catch (error: any) {
    console.error('[Google OAuth Callback] Error:', error)
    const origin = new URL(c.req.url).origin
    return c.redirect(`${origin}/auth-callback.html?error=server_error&provider=google&details=${encodeURIComponent(error.message || 'Unknown error')}`)
  }
})

// ========================================
// 🔐 사용자 정보 조회 (세션 인증)
// ========================================
app.get('/me', async (c) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ success: false, error: '인증 토큰이 없습니다.' }, 401)
    }
    
    // 세션 조회 (컬럼 이름 충돌 방지를 위해 명시적으로 선택)
    const session = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.user_type,
        u.points,
        u.is_verified,
        u.google_id,
        u.kakao_id,
        u.naver_id,
        u.business_registration_number,
        u.business_name,
        u.business_registration_verified,
        u.password_hash
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first()
    
    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    // 소셜 로그인 프로바이더 판단
    let socialProvider = null
    if (session.google_id) {
      socialProvider = 'google'
    } else if (session.kakao_id) {
      socialProvider = 'kakao'
    } else if (session.naver_id) {
      socialProvider = 'naver'
    }
    
    // 사용자 정보 반환
    return c.json({
      success: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        phone: session.phone,
        user_type: session.user_type,
        points: session.points || 0,
        is_verified: session.is_verified,
        social_provider: socialProvider,
        business_registration_number: session.business_registration_number,
        business_name: session.business_name,
        business_registration_verified: session.business_registration_verified,
        has_password: !!session.password_hash // 비밀번호 설정 여부
      }
    })
    
  } catch (error: any) {
    console.error('사용자 정보 조회 오류:', error)
    console.error('Error details:', error.message, error.stack)
    return c.json({ success: false, error: '사용자 정보 조회 중 오류가 발생했습니다.', debug: error.message }, 500)
  }
})

// ========================================
// 🚪 로그아웃
// ========================================
app.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: true, message: '로그아웃 되었습니다.' })
    }
    
    const sessionToken = authHeader.substring(7)
    
    // 세션 삭제
    await c.env.DB.prepare(`
      DELETE FROM sessions WHERE token = ?
    `).bind(sessionToken).run()
    
    console.log('✅ 로그아웃 성공:', sessionToken)
    
    return c.json({ success: true, message: '로그아웃 되었습니다.' })
    
  } catch (error: any) {
    console.error('로그아웃 오류:', error)
    return c.json({ success: false, error: '로그아웃 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ========================================
// 🔐 일반 로그인 (이메일/휴대폰 + 비밀번호)
// ========================================
app.post('/login', async (c) => {
  try {
    const { username, password, remember } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ success: false, error: '이메일/휴대폰번호와 비밀번호를 입력해주세요.' }, 400)
    }
    
    // 🎯 테스트 계정 체크 (이메일이 @albi-test.com 도메인인 경우)
    if (username.includes('@albi-test.com')) {
      console.log('🧪 테스트 계정 로그인 시도:', username)
      
      // 테스트 계정은 비밀번호가 Test로 시작하고 123으로 끝나는 패턴 (길이 8-20자)
      const isValidTestPassword = password.startsWith('Test') && password.endsWith('123') && password.length >= 8 && password.length <= 20
      
      if (!isValidTestPassword) {
        return c.json({ success: false, error: '테스트 계정 비밀번호가 일치하지 않습니다.' }, 400)
      }
      
      // 테스트 사용자 ID 생성 (이메일에서 추출)
      const testUserId = username.split('@')[0] // test_xxxxx 형태
      
      // 테스트 계정은 DB에 없으므로 임시 세션만 생성
      const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const sessionToken = sessionId
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간
      
      // 테스트 계정 정보 (실제 DB에 저장하지 않음)
      const testUser = {
        id: testUserId,
        name: `테스트 사용자 (${testUserId})`,
        email: username,
        phone: null,
        user_type: 'jobseeker',
        points: 1000,
        is_verified: 1
      }
      
      console.log('✅ 테스트 계정 로그인 성공:', testUser.id, testUser.name)
      
      return c.json({
        success: true,
        message: '테스트 계정 로그인 성공',
        data: {
          userId: testUser.id,
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone,
          userType: testUser.user_type,
          points: testUser.points,
          isVerified: testUser.is_verified,
          sessionToken: sessionToken,
          isTestAccount: true // 테스트 계정임을 표시
        }
      })
    }
    
    // 일반 사용자 로그인 (기존 로직)
    const cleanPhone = username.replace(/-/g, '')
    
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, phone, password_hash, user_type, points, is_verified
      FROM users
      WHERE (email = ? OR phone = ?) AND password_hash IS NOT NULL
      LIMIT 1
    `).bind(username, cleanPhone).first()
    
    if (!user) {
      return c.json({ success: false, error: '등록되지 않은 이메일/휴대폰번호입니다.' }, 400)
    }
    
    // 비밀번호 검증 (실제로는 bcrypt 사용해야 함)
    // TODO: bcrypt로 변경
    if (user.password_hash !== password) {
      return c.json({ success: false, error: '비밀번호가 일치하지 않습니다.' }, 400)
    }
    
    // 세션 생성
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const sessionToken = sessionId
    const expiresAt = remember 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()   // 7일
    
    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(sessionId, user.id, sessionToken, expiresAt).run()
    
    console.log('✅ 로그인 성공:', user.id, user.name)
    
    return c.json({
      success: true,
      message: '로그인 성공',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.user_type,
        points: user.points,
        isVerified: user.is_verified,
        sessionToken: sessionToken
      }
    })
    
  } catch (error: any) {
    console.error('로그인 오류:', error)
    return c.json({ success: false, error: '로그인 처리 중 오류가 발생했습니다.', debug: error.message }, 500)
  }
})

// ========================================
// 🔓 토스 앱인토스 연동 해제 콜백
// ========================================
// 앱인토스에서 사용자가 연동 해제 시 호출되는 웹훅 (POST 방식)
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
    
    // 요청 본문 파싱
    let userKey: string | null = null
    
    const contentType = c.req.header('Content-Type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await c.req.json()
      userKey = body.userKey || body.user_key || body.id
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await c.req.formData()
      userKey = formData.get('userKey') as string || formData.get('user_key') as string
    }
    
    console.log('[Toss Unlink] Request received:', { userKey, method: 'POST' })
    
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
