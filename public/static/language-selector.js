/**
 * 언어 선택기 컴포넌트
 */

function createLanguageSelector() {
  const container = document.createElement('div');
  container.className = 'language-selector';
  container.innerHTML = `
    <div class="relative">
      <label class="text-xs text-gray-400 block mb-1">언어 / Language</label>
      <select id="languageSelect" class="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
        <option value="ko">🇰🇷 한국어</option>
        <option value="en">🇺🇸 English</option>
        <option value="zh">🇨🇳 中文</option>
      </select>
    </div>
  `;
  
  const select = container.querySelector('#languageSelect');
  
  // i18n이 로드될 때까지 대기
  const initLanguage = () => {
    if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
      select.value = window.i18n.getCurrentLanguage();
    } else {
      // 기본값: localStorage 또는 'ko'
      const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
      select.value = savedLang;
    }
  };
  
  // 즉시 실행
  initLanguage();
  
  // i18n 로드 후에도 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
  }
  
  select.addEventListener('change', (e) => {
    const newLang = e.target.value;
    
    // localStorage에 저장
    localStorage.setItem('selectedLanguage', newLang);
    
    // i18n이 있으면 사용
    if (window.i18n && typeof window.i18n.setLanguage === 'function') {
      window.i18n.setLanguage(newLang);
    }
    
    // 음성 인식 언어 변경
    if (window.recognition) {
      const langMap = { 'ko': 'ko-KR', 'en': 'en-US', 'zh': 'zh-CN' };
      window.recognition.lang = langMap[newLang] || 'ko-KR';
    }
    
    // 페이지 새로고침하여 번역 적용
    window.location.reload();
  });
  
  return container;
}

// Auto-inject language selector into header (disabled - manually added in HTML)
// document.addEventListener('DOMContentLoaded', () => {
//   const header = document.querySelector('header .flex.items-center.justify-between');
//   if (header) {
//     const langSelector = createLanguageSelector();
//     langSelector.style.marginLeft = '1rem';
//     header.appendChild(langSelector);
//   }
// });
