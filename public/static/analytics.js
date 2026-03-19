/**
 * Analytics 통합 유틸리티
 * Privacy-first analytics with Plausible/Simple Analytics
 */

class AnalyticsManager {
    constructor() {
        this.enabled = this.shouldEnableAnalytics();
        this.events = [];
        this.init();
    }

    /**
     * Analytics 활성화 여부 확인
     */
    shouldEnableAnalytics() {
        // 프로덕션 환경만 활성화
        const isProduction = window.location.hostname.includes('albi.kr') || 
                           window.location.hostname.includes('pages.dev');
        
        // DNT (Do Not Track) 확인
        const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
        const dntEnabled = dnt === '1' || dnt === 'yes';
        
        return isProduction && !dntEnabled;
    }

    /**
     * 초기화
     */
    init() {
        if (!this.enabled) {
            console.log('[Analytics] Disabled (DNT or non-production)');
            return;
        }

        // Plausible Analytics (Privacy-focused, GDPR-compliant)
        this.loadPlausible();

        // 페이지뷰 자동 추적
        this.trackPageView();

        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    /**
     * Plausible Analytics 로드
     */
    loadPlausible() {
        // Plausible 스크립트는 index.html에서 직접 로드
        // 여기서는 커스텀 이벤트만 처리
        console.log('[Analytics] Plausible ready');
    }

    /**
     * 페이지뷰 추적
     */
    trackPageView() {
        if (!this.enabled) return;

        const pageData = {
            url: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: Date.now()
        };

        this.track('pageview', pageData);
    }

    /**
     * 이벤트 추적
     */
    track(eventName, properties = {}) {
        if (!this.enabled) return;

        // Plausible 커스텀 이벤트
        if (typeof window.plausible !== 'undefined') {
            window.plausible(eventName, { props: properties });
        }

        // 로컬 이벤트 저장 (디버깅용)
        this.events.push({
            event: eventName,
            properties,
            timestamp: Date.now()
        });

        console.log('[Analytics] Event tracked:', eventName, properties);
    }

    /**
     * 자동 이벤트 리스너
     */
    setupEventListeners() {
        // 외부 링크 클릭
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith(window.location.origin)) {
                this.track('Outbound Link', {
                    url: link.href,
                    text: link.textContent.trim()
                });
            }
        });

        // 다운로드 추적
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.download) {
                this.track('File Download', {
                    file: link.download,
                    url: link.href
                });
            }
        });

        // 에러 추적
        window.addEventListener('error', (e) => {
            this.track('JavaScript Error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno
            });
        });
    }

    /**
     * 커스텀 이벤트 추적 메서드들
     */

    // 버튼 클릭
    trackButtonClick(buttonName, metadata = {}) {
        this.track('Button Click', {
            button: buttonName,
            ...metadata
        });
    }

    // 폼 제출
    trackFormSubmit(formName, metadata = {}) {
        this.track('Form Submit', {
            form: formName,
            ...metadata
        });
    }

    // 검색
    trackSearch(query, results = null) {
        this.track('Search', {
            query,
            results: results !== null ? results : undefined
        });
    }

    // 면접 시작
    trackInterviewStart(jobType) {
        this.track('Interview Start', {
            job_type: jobType
        });
    }

    // 면접 완료
    trackInterviewComplete(jobType, grade, score) {
        this.track('Interview Complete', {
            job_type: jobType,
            grade,
            score
        });
    }

    // AI 멘토 대화
    trackMentorChat(messageCount) {
        this.track('Mentor Chat', {
            message_count: messageCount
        });
    }

    // 음성 멘토링 시작
    trackVoiceMentorStart() {
        this.track('Voice Mentor Start');
    }

    // 포트폴리오 생성
    trackPortfolioCreate(type) {
        this.track('Portfolio Create', {
            type
        });
    }

    // AI 교정 사용
    trackProofread(documentType, language) {
        this.track('Proofread', {
            document_type: documentType,
            language
        });
    }

    // 구독 시작
    trackSubscriptionStart(plan, price) {
        this.track('Subscription Start', {
            plan,
            price
        });
    }

    // 결제 완료
    trackPaymentComplete(amount, method) {
        this.track('Payment Complete', {
            amount,
            method
        });
    }

    // 과제 제출
    trackAssignmentSubmit(type, difficulty) {
        this.track('Assignment Submit', {
            type,
            difficulty
        });
    }

    // 사용자 피드백
    trackFeedback(rating, comment = '') {
        this.track('User Feedback', {
            rating,
            has_comment: comment.length > 0
        });
    }

    // PWA 설치
    trackPWAInstall() {
        this.track('PWA Install');
    }

    // 오프라인 모드 진입
    trackOfflineMode() {
        this.track('Offline Mode');
    }

    // 다크 모드 전환
    trackThemeChange(theme) {
        this.track('Theme Change', {
            theme
        });
    }

    /**
     * 세션 정보 가져오기
     */
    getSessionInfo() {
        return {
            events: this.events.length,
            firstEvent: this.events[0]?.timestamp,
            lastEvent: this.events[this.events.length - 1]?.timestamp,
            duration: this.events.length > 0 
                ? this.events[this.events.length - 1].timestamp - this.events[0].timestamp
                : 0
        };
    }

    /**
     * 이벤트 히스토리 가져오기
     */
    getEventHistory() {
        return this.events;
    }

    /**
     * 통계 리포트
     */
    getReport() {
        const eventTypes = {};
        this.events.forEach(e => {
            eventTypes[e.event] = (eventTypes[e.event] || 0) + 1;
        });

        return {
            session: this.getSessionInfo(),
            eventTypes,
            totalEvents: this.events.length
        };
    }
}

// 초기화
const analyticsManager = new AnalyticsManager();

// 전역으로 export
if (typeof window !== 'undefined') {
    window.Analytics = analyticsManager;
}

// 페이지 언로드 시 세션 정보 로깅
window.addEventListener('beforeunload', () => {
    const report = analyticsManager.getReport();
    console.log('[Analytics] Session Report:', report);
});
