/**
 * 로딩 상태 관리 시스템
 * Phase 8.1: 시스템 안정화
 */

class LoadingManager {
    constructor() {
        this.loadingStates = {};
        this.activeLoaders = new Set();
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        // 로딩 오버레이 생성
        this.createLoadingOverlay();
        console.log('[LoadingManager] Initialized');
    }
    
    /**
     * 로딩 오버레이 생성
     */
    createLoadingOverlay() {
        // 기존 오버레이 확인
        if (document.getElementById('globalLoadingOverlay')) {
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'globalLoadingOverlay';
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
                <div class="mb-4">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                </div>
                <h3 id="loadingTitle" class="text-xl font-bold text-gray-800 mb-2">로딩 중...</h3>
                <p id="loadingMessage" class="text-gray-600 mb-4">잠시만 기다려주세요</p>
                <div id="loadingProgress" class="hidden">
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div id="loadingProgressBar" class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p id="loadingProgressText" class="text-sm text-gray-500">0%</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    /**
     * 로딩 시작
     */
    show(id = 'default', options = {}) {
        this.activeLoaders.add(id);
        this.loadingStates[id] = {
            startTime: Date.now(),
            title: options.title || '로딩 중...',
            message: options.message || '잠시만 기다려주세요',
            progress: options.progress || null
        };
        
        this.updateOverlay();
    }
    
    /**
     * 로딩 종료
     */
    hide(id = 'default') {
        this.activeLoaders.delete(id);
        delete this.loadingStates[id];
        
        this.updateOverlay();
    }
    
    /**
     * 모든 로딩 종료
     */
    hideAll() {
        this.activeLoaders.clear();
        this.loadingStates = {};
        this.updateOverlay();
    }
    
    /**
     * 진행률 업데이트
     */
    updateProgress(id = 'default', progress, message = null) {
        if (this.loadingStates[id]) {
            this.loadingStates[id].progress = progress;
            if (message) {
                this.loadingStates[id].message = message;
            }
            this.updateOverlay();
        }
    }
    
    /**
     * 오버레이 업데이트
     */
    updateOverlay() {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (!overlay) return;
        
        if (this.activeLoaders.size === 0) {
            // 모든 로딩 완료
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        } else {
            // 로딩 표시
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            
            // 가장 최근 로딩 상태 표시
            const currentId = Array.from(this.activeLoaders)[this.activeLoaders.size - 1];
            const state = this.loadingStates[currentId];
            
            if (state) {
                document.getElementById('loadingTitle').textContent = state.title;
                document.getElementById('loadingMessage').textContent = state.message;
                
                // 진행률 표시
                const progressContainer = document.getElementById('loadingProgress');
                if (state.progress !== null && state.progress !== undefined) {
                    progressContainer.classList.remove('hidden');
                    const progressBar = document.getElementById('loadingProgressBar');
                    const progressText = document.getElementById('loadingProgressText');
                    
                    const progressValue = Math.min(100, Math.max(0, state.progress));
                    progressBar.style.width = `${progressValue}%`;
                    progressText.textContent = `${Math.round(progressValue)}%`;
                } else {
                    progressContainer.classList.add('hidden');
                }
            }
        }
    }
    
    /**
     * 특정 요소에 로딩 표시
     */
    showInElement(element, options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return null;
        
        // 기존 로딩 제거
        const existingLoader = element.querySelector('.element-loader');
        if (existingLoader) {
            existingLoader.remove();
        }
        
        const loader = document.createElement('div');
        loader.className = 'element-loader absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10';
        loader.innerHTML = `
            <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-2"></div>
                <p class="text-sm text-gray-600">${options.message || '로딩 중...'}</p>
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(loader);
        
        return loader;
    }
    
    /**
     * 요소 로딩 제거
     */
    hideInElement(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;
        
        const loader = element.querySelector('.element-loader');
        if (loader) {
            loader.remove();
        }
    }
    
    /**
     * 버튼 로딩 상태
     */
    setButtonLoading(button, loading = true) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }
        
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i>
                처리 중...
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
}

/**
 * 스켈레톤 로딩 관리
 */
class SkeletonLoader {
    /**
     * 스켈레톤 생성
     */
    static create(type = 'default', count = 1) {
        const templates = {
            card: `
                <div class="animate-pulse">
                    <div class="bg-gray-300 rounded-lg h-48 mb-4"></div>
                    <div class="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                    <div class="bg-gray-300 h-4 rounded w-1/2"></div>
                </div>
            `,
            list: `
                <div class="animate-pulse flex items-center space-x-4 mb-4">
                    <div class="bg-gray-300 rounded-full h-12 w-12"></div>
                    <div class="flex-1 space-y-2">
                        <div class="bg-gray-300 h-4 rounded w-3/4"></div>
                        <div class="bg-gray-300 h-4 rounded w-1/2"></div>
                    </div>
                </div>
            `,
            text: `
                <div class="animate-pulse space-y-2">
                    <div class="bg-gray-300 h-4 rounded"></div>
                    <div class="bg-gray-300 h-4 rounded w-5/6"></div>
                    <div class="bg-gray-300 h-4 rounded w-4/6"></div>
                </div>
            `,
            default: `
                <div class="animate-pulse">
                    <div class="bg-gray-300 h-32 rounded"></div>
                </div>
            `
        };
        
        const template = templates[type] || templates.default;
        return template.repeat(count);
    }
    
    /**
     * 요소에 스켈레톤 표시
     */
    static showInElement(element, type = 'default', count = 1) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;
        
        element.innerHTML = this.create(type, count);
    }
}

// 전역 인스턴스
window.loadingManager = new LoadingManager();
window.SkeletonLoader = SkeletonLoader;

// 편의 함수
window.showLoading = (id, options) => window.loadingManager.show(id, options);
window.hideLoading = (id) => window.loadingManager.hide(id);
window.updateLoadingProgress = (id, progress, message) => window.loadingManager.updateProgress(id, progress, message);
