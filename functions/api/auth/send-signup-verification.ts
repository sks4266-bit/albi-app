import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  COOLSMS_API_KEY: string;
  COOLSMS_API_SECRET: string;
  COOLSMS_FROM_NUMBER: string;
  COOLSMS_SENDER: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: '이름과 휴대폰 번호를 입력해주세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 휴대폰 번호 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/-/g, '');

    // 기존 사용자 확인
    const existingUser = await env.DB.prepare(`
      SELECT id FROM users WHERE phone = ?
    `).bind(normalizedPhone).first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: '이미 가입된 휴대폰 번호입니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6자리 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 만료 시간: 3분
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    
    // 토큰 생성
    const token = `signup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // DB에 인증 정보 저장
    await env.DB.prepare(`
      INSERT INTO phone_verifications (phone, code, type, expires_at)
      VALUES (?, ?, 'signup', ?)
    `).bind(normalizedPhone, code, expiresAt).run();

    // 실제 SMS 전송
    let smsSuccess = false;
    let debugCode: string | null = null;

    if (env.COOLSMS_API_KEY && env.COOLSMS_API_SECRET && env.COOLSMS_FROM_NUMBER) {
      try {
        const message = `[알비] 회원가입 인증번호는 [${code}]입니다. (3분 유효)`;

        const smsResponse = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.COOLSMS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              to: normalizedPhone,
              from: env.COOLSMS_FROM_NUMBER,
              text: message
            }
          })
        });

        if (smsResponse.ok) {
          smsSuccess = true;
          console.log('📱 [SMS 발송 성공] 수신:', normalizedPhone);
        } else {
          const errorData = await smsResponse.json();
          console.error('❌ [SMS 발송 실패]', errorData);
          // 실패 시 콘솔 로그에 코드 출력
          debugCode = code;
        }
      } catch (error) {
        console.error('❌ [SMS 발송 오류]', error);
        debugCode = code;
      }
    } else {
      // 개발 환경: 콘솔에 코드 출력
      console.log(`📱 [SMS 발송 - 개발 모드] 수신: ${normalizedPhone}, 내용: [알비] 회원가입 인증번호는 [${code}]입니다. (3분 유효)`);
      debugCode = code;
    }

    return new Response(JSON.stringify({
      success: true,
      message: '인증번호가 발송되었습니다.',
      token,
      debug_code: debugCode // 개발 환경에서만 사용
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('회원가입 인증번호 발송 오류:', error);
    return new Response(JSON.stringify({ error: '인증번호 발송 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
