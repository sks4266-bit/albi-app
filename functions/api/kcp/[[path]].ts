import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  KCP_SITE_CD: string
  KCP_SITE_KEY: string
  KCP_SITE_NAME: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/kcp')

app.use('/*', cors())

// ========================================
// KCP 정기결제 (자동결제) API
// ========================================

// 1. 거래 등록 (배치키 발급을 위한 인증 요청)
app.post('/register', async (c) => {
  try {
    const { plan_type, user_id, user_name, user_email, amount } = await c.req.json()

    console.log('[KCP Register] Request:', { plan_type, user_id, user_name, user_email, amount })

    // 주문번호 생성 (중복 방지)
    const ordr_idxx = `ALBI_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // KCP 거래등록 API 호출
    const kcpApiUrl = c.env.KCP_SITE_CD?.startsWith('T') 
      ? 'https://testsmpay.kcp.co.kr/trade/register.do'
      : 'https://smpay.kcp.co.kr/trade/register.do'

    const registerData = {
      site_cd: c.env.KCP_SITE_CD,
      ordr_idxx: ordr_idxx,
      good_mny: amount.toString(),
      good_name: `알비 ${plan_type} 플랜`,
      pay_method: 'AUTH',
      Ret_URL: `${new URL(c.req.url).origin}/api/kcp/batch-auth`
    }

    console.log('[KCP Register] Request to KCP:', registerData)

    const kcpResponse = await fetch(kcpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    })

    const kcpResult = await kcpResponse.json() as any

    console.log('[KCP Register] Response from KCP:', kcpResult)

    if (kcpResult.Code !== '0000') {
      console.error('[KCP Register] Error:', kcpResult)
      return c.json({
        success: false,
        error: 'KCP 거래 등록 실패',
        details: kcpResult.Message
      }, 400)
    }

    // DB에 거래 정보 저장
    await c.env.DB.prepare(`
      INSERT INTO kcp_transactions (
        ordr_idxx, user_id, user_name, user_email, plan_type, amount,
        approval_key, pay_url, trace_no, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', datetime('now'))
    `).bind(
      ordr_idxx,
      user_id,
      user_name,
      user_email,
      plan_type,
      amount,
      kcpResult.approvalKey,
      kcpResult.PayUrl,
      kcpResult.traceNo
    ).run()

    console.log('[KCP Register] Transaction saved to DB:', ordr_idxx)

    // 결제창 호출 정보 반환
    return c.json({
      success: true,
      data: {
        ordr_idxx: ordr_idxx,
        approval_key: kcpResult.approvalKey,
        pay_url: kcpResult.PayUrl,
        site_cd: c.env.KCP_SITE_CD,
        site_name: c.env.KCP_SITE_NAME,
        good_name: `알비 ${plan_type} 플랜`,
        good_mny: amount,
        pay_method: 'AUTH',
        currency: '410',
        kcp_bath_info_view: 'Y',
        ActionResult: 'batch',
        Ret_URL: `${new URL(c.req.url).origin}/api/kcp/batch-auth`,
        buyr_name: user_name
      }
    })

  } catch (error: any) {
    console.error('[KCP Register] Error:', error)
    return c.json({
      success: false,
      error: 'KCP 거래 등록 실패',
      details: error.message
    }, 500)
  }
})

// 2. 배치키 발급 응답 처리
app.post('/batch-auth', async (c) => {
  try {
    const body = await c.req.text()
    console.log('[KCP Batch Auth] Response from KCP:', body)

    // URL 파라미터 파싱
    const params = new URLSearchParams(body)
    const ordr_idxx = params.get('ordr_idxx')
    const batch_key = params.get('batch_key')
    const res_cd = params.get('res_cd')
    const res_msg = params.get('res_msg')

    if (!ordr_idxx) {
      console.error('[KCP Batch Auth] Missing ordr_idxx')
      return c.redirect('/payment-callback.html?success=false&message=주문번호가 없습니다')
    }

    // DB에서 거래 정보 조회
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM kcp_transactions WHERE ordr_idxx = ?
    `).bind(ordr_idxx).first()

    if (!transaction) {
      console.error('[KCP Batch Auth] Transaction not found:', ordr_idxx)
      return c.redirect('/payment-callback.html?success=false&message=거래 정보를 찾을 수 없습니다')
    }

    // 배치키 발급 성공 여부 확인
    if (res_cd !== '0000' || !batch_key) {
      console.error('[KCP Batch Auth] Batch key issue failed:', res_cd, res_msg)
      
      // 실패 정보 DB 업데이트
      await c.env.DB.prepare(`
        UPDATE kcp_transactions
        SET status = 'failed', res_cd = ?, res_msg = ?, updated_at = datetime('now')
        WHERE ordr_idxx = ?
      `).bind(res_cd, res_msg, ordr_idxx).run()

      return c.redirect(`/payment-callback.html?success=false&message=${encodeURIComponent(res_msg || '배치키 발급 실패')}`)
    }

    // 배치키 저장
    await c.env.DB.prepare(`
      UPDATE kcp_transactions
      SET batch_key = ?, status = 'batch_issued', res_cd = ?, res_msg = ?, updated_at = datetime('now')
      WHERE ordr_idxx = ?
    `).bind(batch_key, res_cd, res_msg, ordr_idxx).run()

    console.log('[KCP Batch Auth] Batch key issued successfully:', batch_key)

    // users 테이블에 batch_key 저장 (정기결제용)
    await c.env.DB.prepare(`
      UPDATE users
      SET kcp_batch_key = ?, subscription_status = 'active', subscription_plan = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).bind(batch_key, transaction.plan_type, transaction.user_id).run()

    // 성공 페이지로 리디렉션
    return c.redirect(`/payment-callback.html?success=true&plan=${transaction.plan_type}&amount=${transaction.amount}`)

  } catch (error: any) {
    console.error('[KCP Batch Auth] Error:', error)
    return c.redirect('/payment-callback.html?success=false&message=배치키 발급 처리 중 오류가 발생했습니다')
  }
})

// 3. 정기결제 실행 (배치키로 결제 요청)
app.post('/execute-payment', async (c) => {
  try {
    const { user_id, amount, good_name } = await c.req.json()

    console.log('[KCP Execute Payment] Request:', { user_id, amount, good_name })

    // 사용자의 배치키 조회
    const user = await c.env.DB.prepare(`
      SELECT kcp_batch_key, user_name, email FROM users WHERE user_id = ?
    `).bind(user_id).first() as any

    if (!user || !user.kcp_batch_key) {
      console.error('[KCP Execute Payment] Batch key not found for user:', user_id)
      return c.json({
        success: false,
        error: '배치키를 찾을 수 없습니다. 먼저 결제 수단을 등록해주세요.'
      }, 404)
    }

    // 주문번호 생성
    const ordr_idxx = `ALBI_AUTO_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // KCP 배치결제 API 호출
    const kcpApiUrl = c.env.KCP_SITE_CD?.startsWith('T')
      ? 'https://testsmpay.kcp.co.kr/batch/payment.do'
      : 'https://smpay.kcp.co.kr/batch/payment.do'

    const paymentData = {
      site_cd: c.env.KCP_SITE_CD,
      site_key: c.env.KCP_SITE_KEY,
      ordr_idxx: ordr_idxx,
      good_mny: amount.toString(),
      good_name: good_name || '알비 정기구독',
      batch_key: user.kcp_batch_key,
      pay_method: 'CARD'
    }

    console.log('[KCP Execute Payment] Request to KCP:', paymentData)

    const kcpResponse = await fetch(kcpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    const kcpResult = await kcpResponse.json() as any

    console.log('[KCP Execute Payment] Response from KCP:', kcpResult)

    // 결제 결과 DB 저장
    await c.env.DB.prepare(`
      INSERT INTO kcp_payments (
        ordr_idxx, user_id, user_name, user_email, amount, good_name,
        batch_key, res_cd, res_msg, tno, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      ordr_idxx,
      user_id,
      user.user_name,
      user.email,
      amount,
      good_name,
      user.kcp_batch_key,
      kcpResult.res_cd || 'unknown',
      kcpResult.res_msg || 'unknown',
      kcpResult.tno || null,
      kcpResult.res_cd === '0000' ? 'success' : 'failed'
    ).run()

    if (kcpResult.res_cd !== '0000') {
      console.error('[KCP Execute Payment] Payment failed:', kcpResult)
      return c.json({
        success: false,
        error: 'KCP 결제 실패',
        details: kcpResult.res_msg
      }, 400)
    }

    console.log('[KCP Execute Payment] Payment successful:', kcpResult.tno)

    return c.json({
      success: true,
      data: {
        ordr_idxx: ordr_idxx,
        tno: kcpResult.tno,
        amount: amount,
        res_msg: kcpResult.res_msg
      }
    })

  } catch (error: any) {
    console.error('[KCP Execute Payment] Error:', error)
    return c.json({
      success: false,
      error: 'KCP 결제 실행 실패',
      details: error.message
    }, 500)
  }
})

// 4. 배치키 상태 조회
app.get('/batch-key/:user_id', async (c) => {
  try {
    const user_id = c.req.param('user_id')

    const user = await c.env.DB.prepare(`
      SELECT kcp_batch_key, subscription_status, subscription_plan FROM users WHERE user_id = ?
    `).bind(user_id).first() as any

    if (!user) {
      return c.json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      }, 404)
    }

    return c.json({
      success: true,
      data: {
        has_batch_key: !!user.kcp_batch_key,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan
      }
    })

  } catch (error: any) {
    console.error('[KCP Batch Key Check] Error:', error)
    return c.json({
      success: false,
      error: '배치키 조회 실패',
      details: error.message
    }, 500)
  }
})

export const onRequest = app.fetch
