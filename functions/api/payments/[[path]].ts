// 결제 API 라우터
import type { Env } from '../../../src/types/env';

interface PaymentRequest {
  applicationId: string;
  jobId: string;
}

interface PaymentConfirmRequest {
  orderId: string;
  paymentKey: string;
  amount: number;
  applicationId: string;
  jobId: string;
}

// Toss Payments 비밀키는 환경 변수에서 가져옵니다
// 로컬: .dev.vars 파일
// 프로덕션: wrangler secret put TOSS_SECRET_KEY

// 총 근무시간 기반 결제 금액 계산 함수
function calculatePaymentAmount(totalWorkHours: number): number {
  console.log('💰 결제 금액 계산:', { totalWorkHours });
  
  if (totalWorkHours <= 1) {
    // 1시간 체험: 무료
    return 0;
  } else if (totalWorkHours <= 20) {
    // 초단기 (2~20시간): 시간당 1,500원 (최소 3,000원)
    return Math.max(totalWorkHours * 1500, 3000);
  } else if (totalWorkHours <= 160) {
    // 단기 (21~160시간): 30,000원 고정
    return 30000;
  } else {
    // 장기 (161시간 이상): 50,000원 고정
    return 50000;
  }
}

// 결제 금액 상세 정보 생성
function getPaymentDetails(totalWorkHours: number): { 
  amount: number; 
  category: string; 
  description: string;
  hourlyRate?: number;
} {
  const amount = calculatePaymentAmount(totalWorkHours);
  
  if (totalWorkHours <= 1) {
    return {
      amount,
      category: '1시간 체험',
      description: '무료 체험 (수수료 없음)'
    };
  } else if (totalWorkHours <= 20) {
    return {
      amount,
      category: '초단기 근로',
      description: `${totalWorkHours}시간 × 1,500원`,
      hourlyRate: 1500
    };
  } else if (totalWorkHours <= 160) {
    return {
      amount,
      category: '단기 근로',
      description: '1주~1개월 고정 수수료'
    };
  } else {
    return {
      amount,
      category: '장기 근로',
      description: '1개월 이상 고정 수수료'
    };
  }
}

// 이메일 전송 함수
async function sendPaymentEmail(
  recipientType: 'employer' | 'applicant',
  email: string,
  name: string,
  jobTitle: string,
  otherPartyName: string,
  amount: number,
  apiKey: string
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('ko-KR').format(amount);
  
  let subject = '';
  let html = '';

  if (recipientType === 'employer') {
    // 구인자용 이메일
    subject = `[알비] 결제가 완료되었습니다 - ${jobTitle}`;
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 결제 완료</h1>
            <p>채용 수수료 결제가 완료되었습니다</p>
          </div>
          <div class="content">
            <p><strong>${name}</strong> 님, 안녕하세요!</p>
            <p>알비를 이용해 주셔서 감사합니다. 채용 수수료 결제가 성공적으로 완료되었습니다.</p>
            
            <div class="info-box">
              <h3>📋 결제 정보</h3>
              <p><strong>채용 공고:</strong> ${jobTitle}</p>
              <p><strong>채용된 구직자:</strong> ${otherPartyName}</p>
              <p><strong>결제 금액:</strong></p>
              <div class="amount">${formattedAmount}원</div>
              <p style="color: #666; font-size: 14px;">※ VAT 포함 금액입니다</p>
            </div>

            <div class="info-box">
              <h3>✅ 다음 단계</h3>
              <ol>
                <li>구직자와 근무 시작일을 확인하세요</li>
                <li>근무 전 필요한 서류를 안내하세요</li>
                <li>첫 출근 시 업무 오리엔테이션을 진행하세요</li>
              </ol>
            </div>

            <p style="text-align: center;">
              <a href="https://albi.kr/employer/payment-receipt?paymentId=xxx" class="button">영수증 확인하기</a>
            </p>

            <div class="footer">
              <p>문의사항이 있으시면 언제든지 연락주세요</p>
              <p>📞 010-4459-4226 | 📧 albi260128@gmail.com</p>
              <p>© 2026 ALBI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // 구직자용 이메일
    subject = `[알비] 축하합니다! 정식 채용이 확정되었습니다 🎉`;
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
          .highlight { background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 채용 확정!</h1>
            <p>정식 채용이 확정되었습니다</p>
          </div>
          <div class="content">
            <p><strong>${name}</strong> 님, 축하합니다!</p>
            <p><strong>${otherPartyName}</strong>에서 결제를 완료하여 정식 채용이 확정되었습니다.</p>
            
            <div class="highlight">
              <p style="font-size: 18px; font-weight: bold; color: #059669; margin: 0;">
                ✨ 1시간 체험이 정규직으로 이어졌습니다!
              </p>
            </div>

            <div class="info-box">
              <h3>📋 채용 정보</h3>
              <p><strong>회사명:</strong> ${otherPartyName}</p>
              <p><strong>채용 공고:</strong> ${jobTitle}</p>
            </div>

            <div class="info-box">
              <h3>📝 다음 단계</h3>
              <ol>
                <li>사장님과 근무 시작일을 확인하세요</li>
                <li>필요한 서류를 준비하세요 (신분증, 통장 사본 등)</li>
                <li>첫 출근 전 연락처를 교환하세요</li>
                <li>출근 시간과 장소를 다시 한 번 확인하세요</li>
              </ol>
            </div>

            <div class="info-box">
              <h3>💡 TIP</h3>
              <ul>
                <li>첫 출근 시 15분 일찍 도착하세요</li>
                <li>단정한 복장을 준비하세요</li>
                <li>궁금한 점은 미리 질문하세요</li>
                <li>긍정적인 태도로 업무에 임하세요</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="https://albi.kr/mypage" class="button">마이페이지 확인하기</a>
            </p>

            <div class="footer">
              <p>취업을 축하드립니다! 알비가 응원합니다 💪</p>
              <p>문의: 📞 010-4459-4226 | 📧 albi260128@gmail.com</p>
              <p>© 2026 ALBI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ALBI <noreply@albi.kr>',
      to: [email],
      subject: subject,
      html: html
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/payments', '');

  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // 인증 확인
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: '인증이 필요합니다.' }), {
      status: 401,
      headers,
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 토큰 검증 및 사용자 정보 가져오기
    const session = await env.DB.prepare(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > datetime('now')`
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ success: false, message: '유효하지 않은 세션입니다.' }), {
        status: 401,
        headers,
      });
    }

    const userId = session.user_id as string;

    // 라우팅
    if (path === '/prepare' && request.method === 'POST') {
      return await handlePrepare(request, env, userId, headers);
    } else if (path === '/success' && request.method === 'POST') {
      return await handleSuccess(request, env, userId, headers);
    } else if (path === '/refund' && request.method === 'POST') {
      return await handleRefund(request, env, userId, headers);
    } else if (path === '/tax-invoice' && request.method === 'POST') {
      return await handleTaxInvoiceRequest(request, env, userId, headers);
    } else if (path === '' && request.method === 'GET') {
      // Query string에 paymentId가 있으면 단일 조회, 없으면 목록 조회
      const url = new URL(request.url);
      const paymentId = url.searchParams.get('paymentId');
      if (paymentId) {
        return await handleDetail(request, env, userId, headers);
      } else {
        return await handleList(request, env, userId, headers);
      }
    } else {
      return new Response(JSON.stringify({ success: false, message: '잘못된 요청입니다.' }), {
        status: 404,
        headers,
      });
    }
  } catch (error) {
    console.error('Payment API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
};

// 결제 준비 (결제 페이지 데이터 로드)
async function handlePrepare(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as PaymentRequest;
  const { applicationId, jobId } = body;

  if (!applicationId || !jobId) {
    return new Response(JSON.stringify({ success: false, message: '필수 파라미터가 누락되었습니다.' }), {
      status: 400,
      headers,
    });
  }

  // 1. 지원 정보 가져오기
  const application = await env.DB.prepare(
    `SELECT ja.*, j.title as job_title, j.company_name, j.location, j.job_type, 
            u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone
     FROM job_applications ja
     LEFT JOIN jobs j ON ja.job_id = j.id
     LEFT JOIN users u ON ja.user_id = u.id
     WHERE ja.id = ? AND j.user_id = ?`
  )
    .bind(applicationId, userId)
    .first();

  if (!application) {
    return new Response(JSON.stringify({ success: false, message: '지원 정보를 찾을 수 없습니다.' }), {
      status: 404,
      headers,
    });
  }

  // 2. 이미 결제했는지 확인
  if (application.payment_required) {
    return new Response(JSON.stringify({ success: false, message: '이미 결제가 완료된 매칭입니다.' }), {
      status: 400,
      headers,
    });
  }

  // 3. 구인자 정보 가져오기
  const employer = await env.DB.prepare(`SELECT name, email, phone FROM users WHERE id = ?`)
    .bind(userId)
    .first();

  // 4. job 정보에서 총 근무시간 가져오기
  const job = await env.DB.prepare(`SELECT total_work_hours, job_type FROM jobs WHERE id = ?`)
    .bind(jobId)
    .first();

  const totalWorkHours = job?.total_work_hours || 30; // 기본값 30시간 (단기)
  
  // 5. 결제 금액 동적 계산
  const amount = calculatePaymentAmount(totalWorkHours);
  const paymentDetails = getPaymentDetails(totalWorkHours);

  console.log('💳 결제 준비:', {
    jobId,
    totalWorkHours,
    amount,
    category: paymentDetails.category
  });

  return new Response(
    JSON.stringify({
      success: true,
      applicationId,
      jobId,
      amount,
      totalWorkHours,
      paymentCategory: paymentDetails.category,
      paymentDescription: paymentDetails.description,
      hourlyRate: paymentDetails.hourlyRate,
      job: {
        title: application.job_title,
        company_name: application.company_name,
        location: application.location,
        job_type: application.job_type,
      },
      applicant: {
        name: application.applicant_name,
        email: application.applicant_email,
        phone: application.applicant_phone,
      },
      employer: {
        name: employer?.name,
        email: employer?.email,
        phone: employer?.phone,
      },
    }),
    { headers }
  );
}

// 결제 성공 처리
async function handleSuccess(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as PaymentConfirmRequest;
  const { orderId, paymentKey, amount, applicationId, jobId } = body;

  if (!orderId || !paymentKey || !amount || !applicationId || !jobId) {
    return new Response(JSON.stringify({ success: false, message: '필수 파라미터가 누락되었습니다.' }), {
      status: 400,
      headers,
    });
  }

  // 1. Toss Payments API로 결제 승인 요청
  const tossSecretKey = env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
  
  try {
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('Toss Payments Error:', tossData);
      return new Response(
        JSON.stringify({
          success: false,
          message: '결제 승인에 실패했습니다.',
          error: tossData.message,
        }),
        { status: 400, headers }
      );
    }

    // 2. 결제 정보 DB에 저장
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await env.DB.prepare(
      `INSERT INTO payments 
       (id, user_id, application_id, job_id, amount, payment_method, 
        payment_status, transaction_id, pg_provider, paid_at, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, 'toss', datetime('now'), ?, ?)`
    )
      .bind(
        paymentId,
        userId,
        applicationId,
        jobId,
        amount,
        tossData.method || 'card',
        paymentKey,
        '알비 채용 성공 수수료',
        JSON.stringify(tossData)
      )
      .run();

    // 3. job_applications 업데이트 (정식 채용 확정)
    await env.DB.prepare(
      `UPDATE job_applications 
       SET payment_required = 1, payment_id = ?, payment_amount = ?, 
           status = 'hired', updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(paymentId, amount, applicationId)
      .run();

    // 4. 구직자 및 구인자 정보 가져오기
    const applicationDetail = await env.DB.prepare(
      `SELECT ja.user_id as applicant_id, u1.name as applicant_name, u1.email as applicant_email, u1.phone as applicant_phone,
              j.user_id as employer_id, u2.name as employer_name, u2.email as employer_email, u2.phone as employer_phone,
              j.title as job_title, j.company_name
       FROM job_applications ja
       LEFT JOIN users u1 ON ja.user_id = u1.id
       LEFT JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users u2 ON j.user_id = u2.id
       WHERE ja.id = ?`
    )
      .bind(applicationId)
      .first();

    if (applicationDetail) {
      // 4-1. 구직자에게 DB 알림 전송
      await env.DB.prepare(
        `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
         VALUES (?, ?, 'hire_confirmed', '축하합니다! 정식 채용이 확정되었습니다 🎉', 
                 '사장님이 결제를 완료하여 정식 채용이 확정되었습니다. 근무 시작 전 사장님과 상세 일정을 협의하세요.', 
                 '/mypage', datetime('now'))`
      )
        .bind(
          `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          applicationDetail.applicant_id
        )
        .run();

      // 4-2. 구직자에게 이메일 알림 발송
      if (applicationDetail.applicant_email && env.RESEND_API_KEY) {
        try {
          await sendPaymentEmail(
            'applicant',
            applicationDetail.applicant_email,
            applicationDetail.applicant_name,
            applicationDetail.job_title,
            applicationDetail.company_name,
            amount,
            env.RESEND_API_KEY
          );
        } catch (error) {
          console.error('Failed to send email to applicant:', error);
        }
      }

      // 4-3. 구인자에게 이메일 알림 발송
      if (applicationDetail.employer_email && env.RESEND_API_KEY) {
        try {
          await sendPaymentEmail(
            'employer',
            applicationDetail.employer_email,
            applicationDetail.employer_name,
            applicationDetail.job_title,
            applicationDetail.applicant_name,
            amount,
            env.RESEND_API_KEY
          );
        } catch (error) {
          console.error('Failed to send email to employer:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '결제가 성공적으로 완료되었습니다.',
        paymentId,
        amount,
        method: tossData.method,
        paidAt: tossData.approvedAt,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Payment Success Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '결제 처리 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 환불 처리
async function handleRefund(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as { paymentId: string; reason: string; amount?: number };
  const { paymentId, reason, amount } = body;

  if (!paymentId || !reason) {
    return new Response(JSON.stringify({ success: false, message: '필수 파라미터가 누락되었습니다.' }), {
      status: 400,
      headers,
    });
  }

  // 1. 결제 정보 가져오기
  const payment = await env.DB.prepare(
    `SELECT * FROM payments WHERE id = ? AND user_id = ? AND payment_status = 'completed'`
  )
    .bind(paymentId, userId)
    .first();

  if (!payment) {
    return new Response(JSON.stringify({ success: false, message: '결제 정보를 찾을 수 없습니다.' }), {
      status: 404,
      headers,
    });
  }

  const refundAmount = amount || payment.amount;

  // 2. Toss Payments API로 환불 요청
  const tossSecretKey = env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
  
  try {
    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${payment.transaction_id}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(tossSecretKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: reason,
          cancelAmount: refundAmount,
        }),
      }
    );

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('Toss Payments Refund Error:', tossData);
      return new Response(
        JSON.stringify({
          success: false,
          message: '환불 요청에 실패했습니다.',
          error: tossData.message,
        }),
        { status: 400, headers }
      );
    }

    // 3. DB 업데이트
    await env.DB.prepare(
      `UPDATE payments 
       SET payment_status = ?, refund_amount = ?, refund_reason = ?, 
           refunded_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(refundAmount === payment.amount ? 'refunded' : 'partial_refund', refundAmount, reason, paymentId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '환불이 성공적으로 처리되었습니다.',
        refundAmount,
        refundedAt: tossData.canceledAt,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Refund Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '환불 처리 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 결제 상세 조회
async function handleDetail(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('paymentId');

  if (!paymentId) {
    return new Response(JSON.stringify({ success: false, message: '결제 ID가 필요합니다.' }), {
      status: 400,
      headers,
    });
  }

  // 결제 정보 조회 (지원자 및 채용 정보 포함)
  const payment = await env.DB.prepare(
    `SELECT p.*, 
            j.title as job_title, j.company_name, j.location, j.job_type,
            u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone
     FROM payments p
     LEFT JOIN jobs j ON p.job_id = j.id
     LEFT JOIN job_applications ja ON p.application_id = ja.id
     LEFT JOIN users u ON ja.user_id = u.id
     WHERE p.id = ? AND p.user_id = ?`
  )
    .bind(paymentId, userId)
    .first();

  if (!payment) {
    return new Response(JSON.stringify({ success: false, message: '결제 정보를 찾을 수 없습니다.' }), {
      status: 404,
      headers,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      payment,
    }),
    { headers }
  );
}

// 결제 내역 조회
async function handleList(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const status = url.searchParams.get('status') || '';
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, j.title as job_title, u.name as applicant_name,
           tir.id as tax_invoice_id, tir.status as tax_invoice_status, tir.issued_at as tax_invoice_issued_at
    FROM payments p
    LEFT JOIN jobs j ON p.job_id = j.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN tax_invoice_requests tir ON p.id = tir.payment_id
    WHERE p.user_id = ?
  `;
  const params: any[] = [userId];

  if (status) {
    query += ` AND p.payment_status = ?`;
    params.push(status);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const payments = await env.DB.prepare(query).bind(...params).all();

  const totalResult = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM payments WHERE user_id = ?${status ? ' AND payment_status = ?' : ''}`
  )
    .bind(...(status ? [userId, status] : [userId]))
    .first();

  const total = (totalResult?.count as number) || 0;

  return new Response(
    JSON.stringify({
      success: true,
      payments: payments.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
    { headers }
  );
}

// 세금계산서 발행 요청
async function handleTaxInvoiceRequest(
  request: Request,
  env: Env,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { paymentId, businessNumber, businessName, ceoName, businessAddress, email } = body;

    if (!paymentId || !businessNumber || !businessName || !ceoName || !email) {
      return new Response(
        JSON.stringify({ success: false, message: '필수 항목을 모두 입력해주세요.' }),
        { status: 400, headers }
      );
    }

    // 결제 정보 확인
    const payment = await env.DB.prepare(
      `SELECT * FROM payments WHERE id = ? AND user_id = ?`
    )
      .bind(paymentId, userId)
      .first();

    if (!payment) {
      return new Response(
        JSON.stringify({ success: false, message: '결제 정보를 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    if (payment.payment_status !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, message: '완료된 결제만 세금계산서를 발행할 수 있습니다.' }),
        { status: 400, headers }
      );
    }

    // 세금계산서 요청 정보 저장
    await env.DB.prepare(
      `INSERT INTO tax_invoice_requests 
       (payment_id, user_id, business_number, business_name, ceo_name, business_address, email, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
    )
      .bind(paymentId, userId, businessNumber, businessName, ceoName, businessAddress || '', email)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '세금계산서 발행 요청이 완료되었습니다. 영업일 기준 1-2일 내에 이메일로 발송됩니다.',
      }),
      { headers }
    );
  } catch (error) {
    console.error('Tax Invoice Request Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '세금계산서 요청 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}
