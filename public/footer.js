/**
 * 공통 푸터 스크립트
 * 모든 페이지에서 동일한 푸터를 표시하고 회사 정보를 API로 가져옵니다.
 */

// 회사 정보 전역 변수
window.companyInfo = null;

// 회사 정보 로드 함수
async function loadCompanyInfo() {
  // 이미 로드되었으면 재사용
  if (window.companyInfo) {
    return window.companyInfo;
  }

  try {
    const response = await fetch('/api/company-info');
    const data = await response.json();
    
    if (data.success) {
      window.companyInfo = data.data;
      return data.data;
    }
  } catch (error) {
    console.error('회사 정보 로드 실패:', error);
  }
  
  // API 호출 실패 시 기본 정보 반환 (알비 실제 사업자 정보)
  window.companyInfo = {
    company_name: '알비',
    business_registration_number: '531-08-03526',
    representative: '박지훈',
    address: '경상남도 양산시 동면 사송로 155, 807동 1405호(사송 롯데캐슬)',
    email: 'albi260128@gmail.com',
    phone: '010-4459-4226',
    mail_order_registration: '제2026-경남양산-00526호'
  };
  
  return window.companyInfo;
}

// 푸터 HTML 생성 함수
function createFooterHTML(companyInfo) {
  return `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="/contact.html">📞 고객센터</a>
          <a href="/terms.html">📜 이용약관</a>
          <a href="/privacy.html">🔒 개인정보처리방침</a>
          <a href="/about.html">🎯 비전(회사소개)</a>
        </div>
        <div class="footer-info" id="footerInfo">
          ${companyInfo ? `
            <p><strong>${companyInfo.company_name}</strong> | 대표: ${companyInfo.representative} | 사업자등록번호: ${companyInfo.business_registration_number}</p>
            <p>통신판매업신고: ${companyInfo.mail_order_registration}</p>
            <p>주소: ${companyInfo.address}</p>
            <p>이메일: ${companyInfo.email} | 고객센터: ${companyInfo.phone}</p>
            <p style="margin-top: 12px;">© 2026 ALBI. All rights reserved.</p>
          ` : `
            <p><i class="fas fa-spinner fa-spin"></i> 회사 정보를 불러오는 중...</p>
          `}
        </div>
      </div>
    </footer>
  `;
}

// 푸터 렌더링 함수
async function renderFooter() {
  const footerContainer = document.getElementById('footer-container');
  if (!footerContainer) {
    console.warn('footer-container 엘리먼트를 찾을 수 없습니다.');
    return;
  }

  // 로딩 상태 푸터 먼저 표시
  footerContainer.innerHTML = createFooterHTML(null);

  // 회사 정보 로드
  const companyInfo = await loadCompanyInfo();
  
  // 회사 정보로 푸터 업데이트
  footerContainer.innerHTML = createFooterHTML(companyInfo);
}

// 페이지 로드 시 푸터 렌더링
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderFooter);
} else {
  renderFooter();
}

// 전역 함수로 노출 (다른 스크립트에서 사용 가능)
window.loadCompanyInfo = loadCompanyInfo;
window.renderFooter = renderFooter;
