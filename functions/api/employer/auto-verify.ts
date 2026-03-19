/**
 * 홈택스 사업자등록번호 자동 인증 API
 * 
 * 공공데이터포털의 국세청 사업자등록정보 진위확인 서비스를 사용하여
 * 사업자등록번호를 실시간으로 검증합니다.
 * 
 * API 키 발급: https://www.data.go.kr/data/15081808/openapi.do
 */

interface Env {
  DB: D1Database;
  HOMETAX_API_KEY?: string; // 공공데이터포털 API 키
  [key: string]: any; // 다른 환경 변수들도 허용
}

interface BusinessVerificationResponse {
  status_code: string;
  request_cnt: number;
  match_cnt: number;
  data: Array<{
    b_no: string;
    b_stt: string; // 납세자상태(명칭): 계속사업자, 휴업자, 폐업자
    b_stt_cd: string; // 납세자상태(코드): "01", "02", "03"
    tax_type: string;
    tax_type_cd: string;
    end_dt: string;
    utcc_yn: string;
    tax_type_change_dt: string;
    invoice_apply_dt: string;
    rbf_tax_type?: string;
    rbf_tax_type_cd?: string;
  }>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    console.log('🏢 사업자등록번호 자동 인증 시작');

    // 1. 로그인 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Authorization 헤더 없음');
      return new Response(
        JSON.stringify({ success: false, error: '로그인이 필요합니다.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);

    // 2. 세션 확인
    const sessionResult = await env.DB.prepare(
      `SELECT user_id, expires_at FROM sessions WHERE token = ?`
    ).bind(token).first();

    if (!sessionResult || new Date(sessionResult.expires_at as string) < new Date()) {
      console.log('❌ 유효하지 않은 세션');
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 세션입니다. 다시 로그인해주세요.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = sessionResult.user_id;
    console.log('✅ 세션 확인 완료:', userId);

    // 3. 요청 데이터 파싱
    const formData = await request.formData();
    const businessNumber = formData.get('business_registration_number') as string;
    const businessName = formData.get('business_name') as string;

    console.log('📝 요청 데이터:', { businessNumber, businessName });

    if (!businessNumber || !businessName) {
      return new Response(
        JSON.stringify({ success: false, error: '사업자등록번호와 상호명을 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. 홈택스 API 키 확인
    // Cloudflare Pages Secrets는 env 객체에 자동으로 바인딩됨
    const apiKey = (env as any).HOMETAX_API_KEY || env.HOMETAX_API_KEY;
    
    console.log('🔑 API 키 상태:', apiKey ? `설정됨 (${apiKey.substring(0, 10)}...)` : '미설정');
    console.log('🔑 ENV 키 목록:', Object.keys(env).filter(k => !k.includes('DB')));
    
    if (!apiKey) {
      console.warn('⚠️ 홈택스 API 키가 설정되지 않았습니다. 수동 승인으로 처리됩니다.');
      
      // API 키가 없는 경우 수동 승인 프로세스로 처리
      const existingRequest = await env.DB.prepare(
        `SELECT id FROM employer_verification_requests 
         WHERE user_id = ? AND status = 'pending'`
      ).bind(userId).first();

      if (existingRequest) {
        return new Response(
          JSON.stringify({ success: false, error: '이미 심사 중인 요청이 있습니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const insertResult = await env.DB.prepare(
        `INSERT INTO employer_verification_requests 
         (user_id, business_registration_number, business_name, status) 
         VALUES (?, ?, ?, 'pending')`
      ).bind(userId, businessNumber, businessName).run();

      return new Response(
        JSON.stringify({
          success: true,
          verified: false,
          requestId: insertResult.meta.last_row_id,
          message: '사업자등록번호 자동 인증 기능이 활성화되지 않았습니다. 관리자 승인 후 구인 공고를 등록할 수 있습니다.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. 홈택스 API 호출 (상태조회 API 사용)
    const b_no = businessNumber.replace(/-/g, ''); // 하이픈 제거

    // 요청 body는 b_no 배열 형식
    const requestBody = {
      b_no: [b_no]
    };

    console.log('🌐 홈택스 API 호출 (상태조회):', requestBody);
    console.log('🔑 API 키 앞 10자리:', apiKey.substring(0, 10));

    // API 키를 URL 인코딩
    const encodedApiKey = encodeURIComponent(apiKey);
    // 상태조회 API 엔드포인트 사용
    const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodedApiKey}`;
    
    console.log('🌐 요청 URL (키 제외):', apiUrl.replace(encodedApiKey, '***'));

    const hometaxResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 홈택스 API 응답 상태:', hometaxResponse.status);

    if (!hometaxResponse.ok) {
      const errorText = await hometaxResponse.text();
      console.error('❌ 홈택스 API 호출 실패:', hometaxResponse.status, hometaxResponse.statusText);
      console.error('❌ 에러 응답:', errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: '홈택스 API 호출에 실패했습니다.',
          details: `상태 코드: ${hometaxResponse.status}, 메시지: ${errorText.substring(0, 200)}`
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const hometaxData: BusinessVerificationResponse = await hometaxResponse.json();
    console.log('📦 홈택스 API 응답:', JSON.stringify(hometaxData, null, 2));

    // 6. 응답 검증
    if (hometaxData.status_code !== 'OK' || !hometaxData.data || hometaxData.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '사업자등록번호 조회에 실패했습니다. 입력한 정보를 다시 확인해주세요.',
          details: `status_code: ${hometaxData.status_code}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const businessData = hometaxData.data[0];
    const isValid = businessData.b_stt_cd === '01'; // "01": 계속사업자

    console.log('📋 사업자 상태:', {
      b_stt_cd: businessData.b_stt_cd,
      b_stt: businessData.b_stt,
      isValid,
      tax_type: businessData.tax_type
    });

    // 7. 사업자등록번호가 유효하지 않은 경우
    if (!isValid) {
      let errorMessage = '유효하지 않은 사업자등록번호입니다.';
      
      if (businessData.b_stt_cd === '02') {
        errorMessage = '휴업 중인 사업자입니다.';
      } else if (businessData.b_stt_cd === '03') {
        errorMessage = '폐업한 사업자입니다.';
      }

      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: errorMessage,
          details: `납세자상태: ${businessData.b_stt}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. 사업자등록번호가 유효한 경우 - 자동 승인
    console.log('✅ 사업자등록번호 유효 - 자동 승인 처리');

    // 8-1. 기존 요청 확인
    const existingRequest = await env.DB.prepare(
      `SELECT id FROM employer_verification_requests 
       WHERE user_id = ? AND status = 'pending'`
    ).bind(userId).first();

    if (existingRequest) {
      // 기존 요청을 승인 처리
      await env.DB.prepare(
        `UPDATE employer_verification_requests 
         SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'auto'
         WHERE id = ?`
      ).bind(existingRequest.id).run();
    } else {
      // 새로운 요청 생성 및 자동 승인
      await env.DB.prepare(
        `INSERT INTO employer_verification_requests 
         (user_id, business_registration_number, business_name, status, reviewed_at, reviewed_by) 
         VALUES (?, ?, ?, 'approved', CURRENT_TIMESTAMP, 'auto')`
      ).bind(userId, businessNumber, businessName).run();
    }

    // 8-2. 사용자 테이블 업데이트
    await env.DB.prepare(
      `UPDATE users 
       SET business_registration_verified = 1, 
           business_registration_number = ?,
           business_name = ?
       WHERE id = ?`
    ).bind(businessNumber, businessName, userId).run();

    console.log('✅ 사용자 인증 완료:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: '✅ 사업자등록번호가 자동으로 인증되었습니다! 이제 구인 공고를 등록할 수 있습니다.',
        businessInfo: {
          businessNumber,
          businessName,
          status: {
            b_stt: businessData.b_stt,
            b_stt_cd: businessData.b_stt_cd,
            tax_type: businessData.tax_type
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ 사업자등록번호 자동 인증 오류:', err);
    console.error('❌ 에러 타입:', err.name);
    console.error('❌ 에러 메시지:', err.message);
    console.error('❌ 스택 트레이스:', err.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: '사업자등록번호 인증 중 오류가 발생했습니다.',
        details: `${err.name}: ${err.message}`,
        stack: err.stack?.split('\n').slice(0, 3).join('\n') // 처음 3줄만
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
