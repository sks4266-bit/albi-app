/**
 * 면접관 애니메이션 시스템
 * - 자연스러운 얼굴 움직임
 * - 눈 깜빡임
 * - 고개 움직임
 * - 말할 때 입 움직임
 */

class InterviewerAnimator {
  constructor(imageElement) {
    this.image = imageElement;
    this.container = imageElement.parentElement;
    this.isAnimating = false;
    this.isSpeaking = false;
    
    this.init();
  }
  
  init() {
    // 컨테이너에 애니메이션 스타일 추가
    if (this.container) {
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
    }
    
    // 이미지 애니메이션 설정
    this.image.style.transition = 'transform 0.3s ease-out';
    
    // 자동 애니메이션 시작
    this.startIdleAnimation();
  }
  
  /**
   * 대기 상태 애니메이션 (자연스러운 움직임)
   */
  startIdleAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const animate = () => {
      if (!this.isAnimating) return;
      
      // 랜덤한 간격으로 움직임
      const delay = 2000 + Math.random() * 3000; // 2-5초
      
      setTimeout(() => {
        if (!this.isSpeaking) {
          // 작은 고개 움직임
          const moveX = (Math.random() - 0.5) * 2; // -1 ~ 1도
          const moveY = (Math.random() - 0.5) * 2;
          this.image.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
          
          // 0.5초 후 원위치
          setTimeout(() => {
            if (!this.isSpeaking) {
              this.image.style.transform = 'translate(0, 0) scale(1)';
            }
          }, 500);
        }
        
        animate(); // 다음 애니메이션 예약
      }, delay);
    };
    
    animate();
    
    // 눈 깜빡임 효과
    this.startBlinkAnimation();
  }
  
  /**
   * 눈 깜빡임 애니메이션
   */
  startBlinkAnimation() {
    const blink = () => {
      if (!this.isAnimating) return;
      
      // 깜빡임 효과 (밝기 살짝 변경)
      if (!this.isSpeaking) {
        this.image.style.filter = 'brightness(0.95)';
        setTimeout(() => {
          this.image.style.filter = 'brightness(1)';
        }, 100);
      }
      
      // 3-5초 후 다시 깜빡임
      const nextBlink = 3000 + Math.random() * 2000;
      setTimeout(blink, nextBlink);
    };
    
    blink();
  }
  
  /**
   * 말하기 시작
   */
  startSpeaking() {
    this.isSpeaking = true;
    this.image.style.transition = 'transform 0.15s ease-in-out';
    
    // 말하는 동안 약간 더 활발한 움직임
    let speakFrame = 0;
    const speakAnimation = setInterval(() => {
      if (!this.isSpeaking) {
        clearInterval(speakAnimation);
        return;
      }
      
      speakFrame++;
      const intensity = 0.5 + Math.sin(speakFrame * 0.3) * 0.5;
      const moveY = Math.sin(speakFrame * 0.5) * intensity;
      const scale = 1 + Math.sin(speakFrame * 0.4) * 0.01;
      
      this.image.style.transform = `translateY(${moveY}px) scale(${scale})`;
    }, 100);
  }
  
  /**
   * 말하기 종료
   */
  stopSpeaking() {
    this.isSpeaking = false;
    this.image.style.transition = 'transform 0.3s ease-out';
    this.image.style.transform = 'translate(0, 0) scale(1)';
  }
  
  /**
   * 반응 애니메이션 (고개 끄덕임)
   */
  nod() {
    const originalTransform = this.image.style.transform;
    
    // 고개 끄덕임
    this.image.style.transform = 'translateY(3px) scale(1.01)';
    setTimeout(() => {
      this.image.style.transform = 'translateY(-2px) scale(1.01)';
      setTimeout(() => {
        this.image.style.transform = originalTransform || 'translate(0, 0) scale(1)';
      }, 200);
    }, 200);
  }
  
  /**
   * 애니메이션 중지
   */
  stop() {
    this.isAnimating = false;
    this.isSpeaking = false;
    this.image.style.transform = 'translate(0, 0) scale(1)';
  }
}

// 전역으로 사용 가능하도록
window.InterviewerAnimator = InterviewerAnimator;

/**
 * 면접관 이미지에 자동으로 애니메이션 적용
 */
document.addEventListener('DOMContentLoaded', () => {
  // 모든 면접관 이미지 찾기
  const interviewerImages = document.querySelectorAll('#interviewerImage, .interviewer-avatar img');
  
  interviewerImages.forEach(img => {
    // 이미지 로드 후 애니메이션 시작
    if (img.complete) {
      new InterviewerAnimator(img);
    } else {
      img.addEventListener('load', () => {
        new InterviewerAnimator(img);
      });
    }
  });
});
