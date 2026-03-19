/**
 * 모바일 터치 인터렉션 유틸리티
 * 스와이프, 롱프레스, 풀투리프레시 등
 */

class TouchHandler {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.longPressTimer = null;
        this.longPressDuration = 500; // ms
        
        this.injectStyles();
    }

    /**
     * 모바일 최적화 스타일
     */
    injectStyles() {
        if (document.getElementById('touch-styles')) return;

        const style = document.createElement('style');
        style.id = 'touch-styles';
        style.textContent = `
            /* 터치 영역 확대 */
            .touch-target {
                min-width: 44px;
                min-height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            /* 터치 피드백 */
            .touch-feedback {
                position: relative;
                overflow: hidden;
            }

            .touch-feedback::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }

            .touch-feedback:active::after {
                width: 100%;
                height: 100%;
            }

            /* 스와이프 가능 표시 */
            .swipeable {
                cursor: grab;
                user-select: none;
                -webkit-user-select: none;
            }

            .swipeable:active {
                cursor: grabbing;
            }

            /* 풀투리프레시 */
            .pull-to-refresh {
                position: relative;
            }

            .pull-indicator {
                position: absolute;
                top: -60px;
                left: 0;
                right: 0;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
                color: var(--text-secondary);
            }

            .pull-indicator.active {
                transform: translateY(60px);
            }

            .pull-indicator i {
                font-size: 1.5rem;
                animation: spin 1s linear infinite;
            }

            /* 롱프레스 애니메이션 */
            @keyframes long-press-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .long-pressing {
                animation: long-press-pulse 0.3s ease-in-out;
            }

            /* 모바일 네비게이션 */
            @media (max-width: 768px) {
                .mobile-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--card-bg);
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-around;
                    padding: 0.75rem 0;
                    z-index: 1000;
                    box-shadow: 0 -2px 10px var(--shadow);
                }

                .mobile-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: 0.75rem;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }

                .mobile-nav-item:active {
                    background: var(--bg-tertiary);
                }

                .mobile-nav-item.active {
                    color: #3B82F6;
                }

                .mobile-nav-item i {
                    font-size: 1.25rem;
                }

                /* 하단 네비게이션이 있을 때 컨텐츠 패딩 */
                body.has-mobile-nav {
                    padding-bottom: 5rem;
                }
            }

            /* 햄버거 메뉴 */
            .mobile-menu-toggle {
                display: none;
            }

            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                }

                .mobile-menu-toggle span {
                    display: block;
                    width: 100%;
                    height: 2px;
                    background: var(--text-primary);
                    transition: all 0.3s;
                }

                .mobile-menu-toggle.active span:nth-child(1) {
                    transform: translateY(6px) rotate(45deg);
                }

                .mobile-menu-toggle.active span:nth-child(2) {
                    opacity: 0;
                }

                .mobile-menu-toggle.active span:nth-child(3) {
                    transform: translateY(-6px) rotate(-45deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 스와이프 감지
     */
    onSwipe(element, callbacks) {
        const minSwipeDistance = 50;

        element.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(callbacks, minSwipeDistance);
        }, { passive: true });
    }

    /**
     * 스와이프 처리
     */
    handleSwipe(callbacks, minDistance) {
        const diffX = this.touchEndX - this.touchStartX;
        const diffY = this.touchEndY - this.touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 가로 스와이프
            if (Math.abs(diffX) > minDistance) {
                if (diffX > 0 && callbacks.onSwipeRight) {
                    callbacks.onSwipeRight();
                } else if (diffX < 0 && callbacks.onSwipeLeft) {
                    callbacks.onSwipeLeft();
                }
            }
        } else {
            // 세로 스와이프
            if (Math.abs(diffY) > minDistance) {
                if (diffY > 0 && callbacks.onSwipeDown) {
                    callbacks.onSwipeDown();
                } else if (diffY < 0 && callbacks.onSwipeUp) {
                    callbacks.onSwipeUp();
                }
            }
        }
    }

    /**
     * 롱프레스 감지
     */
    onLongPress(element, callback, duration = this.longPressDuration) {
        element.addEventListener('touchstart', (e) => {
            element.classList.add('long-pressing');
            this.longPressTimer = setTimeout(() => {
                callback(e);
                element.classList.remove('long-pressing');
            }, duration);
        });

        element.addEventListener('touchend', () => {
            clearTimeout(this.longPressTimer);
            element.classList.remove('long-pressing');
        });

        element.addEventListener('touchmove', () => {
            clearTimeout(this.longPressTimer);
            element.classList.remove('long-pressing');
        });
    }

    /**
     * 풀투리프레시
     */
    pullToRefresh(container, callback) {
        let startY = 0;
        let isPulling = false;
        const threshold = 80;

        // 인디케이터 생성
        const indicator = document.createElement('div');
        indicator.className = 'pull-indicator';
        indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
        container.style.position = 'relative';
        container.insertBefore(indicator, container.firstChild);

        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            const currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 0 && pullDistance < threshold * 2) {
                e.preventDefault();
                const scale = Math.min(pullDistance / threshold, 1);
                indicator.style.transform = `translateY(${pullDistance}px) rotate(${pullDistance}deg)`;
                indicator.style.opacity = scale;

                if (pullDistance > threshold) {
                    indicator.querySelector('i').className = 'fas fa-sync-alt';
                } else {
                    indicator.querySelector('i').className = 'fas fa-arrow-down';
                }
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (!isPulling) return;

            const currentY = e.changedTouches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > threshold) {
                indicator.classList.add('active');
                indicator.querySelector('i').className = 'fas fa-spinner fa-spin';
                
                callback().finally(() => {
                    indicator.classList.remove('active');
                    indicator.style.transform = '';
                    indicator.style.opacity = '0';
                    setTimeout(() => {
                        indicator.querySelector('i').className = 'fas fa-arrow-down';
                    }, 300);
                });
            } else {
                indicator.style.transform = '';
                indicator.style.opacity = '0';
            }

            isPulling = false;
        });
    }

    /**
     * 모바일 네비게이션 생성
     */
    createMobileNav(items) {
        if (document.getElementById('mobile-nav')) return;

        const nav = document.createElement('nav');
        nav.id = 'mobile-nav';
        nav.className = 'mobile-nav';

        items.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            link.className = 'mobile-nav-item touch-target';
            if (window.location.pathname === item.href) {
                link.classList.add('active');
            }
            link.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            `;
            nav.appendChild(link);
        });

        document.body.appendChild(nav);
        document.body.classList.add('has-mobile-nav');
    }

    /**
     * 햄버거 메뉴 토글
     */
    createHamburgerMenu(menuElement) {
        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle';
        toggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            menuElement.classList.toggle('show');
        });

        return toggle;
    }

    /**
     * 터치 피드백 추가
     */
    addTouchFeedback(element) {
        element.classList.add('touch-feedback');
    }
}

// 초기화
const touchHandler = new TouchHandler();

// 전역으로 export
if (typeof window !== 'undefined') {
    window.TouchHandler = touchHandler;
}
