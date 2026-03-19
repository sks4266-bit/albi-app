/**
 * 📄 전자계약서 API
 * - 계약서 생성 및 저장
 * - 서명 데이터 관리
 * - 계약서 이력 조회
 * - PDF 생성 및 다운로드
 * - 이메일 알림
 */

import { sendContractNotifications } from './email-service';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
}

interface ContractData {
  // 근로자 정보
  worker_name: string;
  worker_birth: string;
  worker_phone: string;
  worker_email?: string; // 이메일 추가
  worker_address: string;
  worker_signature: string; // Base64

  // 사업주 정보
  employer_company: string;
  employer_name: string;
  employer_business_number: string;
  employer_phone: string;
  employer_email?: string; // 이메일 추가
  employer_address: string;
  employer_signature: string; // Base64

  // 근로조건
  work_start_date: string;
  work_end_date: string;
  work_hours: string;
  work_days: string;
  hourly_wage: number;
  payment_day: string;
  job_description: string;
}

/**
 * POST /api/contracts
 * 계약서 생성 및 저장
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as ContractData;

    // 필수 필드 검증
    const requiredFields = [
      'worker_name', 'worker_signature',
      'employer_company', 'employer_signature',
      'work_start_date', 'hourly_wage'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(JSON.stringify({
          success: false,
          error: `필수 항목이 누락되었습니다: ${field}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 계약서 ID 생성
    const contractId = generateContractId();

    // DB에 저장
    const result = await context.env.DB.prepare(`
      INSERT INTO contracts (
        contract_id,
        worker_name, worker_birth, worker_phone, worker_address, worker_signature,
        employer_company, employer_name, employer_business_number, employer_phone, employer_address, employer_signature,
        work_start_date, work_end_date, work_hours, work_days, hourly_wage, payment_day, job_description,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', unixepoch())
    `).bind(
      contractId,
      body.worker_name,
      body.worker_birth || '',
      body.worker_phone || '',
      body.worker_address || '',
      body.worker_signature,
      body.employer_company,
      body.employer_name || '',
      body.employer_business_number || '',
      body.employer_phone || '',
      body.employer_address || '',
      body.employer_signature,
      body.work_start_date,
      body.work_end_date || '',
      body.work_hours || '',
      body.work_days || '',
      body.hourly_wage,
      body.payment_day || '',
      body.job_description || ''
    ).run();

    console.log('✅ Contract created:', contractId);

    // 첫 고용 성공 시 추천인에게 포인트 지급 (200P)
    try {
      // 근로자의 user_id 찾기 (휴대폰 번호로)
      const worker = await context.env.DB.prepare(`
        SELECT id, referred_by FROM users WHERE phone = ?
      `).bind(body.worker_phone).first<{ id: string; referred_by: string | null }>();
      
      if (worker && worker.referred_by) {
        // 이미 채용 보상을 받았는지 확인
        const referral = await context.env.DB.prepare(`
          SELECT hire_reward_given FROM referrals 
          WHERE referrer_id = ? AND referee_id = ?
        `).bind(worker.referred_by, worker.id).first<{ hire_reward_given: number }>();
        
        if (referral && !referral.hire_reward_given) {
          // 추천인에게 포인트 지급
          await context.env.DB.prepare(`
            UPDATE users SET points = points + 200 WHERE id = ?
          `).bind(worker.referred_by).run();
          
          // 포인트 내역 추가
          await context.env.DB.prepare(`
            INSERT INTO point_transactions (
              id, user_id, amount, description, created_at
            ) VALUES (?, ?, 200, '친구 추천 보상 (첫 고용 성공)', datetime('now'))
          `).bind(crypto.randomUUID().substring(0, 16), worker.referred_by).run();
          
          // 보상 지급 플래그 업데이트
          await context.env.DB.prepare(`
            UPDATE referrals SET hire_reward_given = 1 
            WHERE referrer_id = ? AND referee_id = ?
          `).bind(worker.referred_by, worker.id).run();
          
          console.log('✅ First hire reward given to referrer:', worker.referred_by, '+200P');
        }
      }
    } catch (referralError) {
      console.error('⚠️ Referral reward error (contract still created):', referralError);
      // 포인트 지급 실패해도 계약서는 저장됨
    }

    // 이메일 알림 전송
    let emailResults = null;
    if (context.env.RESEND_API_KEY) {
      try {
        console.log('📧 Sending email notifications...');
        
        const pdfUrl = `${new URL(context.request.url).origin}/api/contracts/${contractId}?format=pdf`;
        
        emailResults = await sendContractNotifications({
          contractId,
          workerName: body.worker_name,
          workerEmail: body.worker_email || '',
          employerCompany: body.employer_company,
          employerEmail: body.employer_email || '',
          workStartDate: body.work_start_date,
          hourlyWage: body.hourly_wage,
          pdfUrl
        }, context.env.RESEND_API_KEY);
        
        console.log('✅ Email notifications sent:', emailResults);
      } catch (emailError: any) {
        console.error('⚠️ Email notification failed (contract still created):', emailError);
        // 이메일 실패해도 계약서는 저장됨
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email notifications');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        contractId,
        message: '계약서가 성공적으로 저장되었습니다.',
        pdfUrl: `/api/contracts/${contractId}?format=pdf`,
        emailSent: emailResults ? (emailResults.worker || emailResults.employer) : false
      }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ Contract creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || '계약서 저장 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * GET /api/contracts
 * 계약서 목록 조회 (검색/필터링 지원)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const userType = url.searchParams.get('userType') || 'worker';
    const status = url.searchParams.get('status'); // 상태 필터
    const search = url.searchParams.get('search'); // 검색어
    const sortBy = url.searchParams.get('sortBy') || 'created_at'; // 정렬 기준
    const order = url.searchParams.get('order') || 'DESC'; // 정렬 순서

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'userId가 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 쿼리 빌드
    let query = 'SELECT * FROM contracts WHERE ';
    const params: any[] = [];

    // 사용자 타입에 따른 조건
    if (userType === 'employer') {
      query += 'employer_name = ? ';
      params.push(userId);
    } else {
      query += 'worker_name = ? ';
      params.push(userId);
    }

    // 상태 필터
    if (status && ['active', 'completed', 'terminated'].includes(status)) {
      query += 'AND status = ? ';
      params.push(status);
    }

    // 검색 (회사명, 근로자명, 계약번호)
    if (search) {
      query += 'AND (employer_company LIKE ? OR worker_name LIKE ? OR contract_id LIKE ?) ';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 정렬
    const validSortFields = ['created_at', 'work_start_date', 'hourly_wage', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += `ORDER BY ${sortField} ${sortOrder}`;

    // 실행
    const stmt = context.env.DB.prepare(query);
    let boundStmt = stmt;
    params.forEach((param, index) => {
      boundStmt = boundStmt.bind(param);
    });

    const contracts = await boundStmt.all();

    return new Response(JSON.stringify({
      success: true,
      data: contracts.results || [],
      count: contracts.results?.length || 0
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ Contracts fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || '계약서 목록 조회 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * OPTIONS /api/contracts
 * CORS preflight
 */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
};

/**
 * 계약서 ID 생성
 */
function generateContractId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `CONTRACT-${timestamp}-${random}`.toUpperCase();
}
