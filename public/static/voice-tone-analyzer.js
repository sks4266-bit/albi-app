/**
 * 음성 톤 분석기 (Web Audio API)
 * - 음높이 (Pitch) 분석
 * - 음량 (Volume) 분석
 * - 안정성 (Stability) 측정
 * - 변화 패턴 (Variation) 분석
 */

class VoiceToneAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.mediaStreamSource = null;
    this.dataArray = null;
    this.bufferLength = null;
    
    // 분석 데이터
    this.pitchHistory = [];
    this.volumeHistory = [];
    this.analysisInterval = null;
    
    // 메트릭
    this.averagePitch = 0;
    this.averageVolume = 0;
    this.pitchStability = 0;
    this.volumeStability = 0;
    this.energyLevel = 0;
    
    // 통계
    this.stats = {
      minPitch: Infinity,
      maxPitch: -Infinity,
      minVolume: Infinity,
      maxVolume: -Infinity,
      pitchVariation: 0,
      volumeVariation: 0
    };
    
    // 시작 시간
    this.startTime = null;
  }
  
  /**
   * 초기화 및 마이크 스트림 연결
   */
  async initialize(stream) {
    try {
      // Web Audio API 컨텍스트 생성
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      // 설정
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      
      // 마이크 스트림 연결
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.analyser);
      
      // 분석 시작
      this.startTime = Date.now();
      this.startAnalysis();
      
      console.log('✅ 음성 톤 분석기 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ 음성 톤 분석기 초기화 실패:', error);
      return false;
    }
  }
  
  /**
   * 실시간 분석 시작
   */
  startAnalysis() {
    this.analysisInterval = setInterval(() => {
      this.analyze();
    }, 100); // 100ms마다 분석
  }
  
  /**
   * 음성 분석 수행
   */
  analyze() {
    // 주파수 데이터 가져오기
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // 음높이 계산
    const pitch = this.calculatePitch();
    
    // 음량 계산
    const volume = this.calculateVolume();
    
    // 히스토리 저장
    const currentTime = Date.now();
    this.pitchHistory.push({ time: currentTime, value: pitch });
    this.volumeHistory.push({ time: currentTime, value: volume });
    
    // 히스토리 정리 (최근 10초만 유지)
    this.cleanupHistory(currentTime);
    
    // 통계 업데이트
    this.updateStats(pitch, volume);
    
    // 메트릭 계산
    this.calculateMetrics();
  }
  
  /**
   * 음높이 계산 (Hz)
   */
  calculatePitch() {
    // 자기상관 함수를 사용한 피치 추정
    const sampleRate = this.audioContext.sampleRate;
    const timeData = new Float32Array(this.bufferLength);
    this.analyser.getFloatTimeDomainData(timeData);
    
    // 자기상관 계산
    const correlations = this.autoCorrelate(timeData, sampleRate);
    
    if (correlations === -1) {
      return 0; // 음성 신호 없음
    }
    
    return correlations;
  }
  
  /**
   * 자기상관 함수
   */
  autoCorrelate(buffer, sampleRate) {
    // 최소 음량 임계값
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    
    if (rms < 0.01) {
      return -1; // 음성 신호가 너무 작음
    }
    
    // 자기상관 계산
    let maxCorrelation = 0;
    let maxOffset = -1;
    const minOffset = Math.floor(sampleRate / 300); // 최대 300Hz
    const maxOffsetValue = Math.floor(sampleRate / 80); // 최소 80Hz
    
    for (let offset = minOffset; offset < maxOffsetValue; offset++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - offset; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - (correlation / (buffer.length - offset));
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        maxOffset = offset;
      }
    }
    
    if (maxCorrelation > 0.9 && maxOffset !== -1) {
      return sampleRate / maxOffset;
    }
    
    return -1;
  }
  
  /**
   * 음량 계산 (dB)
   */
  calculateVolume() {
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.bufferLength;
    
    // 0-100 스케일로 정규화
    return Math.min((average / 255) * 100, 100);
  }
  
  /**
   * 히스토리 정리 (최근 10초만 유지)
   */
  cleanupHistory(currentTime) {
    const tenSecondsAgo = currentTime - 10000;
    
    this.pitchHistory = this.pitchHistory.filter(item => item.time > tenSecondsAgo);
    this.volumeHistory = this.volumeHistory.filter(item => item.time > tenSecondsAgo);
  }
  
  /**
   * 통계 업데이트
   */
  updateStats(pitch, volume) {
    if (pitch > 0) {
      this.stats.minPitch = Math.min(this.stats.minPitch, pitch);
      this.stats.maxPitch = Math.max(this.stats.maxPitch, pitch);
    }
    
    this.stats.minVolume = Math.min(this.stats.minVolume, volume);
    this.stats.maxVolume = Math.max(this.stats.maxVolume, volume);
  }
  
  /**
   * 메트릭 계산
   */
  calculateMetrics() {
    if (this.pitchHistory.length === 0 || this.volumeHistory.length === 0) {
      return;
    }
    
    // 평균 음높이
    const validPitches = this.pitchHistory.filter(p => p.value > 0);
    if (validPitches.length > 0) {
      const pitchSum = validPitches.reduce((sum, p) => sum + p.value, 0);
      this.averagePitch = pitchSum / validPitches.length;
    }
    
    // 평균 음량
    const volumeSum = this.volumeHistory.reduce((sum, v) => sum + v.value, 0);
    this.averageVolume = volumeSum / this.volumeHistory.length;
    
    // 음높이 안정성 (변동 계수의 역수)
    if (validPitches.length > 1) {
      const pitchStdDev = this.calculateStdDev(validPitches.map(p => p.value));
      const pitchCV = pitchStdDev / this.averagePitch; // 변동 계수
      this.pitchStability = Math.max(0, 100 - (pitchCV * 1000)); // 0-100 스케일
      this.stats.pitchVariation = pitchCV * 100;
    }
    
    // 음량 안정성
    if (this.volumeHistory.length > 1) {
      const volumeStdDev = this.calculateStdDev(this.volumeHistory.map(v => v.value));
      const volumeCV = volumeStdDev / this.averageVolume;
      this.volumeStability = Math.max(0, 100 - (volumeCV * 100));
      this.stats.volumeVariation = volumeCV * 100;
    }
    
    // 에너지 레벨 (음량 + 음높이 변화)
    this.energyLevel = (this.averageVolume + (this.stats.pitchVariation / 2)) / 2;
  }
  
  /**
   * 표준편차 계산
   */
  calculateStdDev(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * 현재 분석 결과 반환
   */
  getAnalysis() {
    return {
      averagePitch: Math.round(this.averagePitch),
      averageVolume: Math.round(this.averageVolume),
      pitchStability: Math.round(this.pitchStability),
      volumeStability: Math.round(this.volumeStability),
      energyLevel: Math.round(this.energyLevel),
      stats: {
        pitchRange: {
          min: Math.round(this.stats.minPitch),
          max: Math.round(this.stats.maxPitch)
        },
        volumeRange: {
          min: Math.round(this.stats.minVolume),
          max: Math.round(this.stats.maxVolume)
        },
        pitchVariation: Math.round(this.stats.pitchVariation * 10) / 10,
        volumeVariation: Math.round(this.stats.volumeVariation * 10) / 10
      },
      recommendation: this.getRecommendation()
    };
  }
  
  /**
   * 추천 사항 생성
   */
  getRecommendation() {
    const recommendations = [];
    
    // 음량 체크
    if (this.averageVolume < 30) {
      recommendations.push('목소리가 작습니다. 조금 더 크게 말씀해주세요.');
    } else if (this.averageVolume > 80) {
      recommendations.push('목소리가 큽니다. 조금 낮춰주세요.');
    }
    
    // 음높이 안정성
    if (this.pitchStability < 60) {
      recommendations.push('음높이 변화가 큽니다. 안정적인 톤을 유지하세요.');
    }
    
    // 음량 안정성
    if (this.volumeStability < 60) {
      recommendations.push('음량 변화가 큽니다. 일정한 크기로 말씀하세요.');
    }
    
    // 에너지 레벨
    if (this.energyLevel < 40) {
      recommendations.push('좀 더 활기차게 말씀해주세요.');
    } else if (this.energyLevel > 80) {
      recommendations.push('차분하게 말씀해주세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('음성 톤이 매우 안정적입니다! 👍');
    }
    
    return recommendations.join(' ');
  }
  
  /**
   * 실시간 음성 레벨 가져오기 (시각화용)
   */
  getCurrentLevel() {
    if (!this.analyser) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    
    return (sum / this.bufferLength / 255) * 100;
  }
  
  /**
   * 분석기 중지
   */
  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// 전역 인스턴스
window.VoiceToneAnalyzer = VoiceToneAnalyzer;
