import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
  COOLSMS_API_KEY?: string
  COOLSMS_API_SECRET?: string
  COOLSMS_FROM_NUMBER?: string
}

// 6자리 랜덤 숫자 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('📧 비밀번호 찾기 - 인증번호 발송')

  try {
    const { email, phone } = await context.request.json()

    console.log('📝 요청 데이터:', { email, phone })

    if (!email || !phone) {
      return Response.json({
        success: false,
        error: '이메일과 휴대폰 번호를 입력해주세요'
      }, { status: 400 })
    }

    // 휴대폰 번호 정규화 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '')

    // DB에서 사용자 조회
    const user = await context.env.DB.prepare(`
      SELECT id, email, name, phone
      FROM users
      WHERE email = ? AND phone = ?
      LIMIT 1
    `).bind(email, cleanPhone).first()

    console.log('🔍 조회 결과:', user ? '사용자 존재' : '사용자 없음')

    if (!user) {
      return Response.json({
        success: false,
        error: '일치하는 계정을 찾을 수 없습니다'
      }, { status: 404 })
    }

    // 인증번호 생성
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5분 후

    console.log('🔐 인증번호 생성:', code, 'expires:', expiresAt)

    // phone_verifications 테이블에 저장
    await context.env.DB.prepare(`
      INSERT INTO phone_verifications (phone, code, type, expires_at, created_at)
      VALUES (?, ?, 'reset_password', ?, CURRENT_TIMESTAMP)
    `).bind(cleanPhone, code, expiresAt.toISOString()).run()

    console.log('💾 인증번호 저장 완료')

    // SMS 발송
    const smsMessage = `[알비] 비밀번호 재설정 인증번호는 [${code}] 입니다. (5분 유효)`
    
    // CoolSMS API 사용 가능 여부 확인
    const hasSMSConfig = context.env.COOLSMS_API_KEY && 
                         context.env.COOLSMS_API_SECRET && 
                         (context.env.COOLSMS_FROM_NUMBER || context.env.COOLSMS_SENDER)

    if (hasSMSConfig) {
      try {
        console.log('📱 SMS 발송 시작...')
        
        // CoolSMS API v4 호출
        const smsResponse = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${context.env.COOLSMS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              to: cleanPhone,
              from: context.env.COOLSMS_FROM_NUMBER || context.env.COOLSMS_SENDER,
              text: smsMessage
            }
          })
        })

        const smsData = await smsResponse.json() as any

        if (smsResponse.ok && smsData.groupId) {
          console.log('✅ SMS 발송 성공:', smsData.groupId)
        } else {
          console.error('⚠️ SMS 발송 실패:', smsData.errorMessage || smsData.statusCode)
          // SMS 발송 실패해도 인증번호는 DB에 저장되어 있으므로 계속 진행
        }
      } catch (smsError: any) {
        console.error('⚠️ SMS 발송 예외:', smsError.message)
        // SMS 발송 실패해도 계속 진행
      }
    } else {
      // 개발 환경: 콘솔에만 출력
      console.log(`📱 [개발 모드 - SMS 미발송] 
        수신: ${cleanPhone}
        내용: ${smsMessage}
      `)
    }

    // 토큰 생성 (프론트엔드에서 다음 단계에 사용)
    const token = `${user.id}-${cleanPhone}-${Date.now()}`

    return Response.json({
      success: true,
      token,
      message: '인증 코드가 이메일로 발송되었습니다',
      // 개발 환경에서만 코드 노출 (프로덕션에서는 제거)
      ...(context.env.ENVIRONMENT !== 'production' && { debug_code: code })
    })

  } catch (error: any) {
    console.error('❌ 비밀번호 찾기 에러:', error)
    return Response.json({
      success: false,
      error: '인증 코드 발송 중 오류가 발생했습니다',
      details: error.message
    }, { status: 500 })
  }
}
