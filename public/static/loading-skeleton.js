/**
 * 로딩 스켈레톤 UI 유틸리티
 * 데이터 로딩 중 사용자 경험 개선
 */

class LoadingSkeleton {
    /**
     * 스켈레톤 스타일 추가
     */
    static injectStyles() {
        if (document.getElementById('skeleton-styles')) return;

        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            @keyframes skeleton-loading {
                0% {
                    background-position: -200% 0;
                }
                100% {
                    background-position: 200% 0;
                }
            }

            .skeleton {
                background: linear-gradient(
                    90deg,
                    #f0f0f0 25%,
                    #e0e0e0 50%,
                    #f0f0f0 75%
                );
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s ease-in-out infinite;
                border-radius: 4px;
            }

            .skeleton-text {
                height: 1rem;
                margin-bottom: 0.5rem;
            }

            .skeleton-title {
                height: 1.5rem;
                width: 60%;
                margin-bottom: 1rem;
            }

            .skeleton-avatar {
                width: 3rem;
                height: 3rem;
                border-radius: 50%;
            }

            .skeleton-card {
                padding: 1rem;
                border-radius: 0.5rem;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .skeleton-pulse {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 채팅 메시지 스켈레톤
     */
    static chatMessage() {
        return `
            <div class="skeleton-card mb-4">
                <div class="flex gap-3">
                    <div class="skeleton skeleton-avatar flex-shrink-0"></div>
                    <div class="flex-1">
                        <div class="skeleton skeleton-text" style="width: 80%"></div>
                        <div class="skeleton skeleton-text" style="width: 60%"></div>
                        <div class="skeleton skeleton-text" style="width: 40%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 카드 리스트 스켈레톤
     */
    static cardList(count = 3) {
        return Array(count).fill(0).map(() => `
            <div class="skeleton-card mb-4">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 80%"></div>
                <div class="skeleton skeleton-text" style="width: 60%"></div>
            </div>
        `).join('');
    }

    /**
     * 테이블 스켈레톤
     */
    static table(rows = 5, cols = 4) {
        const headerRow = `
            <tr>
                ${Array(cols).fill(0).map(() => '<th class="px-4 py-2"><div class="skeleton skeleton-text"></div></th>').join('')}
            </tr>
        `;
        
        const bodyRows = Array(rows).fill(0).map(() => `
            <tr>
                ${Array(cols).fill(0).map(() => '<td class="px-4 py-2"><div class="skeleton skeleton-text"></div></td>').join('')}
            </tr>
        `).join('');

        return `
            <table class="w-full">
                <thead>${headerRow}</thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    /**
     * 프로그레스 바 생성
     */
    static progressBar(containerId, options = {}) {
        const {
            height = '4px',
            color = '#3B82F6',
            duration = '2s'
        } = options;

        const container = document.getElementById(containerId);
        if (!container) return;

        const progressBar = document.createElement('div');
        progressBar.id = 'loading-progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: ${height};
            background: ${color};
            transform: scaleX(0);
            transform-origin: left;
            transition: transform ${duration} ease-in-out;
            z-index: 9999;
        `;

        document.body.appendChild(progressBar);

        // 시작
        setTimeout(() => {
            progressBar.style.transform = 'scaleX(0.3)';
        }, 100);

        return {
            update: (progress) => {
                progressBar.style.transform = `scaleX(${progress})`;
            },
            complete: () => {
                progressBar.style.transform = 'scaleX(1)';
                setTimeout(() => {
                    progressBar.style.opacity = '0';
                    setTimeout(() => progressBar.remove(), 300);
                }, 200);
            },
            remove: () => {
                progressBar.remove();
            }
        };
    }

    /**
     * 스피너 로딩
     */
    static spinner(options = {}) {
        const {
            size = '40px',
            color = '#3B82F6',
            overlay = true
        } = options;

        const wrapper = document.createElement('div');
        wrapper.id = 'loading-spinner';
        wrapper.style.cssText = overlay ? `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        ` : `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: ${size};
            height: ${size};
            border: 4px solid #f3f3f3;
            border-top: 4px solid ${color};
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        wrapper.appendChild(spinner);
        document.head.appendChild(style);
        document.body.appendChild(wrapper);

        return {
            remove: () => wrapper.remove()
        };
    }

    /**
     * 텍스트 타이핑 효과
     */
    static typewriter(element, text, speed = 50) {
        let index = 0;
        element.textContent = '';

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }

    /**
     * 점진적 페이드인
     */
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }
}

// 초기화
LoadingSkeleton.injectStyles();

// 전역으로 export
if (typeof window !== 'undefined') {
    window.LoadingSkeleton = LoadingSkeleton;
}
