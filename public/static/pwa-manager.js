/**
 * PWA 초기화 및 관리
 * Service Worker 등록 및 업데이트 감지
 */

class PWAManager {
    constructor() {
        this.swRegistration = null;
        this.updateAvailable = false;
        
        this.init();
    }

    /**
     * PWA 초기화
     */
    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] Service Worker not supported');
            return;
        }

        try {
            // Service Worker 등록
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker registered:', this.swRegistration);

            // 업데이트 확인
            this.checkForUpdates();

            // 설치 프롬프트
            this.setupInstallPrompt();

            // 온라인/오프라인 이벤트
            this.setupConnectionEvents();

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
        }
    }

    /**
     * 업데이트 확인
     */
    checkForUpdates() {
        if (!this.swRegistration) return;

        // 즉시 업데이트 확인
        this.swRegistration.update();

        // 새 Service Worker 감지
        this.swRegistration.addEventListener('updatefound', () => {
            const newWorker = this.swRegistration.installing;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // 업데이트 사용 가능
                    this.updateAvailable = true;
                    
                    // 자동 업데이트 적용 (사용자 확인 없이)
                    console.log('[PWA] Auto-applying update...');
                    this.applyUpdate();
                }
            });
        });

        // 주기적 업데이트 확인 (10분마다 - 더 자주)
        setInterval(() => {
            this.swRegistration.update();
        }, 10 * 60 * 1000);
    }

    /**
     * 업데이트 알림 표시 (사용 안 함)
     */
    showUpdateNotification() {
        // 자동 업데이트로 변경하여 알림 표시 안 함
        console.log('[PWA] Update notification skipped (auto-update enabled)');
    }

    /**
     * 업데이트 적용
     */
    applyUpdate() {
        if (!this.swRegistration || !this.swRegistration.waiting) {
            // 대기 중인 워커가 없으면 강제 새로고침
            console.log('[PWA] No waiting worker, forcing reload...');
            window.location.reload(true);
            return;
        }

        // 새 Service Worker에 메시지 전송
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // 새로고침
        setTimeout(() => {
            window.location.reload(true);
        }, 100);
    }

    /**
     * 설치 프롬프트 설정
     */
    setupInstallPrompt() {
        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // 설치 버튼 표시
            this.showInstallButton(deferredPrompt);
        });

        // 설치 완료 감지
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed');
            deferredPrompt = null;
            
            // 설치 버튼 숨기기
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) installBtn.remove();
        });
    }

    /**
     * 설치 버튼 표시
     */
    showInstallButton(prompt) {
        // 이미 설치된 경우 표시 안함
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.style.cssText = `
            position: fixed;
            bottom: 6rem;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 2rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: none;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 999;
            animation: bounce 2s infinite;
        `;

        button.innerHTML = `
            <i class="fas fa-download"></i>
            <span>앱으로 설치하기</span>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(-10px); }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(button);

        button.addEventListener('click', async () => {
            if (!prompt) return;

            // 설치 프롬프트 표시
            prompt.prompt();

            // 사용자 선택 대기
            const { outcome } = await prompt.userChoice;
            console.log('[PWA] Install outcome:', outcome);

            // 버튼 제거
            button.remove();
        });
    }

    /**
     * 연결 상태 이벤트
     */
    setupConnectionEvents() {
        window.addEventListener('online', () => {
            console.log('[PWA] Online');
            this.showConnectionStatus('온라인 상태입니다', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('[PWA] Offline');
            this.showConnectionStatus('오프라인 상태입니다', 'warning');
        });
    }

    /**
     * 연결 상태 알림
     */
    showConnectionStatus(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // 3초 후 자동 제거
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * 캐시 크기 확인
     */
    async getCacheSize() {
        if (!('storage' in navigator)) return null;

        try {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageInMB: (estimate.usage / 1024 / 1024).toFixed(2),
                quotaInMB: (estimate.quota / 1024 / 1024).toFixed(2),
                percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        } catch (error) {
            console.error('[PWA] Failed to get cache size:', error);
            return null;
        }
    }

    /**
     * 캐시 초기화
     */
    async clearCache() {
        if (!('caches' in window)) return;

        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('[PWA] Cache cleared');
            window.location.reload();
        } catch (error) {
            console.error('[PWA] Failed to clear cache:', error);
        }
    }
}

// 초기화
const pwaManager = new PWAManager();

// 전역으로 export
if (typeof window !== 'undefined') {
    window.PWAManager = pwaManager;
}
