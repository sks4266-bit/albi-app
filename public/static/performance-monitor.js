/**
 * 성능 모니터링 유틸리티
 * Core Web Vitals 측정 및 리포팅
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            LCP: null,  // Largest Contentful Paint
            FID: null,  // First Input Delay
            CLS: null,  // Cumulative Layout Shift
            FCP: null,  // First Contentful Paint
            TTFB: null, // Time to First Byte
            INP: null   // Interaction to Next Paint
        };

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        if (typeof window === 'undefined') return;

        // Core Web Vitals 측정
        this.measureWebVitals();

        // 페이지 로드 성능
        this.measurePageLoad();

        // API 요청 성능
        this.monitorAPIPerformance();

        // 리소스 로딩 성능
        this.measureResourceLoading();
    }

    /**
     * Web Vitals 측정
     */
    measureWebVitals() {
        // LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
                    this.reportMetric('LCP', this.metrics.LCP);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('[Performance] LCP observer not supported');
            }

            // FID (First Input Delay)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        this.metrics.FID = entry.processingStart - entry.startTime;
                        this.reportMetric('FID', this.metrics.FID);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('[Performance] FID observer not supported');
            }

            // CLS (Cumulative Layout Shift)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.metrics.CLS = clsValue;
                        }
                    });
                    this.reportMetric('CLS', this.metrics.CLS);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('[Performance] CLS observer not supported');
            }

            // INP (Interaction to Next Paint) - 새로운 지표
            try {
                const inpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        this.metrics.INP = entry.duration;
                        this.reportMetric('INP', this.metrics.INP);
                    });
                });
                inpObserver.observe({ entryTypes: ['event'] });
            } catch (e) {
                console.warn('[Performance] INP observer not supported');
            }
        }
    }

    /**
     * 페이지 로드 성능
     */
    measurePageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;

                // FCP (First Contentful Paint)
                if (window.performance.getEntriesByType) {
                    const paintEntries = window.performance.getEntriesByType('paint');
                    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
                    if (fcpEntry) {
                        this.metrics.FCP = fcpEntry.startTime;
                        this.reportMetric('FCP', this.metrics.FCP);
                    }
                }

                // TTFB (Time to First Byte)
                this.metrics.TTFB = perfData.responseStart - perfData.navigationStart;
                this.reportMetric('TTFB', this.metrics.TTFB);

                console.log('[Performance] Page Load Metrics:', {
                    pageLoadTime: `${pageLoadTime}ms`,
                    connectTime: `${connectTime}ms`,
                    renderTime: `${renderTime}ms`,
                    ttfb: `${this.metrics.TTFB}ms`,
                    fcp: `${this.metrics.FCP}ms`
                });
            }, 0);
        });
    }

    /**
     * API 요청 성능 모니터링
     */
    monitorAPIPerformance() {
        // Fetch API 래핑
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];

            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;

                // API 요청 성능 로깅
                if (typeof url === 'string' && url.includes('/api/')) {
                    this.logAPIRequest(url, duration, response.status);
                }

                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                this.logAPIRequest(url, duration, 'error');
                throw error;
            }
        };
    }

    /**
     * API 요청 로깅
     */
    logAPIRequest(url, duration, status) {
        // Null 체크
        if (duration === null || duration === undefined || isNaN(duration)) {
            console.warn('[Performance] API Request: invalid duration');
            return;
        }

        const level = duration > 1000 ? 'warn' : 'log';
        console[level]('[Performance] API Request:', {
            url,
            duration: `${duration.toFixed(2)}ms`,
            status,
            grade: this.getPerformanceGrade(duration)
        });

        // 느린 요청 알림
        if (duration > 2000) {
            this.showSlowRequestNotification(url, duration);
        }
    }

    /**
     * 리소스 로딩 성능
     */
    measureResourceLoading() {
        window.addEventListener('load', () => {
            const resources = window.performance.getEntriesByType('resource');
            
            const slowResources = resources
                .filter(r => r.duration > 500)
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 10);

            if (slowResources.length > 0) {
                console.warn('[Performance] Slow Resources:', slowResources.map(r => ({
                    name: r.name.split('/').pop(),
                    duration: r.duration ? `${r.duration.toFixed(2)}ms` : 'N/A',
                    size: r.transferSize ? `${(r.transferSize / 1024).toFixed(2)}KB` : 'N/A',
                    type: r.initiatorType
                })));
            }
        });
    }

    /**
     * 메트릭 리포팅
     */
    reportMetric(name, value) {
        // Null 체크
        if (value === null || value === undefined || isNaN(value)) {
            console.warn(`[Performance] ${name}: invalid value`);
            return;
        }

        // 콘솔 출력
        console.log(`[Performance] ${name}:`, {
            value: typeof value === 'number' ? `${value.toFixed(2)}ms` : value,
            grade: this.getVitalGrade(name, value)
        });

        // 서버로 전송 (선택사항)
        if (this.shouldReportToServer()) {
            this.sendToServer(name, value);
        }
    }

    /**
     * Core Web Vitals 등급 판정
     */
    getVitalGrade(name, value) {
        // Null/NaN 체크
        if (value === null || value === undefined || isNaN(value)) {
            return 'N/A';
        }

        const thresholds = {
            LCP: { good: 2500, needsImprovement: 4000 },
            FID: { good: 100, needsImprovement: 300 },
            CLS: { good: 0.1, needsImprovement: 0.25 },
            FCP: { good: 1800, needsImprovement: 3000 },
            TTFB: { good: 800, needsImprovement: 1800 },
            INP: { good: 200, needsImprovement: 500 }
        };

        const threshold = thresholds[name];
        if (!threshold) return 'unknown';

        if (value <= threshold.good) return '✅ Good';
        if (value <= threshold.needsImprovement) return '⚠️ Needs Improvement';
        return '❌ Poor';
    }

    /**
     * 일반 성능 등급
     */
    getPerformanceGrade(ms) {
        if (ms < 200) return '✅ Excellent';
        if (ms < 500) return '👍 Good';
        if (ms < 1000) return '⚠️ Fair';
        return '❌ Slow';
    }

    /**
     * 느린 요청 알림
     */
    showSlowRequestNotification(url, duration) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: #FEF3C7;
            border: 2px solid #F59E0B;
            color: #92400E;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            max-width: 90%;
            animation: slideUp 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>느린 요청 감지</strong>
                    <p style="margin: 0; font-size: 0.875rem;">${url.split('/').pop()}: ${duration.toFixed(0)}ms</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; border: none; cursor: pointer; font-size: 1.25rem; color: #92400E;">×</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }

    /**
     * 서버 리포팅 여부
     */
    shouldReportToServer() {
        // 프로덕션 환경에서만 리포팅
        return window.location.hostname.includes('albi.kr') || 
               window.location.hostname.includes('pages.dev');
    }

    /**
     * 서버로 메트릭 전송
     */
    async sendToServer(name, value) {
        try {
            await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metric: name,
                    value,
                    timestamp: Date.now(),
                    url: window.location.pathname,
                    userAgent: navigator.userAgent
                })
            });
        } catch (error) {
            console.warn('[Performance] Failed to send metrics:', error);
        }
    }

    /**
     * 성능 리포트 생성
     */
    getReport() {
        return {
            metrics: this.metrics,
            summary: {
                lcp: this.getVitalGrade('LCP', this.metrics.LCP),
                fid: this.getVitalGrade('FID', this.metrics.FID),
                cls: this.getVitalGrade('CLS', this.metrics.CLS),
                fcp: this.getVitalGrade('FCP', this.metrics.FCP),
                ttfb: this.getVitalGrade('TTFB', this.metrics.TTFB),
                inp: this.getVitalGrade('INP', this.metrics.INP)
            },
            timestamp: Date.now()
        };
    }

    /**
     * 리포트 출력
     */
    logReport() {
        console.table(this.getReport().metrics);
        console.log('[Performance] Summary:', this.getReport().summary);
    }
}

// 초기화
const performanceMonitor = new PerformanceMonitor();

// 페이지 언로드 시 최종 리포트
window.addEventListener('beforeunload', () => {
    performanceMonitor.logReport();
});

// 전역으로 export
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = performanceMonitor;
}
