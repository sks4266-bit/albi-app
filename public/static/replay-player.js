/**
 * 면접 리플레이 플레이어
 * Phase 8.2: 리플레이 시스템 완성
 */

class ReplayPlayer {
    constructor() {
        this.video = document.getElementById('replayVideo');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.progressBar = document.getElementById('progressBar');
        this.speedBtn = document.getElementById('speedBtn');
        this.timeline = document.getElementById('timeline');
        
        this.sessionId = null;
        this.recordingData = null;
        this.timestamps = [];
        this.analysisSnapshots = [];
        this.currentSpeed = 1.0;
        this.speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        this.speedIndex = 2; // 1.0x
        
        this.init();
    }
    
    /**
     * 초기화
     */
    async init() {
        // URL에서 session_id 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('id');
        
        if (!this.sessionId) {
            this.showError('면접 ID가 없습니다.');
            return;
        }
        
        // 이벤트 리스너
        this.setupEventListeners();
        
        // 데이터 로드
        await this.loadRecording();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 재생/일시정지
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.video.addEventListener('play', () => this.updatePlayButton(true));
        this.video.addEventListener('pause', () => this.updatePlayButton(false));
        
        // 진행률 바
        this.progressBar.addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.video.duration;
            this.video.currentTime = time;
        });
        
        // 비디오 시간 업데이트
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // 재생 속도
        this.speedBtn.addEventListener('click', () => this.changeSpeed());
        
        // 다운로드 버튼
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadVideo());
        
        // PDF 리포트 버튼
        document.getElementById('pdfBtn').addEventListener('click', () => this.generatePDF());
    }
    
    /**
     * 녹화 데이터 로드
     */
    async loadRecording() {
        try {
            showLoading('loadRecording', {
                title: '면접 녹화 로드 중...',
                message: '잠시만 기다려주세요'
            });
            
            // 녹화 메타데이터 로드
            const response = await fetch(`/api/interview-detail?session_id=${this.sessionId}`);
            if (!response.ok) throw new Error('녹화 데이터 로드 실패');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            this.recordingData = result.data;
            
            // UI 업데이트
            this.updateHeader();
            
            // 비디오 URL 설정
            if (this.recordingData.video_url) {
                this.video.src = this.recordingData.video_url;
            } else {
                throw new Error('비디오 URL이 없습니다.');
            }
            
            // 타임스탬프 및 분석 데이터 로드
            await this.loadTimestamps();
            await this.loadAnalysisSnapshots();
            
            // 타임라인 렌더링
            this.renderTimeline();
            
            // 종합 리포트 로드
            await this.loadComprehensiveReport();
            
            hideLoading('loadRecording');
            
        } catch (error) {
            hideLoading('loadRecording');
            this.showError(error.message);
            console.error('[ReplayPlayer] Load error:', error);
        }
    }
    
    /**
     * 헤더 업데이트
     */
    updateHeader() {
        if (!this.recordingData) return;
        
        const title = document.getElementById('interviewTitle');
        const date = new Date(this.recordingData.start_time || this.recordingData.created_at);
        const dateStr = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        title.textContent = `${this.recordingData.company_name || '일반'} - ${this.recordingData.position || '면접'} (${dateStr})`;
    }
    
    /**
     * 타임스탬프 로드
     */
    async loadTimestamps() {
        try {
            const response = await fetch(`/api/recording-timestamps?session_id=${this.sessionId}`);
            if (!response.ok) throw new Error('타임스탬프 로드 실패');
            
            const result = await response.json();
            if (result.success) {
                this.timestamps = result.data || [];
            }
        } catch (error) {
            console.warn('[ReplayPlayer] Timestamps load error:', error);
            this.timestamps = [];
        }
    }
    
    /**
     * 분석 스냅샷 로드
     */
    async loadAnalysisSnapshots() {
        try {
            const response = await fetch(`/api/analysis-snapshots?session_id=${this.sessionId}`);
            if (!response.ok) throw new Error('분석 스냅샷 로드 실패');
            
            const result = await response.json();
            if (result.success) {
                this.analysisSnapshots = result.data || [];
            }
        } catch (error) {
            console.warn('[ReplayPlayer] Analysis snapshots load error:', error);
            this.analysisSnapshots = [];
        }
    }
    
    /**
     * 타임라인 렌더링
     */
    renderTimeline() {
        if (!this.timeline || this.timestamps.length === 0) return;
        
        this.timeline.innerHTML = '';
        const duration = this.video.duration || this.recordingData.duration_seconds || 300;
        
        this.timestamps.forEach((ts, index) => {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            
            const position = (ts.timestamp_seconds / duration) * 100;
            marker.style.left = `${position}%`;
            
            // 라벨
            const label = document.createElement('span');
            label.className = 'timeline-label';
            label.textContent = `Q${index + 1}`;
            marker.appendChild(label);
            
            // 클릭 이벤트
            marker.addEventListener('click', () => {
                this.video.currentTime = ts.timestamp_seconds;
                this.updateCurrentAnalysis(ts.timestamp_seconds);
            });
            
            this.timeline.appendChild(marker);
        });
    }
    
    /**
     * 재생/일시정지 토글
     */
    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }
    
    /**
     * 재생 버튼 업데이트
     */
    updatePlayButton(isPlaying) {
        const icon = this.playPauseBtn.querySelector('i');
        if (isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    /**
     * 진행률 업데이트
     */
    updateProgress() {
        if (!this.video.duration) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressBar.value = progress;
        
        // 현재 시간 표시
        document.getElementById('currentTime').textContent = this.formatTime(this.video.currentTime);
        
        // 현재 분석 업데이트
        this.updateCurrentAnalysis(this.video.currentTime);
    }
    
    /**
     * 재생 시간 표시
     */
    updateDuration() {
        document.getElementById('duration').textContent = this.formatTime(this.video.duration);
    }
    
    /**
     * 시간 포맷 (초 -> MM:SS)
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    /**
     * 재생 속도 변경
     */
    changeSpeed() {
        this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
        this.currentSpeed = this.speeds[this.speedIndex];
        this.video.playbackRate = this.currentSpeed;
        this.speedBtn.textContent = `${this.currentSpeed}x`;
    }
    
    /**
     * 현재 분석 업데이트
     */
    updateCurrentAnalysis(currentTime) {
        // 현재 시간과 가장 가까운 스냅샷 찾기
        let closestSnapshot = null;
        let minDiff = Infinity;
        
        this.analysisSnapshots.forEach(snapshot => {
            const diff = Math.abs(snapshot.timestamp_seconds - currentTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestSnapshot = snapshot;
            }
        });
        
        if (!closestSnapshot) return;
        
        // 현재 질문 표시
        const currentQuestion = this.timestamps.find(ts => 
            currentTime >= ts.timestamp_seconds && 
            currentTime < ts.timestamp_seconds + 60 // 60초 윈도우
        );
        
        if (currentQuestion) {
            document.getElementById('currentQuestion').textContent = 
                currentQuestion.question_text || `질문 ${currentQuestion.question_index + 1}`;
        }
        
        // 메트릭 업데이트
        const metrics = closestSnapshot.metrics || {};
        
        this.updateMetric('expression', metrics.expressionScore || 0);
        this.updateMetric('gaze', metrics.gazeScore || 0);
        this.updateMetric('posture', metrics.postureScore || 0);
        this.updateMetric('gesture', metrics.gestureScore || 0);
        
        // 실시간 피드백
        const feedback = this.generateFeedback(metrics);
        document.getElementById('realtimeFeedback').textContent = feedback;
    }
    
    /**
     * 메트릭 업데이트
     */
    updateMetric(name, value) {
        const score = document.getElementById(`${name}Score`);
        const bar = document.getElementById(`${name}Bar`);
        
        if (score) score.textContent = Math.round(value);
        if (bar) bar.style.width = `${value}%`;
    }
    
    /**
     * 피드백 생성
     */
    generateFeedback(metrics) {
        const feedbacks = [];
        
        if (metrics.expressionScore < 60) {
            feedbacks.push('표정이 다소 경직되어 있습니다.');
        } else if (metrics.expressionScore >= 80) {
            feedbacks.push('자연스러운 표정이 좋습니다!');
        }
        
        if (metrics.gazeScore < 60) {
            feedbacks.push('시선을 카메라에 고정하세요.');
        } else if (metrics.gazeScore >= 80) {
            feedbacks.push('시선 처리가 훌륭합니다!');
        }
        
        if (metrics.postureScore < 60) {
            feedbacks.push('자세를 바르게 유지하세요.');
        }
        
        if (metrics.gestureScore >= 80) {
            feedbacks.push('제스처가 자연스럽습니다!');
        }
        
        return feedbacks.length > 0 ? feedbacks.join(' ') : '좋은 면접 진행 중입니다!';
    }
    
    /**
     * 종합 리포트 로드
     */
    async loadComprehensiveReport() {
        const container = document.getElementById('comprehensiveReport');
        
        try {
            // 실제 API에서 리포트 로드
            const evaluation = this.recordingData.evaluation || {};
            
            container.innerHTML = `
                <!-- 종합 점수 -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-purple-900/30 rounded-xl p-6 text-center">
                        <div class="text-4xl font-bold mb-2">${evaluation.finalScore || 0}</div>
                        <div class="text-sm text-gray-400">최종 점수</div>
                        <div class="mt-2 text-2xl">${this.getGradeEmoji(evaluation.finalGrade)}</div>
                    </div>
                    <div class="bg-blue-900/30 rounded-xl p-6 text-center">
                        <div class="text-4xl font-bold mb-2">${evaluation.videoAnalysis?.score || 0}</div>
                        <div class="text-sm text-gray-400">영상 분석</div>
                    </div>
                    <div class="bg-green-900/30 rounded-xl p-6 text-center">
                        <div class="text-4xl font-bold mb-2">${evaluation.answerAnalysis?.totalScore || 0}</div>
                        <div class="text-sm text-gray-400">답변 분석</div>
                    </div>
                    <div class="bg-yellow-900/30 rounded-xl p-6 text-center">
                        <div class="text-3xl font-bold mb-2">${evaluation.finalGrade || '-'}</div>
                        <div class="text-sm text-gray-400">등급</div>
                    </div>
                </div>
                
                <!-- 상세 평가 -->
                <div class="space-y-4">
                    ${this.renderDetailedEvaluation(evaluation)}
                </div>
            `;
            
        } catch (error) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                    <p>리포트를 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    /**
     * 등급 이모지
     */
    getGradeEmoji(grade) {
        const emojis = {
            'A+': '🏆',
            'A': '🥇',
            'B': '🥈',
            'C': '🥉',
            'D': '📝'
        };
        return emojis[grade] || '📊';
    }
    
    /**
     * 상세 평가 렌더링
     */
    renderDetailedEvaluation(evaluation) {
        const report = evaluation.comprehensiveEvaluation || {};
        
        let html = '';
        
        // 전체 평가
        if (report.overallAssessment) {
            html += `
                <div class="bg-gray-800/50 rounded-xl p-6">
                    <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
                        <i class="fas fa-clipboard-check"></i>
                        종합 평가
                    </h3>
                    <p class="text-gray-300 leading-relaxed">${report.overallAssessment}</p>
                </div>
            `;
        }
        
        // 강점
        if (report.strengths && report.strengths.length > 0) {
            html += `
                <div class="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
                    <h3 class="text-lg font-bold mb-3 text-green-400 flex items-center gap-2">
                        <i class="fas fa-thumbs-up"></i>
                        강점
                    </h3>
                    <ul class="space-y-2">
                        ${report.strengths.map(s => `<li class="flex items-start gap-2"><i class="fas fa-check text-green-500 mt-1"></i><span>${s}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // 개선 사항
        if (report.recommendations && report.recommendations.length > 0) {
            html += `
                <div class="bg-yellow-900/20 rounded-xl p-6 border border-yellow-500/30">
                    <h3 class="text-lg font-bold mb-3 text-yellow-400 flex items-center gap-2">
                        <i class="fas fa-lightbulb"></i>
                        개선 제안
                    </h3>
                    <ul class="space-y-2">
                        ${report.recommendations.map(r => `<li class="flex items-start gap-2"><i class="fas fa-arrow-right text-yellow-500 mt-1"></i><span>${r}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        return html || '<p class="text-gray-400 text-center">평가 데이터가 없습니다.</p>';
    }
    
    /**
     * 비디오 다운로드
     */
    async downloadVideo() {
        if (!this.recordingData?.video_url) {
            showToast('다운로드할 영상이 없습니다.', 'error');
            return;
        }
        
        try {
            showToast('다운로드를 시작합니다...', 'info');
            
            const response = await fetch(this.recordingData.video_url);
            const blob = await response.blob();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `albi_interview_${this.sessionId}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('다운로드가 완료되었습니다!', 'success');
            
        } catch (error) {
            console.error('[ReplayPlayer] Download error:', error);
            showToast('다운로드에 실패했습니다.', 'error');
        }
    }
    
    /**
     * PDF 리포트 생성
     */
    async generatePDF() {
        showToast('PDF 생성 기능은 곧 제공될 예정입니다.', 'info');
        
        // TODO: PDF 생성 API 연동
        // - jsPDF 라이브러리 사용
        // - 종합 리포트 PDF로 변환
        // - 차트/그래프 포함
    }
    
    /**
     * 에러 표시
     */
    showError(message) {
        const container = document.querySelector('.container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-20">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-6"></i>
                <h2 class="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
                <p class="text-gray-400 mb-8">${message}</p>
                <button onclick="window.location.href='/my-recordings.html'" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl font-bold transition-all">
                    <i class="fas fa-arrow-left mr-2"></i>목록으로 돌아가기
                </button>
            </div>
        `;
    }
}

// Toast 알림 함수 (전역)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-in ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' :
        'bg-blue-600'
    }`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-times-circle' :
                type === 'warning' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ReplayPlayer();
});
