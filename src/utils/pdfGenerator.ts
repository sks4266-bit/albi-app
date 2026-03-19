// PDF 생성 유틸리티 (Cloudflare Workers용)
// 현재는 HTML 방식 사용, 추후 R2 + Puppeteer로 전환 가능

import { generateTaxInvoiceHTML, generateInvoiceNumber, formatKoreanDate } from './taxInvoiceTemplate';

export interface TaxInvoiceData {
  requestId: number;
  paymentId: number;
  businessNumber: string;
  businessName: string;
  ceoName: string;
  businessAddress?: string;
  email: string;
  jobTitle: string;
  applicantName: string;
  amount: number;
  createdAt: string;
}

// 세금계산서 HTML 생성
export async function generateTaxInvoicePDF(data: TaxInvoiceData): Promise<string> {
  const issueDate = new Date();
  const invoiceNumber = generateInvoiceNumber(data.paymentId, issueDate);
  
  // 알비 공급자 정보 (하드코딩)
  const supplierInfo = {
    businessNumber: '531-08-03526',
    name: '알비',
    ceo: '박지훈',
    address: '경상남도 양산시 동면 사송로 155, 807동 1405호',
  };
  
  // 공급가액과 세액 계산 (55,000원 = 50,000원 공급가액 + 5,000원 부가세)
  const supplyPrice = 50000;  // 공급가액
  const taxAmount = 5000;     // 부가세 (10%)
  const totalAmount = data.amount; // 총 금액 (55,000원)
  
  const htmlContent = generateTaxInvoiceHTML({
    invoiceNumber,
    issueDate: formatKoreanDate(issueDate),
    businessNumber: data.businessNumber,
    businessName: data.businessName,
    ceoName: data.ceoName,
    businessAddress: data.businessAddress || '(주소 미제공)',
    supplierBusinessNumber: supplierInfo.businessNumber,
    supplierName: supplierInfo.name,
    supplierCeo: supplierInfo.ceo,
    supplierAddress: supplierInfo.address,
    itemName: `채용 성공 수수료 - ${data.jobTitle} (${data.applicantName})`,
    quantity: 1,
    unitPrice: supplyPrice,
    supplyPrice,
    taxAmount,
    totalAmount,
  });
  
  return htmlContent;
}

// 이메일용 세금계산서 HTML (간소화 버전)
export function generateTaxInvoiceEmailHTML(data: TaxInvoiceData, invoiceHTML: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>세금계산서 발급 완료</title>
</head>
<body style="font-family: 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">✅ 세금계산서 발급 완료</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">요청하신 세금계산서가 발급되었습니다</p>
  </div>
  
  <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4a90e2;">
      <h2 style="margin-top: 0; color: #4a90e2; font-size: 20px;">📋 발급 정보</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #666; width: 40%;">상호명</td>
          <td style="padding: 10px 0; font-weight: bold;">${data.businessName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">사업자등록번호</td>
          <td style="padding: 10px 0; font-weight: bold;">${data.businessNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">대표자명</td>
          <td style="padding: 10px 0; font-weight: bold;">${data.ceoName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">발급 금액</td>
          <td style="padding: 10px 0; font-weight: bold; color: #4a90e2; font-size: 18px;">${data.amount.toLocaleString()}원</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">품목</td>
          <td style="padding: 10px 0;">${data.jobTitle} - ${data.applicantName}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>📌 안내사항</strong><br>
        • 본 세금계산서는 전자문서로 발급되었습니다<br>
        • 아래 버튼을 클릭하여 전체 세금계산서를 확인하실 수 있습니다<br>
        • 문의사항이 있으시면 고객센터로 연락 주세요
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://albi.kr/employer/tax-invoice?id=${data.requestId}" 
         style="display: inline-block; padding: 15px 40px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);">
        🧾 세금계산서 전체 보기
      </a>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px;">
      <p style="margin: 5px 0;"><strong>알비 (ALBI)</strong></p>
      <p style="margin: 5px 0;">사업자등록번호: 531-08-03526 | 대표: 박지훈</p>
      <p style="margin: 5px 0;">경상남도 양산시 동면 사송로 155, 807동 1405호</p>
      <p style="margin: 5px 0;">📞 010-4459-4226 | 📧 albi260128@gmail.com</p>
      <p style="margin: 15px 0 5px 0; font-size: 12px; color: #999;">본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해 주세요.</p>
    </div>
    
  </div>
  
</body>
</html>
  `.trim();
}

// 거절 이메일 HTML
export function generateRejectionEmailHTML(data: {
  businessName: string;
  ceoName: string;
  reason: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>세금계산서 발급 반려</title>
</head>
<body style="font-family: 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">❌ 세금계산서 발급 반려</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">요청하신 세금계산서 발급이 반려되었습니다</p>
  </div>
  
  <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #e74c3c;">
      <h2 style="margin-top: 0; color: #e74c3c; font-size: 20px;">📋 반려 정보</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #666; width: 40%;">상호명</td>
          <td style="padding: 10px 0; font-weight: bold;">${data.businessName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">대표자명</td>
          <td style="padding: 10px 0; font-weight: bold;">${data.ceoName}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #e74c3c;">
      <h3 style="margin-top: 0; color: #721c24; font-size: 16px;">📝 반려 사유</h3>
      <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.8;">${data.reason}</p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>📌 다음 단계</strong><br>
        • 반려 사유를 확인하고 정보를 수정해 주세요<br>
        • 수정 후 마이페이지에서 다시 신청하실 수 있습니다<br>
        • 문의사항이 있으시면 고객센터로 연락 주세요
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://albi.kr/employer/mypage.html" 
         style="display: inline-block; padding: 15px 40px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);">
        🏠 마이페이지로 이동
      </a>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px;">
      <p style="margin: 5px 0;"><strong>알비 (ALBI)</strong></p>
      <p style="margin: 5px 0;">사업자등록번호: 531-08-03526 | 대표: 박지훈</p>
      <p style="margin: 5px 0;">경상남도 양산시 동면 사송로 155, 807동 1405호</p>
      <p style="margin: 5px 0;">📞 010-4459-4226 | 📧 albi260128@gmail.com</p>
      <p style="margin: 15px 0 5px 0; font-size: 12px; color: #999;">본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해 주세요.</p>
    </div>
    
  </div>
  
</body>
</html>
  `.trim();
}
