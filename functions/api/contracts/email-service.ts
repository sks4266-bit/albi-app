/**
 * 📧 이메일 알림 서비스
 * Resend API 사용 (https://resend.com)
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

interface ContractEmailData {
  contractId: string;
  workerName: string;
  workerEmail: string;
  employerCompany: string;
  employerEmail: string;
  workStartDate: string;
  hourlyWage: number;
  pdfUrl: string;
}

/**
 * 이메일 전송 (Resend API)
 */
async function sendEmail(emailData: EmailData, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ALBI <noreply@albi.kr>',  // 커스텀 도메인 (Resend 인증 완료)
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Email send failed:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      return false;
    }

    const result = await response.json();
    console.log('✅ Email sent:', result);
    return true;

  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
}

/**
 * 계약서 체결 완료 이메일 (근로자용)
 */
export function generateWorkerContractEmail(data: ContractEmailData): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .info-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #6b7280; display: inline-block; width: 120px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎉 전자계약서 체결 완료</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">축하드립니다! 근로계약이 정상적으로 체결되었습니다.</p>
    </div>
    
    <div class="content">
      <h2>안녕하세요, ${data.workerName}님!</h2>
      <p><strong>${data.employerCompany}</strong>와(과)의 전자 근로계약서가 성공적으로 체결되었습니다.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #f97316;">📄 계약 정보</h3>
        <div class="info-row">
          <span class="label">계약번호:</span>
          <span>${data.contractId}</span>
        </div>
        <div class="info-row">
          <span class="label">사업장:</span>
          <span>${data.employerCompany}</span>
        </div>
        <div class="info-row">
          <span class="label">근무 시작일:</span>
          <span>${data.workStartDate}</span>
        </div>
        <div class="info-row">
          <span class="label">시급:</span>
          <span>${data.hourlyWage.toLocaleString()}원</span>
        </div>
      </div>
      
      <p><strong>다음 단계:</strong></p>
      <ul>
        <li>계약서 PDF를 다운로드하여 보관하세요</li>
        <li>첫 출근일에 필요한 서류를 준비하세요</li>
        <li>궁금한 사항은 사업장에 문의하세요</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${data.pdfUrl}" class="button">📥 계약서 PDF 다운로드</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        ℹ️ 이 계약서는 전자서명법에 의해 법적 효력을 가지며, 마이페이지에서 언제든지 확인하실 수 있습니다.
      </p>
    </div>
    
    <div class="footer">
      <p>이 이메일은 ALBI 전자계약서 시스템에서 자동으로 발송되었습니다.</p>
      <p>© ${new Date().getFullYear()} ALBI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 계약서 체결 완료 이메일 (사업주용)
 */
export function generateEmployerContractEmail(data: ContractEmailData): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .info-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #6b7280; display: inline-block; width: 120px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
    .notice { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 전자계약서 체결 완료</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">새로운 근로자와의 계약이 체결되었습니다.</p>
    </div>
    
    <div class="content">
      <h2>안녕하세요, ${data.employerCompany} 담당자님!</h2>
      <p><strong>${data.workerName}</strong>님과의 전자 근로계약서가 성공적으로 체결되었습니다.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #3b82f6;">📄 계약 정보</h3>
        <div class="info-row">
          <span class="label">계약번호:</span>
          <span>${data.contractId}</span>
        </div>
        <div class="info-row">
          <span class="label">근로자:</span>
          <span>${data.workerName}</span>
        </div>
        <div class="info-row">
          <span class="label">근무 시작일:</span>
          <span>${data.workStartDate}</span>
        </div>
        <div class="info-row">
          <span class="label">시급:</span>
          <span>${data.hourlyWage.toLocaleString()}원</span>
        </div>
      </div>
      
      <div class="notice">
        <strong>⚖️ 사업주 준수사항</strong><br>
        • 근로계약서에 명시된 조건을 반드시 준수해주세요<br>
        • 임금은 약속한 날짜에 지급해야 합니다<br>
        • 주휴수당, 연차 등 법정 의무사항을 확인하세요<br>
        • 4대보험 가입이 필요한 경우 신속히 처리하세요
      </div>
      
      <p><strong>다음 단계:</strong></p>
      <ul>
        <li>계약서 PDF를 다운로드하여 보관하세요</li>
        <li>근로자의 첫 출근을 준비하세요</li>
        <li>필요한 서류와 교육 자료를 확인하세요</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${data.pdfUrl}" class="button">📥 계약서 PDF 다운로드</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        ℹ️ 이 계약서는 전자서명법에 의해 법적 효력을 가지며, 마이페이지에서 언제든지 확인하실 수 있습니다.
      </p>
    </div>
    
    <div class="footer">
      <p>이 이메일은 ALBI 전자계약서 시스템에서 자동으로 발송되었습니다.</p>
      <p>© ${new Date().getFullYear()} ALBI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 계약서 체결 시 양쪽에 이메일 발송
 */
export async function sendContractNotifications(
  data: ContractEmailData,
  apiKey: string
): Promise<{ worker: boolean; employer: boolean }> {
  const results = {
    worker: false,
    employer: false
  };

  // 근로자 이메일 발송
  if (data.workerEmail) {
    results.worker = await sendEmail({
      to: data.workerEmail,
      subject: `🎉 [ALBI] ${data.employerCompany}와(과)의 계약서 체결 완료`,
      html: generateWorkerContractEmail(data)
    }, apiKey);
  }

  // 사업주 이메일 발송
  if (data.employerEmail) {
    results.employer = await sendEmail({
      to: data.employerEmail,
      subject: `📋 [ALBI] ${data.workerName}님과의 계약서 체결 완료`,
      html: generateEmployerContractEmail(data)
    }, apiKey);
  }

  return results;
}
