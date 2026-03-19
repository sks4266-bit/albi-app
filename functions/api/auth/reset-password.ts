import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
}

// 간단한 비밀번호 해싱 (프로덕션에서는 bcrypt 사용 권장)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('🔑 비밀번호 재설정')

  try {
    const { token, newPassword } = await context.request.json()

    console.log('📝 요청 데이터:', { token: token ? 'exists' : 'missing', newPassword: newPassword ? '***' : 'missing' })

    if (!token || !newPassword) {
      return Response.json({
        success: false,
        error: '토큰과 새 비밀번호를 입력해주세요'
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return Response.json({
        success: false,
        error: '비밀번호는 최소 8자 이상이어야 합니다'
      }, { status: 400 })
    }

    // 토큰에서 user_id와 phone, code 추출
    const parts = token.split('-')
    if (parts.length < 3) {
      return Response.json({
        success: false,
        error: '유효하지 않은 토큰입니다'
      }, { status: 400 })
    }
    
    const userId = parts[0]
    const phone = parts[1]

    console.log('👤 사용자 ID:', userId, 'phone:', phone)

    // DB에서 인증번호 재확인 (사용되지 않은 최신 인증번호)
    const verification = await context.env.DB.prepare(`
      SELECT id, used, expires_at
      FROM phone_verifications
      WHERE phone = ? AND type = 'reset_password' AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(phone).first()

    console.log('🔍 조회 결과:', verification ? '인증번호 존재' : '인증번호 없음')

    if (!verification) {
      return Response.json({
        success: false,
        error: '유효하지 않은 토큰입니다'
      }, { status: 400 })
    }

    const expiresAt = new Date(verification.expires_at as string)
    if (expiresAt < new Date()) {
      return Response.json({
        success: false,
        error: '토큰이 만료되었습니다'
      }, { status: 400 })
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(newPassword)

    console.log('🔐 비밀번호 해싱 완료')

    // 비밀번호 업데이트
    await context.env.DB.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(hashedPassword, userId).run()

    console.log('💾 비밀번호 업데이트 완료')

    // 인증번호 사용 처리
    await context.env.DB.prepare(`
      UPDATE phone_verifications
      SET used = 1
      WHERE id = ?
    `).bind(verification.id).run()

    console.log('✅ 인증번호 사용 처리 완료')

    return Response.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    })

  } catch (error: any) {
    console.error('❌ 비밀번호 재설정 에러:', error)
    return Response.json({
      success: false,
      error: '비밀번호 변경 중 오류가 발생했습니다',
      details: error.message
    }, { status: 500 })
  }
}
