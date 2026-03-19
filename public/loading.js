/**
 * 공통 로딩 유틸리티
 * 전역 로딩 상태 관리
 */

class LoadingManager {
  constructor() {
    this.overlay = null;
    this.initOverlay();
  }

  // 로딩 오버레이 초기화
  initOverlay() {
    if (document.getElementById('global-loading-overlay')) {
      this.overlay = document.getElementById('global-loading-overlay');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
        <div class="loading-text">로딩 중...</div>
        <div class="loading-subtext">잠시만 기다려주세요</div>
        <div class="progress-bar">
          <div class="progress-bar-fill"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  // 로딩 표시
  show(text = '로딩 중...', subtext = '잠시만 기다려주세요') {
    if (!this.overlay) this.initOverlay();
    
    const textEl = this.overlay.querySelector('.loading-text');
    const subtextEl = this.overlay.querySelector('.loading-subtext');
    
    if (textEl) textEl.textContent = text;
    if (subtextEl) subtextEl.textContent = subtext;
    
    this.overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // 로딩 숨김
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // 스타일 변경 (circle, dots, pulse)
  setStyle(style = 'circle') {
    if (!this.overlay) return;

    const spinner = this.overlay.querySelector('.loading-spinner');
    const currentSpinner = spinner.querySelector('[class^="spinner-"]');
    
    let newSpinner;
    if (style === 'dots') {
      newSpinner = document.createElement('div');
      newSpinner.className = 'spinner-dots';
      newSpinner.innerHTML = '<div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div>';
    } else if (style === 'pulse') {
      newSpinner = document.createElement('div');
      newSpinner.className = 'spinner-pulse';
    } else {
      newSpinner = document.createElement('div');
      newSpinner.className = 'spinner-circle';
    }
    
    currentSpinner.replaceWith(newSpinner);
  }
}

// 전역 로딩 매니저 인스턴스
window.loading = new LoadingManager();

// 간편 함수들
window.showLoading = (text, subtext) => window.loading.show(text, subtext);
window.hideLoading = () => window.loading.hide();

// 버튼 로딩 상태 토글
window.toggleButtonLoading = (button, isLoading) => {
  if (isLoading) {
    button.classList.add('btn-loading');
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
  } else {
    button.classList.remove('btn-loading');
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
};

// fetch 요청에 자동 로딩 적용
window.fetchWithLoading = async (url, options = {}, loadingText = '데이터를 불러오는 중...') => {
  window.showLoading(loadingText);
  
  try {
    const response = await fetch(url, options);
    return response;
  } finally {
    window.hideLoading();
  }
};

// 스켈레톤 로딩 생성
window.createSkeleton = (type = 'text', count = 3) => {
  const container = document.createElement('div');
  
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-${type}`;
    container.appendChild(skeleton);
  }
  
  return container;
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 전역 이벤트 리스너: form submit에 자동 로딩
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.dataset.noLoading) return;
    
    window.showLoading('처리 중...', '요청을 처리하고 있습니다');
  });

  // 전역 이벤트 리스너: API 호출 시작/종료
  let apiCallCount = 0;
  
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
    
    // API 호출인 경우에만 로딩 표시
    if (typeof url === 'string' && url.startsWith('/api/')) {
      apiCallCount++;
      if (apiCallCount === 1) {
        window.showLoading('데이터 로딩 중...', '');
      }
    }
    
    try {
      const response = await originalFetch(...args);
      return response;
    } finally {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        apiCallCount--;
        if (apiCallCount === 0) {
          // 약간의 지연 후 숨김 (UX 개선)
          setTimeout(() => {
            if (apiCallCount === 0) {
              window.hideLoading();
            }
          }, 200);
        }
      }
    }
  };
});

// 페이지 unload 시 로딩 숨김
window.addEventListener('beforeunload', () => {
  window.hideLoading();
});

console.log('✅ 로딩 매니저 초기화 완료');
