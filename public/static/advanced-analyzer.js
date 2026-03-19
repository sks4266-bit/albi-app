/**
 * Advanced Analysis Library
 * 고급 분석: 제스처, 음성 톤, 감정, 속도, 명확도
 */

class AdvancedAnalyzer {
  constructor() {
    this.gestureDetector = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    
    // 분석 데이터
    this.gestureData = {
      handVisible: 0,
      noHands: 0,
      openHand: 0,
      closedHand: 0,
      pointing: 0,
      excessiveMovement: 0
    };
    
    this.voiceData = {
      volumeLevels: [],
      pitchLevels: [],
      silenceDuration: 0,
      tooLoud: 0,
      tooQuiet: 0,
      stable: 0
    };
    
    this.speechData = {
      totalWords: 0,
      totalTime: 0,
      fillerWords: 0,
      repeatedWords: {},
      sentimentScores: []
    };
    
    // 필러 워드 목록 (한국어, 영어, 중국어)
    this.fillerWords = {
      ko: ['음', '아', '어', '그', '저', '뭐', '좀', '막', '이제', '그냥'],
      en: ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally', 'so', 'well'],
      zh: ['那个', '这个', '嗯', '啊', '就是', '然后']
    };
  }
  
  /**
   * MediaPipe Hands 초기화
   */
  async initGestureDetection() {
    try {
      // MediaPipe Hands CDN 로드 확인
      if (typeof Hands === 'undefined') {
        console.warn('[AdvancedAnalyzer] MediaPipe Hands not loaded. Skipping gesture detection.');
        return false;
      }
      
      this.gestureDetector = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      this.gestureDetector.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      this.gestureDetector.onResults((results) => {
        this.processGestureResults(results);
      });
      
      console.log('[AdvancedAnalyzer] Gesture detection initialized');
      return true;
    } catch (error) {
      console.error('[AdvancedAnalyzer] Gesture init error:', error);
      return false;
    }
  }
  
  /**
   * Web Audio API 초기화
   */
  async initVoiceAnalysis(stream) {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      this.mediaStream = stream;
      
      // 실시간 음성 분석 시작
      this.startVoiceMonitoring();
      
      console.log('[AdvancedAnalyzer] Voice analysis initialized');
      return true;
    } catch (error) {
      console.error('[AdvancedAnalyzer] Voice init error:', error);
      return false;
    }
  }
  
  /**
   * 제스처 결과 처리
   */
  processGestureResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.gestureData.noHands++;
      return;
    }
    
    this.gestureData.handVisible++;
    
    results.multiHandLandmarks.forEach((landmarks) => {
      // 손 제스처 분석
      const gesture = this.analyzeHandGesture(landmarks);
      
      if (gesture === 'open') {
        this.gestureData.openHand++;
      } else if (gesture === 'closed') {
        this.gestureData.closedHand++;
      } else if (gesture === 'pointing') {
        this.gestureData.pointing++;
      }
      
      // 과도한 움직임 감지
      const movement = this.calculateHandMovement(landmarks);
      if (movement > 0.1) {
        this.gestureData.excessiveMovement++;
      }
    });
  }
  
  /**
   * 손 제스처 분석 (간단한 휴리스틱)
   */
  analyzeHandGesture(landmarks) {
    // 손가락 끝과 손바닥 중심의 거리 계산
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const palmBase = landmarks[0];
    
    const distances = [
      this.calculateDistance(indexTip, palmBase),
      this.calculateDistance(middleTip, palmBase)
    ];
    
    const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
    
    if (avgDistance > 0.3) {
      return 'open';
    } else if (avgDistance < 0.15) {
      return 'closed';
    } else {
      return 'pointing';
    }
  }
  
  /**
   * 손 움직임 계산
   */
  calculateHandMovement(landmarks) {
    if (!this.lastHandPosition) {
      this.lastHandPosition = landmarks[0];
      return 0;
    }
    
    const movement = this.calculateDistance(landmarks[0], this.lastHandPosition);
    this.lastHandPosition = landmarks[0];
    
    return movement;
  }
  
  /**
   * 거리 계산
   */
  calculateDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * 실시간 음성 모니터링
   */
  startVoiceMonitoring() {
    const monitor = () => {
      if (!this.analyser) return;
      
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      
      // 음량 계산 (0-255)
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
      this.voiceData.volumeLevels.push(volume);
      
      // 음량 분류
      if (volume > 150) {
        this.voiceData.tooLoud++;
      } else if (volume < 30) {
        this.voiceData.tooQuiet++;
      } else {
        this.voiceData.stable++;
      }
      
      // 피치 추정 (간단한 방법)
      const pitch = this.estimatePitch(dataArray);
      this.voiceData.pitchLevels.push(pitch);
      
      requestAnimationFrame(monitor);
    };
    
    monitor();
  }
  
  /**
   * 피치 추정
   */
  estimatePitch(dataArray) {
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    // 주파수로 변환 (간단한 추정)
    const sampleRate = this.audioContext.sampleRate;
    const frequency = maxIndex * sampleRate / this.analyser.fftSize;
    
    return frequency;
  }
  
  /**
   * 답변 텍스트 분석
   */
  analyzeSpeech(text, language = 'ko') {
    const words = text.trim().split(/\s+/);
    this.speechData.totalWords += words.length;
    
    // 필러 워드 카운트
    const fillers = this.fillerWords[language] || this.fillerWords['ko'];
    words.forEach(word => {
      if (fillers.includes(word.toLowerCase())) {
        this.speechData.fillerWords++;
      }
      
      // 단어 반복 카운트
      const lowerWord = word.toLowerCase();
      this.speechData.repeatedWords[lowerWord] = 
        (this.speechData.repeatedWords[lowerWord] || 0) + 1;
    });
    
    // 감정 분석 (간단한 휴리스틱)
    const sentiment = this.analyzeSentiment(text, language);
    this.speechData.sentimentScores.push(sentiment);
  }
  
  /**
   * 감정 분석 (간단한 키워드 기반)
   */
  analyzeSentiment(text, language) {
    const positiveWords = {
      ko: ['좋', '훌륭', '뛰어', '성공', '달성', '발전', '성장', '열정', '도전', '목표'],
      en: ['good', 'great', 'excellent', 'success', 'achieve', 'develop', 'growth', 'passion', 'challenge', 'goal'],
      zh: ['好', '优秀', '成功', '实现', '发展', '成长', '热情', '挑战', '目标']
    };
    
    const negativeWords = {
      ko: ['어렵', '힘들', '실패', '부족', '문제', '걱정', '어려움'],
      en: ['difficult', 'hard', 'fail', 'lack', 'problem', 'worry', 'difficulty'],
      zh: ['困难', '失败', '缺乏', '问题', '担心']
    };
    
    const positive = positiveWords[language] || positiveWords['ko'];
    const negative = negativeWords[language] || negativeWords['ko'];
    
    let score = 0;
    const lowerText = text.toLowerCase();
    
    positive.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    negative.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });
    
    // -1 (부정) ~ 1 (긍정) 범위로 정규화
    return Math.max(-1, Math.min(1, score / 10));
  }
  
  /**
   * 말하는 속도 계산 (WPM)
   */
  calculateSpeakingRate(duration) {
    if (duration === 0) return 0;
    return (this.speechData.totalWords / duration) * 60;
  }
  
  /**
   * 명확도 점수 계산
   */
  calculateClarity() {
    const totalWords = this.speechData.totalWords;
    if (totalWords === 0) return 100;
    
    // 필러 워드 비율
    const fillerRatio = this.speechData.fillerWords / totalWords;
    
    // 반복 단어 비율
    const uniqueWords = Object.keys(this.speechData.repeatedWords).length;
    const repetitionRatio = uniqueWords / totalWords;
    
    // 명확도 점수 (0-100)
    const clarity = 100 - (fillerRatio * 50) - ((1 - repetitionRatio) * 30);
    
    return Math.max(0, Math.min(100, clarity));
  }
  
  /**
   * 제스처 점수 계산
   */
  getGestureScore() {
    const total = this.gestureData.handVisible + this.gestureData.noHands;
    if (total === 0) return 50; // 중립
    
    // 적절한 제스처 사용 (손이 보이지만 과하지 않음)
    const visibleRatio = this.gestureData.handVisible / total;
    const excessiveRatio = this.gestureData.excessiveMovement / (this.gestureData.handVisible || 1);
    
    let score = 50;
    
    // 적절한 제스처 (30-70% 손 보임)
    if (visibleRatio >= 0.3 && visibleRatio <= 0.7) {
      score += 30;
    } else if (visibleRatio < 0.3) {
      score -= 20; // 너무 적음
    } else {
      score -= 10; // 너무 많음
    }
    
    // 과도한 움직임 패널티
    score -= excessiveRatio * 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * 음성 톤 점수 계산
   */
  getVoiceScore() {
    const total = this.voiceData.stable + this.voiceData.tooLoud + this.voiceData.tooQuiet;
    if (total === 0) return 50;
    
    const stableRatio = this.voiceData.stable / total;
    
    return Math.round(stableRatio * 100);
  }
  
  /**
   * 종합 결과 반환
   */
  getResults(duration) {
    const wpm = this.calculateSpeakingRate(duration);
    const clarity = this.calculateClarity();
    const gestureScore = this.getGestureScore();
    const voiceScore = this.getVoiceScore();
    
    // 평균 감정 점수
    const avgSentiment = this.speechData.sentimentScores.length > 0
      ? this.speechData.sentimentScores.reduce((a, b) => a + b) / this.speechData.sentimentScores.length
      : 0;
    
    return {
      gesture: {
        score: gestureScore,
        data: this.gestureData,
        feedback: this.getGestureFeedback(gestureScore)
      },
      voice: {
        score: voiceScore,
        avgVolume: this.voiceData.volumeLevels.length > 0
          ? this.voiceData.volumeLevels.reduce((a, b) => a + b) / this.voiceData.volumeLevels.length
          : 0,
        avgPitch: this.voiceData.pitchLevels.length > 0
          ? this.voiceData.pitchLevels.reduce((a, b) => a + b) / this.voiceData.pitchLevels.length
          : 0,
        data: this.voiceData,
        feedback: this.getVoiceFeedback(voiceScore)
      },
      speech: {
        wpm: Math.round(wpm),
        clarity: Math.round(clarity),
        fillerWordsCount: this.speechData.fillerWords,
        fillerWordsRatio: this.speechData.totalWords > 0
          ? (this.speechData.fillerWords / this.speechData.totalWords * 100).toFixed(1)
          : 0,
        sentiment: avgSentiment,
        sentimentLabel: avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral',
        feedback: this.getSpeechFeedback(wpm, clarity, avgSentiment)
      }
    };
  }
  
  /**
   * 제스처 피드백
   */
  getGestureFeedback(score) {
    if (score >= 80) return 'Excellent hand gestures! Natural and appropriate.';
    if (score >= 60) return 'Good use of hand gestures. Keep it natural.';
    if (score >= 40) return 'Hand gestures could be improved. Try to be more expressive.';
    return 'Hand gestures need work. Practice using natural hand movements.';
  }
  
  /**
   * 음성 피드백
   */
  getVoiceFeedback(score) {
    if (score >= 80) return 'Excellent voice control! Clear and stable.';
    if (score >= 60) return 'Good voice control. Maintain consistency.';
    if (score >= 40) return 'Voice control needs improvement. Watch your volume.';
    return 'Voice control needs significant work. Practice speaking at a stable volume.';
  }
  
  /**
   * 말하기 피드백
   */
  getSpeechFeedback(wpm, clarity, sentiment) {
    const feedback = [];
    
    // WPM 피드백
    if (wpm < 100) {
      feedback.push('Speaking too slowly. Increase your pace slightly.');
    } else if (wpm > 180) {
      feedback.push('Speaking too fast. Slow down for better clarity.');
    } else {
      feedback.push('Speaking pace is good.');
    }
    
    // 명확도 피드백
    if (clarity < 60) {
      feedback.push('Reduce filler words and word repetition.');
    } else {
      feedback.push('Speech clarity is good.');
    }
    
    // 감정 피드백
    if (sentiment < -0.3) {
      feedback.push('Try to use more positive language.');
    } else if (sentiment > 0.3) {
      feedback.push('Great use of positive language!');
    }
    
    return feedback.join(' ');
  }
  
  /**
   * 정리
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    if (this.gestureDetector) {
      this.gestureDetector.close();
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AdvancedAnalyzer = AdvancedAnalyzer;
}
