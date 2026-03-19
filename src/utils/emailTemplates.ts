// 세금계산서 승인 이메일 템플릿
export function getTaxInvoiceApprovalEmailHTML(data: {
  businessName: string;
  ceoName: string;
  invoiceNumber: string;
  totalAmount: number;
  issueDate: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      border-left: 4px solid #4a90e2;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
    .info-value {
      color: #333;
    }
    .amount {
      font-size: 28px;
      font-weight: bold;
      color: #4a90e2;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #4a90e2;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .notice {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 세금계산서 발행 완료</h1>
      <p>귀사의 세금계산서가 정상적으로 발행되었습니다</p>
    </div>
    <div class="content">
      <p><strong>${data.businessName}</strong> 귀하,</p>
      <p>안녕하세요, 알비(ALBI)입니다.</p>
      <p>요청하신 세금계산서가 정상적으로 발행되었습니다. 첨부된 PDF 파일을 확인해주세요.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 세금계산서 정보</h3>
        <div class="info-row">
          <span class="info-label">계산서 번호</span>
          <span class="info-value">${data.invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">발행일</span>
          <span class="info-value">${data.issueDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">수령인</span>
          <span class="info-value">${data.businessName} (대표: ${data.ceoName})</span>
        </div>
      </div>

      <div class="amount">
        총 금액: ${data.totalAmount.toLocaleString()}원
      </div>

      <div class="notice">
        <strong>📌 안내사항</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>본 세금계산서는 전자문서 및 전자거래 기본법에 따라 발행되었습니다</li>
          <li>세금계산서는 첨부 파일로 제공되며, 출력하여 보관하실 수 있습니다</li>
          <li>분실 시 알비 고객센터로 문의하시면 재발급이 가능합니다</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="https://albi.kr/employer/mypage" class="button">마이페이지에서 확인하기</a>
      </p>

      <div class="footer">
        <p><strong>알비 (ALBI)</strong></p>
        <p>📞 010-4459-4226 | 📧 albi260128@gmail.com</p>
        <p>경상남도 양산시 동면 사송로 155, 807동 1405호</p>
        <p>사업자등록번호: 531-08-03526 | 통신판매업: 제2026-경남양산-00526호</p>
        <p style="margin-top: 15px; color: #999;">© 2026 ALBI. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 세금계산서 거절 이메일 템플릿
export function getTaxInvoiceRejectionEmailHTML(data: {
  businessName: string;
  ceoName: string;
  reason: string;
  requestDate: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      border-left: 4px solid #dc3545;
    }
    .reason-box {
      background: #fff3f3;
      border: 1px solid #ffcdd2;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .notice {
      background: #e7f3ff;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background: #dc3545;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ 세금계산서 발행 불가</h1>
      <p>세금계산서 요청이 거절되었습니다</p>
    </div>
    <div class="content">
      <p><strong>${data.businessName}</strong> 귀하,</p>
      <p>안녕하세요, 알비(ALBI)입니다.</p>
      <p>${data.requestDate}에 요청하신 세금계산서 발행이 다음의 사유로 거절되었습니다.</p>
      
      <div class="reason-box">
        <strong>🔍 거절 사유</strong>
        <p style="margin: 10px 0 0 0; font-size: 15px;">${data.reason}</p>
      </div>

      <div class="notice">
        <strong>📌 재요청 안내</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>거절 사유를 확인하시고 정확한 정보로 다시 요청해주세요</li>
          <li>사업자등록번호가 정확한지 확인해주세요</li>
          <li>대표자명과 상호명이 사업자등록증과 일치하는지 확인해주세요</li>
          <li>추가 문의사항은 고객센터로 연락주세요</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="https://albi.kr/employer/mypage" class="button">마이페이지에서 재요청하기</a>
      </p>

      <div class="info-box">
        <h3 style="margin-top: 0;">💡 도움이 필요하신가요?</h3>
        <p style="margin: 0;">고객센터로 문의하시면 세금계산서 발행을 도와드리겠습니다.</p>
        <p style="margin: 10px 0 0 0;">
          📞 전화: 010-4459-4226<br/>
          📧 이메일: albi260128@gmail.com
        </p>
      </div>

      <div class="footer">
        <p><strong>알비 (ALBI)</strong></p>
        <p>📞 010-4459-4226 | 📧 albi260128@gmail.com</p>
        <p>경상남도 양산시 동면 사송로 155, 807동 1405호</p>
        <p>사업자등록번호: 531-08-03526 | 통신판매업: 제2026-경남양산-00526호</p>
        <p style="margin-top: 15px; color: #999;">© 2026 ALBI. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
