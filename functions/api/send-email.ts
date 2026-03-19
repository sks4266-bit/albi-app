/**
 * 이메일 발송 API (Resend)
 * POST /api/send-email
 */

interface Env {
  RESEND_API_KEY: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  template: 'subscription_welcome' | 'subscription_reminder' | 'subscription_expired' | 'payment_receipt';
  data?: Record<string, any>;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as EmailRequest;
    const { to, subject, template, data } = body;

    if (!to || !subject || !template) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: to, subject, template'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 이메일 템플릿 생성
    const htmlContent = generateEmailTemplate(template, data);

    // Resend API 호출
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Albi AI <noreply@albi.kr>',
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send email',
        details: result
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      email_id: result.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Send email error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// 이메일 템플릿 생성 함수
function generateEmailTemplate(template: string, data?: Record<string, any>): string {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .info-box { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .highlight { color: #667eea; font-weight: bold; }
  `;

  switch (template) {
    case 'subscription_welcome':
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Albi AI 구독을 환영합니다!</h1>
            </div>
            <div class="content">
              <p>안녕하세요, ${data?.userName || '회원'}님!</p>
              <p>Albi AI 멘토 프리미엄 구독을 시작해주셔서 감사합니다.</p>
              
              <div class="info-box">
                <h3>📋 구독 정보</h3>
                <p><strong>플랜:</strong> 월 ₩4,900</p>
                <p><strong>시작일:</strong> ${data?.startDate || new Date().toLocaleDateString('ko-KR')}</p>
                <p><strong>다음 결제일:</strong> ${data?.nextPaymentDate || '1개월 후'}</p>
              </div>

              <h3>✨ 이용 가능한 혜택</h3>
              <ul>
                <li>🤖 무제한 AI 멘토 대화</li>
                <li>📝 과제 제출 및 AI 피드백</li>
                <li>📊 포트폴리오 검토 및 첨삭</li>
                <li>📈 월간 성장 분석 리포트</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://albi.kr/mentor-chat.html" class="button">AI 멘토 시작하기 →</a>
              </div>

              <p style="margin-top: 30px; color: #666;">
                문의사항이 있으시면 언제든지 <a href="mailto:albi260128@gmail.com">albi260128@gmail.com</a>로 연락주세요.
              </p>
            </div>
            <div class="footer">
              <p>© 2026 Albi AI. All rights reserved.</p>
              <p><a href="https://albi.kr">albi.kr</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'subscription_reminder':
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ 구독 갱신 안내</h1>
            </div>
            <div class="content">
              <p>안녕하세요, ${data?.userName || '회원'}님!</p>
              <p>Albi AI 구독 갱신일이 <span class="highlight">${data?.daysLeft || '3'}일</span> 남았습니다.</p>
              
              <div class="info-box">
                <h3>📋 구독 정보</h3>
                <p><strong>다음 결제일:</strong> ${data?.nextPaymentDate || '3일 후'}</p>
                <p><strong>결제 금액:</strong> ₩4,900</p>
                <p><strong>결제 수단:</strong> ${data?.paymentMethod || '등록된 카드'}</p>
              </div>

              <p>자동 결제가 진행되며, 결제 수단을 변경하시려면 아래 버튼을 클릭해주세요.</p>

              <div style="text-align: center;">
                <a href="https://albi.kr/payment-settings.html" class="button">결제 수단 관리 →</a>
              </div>

              <p style="margin-top: 30px; color: #666;">
                구독을 취소하시려면 <a href="https://albi.kr/subscription-settings.html">구독 관리</a> 페이지에서 언제든지 취소하실 수 있습니다.
              </p>
            </div>
            <div class="footer">
              <p>© 2026 Albi AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'subscription_expired':
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <h1>😢 구독이 만료되었습니다</h1>
            </div>
            <div class="content">
              <p>안녕하세요, ${data?.userName || '회원'}님!</p>
              <p>Albi AI 구독이 ${data?.expiredDate || '오늘'} 만료되었습니다.</p>
              
              <div class="info-box">
                <h3>📊 이용 통계</h3>
                <p><strong>총 면접 세션:</strong> ${data?.totalSessions || 0}회</p>
                <p><strong>AI 멘토 대화:</strong> ${data?.totalMessages || 0}회</p>
                <p><strong>평균 면접 점수:</strong> ${data?.avgScore || 0}점</p>
              </div>

              <p>계속해서 AI 멘토의 도움을 받으시려면 구독을 갱신해주세요.</p>

              <div style="text-align: center;">
                <a href="https://albi.kr/payment.html" class="button">구독 갱신하기 →</a>
              </div>

              <p style="margin-top: 30px; color: #666;">
                구독 갱신 후 모든 혜택을 다시 이용하실 수 있습니다.
              </p>
            </div>
            <div class="footer">
              <p>© 2026 Albi AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'payment_receipt':
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 결제 영수증</h1>
            </div>
            <div class="content">
              <p>안녕하세요, ${data?.userName || '회원'}님!</p>
              <p>결제가 성공적으로 완료되었습니다.</p>
              
              <div class="info-box">
                <h3>📋 결제 정보</h3>
                <p><strong>주문번호:</strong> ${data?.orderId || 'N/A'}</p>
                <p><strong>결제일시:</strong> ${data?.paymentDate || new Date().toLocaleString('ko-KR')}</p>
                <p><strong>상품명:</strong> AI 멘토 프리미엄 구독 (월)</p>
                <p><strong>결제금액:</strong> <span class="highlight">₩4,900</span></p>
                <p><strong>결제수단:</strong> ${data?.paymentMethod || '신용카드'}</p>
              </div>

              <div class="info-box">
                <h3>📅 구독 기간</h3>
                <p><strong>시작일:</strong> ${data?.startDate || new Date().toLocaleDateString('ko-KR')}</p>
                <p><strong>만료일:</strong> ${data?.expiresDate || '1개월 후'}</p>
              </div>

              <div style="text-align: center;">
                <a href="https://albi.kr/mentor-chat.html" class="button">AI 멘토 사용하기 →</a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                이 영수증은 자동으로 발송된 이메일입니다.<br>
                영수증 재발급이 필요하시면 <a href="mailto:albi260128@gmail.com">albi260128@gmail.com</a>로 문의주세요.
              </p>
            </div>
            <div class="footer">
              <p>© 2026 Albi AI. All rights reserved.</p>
              <p>사업자등록번호: XXX-XX-XXXXX | 대표: OOO</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return '<html><body><p>Invalid template</p></body></html>';
  }
}
