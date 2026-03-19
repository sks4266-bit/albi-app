/**
 * 통합 에러 핸들링 시스템
 * Phase 8.1: 시스템 안정화
 */

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50; // 최대 저장 에러 수
        this.errorTypes = {
            NETWORK: 'network',
            PERMISSION: 'permission',
            API: 'api',
            MEDIA: 'media',
            SPEECH: 'speech',
            GENERAL: 'general'
        };
        
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        // 전역 에러 핸들러
        window.addEventListener('error', (event) => {
            this.logError({
                type: this.errorTypes.GENERAL,
                message: event.message,
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promise rejection 핸들러
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: this.errorTypes.GENERAL,
                message: event.reason?.message || 'Unhandled Promise rejection',
                stack: event.reason?.stack
            });
        });
        
        console.log('[ErrorHandler] Initialized');
    }
    
    /**
     * 에러 로깅
     */
    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type: error.type || this.errorTypes.GENERAL,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...error
        };
        
        // 에러 저장
        this.errors.push(errorLog);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // 콘솔 출력
        console.error('[ErrorHandler]', errorLog);
        
        // 로컬 스토리지 저장
        try {
            const storedErrors = JSON.parse(localStorage.getItem('albi_errors') || '[]');
            storedErrors.push(errorLog);
            if (storedErrors.length > this.maxErrors) {
                storedErrors.shift();
            }
            localStorage.setItem('albi_errors', JSON.stringify(storedErrors));
        } catch (e) {
            console.warn('[ErrorHandler] Failed to save error to localStorage:', e);
        }
        
        return errorLog;
    }
    
    /**
     * 네트워크 에러 처리
     */
    handleNetworkError(error, context = {}) {
        const errorLog = this.logError({
            type: this.errorTypes.NETWORK,
            message: error.message || 'Network error',
            context
        });
        
        // 사용자 피드백
        this.showUserFeedback({
            type: 'error',
            title: '네트워크 오류',
            message: '인터넷 연결을 확인해주세요.',
            action: context.retry ? {
                label: '다시 시도',
                callback: context.retry
            } : null
        });
        
        return errorLog;
    }
    
    /**
     * 권한 에러 처리
     */
    handlePermissionError(permission, error) {
        const errorLog = this.logError({
            type: this.errorTypes.PERMISSION,
            message: `Permission denied: ${permission}`,
            permission,
            error: error?.message
        });
        
        let message = '';
        let instructions = '';
        
        switch(permission) {
            case 'camera':
                message = '카메라 권한이 필요합니다.';
                instructions = '브라우저 설정에서 카메라 권한을 허용해주세요.';
                break;
            case 'microphone':
                message = '마이크 권한이 필요합니다.';
                instructions = '브라우저 설정에서 마이크 권한을 허용해주세요.';
                break;
            default:
                message = `${permission} 권한이 필요합니다.`;
                instructions = '브라우저 설정을 확인해주세요.';
        }
        
        this.showUserFeedback({
            type: 'error',
            title: '권한 필요',
            message: message,
            details: instructions
        });
        
        return errorLog;
    }
    
    /**
     * API 에러 처리
     */
    handleAPIError(response, endpoint) {
        const errorLog = this.logError({
            type: this.errorTypes.API,
            message: `API Error: ${response.status} ${response.statusText}`,
            endpoint,
            status: response.status,
            statusText: response.statusText
        });
        
        let message = 'API 요청에 실패했습니다.';
        
        if (response.status === 429) {
            message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        } else if (response.status >= 500) {
            message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        this.showUserFeedback({
            type: 'error',
            title: 'API 오류',
            message
        });
        
        return errorLog;
    }
    
    /**
     * 미디어 에러 처리
     */
    handleMediaError(error, device) {
        const errorLog = this.logError({
            type: this.errorTypes.MEDIA,
            message: `Media error: ${device}`,
            error: error?.message,
            device
        });
        
        this.showUserFeedback({
            type: 'error',
            title: '미디어 오류',
            message: `${device} 초기화에 실패했습니다.`
        });
        
        return errorLog;
    }
    
    /**
     * 음성 인식 에러 처리
     */
    handleSpeechError(error) {
        const errorLog = this.logError({
            type: this.errorTypes.SPEECH,
            message: 'Speech recognition error',
            error: error?.error || error?.message
        });
        
        let message = '음성 인식에 문제가 발생했습니다.';
        
        if (error?.error === 'no-speech') {
            message = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
        } else if (error?.error === 'audio-capture') {
            message = '마이크에 접근할 수 없습니다.';
        } else if (error?.error === 'not-allowed') {
            message = '마이크 권한이 필요합니다.';
        }
        
        this.showUserFeedback({
            type: 'warning',
            title: '음성 인식 오류',
            message
        });
        
        return errorLog;
    }
    
    /**
     * 사용자 피드백 표시
     */
    showUserFeedback(options) {
        // Toast 알림 표시
        if (typeof showToast === 'function') {
            showToast(options.message, options.type);
        }
        
        // 상세 정보가 있으면 모달 표시
        if (options.details) {
            console.info('[ErrorHandler] Details:', options.details);
        }
    }
    
    /**
     * 에러 통계
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {}
        };
        
        this.errors.forEach(error => {
            const type = error.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * 에러 목록 가져오기
     */
    getErrors(limit = 10) {
        return this.errors.slice(-limit);
    }
    
    /**
     * 에러 초기화
     */
    clearErrors() {
        this.errors = [];
        try {
            localStorage.removeItem('albi_errors');
        } catch (e) {
            console.warn('[ErrorHandler] Failed to clear errors from localStorage:', e);
        }
    }
}

// 전역 인스턴스 생성
window.errorHandler = new ErrorHandler();

// 편의 함수 export
window.logError = (error) => window.errorHandler.logError(error);
window.handleNetworkError = (error, context) => window.errorHandler.handleNetworkError(error, context);
window.handlePermissionError = (permission, error) => window.errorHandler.handlePermissionError(permission, error);
window.handleAPIError = (response, endpoint) => window.errorHandler.handleAPIError(response, endpoint);
window.handleMediaError = (error, device) => window.errorHandler.handleMediaError(error, device);
window.handleSpeechError = (error) => window.errorHandler.handleSpeechError(error);
