import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('🔐 이메일 찾기 - 인증번호 확인')

  try {
    const { token, code } = await context.request.json()

    console.log('📝 요청 데이터:', { token: token ? 'exists' : 'missing', code })

    if (!token || !code) {
      return Response.json({
        success: false,
        error: '토큰과 인증번호를 입력해주세요'
      }, { status: 400 })
    }

    // 토큰에서 phone 추출
    const parts = token.split('-')
    if (parts.length < 2) {
      return Response.json({
        success: false,
        error: '유효하지 않은 토큰입니다'
      }, { status: 400 })
    }
    
    const userId = parts[0]
    const phone = parts[1]

    console.log('👤 사용자 ID:', userId, 'phone:', phone)

    // DB에서 인증번호 조회
    const verification = await context.env.DB.prepare(`
      SELECT id, phone, code, expires_at, used
      FROM phone_verifications
      WHERE phone = ? AND code = ? AND type = 'find_email'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(phone, code).first()

    console.log('🔍 조회 결과:', verification ? '인증번호 존재' : '인증번호 없음')

    if (!verification) {
      return Response.json({
        success: false,
        error: '유효하지 않은 인증번호입니다'
      }, { status: 400 })
    }

    // 사용 여부 확인
    if (verification.used) {
      return Response.json({
        success: false,
        error: '이미 사용된 인증번호입니다'
      }, { status: 400 })
    }

    // 만료 시간 확인
    const expiresAt = new Date(verification.expires_at as string)
    if (expiresAt < new Date()) {
      return Response.json({
        success: false,
        error: '인증번호가 만료되었습니다'
      }, { status: 400 })
    }

    // 인증번호 사용 처리
    await context.env.DB.prepare(`
      UPDATE phone_verifications
      SET used = 1
      WHERE id = ?
    `).bind(verification.id).run()

    // 사용자 이메일 조회
    const user = await context.env.DB.prepare(`
      SELECT email
      FROM users
      WHERE id = ? AND phone = ?
      LIMIT 1
    `).bind(userId, phone).first()

    if (!user) {
      return Response.json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      }, { status: 404 })
    }

    console.log('✅ 인증 완료, 이메일 반환')

    return Response.json({
      success: true,
      email: user.email,
      message: '인증이 완료되었습니다'
    })

  } catch (error: any) {
    console.error('❌ 인증번호 확인 에러:', error)
    return Response.json({
      success: false,
      error: '인증번호 확인 중 오류가 발생했습니다',
      details: error.message
    }, { status: 500 })
  }
}
