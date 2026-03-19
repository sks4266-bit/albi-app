import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('🔍 아이디 찾기 API 호출')

  try {
    const { name, phone } = await context.request.json()

    console.log('📝 요청 데이터:', { name, phone })

    if (!name || !phone) {
      return Response.json({
        success: false,
        error: '이름과 휴대폰 번호를 입력해주세요'
      }, { status: 400 })
    }

    // DB에서 사용자 조회
    const user = await context.env.DB.prepare(`
      SELECT username, email
      FROM users
      WHERE name = ? AND phone = ?
      LIMIT 1
    `).bind(name, phone).first()

    console.log('🔍 조회 결과:', user)

    if (!user) {
      return Response.json({
        success: false,
        error: '일치하는 계정을 찾을 수 없습니다'
      }, { status: 404 })
    }

    return Response.json({
      success: true,
      username: user.username
    })

  } catch (error: any) {
    console.error('❌ 아이디 찾기 에러:', error)
    return Response.json({
      success: false,
      error: '아이디 찾기 중 오류가 발생했습니다',
      details: error.message
    }, { status: 500 })
  }
}
