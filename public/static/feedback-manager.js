/**
 * 사용자 피드백 시스템
 * 별점, 코멘트, NPS 설문
 */

class FeedbackManager {
    constructor() {
        this.feedbackShown = false;
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // 페이지 로드 후 적절한 타이밍에 피드백 요청
        this.scheduleFeedbackPrompt();
    }

    /**
     * 피드백 프롬프트 스케줄
     */
    scheduleFeedbackPrompt() {
        // 1분 후 또는 특정 이벤트 후 피드백 요청
        setTimeout(() => {
            if (!this.feedbackShown && !this.hasRecentFeedback()) {
                this.showFeedbackWidget();
            }
        }, 60000); // 1분

        // 페이지 이탈 시도 시 피드백 요청
        this.setupExitIntent();
    }

    /**
     * 최근 피드백 여부 확인
     */
    hasRecentFeedback() {
        const lastFeedback = localStorage.getItem('last_feedback_date');
        if (!lastFeedback) return false;

        const daysSince = (Date.now() - parseInt(lastFeedback)) / (1000 * 60 * 60 * 24);
        return daysSince < 7; // 7일 이내 피드백 있음
    }

    /**
     * 이탈 의도 감지
     */
    setupExitIntent() {
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 10 && !this.feedbackShown && !this.hasRecentFeedback()) {
                this.showFeedbackWidget();
            }
        });
    }

    /**
     * 피드백 위젯 표시
     */
    showFeedbackWidget() {
        if (this.feedbackShown) return;
        this.feedbackShown = true;

        const widget = document.createElement('div');
        widget.id = 'feedback-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 1.5rem;
            max-width: 400px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        widget.innerHTML = `
            <style>
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .star-rating {
                    display: flex;
                    gap: 0.5rem;
                    font-size: 2rem;
                    margin: 1rem 0;
                    justify-content: center;
                }
                .star {
                    cursor: pointer;
                    color: #d1d5db;
                    transition: color 0.2s;
                }
                .star:hover,
                .star.active {
                    color: #fbbf24;
                }
            </style>
            <button onclick="document.getElementById('feedback-widget').remove()" style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #9ca3af;">×</button>
            <div style="text-align: center;">
                <h3 style="color: #3B82F6; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                    <i class="fas fa-heart"></i> 서비스가 도움이 되셨나요?
                </h3>
                <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
                    여러분의 피드백이 서비스 개선에 큰 도움이 됩니다.
                </p>
                <div class="star-rating" id="star-rating">
                    <span class="star" data-rating="1">⭐</span>
                    <span class="star" data-rating="2">⭐</span>
                    <span class="star" data-rating="3">⭐</span>
                    <span class="star" data-rating="4">⭐</span>
                    <span class="star" data-rating="5">⭐</span>
                </div>
                <textarea 
                    id="feedback-comment" 
                    placeholder="의견을 자유롭게 적어주세요 (선택사항)"
                    style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; resize: vertical; min-height: 80px; font-size: 0.875rem; display: none;"
                ></textarea>
                <button 
                    id="submit-feedback"
                    style="background: #3B82F6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; width: 100%; margin-top: 1rem; display: none;"
                    disabled
                >
                    제출하기
                </button>
            </div>
        `;

        document.body.appendChild(widget);

        // 별점 클릭 이벤트
        let selectedRating = 0;
        const stars = widget.querySelectorAll('.star');
        const comment = widget.querySelector('#feedback-comment');
        const submitBtn = widget.querySelector('#submit-feedback');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                
                // 별 활성화
                stars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });

                // 코멘트 입력란 및 제출 버튼 표시
                comment.style.display = 'block';
                submitBtn.style.display = 'block';
                submitBtn.disabled = false;
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.style.color = '#fbbf24';
                    } else {
                        s.style.color = '#d1d5db';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.style.color = '#fbbf24';
                    } else {
                        s.style.color = '#d1d5db';
                    }
                });
            });
        });

        // 제출 버튼
        submitBtn.addEventListener('click', () => {
            this.submitFeedback(selectedRating, comment.value);
            widget.remove();
        });
    }

    /**
     * 피드백 제출
     */
    async submitFeedback(rating, comment) {
        const feedback = {
            rating,
            comment,
            url: window.location.pathname,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };

        try {
            // API로 피드백 전송
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedback)
            });

            if (response.ok) {
                this.showThankYou(rating);
                localStorage.setItem('last_feedback_date', Date.now().toString());
                
                // Analytics 추적
                if (window.Analytics) {
                    window.Analytics.trackFeedback(rating, comment);
                }
            }
        } catch (error) {
            console.error('[Feedback] Submission failed:', error);
            
            // 실패해도 로컬에 저장
            const storedFeedback = JSON.parse(localStorage.getItem('pending_feedback') || '[]');
            storedFeedback.push(feedback);
            localStorage.setItem('pending_feedback', JSON.stringify(storedFeedback));
        }
    }

    /**
     * 감사 메시지 표시
     */
    showThankYou(rating) {
        const thankYou = document.createElement('div');
        thankYou.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 1rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 1.5rem;
            max-width: 400px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        const emoji = rating >= 4 ? '🎉' : rating >= 3 ? '👍' : '💙';
        const message = rating >= 4 
            ? '소중한 의견 감사합니다! 더 나은 서비스로 보답하겠습니다.'
            : rating >= 3
            ? '피드백 감사합니다. 계속 개선해나가겠습니다!'
            : '의견 주셔서 감사합니다. 더 나은 서비스를 위해 노력하겠습니다.';

        thankYou.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">${emoji}</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">감사합니다!</h3>
                <p style="font-size: 0.875rem; opacity: 0.9;">${message}</p>
            </div>
        `;

        document.body.appendChild(thankYou);

        setTimeout(() => {
            thankYou.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => thankYou.remove(), 300);
        }, 3000);
    }

    /**
     * 빠른 피드백 버튼 (플로팅)
     */
    showQuickFeedback() {
        const button = document.createElement('button');
        button.id = 'quick-feedback-btn';
        button.style.cssText = `
            position: fixed;
            bottom: 8rem;
            right: 2rem;
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            transition: all 0.3s;
        `;

        button.innerHTML = '<i class="fas fa-comment-dots" style="font-size: 1.5rem;"></i>';
        button.title = '피드백 남기기';

        button.addEventListener('click', () => {
            this.showFeedbackWidget();
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        document.body.appendChild(button);
    }
}

// 초기화
const feedbackManager = new FeedbackManager();

// 전역으로 export
if (typeof window !== 'undefined') {
    window.FeedbackManager = feedbackManager;
    
    // 빠른 피드백 버튼 표시 (선택사항)
    // feedbackManager.showQuickFeedback();
}
