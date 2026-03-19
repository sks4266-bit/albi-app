// 세금계산서 HTML 템플릿 생성
export function generateTaxInvoiceHTML(data: {
  invoiceNumber: string;
  issueDate: string;
  businessNumber: string;
  businessName: string;
  ceoName: string;
  businessAddress: string;
  supplierBusinessNumber: string;
  supplierName: string;
  supplierCeo: string;
  supplierAddress: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  supplyPrice: number;
  taxAmount: number;
  totalAmount: number;
}): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>세금계산서</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #333;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #000;
    }
    
    .header .invoice-number {
      font-size: 14px;
      color: #666;
    }
    
    .info-section {
      margin-bottom: 20px;
    }
    
    .info-title {
      font-size: 14px;
      font-weight: bold;
      background-color: #f5f5f5;
      padding: 8px 12px;
      border-left: 4px solid #4a90e2;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: table;
      width: 100%;
      border: 1px solid #ddd;
      border-collapse: collapse;
    }
    
    .info-row {
      display: table-row;
    }
    
    .info-label {
      display: table-cell;
      width: 30%;
      padding: 10px 12px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      font-weight: bold;
    }
    
    .info-value {
      display: table-cell;
      width: 70%;
      padding: 10px 12px;
      border: 1px solid #ddd;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table th {
      background-color: #4a90e2;
      color: white;
      padding: 12px 8px;
      text-align: center;
      font-weight: bold;
      border: 1px solid #3a7bc8;
    }
    
    .items-table td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      text-align: center;
    }
    
    .items-table .text-left {
      text-align: left;
    }
    
    .items-table .text-right {
      text-align: right;
    }
    
    .total-section {
      margin-top: 30px;
      border: 2px solid #333;
      padding: 20px;
      background-color: #f9f9f9;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .total-row.grand-total {
      font-size: 18px;
      font-weight: bold;
      color: #4a90e2;
      border-top: 2px solid #333;
      padding-top: 15px;
      margin-top: 10px;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 11px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    
    .stamp-area {
      margin-top: 30px;
      text-align: right;
      padding-right: 50px;
    }
    
    .stamp-box {
      display: inline-block;
      border: 2px solid #333;
      padding: 30px 40px;
      text-align: center;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>세 금 계 산 서</h1>
    <div class="invoice-number">계산서 번호: ${data.invoiceNumber}</div>
    <div class="invoice-number">발행일: ${data.issueDate}</div>
  </div>

  <!-- 공급받는자 정보 -->
  <div class="info-section">
    <div class="info-title">▣ 공급받는자 (매입자)</div>
    <div class="info-grid">
      <div class="info-row">
        <div class="info-label">사업자등록번호</div>
        <div class="info-value">${data.businessNumber}</div>
      </div>
      <div class="info-row">
        <div class="info-label">상호 (법인명)</div>
        <div class="info-value">${data.businessName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">대표자 성명</div>
        <div class="info-value">${data.ceoName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">사업장 주소</div>
        <div class="info-value">${data.businessAddress || '(주소 미제공)'}</div>
      </div>
    </div>
  </div>

  <!-- 공급자 정보 -->
  <div class="info-section">
    <div class="info-title">▣ 공급자 (매출자)</div>
    <div class="info-grid">
      <div class="info-row">
        <div class="info-label">사업자등록번호</div>
        <div class="info-value">${data.supplierBusinessNumber}</div>
      </div>
      <div class="info-row">
        <div class="info-label">상호 (법인명)</div>
        <div class="info-value">${data.supplierName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">대표자 성명</div>
        <div class="info-value">${data.supplierCeo}</div>
      </div>
      <div class="info-row">
        <div class="info-label">사업장 주소</div>
        <div class="info-value">${data.supplierAddress}</div>
      </div>
    </div>
  </div>

  <!-- 품목 내역 -->
  <div class="info-section">
    <div class="info-title">▣ 품목 내역</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 10%">월</th>
          <th style="width: 10%">일</th>
          <th style="width: 40%">품목</th>
          <th style="width: 10%">수량</th>
          <th style="width: 15%">단가</th>
          <th style="width: 15%">공급가액</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${new Date(data.issueDate).getMonth() + 1}</td>
          <td>${new Date(data.issueDate).getDate()}</td>
          <td class="text-left">${data.itemName}</td>
          <td>${data.quantity}</td>
          <td class="text-right">${data.unitPrice.toLocaleString()}원</td>
          <td class="text-right">${data.supplyPrice.toLocaleString()}원</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 합계 금액 -->
  <div class="total-section">
    <div class="total-row">
      <span>공급가액 (Supply Amount)</span>
      <span><strong>${data.supplyPrice.toLocaleString()}원</strong></span>
    </div>
    <div class="total-row">
      <span>세액 (VAT 10%)</span>
      <span><strong>${data.taxAmount.toLocaleString()}원</strong></span>
    </div>
    <div class="total-row grand-total">
      <span>총 금액 (Total Amount)</span>
      <span>${data.totalAmount.toLocaleString()}원</span>
    </div>
  </div>

  <!-- 발행 날인 -->
  <div class="stamp-area">
    <div class="stamp-box">
      <div style="margin-bottom: 20px; font-weight: bold;">공급자 (발행자)</div>
      <div style="font-size: 16px; font-weight: bold;">${data.supplierName}</div>
      <div style="margin-top: 10px; color: #666;">(인)</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p><strong>알비 (ALBI)</strong> | 사업자등록번호: ${data.supplierBusinessNumber}</p>
    <p>경상남도 양산시 동면 사송로 155, 807동 1405호 | 전화: 010-4459-4226</p>
    <p>이메일: albi260128@gmail.com | 통신판매업: 제2026-경남양산-00526호</p>
    <p style="margin-top: 10px; font-size: 10px;">본 세금계산서는 전자문서 및 전자거래 기본법에 따라 발행되었습니다.</p>
  </div>
</body>
</html>
  `.trim();
}

// 세금계산서 번호 생성
export function generateInvoiceNumber(paymentId: number, timestamp: Date): string {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const seq = String(paymentId).padStart(6, '0');
  
  return `ALBI-${year}${month}${day}-${seq}`;
}

// 날짜 포맷팅 (YYYY년 MM월 DD일)
export function formatKoreanDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
}
