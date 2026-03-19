import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  COOLSMS_API_KEY?: string
  COOLSMS_API_SECRET?: string
  COOLSMS_FROM_NUMBER?: string
}

interface CoolSMSResponse {
  groupId?: string
  errorMessage?: string
  statusCode?: string
}

/**
 * CoolSMS API를 사용하여 SMS 발송
 * 문서: https://developer.coolsms.co.kr/
 */
async function sendSMS(
  env: Env,
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  console.log('📱 CoolSMS 발송 시작:', { to, messageLength: message.length })

  // API 키 확인
  const apiKey = env.COOLSMS_API_KEY
  const apiSecret = env.COOLSMS_API_SECRET
  const fromNumber = env.COOLSMS_FROM_NUMBER || env.COOLSMS_SENDER

  if (!apiKey || !apiSecret || !fromNumber) {
    console.error('❌ CoolSMS 환경 변수 누락')
    return {
      success: false,
      error: 'SMS 발송 설정이 완료되지 않았습니다'
    }
  }

  try {
    // CoolSMS API v4 사용
    const url = 'https://api.coolsms.co.kr/messages/v4/send'

    const body = {
      message: {
        to: to,
        from: fromNumber,
        text: message
      }
    }

    console.log('🌐 CoolSMS API 호출:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json() as CoolSMSResponse

    console.log('📦 CoolSMS 응답:', {
      status: response.status,
      statusCode: data.statusCode,
      groupId: data.groupId
    })

    if (response.ok && data.groupId) {
      console.log('✅ SMS 발송 성공:', data.groupId)
      return { success: true }
    } else {
      console.error('❌ SMS 발송 실패:', data.errorMessage || data.statusCode)
      return {
        success: false,
        error: data.errorMessage || 'SMS 발송에 실패했습니다'
      }
    }
  } catch (error: any) {
    console.error('❌ SMS 발송 예외:', error)
    return {
      success: false,
      error: `SMS 발송 중 오류: ${error.message}`
    }
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('📧 SMS 발송 API 호출')

  try {
    const { phone, message, type } = await context.request.json()

    console.log('📝 요청 데이터:', { phone, type, messageLength: message?.length })

    if (!phone || !message) {
      return Response.json({
        success: false,
        error: '전화번호와 메시지를 입력해주세요'
      }, { status: 400 })
    }

    // 휴대폰 번호 정규화 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '')

    // 휴대폰 번호 유효성 검사
    if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
      return Response.json({
        success: false,
        error: '유효하지 않은 휴대폰 번호입니다'
      }, { status: 400 })
    }

    // SMS 발송
    const result = await sendSMS(context.env, cleanPhone, message)

    if (result.success) {
      return Response.json({
        success: true,
        message: 'SMS가 발송되었습니다'
      })
    } else {
      return Response.json({
        success: false,
        error: result.error || 'SMS 발송에 실패했습니다'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ SMS 발송 API 에러:', error)
    return Response.json({
      success: false,
      error: 'SMS 발송 중 오류가 발생했습니다',
      details: error.message
    }, { status: 500 })
  }
}
