/**
 * AI 영상 면접 - 개인화 버전
 * 사용자 프로필 기반 맞춤 질문, TTS 음성, 종합 평가
 */

// 전역 변수
let videoAnalyzer = null;
let interviewStartTime = null;
let timerInterval = null;
let currentQuestionIndex = 0;
let recognition = null;
let currentAudio = null;
let interviewData = null;
let answers = [];
let isRecording = false;
let currentAnswer = '';

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
const interviewerImage = document.getElementById('interviewerImage');
const interviewerName = document.getElementById('interviewerName');
const companyName = document.getElementById('companyName');
const positionName = document.getElementById('positionName');

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[VideoInterviewEnhanced] Initialized');
    
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
 * 음성 인식 초기화 - 다국어 지원
 */
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // 언어 설정 (i18n에서 가져오기)
        const speechLang = window.i18n ? window.i18n.getSpeechLang() : 'ko-KR';
        recognition.lang = speechLang;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }
            
            if (final) {
                currentAnswer += final;
            }
            
            const placeholder = window.i18n ? window.i18n.t('interview.answerPlaceholder') : '답변을 시작하세요...';
            transcriptText.textContent = currentAnswer + interim || placeholder;
        };
        
        recognition.onerror = (event) => {
            console.error('[SpeechRecognition] Error:', event.error);
            const errorMsg = window.i18n ? window.i18n.t('common.error') : '음성 인식 오류가 발생했습니다.';
            transcriptText.textContent = errorMsg;
        };
        
        console.log('[SpeechRecognition] Initialized with language:', speechLang);
    } else {
        console.warn('[SpeechRecognition] Not supported');
        transcriptText.textContent = '음성 인식을 지원하지 않는 브라우저입니다.';
    }
}

/**
 * 사용자 이메일 가져오기 (localStorage 또는 URL 파라미터)
 */
function getUserEmail() {
    // URL 파라미터에서 이메일 확인
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
        localStorage.setItem('userEmail', emailParam);
        return emailParam;
    }
    
    // localStorage에서 이메일 확인
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
        return storedEmail;
    }
    
    // 기본 테스트 이메일
    return 'test@example.com';
}

/**
 * 개인화 면접 데이터 로드
 */
async function loadInterviewData() {
    const email = getUserEmail();
    
    try {
        showToast('개인화 면접 준비 중...', 'info');
        
        const response = await fetch('/api/interview-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            throw new Error('면접 데이터 로드 실패');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '면접 데이터 로드 실패');
        }
        
        interviewData = result.data;
        
        // UI 업데이트
        companyName.textContent = interviewData.selectedCompany.name;
        positionName.textContent = interviewData.selectedCompany.position;
        
        console.log('[VideoInterviewEnhanced] Interview data loaded:', interviewData);
        showToast(`${interviewData.selectedCompany.name} 맞춤 면접이 준비되었습니다!`, 'success');
        
        return true;
    } catch (error) {
        console.error('[VideoInterviewEnhanced] Load error:', error);
        showToast('면접 데이터 로드 실패. 기본 면접으로 진행합니다.', 'error');
        
        // 기본 면접 데이터
        interviewData = {
            selectedCompany: {
                name: '일반 기업',
                position: '일반 직무',
                keyRequirements: ['기본 역량']
            },
            questions: [
                "자기소개를 1분 이내로 부탁드립니다.",
                "지원 동기는 무엇인가요?",
                "본인의 강점과 약점을 말씀해주세요.",
                "팀 프로젝트 경험에 대해 설명해주세요.",
                "스트레스를 어떻게 관리하시나요?",
                "5년 후 본인의 모습을 그려보세요.",
                "마지막으로 하고 싶은 말씀이 있으신가요?"
            ]
        };
        
        return false;
    }
}

/**
 * TTS 음성 재생
 */
async function playInterviewerVoice(text) {
    try {
        // 기존 오디오 정지
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        // TTS API 호출
        const response = await fetch('/api/interviewer-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            throw new Error('TTS API 오류');
        }
        
        const result = await response.json();
        
        if (!result.success || !result.audio) {
            throw new Error('음성 생성 실패');
        }
        
        // 오디오 재생
        currentAudio = new Audio(result.audio);
        currentAudio.play();
        
        console.log('[TTS] Playing voice for:', text.substring(0, 50) + '...');
        
    } catch (error) {
        console.error('[TTS] Error:', error);
        // TTS 실패 시에도 면접 진행
    }
}

/**
 * 면접 시작
 */
async function startInterview() {
    console.log('[VideoInterviewEnhanced] Starting interview...');
    
    // 로딩 표시
    startButton.disabled = true;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>준비 중...';
    
    try {
        // 1. 개인화 면접 데이터 로드
        await loadInterviewData();
        
        // 2. VideoAnalyzer 초기화
        videoAnalyzer = new VideoAnalyzer(videoElement, canvasOverlay);
        
        // MediaPipe 로드
        const initialized = await videoAnalyzer.initialize();
        if (!initialized) {
            throw new Error('MediaPipe 초기화 실패');
        }
        
        // 3. 카메라 시작
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
        
        // 4. 분석 시작
        videoAnalyzer.startAnalysis((metrics) => {
            updateMetricsUI(metrics);
        });
        
        // 5. 화면 전환
        startScreen.classList.add('hidden');
        interviewScreen.classList.remove('hidden');
        
        // 6. 면접 시작
        interviewStartTime = Date.now();
        startTimer();
        
        // 7. 첫 질문 표시
        displayQuestion(0);
        
        // 8. 음성 인식 시작
        if (recognition) {
            recognition.start();
        }
        
        showToast('면접이 시작되었습니다!', 'success');
        
    } catch (error) {
        console.error('[VideoInterviewEnhanced] Start error:', error);
        startButton.disabled = false;
        startButton.innerHTML = '<i class="fas fa-play mr-2"></i>면접 시작하기';
        showToast(`오류 발생: ${error.message}`, 'error');
    }
}

/**
 * 질문 표시 및 TTS 재생
 */
function displayQuestion(index) {
    if (!interviewData || !interviewData.questions) {
        console.error('[VideoInterviewEnhanced] No interview data');
        return;
    }
    
    currentQuestionIndex = index;
    const question = interviewData.questions[index];
    
    // UI 업데이트
    questionText.textContent = question;
    
    // TTS 음성 재생
    playInterviewerVoice(question);
    
    // 답변 초기화
    currentAnswer = '';
    transcriptText.textContent = '답변을 시작하세요...';
    
    console.log(`[VideoInterviewEnhanced] Question ${index + 1}/${interviewData.questions.length}: ${question}`);
}

/**
 * 다음 질문
 */
function nextQuestion() {
    // 현재 답변 저장
    if (currentAnswer.trim()) {
        answers.push({
            question: interviewData.questions[currentQuestionIndex],
            answer: currentAnswer.trim(),
            duration: Math.floor((Date.now() - interviewStartTime) / 1000),
            wordCount: currentAnswer.trim().split(/\s+/).length,
            keywords: extractKeywords(currentAnswer)
        });
    }
    
    // 다음 질문으로 이동
    if (currentQuestionIndex < interviewData.questions.length - 1) {
        displayQuestion(currentQuestionIndex + 1);
    } else {
        // 모든 질문 완료
        showToast('모든 질문이 완료되었습니다. 면접을 종료해주세요.', 'success');
        nextQuestionButton.disabled = true;
    }
}

/**
 * 키워드 추출 (간단한 버전)
 */
function extractKeywords(text) {
    const words = text.split(/\s+/);
    const filtered = words.filter(w => w.length > 2);
    return [...new Set(filtered)].slice(0, 10);
}

/**
 * 녹음 토글
 */
function toggleRecording() {
    if (!recognition) return;
    
    isRecording = !isRecording;
    
    if (isRecording) {
        recordButton.classList.add('bg-green-500');
        recordButton.classList.remove('bg-red-500');
        showToast('음성 인식이 시작되었습니다.', 'info');
    } else {
        recordButton.classList.remove('bg-green-500');
        recordButton.classList.add('bg-red-500');
        showToast('음성 인식이 일시 중지되었습니다.', 'info');
    }
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
 * 메트릭 UI 업데이트
 */
function updateMetricsUI(metrics) {
    // 표정
    const emotionScore = Math.round(metrics.emotion.score);
    document.getElementById('emotionScore').textContent = emotionScore;
    document.getElementById('emotionBar').style.width = `${emotionScore}%`;
    document.getElementById('emotionText').textContent = metrics.emotion.text;
    
    // 시선
    const gazeScore = Math.round(metrics.gaze.score);
    document.getElementById('gazeScore').textContent = gazeScore;
    document.getElementById('gazeBar').style.width = `${gazeScore}%`;
    document.getElementById('gazeText').textContent = metrics.gaze.text;
    
    // 자세
    const postureScore = Math.round(metrics.posture.score);
    document.getElementById('postureScore').textContent = postureScore;
    document.getElementById('postureBar').style.width = `${postureScore}%`;
    document.getElementById('postureText').textContent = metrics.posture.text;
    
    // 종합 점수
    const totalScore = Math.round((emotionScore + gazeScore + postureScore) / 3);
    updateCircularProgress(totalScore);
}

/**
 * 원형 프로그레스 바 업데이트
 */
function updateCircularProgress(score) {
    const circle = document.querySelector('.progress-ring-circle');
    const text = document.getElementById('totalScoreText');
    
    if (!circle || !text) return;
    
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    text.textContent = score;
}

/**
 * 면접 종료
 */
async function endInterview() {
    console.log('[VideoInterviewEnhanced] Ending interview...');
    
    // 로딩 표시
    endButton.disabled = true;
    endButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>분석 중...';
    
    try {
        // 1. 비디오 분석 중지
        if (videoAnalyzer) {
            videoAnalyzer.stopAnalysis();
            videoAnalyzer.stopCamera();
        }
        
        // 2. 타이머 중지
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // 3. 음성 인식 중지
        if (recognition) {
            recognition.stop();
        }
        
        // 4. 오디오 중지
        if (currentAudio) {
            currentAudio.pause();
        }
        
        // 5. 마지막 답변 저장
        if (currentAnswer.trim()) {
            answers.push({
                question: interviewData.questions[currentQuestionIndex],
                answer: currentAnswer.trim(),
                duration: Math.floor((Date.now() - interviewStartTime) / 1000),
                wordCount: currentAnswer.trim().split(/\s+/).length,
                keywords: extractKeywords(currentAnswer)
            });
        }
        
        // 6. 비디오 분석 결과 가져오기
        const videoAnalysisResult = videoAnalyzer ? videoAnalyzer.getAnalysisResult() : null;
        
        // 7. 종합 평가 생성
        showToast('종합 평가 생성 중...', 'info');
        
        const evaluationResponse = await fetch('/api/comprehensive-evaluation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company: interviewData.selectedCompany,
                videoAnalysis: videoAnalysisResult,
                answers: answers
            })
        });
        
        if (!evaluationResponse.ok) {
            throw new Error('종합 평가 생성 실패');
        }
        
        const evaluationResult = await evaluationResponse.json();
        
        if (!evaluationResult.success) {
            throw new Error(evaluationResult.error || '종합 평가 생성 실패');
        }
        
        // 8. 리포트 화면으로 전환
        displayReport(evaluationResult.data);
        
        interviewScreen.classList.add('hidden');
        reportScreen.classList.remove('hidden');
        
        // 9. 데이터베이스에 저장
        try {
            showToast('면접 결과를 저장하고 있습니다...', 'info');
            
            const saveResponse = await fetch('/api/save-interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: getUserEmail(),
                    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    company: interviewData.selectedCompany,
                    questions: interviewData.questions,
                    answers: answers,
                    videoAnalysis: videoAnalysisResult,
                    comprehensiveEvaluation: evaluationResult.data.comprehensiveEvaluation,
                    answerAnalysis: evaluationResult.data.answerAnalysis,
                    startedAt: new Date(interviewStartTime).toISOString(),
                    endedAt: new Date().toISOString()
                })
            });
            
            if (saveResponse.ok) {
                const saveResult = await saveResponse.json();
                if (saveResult.success) {
                    console.log('[VideoInterviewEnhanced] Interview saved:', saveResult.data);
                    showToast('면접 결과가 저장되었습니다!', 'success');
                } else {
                    console.warn('[VideoInterviewEnhanced] Save warning:', saveResult.error);
                }
            } else {
                console.warn('[VideoInterviewEnhanced] Save failed:', saveResponse.status);
            }
        } catch (saveError) {
            console.error('[VideoInterviewEnhanced] Save error:', saveError);
            // 저장 실패해도 리포트는 보여줌
        }
        
        showToast('면접이 종료되었습니다!', 'success');
        
    } catch (error) {
        console.error('[VideoInterviewEnhanced] End error:', error);
        showToast(`오류 발생: ${error.message}`, 'error');
        endButton.disabled = false;
        endButton.innerHTML = '<i class="fas fa-stop mr-2"></i>면접 종료';
    }
}

/**
 * 리포트 표시
 */
function displayReport(data) {
    const { comprehensiveEvaluation, videoAnalysis, answerAnalysis } = data;
    
    // 최종 점수 표시
    document.getElementById('finalScoreNumber').textContent = comprehensiveEvaluation.finalScore;
    document.getElementById('finalGrade').textContent = comprehensiveEvaluation.finalGrade;
    document.getElementById('hiringProbability').textContent = comprehensiveEvaluation.hiringProbability;
    
    // 원형 프로그레스 업데이트
    const reportCircle = document.querySelector('#reportScreen .progress-ring-circle');
    if (reportCircle) {
        const radius = reportCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (comprehensiveEvaluation.finalScore / 100) * circumference;
        
        reportCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        reportCircle.style.strokeDashoffset = offset;
    }
    
    // 종합 평가
    document.getElementById('executiveSummary').textContent = comprehensiveEvaluation.executiveSummary || '';
    document.getElementById('overallAssessment').textContent = comprehensiveEvaluation.overallAssessment || '';
    
    // 영상 퍼포먼스
    document.getElementById('videoSummary').textContent = comprehensiveEvaluation.videoPerformance?.summary || '';
    
    // 답변 퍼포먼스
    document.getElementById('answerSummary').textContent = comprehensiveEvaluation.answerPerformance?.summary || '';
    
    // 개선 권장사항
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';
    (comprehensiveEvaluation.recommendations || []).forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
    });
    
    // 다음 단계
    document.getElementById('nextSteps').textContent = comprehensiveEvaluation.nextSteps || '';
    
    console.log('[VideoInterviewEnhanced] Report displayed');
}

/**
 * 재시도
 */
function retryInterview() {
    location.reload();
}

/**
 * 토스트 알림
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `feedback-toast ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    } text-white`;
    
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
