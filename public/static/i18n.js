/**
 * 다국어 지원 (i18n) - 한국어, 영어, 중국어
 */

const translations = {
  ko: {
    // Common
    'common.loading': '로딩 중...',
    'common.error': '오류 발생',
    'common.success': '성공',
    'common.cancel': '취소',
    'common.confirm': '확인',
    'common.save': '저장',
    'common.back': '뒤로',
    'common.next': '다음',
    'common.start': '시작',
    'common.end': '종료',
    
    // Video Interview
    'interview.title': 'AI 영상 면접',
    'interview.subtitle': '알비 면접관과 함께하는 최종 챕터',
    'interview.description': '실제 면접처럼 카메라를 통해 표정, 시선, 자세를 실시간으로 분석하고 면접 중 즉각적인 피드백과 면접 종료 후 상세한 리포트를 제공합니다.',
    'interview.startButton': '면접 시작하기',
    'interview.endButton': '면접 종료',
    'interview.nextQuestion': '다음 질문',
    'interview.cameraPermission': '카메라와 마이크 권한이 필요합니다',
    
    // Analysis
    'analysis.expression': '표정',
    'analysis.gaze': '시선',
    'analysis.posture': '자세',
    'analysis.gesture': '제스처',
    'analysis.voice': '음성',
    'analysis.realtime': '실시간 분석',
    'analysis.analyzing': '분석 중...',
    
    // Report
    'report.title': '면접이 완료되었습니다!',
    'report.subtitle': '상세한 분석 결과를 확인하세요',
    'report.finalScore': '최종 점수',
    'report.grade': '등급',
    'report.hiringProbability': '채용 가능성',
    'report.videoPerformance': '영상 퍼포먼스',
    'report.answerPerformance': '답변 퍼포먼스',
    'report.recommendations': '개선 권장사항',
    'report.nextSteps': '다음 단계',
    'report.retry': '다시 면접 보기',
    'report.goHome': '메인으로 돌아가기',
    
    // Dashboard
    'dashboard.title': '성장 추이 대시보드',
    'dashboard.totalInterviews': '총 면접 수',
    'dashboard.avgScore': '평균 점수',
    'dashboard.maxScore': '최고 점수',
    'dashboard.totalHours': '총 학습 시간',
    'dashboard.scoreTrend': '점수 추이',
    'dashboard.comparison': '영상 vs 답변 점수',
    'dashboard.recentHistory': '최근 면접 이력',
    'dashboard.noData': '아직 면접 이력이 없습니다',
    'dashboard.startFirst': '첫 면접 시작하기',
    
    // Toast Messages
    'toast.interviewStarted': '면접이 시작되었습니다!',
    'toast.interviewEnded': '면접이 종료되었습니다!',
    'toast.preparing': '개인화 면접 준비 중...',
    'toast.customReady': '{company} 맞춤 면접이 준비되었습니다!',
    'toast.analyzing': '종합 평가 생성 중...',
    'toast.saving': '면접 결과를 저장하고 있습니다...',
    'toast.saved': '면접 결과가 저장되었습니다!',
    'toast.speechStarted': '음성 인식이 시작되었습니다.',
    'toast.speechPaused': '음성 인식이 일시 중지되었습니다.',
    
    // Interviewer
    'interviewer.name': '김서연 면접관',
    'interviewer.loading': '면접관 로딩 중...',
    'interviewer.company': '회사 로딩 중...',
    'interviewer.position': '직무 로딩 중...',
    
    // Panel Interview
    'panel.title': '패널 면접',
    'panel.subtitle': '3명의 전문가가 함께 면접을 진행합니다',
    'panel.startButton': '면접 시작',
    'panel.recordButton': '답변하기',
    'panel.nextButton': '다음 질문',
    'panel.endButton': '면접 종료',
    'panel.progressLabel': '진행 상황',
    'panel.startMessage': '패널 면접을 시작하려면 아래 버튼을 클릭하세요.',
    
    // Language
    'lang.label': '언어 / Language',
    'lang.korean': '🇰🇷 한국어',
    'lang.english': '🇺🇸 English',
    'lang.chinese': '🇨🇳 中文'
  },
  
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.start': 'Start',
    'common.end': 'End',
    
    // Video Interview
    'interview.title': 'AI Video Interview',
    'interview.subtitle': 'Final Chapter with Albi Interviewer',
    'interview.description': 'Experience a real interview with real-time analysis of facial expressions, gaze, and posture through the camera, with instant feedback during the interview and detailed reports after completion.',
    'interview.startButton': 'Start Interview',
    'interview.endButton': 'End Interview',
    'interview.nextQuestion': 'Next Question',
    'interview.cameraPermission': 'Camera and microphone permissions required',
    
    // Analysis
    'analysis.expression': 'Expression',
    'analysis.gaze': 'Gaze',
    'analysis.posture': 'Posture',
    'analysis.gesture': 'Gesture',
    'analysis.voice': 'Voice',
    'analysis.realtime': 'Real-time Analysis',
    'analysis.analyzing': 'Analyzing...',
    
    // Report
    'report.title': 'Interview Completed!',
    'report.subtitle': 'Check your detailed analysis results',
    'report.finalScore': 'Final Score',
    'report.grade': 'Grade',
    'report.hiringProbability': 'Hiring Probability',
    'report.videoPerformance': 'Video Performance',
    'report.answerPerformance': 'Answer Performance',
    'report.recommendations': 'Recommendations',
    'report.nextSteps': 'Next Steps',
    'report.retry': 'Retry Interview',
    'report.goHome': 'Go to Home',
    
    // Dashboard
    'dashboard.title': 'Growth Tracking Dashboard',
    'dashboard.totalInterviews': 'Total Interviews',
    'dashboard.avgScore': 'Average Score',
    'dashboard.maxScore': 'Max Score',
    'dashboard.totalHours': 'Total Hours',
    'dashboard.scoreTrend': 'Score Trend',
    'dashboard.comparison': 'Video vs Answer Score',
    'dashboard.recentHistory': 'Recent History',
    'dashboard.noData': 'No interview history yet',
    'dashboard.startFirst': 'Start Your First Interview',
    
    // Toast Messages
    'toast.interviewStarted': 'Interview started!',
    'toast.interviewEnded': 'Interview ended!',
    'toast.preparing': 'Preparing personalized interview...',
    'toast.customReady': '{company} customized interview is ready!',
    'toast.analyzing': 'Generating comprehensive evaluation...',
    'toast.saving': 'Saving interview results...',
    'toast.saved': 'Interview results saved!',
    'toast.speechStarted': 'Speech recognition started.',
    'toast.speechPaused': 'Speech recognition paused.',
    
    // Interviewer
    'interviewer.name': 'Sarah Kim',
    'interviewer.loading': 'Loading interviewer...',
    'interviewer.company': 'Loading company...',
    'interviewer.position': 'Loading position...',
    
    // Panel Interview
    'panel.title': 'Panel Interview',
    'panel.subtitle': 'Three experts will conduct the interview together',
    'panel.startButton': 'Start Interview',
    'panel.recordButton': 'Answer',
    'panel.nextButton': 'Next Question',
    'panel.endButton': 'End Interview',
    'panel.progressLabel': 'Progress',
    'panel.startMessage': 'Click the button below to start the panel interview.',
    
    // Language
    'lang.label': 'Language',
    'lang.korean': '🇰🇷 한국어',
    'lang.english': '🇺🇸 English',
    'lang.chinese': '🇨🇳 中文'
  },
  
  zh: {
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.back': '返回',
    'common.next': '下一个',
    'common.start': '开始',
    'common.end': '结束',
    
    // Video Interview
    'interview.title': 'AI 视频面试',
    'interview.subtitle': '与 Albi 面试官的最终章节',
    'interview.description': '通过摄像头实时分析面部表情、眼神和姿势，体验真实面试，面试过程中提供即时反馈，完成后提供详细报告。',
    'interview.startButton': '开始面试',
    'interview.endButton': '结束面试',
    'interview.nextQuestion': '下一个问题',
    'interview.cameraPermission': '需要摄像头和麦克风权限',
    
    // Analysis
    'analysis.expression': '表情',
    'analysis.gaze': '眼神',
    'analysis.posture': '姿势',
    'analysis.gesture': '手势',
    'analysis.voice': '声音',
    'analysis.realtime': '实时分析',
    'analysis.analyzing': '分析中...',
    
    // Report
    'report.title': '面试已完成！',
    'report.subtitle': '查看详细分析结果',
    'report.finalScore': '最终得分',
    'report.grade': '等级',
    'report.hiringProbability': '录用可能性',
    'report.videoPerformance': '视频表现',
    'report.answerPerformance': '回答表现',
    'report.recommendations': '改进建议',
    'report.nextSteps': '下一步',
    'report.retry': '重新面试',
    'report.goHome': '返回主页',
    
    // Dashboard
    'dashboard.title': '成长追踪仪表板',
    'dashboard.totalInterviews': '总面试次数',
    'dashboard.avgScore': '平均分数',
    'dashboard.maxScore': '最高分数',
    'dashboard.totalHours': '总学习时间',
    'dashboard.scoreTrend': '分数趋势',
    'dashboard.comparison': '视频 vs 回答分数',
    'dashboard.recentHistory': '最近历史',
    'dashboard.noData': '暂无面试历史',
    'dashboard.startFirst': '开始第一次面试',
    
    // Toast Messages
    'toast.interviewStarted': '面试已开始！',
    'toast.interviewEnded': '面试已结束！',
    'toast.preparing': '准备个性化面试...',
    'toast.customReady': '{company} 定制面试已准备好！',
    'toast.analyzing': '生成综合评估...',
    'toast.saving': '保存面试结果...',
    'toast.saved': '面试结果已保存！',
    'toast.speechStarted': '语音识别已开始。',
    'toast.speechPaused': '语音识别已暂停。',
    
    // Interviewer
    'interviewer.name': '金书妍面试官',
    'interviewer.loading': '加载面试官...',
    'interviewer.company': '加载公司...',
    'interviewer.position': '加载职位...',
    
    // Panel Interview
    'panel.title': '小组面试',
    'panel.subtitle': '三位专家共同进行面试',
    'panel.startButton': '开始面试',
    'panel.recordButton': '回答',
    'panel.nextButton': '下一个问题',
    'panel.endButton': '结束面试',
    'panel.progressLabel': '进度',
    'panel.startMessage': '点击下面的按钮开始小组面试。',
    
    // Language
    'lang.label': '语言',
    'lang.korean': '🇰🇷 한국어',
    'lang.english': '🇺🇸 English',
    'lang.chinese': '🇨🇳 中文'
  }
};

class I18n {
  constructor() {
    this.currentLang = this.getStoredLanguage() || this.detectLanguage();
    this.translations = translations;
  }
  
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('zh')) return 'zh';
    return 'en';
  }
  
  getStoredLanguage() {
    // 두 가지 키를 모두 확인 (기존 호환성)
    return localStorage.getItem('selectedLanguage') || localStorage.getItem('albi_language');
  }
  
  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language ${lang} not supported`);
      return;
    }
    
    this.currentLang = lang;
    // 두 가지 키 모두 저장 (호환성)
    localStorage.setItem('albi_language', lang);
    localStorage.setItem('selectedLanguage', lang);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }
  
  t(key, params = {}) {
    const lang = this.currentLang;
    let text = this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
    
    // Replace parameters {param}
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }
  
  getCurrentLanguage() {
    return this.currentLang;
  }
  
  getSpeechLang() {
    const langMap = {
      'ko': 'ko-KR',
      'en': 'en-US',
      'zh': 'zh-CN'
    };
    return langMap[this.currentLang] || 'ko-KR';
  }
  
  getTTSVoice() {
    const voiceMap = {
      'ko': 'alloy', // Korean-friendly voice
      'en': 'nova',  // Native English voice
      'zh': 'shimmer' // Chinese-friendly voice
    };
    return voiceMap[this.currentLang] || 'alloy';
  }
}

// Global instance
window.i18n = new I18n();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
}
