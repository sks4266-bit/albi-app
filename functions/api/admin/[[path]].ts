// 관리자 전용 API 라우터
import type { Env } from '../../../src/types/env';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/admin', '');

  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  // 간단한 토큰 검증 함수 (admin-auth.ts와 동일한 로직)
  function validateToken(token: string): boolean {
    try {
      const decoded = JSON.parse(atob(token));
      const age = Date.now() - decoded.timestamp;
      // 24시간 유효
      return age < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  // 토큰 검증
  const isValid = validateToken(token);
  if (!isValid) {
    return new Response(JSON.stringify({ success: false, message: '유효하지 않은 세션입니다.' }), {
      status: 401,
      headers,
    });
  }

  try {
    // 관리자는 별도 user_id 없이 진행
    const userId = 'admin';

    // 라우팅
    if (path === '/stats' && request.method === 'GET') {
      return await handleStats(request, env, headers);
    } else if (path === '/charts' && request.method === 'GET') {
      return await handleCharts(request, env, headers);
    } else if (path === '/transactions' && request.method === 'GET') {
      return await handleTransactions(request, env, headers);
    } else if (path === '/purchases' && request.method === 'GET') {
      return await handlePurchases(request, env, headers);
    } else if (path === '/payments' && request.method === 'GET') {
      return await handlePayments(request, env, headers);
    } else if (path === '/payments/stats' && request.method === 'GET') {
      return await handlePaymentStats(request, env, headers);
    } else if (path === '/users' && request.method === 'GET') {
      return await handleUsers(request, env, headers);
    } else if (path === '/dashboard/stats' && request.method === 'GET') {
      return await handleDashboardStats(request, env, headers);
    } else if (path === '/tax-invoices' && request.method === 'GET') {
      return await handleTaxInvoices(request, env, headers);
    } else if (path === '/tax-invoices/stats' && request.method === 'GET') {
      return await handleTaxInvoiceStats(request, env, headers);
    } else if (path.startsWith('/tax-invoices/') && path.endsWith('/approve') && request.method === 'POST') {
      const invoiceId = path.split('/')[2];
      return await handleApproveTaxInvoice(request, env, headers, invoiceId);
    } else if (path.startsWith('/tax-invoices/') && path.endsWith('/reject') && request.method === 'POST') {
      const invoiceId = path.split('/')[2];
      return await handleRejectTaxInvoice(request, env, headers, invoiceId);
    } else if (path === '/noshow-reports' && request.method === 'GET') {
      return await handleNoshowReports(request, env, headers);
    } else if (path === '/ai-training/conversations' && request.method === 'GET') {
      return await handleAIConversations(request, env, headers);
    } else if (path === '/ai-training/sessions' && request.method === 'GET') {
      return await handleAISessions(request, env, headers);
    } else if (path === '/ai-training/patterns' && request.method === 'GET') {
      return await handleAIPatterns(request, env, headers);
    } else if (path === '/ai-training/stats' && request.method === 'GET') {
      return await handleAITrainingStats(request, env, headers);
    } else {
      return new Response(JSON.stringify({ success: false, message: '잘못된 요청입니다.' }), {
        status: 404,
        headers,
      });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
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

// 결제 관리 (관리자용)
async function handlePayments(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const status = url.searchParams.get('status') || '';
  const method = url.searchParams.get('method') || '';
  const userId = url.searchParams.get('userId') || '';
  const offset = (page - 1) * limit;

  try {
    // 결제 목록 조회
    let query = `
      SELECT p.*, 
             u.name as user_name, 
             u.phone as user_phone,
             u.email as user_email,
             j.title as job_title,
             j.company_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN jobs j ON p.job_id = j.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND p.payment_status = ?`;
      params.push(status);
    }

    if (method) {
      query += ` AND p.payment_method = ?`;
      params.push(method);
    }

    if (userId) {
      query += ` AND p.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const paymentsResult = await env.DB.prepare(query).bind(...params).all();

    // 전체 결제 수 조회
    let countQuery = `SELECT COUNT(*) as count FROM payments p WHERE 1=1`;
    const countParams: any[] = [];

    if (status) {
      countQuery += ` AND p.payment_status = ?`;
      countParams.push(status);
    }

    if (method) {
      countQuery += ` AND p.payment_method = ?`;
      countParams.push(method);
    }

    if (userId) {
      countQuery += ` AND p.user_id = ?`;
      countParams.push(userId);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = (countResult?.count as number) || 0;

    // 통계 데이터 조회
    const statsResult = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as completedCount,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN payment_status = 'refunded' OR payment_status = 'partial_refund' THEN refund_amount ELSE 0 END) as totalRefunded
      FROM payments
    `).first();

    // 결제 수단별 통계
    const methodStatsResult = await env.DB.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM payments
      WHERE payment_status = 'completed'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        payments: paymentsResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalCount: statsResult?.totalCount || 0,
          completedCount: statsResult?.completedCount || 0,
          pendingCount: statsResult?.pendingCount || 0,
          totalRevenue: statsResult?.totalRevenue || 0,
          totalRefunded: statsResult?.totalRefunded || 0,
        },
        methodStats: methodStatsResult.results,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Admin payments error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '결제 데이터 조회 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 사용자 관리 (관리자용)
async function handleUsers(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const userType = url.searchParams.get('userType') || '';
  const search = url.searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT id, name, email, phone, user_type, created_at FROM users WHERE 1=1`;
    const params: any[] = [];

    if (userType) {
      query += ` AND user_type = ?`;
      params.push(userType);
    }

    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const usersResult = await env.DB.prepare(query).bind(...params).all();

    // 전체 사용자 수
    let countQuery = `SELECT COUNT(*) as count FROM users WHERE 1=1`;
    const countParams: any[] = [];

    if (userType) {
      countQuery += ` AND user_type = ?`;
      countParams.push(userType);
    }

    if (search) {
      countQuery += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = (countResult?.count as number) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        users: usersResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error('Admin users error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '사용자 데이터 조회 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 대시보드 통계 (관리자용)
async function handleDashboardStats(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    // 사용자 통계
    const userStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_type = 'jobseeker' THEN 1 ELSE 0 END) as jobseekers,
        SUM(CASE WHEN user_type = 'employer' THEN 1 ELSE 0 END) as employers,
        SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as todayNew
      FROM users
    `).first();

    // 포인트 통계
    const pointStats = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalIssued,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalUsed,
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN DATE(created_at) = DATE('now') AND amount > 0 THEN amount ELSE 0 END) as todayIssued
      FROM point_transactions
    `).first();

    // 결제 통계
    const paymentStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN DATE(paid_at) = DATE('now') AND payment_status = 'completed' THEN amount ELSE 0 END) as todayRevenue
      FROM payments
    `).first();

    // 스토어 구매 통계
    const storeStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as completed
      FROM store_purchases
    `).first();

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          users: userStats,
          points: pointStats,
          payments: paymentStats,
          store: storeStats,
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '통계 데이터 조회 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 세금계산서 요청 목록 조회
async function handleTaxInvoices(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || '';
    const searchCompany = url.searchParams.get('search_company') || '';
    const searchBusinessNumber = url.searchParams.get('search_business_number') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ti.*,
        p.amount as payment_amount,
        p.payment_method,
        p.paid_at,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        j.title as job_title,
        j.company_name
      FROM tax_invoice_requests ti
      LEFT JOIN payments p ON ti.payment_id = p.id
      LEFT JOIN users u ON ti.user_id = u.id
      LEFT JOIN job_applications ja ON p.application_id = ja.id
      LEFT JOIN jobs j ON p.job_id = j.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND ti.status = ?';
      params.push(status);
    }
    
    if (searchCompany) {
      query += ' AND ti.business_name LIKE ?';
      params.push(`%${searchCompany}%`);
    }
    
    if (searchBusinessNumber) {
      query += ' AND ti.business_number LIKE ?';
      params.push(`%${searchBusinessNumber}%`);
    }

    query += ' ORDER BY ti.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const invoices = await env.DB.prepare(query).bind(...params).all();

    // 총 개수 조회 (검색 조건 포함)
    let countQuery = 'SELECT COUNT(*) as count FROM tax_invoice_requests WHERE 1=1';
    const countParams: any[] = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (searchCompany) {
      countQuery += ' AND business_name LIKE ?';
      countParams.push(`%${searchCompany}%`);
    }
    if (searchBusinessNumber) {
      countQuery += ' AND business_number LIKE ?';
      countParams.push(`%${searchBusinessNumber}%`);
    }
    
    const totalResult = await env.DB.prepare(countQuery)
      .bind(...countParams)
      .first();

    const total = (totalResult?.count as number) || 0;

    // 상태별 통계
    const statsResult = await env.DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tax_invoice_requests
      GROUP BY status
    `).all();

    const stats = {
      pending: 0,
      issued: 0,
      rejected: 0,
    };

    statsResult.results.forEach((row: any) => {
      stats[row.status as keyof typeof stats] = row.count;
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoices: invoices.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Tax invoices error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '세금계산서 목록 조회 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 세금계산서 승인
async function handleApproveTaxInvoice(
  request: Request,
  env: Env,
  headers: Record<string, string>,
  invoiceId: string
): Promise<Response> {
  try {
    // 세금계산서 요청 정보 조회 (결제 및 공고 정보 포함)
    const invoice = await env.DB.prepare(
      `SELECT 
        tir.*,
        p.amount,
        p.payment_status,
        j.title as job_title,
        u.name as applicant_name,
        u.email as user_email
       FROM tax_invoice_requests tir
       LEFT JOIN payments p ON tir.payment_id = p.id
       LEFT JOIN jobs j ON p.job_id = j.id
       LEFT JOIN job_applications ja ON p.application_id = ja.id
       LEFT JOIN users u ON ja.user_id = u.id
       WHERE tir.id = ?`
    ).bind(invoiceId).first();

    if (!invoice) {
      return new Response(
        JSON.stringify({ success: false, message: '세금계산서 요청을 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    if (invoice.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, message: '이미 처리된 요청입니다.' }),
        { status: 400, headers }
      );
    }

    // 상태 업데이트
    await env.DB.prepare(
      `UPDATE tax_invoice_requests 
       SET status = 'issued', issued_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`
    ).bind(invoiceId).run();

    // 세금계산서 HTML 생성
    const { generateTaxInvoicePDF, generateTaxInvoiceEmailHTML } = await import('../../../src/utils/pdfGenerator');
    
    const taxInvoiceData = {
      requestId: invoice.id as number,
      paymentId: invoice.payment_id as number,
      businessNumber: invoice.business_number as string,
      businessName: invoice.business_name as string,
      ceoName: invoice.ceo_name as string,
      businessAddress: invoice.business_address as string,
      email: invoice.email as string,
      jobTitle: invoice.job_title as string || '채용 서비스',
      applicantName: invoice.applicant_name as string || '지원자',
      amount: invoice.amount as number || 55000,
      createdAt: invoice.created_at as string,
    };

    const invoiceHTML = await generateTaxInvoicePDF(taxInvoiceData);
    const emailHTML = generateTaxInvoiceEmailHTML(taxInvoiceData, invoiceHTML);

    // Resend API를 사용한 이메일 발송
    const resendApiKey = env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ALBI <noreply@albi.kr>',
            to: [invoice.email],
            subject: `[알비] 세금계산서가 발급되었습니다 - ${invoice.business_name}`,
            html: emailHTML,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Resend API error:', errorData);
        } else {
          console.log('Tax invoice email sent successfully to:', invoice.email);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // 이메일 발송 실패해도 승인은 완료된 것으로 처리
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '세금계산서가 승인되었습니다. 이메일로 발송됩니다.',
      }),
      { headers }
    );
  } catch (error) {
    console.error('Approve tax invoice error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '세금계산서 승인 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 세금계산서 거절
async function handleRejectTaxInvoice(
  request: Request,
  env: Env,
  headers: Record<string, string>,
  invoiceId: string
): Promise<Response> {
  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, message: '거절 사유를 입력해주세요.' }),
        { status: 400, headers }
      );
    }

    // 세금계산서 요청 정보 조회
    const invoice = await env.DB.prepare(
      'SELECT * FROM tax_invoice_requests WHERE id = ?'
    ).bind(invoiceId).first();

    if (!invoice) {
      return new Response(
        JSON.stringify({ success: false, message: '세금계산서 요청을 찾을 수 없습니다.' }),
        { status: 404, headers }
      );
    }

    if (invoice.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, message: '이미 처리된 요청입니다.' }),
        { status: 400, headers }
      );
    }

    // 상태 업데이트
    await env.DB.prepare(
      `UPDATE tax_invoice_requests 
       SET status = 'rejected', rejected_reason = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(reason, invoiceId).run();

    // 거절 알림 이메일 발송
    const { generateRejectionEmailHTML } = await import('../../../src/utils/pdfGenerator');
    
    const rejectionEmailHTML = generateRejectionEmailHTML({
      businessName: invoice.business_name as string,
      ceoName: invoice.ceo_name as string,
      reason: reason,
    });

    const resendApiKey = env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ALBI <noreply@albi.kr>',
            to: [invoice.email],
            subject: `[알비] 세금계산서 발급 반려 안내 - ${invoice.business_name}`,
            html: rejectionEmailHTML,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Resend API error:', errorData);
        } else {
          console.log('Rejection email sent successfully to:', invoice.email);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // 이메일 발송 실패해도 거절은 완료된 것으로 처리
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '세금계산서 요청이 거절되었습니다. 알림 이메일이 발송되었습니다.',
      }),
      { headers }
    );
  } catch (error) {
    console.error('Reject tax invoice error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '세금계산서 거절 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 세금계산서 통계 (월별/분기별)
async function handleTaxInvoiceStats(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'monthly'; // monthly or quarterly

    const now = new Date();
    const stats: any[] = [];

    if (mode === 'monthly') {
      // 최근 6개월 통계
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        const result = await env.DB.prepare(
          `SELECT 
            status,
            COUNT(*) as count
           FROM tax_invoice_requests
           WHERE created_at >= ? AND created_at < ?
           GROUP BY status`
        )
          .bind(startDate, endDate)
          .all();

        const monthData: any = {
          period: `${year}년 ${month}월`,
          pending: 0,
          issued: 0,
          rejected: 0,
        };

        result.results.forEach((row: any) => {
          monthData[row.status] = row.count;
        });

        stats.push(monthData);
      }
    } else if (mode === 'quarterly') {
      // 최근 4분기 통계
      for (let i = 3; i >= 0; i--) {
        const quarterMonth = Math.floor((now.getMonth()) / 3) * 3 - (i * 3);
        const year = now.getFullYear() + Math.floor(quarterMonth / 12);
        const month = ((quarterMonth % 12) + 12) % 12;
        const quarter = Math.floor(month / 3) + 1;

        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = quarter * 3 + 1;
        const endYear = endMonth > 12 ? year + 1 : year;
        const adjustedEndMonth = endMonth > 12 ? endMonth - 12 : endMonth;

        const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
        const endDate = `${endYear}-${String(adjustedEndMonth).padStart(2, '0')}-01`;

        const result = await env.DB.prepare(
          `SELECT 
            status,
            COUNT(*) as count
           FROM tax_invoice_requests
           WHERE created_at >= ? AND created_at < ?
           GROUP BY status`
        )
          .bind(startDate, endDate)
          .all();

        const quarterData: any = {
          period: `${year}년 Q${quarter}`,
          pending: 0,
          issued: 0,
          rejected: 0,
        };

        result.results.forEach((row: any) => {
          quarterData[row.status] = row.count;
        });

        stats.push(quarterData);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Tax invoice stats error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '통계 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 결제 통계 (월별)
async function handlePaymentStats(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'amount'; // amount or count

    const now = new Date();
    const stats: any[] = [];

    // 최근 6개월 통계
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      // 완료된 결제
      const completedResult = await env.DB.prepare(
        `SELECT 
          COUNT(*) as count,
          SUM(amount) as total
         FROM payments
         WHERE created_at >= ? AND created_at < ? AND payment_status = 'completed'`
      )
        .bind(startDate, endDate)
        .first();

      // 대기 중인 결제
      const pendingResult = await env.DB.prepare(
        `SELECT 
          COUNT(*) as count,
          SUM(amount) as total
         FROM payments
         WHERE created_at >= ? AND created_at < ? AND payment_status = 'pending'`
      )
        .bind(startDate, endDate)
        .first();

      // 환불된 결제
      const refundedResult = await env.DB.prepare(
        `SELECT 
          COUNT(*) as count,
          SUM(amount) as total
         FROM payments
         WHERE created_at >= ? AND created_at < ? AND (payment_status = 'refunded' OR payment_status = 'partial_refund')`
      )
        .bind(startDate, endDate)
        .first();

      stats.push({
        period: `${year}년 ${month}월`,
        completed_count: completedResult?.count || 0,
        completed_amount: completedResult?.total || 0,
        pending_count: pendingResult?.count || 0,
        pending_amount: pendingResult?.total || 0,
        refunded_count: refundedResult?.count || 0,
        refunded_amount: refundedResult?.total || 0,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Payment stats error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '결제 통계 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// =====================================================
// AI 학습 데이터 관리 API
// =====================================================

// AI 면접 대화 조회
async function handleAIConversations(request: Request, env: Env, headers: any) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const jobType = url.searchParams.get('jobType') || '';
    const minScore = parseInt(url.searchParams.get('minScore') || '0');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ic.*,
        u.name as user_name,
        u.email as user_email
      FROM interview_conversations ic
      LEFT JOIN users u ON ic.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (jobType) {
      query += ` AND ic.job_type = ?`;
      params.push(jobType);
    }

    if (minScore > 0) {
      query += ` AND ic.turn_score >= ?`;
      params.push(minScore);
    }

    if (search) {
      query += ` AND (ic.answer LIKE ? OR ic.question LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ic.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const conversations = await env.DB.prepare(query).bind(...params).all();

    // 전체 개수
    let countQuery = `SELECT COUNT(*) as total FROM interview_conversations ic WHERE 1=1`;
    const countParams: any[] = [];
    
    if (jobType) {
      countQuery += ` AND ic.job_type = ?`;
      countParams.push(jobType);
    }
    
    if (minScore > 0) {
      countQuery += ` AND ic.turn_score >= ?`;
      countParams.push(minScore);
    }
    
    if (search) {
      countQuery += ` AND (ic.answer LIKE ? OR ic.question LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = (totalResult as any)?.total || 0;

    return new Response(
      JSON.stringify({
        success: true,
        conversations: conversations.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error('AI conversations error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'AI 대화 데이터 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// AI 면접 세션 요약 조회
async function handleAISessions(request: Request, env: Env, headers: any) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const jobType = url.searchParams.get('jobType') || '';
    const grade = url.searchParams.get('grade') || '';
    const status = url.searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        iss.*,
        u.name as user_name,
        u.email as user_email
      FROM interview_sessions iss
      LEFT JOIN users u ON iss.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (jobType) {
      query += ` AND iss.job_type = ?`;
      params.push(jobType);
    }

    if (grade) {
      query += ` AND iss.final_grade = ?`;
      params.push(grade);
    }

    if (status) {
      query += ` AND iss.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY iss.started_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const sessions = await env.DB.prepare(query).bind(...params).all();

    // 전체 개수
    let countQuery = `SELECT COUNT(*) as total FROM interview_sessions iss WHERE 1=1`;
    const countParams: any[] = [];
    
    if (jobType) {
      countQuery += ` AND iss.job_type = ?`;
      countParams.push(jobType);
    }
    
    if (grade) {
      countQuery += ` AND iss.final_grade = ?`;
      countParams.push(grade);
    }
    
    if (status) {
      countQuery += ` AND iss.status = ?`;
      countParams.push(status);
    }

    const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = (totalResult as any)?.total || 0;

    return new Response(
      JSON.stringify({
        success: true,
        sessions: sessions.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error('AI sessions error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'AI 세션 데이터 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// AI 학습 패턴 조회
async function handleAIPatterns(request: Request, env: Env, headers: any) {
  try {
    const url = new URL(request.url);
    const jobType = url.searchParams.get('jobType') || '';
    const minScore = parseFloat(url.searchParams.get('minScore') || '0');

    let query = `
      SELECT * FROM learned_answer_patterns
      WHERE 1=1
    `;
    const params: any[] = [];

    if (jobType) {
      query += ` AND job_type = ?`;
      params.push(jobType);
    }

    if (minScore > 0) {
      query += ` AND average_score >= ?`;
      params.push(minScore);
    }

    query += ` ORDER BY average_score DESC, frequency DESC LIMIT 100`;

    const patterns = await env.DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        patterns: patterns.results,
      }),
      { headers }
    );
  } catch (error) {
    console.error('AI patterns error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'AI 패턴 데이터 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// AI 학습 통계
async function handleAITrainingStats(request: Request, env: Env, headers: any) {
  try {
    // 전체 대화 수
    const totalConversations = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM interview_conversations
    `).first();

    // 전체 세션 수
    const totalSessions = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM interview_sessions
    `).first();

    // 평균 점수
    const avgScore = await env.DB.prepare(`
      SELECT AVG(total_score) as avg_score FROM interview_sessions WHERE status = 'completed'
    `).first();

    // 등급별 분포
    const gradeDistribution = await env.DB.prepare(`
      SELECT final_grade, COUNT(*) as count 
      FROM interview_sessions 
      WHERE final_grade IS NOT NULL
      GROUP BY final_grade
    `).all();

    // 업종별 통계
    const jobTypeStats = await env.DB.prepare(`
      SELECT 
        job_type,
        COUNT(*) as total_sessions,
        AVG(total_score) as avg_score,
        AVG(question_count) as avg_questions
      FROM interview_sessions
      GROUP BY job_type
    `).all();

    // 학습된 패턴 수
    const totalPatterns = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM learned_answer_patterns
    `).first();

    // 고득점 대화 비율
    const highScoreConversations = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM interview_conversations WHERE turn_score >= 80
    `).first();

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalConversations: (totalConversations as any)?.count || 0,
          totalSessions: (totalSessions as any)?.count || 0,
          averageScore: Math.round((avgScore as any)?.avg_score || 0),
          gradeDistribution: gradeDistribution.results,
          jobTypeStats: jobTypeStats.results,
          totalPatterns: (totalPatterns as any)?.count || 0,
          highScoreConversations: (highScoreConversations as any)?.count || 0,
          highScoreRate: totalConversations ? 
            Math.round(((highScoreConversations as any)?.count || 0) / ((totalConversations as any)?.count || 1) * 100) : 0
        },
      }),
      { headers }
    );
  } catch (error) {
    console.error('AI training stats error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'AI 학습 통계 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

// 통계 데이터 핸들러
async function handleStats(request: Request, env: Env, headers: HeadersInit) {
  try {
    const usersCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const todayUsers = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE('now')").first();
    
    // 최근 사용자 (최대 5명)
    const recentUsers = await env.DB.prepare(`
      SELECT id, name, email, user_type, created_at, 0 as points
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({ 
      success: true, 
      stats: {
        users: {
          total: (usersCount as any)?.count || 0,
          today: (todayUsers as any)?.count || 0
        },
        points: {
          balance: 0,
          totalIssued: 0
        },
        store: {
          totalPurchases: 0,
          todayPurchases: 0
        },
        referrals: {
          conversionRate: '0%',
          total: 0
        },
        payments: {
          totalRevenue: 0,
          todayPayments: 0
        }
      },
      recentActivity: {
        users: recentUsers.results || []
      }
    }), { headers });
  } catch (error) {
    console.error('Stats error:', error);
    return new Response(JSON.stringify({ success: false, message: '통계 조회 중 오류가 발생했습니다.' }), { status: 500, headers });
  }
}

// 차트 데이터 핸들러
async function handleCharts(request: Request, env: Env, headers: HeadersInit) {
  try {
    // 바로채용 통계
    const immediateJobsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM jobs WHERE hiring_type = 'immediate' AND status = 'active'
    `).first<{ count: number }>();
    
    const trialJobsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM jobs WHERE hiring_type = 'trial' AND status = 'active'
    `).first<{ count: number }>();
    
    const totalJobsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM jobs WHERE status = 'active'
    `).first<{ count: number }>();
    
    // 노쇼 신고 통계
    const noshowReportsResult = await env.DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM noshow_reports
      GROUP BY status
    `).all();
    
    const noshowByStatus: Record<string, number> = {};
    (noshowReportsResult.results || []).forEach((row: any) => {
      noshowByStatus[row.status] = row.count;
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      charts: {
        userGrowth: [],
        revenue: [],
        applications: [],
        hiring: {
          immediate: immediateJobsResult?.count || 0,
          trial: trialJobsResult?.count || 0,
          total: totalJobsResult?.count || 0
        },
        noshow: {
          pending: noshowByStatus['pending'] || 0,
          approved: noshowByStatus['approved'] || 0,
          rejected: noshowByStatus['rejected'] || 0,
          total: Object.values(noshowByStatus).reduce((sum, count) => sum + count, 0)
        }
      }
    }), { headers });
  } catch (error) {
    console.error('Charts error:', error);
    return new Response(JSON.stringify({ success: false, message: '차트 데이터 조회 중 오류가 발생했습니다.' }), { status: 500, headers });
  }
}

// 거래 내역 핸들러
async function handleTransactions(request: Request, env: Env, headers: HeadersInit) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let transactions = [];
    let total = 0;
    let totalIssued = 0;
    let totalUsed = 0;

    try {
      const result = await env.DB.prepare(`
        SELECT pt.*, u.name as user_name, u.email as user_email
        FROM points_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        ORDER BY pt.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      transactions = result.results || [];
      const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM points_transactions').first();
      total = (countResult as any)?.count || 0;

      const issuedResult = await env.DB.prepare("SELECT SUM(points) as total FROM points_transactions WHERE type = 'earned'").first();
      totalIssued = (issuedResult as any)?.total || 0;

      const usedResult = await env.DB.prepare("SELECT SUM(points) as total FROM points_transactions WHERE type = 'spent'").first();
      totalUsed = (usedResult as any)?.total || 0;
    } catch (e) {
      console.log('points_transactions 테이블 없음');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      transactions,
      stats: {
        totalIssued,
        totalUsed,
        totalCount: total,
        totalBalance: totalIssued - totalUsed
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } 
    }), { headers });
  } catch (error) {
    console.error('Transactions error:', error);
    return new Response(JSON.stringify({ success: false, message: '거래 내역 조회 중 오류가 발생했습니다.' }), { status: 500, headers });
  }
}

// 구매 내역 핸들러
async function handlePurchases(request: Request, env: Env, headers: HeadersInit) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let purchases = [];
    let total = 0;
    let totalCount = 0;
    let totalAmount = 0;

    try {
      const result = await env.DB.prepare(`
        SELECT sp.*, u.name as user_name, u.email as user_email
        FROM store_purchases sp
        LEFT JOIN users u ON sp.user_id = u.id
        ORDER BY sp.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      purchases = result.results || [];
      const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM store_purchases').first();
      total = (countResult as any)?.count || 0;
      totalCount = total;

      const amountResult = await env.DB.prepare('SELECT SUM(points_spent) as total FROM store_purchases').first();
      totalAmount = (amountResult as any)?.total || 0;
    } catch (e) {
      console.log('store_purchases 테이블 없음');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      purchases,
      stats: {
        totalCount,
        completedCount: totalCount,
        pendingCount: 0,
        totalPoints: totalAmount,
        totalAmount,
        averageAmount: totalCount > 0 ? Math.round(totalAmount / totalCount) : 0
      },
      productStats: [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } 
    }), { headers });
  } catch (error) {
    console.error('Purchases error:', error);
    return new Response(JSON.stringify({ success: false, message: '구매 내역 조회 중 오류가 발생했습니다.' }), { status: 500, headers });
  }
}

// 노쇼 신고 목록 조회 핸들러
async function handleNoshowReports(request: Request, env: Env, headers: HeadersInit) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';
    
    let query = `
      SELECT 
        nr.*,
        reporter.name as reporter_name,
        reporter.phone as reporter_phone,
        reporter.email as reporter_email,
        reported_user.name as reported_user_name,
        reported_user.phone as reported_user_phone,
        reported_user.email as reported_user_email,
        reported_user.trust_score as reported_user_trust_score,
        j.title as job_title,
        j.company_name
      FROM noshow_reports nr
      LEFT JOIN users reporter ON nr.reporter_id = reporter.id
      LEFT JOIN users reported_user ON nr.reported_user_id = reported_user.id
      LEFT JOIN jobs j ON nr.job_id = j.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ` AND nr.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY nr.created_at DESC`;
    
    const stmt = env.DB.prepare(query);
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    
    return new Response(JSON.stringify({ 
      success: true, 
      reports: result.results || []
    }), { headers });
  } catch (error: any) {
    console.error('Noshow reports error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '노쇼 신고 목록 조회 중 오류가 발생했습니다.',
      error: error.message 
    }), { status: 500, headers });
  }
}
