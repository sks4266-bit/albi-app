/**
 * 🌟 초자연스러운 AI 면접 엔진
 * 시리/빅스비를 뛰어넘는 진짜 사람 같은 대화
 */

interface ConversationContext {
  userName: string;
  jobType: string;
  previousAnswers: Map<string, string>;
  currentPhase: number; // 1: 동기, 2: 경험, 3: 상황대처, 4: 태도
  conversationHistory: Array<{ q: string; a: string }>;
}

export class NaturalInterviewEngine {
  private context: ConversationContext;
  private questionPool: Map<string, QuestionNode>;
  
  constructor(jobType: string, userName: string = '지원자') {
    this.context = {
      userName,
      jobType,
      previousAnswers: new Map(),
      currentPhase: 1,
      conversationHistory: []
    };
    
    this.questionPool = this.buildQuestionPool(jobType);
  }
  
  /**
   * 자연스러운 질문 풀 구축 (진짜 사람처럼)
   */
  private buildQuestionPool(jobType: string): Map<string, QuestionNode> {
    const pool = new Map<string, QuestionNode>();
    
    // Phase 1: 동기 파악 (자연스러운 오프닝)
    pool.set('opening', {
      id: 'opening',
      phase: 1,
      question: `${this.context.userName}님, 만나서 반가워요! 😊\n편하게 대화하듯이 이야기 나눠볼게요.\n\n먼저, ${jobType}에서 일하고 싶으신 특별한 이유가 있으세요?`,
      followUps: {
        short: '음... 좀 더 자세히 얘기해주실 수 있을까요? 어떤 점이 끌렸는지 궁금해요!',
        vague: '아하, 그렇군요! 그럼 구체적으로 어떤 부분이 좋으신 거예요?',
        good: '오~ 좋은데요! 👍 그럼 {answer}하시는 걸 언제부터 좋아하셨어요?'
      },
      nextQuestions: ['experience_check', 'interest_depth']
    });
    
    pool.set('interest_depth', {
      id: 'interest_depth',
      phase: 1,
      question: `그러면 평소에 {previous_topic} 관련해서 뭔가 해보신 적 있으세요?\n예를 들면, 관련 영상 보거나 직접 해보거나...`,
      followUps: {
        yes: '오 진짜요? 어떤 거 해보셨어요? 궁금하네요!',
        no: '아직 안 해보셨구나! 그럼 일하면서 뭘 제일 배워보고 싶으세요?',
        detailed: '와, {answer}! 진짜 관심이 많으시네요 😊'
      },
      nextQuestions: ['experience_check', 'strength']
    });
    
    // Phase 2: 경험 탐색 (자연스러운 전환)
    pool.set('experience_check', {
      id: 'experience_check',
      phase: 2,
      question: `그러면 이전에 비슷한 일 해보신 적 있으세요?\n아르바이트든, 동아리든, 뭐든 괜찮아요!`,
      followUps: {
        yes: '오! 어디서 일하셨어요? 어땠는지 궁금해요!',
        no: '처음이시구나! 괜찮아요 😊 그럼 친구들이랑 같이 뭔가 한 적은 있으세요? (프로젝트, 행사 준비 같은 거)',
        vague: '음... 좀 더 구체적으로 말씀해주시면 좋겠어요!'
      },
      nextQuestions: ['experience_detail', 'teamwork']
    });
    
    pool.set('experience_detail', {
      id: 'experience_detail',
      phase: 2,
      question: `{previous_experience}에서 일하셨을 때요,\n제일 기억에 남는 순간이 있으세요?`,
      followUps: {
        positive: '좋은 경험이었네요! 그때 {answer}하면서 뭘 배우셨어요?',
        negative: '힘든 일도 있으셨구나... 그래도 극복하셨잖아요! 어떻게 해결하셨어요?',
        neutral: '그렇구나... 그럼 그 경험에서 뭘 배우셨다고 생각하세요?'
      },
      nextQuestions: ['strength', 'situation_1']
    });
    
    pool.set('teamwork', {
      id: 'teamwork',
      phase: 2,
      question: `${jobType}에서는 팀워크가 진짜 중요하거든요!\n친구들이랑 같이 뭔가 할 때, 본인은 어떤 역할 맡으시는 편이에요?`,
      followUps: {
        leader: '리더 스타일이시네요! 그럼 팀원들이랑 의견 안 맞을 때는 어떻게 하세요?',
        supporter: '서포터 역할 좋아하시는구나! 그럼 리더가 잘못된 결정 내릴 때는 어떻게 하세요?',
        flexible: '상황에 따라 유연하게 하시는구나! 좋은 자세네요 😊'
      },
      nextQuestions: ['strength', 'situation_1']
    });
    
    // Phase 3: 상황 대처 (실전 시뮬레이션)
    pool.set('situation_1', {
      id: 'situation_1',
      phase: 3,
      question: `자, 이제 실전 상황 하나 드릴게요!\n\n손님이 갑자기 화내면서 "이거 왜 이래!"라고 하시면\n어떻게 대응하실 것 같아요?`,
      followUps: {
        good: '좋은 대응이네요! 그럼 사과했는데도 계속 화내시면요?',
        passive: '음... 좀 더 적극적으로 대응하는 게 필요할 것 같아요. 다시 한번 생각해볼래요?',
        excellent: '완벽해요! 👍 고객 응대 경험 있으신가요?'
      },
      nextQuestions: ['situation_2', 'stress_management']
    });
    
    pool.set('situation_2', {
      id: 'situation_2',
      phase: 3,
      question: `또 다른 상황!\n\n갑자기 손님이 엄청 몰려서 혼자 감당이 안 될 것 같으면\n어떻게 하실 거예요?`,
      followUps: {
        realistic: '현실적이네요! 그럼 도움 요청했는데 아무도 안 오면요?',
        proactive: '오 적극적이시네요! 좋아요 😊',
        creative: '재미있는 접근이네요! {answer}는 생각 못 했어요!'
      },
      nextQuestions: ['stress_management', 'strength']
    });
    
    pool.set('stress_management', {
      id: 'stress_management',
      phase: 3,
      question: `일하다 보면 스트레스 받을 때도 있잖아요?\n평소에 스트레스는 어떻게 푸시는 편이에요?`,
      followUps: {
        healthy: '건강한 방법이네요! 그럼 일하면서 스트레스 받으면 바로바로 풀 수 있을 것 같아요?',
        unhealthy: '음... {answer}보다는 좀 더 건강한 방법도 찾아보시면 좋을 것 같아요!',
        good: '좋은 방법이네요! 😊'
      },
      nextQuestions: ['strength', 'future_goal']
    });
    
    // Phase 4: 태도 및 비전 (마무리)
    pool.set('strength', {
      id: 'strength',
      phase: 4,
      question: `거의 다 왔어요!\n\n본인의 장점을 딱 하나만 말씀해주신다면 뭐라고 하실 거예요?`,
      followUps: {
        generic: '좋아요! 그럼 그 {answer}을/를 어떻게 증명할 수 있을까요?',
        specific: '오 구체적이네요! 그럼 {answer}을/를 여기서 어떻게 활용하실 건가요?',
        excellent: '완벽해요! 딱 우리가 찾던 사람이네요 😊'
      },
      nextQuestions: ['weakness', 'future_goal']
    });
    
    pool.set('weakness', {
      id: 'weakness',
      phase: 4,
      question: `반대로, 본인이 개선하고 싶은 부분은 뭐예요?\n솔직하게 말씀해주세요!`,
      followUps: {
        honest: '솔직하게 말씀해주셔서 감사해요! 그럼 어떻게 개선하려고 노력 중이세요?',
        vague: '음... 좀 더 구체적으로 말씀해주실 수 있을까요?',
        good: '좋은 자세네요! 단점을 인식하고 개선하려는 게 중요하죠 😊'
      },
      nextQuestions: ['future_goal', 'closing']
    });
    
    pool.set('future_goal', {
      id: 'future_goal',
      phase: 4,
      question: `마지막 질문이에요!\n\n여기서 일하게 되면, 6개월 뒤에는 어떤 모습이고 싶으세요?`,
      followUps: {
        ambitious: '목표가 확실하시네요! 👍',
        realistic: '현실적이고 좋아요!',
        vague: '음... 좀 더 구체적인 목표가 있으면 좋을 것 같아요!'
      },
      nextQuestions: ['closing']
    });
    
    pool.set('closing', {
      id: 'closing',
      phase: 4,
      question: `수고하셨어요! 😊\n마지막으로 하고 싶으신 말씀 있으세요?`,
      followUps: {
        any: '네, 좋은 말씀 감사합니다!\n면접 결과는 곧 알려드릴게요!'
      },
      nextQuestions: []
    });
    
    return pool;
  }
  
  /**
   * 다음 질문 생성 (맥락 기반)
   */
  async getNextQuestion(userAnswer: string, currentQuestionId: string): Promise<{
    question: string;
    isComplete: boolean;
  }> {
    // 답변 저장
    this.context.conversationHistory.push({
      q: currentQuestionId,
      a: userAnswer
    });
    this.context.previousAnswers.set(currentQuestionId, userAnswer);
    
    const currentNode = this.questionPool.get(currentQuestionId);
    if (!currentNode) {
      return { question: '오류가 발생했습니다.', isComplete: true };
    }
    
    // 답변 분석 (간단한 키워드 기반)
    const answerType = this.analyzeAnswer(userAnswer);
    const followUp = currentNode.followUps[answerType] || currentNode.followUps['good'];
    
    // 다음 질문 선택
    if (currentNode.nextQuestions.length === 0) {
      // 면접 완료
      return {
        question: this.generateFinalMessage(),
        isComplete: true
      };
    }
    
    // 다음 질문 ID 선택 (맥락 기반)
    const nextId = this.selectNextQuestion(currentNode.nextQuestions, userAnswer);
    const nextNode = this.questionPool.get(nextId);
    
    if (!nextNode) {
      return { question: '면접이 완료되었습니다!', isComplete: true };
    }
    
    // 맥락 치환
    let question = nextNode.question;
    question = this.replaceContextVariables(question);
    
    // Follow-up 메시지 + 다음 질문 조합
    const fullMessage = followUp ? `${followUp}\n\n${question}` : question;
    
    return {
      question: fullMessage,
      isComplete: false
    };
  }
  
  /**
   * 답변 분석 (키워드 기반)
   */
  private analyzeAnswer(answer: string): string {
    const lower = answer.toLowerCase().trim();
    
    // 너무 짧은 답변
    if (lower.length < 10) return 'short';
    
    // 모호한 답변
    if (lower.includes('모르겠') || lower.includes('잘 모르') || lower.includes('그냥')) {
      return 'vague';
    }
    
    // 긍정적 답변
    if (lower.includes('좋아') || lower.includes('재미') || lower.includes('행복')) {
      return 'positive';
    }
    
    // 부정적 답변
    if (lower.includes('힘들') || lower.includes('어렵') || lower.includes('싫')) {
      return 'negative';
    }
    
    // 경험 있음
    if (lower.includes('했') || lower.includes('해봤') || lower.includes('경험')) {
      return 'yes';
    }
    
    // 경험 없음
    if (lower.includes('없') || lower.includes('안 해') || lower.includes('처음')) {
      return 'no';
    }
    
    // 상세한 답변 (길이 기준)
    if (lower.length > 50) return 'detailed';
    
    return 'good';
  }
  
  /**
   * 다음 질문 선택 (맥락 기반)
   */
  private selectNextQuestion(candidates: string[], userAnswer: string): string {
    // 간단한 로직: 경험 유무에 따라 분기
    if (userAnswer.includes('없') || userAnswer.includes('처음')) {
      // 경험 없으면 teamwork 우선
      if (candidates.includes('teamwork')) return 'teamwork';
    }
    
    if (userAnswer.includes('했') || userAnswer.includes('해봤')) {
      // 경험 있으면 experience_detail 우선
      if (candidates.includes('experience_detail')) return 'experience_detail';
    }
    
    // 기본: 첫 번째 후보
    return candidates[0];
  }
  
  /**
   * 맥락 변수 치환
   */
  private replaceContextVariables(text: string): string {
    let result = text;
    
    // {previous_experience} 치환
    const experienceAnswer = this.context.previousAnswers.get('experience_check');
    if (experienceAnswer) {
      result = result.replace('{previous_experience}', experienceAnswer);
    }
    
    // {previous_topic} 치환
    const openingAnswer = this.context.previousAnswers.get('opening');
    if (openingAnswer) {
      const topic = this.extractKeyword(openingAnswer);
      result = result.replace('{previous_topic}', topic);
    }
    
    // {answer} 치환
    const lastAnswer = this.context.conversationHistory[this.context.conversationHistory.length - 1]?.a;
    if (lastAnswer) {
      const keyword = this.extractKeyword(lastAnswer);
      result = result.replace('{answer}', keyword);
    }
    
    return result;
  }
  
  /**
   * 핵심 키워드 추출
   */
  private extractKeyword(text: string): string {
    // 간단한 키워드 추출 (명사 위주)
    const keywords = ['커피', '음식', '손님', '사람', '요리', '서비스', '분위기'];
    for (const keyword of keywords) {
      if (text.includes(keyword)) return keyword;
    }
    return '그것';
  }
  
  /**
   * 최종 메시지 생성
   */
  private generateFinalMessage(): string {
    return `${this.context.userName}님, 면접 정말 수고 많으셨어요! 😊

편하게 대화하듯 이야기 나눠주셔서 감사합니다.
결과는 곧 알려드릴게요!

좋은 하루 되세요! 👍`;
  }
}

interface QuestionNode {
  id: string;
  phase: number;
  question: string;
  followUps: { [key: string]: string };
  nextQuestions: string[];
}
