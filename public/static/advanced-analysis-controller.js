/**
 * Phase 5: 고급 분석 통합 컨트롤러
 * - 제스처 분석 (GestureAnalyzer)
 * - 음성 톤 분석 (VoiceToneAnalyzer)
 * - 말하기 분석 (SpeechAnalyzer)
 * - 답변 감정 분석 (API 호출)
 */

class AdvancedAnalysisController {
  constructor() {
    // 분석기 인스턴스
    this.gestureAnalyzer = null;
    this.voiceToneAnalyzer = null;
    this.speechAnalyzer = null;
    
    // 분석 상태
    this.isGestureEnabled = false;
    this.isVoiceToneEnabled = false;
    this.isSpeechEnabled = false;
    
    // 현재 언어
    this.language = 'ko';
    
    // 분석 결과
    this.analysisResults = {
      gesture: null,
      voiceTone: null,
      speech: null,
      sentiment: null
    };
    
    // UI 업데이트 간격
    this.updateInterval = null;
  }
  
  /**
   * 초기화
   */
  async initialize(videoElement, canvasElement, stream, language = 'ko') {
    this.language = language;
    
    console.log('[AdvancedAnalysis] 초기화 시작...');
    
    try {
      // 1. 제스처 분석기 초기화 (MediaPipe Hands)
      if (typeof GestureAnalyzer !== 'undefined') {
        this.gestureAnalyzer = new GestureAnalyzer();
        this.isGestureEnabled = await this.gestureAnalyzer.initialize(videoElement, canvasElement);
        
        if (this.isGestureEnabled) {
          console.log('✅ 제스처 분석 활성화');
        }
      }
      
      // 2. 음성 톤 분석기 초기화 (Web Audio API)
      if (typeof VoiceToneAnalyzer !== 'undefined') {
        this.voiceToneAnalyzer = new VoiceToneAnalyzer();
        this.isVoiceToneEnabled = await this.voiceToneAnalyzer.initialize(stream);
        
        if (this.isVoiceToneEnabled) {
          console.log('✅ 음성 톤 분석 활성화');
        }
      }
      
      // 3. 말하기 분석기 초기화
      if (typeof SpeechAnalyzer !== 'undefined') {
        this.speechAnalyzer = new SpeechAnalyzer();
        this.speechAnalyzer.initialize();
        this.isSpeechEnabled = true;
        console.log('✅ 말하기 분석 활성화');
      }
      
      // UI 업데이트 시작
      this.startUIUpdates();
      
      console.log('[AdvancedAnalysis] 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('[AdvancedAnalysis] 초기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 제스처 프레임 처리
   */
  async processGestureFrame(videoElement) {
    if (this.isGestureEnabled && this.gestureAnalyzer) {
      try {
        await this.gestureAnalyzer.send(videoElement);
      } catch (error) {
        console.error('[GestureAnalyzer] 프레임 처리 오류:', error);
      }
    }
  }
  
  /**
   * 텍스트 추가 (음성 인식 결과)
   */
  addTranscript(text, timestamp = Date.now()) {
    if (this.isSpeechEnabled && this.speechAnalyzer) {
      this.speechAnalyzer.addTranscript(text, timestamp, this.language);
    }
  }
  
  /**
   * UI 업데이트 시작
   */
  startUIUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.updateUI();
    }, 500); // 0.5초마다 업데이트
  }
  
  /**
   * UI 업데이트
   */
  updateUI() {
    // 제스처 분석 UI
    if (this.isGestureEnabled && this.gestureAnalyzer) {
      const gestureData = this.gestureAnalyzer.getAnalysis();
      this.updateGestureUI(gestureData);
      this.analysisResults.gesture = gestureData;
    }
    
    // 음성 톤 분석 UI
    if (this.isVoiceToneEnabled && this.voiceToneAnalyzer) {
      const voiceToneData = this.voiceToneAnalyzer.getAnalysis();
      this.updateVoiceToneUI(voiceToneData);
      this.analysisResults.voiceTone = voiceToneData;
    }
    
    // 말하기 분석 UI
    if (this.isSpeechEnabled && this.speechAnalyzer) {
      const speechData = this.speechAnalyzer.getAnalysis();
      this.updateSpeechUI(speechData);
      this.analysisResults.speech = speechData;
    }
  }
  
  /**
   * 제스처 UI 업데이트
   */
  updateGestureUI(data) {
    const container = document.getElementById('gestureAnalysis');
    if (!container) return;
    
    container.innerHTML = `
      <div class="metric-card">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-300">
            <i class="fas fa-hand-paper mr-2"></i>제스처 자연스러움
          </span>
          <span class="text-lg font-bold text-blue-400">${data.naturalness}/100</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div class="bg-blue-500 h-2 rounded-full transition-all" 
               style="width: ${data.naturalness}%"></div>
        </div>
        <div class="text-xs text-gray-400 mt-2">
          <div>빈도: ${data.gestureFrequency}회/분</div>
          <div>움직임 강도: ${data.movementIntensity}/100</div>
          <div class="mt-1 text-yellow-300">${data.recommendation}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 음성 톤 UI 업데이트
   */
  updateVoiceToneUI(data) {
    const container = document.getElementById('voiceToneAnalysis');
    if (!container) return;
    
    const stabilityScore = Math.round((data.pitchStability + data.volumeStability) / 2);
    
    container.innerHTML = `
      <div class="metric-card">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-300">
            <i class="fas fa-microphone mr-2"></i>음성 안정성
          </span>
          <span class="text-lg font-bold text-green-400">${stabilityScore}/100</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div class="bg-green-500 h-2 rounded-full transition-all" 
               style="width: ${stabilityScore}%"></div>
        </div>
        <div class="text-xs text-gray-400 mt-2">
          <div>음높이 안정성: ${data.pitchStability}/100</div>
          <div>음량 안정성: ${data.volumeStability}/100</div>
          <div>평균 음량: ${data.averageVolume}/100</div>
          <div class="mt-1 text-yellow-300">${data.recommendation}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 말하기 UI 업데이트
   */
  updateSpeechUI(data) {
    const container = document.getElementById('speechAnalysis');
    if (!container) return;
    
    const overallScore = Math.round((data.clarityScore + data.fluencyScore) / 2);
    
    container.innerHTML = `
      <div class="metric-card">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-300">
            <i class="fas fa-comments mr-2"></i>말하기 명확성
          </span>
          <span class="text-lg font-bold text-purple-400">${overallScore}/100</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div class="bg-purple-500 h-2 rounded-full transition-all" 
               style="width: ${overallScore}%"></div>
        </div>
        <div class="text-xs text-gray-400 mt-2">
          <div>WPM: ${data.wordsPerMinute}</div>
          <div>명확성: ${data.clarityScore}/100</div>
          <div>유창성: ${data.fluencyScore}/100</div>
          <div>필러 워드: ${data.stats.fillerWordRatio}%</div>
          <div class="mt-1 text-yellow-300">${data.recommendation}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 답변 감정 분석 (API 호출)
   */
  async analyzeSentiment(question, answer) {
    try {
      const response = await fetch('/api/answer-sentiment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          answer,
          language: this.language
        })
      });
      
      if (!response.ok) {
        throw new Error('Sentiment analysis failed');
      }
      
      const result = await response.json();
      this.analysisResults.sentiment = result;
      
      console.log('[AdvancedAnalysis] 답변 감정 분석 완료:', result);
      return result;
      
    } catch (error) {
      console.error('[AdvancedAnalysis] 답변 감정 분석 오류:', error);
      return null;
    }
  }
  
  /**
   * 전체 분석 결과 반환
   */
  getResults() {
    return {
      gesture: this.analysisResults.gesture,
      voiceTone: this.analysisResults.voiceTone,
      speech: this.analysisResults.speech,
      sentiment: this.analysisResults.sentiment
    };
  }
  
  /**
   * 중지
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.gestureAnalyzer) {
      this.gestureAnalyzer.stop();
    }
    
    if (this.voiceToneAnalyzer) {
      this.voiceToneAnalyzer.stop();
    }
    
    console.log('[AdvancedAnalysis] 중지됨');
  }
}

// 전역 인스턴스
window.AdvancedAnalysisController = AdvancedAnalysisController;
