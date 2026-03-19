/**
 * AI 실시간 코칭 시스템
 * Phase 8.4: 신규 기능 추가
 */

class AICoach {
    constructor() {
        this.isActive = false;
        this.coachingHistory = [];
        this.lastFeedbackTime = 0;
        this.feedbackInterval = 5000; // 5초마다 피드백
        this.feedbackQueue = [];
        this.currentMetrics = {};
        
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        console.log('[AICoach] Initialized');
    }
    
    /**
     * 코칭 시작
     */
    start() {
        this.isActive = true;
        this.lastFeedbackTime = Date.now();
        console.log('[AICoach] Coaching started');
        this.showCoachingPanel();
    }
    
    /**
     * 코칭 중지
     */
    stop() {
        this.isActive = false;
        console.log('[AICoach] Coaching stopped');
    }
    
    /**
     * 코칭 패널 표시
     */
    showCoachingPanel() {
        // 기존 패널 확인
        if (document.getElementById('aiCoachPanel')) {
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'aiCoachPanel';
        panel.className = 'fixed right-4 top-20 w-80 bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/30 z-40 overflow-hidden';
        panel.innerHTML = `
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h3 class="font-bold text-white">AI 코칭</h3>
                </div>
                <button onclick="window.aiCoach.togglePanel()" class="text-white hover:text-gray-200">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
            
            <div id="coachPanelContent" class="p-4 max-h-96 overflow-y-auto">
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-robot text-4xl mb-2"></i>
                    <p class="text-sm">면접을 시작하면<br/>실시간 코칭이 시작됩니다</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
    
    /**
     * 패널 토글
     */
    togglePanel() {
        const content = document.getElementById('coachPanelContent');
        if (content) {
            content.classList.toggle('hidden');
        }
    }
    
    /**
     * 실시간 분석 수신
     */
    analyzeMetrics(metrics) {
        if (!this.isActive) return;
        
        this.currentMetrics = metrics;
        
        // 일정 시간 간격으로 피드백
        const now = Date.now();
        if (now - this.lastFeedbackTime >= this.feedbackInterval) {
            this.generateFeedback(metrics);
            this.lastFeedbackTime = now;
        }
    }
    
    /**
     * 피드백 생성
     */
    generateFeedback(metrics) {
        const feedbacks = [];
        
        // 표정 분석
        if (metrics.expressionScore !== undefined) {
            if (metrics.expressionScore < 50) {
                feedbacks.push({
                    type: 'warning',
                    category: '표정',
                    message: '표정이 경직되어 있습니다. 자연스러운 미소를 지어보세요.',
                    icon: 'fa-smile',
                    priority: 3
                });
            } else if (metrics.expressionScore < 70) {
                feedbacks.push({
                    type: 'info',
                    category: '표정',
                    message: '표정이 조금 더 밝아지면 좋겠습니다.',
                    icon: 'fa-smile',
                    priority: 2
                });
            }
        }
        
        // 시선 분석
        if (metrics.gazeScore !== undefined) {
            if (metrics.gazeScore < 50) {
                feedbacks.push({
                    type: 'error',
                    category: '시선',
                    message: '카메라를 똑바로 봐주세요. 시선이 많이 분산되어 있습니다.',
                    icon: 'fa-eye',
                    priority: 4
                });
            } else if (metrics.gazeScore < 70) {
                feedbacks.push({
                    type: 'warning',
                    category: '시선',
                    message: '시선을 카메라에 좀 더 집중해주세요.',
                    icon: 'fa-eye',
                    priority: 3
                });
            }
        }
        
        // 자세 분석
        if (metrics.postureScore !== undefined) {
            if (metrics.postureScore < 50) {
                feedbacks.push({
                    type: 'error',
                    category: '자세',
                    message: '자세가 많이 구부정합니다. 등을 펴고 바르게 앉아주세요.',
                    icon: 'fa-user',
                    priority: 4
                });
            } else if (metrics.postureScore < 70) {
                feedbacks.push({
                    type: 'info',
                    category: '자세',
                    message: '자세를 조금 더 바르게 유지하세요.',
                    icon: 'fa-user',
                    priority: 2
                });
            }
        }
        
        // 제스처 분석
        if (metrics.gestureFrequency !== undefined) {
            if (metrics.gestureFrequency < 3) {
                feedbacks.push({
                    type: 'info',
                    category: '제스처',
                    message: '손동작이 너무 적습니다. 자연스러운 제스처를 사용해보세요.',
                    icon: 'fa-hand-paper',
                    priority: 1
                });
            } else if (metrics.gestureFrequency > 15) {
                feedbacks.push({
                    type: 'warning',
                    category: '제스처',
                    message: '손동작이 너무 많습니다. 조금 차분하게 해보세요.',
                    icon: 'fa-hand-paper',
                    priority: 2
                });
            }
        }
        
        // 음성 톤 분석
        if (metrics.averageVolume !== undefined) {
            if (metrics.averageVolume < 30) {
                feedbacks.push({
                    type: 'warning',
                    category: '음성',
                    message: '목소리가 너무 작습니다. 좀 더 또렷하게 말해주세요.',
                    icon: 'fa-volume-up',
                    priority: 3
                });
            } else if (metrics.averageVolume > 80) {
                feedbacks.push({
                    type: 'info',
                    category: '음성',
                    message: '목소리 크기가 적당합니다만, 너무 크지 않도록 주의하세요.',
                    icon: 'fa-volume-down',
                    priority: 1
                });
            }
        }
        
        // 말하기 속도
        if (metrics.wordsPerMinute !== undefined) {
            if (metrics.wordsPerMinute < 100) {
                feedbacks.push({
                    type: 'info',
                    category: '말하기 속도',
                    message: '말하는 속도가 느립니다. 조금 더 활기차게 말해보세요.',
                    icon: 'fa-tachometer-alt',
                    priority: 1
                });
            } else if (metrics.wordsPerMinute > 180) {
                feedbacks.push({
                    type: 'warning',
                    category: '말하기 속도',
                    message: '말하는 속도가 빠릅니다. 천천히 또박또박 말해주세요.',
                    icon: 'fa-tachometer-alt',
                    priority: 2
                });
            }
        }
        
        // 우선순위 정렬 (높은 것부터)
        feedbacks.sort((a, b) => b.priority - a.priority);
        
        // 최대 3개만 표시
        const topFeedbacks = feedbacks.slice(0, 3);
        
        if (topFeedbacks.length > 0) {
            topFeedbacks.forEach(fb => this.showFeedback(fb));
        } else {
            // 모든 지표가 양호한 경우
            this.showFeedback({
                type: 'success',
                category: '종합',
                message: '훌륭합니다! 현재 상태를 잘 유지하세요.',
                icon: 'fa-thumbs-up',
                priority: 5
            });
        }
    }
    
    /**
     * 피드백 표시
     */
    showFeedback(feedback) {
        const content = document.getElementById('coachPanelContent');
        if (!content) return;
        
        // 첫 피드백이면 안내 메시지 제거
        const emptyState = content.querySelector('.text-center');
        if (emptyState) {
            emptyState.remove();
        }
        
        const colors = {
            success: 'bg-green-900/30 border-green-500/30 text-green-400',
            info: 'bg-blue-900/30 border-blue-500/30 text-blue-400',
            warning: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
            error: 'bg-red-900/30 border-red-500/30 text-red-400'
        };
        
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `mb-3 p-3 rounded-lg border ${colors[feedback.type]} animate-slide-in`;
        feedbackEl.innerHTML = `
            <div class="flex items-start gap-3">
                <i class="fas ${feedback.icon} text-lg mt-1"></i>
                <div class="flex-1">
                    <div class="font-bold text-sm mb-1">${feedback.category}</div>
                    <p class="text-xs text-gray-300">${feedback.message}</p>
                    <div class="text-xs text-gray-500 mt-1">${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        
        // 최신 피드백을 상단에 추가
        content.insertBefore(feedbackEl, content.firstChild);
        
        // 피드백 히스토리에 추가
        this.coachingHistory.push({
            ...feedback,
            timestamp: Date.now()
        });
        
        // 오래된 피드백 제거 (최대 10개 유지)
        const allFeedbacks = content.querySelectorAll('.animate-slide-in');
        if (allFeedbacks.length > 10) {
            allFeedbacks[allFeedbacks.length - 1].remove();
        }
        
        // 자동 스크롤
        content.scrollTop = 0;
    }
    
    /**
     * 긍정적 피드백
     */
    givePositiveFeedback(category) {
        const positiveFeedbacks = {
            '표정': '자연스러운 미소가 아주 좋습니다! 계속 유지하세요.',
            '시선': '시선 처리가 완벽합니다! 자신감이 느껴집니다.',
            '자세': '바른 자세를 잘 유지하고 있습니다!',
            '제스처': '적절한 손동작이 설명을 돋보이게 합니다.',
            '음성': '목소리 톤과 크기가 이상적입니다!',
            '답변': '답변이 논리적이고 구체적입니다. 훌륭해요!'
        };
        
        this.showFeedback({
            type: 'success',
            category: category,
            message: positiveFeedbacks[category] || '아주 잘하고 있습니다!',
            icon: 'fa-star',
            priority: 5
        });
    }
    
    /**
     * 코칭 리포트 생성
     */
    generateReport() {
        const report = {
            totalFeedbacks: this.coachingHistory.length,
            feedbacksByType: {},
            feedbacksByCategory: {},
            timeline: this.coachingHistory
        };
        
        // 타입별 집계
        this.coachingHistory.forEach(fb => {
            report.feedbacksByType[fb.type] = (report.feedbacksByType[fb.type] || 0) + 1;
            report.feedbacksByCategory[fb.category] = (report.feedbacksByCategory[fb.category] || 0) + 1;
        });
        
        return report;
    }
    
    /**
     * 코칭 히스토리 초기화
     */
    reset() {
        this.coachingHistory = [];
        this.currentMetrics = {};
        this.lastFeedbackTime = 0;
        
        const content = document.getElementById('coachPanelContent');
        if (content) {
            content.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-robot text-4xl mb-2"></i>
                    <p class="text-sm">면접을 시작하면<br/>실시간 코칭이 시작됩니다</p>
                </div>
            `;
        }
    }
}

// 전역 인스턴스
window.aiCoach = new AICoach();

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);
