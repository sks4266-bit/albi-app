/**
 * AI 면접 영상 분석 시스템
 * MediaPipe Face Mesh + Pose Detection
 * 표정, 시선, 자세 실시간 분석
 */

class VideoAnalyzer {
    constructor(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        
        // 분석 상태
        this.isAnalyzing = false;
        this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
        this.isIOS = /iPhone|iPad/i.test(navigator.userAgent);
        
        // MediaPipe 인스턴스
        this.faceMesh = null;
        this.pose = null;
        
        // 분석 결과 누적
        this.analysisHistory = {
            emotions: [],      // 표정 이력
            gazeDirections: [], // 시선 이력
            postures: [],      // 자세 이력
            timestamps: []     // 타임스탬프
        };
        
        // 실시간 메트릭
        this.currentMetrics = {
            emotion: 'neutral',
            emotionScore: 0,
            gazeDirection: 'center',
            gazeScore: 100,
            posture: 'good',
            postureScore: 100,
            shoulderAngle: 0,
            headTilt: 0
        };
        
        // 콜백
        this.onMetricsUpdate = null;
        this.onFeedback = null;
        
        // 성능 설정
        this.targetFPS = this.isMobile ? 10 : 20;
        this.lastAnalysisTime = 0;
        this.analysisInterval = 1000 / this.targetFPS;
    }

    /**
     * MediaPipe 초기화
     */
    async initialize() {
        console.log('[VideoAnalyzer] Initializing MediaPipe...');
        
        try {
            // Face Mesh 로드
            await this.initializeFaceMesh();
            
            // Pose Detection 로드
            await this.initializePose();
            
            console.log('[VideoAnalyzer] MediaPipe initialized successfully');
            return true;
        } catch (error) {
            console.error('[VideoAnalyzer] Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Face Mesh 초기화
     */
    async initializeFaceMesh() {
        // MediaPipe Face Mesh CDN에서 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
        
        // Camera Utils 로드
        const cameraScript = document.createElement('script');
        cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        document.head.appendChild(cameraScript);
        
        await new Promise((resolve, reject) => {
            cameraScript.onload = resolve;
            cameraScript.onerror = reject;
        });
        
        // Drawing Utils 로드
        const drawingScript = document.createElement('script');
        drawingScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
        document.head.appendChild(drawingScript);
        
        await new Promise((resolve, reject) => {
            drawingScript.onload = resolve;
            drawingScript.onerror = reject;
        });
        
        // Face Mesh 생성
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        // 설정 (모바일 최적화)
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: !this.isMobile,
            minDetectionConfidence: this.isMobile ? 0.6 : 0.7,
            minTrackingConfidence: this.isMobile ? 0.6 : 0.7
        });
        
        // 결과 처리
        this.faceMesh.onResults((results) => this.onFaceResults(results));
    }

    /**
     * Pose Detection 초기화
     */
    async initializePose() {
        // MediaPipe Pose CDN에서 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
        
        // Pose 생성
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        // 설정 (모바일 최적화)
        this.pose.setOptions({
            modelComplexity: this.isMobile ? 0 : 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        // 결과 처리
        this.pose.onResults((results) => this.onPoseResults(results));
    }

    /**
     * 카메라 시작
     */
    async startCamera() {
        try {
            console.log('[VideoAnalyzer] Requesting camera access...');
            
            // 카메라 권한 확인
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            console.log('[VideoAnalyzer] Camera permission status:', permissionStatus.state);
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: this.isMobile ? 640 : 1280 },
                    height: { ideal: this.isMobile ? 480 : 720 }
                },
                audio: false
            });
            
            this.videoElement.srcObject = stream;
            
            // iOS Safari 대응
            if (this.isIOS) {
                this.videoElement.setAttribute('playsinline', true);
                this.videoElement.setAttribute('autoplay', true);
                this.videoElement.muted = true;
            }
            
            await this.videoElement.play();
            
            console.log('[VideoAnalyzer] Camera started successfully');
            return true;
        } catch (error) {
            console.error('[VideoAnalyzer] Failed to start camera:', error);
            
            // 사용자에게 친화적인 에러 메시지 표시
            let errorMessage = '카메라 시작 실패';
            if (error.name === 'NotAllowedError') {
                errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 접근을 허용해주세요.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '카메라가 다른 응용 프로그램에서 사용 중일 수 있습니다.';
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * 분석 시작
     */
    async startAnalysis() {
        if (!this.faceMesh || !this.pose) {
            console.error('[VideoAnalyzer] MediaPipe not initialized');
            return false;
        }
        
        this.isAnalyzing = true;
        console.log('[VideoAnalyzer] Analysis started');
        
        // 분석 루프
        this.analyzeFrame();
        
        return true;
    }

    /**
     * 프레임 분석
     */
    async analyzeFrame() {
        if (!this.isAnalyzing) return;
        
        const now = performance.now();
        
        // FPS 제어
        if (now - this.lastAnalysisTime >= this.analysisInterval) {
            this.lastAnalysisTime = now;
            
            try {
                // Face Mesh 분석
                await this.faceMesh.send({ image: this.videoElement });
                
                // Pose 분석
                await this.pose.send({ image: this.videoElement });
            } catch (error) {
                console.warn('[VideoAnalyzer] Analysis frame error:', error);
            }
        }
        
        // 다음 프레임
        requestAnimationFrame(() => this.analyzeFrame());
    }

    /**
     * Face Mesh 결과 처리
     */
    onFaceResults(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            return;
        }
        
        const landmarks = results.multiFaceLandmarks[0];
        
        // 캔버스 초기화
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // 랜드마크 그리기 (선택사항)
        if (window.drawConnectors && window.FACEMESH_TESSELATION) {
            drawConnectors(this.ctx, landmarks, FACEMESH_TESSELATION, {
                color: '#C0C0C070',
                lineWidth: 1
            });
        }
        
        this.ctx.restore();
        
        // 표정 분석
        const emotion = this.analyzeEmotion(landmarks);
        this.currentMetrics.emotion = emotion.type;
        this.currentMetrics.emotionScore = emotion.score;
        
        // 시선 분석
        const gaze = this.analyzeGaze(landmarks);
        this.currentMetrics.gazeDirection = gaze.direction;
        this.currentMetrics.gazeScore = gaze.score;
        this.currentMetrics.headTilt = gaze.headTilt;
        
        // 이력 저장
        this.analysisHistory.emotions.push(emotion.type);
        this.analysisHistory.gazeDirections.push(gaze.direction);
        this.analysisHistory.timestamps.push(Date.now());
        
        // 최근 100개만 유지
        if (this.analysisHistory.emotions.length > 100) {
            this.analysisHistory.emotions.shift();
            this.analysisHistory.gazeDirections.shift();
            this.analysisHistory.timestamps.shift();
        }
        
        // 메트릭 업데이트 콜백
        if (this.onMetricsUpdate) {
            this.onMetricsUpdate(this.currentMetrics);
        }
        
        // 실시간 피드백 생성
        this.generateRealtimeFeedback();
    }

    /**
     * Pose 결과 처리
     */
    onPoseResults(results) {
        if (!results.poseLandmarks) {
            return;
        }
        
        const landmarks = results.poseLandmarks;
        
        // 자세 분석
        const posture = this.analyzePosture(landmarks);
        this.currentMetrics.posture = posture.type;
        this.currentMetrics.postureScore = posture.score;
        this.currentMetrics.shoulderAngle = posture.shoulderAngle;
        
        // 이력 저장
        this.analysisHistory.postures.push(posture.type);
        
        // 최근 100개만 유지
        if (this.analysisHistory.postures.length > 100) {
            this.analysisHistory.postures.shift();
        }
    }

    /**
     * 표정 분석
     */
    analyzeEmotion(landmarks) {
        // 입 벌림 정도 (랜드마크 13: 윗입술, 14: 아랫입술)
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        const mouthOpenness = Math.abs(upperLip.y - lowerLip.y);
        
        // 입꼬리 위치 (랜드마크 61: 왼쪽 입꼬리, 291: 오른쪽 입꼬리)
        const leftMouth = landmarks[61];
        const rightMouth = landmarks[291];
        const mouthCenter = landmarks[13];
        
        // 미소 감지 (입꼬리가 올라가면)
        const smileScore = ((leftMouth.y + rightMouth.y) / 2 - mouthCenter.y) * 100;
        
        // 눈썹 위치 (랜드마크 70: 왼쪽 눈썹, 300: 오른쪽 눈썹)
        const leftEyebrow = landmarks[70];
        const rightEyebrow = landmarks[300];
        const eyebrowHeight = (leftEyebrow.y + rightEyebrow.y) / 2;
        
        // 감정 판단
        let emotionType = 'neutral';
        let emotionScore = 50;
        
        if (smileScore > 0.01) {
            emotionType = 'happy';
            emotionScore = Math.min(100, 50 + smileScore * 500);
        } else if (eyebrowHeight < 0.3 && mouthOpenness < 0.02) {
            emotionType = 'nervous';
            emotionScore = Math.max(0, 50 - eyebrowHeight * 100);
        } else if (mouthOpenness > 0.05) {
            emotionType = 'speaking';
            emotionScore = 70;
        }
        
        return {
            type: emotionType,
            score: Math.round(emotionScore)
        };
    }

    /**
     * 시선 분석
     */
    analyzeGaze(landmarks) {
        // 눈동자 위치 (랜드마크 468: 왼쪽 눈동자, 473: 오른쪽 눈동자)
        const leftPupil = landmarks[468];
        const rightPupil = landmarks[473];
        
        // 눈 중심 (랜드마크 33: 왼쪽 눈 중심, 263: 오른쪽 눈 중심)
        const leftEyeCenter = landmarks[33];
        const rightEyeCenter = landmarks[263];
        
        // 얼굴 중심 (랜드마크 1: 코 끝)
        const noseTip = landmarks[1];
        
        // 시선 방향 계산
        const gazeX = ((leftPupil.x - leftEyeCenter.x) + (rightPupil.x - rightEyeCenter.x)) / 2;
        const gazeY = ((leftPupil.y - leftEyeCenter.y) + (rightPupil.y - rightEyeCenter.y)) / 2;
        
        // 머리 기울기 계산 (랜드마크 234: 왼쪽 관자놀이, 454: 오른쪽 관자놀이)
        const leftTemple = landmarks[234];
        const rightTemple = landmarks[454];
        const headTilt = Math.atan2(rightTemple.y - leftTemple.y, rightTemple.x - leftTemple.x) * 180 / Math.PI;
        
        // 방향 판단
        let direction = 'center';
        let score = 100;
        
        if (Math.abs(gazeX) < 0.02 && Math.abs(gazeY) < 0.02) {
            direction = 'center';
            score = 100;
        } else if (gazeX > 0.02) {
            direction = 'right';
            score = Math.max(0, 100 - Math.abs(gazeX) * 1000);
        } else if (gazeX < -0.02) {
            direction = 'left';
            score = Math.max(0, 100 - Math.abs(gazeX) * 1000);
        } else if (gazeY > 0.02) {
            direction = 'down';
            score = Math.max(0, 100 - Math.abs(gazeY) * 1000);
        } else if (gazeY < -0.02) {
            direction = 'up';
            score = Math.max(0, 100 - Math.abs(gazeY) * 1000);
        }
        
        return {
            direction,
            score: Math.round(score),
            headTilt: Math.round(headTilt)
        };
    }

    /**
     * 자세 분석
     */
    analyzePosture(landmarks) {
        // 어깨 랜드마크 (11: 왼쪽 어깨, 12: 오른쪽 어깨)
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        
        // 코 랜드마크 (0: 코)
        const nose = landmarks[0];
        
        // 어깨 기울기 계산
        const shoulderAngle = Math.atan2(
            rightShoulder.y - leftShoulder.y,
            rightShoulder.x - leftShoulder.x
        ) * 180 / Math.PI;
        
        // 상체 중심 계산
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const bodyAlignment = Math.abs(nose.x - shoulderCenterX);
        
        // 자세 판단
        let postureType = 'good';
        let postureScore = 100;
        
        if (Math.abs(shoulderAngle) > 10) {
            postureType = 'tilted';
            postureScore = Math.max(0, 100 - Math.abs(shoulderAngle) * 5);
        } else if (bodyAlignment > 0.1) {
            postureType = 'leaning';
            postureScore = Math.max(0, 100 - bodyAlignment * 500);
        }
        
        // 과도한 움직임 감지
        if (this.analysisHistory.postures.length > 10) {
            const recentPostures = this.analysisHistory.postures.slice(-10);
            const changes = recentPostures.filter((p, i) => i > 0 && p !== recentPostures[i - 1]).length;
            
            if (changes > 5) {
                postureType = 'fidgeting';
                postureScore = Math.max(0, postureScore - 20);
            }
        }
        
        return {
            type: postureType,
            score: Math.round(postureScore),
            shoulderAngle: Math.round(shoulderAngle)
        };
    }

    /**
     * 실시간 피드백 생성
     */
    generateRealtimeFeedback() {
        const feedback = [];
        
        // 시선 피드백
        if (this.currentMetrics.gazeScore < 70) {
            if (this.currentMetrics.gazeDirection === 'down') {
                feedback.push({
                    type: 'warning',
                    message: '💡 시선을 카메라로 향해주세요'
                });
            } else if (this.currentMetrics.gazeDirection === 'left' || this.currentMetrics.gazeDirection === 'right') {
                feedback.push({
                    type: 'warning',
                    message: '💡 정면을 응시해주세요'
                });
            }
        }
        
        // 자세 피드백
        if (this.currentMetrics.postureScore < 70) {
            if (this.currentMetrics.posture === 'tilted') {
                feedback.push({
                    type: 'warning',
                    message: '💡 어깨를 평평하게 유지해주세요'
                });
            } else if (this.currentMetrics.posture === 'leaning') {
                feedback.push({
                    type: 'warning',
                    message: '💡 화면 중앙에 위치해주세요'
                });
            } else if (this.currentMetrics.posture === 'fidgeting') {
                feedback.push({
                    type: 'info',
                    message: '💡 안정적인 자세를 유지해주세요'
                });
            }
        }
        
        // 표정 피드백
        if (this.currentMetrics.emotion === 'nervous') {
            feedback.push({
                type: 'info',
                message: '😊 긴장을 풀고 미소를 지어보세요'
            });
        } else if (this.currentMetrics.emotion === 'happy') {
            feedback.push({
                type: 'success',
                message: '👍 좋은 표정입니다!'
            });
        }
        
        // 피드백 콜백
        if (feedback.length > 0 && this.onFeedback) {
            this.onFeedback(feedback[0]); // 가장 중요한 피드백 하나만
        }
    }

    /**
     * 종합 리포트 생성
     */
    generateReport() {
        const report = {
            duration: Math.round((Date.now() - this.analysisHistory.timestamps[0]) / 1000),
            totalFrames: this.analysisHistory.emotions.length,
            
            // 표정 통계
            emotions: this.calculateDistribution(this.analysisHistory.emotions),
            dominantEmotion: this.getMostFrequent(this.analysisHistory.emotions),
            
            // 시선 통계
            gazeDirections: this.calculateDistribution(this.analysisHistory.gazeDirections),
            cameraFocusRate: Math.round(
                (this.analysisHistory.gazeDirections.filter(d => d === 'center').length / 
                this.analysisHistory.gazeDirections.length) * 100
            ),
            
            // 자세 통계
            postures: this.calculateDistribution(this.analysisHistory.postures),
            goodPostureRate: Math.round(
                (this.analysisHistory.postures.filter(p => p === 'good').length / 
                this.analysisHistory.postures.length) * 100
            ),
            
            // 종합 점수
            overallScore: this.calculateOverallScore()
        };
        
        return report;
    }

    /**
     * 분포 계산
     */
    calculateDistribution(array) {
        const distribution = {};
        array.forEach(item => {
            distribution[item] = (distribution[item] || 0) + 1;
        });
        
        // 백분율로 변환
        const total = array.length;
        Object.keys(distribution).forEach(key => {
            distribution[key] = Math.round((distribution[key] / total) * 100);
        });
        
        return distribution;
    }

    /**
     * 최빈값 찾기
     */
    getMostFrequent(array) {
        const distribution = {};
        array.forEach(item => {
            distribution[item] = (distribution[item] || 0) + 1;
        });
        
        let maxCount = 0;
        let mostFrequent = null;
        
        Object.keys(distribution).forEach(key => {
            if (distribution[key] > maxCount) {
                maxCount = distribution[key];
                mostFrequent = key;
            }
        });
        
        return mostFrequent;
    }

    /**
     * 종합 점수 계산
     */
    calculateOverallScore() {
        const cameraFocusRate = (this.analysisHistory.gazeDirections.filter(d => d === 'center').length / 
                                 this.analysisHistory.gazeDirections.length) * 100;
        
        const goodPostureRate = (this.analysisHistory.postures.filter(p => p === 'good').length / 
                                 this.analysisHistory.postures.length) * 100;
        
        const positiveEmotionRate = (this.analysisHistory.emotions.filter(e => e === 'happy' || e === 'neutral').length / 
                                     this.analysisHistory.emotions.length) * 100;
        
        // 가중 평균 (시선 40%, 자세 40%, 표정 20%)
        const score = (cameraFocusRate * 0.4) + (goodPostureRate * 0.4) + (positiveEmotionRate * 0.2);
        
        return Math.round(score);
    }

    /**
     * 분석 중지
     */
    stopAnalysis() {
        this.isAnalyzing = false;
        console.log('[VideoAnalyzer] Analysis stopped');
    }

    /**
     * 카메라 중지
     */
    stopCamera() {
        if (this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
        console.log('[VideoAnalyzer] Camera stopped');
    }

    /**
     * 정리
     */
    destroy() {
        this.stopAnalysis();
        this.stopCamera();
        
        if (this.faceMesh) {
            this.faceMesh.close();
        }
        
        if (this.pose) {
            this.pose.close();
        }
        
        console.log('[VideoAnalyzer] Destroyed');
    }
}

// 전역으로 export
if (typeof window !== 'undefined') {
    window.VideoAnalyzer = VideoAnalyzer;
}
