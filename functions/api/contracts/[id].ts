/**
 * 📄 개별 계약서 API
 * - 계약서 상세 조회
 * - PDF 생성 및 다운로드
 */

interface Env {
  DB: D1Database;
}

/**
 * GET /api/contracts/:id
 * GET /api/contracts/:id?format=pdf (PDF 생성)
 * 계약서 상세 조회 또는 PDF 생성
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const contractId = pathParts[pathParts.length - 1];

    console.log('📄 Contract API Request:', {
      url: url.pathname,
      search: url.search,
      contractId,
      pathParts
    });

    // PDF 요청 처리 (경로 또는 쿼리 파라미터)
    const format = url.searchParams.get('format');
    console.log('📄 Format parameter:', format);
    
    if (format === 'pdf' || contractId === 'pdf' || url.pathname.endsWith('/pdf')) {
      const actualId = contractId === 'pdf' ? pathParts[pathParts.length - 2] : contractId;
      console.log('📄 Generating PDF for contract:', actualId);
      return generatePDF(context, actualId);
    }

    // 계약서 조회
    const contract = await context.env.DB.prepare(`
      SELECT * FROM contracts WHERE contract_id = ?
    `).bind(contractId).first();

    if (!contract) {
      return new Response(JSON.stringify({
        success: false,
        error: '계약서를 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: contract
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ Contract fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || '계약서 조회 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * PDF 생성 (HTML 기반)
 */
async function generatePDF(context: any, contractId: string): Promise<Response> {
  try {
    console.log('📄 generatePDF called for:', contractId);
    
    // 계약서 데이터 조회
    const contract = await context.env.DB.prepare(`
      SELECT * FROM contracts WHERE contract_id = ?
    `).bind(contractId).first();

    console.log('📄 Contract found:', !!contract);

    if (!contract) {
      console.log('❌ Contract not found:', contractId);
      return new Response('계약서를 찾을 수 없습니다.', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // HTML 형식의 PDF 생성 (간단한 버전)
    const pdfHtml = generateContractHTML(contract);
    
    console.log('✅ PDF HTML generated, length:', pdfHtml.length);

    return new Response(pdfHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="contract-${contractId}.html"`,
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ PDF generation error:', error);
    return new Response('PDF 생성 중 오류가 발생했습니다: ' + error.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * 계약서 HTML 생성
 */
function generateContractHTML(contract: any): string {
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('ko-KR');
  };

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>전자 근로계약서 - ${contract.contract_id}</title>
  <style>
    body {
      font-family: 'Malgun Gothic', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      line-height: 1.8;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #f97316;
      border-left: 4px solid #f97316;
      padding-left: 10px;
    }
    .info-row {
      display: flex;
      margin: 10px 0;
      padding: 8px;
      background: #f9fafb;
    }
    .info-label {
      font-weight: bold;
      width: 150px;
      color: #555;
    }
    .info-value {
      flex: 1;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-around;
    }
    .signature-box {
      text-align: center;
      width: 45%;
    }
    .signature-img {
      border: 2px solid #10b981;
      border-radius: 8px;
      max-width: 100%;
      height: 120px;
      object-fit: contain;
      background: white;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    .notice {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
    }
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">📄 전자 근로계약서</div>
    <div style="font-size: 14px; color: #666; margin-top: 10px;">
      계약번호: ${contract.contract_id}<br>
      작성일: ${formatDate(contract.created_at)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">👤 근로자 정보</div>
    <div class="info-row">
      <div class="info-label">성명</div>
      <div class="info-value">${contract.worker_name}</div>
    </div>
    <div class="info-row">
      <div class="info-label">생년월일</div>
      <div class="info-value">${contract.worker_birth || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">전화번호</div>
      <div class="info-value">${contract.worker_phone || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">주소</div>
      <div class="info-value">${contract.worker_address || '-'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏢 사업주 정보</div>
    <div class="info-row">
      <div class="info-label">사업체명</div>
      <div class="info-value">${contract.employer_company}</div>
    </div>
    <div class="info-row">
      <div class="info-label">대표자명</div>
      <div class="info-value">${contract.employer_name || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">사업자등록번호</div>
      <div class="info-value">${contract.employer_business_number || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">전화번호</div>
      <div class="info-value">${contract.employer_phone || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">사업장 주소</div>
      <div class="info-value">${contract.employer_address || '-'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📋 근로조건</div>
    <div class="info-row">
      <div class="info-label">근로 시작일</div>
      <div class="info-value">${contract.work_start_date}</div>
    </div>
    <div class="info-row">
      <div class="info-label">근로 종료일</div>
      <div class="info-value">${contract.work_end_date || '별도 협의'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">근무시간</div>
      <div class="info-value">${contract.work_hours || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">근무일</div>
      <div class="info-value">${contract.work_days || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">시급</div>
      <div class="info-value">${Number(contract.hourly_wage).toLocaleString()}원</div>
    </div>
    <div class="info-row">
      <div class="info-label">임금 지급일</div>
      <div class="info-value">${contract.payment_day || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">업무내용</div>
      <div class="info-value">${contract.job_description || '-'}</div>
    </div>
  </div>

  <div class="notice">
    <strong>⚖️ 주요 근로조건</strong><br>
    • 주휴수당: 1주 15시간 이상 근무 시 유급휴일 1일 제공<br>
    • 연차휴가: 1년간 80% 이상 출근 시 15일 부여<br>
    • 퇴직금: 1년 이상 계속 근무 시 평균임금 30일분 지급<br>
    • 4대보험: 근로자 요청 시 가입
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div style="font-weight: bold; margin-bottom: 10px;">근로자 서명</div>
      <img src="${contract.worker_signature}" class="signature-img" alt="근로자 서명">
      <div style="margin-top: 10px; color: #666;">${contract.worker_name}</div>
    </div>
    <div class="signature-box">
      <div style="font-weight: bold; margin-bottom: 10px;">사업주 서명</div>
      <img src="${contract.employer_signature}" class="signature-img" alt="사업주 서명">
      <div style="margin-top: 10px; color: #666;">${contract.employer_company}</div>
    </div>
  </div>

  <div class="footer">
    <p>이 계약서는 근로기준법에 따라 작성되었으며, 전자서명법에 의해 법적 효력을 가집니다.</p>
    <p>계약 체결일: ${formatDate(contract.created_at)}</p>
    <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 10px 30px; background: #f97316; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
      🖨️ 인쇄하기
    </button>
  </div>
</body>
</html>
  `;
}

/**
 * PATCH /api/contracts/:id
 * 계약 상태 변경
 */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const contractId = pathParts[pathParts.length - 1];

    const body = await context.request.json() as any;
    const { status } = body;

    // 상태 검증
    const validStatuses = ['active', 'completed', 'terminated'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: '유효하지 않은 상태입니다. (active, completed, terminated)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 상태 업데이트
    await context.env.DB.prepare(`
      UPDATE contracts SET status = ?, updated_at = unixepoch() WHERE contract_id = ?
    `).bind(status, contractId).run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        contractId,
        status,
        message: '계약 상태가 변경되었습니다.'
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ Status update error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || '상태 변경 중 오류가 발생했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * OPTIONS handler
 */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
