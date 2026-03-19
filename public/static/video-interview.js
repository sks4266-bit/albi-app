/**
 * AI 영상 면접 메인 스크립트
 */

// 전역 변수
let videoAnalyzer = null;
let interviewStartTime = null;
let timerInterval = null;
let currentQuestionIndex = 0;
let recognition = null;

// 면접 질문 목록
const interviewQuestions = [
    "자기소개를 부탁드립니다.",
    "지원 동기는 무엇인가요?",
    "본인의 강점과 약점을 말씀해주세요.",
    "팀 프로젝트 경험에 대해 설명해주세요.",
    "스트레스를 어떻게 관리하시나요?",
    "5년 후 본인의 모습을 그려보세요.",
    "마지막으로 하고 싶은 말씀이 있으신가요?"
];

// DOM 요소
const startScreen = document.getElementById('startScreen');
const interviewScreen = document.getElementById('interviewScreen');
const reportScreen = document.getElementById('reportScreen');
const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const nextQuestionButton = document.getElementById('nextQuestionButton');
const retryButton = document.getElementById('retryButton');
const videoElement = document.getElementById('videoElement');
const canvasOverlay = document.getElementById('canvasOverlay');
const questionText = document.getElementById('questionText');
const transcriptText = document.getElementById('transcriptText');
const timerDisplay = document.getElementById('timerDisplay');
const recordButton = document.getElementById('recordButton');

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[VideoInterview] Initialized');
    
    // 이벤트 리스너
    startButton.addEventListener('click', startInterview);
    endButton.addEventListener('click', endInterview);
    nextQuestionButton.addEventListener('click', nextQuestion);
    retryButton.addEventListener('click', retryInterview);
    recordButton.addEventListener('click', toggleRecording);
    
    // 음성 인식 초기화
    initSpeechRecognition();
});

/**
 * 면접 시작
 */
async function startInterview() {
    console.log('[VideoInterview] Starting interview...');
    
    // 로딩 표시
    startButton.disabled = true;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>초기화 중...';
    
    try {
        // VideoAnalyzer 초기화
        videoAnalyzer = new VideoAnalyzer(videoElement, canvasOverlay);
        
        // MediaPipe 로드
        const initialized = await videoAnalyzer.initialize();
        if (!initialized) {
            throw new Error('MediaPipe 초기화 실패');
        }
        
        // 카메라 시작
        const cameraStarted = await videoAnalyzer.startCamera();
        if (!cameraStarted) {
            throw new Error('카메라 시작 실패');
        }
        
        // 캔버스 크기 설정
        canvasOverlay.width = videoElement.videoWidth || 1280;
        canvasOverlay.height = videoElement.videoHeight || 720;
        
        // 비디오 로드 대기
        await new Promise((resolve) => {
            if (videoElement.readyState >= 2) {
                resolve();
            } else {
                videoElement.addEventListener('loadeddata', resolve, { once: true });
            }
        });
        
        // 캔버스 크기 재조정
        setTimeout(() => {
            canvasOverlay.width = videoElement.videoWidth;
            canvasOverlay.height = videoElement.videoHeight;
        }, 1000);
        
        // 분석 시작
        await videoAnalyzer.startAnalysis();
        
        // 콜백 설정
        videoAnalyzer.onMetricsUpdate = updateMetrics;
        videoAnalyzer.onFeedback = showFeedback;
        
        // 화면 전환
        startScreen.classList.add('hidden');
        interviewScreen.classList.remove('hidden');
        
        // 타이머 시작
        interviewStartTime = Date.now();
        startTimer();
        
        // 첫 질문 표시
        currentQuestionIndex = 0;
        questionText.textContent = interviewQuestions[currentQuestionIndex];
        
        console.log('[VideoInterview] Interview started successfully');
    } catch (error) {
        console.error('[VideoInterview] Failed to start interview:', error);
        alert('면접을 시작할 수 없습니다. 카메라와 마이크 권한을 확인해주세요.\n\n오류: ' + error.message);
        
        // 버튼 복원
        startButton.disabled = false;
        startButton.innerHTML = '<i class="fas fa-play mr-2"></i>면접 시작하기';
    }
}

/**
 * 메트릭 업데이트
 */
function updateMetrics(metrics) {
    // 표정
    document.getElementById('emotionScore').textContent = metrics.emotionScore;
    document.getElementById('emotionBar').style.width = metrics.emotionScore + '%';
    
    const emotionLabels = {
        'happy': '😊 긍정적',
        'neutral': '😐 중립',
        'nervous': '😰 긴장',
        'speaking': '🗣️ 답변 중'
    };
    document.getElementById('emotionText').textContent = emotionLabels[metrics.emotion] || '분석 중...';
    
    // 시선
    document.getElementById('gazeScore').textContent = metrics.gazeScore;
    document.getElementById('gazeBar').style.width = metrics.gazeScore + '%';
    
    const gazeLabels = {
        'center': '✅ 카메라 응시',
        'left': '⬅️ 왼쪽',
        'right': '➡️ 오른쪽',
        'up': '⬆️ 위',
        'down': '⬇️ 아래'
    };
    document.getElementById('gazeText').textContent = gazeLabels[metrics.gazeDirection] || '분석 중...';
    
    // 자세
    document.getElementById('postureScore').textContent = metrics.postureScore;
    document.getElementById('postureBar').style.width = metrics.postureScore + '%';
    
    const postureLabels = {
        'good': '✅ 바른 자세',
        'tilted': '⚠️ 기울어짐',
        'leaning': '⚠️ 치우침',
        'fidgeting': '⚠️ 과도한 움직임'
    };
    document.getElementById('postureText').textContent = postureLabels[metrics.posture] || '분석 중...';
    
    // 종합 점수 (평균)
    const overallScore = Math.round((metrics.emotionScore + metrics.gazeScore + metrics.postureScore) / 3);
    document.getElementById('overallScore').textContent = overallScore;
    
    // 원형 프로그레스바
    const circle = document.getElementById('overallScoreCircle');
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = circumference - (overallScore / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

/**
 * 실시간 피드백 표시
 */
function showFeedback(feedback) {
    const container = document.getElementById('feedbackContainer');
    
    // 기존 토스트 제거
    const existingToast = container.querySelector('.feedback-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'feedback-toast';
    
    // 타입별 배경색
    const bgColors = {
        'success': 'bg-green-600',
        'warning': 'bg-yellow-600',
        'info': 'bg-blue-600',
        'error': 'bg-red-600'
    };
    
    toast.className += ' ' + (bgColors[feedback.type] || 'bg-gray-600');
    toast.textContent = feedback.message;
    
    container.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 타이머 시작
 */
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - interviewStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

/**
 * 타이머 중지
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * 다음 질문
 */
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= interviewQuestions.length) {
        // 마지막 질문 도달
        showFeedback({
            type: 'info',
            message: '💡 모든 질문이 끝났습니다. 면접을 종료해주세요.'
        });
        nextQuestionButton.disabled = true;
        return;
    }
    
    // 질문 업데이트
    questionText.textContent = interviewQuestions[currentQuestionIndex];
    
    // 애니메이션 효과
    questionText.style.animation = 'none';
    setTimeout(() => {
        questionText.style.animation = 'slideIn 0.3s ease-out';
    }, 10);
}

/**
 * 면접 종료
 */
async function endInterview() {
    console.log('[VideoInterview] Ending interview...');
    
    // 확인
    if (!confirm('면접을 종료하시겠습니까?\n종료 후 상세한 분석 리포트를 확인할 수 있습니다.')) {
        return;
    }
    
    // 분석 중지
    if (videoAnalyzer) {
        videoAnalyzer.stopAnalysis();
    }
    
    // 타이머 중지
    stopTimer();
    
    // 음성 인식 중지
    if (recognition) {
        recognition.stop();
    }
    
    // 리포트 생성
    const report = videoAnalyzer.generateReport();
    console.log('[VideoInterview] Report:', report);
    
    // 화면 전환
    interviewScreen.classList.add('hidden');
    reportScreen.classList.remove('hidden');
    
    // 리포트 표시
    displayReport(report);
    
    // GPT 피드백 생성
    await generateGPTFeedback(report);
    
    // 카메라 정리
    setTimeout(() => {
        if (videoAnalyzer) {
            videoAnalyzer.stopCamera();
        }
    }, 1000);
}

/**
 * 리포트 표시
 */
function displayReport(report) {
    // 종합 점수
    document.getElementById('finalScore').textContent = report.overallScore;
    
    // 등급
    let grade = '';
    if (report.overallScore >= 90) {
        grade = '🏆 탁월함 (A+)';
    } else if (report.overallScore >= 80) {
        grade = '🌟 우수함 (A)';
    } else if (report.overallScore >= 70) {
        grade = '👍 양호함 (B)';
    } else if (report.overallScore >= 60) {
        grade = '⚠️ 보통 (C)';
    } else {
        grade = '📚 개선 필요 (D)';
    }
    document.getElementById('finalGrade').textContent = grade;
    
    // 표정 리포트
    document.getElementById('emotionReportScore').textContent = 
        (report.emotions['happy'] || 0) + (report.emotions['neutral'] || 0) + '%';
    
    const emotionContent = document.getElementById('emotionReportContent');
    emotionContent.innerHTML = `
        <p class="mb-2">• 지배적 표정: ${getEmotionLabel(report.dominantEmotion)}</p>
        <div class="space-y-1">
            ${Object.keys(report.emotions).map(emotion => `
                <div class="flex justify-between">
                    <span>${getEmotionLabel(emotion)}</span>
                    <span>${report.emotions[emotion]}%</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // 시선 리포트
    document.getElementById('gazeReportScore').textContent = report.cameraFocusRate + '%';
    
    const gazeContent = document.getElementById('gazeReportContent');
    gazeContent.innerHTML = `
        <p class="mb-2">• 카메라 응시율: ${report.cameraFocusRate}%</p>
        <div class="space-y-1">
            ${Object.keys(report.gazeDirections).map(direction => `
                <div class="flex justify-between">
                    <span>${getGazeLabel(direction)}</span>
                    <span>${report.gazeDirections[direction]}%</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // 자세 리포트
    document.getElementById('postureReportScore').textContent = report.goodPostureRate + '%';
    
    const postureContent = document.getElementById('postureReportContent');
    postureContent.innerHTML = `
        <p class="mb-2">• 바른 자세 유지율: ${report.goodPostureRate}%</p>
        <div class="space-y-1">
            ${Object.keys(report.postures).map(posture => `
                <div class="flex justify-between">
                    <span>${getPostureLabel(posture)}</span>
                    <span>${report.postures[posture]}%</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * GPT 종합 피드백 생성
 */
async function generateGPTFeedback(report) {
    const feedbackElement = document.getElementById('gptFeedback');
    
    try {
        // 프롬프트 생성
        const prompt = `
당신은 전문 면접 코치입니다. 다음 AI 면접 영상 분석 결과를 바탕으로 상세한 피드백을 제공해주세요.

**분석 결과:**
- 면접 시간: ${report.duration}초
- 종합 점수: ${report.overallScore}/100

**표정 분석:**
- 지배적 표정: ${report.dominantEmotion}
- 표정 분포: ${JSON.stringify(report.emotions)}

**시선 분석:**
- 카메라 응시율: ${report.cameraFocusRate}%
- 시선 방향 분포: ${JSON.stringify(report.gazeDirections)}

**자세 분석:**
- 바른 자세 유지율: ${report.goodPostureRate}%
- 자세 분포: ${JSON.stringify(report.postures)}

**피드백 요구사항:**
1. 전반적인 면접 태도 평가 (2-3문장)
2. 잘한 점 3가지 (구체적으로)
3. 개선이 필요한 점 3가지 (구체적인 조언 포함)
4. 다음 면접을 위한 실천 가능한 팁 3가지

친근하고 격려하는 톤으로 작성해주세요.
`;

        // API 호출
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: '당신은 친절하고 전문적인 AI 면접 코치입니다. 응답은 반드시 한국어로 해주세요.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                sessionId: 'video-interview-' + Date.now(),
                userId: 'guest'
            })
        });
        
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        
        const data = await response.json();
        const feedback = data.reply || '피드백 생성 실패';
        
        // 피드백 표시
        feedbackElement.innerHTML = `<p class="text-gray-300 whitespace-pre-wrap">${feedback}</p>`;
        
    } catch (error) {
        console.error('[VideoInterview] Failed to generate GPT feedback:', error);
        feedbackElement.innerHTML = `
            <p class="text-red-400">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                AI 피드백 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.
            </p>
        `;
    }
}

/**
 * 라벨 변환 함수들
 */
function getEmotionLabel(emotion) {
    const labels = {
        'happy': '😊 긍정적',
        'neutral': '😐 중립',
        'nervous': '😰 긴장',
        'speaking': '🗣️ 답변 중'
    };
    return labels[emotion] || emotion;
}

function getGazeLabel(direction) {
    const labels = {
        'center': '📷 카메라',
        'left': '⬅️ 왼쪽',
        'right': '➡️ 오른쪽',
        'up': '⬆️ 위',
        'down': '⬇️ 아래'
    };
    return labels[direction] || direction;
}

function getPostureLabel(posture) {
    const labels = {
        'good': '✅ 바른 자세',
        'tilted': '⚠️ 기울어짐',
        'leaning': '⚠️ 치우침',
        'fidgeting': '⚠️ 움직임 과다'
    };
    return labels[posture] || posture;
}

/**
 * 음성 인식 초기화
 */
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('[VideoInterview] Speech recognition not supported');
        transcriptText.textContent = '음성 인식이 지원되지 않는 브라우저입니다';
        recordButton.disabled = true;
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
        console.log('[VideoInterview] Speech recognition started');
        recordButton.classList.remove('bg-red-500', 'hover:bg-red-600');
        recordButton.classList.add('bg-green-500', 'hover:bg-green-600');
        transcriptText.textContent = '듣고 있습니다...';
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        transcriptText.textContent = finalTranscript + interimTranscript || '듣고 있습니다...';
    };
    
    recognition.onend = () => {
        console.log('[VideoInterview] Speech recognition ended');
        recordButton.classList.remove('bg-green-500', 'hover:bg-green-600');
        recordButton.classList.add('bg-red-500', 'hover:bg-red-600');
    };
    
    recognition.onerror = (event) => {
        console.error('[VideoInterview] Speech recognition error:', event.error);
        transcriptText.textContent = '음성 인식 오류: ' + event.error;
    };
    
    transcriptText.textContent = '🎤 버튼을 눌러 음성 입력을 시작하세요';
}

/**
 * 녹음 토글
 */
function toggleRecording() {
    if (!recognition) return;
    
    if (recordButton.classList.contains('bg-red-500')) {
        // 녹음 시작
        recognition.start();
    } else {
        // 녹음 중지
        recognition.stop();
        transcriptText.textContent = transcriptText.textContent || '음성 입력이 중지되었습니다';
    }
}

/**
 * 다시 면접 보기
 */
function retryInterview() {
    // 화면 초기화
    reportScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // 버튼 복원
    startButton.disabled = false;
    startButton.innerHTML = '<i class="fas fa-play mr-2"></i>면접 시작하기';
    nextQuestionButton.disabled = false;
    
    // 변수 초기화
    currentQuestionIndex = 0;
    interviewStartTime = null;
    
    // VideoAnalyzer 정리
    if (videoAnalyzer) {
        videoAnalyzer.destroy();
        videoAnalyzer = null;
    }
    
    console.log('[VideoInterview] Reset for retry');
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (videoAnalyzer) {
        videoAnalyzer.destroy();
    }
    
    if (recognition) {
        recognition.stop();
    }
});
