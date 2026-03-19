/**
 * 패널 면접 시스템
 * Phase 8.3: 패널 면접 고도화
 */

class PanelInterview {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.currentPanel = [];
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.currentInterviewer = null;
        this.answers = [];
        this.isRecording = false;
        this.recognition = null;
        this.currentAnswer = '';
        
        this.init();
    }
    
    /**
     * 초기화
     */
    init() {
        // 이벤트 리스너
        document.getElementById('startButton')?.addEventListener('click', () => this.startInterview());
        document.getElementById('recordButton')?.addEventListener('click', () => this.toggleRecording());
        document.getElementById('nextButton')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('endButton')?.addEventListener('click', () => this.endInterview());
        
        // 음성 인식 초기화
        this.initSpeechRecognition();
        
        console.log('[PanelInterview] Initialized, Session ID:', this.sessionId);
    }
    
    /**
     * 세션 ID 생성
     */
    generateSessionId() {
        return 'panel_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    }
    
    /**
     * 음성 인식 초기화
     */
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ko-KR';
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            
            this.recognition.onresult = (event) => {
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
                    this.currentAnswer += final;
                }
                
                // UI 업데이트 (필요시)
                console.log('[SpeechRecognition] Answer:', this.currentAnswer);
            };
            
            this.recognition.onerror = (event) => {
                console.error('[SpeechRecognition] Error:', event.error);
                if (typeof window.handleSpeechError === 'function') {
                    window.handleSpeechError(event);
                }
            };
        }
    }
    
    /**
     * 면접 시작
     */
    async startInterview() {
        try {
            showLoading('startPanel', {
                title: '패널 면접 준비 중...',
                message: '면접관을 배정하고 있습니다'
            });
            
            // 패널 면접 질문 생성 API 호출
            const response = await fetch('/api/panel-interview-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.getUserEmail(),
                    panelSize: 3 // 3명의 면접관
                })
            });
            
            if (!response.ok) throw new Error('패널 구성 실패');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || '패널 구성 실패');
            
            this.currentPanel = result.data.panel;
            this.currentQuestions = result.data.questions;
            
            // UI 업데이트
            this.renderPanel();
            this.showQuestion(0);
            
            // 화면 전환
            document.getElementById('startButton').classList.add('hidden');
            document.getElementById('recordButton').classList.remove('hidden');
            document.getElementById('nextButton').classList.remove('hidden');
            document.getElementById('endButton').classList.remove('hidden');
            document.getElementById('progressContainer').classList.remove('hidden');
            
            hideLoading('startPanel');
            showToast('패널 면접을 시작합니다!', 'success');
            
        } catch (error) {
            hideLoading('startPanel');
            console.error('[PanelInterview] Start error:', error);
            showToast('면접 시작에 실패했습니다: ' + error.message, 'error');
        }
    }
    
    /**
     * 사용자 이메일 가져오기
     */
    getUserEmail() {
        return localStorage.getItem('userEmail') || 'test@example.com';
    }
    
    /**
     * 패널 렌더링
     */
    renderPanel() {
        const container = document.getElementById('panelContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.currentPanel.forEach(interviewer => {
            const card = document.createElement('div');
            card.id = `interviewer_card_${interviewer.id}`;
            card.className = 'interviewer-card rounded-xl p-6 text-center';
            
            const avatarSrc = interviewer.imageUrl || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(interviewer.name)}&size=100&background=667eea&color=fff`;
            
            card.innerHTML = `
                <img src="${avatarSrc}" alt="${interviewer.name}" class="interviewer-avatar mx-auto mb-4">
                <h3 class="text-lg font-bold mb-1">${interviewer.name}</h3>
                <p class="text-sm text-gray-400 mb-2">${interviewer.role}</p>
                <div class="text-xs text-gray-500">
                    ${interviewer.specialtyAreas ? interviewer.specialtyAreas.slice(0, 2).join(', ') : ''}
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    /**
     * 질문 표시
     */
    showQuestion(index) {
        if (index >= this.currentQuestions.length) {
            this.endInterview();
            return;
        }
        
        const question = this.currentQuestions[index];
        const interviewer = this.currentPanel.find(i => i.id === question.interviewerId) || this.currentPanel[0];
        
        this.currentInterviewer = interviewer;
        this.currentQuestionIndex = index;
        this.currentAnswer = '';
        
        // 현재 면접관 카드 활성화
        document.querySelectorAll('.interviewer-card').forEach(card => card.classList.remove('active'));
        const activeCard = document.getElementById(`interviewer_card_${interviewer.id}`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
        
        // 질문 표시
        const avatarSrc = interviewer.imageUrl || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(interviewer.name)}&size=100&background=667eea&color=fff`;
        
        document.getElementById('currentInterviewerAvatar').innerHTML = 
            `<img src="${avatarSrc}" alt="${interviewer.name}" class="w-full h-full rounded-full object-cover">`;
        document.getElementById('currentInterviewerName').textContent = interviewer.name;
        document.getElementById('currentInterviewerRole').textContent = interviewer.role;
        document.getElementById('questionText').textContent = question.question;
        
        // 진행 상황 업데이트
        this.updateProgress();
        
        // TTS 음성으로 질문 읽기
        this.speakQuestion(question.question, interviewer.voice);
    }
    
    /**
     * TTS 음성으로 질문 읽기
     */
    async speakQuestion(text, voiceSettings) {
        try {
            // OpenAI TTS API 호출 (간단 버전)
            // 실제로는 /api/tts 엔드포인트를 만들어야 함
            console.log('[TTS] Speaking:', text.substring(0, 50) + '...');
            
            // Web Speech API 사용 (대체)
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ko-KR';
                utterance.rate = voiceSettings?.speed || 1.0;
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('[TTS] Error:', error);
        }
    }
    
    /**
     * 진행 상황 업데이트
     */
    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = 
            `${this.currentQuestionIndex + 1}/${this.currentQuestions.length}`;
    }
    
    /**
     * 녹음 토글
     */
    toggleRecording() {
        if (this.isRecording) {
            // 녹음 중지
            this.stopRecording();
        } else {
            // 녹음 시작
            this.startRecording();
        }
    }
    
    /**
     * 녹음 시작
     */
    startRecording() {
        if (this.recognition) {
            this.recognition.start();
            this.isRecording = true;
            
            const btn = document.getElementById('recordButton');
            btn.innerHTML = '<i class="fas fa-stop mr-2"></i>답변 중지';
            btn.classList.remove('bg-red-600', 'hover:bg-red-700');
            btn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            
            showToast('답변을 시작하세요', 'info');
        }
    }
    
    /**
     * 녹음 중지
     */
    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
            this.isRecording = false;
            
            const btn = document.getElementById('recordButton');
            btn.innerHTML = '<i class="fas fa-microphone mr-2"></i>답변하기';
            btn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            btn.classList.add('bg-red-600', 'hover:bg-red-700');
            
            // 답변 저장
            this.saveAnswer();
        }
    }
    
    /**
     * 답변 저장 및 평가
     */
    async saveAnswer() {
        if (!this.currentAnswer || this.currentAnswer.trim().length === 0) {
            showToast('답변이 녹음되지 않았습니다.', 'warning');
            return;
        }
        
        try {
            showLoading('evaluating', {
                title: '답변 평가 중...',
                message: '면접관이 답변을 평가하고 있습니다'
            });
            
            // 개별 평가 API 호출
            const response = await fetch('/api/panel-evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    interviewerId: this.currentInterviewer.id,
                    questionIndex: this.currentQuestionIndex,
                    answer: this.currentAnswer,
                    videoMetrics: {} // 추후 영상 분석 추가
                })
            });
            
            if (!response.ok) throw new Error('평가 실패');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || '평가 실패');
            
            // 답변 저장
            this.answers.push({
                questionIndex: this.currentQuestionIndex,
                interviewerId: this.currentInterviewer.id,
                question: this.currentQuestions[this.currentQuestionIndex].question,
                answer: this.currentAnswer,
                evaluation: result.data
            });
            
            hideLoading('evaluating');
            showToast(`${this.currentInterviewer.name}의 평가: ${result.data.score}점 (${result.data.grade})`, 'success');
            
        } catch (error) {
            hideLoading('evaluating');
            console.error('[PanelInterview] Save answer error:', error);
            showToast('답변 저장에 실패했습니다: ' + error.message, 'error');
        }
    }
    
    /**
     * 다음 질문
     */
    nextQuestion() {
        // 현재 답변 확인
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // 답변이 없으면 경고
        if (!this.currentAnswer || this.currentAnswer.trim().length === 0) {
            if (!confirm('답변이 녹음되지 않았습니다. 다음 질문으로 넘어가시겠습니까?')) {
                return;
            }
        } else {
            // 답변 저장
            this.saveAnswer();
        }
        
        // 다음 질문으로 이동
        this.showQuestion(this.currentQuestionIndex + 1);
    }
    
    /**
     * 면접 종료
     */
    async endInterview() {
        if (!confirm('면접을 종료하시겠습니까?')) {
            return;
        }
        
        try {
            showLoading('generatingReport', {
                title: '종합 리포트 생성 중...',
                message: '면접관들의 평가를 종합하고 있습니다'
            });
            
            // 종합 리포트 생성 API 호출
            const response = await fetch('/api/panel-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) throw new Error('리포트 생성 실패');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || '리포트 생성 실패');
            
            // 결과 페이지로 이동
            hideLoading('generatingReport');
            localStorage.setItem('panelInterviewResult', JSON.stringify(result.data));
            window.location.href = `/panel-result.html?session=${this.sessionId}`;
            
        } catch (error) {
            hideLoading('generatingReport');
            console.error('[PanelInterview] End interview error:', error);
            showToast('면접 종료에 실패했습니다: ' + error.message, 'error');
        }
    }
}

// Toast 알림 함수
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg z-50`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new PanelInterview();
});
