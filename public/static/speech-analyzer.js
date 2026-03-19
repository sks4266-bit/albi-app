/**
 * 말하기 속도 및 명확도 분석기
 * - WPM (Words Per Minute): 분당 단어 수
 * - 휴지기 (Pauses): 침묵 구간 분석
 * - 명확성 (Clarity): 발음 명확도
 * - 유창성 (Fluency): 말하기 유창성
 */

class SpeechAnalyzer {
  constructor() {
    // 분석 데이터
    this.transcriptHistory = [];
    this.pauseHistory = [];
    this.wordTimestamps = [];
    
    // 메트릭
    this.wordsPerMinute = 0;
    this.averagePauseLength = 0;
    this.pauseFrequency = 0;
    this.clarityScore = 0;
    this.fluencyScore = 0;
    
    // 통계
    this.stats = {
      totalWords: 0,
      totalPauses: 0,
      longestPause: 0,
      shortestPause: Infinity,
      fillerWords: 0,
      repetitions: 0
    };
    
    // 시작 시간
    this.startTime = null;
    this.lastSpeechTime = null;
    this.isSpeaking = false;
    
    // 침묵 감지 임계값
    this.silenceThreshold = 500; // ms
    this.silenceTimer = null;
    
    // 필러 워드 목록
    this.fillerWords = {
      ko: ['음', '어', '그', '저', '뭐', '막', '이제', '그니까', '있잖아요'],
      en: ['um', 'uh', 'like', 'you know', 'well', 'so', 'actually'],
      zh: ['嗯', '呃', '那个', '就是', '然后']
    };
  }
  
  /**
   * 초기화
   */
  initialize() {
    this.startTime = Date.now();
    this.lastSpeechTime = Date.now();
    console.log('✅ 말하기 분석기 초기화 완료');
  }
  
  /**
   * 새로운 텍스트 추가 (음성 인식 결과)
   */
  addTranscript(text, timestamp = Date.now(), language = 'ko') {
    if (!text || text.trim().length === 0) return;
    
    // 이전 발화와의 시간 간격 (휴지기)
    const pauseLength = timestamp - this.lastSpeechTime;
    
    if (pauseLength > this.silenceThreshold) {
      // 휴지기 기록
      this.pauseHistory.push({
        startTime: this.lastSpeechTime,
        endTime: timestamp,
        duration: pauseLength
      });
      
      this.stats.totalPauses++;
      this.stats.longestPause = Math.max(this.stats.longestPause, pauseLength);
      this.stats.shortestPause = Math.min(this.stats.shortestPause, pauseLength);
    }
    
    // 텍스트 정리
    const cleanText = text.trim();
    
    // 단어 분리
    const words = this.tokenizeWords(cleanText, language);
    
    // 각 단어에 타임스탬프 할당
    const avgWordDuration = words.length > 0 ? (pauseLength / words.length) : 0;
    
    words.forEach((word, index) => {
      const wordTimestamp = this.lastSpeechTime + (avgWordDuration * index);
      
      this.wordTimestamps.push({
        word,
        timestamp: wordTimestamp
      });
      
      // 필러 워드 체크
      if (this.isFillerWord(word, language)) {
        this.stats.fillerWords++;
      }
    });
    
    // 히스토리 저장
    this.transcriptHistory.push({
      text: cleanText,
      timestamp,
      wordCount: words.length,
      pauseBefore: pauseLength
    });
    
    this.stats.totalWords += words.length;
    this.lastSpeechTime = timestamp;
    this.isSpeaking = true;
    
    // 메트릭 계산
    this.calculateMetrics(language);
    
    // 침묵 타이머 초기화
    this.resetSilenceTimer();
  }
  
  /**
   * 단어 토큰화
   */
  tokenizeWords(text, language) {
    if (language === 'zh') {
      // 중국어는 글자 단위로 분리 (간단한 처리)
      return text.split('').filter(char => char.trim().length > 0);
    } else if (language === 'ko') {
      // 한국어는 공백 + 조사 분리
      return text.split(/\s+/).filter(word => word.trim().length > 0);
    } else {
      // 영어 및 기타 언어
      return text.split(/\s+/).filter(word => word.trim().length > 0);
    }
  }
  
  /**
   * 필러 워드 확인
   */
  isFillerWord(word, language) {
    const fillers = this.fillerWords[language] || [];
    return fillers.includes(word.toLowerCase());
  }
  
  /**
   * 침묵 타이머 초기화
   */
  resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    
    this.silenceTimer = setTimeout(() => {
      this.isSpeaking = false;
    }, this.silenceThreshold);
  }
  
  /**
   * 메트릭 계산
   */
  calculateMetrics(language = 'ko') {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.startTime) / 1000; // 초
    
    if (elapsedTime === 0) return;
    
    // WPM (Words Per Minute) 계산
    const elapsedMinutes = elapsedTime / 60;
    this.wordsPerMinute = this.stats.totalWords / elapsedMinutes;
    
    // 평균 휴지기 길이
    if (this.pauseHistory.length > 0) {
      const totalPauseDuration = this.pauseHistory.reduce((sum, pause) => sum + pause.duration, 0);
      this.averagePauseLength = totalPauseDuration / this.pauseHistory.length;
    }
    
    // 휴지기 빈도 (분당)
    this.pauseFrequency = (this.stats.totalPauses / elapsedTime) * 60;
    
    // 명확성 점수 계산
    this.clarityScore = this.calculateClarityScore(language);
    
    // 유창성 점수 계산
    this.fluencyScore = this.calculateFluencyScore();
  }
  
  /**
   * 명확성 점수 계산
   */
  calculateClarityScore(language) {
    // 기준:
    // 1. 필러 워드 비율 낮을수록 좋음: 50점
    // 2. 적절한 WPM (언어별 기준): 30점
    // 3. 적절한 휴지기: 20점
    
    let score = 0;
    
    // 1. 필러 워드 비율
    const fillerRatio = this.stats.totalWords > 0 ? this.stats.fillerWords / this.stats.totalWords : 0;
    if (fillerRatio < 0.05) {
      score += 50; // 5% 미만
    } else if (fillerRatio < 0.10) {
      score += 35; // 10% 미만
    } else if (fillerRatio < 0.15) {
      score += 20;
    } else {
      score += 10;
    }
    
    // 2. 적절한 WPM
    const optimalWPM = this.getOptimalWPM(language);
    const wpmDiff = Math.abs(this.wordsPerMinute - optimalWPM);
    
    if (wpmDiff < 20) {
      score += 30; // 최적 범위
    } else if (wpmDiff < 40) {
      score += 20;
    } else {
      score += 10;
    }
    
    // 3. 적절한 휴지기
    if (this.averagePauseLength >= 300 && this.averagePauseLength <= 800) {
      score += 20; // 0.3-0.8초
    } else if (this.averagePauseLength < 300 || this.averagePauseLength > 1500) {
      score += 5; // 너무 짧거나 길음
    } else {
      score += 10;
    }
    
    return score;
  }
  
  /**
   * 유창성 점수 계산
   */
  calculateFluencyScore() {
    // 기준:
    // 1. 일정한 속도 유지: 40점
    // 2. 적절한 휴지기 빈도: 30점
    // 3. 반복 적음: 30점
    
    let score = 0;
    
    // 1. 속도 일관성 (WPM 분산)
    if (this.transcriptHistory.length > 1) {
      const wpmVariance = this.calculateWPMVariance();
      if (wpmVariance < 10) {
        score += 40; // 매우 일정함
      } else if (wpmVariance < 20) {
        score += 30;
      } else if (wpmVariance < 30) {
        score += 20;
      } else {
        score += 10;
      }
    }
    
    // 2. 휴지기 빈도
    if (this.pauseFrequency >= 2 && this.pauseFrequency <= 8) {
      score += 30; // 분당 2-8회
    } else if (this.pauseFrequency < 2) {
      score += 15; // 너무 적음
    } else {
      score += 10; // 너무 많음
    }
    
    // 3. 반복 비율
    const repetitionRatio = this.stats.totalWords > 0 ? this.stats.repetitions / this.stats.totalWords : 0;
    if (repetitionRatio < 0.05) {
      score += 30;
    } else if (repetitionRatio < 0.10) {
      score += 20;
    } else {
      score += 10;
    }
    
    return score;
  }
  
  /**
   * 언어별 최적 WPM
   */
  getOptimalWPM(language) {
    const optimalWPM = {
      ko: 120, // 한국어: 120 단어/분
      en: 140, // 영어: 140 단어/분
      zh: 150  // 중국어: 150 글자/분
    };
    
    return optimalWPM[language] || 120;
  }
  
  /**
   * WPM 분산 계산
   */
  calculateWPMVariance() {
    if (this.transcriptHistory.length < 2) return 0;
    
    const wpmSamples = this.transcriptHistory.map((item, index) => {
      if (index === 0) return 0;
      
      const prevItem = this.transcriptHistory[index - 1];
      const timeDiff = (item.timestamp - prevItem.timestamp) / 1000 / 60; // 분
      
      return timeDiff > 0 ? item.wordCount / timeDiff : 0;
    }).filter(wpm => wpm > 0);
    
    if (wpmSamples.length === 0) return 0;
    
    const mean = wpmSamples.reduce((sum, wpm) => sum + wpm, 0) / wpmSamples.length;
    const variance = wpmSamples.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / wpmSamples.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * 현재 분석 결과 반환
   */
  getAnalysis() {
    return {
      wordsPerMinute: Math.round(this.wordsPerMinute),
      averagePauseLength: Math.round(this.averagePauseLength),
      pauseFrequency: Math.round(this.pauseFrequency * 10) / 10,
      clarityScore: Math.round(this.clarityScore),
      fluencyScore: Math.round(this.fluencyScore),
      stats: {
        totalWords: this.stats.totalWords,
        totalPauses: this.stats.totalPauses,
        fillerWords: this.stats.fillerWords,
        longestPause: Math.round(this.stats.longestPause),
        fillerWordRatio: Math.round((this.stats.fillerWords / this.stats.totalWords) * 100) || 0
      },
      recommendation: this.getRecommendation()
    };
  }
  
  /**
   * 추천 사항 생성
   */
  getRecommendation() {
    const recommendations = [];
    
    // WPM 체크
    if (this.wordsPerMinute < 100) {
      recommendations.push('말하기 속도가 느립니다. 조금 더 빠르게 말씀해주세요.');
    } else if (this.wordsPerMinute > 180) {
      recommendations.push('말하기 속도가 빠릅니다. 천천히 또박또박 말씀해주세요.');
    }
    
    // 휴지기 체크
    if (this.averagePauseLength < 300) {
      recommendations.push('휴지기가 짧습니다. 문장 사이에 잠시 여유를 두세요.');
    } else if (this.averagePauseLength > 1500) {
      recommendations.push('휴지기가 깁니다. 좀 더 연결되게 말씀해주세요.');
    }
    
    // 필러 워드 체크
    const fillerRatio = this.stats.totalWords > 0 ? this.stats.fillerWords / this.stats.totalWords : 0;
    if (fillerRatio > 0.1) {
      recommendations.push('"음", "어" 같은 필러 워드 사용을 줄이세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('말하기 속도와 명확성이 매우 좋습니다! 👍');
    }
    
    return recommendations.join(' ');
  }
  
  /**
   * 분석기 리셋
   */
  reset() {
    this.transcriptHistory = [];
    this.pauseHistory = [];
    this.wordTimestamps = [];
    this.stats = {
      totalWords: 0,
      totalPauses: 0,
      longestPause: 0,
      shortestPause: Infinity,
      fillerWords: 0,
      repetitions: 0
    };
    this.startTime = Date.now();
    this.lastSpeechTime = Date.now();
  }
}

// 전역 인스턴스
window.SpeechAnalyzer = SpeechAnalyzer;
