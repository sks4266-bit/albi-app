/**
 * 회원가입 API
 * 
 * POST /api/auth/signup
 * 
 * Request Body: FormData
 * - name: 이름
 * - phone: 휴대폰번호
 * - email: 이메일
 * - password: 비밀번호
 * - user_type: jobseeker | employer
 * - verification_token: 휴대폰 인증 토큰
 * - carrier: 통신사
 * - birth_date: 생년월일
 * - gender: 성별
 * - agreed_terms: 이용약관 동의
 * - agreed_privacy: 개인정보 동의
 * - agreed_marketing: 마케팅 동의
 * - business_registration_number: 사업자번호 (구인자만)
 * - business_name: 사업자명 (구인자만)
 * - business_registration_file: 사업자등록증 (구인자만)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "회원가입이 완료되었습니다.",
 *   "userId": "user_xxx",
 *   "sessionId": "session_xxx"
 * }
 */

interface Env {
  DB: D1Database;
  R2?: R2Bucket;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // FormData 파싱
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string || null;
    const password = formData.get('password') as string;
    const userType = formData.get('user_type') as string;
    const carrier = formData.get('carrier') as string || null;
    const birthDate = formData.get('birth_date') as string || null;
    const gender = formData.get('gender') as string || null;
    const agreedTerms = formData.get('agreed_terms') === 'true';
    const agreedPrivacy = formData.get('agreed_privacy') === 'true';
    const agreedMarketing = formData.get('agreed_marketing') === 'true';
    const referralCode = formData.get('referral_code') as string || null;

    // 구인자 추가 정보
    const businessNumber = formData.get('business_registration_number') as string || null;
    const businessName = formData.get('business_name') as string || null;
    const businessFile = formData.get('business_registration_file') as File | null;

    console.log('📝 회원가입 요청:', {
      name,
      phone,
      email,
      userType,
      businessNumber,
      businessName,
      hasFile: !!businessFile
    });

    // 입력값 검증
    if (!name || !phone || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이름, 휴대폰번호, 비밀번호는 필수입니다.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!agreedTerms || !agreedPrivacy) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '필수 약관에 동의해주세요.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 구인자의 경우 사업자등록 정보 필수
    if (userType === 'employer' && (!businessNumber || !businessName || !businessFile)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '구인자는 사업자등록 정보가 필수입니다.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const cleanPhone = phone.replace(/-/g, '');

    // 중복 확인
    const existingUser = await env.DB.prepare(`
      SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)
    `).bind(cleanPhone, email).first();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '이미 가입된 휴대폰번호 또는 이메일입니다.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 비밀번호 해시 (실제 프로덕션에서는 bcrypt 사용)
    // 개발 환경에서는 간단하게 처리
    const passwordHash = password; // TODO: bcrypt hash 적용

    // 사용자 ID 생성
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 고유 추천인 코드 생성 (6자리 영숫자)
    const myReferralCode = `${name.substring(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}${Date.now().toString().slice(-2)}`;
    
    // 추천인 코드 확인 및 검증
    let referrerId = null;
    if (referralCode) {
      const referrer = await env.DB.prepare(`
        SELECT id FROM users WHERE referral_code = ?
      `).bind(referralCode).first<{ id: string }>();
      
      if (referrer) {
        referrerId = referrer.id;
        console.log('✅ 유효한 추천인 코드:', referralCode, '추천인 ID:', referrerId);
      } else {
        console.log('⚠️ 유효하지 않은 추천인 코드:', referralCode);
      }
    }

    // 사업자등록증 업로드 (구인자만)
    let businessFileUrl = null;
    if (userType === 'employer' && businessFile) {
      try {
        // 파일명 생성
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileExt = businessFile.name.split('.').pop();
        const fileName = `business_reg_${timestamp}_${randomStr}.${fileExt}`;

        // R2 업로드 (R2가 설정된 경우)
        if (env.R2) {
          const fileBuffer = await businessFile.arrayBuffer();
          await env.R2.put(`business-registrations/${fileName}`, fileBuffer, {
            httpMetadata: {
              contentType: businessFile.type
            },
            customMetadata: {
              userId: userId,
              businessNumber: businessNumber!,
              businessName: businessName!,
              uploadedAt: new Date().toISOString()
            }
          });

          businessFileUrl = `https://your-r2-bucket.com/business-registrations/${fileName}`;
          console.log('✅ R2 업로드 성공:', businessFileUrl);
        } else {
          // 개발 환경: Mock URL
          businessFileUrl = `/uploads/business-registrations/${fileName}`;
          console.log('✅ Mock 업로드 (개발 모드):', businessFileUrl);
        }

        // 사업자등록증 정보 저장
        await env.DB.prepare(`
          INSERT INTO business_registrations 
          (user_id, business_number, business_name, file_url, file_name, uploaded_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(userId, businessNumber, businessName, businessFileUrl, fileName).run();
      } catch (uploadError) {
        console.error('⚠️ 사업자등록증 업로드 실패:', uploadError);
        // 업로드 실패해도 회원가입은 진행
      }
    }

    // 사용자 등록
    await env.DB.prepare(`
      INSERT INTO users (
        id, name, phone, email, password_hash, user_type,
        carrier, birth_date, gender,
        business_number, business_name, business_registration_url,
        agreed_terms, agreed_privacy, agreed_marketing,
        phone_verified, is_verified, points,
        referral_code, referred_by,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        1, 1, ?,
        ?, ?,
        datetime('now'), datetime('now')
      )
    `).bind(
      userId, name, cleanPhone, email, passwordHash, userType,
      carrier, birthDate, gender,
      businessNumber, businessName, businessFileUrl,
      agreedTerms ? 1 : 0, agreedPrivacy ? 1 : 0, agreedMarketing ? 1 : 0,
      referrerId ? 100 : 50, // 추천인 있으면 추가 보상 (기본 50P, 추천 100P)
      myReferralCode, referrerId
    ).run();

    console.log('✅ 사용자 등록 완료:', userId, '추천인 코드:', myReferralCode);

    // 가입 축하 포인트 지급 내역
    const signupPoints = referrerId ? 100 : 50;
    await env.DB.prepare(`
      INSERT INTO point_transactions (
        user_id, type, amount, description, created_at
      ) VALUES (?, 'signup', ?, ?, datetime('now'))
    `).bind(
      userId, 
      signupPoints, 
      referrerId ? '가입 축하 포인트 (50P) + 추천 코드 사용 보너스 (50P)' : '가입 축하 포인트 (50P)'
    ).run();
    
    // 추천인이 있는 경우 처리
    if (referrerId) {
      // referrals 테이블에 관계 저장
      await env.DB.prepare(`
        INSERT INTO referrals (referrer_id, referee_id, reward_given, created_at)
        VALUES (?, ?, 1, datetime('now'))
      `).bind(referrerId, userId).run();
      
      // 추천인에게 포인트 지급 (50P)
      await env.DB.prepare(`
        UPDATE users SET points = points + 50 WHERE id = ?
      `).bind(referrerId).run();
      
      await env.DB.prepare(`
        INSERT INTO point_transactions (
          user_id, type, amount, description, created_at
        ) VALUES (?, 'referral_signup', 50, '친구 추천 보상 (가입)', datetime('now'))
      `).bind(referrerId).run();
      
      console.log('✅ 추천인 포인트 지급 완료:', referrerId, '+50P');
    }

    // 세션 생성
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sessionToken = sessionId;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(sessionId, userId, sessionToken, expiresAt).run();

    console.log('✅ 세션 생성 완료:', sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        message: referrerId 
          ? '회원가입이 완료되었습니다. 추천 코드 사용으로 100P를 받았어요! 🎉' 
          : '회원가입이 완료되었습니다. 가입 축하 50P를 받았어요! 🎁',
        userId: userId,
        sessionId: sessionId,
        points: signupPoints,
        referralCode: myReferralCode,
        hasReferrer: !!referrerId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '회원가입 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
