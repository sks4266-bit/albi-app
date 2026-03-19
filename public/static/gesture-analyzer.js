/**
 * 제스처 분석기 (MediaPipe Hands)
 * - 손동작 감지 및 분석
 * - 제스처 빈도 측정
 * - 자연스러움 평가
 */

class GestureAnalyzer {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    
    // 분석 데이터
    this.gestureHistory = [];
    this.handPositionHistory = [];
    this.gestureFrequency = 0;
    this.naturalness = 0;
    this.confidence = 0;
    
    // 제스처 타입
    this.gestureTypes = {
      OPEN_PALM: '손바닥 펴기',
      FIST: '주먹 쥐기',
      POINTING: '가리키기',
      THUMBS_UP: '엄지 올리기',
      PEACE: '브이(V)',
      OK: '오케이',
      NEUTRAL: '자연스러운 자세',
      EXCESSIVE: '과도한 움직임'
    };
    
    // 분석 시작 시간
    this.startTime = null;
    this.lastGestureTime = null;
    
    // 통계
    this.stats = {
      totalGestures: 0,
      gesturesByType: {},
      averageConfidence: 0,
      movementIntensity: 0,
      handsVisibleTime: 0
    };
  }
  
  /**
   * MediaPipe Hands 초기화
   */
  async initialize(videoElement, canvasElement) {
    try {
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');
      
      // MediaPipe Hands 로드
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      this.hands.onResults((results) => this.onResults(results));
      
      this.startTime = Date.now();
      
      console.log('✅ 제스처 분석기 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ 제스처 분석기 초기화 실패:', error);
      return false;
    }
  }
  
  /**
   * MediaPipe 결과 처리
   */
  onResults(results) {
    // 캔버스 지우기
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // 비디오 프레임 그리기
    this.canvasCtx.drawImage(
      results.image, 0, 0, this.canvasElement.width, this.canvasElement.height
    );
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - this.startTime) / 1000; // 초
      
      // 손 감지 시간 업데이트
      this.stats.handsVisibleTime = elapsedTime;
      
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label; // Left or Right
        
        // 손 랜드마크 그리기
        this.drawHandLandmarks(landmarks, handedness);
        
        // 제스처 분석
        const gesture = this.analyzeGesture(landmarks);
        const position = this.getHandPosition(landmarks);
        
        // 히스토리 저장
        this.gestureHistory.push({
          time: currentTime,
          gesture: gesture,
          handedness: handedness,
          confidence: results.multiHandedness[i].score
        });
        
        this.handPositionHistory.push({
          time: currentTime,
          position: position,
          handedness: handedness
        });
        
        // 통계 업데이트
        this.updateStats(gesture, results.multiHandedness[i].score);
      }
      
      // 히스토리 정리 (최근 10초만 유지)
      this.cleanupHistory(currentTime);
      
      // 제스처 빈도 및 자연스러움 계산
      this.calculateMetrics();
      
    }
    
    this.canvasCtx.restore();
  }
  
  /**
   * 손 랜드마크 그리기
   */
  drawHandLandmarks(landmarks, handedness) {
    // 손 연결선 그리기
    const connections = [
      // 엄지
      [0, 1], [1, 2], [2, 3], [3, 4],
      // 검지
      [0, 5], [5, 6], [6, 7], [7, 8],
      // 중지
      [0, 9], [9, 10], [10, 11], [11, 12],
      // 약지
      [0, 13], [13, 14], [14, 15], [15, 16],
      // 새끼
      [0, 17], [17, 18], [18, 19], [19, 20],
      // 손바닥
      [5, 9], [9, 13], [13, 17]
    ];
    
    this.canvasCtx.strokeStyle = handedness === 'Left' ? '#00FF00' : '#0000FF';
    this.canvasCtx.lineWidth = 2;
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(
        startPoint.x * this.canvasElement.width,
        startPoint.y * this.canvasElement.height
      );
      this.canvasCtx.lineTo(
        endPoint.x * this.canvasElement.width,
        endPoint.y * this.canvasElement.height
      );
      this.canvasCtx.stroke();
    });
    
    // 랜드마크 점 그리기
    landmarks.forEach((landmark) => {
      this.canvasCtx.fillStyle = '#FF0000';
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        landmark.x * this.canvasElement.width,
        landmark.y * this.canvasElement.height,
        3,
        0,
        2 * Math.PI
      );
      this.canvasCtx.fill();
    });
  }
  
  /**
   * 제스처 분석
   */
  analyzeGesture(landmarks) {
    // 손가락 펴짐 상태 확인
    const thumb = this.isFingerExtended(landmarks, 'thumb');
    const index = this.isFingerExtended(landmarks, 'index');
    const middle = this.isFingerExtended(landmarks, 'middle');
    const ring = this.isFingerExtended(landmarks, 'ring');
    const pinky = this.isFingerExtended(landmarks, 'pinky');
    
    const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;
    
    // 제스처 패턴 인식
    if (extendedCount === 5) {
      return this.gestureTypes.OPEN_PALM;
    } else if (extendedCount === 0) {
      return this.gestureTypes.FIST;
    } else if (index && !middle && !ring && !pinky) {
      return this.gestureTypes.POINTING;
    } else if (thumb && !index && !middle && !ring && !pinky) {
      return this.gestureTypes.THUMBS_UP;
    } else if (index && middle && !ring && !pinky) {
      return this.gestureTypes.PEACE;
    } else if (thumb && index && this.isOKGesture(landmarks)) {
      return this.gestureTypes.OK;
    } else if (extendedCount >= 3) {
      return this.gestureTypes.NEUTRAL;
    } else {
      return this.gestureTypes.NEUTRAL;
    }
  }
  
  /**
   * 손가락이 펴져있는지 확인
   */
  isFingerExtended(landmarks, finger) {
    const fingerTipIndices = {
      thumb: 4,
      index: 8,
      middle: 12,
      ring: 16,
      pinky: 20
    };
    
    const fingerPIPIndices = {
      thumb: 3,
      index: 6,
      middle: 10,
      ring: 14,
      pinky: 18
    };
    
    const tipIndex = fingerTipIndices[finger];
    const pipIndex = fingerPIPIndices[finger];
    
    if (finger === 'thumb') {
      // 엄지는 x 좌표로 판단
      return Math.abs(landmarks[tipIndex].x - landmarks[pipIndex].x) > 0.05;
    } else {
      // 나머지 손가락은 y 좌표로 판단 (위쪽이 작은 값)
      return landmarks[tipIndex].y < landmarks[pipIndex].y - 0.03;
    }
  }
  
  /**
   * OK 제스처 확인
   */
  isOKGesture(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    
    return distance < 0.05; // 엄지와 검지가 가까우면 OK
  }
  
  /**
   * 손 위치 계산
   */
  getHandPosition(landmarks) {
    // 손목 (landmark 0)을 기준으로 위치 계산
    const wrist = landmarks[0];
    
    return {
      x: wrist.x,
      y: wrist.y,
      z: wrist.z
    };
  }
  
  /**
   * 통계 업데이트
   */
  updateStats(gesture, confidence) {
    this.stats.totalGestures++;
    
    if (!this.stats.gesturesByType[gesture]) {
      this.stats.gesturesByType[gesture] = 0;
    }
    this.stats.gesturesByType[gesture]++;
    
    // 평균 신뢰도 업데이트
    const totalConfidence = this.stats.averageConfidence * (this.stats.totalGestures - 1) + confidence;
    this.stats.averageConfidence = totalConfidence / this.stats.totalGestures;
  }
  
  /**
   * 히스토리 정리 (최근 10초만 유지)
   */
  cleanupHistory(currentTime) {
    const tenSecondsAgo = currentTime - 10000;
    
    this.gestureHistory = this.gestureHistory.filter(item => item.time > tenSecondsAgo);
    this.handPositionHistory = this.handPositionHistory.filter(item => item.time > tenSecondsAgo);
  }
  
  /**
   * 메트릭 계산
   */
  calculateMetrics() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.startTime) / 1000; // 초
    
    if (elapsedTime === 0) return;
    
    // 제스처 빈도: 분당 제스처 변화 횟수
    const gestureChanges = this.countGestureChanges();
    this.gestureFrequency = (gestureChanges / elapsedTime) * 60; // 분당
    
    // 움직임 강도: 손 이동 속도
    this.stats.movementIntensity = this.calculateMovementIntensity();
    
    // 자연스러움: 과도한 움직임이 없고, 적절한 제스처 사용
    this.naturalness = this.calculateNaturalness();
    
    // 신뢰도
    this.confidence = this.stats.averageConfidence * 100;
  }
  
  /**
   * 제스처 변화 횟수 계산
   */
  countGestureChanges() {
    let changes = 0;
    for (let i = 1; i < this.gestureHistory.length; i++) {
      if (this.gestureHistory[i].gesture !== this.gestureHistory[i - 1].gesture) {
        changes++;
      }
    }
    return changes;
  }
  
  /**
   * 움직임 강도 계산
   */
  calculateMovementIntensity() {
    if (this.handPositionHistory.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < this.handPositionHistory.length; i++) {
      const prev = this.handPositionHistory[i - 1].position;
      const curr = this.handPositionHistory[i].position;
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) +
        Math.pow(curr.y - prev.y, 2) +
        Math.pow(curr.z - prev.z, 2)
      );
      
      totalDistance += distance;
    }
    
    // 평균 이동 거리 (0-100 스케일)
    const avgDistance = totalDistance / this.handPositionHistory.length;
    return Math.min(avgDistance * 1000, 100);
  }
  
  /**
   * 자연스러움 계산
   */
  calculateNaturalness() {
    // 기준:
    // 1. 적절한 제스처 빈도 (5-15회/분): 50점
    // 2. 과도한 움직임 없음 (강도 < 50): 30점
    // 3. 높은 신뢰도 (> 80%): 20점
    
    let score = 0;
    
    // 1. 제스처 빈도
    if (this.gestureFrequency >= 5 && this.gestureFrequency <= 15) {
      score += 50;
    } else if (this.gestureFrequency < 5) {
      score += 30; // 약간 부족
    } else if (this.gestureFrequency > 20) {
      score += 20; // 너무 많음
    }
    
    // 2. 움직임 강도
    if (this.stats.movementIntensity < 50) {
      score += 30;
    } else if (this.stats.movementIntensity < 70) {
      score += 20;
    } else {
      score += 10;
    }
    
    // 3. 신뢰도
    if (this.confidence > 80) {
      score += 20;
    } else if (this.confidence > 60) {
      score += 15;
    } else {
      score += 10;
    }
    
    return score;
  }
  
  /**
   * 비디오 프레임 전송 (MediaPipe 처리)
   */
  async send(videoElement) {
    if (this.hands) {
      await this.hands.send({ image: videoElement });
    }
  }
  
  /**
   * 현재 분석 결과 반환
   */
  getAnalysis() {
    return {
      gestureFrequency: Math.round(this.gestureFrequency * 10) / 10,
      movementIntensity: Math.round(this.stats.movementIntensity),
      naturalness: Math.round(this.naturalness),
      confidence: Math.round(this.confidence),
      stats: {
        totalGestures: this.stats.totalGestures,
        gesturesByType: this.stats.gesturesByType,
        handsVisibleTime: Math.round(this.stats.handsVisibleTime)
      },
      recommendation: this.getRecommendation()
    };
  }
  
  /**
   * 추천 사항 생성
   */
  getRecommendation() {
    const recommendations = [];
    
    if (this.gestureFrequency < 5) {
      recommendations.push('제스처를 조금 더 사용해보세요.');
    } else if (this.gestureFrequency > 20) {
      recommendations.push('제스처 사용을 줄이고 차분하게 말씀하세요.');
    }
    
    if (this.stats.movementIntensity > 70) {
      recommendations.push('손 움직임을 줄이고 안정적으로 유지하세요.');
    }
    
    if (this.naturalness < 60) {
      recommendations.push('자연스럽고 편안한 자세를 유지하세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('제스처 사용이 매우 자연스럽습니다! 👍');
    }
    
    return recommendations.join(' ');
  }
  
  /**
   * 분석기 중지
   */
  stop() {
    if (this.hands) {
      this.hands.close();
    }
  }
}

// 전역 인스턴스
window.GestureAnalyzer = GestureAnalyzer;
