/**
 * Video Recorder - MediaRecorder API 기반 면접 영상 녹화
 * - WebM 형식으로 녹화
 * - 실시간 녹화 상태 표시
 * - 청크 단위 저장 (메모리 효율)
 * - 녹화 완료 후 Blob 반환
 */

class VideoRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.isPaused = false;
    
    // 녹화 설정
    this.mimeType = 'video/webm;codecs=vp9,opus';
    this.videoBitsPerSecond = 2500000; // 2.5 Mbps
    
    // 타임스탬프 추적
    this.startTime = null;
    this.totalDuration = 0;
    
    // 이벤트 콜백
    this.onRecordingStart = null;
    this.onRecordingStop = null;
    this.onRecordingPause = null;
    this.onRecordingResume = null;
    this.onDataAvailable = null;
    this.onError = null;
  }
  
  /**
   * MediaRecorder 지원 여부 확인
   */
  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }
  
  /**
   * 지원되는 MIME 타입 확인
   */
  static getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return null;
  }
  
  /**
   * 녹화 초기화
   */
  async initialize(stream) {
    if (!VideoRecorder.isSupported()) {
      throw new Error('MediaRecorder API is not supported in this browser');
    }
    
    try {
      this.stream = stream;
      
      // 지원되는 MIME 타입 확인
      const supportedType = VideoRecorder.getSupportedMimeType();
      if (!supportedType) {
        throw new Error('No supported video MIME type found');
      }
      this.mimeType = supportedType;
      
      // MediaRecorder 생성
      const options = {
        mimeType: this.mimeType,
        videoBitsPerSecond: this.videoBitsPerSecond
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      console.log('✅ VideoRecorder 초기화 완료:', this.mimeType);
      return true;
      
    } catch (error) {
      console.error('❌ VideoRecorder 초기화 실패:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (!this.mediaRecorder) return;
    
    // 데이터 수신 (청크 단위)
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        
        if (this.onDataAvailable) {
          this.onDataAvailable(event.data, this.recordedChunks.length);
        }
      }
    };
    
    // 녹화 시작
    this.mediaRecorder.onstart = () => {
      console.log('🎬 녹화 시작');
      this.isRecording = true;
      this.startTime = Date.now();
      
      if (this.onRecordingStart) {
        this.onRecordingStart();
      }
    };
    
    // 녹화 중지
    this.mediaRecorder.onstop = () => {
      console.log('⏹️ 녹화 중지');
      this.isRecording = false;
      
      if (this.startTime) {
        this.totalDuration = Date.now() - this.startTime;
      }
      
      if (this.onRecordingStop) {
        this.onRecordingStop(this.getBlob());
      }
    };
    
    // 녹화 일시정지
    this.mediaRecorder.onpause = () => {
      console.log('⏸️ 녹화 일시정지');
      this.isPaused = true;
      
      if (this.onRecordingPause) {
        this.onRecordingPause();
      }
    };
    
    // 녹화 재개
    this.mediaRecorder.onresume = () => {
      console.log('▶️ 녹화 재개');
      this.isPaused = false;
      
      if (this.onRecordingResume) {
        this.onRecordingResume();
      }
    };
    
    // 오류 처리
    this.mediaRecorder.onerror = (error) => {
      console.error('❌ MediaRecorder 오류:', error);
      
      if (this.onError) {
        this.onError(error);
      }
    };
  }
  
  /**
   * 녹화 시작
   */
  start(timeslice = 1000) {
    if (!this.mediaRecorder) {
      throw new Error('MediaRecorder not initialized');
    }
    
    if (this.isRecording) {
      console.warn('⚠️ 이미 녹화 중입니다');
      return;
    }
    
    // 이전 데이터 초기화
    this.recordedChunks = [];
    this.totalDuration = 0;
    
    // 녹화 시작 (청크 단위로 데이터 수신)
    this.mediaRecorder.start(timeslice);
  }
  
  /**
   * 녹화 중지
   */
  stop() {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('⚠️ 녹화 중이 아닙니다');
      return null;
    }
    
    this.mediaRecorder.stop();
    return this.getBlob();
  }
  
  /**
   * 녹화 일시정지
   */
  pause() {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('⚠️ 녹화 중이 아닙니다');
      return;
    }
    
    if (this.isPaused) {
      console.warn('⚠️ 이미 일시정지 상태입니다');
      return;
    }
    
    this.mediaRecorder.pause();
  }
  
  /**
   * 녹화 재개
   */
  resume() {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('⚠️ 녹화 중이 아닙니다');
      return;
    }
    
    if (!this.isPaused) {
      console.warn('⚠️ 일시정지 상태가 아닙니다');
      return;
    }
    
    this.mediaRecorder.resume();
  }
  
  /**
   * 녹화된 영상 Blob 반환
   */
  getBlob() {
    if (this.recordedChunks.length === 0) {
      return null;
    }
    
    const blob = new Blob(this.recordedChunks, {
      type: this.mimeType
    });
    
    return blob;
  }
  
  /**
   * 녹화된 영상 URL 생성 (미리보기용)
   */
  getVideoURL() {
    const blob = this.getBlob();
    if (!blob) return null;
    
    return URL.createObjectURL(blob);
  }
  
  /**
   * 녹화된 영상 다운로드
   */
  download(filename = 'interview-recording.webm') {
    const blob = this.getBlob();
    if (!blob) {
      console.warn('⚠️ 녹화된 데이터가 없습니다');
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * 녹화 상태 반환
   */
  getState() {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.isRecording ? Date.now() - this.startTime : this.totalDuration,
      chunksCount: this.recordedChunks.length,
      mimeType: this.mimeType
    };
  }
  
  /**
   * 녹화 데이터 크기 반환 (바이트)
   */
  getSize() {
    let totalSize = 0;
    for (const chunk of this.recordedChunks) {
      totalSize += chunk.size;
    }
    return totalSize;
  }
  
  /**
   * 녹화 데이터 크기 반환 (MB)
   */
  getSizeMB() {
    return (this.getSize() / 1024 / 1024).toFixed(2);
  }
  
  /**
   * 리셋
   */
  reset() {
    this.recordedChunks = [];
    this.totalDuration = 0;
    this.startTime = null;
    this.isRecording = false;
    this.isPaused = false;
  }
  
  /**
   * 정리
   */
  destroy() {
    if (this.mediaRecorder && this.isRecording) {
      this.stop();
    }
    
    this.mediaRecorder = null;
    this.stream = null;
    this.reset();
  }
}

// 전역 인스턴스
window.VideoRecorder = VideoRecorder;
