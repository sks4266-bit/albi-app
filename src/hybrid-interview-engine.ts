/**
 * 🚀 하이브리드 AI 면접 엔진
 * = 시나리오 기반 질문 세트 + GPT-4 자연어 피드백
 * = 시리/빅스비를 뛰어넘는 진짜 사람 같은 대화
 */

import OpenAI from 'openai';

interface InterviewContext {
  interview_id: string;
  job_type: 'cafe' | 'cvs' | 'restaurant' | 'retail' | 'fastfood';
  region: string;
  expected_wage: number;
  current_step: number; // 1~15
  conversation_log: Array<{ role: string; content: string; timestamp: string }>;
  current_scores: {
    reliability: number;
    job_fit: number;
    service_mind: number;
    logistics: number;
  };
  critical_flags: string[];
  started_at: string;
  user_profile?: any; // 적성검사 결과
}

interface InterviewResponse {
  status: 'ongoing' | 'completed' | 'rejected';
  message: string;
  question?: string;
  progress?: string;
  result?: any;
  debug?: any;
}

/**
 * 직무별 구조화된 질문 세트
 */
const STRUCTURED_QUESTIONS = {
  cafe: [
    { id: 1, category: '동기', question: '카페에서 일하고 싶으신 특별한 이유가 있으세요?' },
    { id: 2, category: '관심도', question: '평소에 커피나 카페 분위기 좋아하시는 편인가요?' },
    { id: 3, category: '경험', question: '이전에 비슷한 일 해보신 적 있으세요?' },
    { id: 4, category: '팀워크', question: '친구들이랑 같이 뭔가 할 때 주로 어떤 역할 하시나요?' },
    { id: 5, category: '곤란상황1', question: '☕ 실전 상황입니다!\n\n손님이 "아메리카노 주문했는데 왜 이렇게 연해요? 다시 만들어주세요!" 라고 하십니다.\n\n그런데 레시피대로 정확히 만들었고, 지금 피크타임이라 다른 손님들도 많이 기다리고 계세요.\n\n어떻게 대응하시겠어요?' },
    { id: 6, category: '곤란상황2', question: '☕ 또 다른 상황입니다!\n\n퇴근 30분 전인데 단체 손님 10명이 들어오셨어요. 메뉴도 다 달라서 시간이 오래 걸릴 것 같습니다.\n\n피곤하고 빨리 퇴근하고 싶은데... 어떻게 하시겠어요?' },
    { id: 7, category: '멀티태스킹', question: '카페에서는 음료 만들면서 동시에 손님 응대도 해야 하는데, 이런 멀티태스킹 자신 있으세요?' },
    { id: 8, category: '청결', question: '카페는 청결이 정말 중요한데, 평소에 정리정돈 잘 하시는 편인가요?' },
    { id: 9, category: '스트레스', question: '일하다 보면 스트레스 받을 때도 있잖아요? 평소에 스트레스는 어떻게 푸세요?' },
    { id: 10, category: '학습', question: '새로운 음료 레시피 배울 때 보통 얼마나 걸리는 편이세요?' },
    { id: 11, category: '책임감', question: '실수로 음료를 잘못 만들었을 때 어떻게 하실 건가요?' },
    { id: 12, category: '장점', question: '본인의 장점을 딱 하나만 말씀해주신다면?' },
    { id: 13, category: '단점', question: '반대로 개선하고 싶은 부분은 뭐예요?' },
    { id: 14, category: '목표', question: '카페에서 일하게 되면 6개월 뒤에는 어떤 모습이고 싶으세요?' },
    { id: 15, category: '마무리', question: '마지막으로 하고 싶으신 말씀 있으세요?' }
  ],
  cvs: [
    { id: 1, category: '동기', question: '편의점에서 일하고 싶으신 특별한 이유가 있으세요?' },
    { id: 2, category: '관심도', question: '평소에 편의점 자주 가시는 편인가요? 어떤 점이 좋으세요?' },
    { id: 3, category: '경험', question: '이전에 비슷한 일 해보신 적 있으세요?' },
    { id: 4, category: '팀워크', question: '친구들이랑 같이 뭔가 할 때 주로 어떤 역할 하시나요?' },
    { id: 5, category: '곤란상황1', question: '🏪 실전 상황입니다!\n\n새벽 2시 야간 근무 중인데, 술 취한 손님이 "담배 안 팔아? 왜 안 팔아? 너 사장이야?"라면서 카운터를 두들기고 있습니다.\n\n다른 손님도 없고 혼자 근무 중이에요. 어떻게 대응하시겠어요?' },
    { id: 6, category: '곤란상황2', question: '🏪 또 다른 상황입니다!\n\n10대 청소년이 담배를 사려고 하는데, 신분증 요구하니까 "친구들은 다 사는데 왜 나만 안 팔아줘요?" 라며 따집니다.\n\n뒤에는 급한 손님들이 줄 서 있어요. 어떻게 하시겠어요?' },
    { id: 7, category: '멀티태스킹', question: '편의점은 계산, 재고 정리, 택배 업무 등 동시에 해야 하는데 괜찮으실까요?' },
    { id: 8, category: '청결', question: '편의점은 청결이 정말 중요한데, 평소에 정리정돈 잘 하시는 편인가요?' },
    { id: 9, category: '스트레스', question: '일하다 보면 스트레스 받을 때도 있잖아요? 평소에 스트레스는 어떻게 푸세요?' },
    { id: 10, category: '학습', question: '편의점은 POS 시스템, 상품 배치 등 배울 게 많은데 배우는 속도는 어떠세요?' },
    { id: 11, category: '책임감', question: '야간 근무 중 혼자 있을 때 돌발 상황 생기면 어떻게 하실 건가요?' },
    { id: 12, category: '장점', question: '본인의 장점을 딱 하나만 말씀해주신다면?' },
    { id: 13, category: '단점', question: '반대로 개선하고 싶은 부분은 뭐예요?' },
    { id: 14, category: '목표', question: '편의점에서 일하게 되면 6개월 뒤에는 어떤 모습이고 싶으세요?' },
    { id: 15, category: '마무리', question: '마지막으로 하고 싶으신 말씀 있으세요?' }
  ],
  restaurant: [
    { id: 1, category: '동기', question: '음식점에서 일하고 싶으신 특별한 이유가 있으세요?' },
    { id: 2, category: '관심도', question: '평소에 요리나 음식에 관심 많으신 편인가요?' },
    { id: 3, category: '경험', question: '이전에 비슷한 일 해보신 적 있으세요?' },
    { id: 4, category: '팀워크', question: '친구들이랑 같이 뭔가 할 때 주로 어떤 역할 하시나요?' },
    { id: 5, category: '곤란상황1', question: '🍽️ 실전 상황입니다!\n\n손님이 주문하신 삼겹살을 다 구워드렸는데 "이거 너무 타서 못 먹겠어요, 다시 가져와요. 근데 이건 계산 안 할 거예요"라고 하십니다.\n\n사실 손님이 직접 다 구우셨어요. 어떻게 대응하시겠어요?' },
    { id: 6, category: '곤란상황2', question: '🍽️ 또 다른 상황입니다!\n\n금요일 저녁 피크타임에 주방 직원이 갑자기 아파서 나가고, 홀 손님 5팀이 동시에 "주문 언제 나와요?"라고 재촉합니다.\n\n혼자 감당해야 해요. 어떻게 하시겠어요?' },
    { id: 7, category: '체력', question: '음식점은 서서 일하고 무거운 것도 들어야 하는데 체력 자신 있으세요?' },
    { id: 8, category: '청결', question: '음식을 다루는 곳이라 위생이 정말 중요한데, 평소 청결에 신경 쓰시나요?' },
    { id: 9, category: '스트레스', question: '일하다 보면 스트레스 받을 때도 있잖아요? 평소에 스트레스는 어떻게 푸세요?' },
    { id: 10, category: '학습', question: '새로운 메뉴 배울 때 보통 얼마나 걸리는 편이세요?' },
    { id: 11, category: '책임감', question: '실수로 주문을 잘못 받았을 때 어떻게 하실 건가요?' },
    { id: 12, category: '장점', question: '본인의 장점을 딱 하나만 말씀해주신다면?' },
    { id: 13, category: '단점', question: '반대로 개선하고 싶은 부분은 뭐예요?' },
    { id: 14, category: '목표', question: '음식점에서 일하게 되면 6개월 뒤에는 어떤 모습이고 싶으세요?' },
    { id: 15, category: '마무리', question: '마지막으로 하고 싶으신 말씀 있으세요?' }
  ],
  retail: [
    { id: 1, category: '동기', question: '매장/마트에서 일하고 싶으신 특별한 이유가 있으세요?' },
    { id: 2, category: '관심도', question: '평소에 쇼핑하는 거 좋아하시나요? 어떤 점이 좋으세요?' },
    { id: 3, category: '경험', question: '이전에 비슷한 일 해보신 적 있으세요?' },
    { id: 4, category: '팀워크', question: '친구들이랑 같이 뭔가 할 때 주로 어떤 역할 하시나요?' },
    { id: 5, category: '곤란상황1', question: '🛍️ 실전 상황입니다!\n\n손님이 "이 옷 어제 샀는데 집에서 보니 색깔이 마음에 안 들어요. 근데 택 떼고 한번 입어봤어요. 환불 안 되나요?"라고 하십니다.\n\n규정상 착용한 제품은 환불 불가예요. 어떻게 대응하시겠어요?' },
    { id: 6, category: '곤란상황2', question: '🛍️ 또 다른 상황입니다!\n\n주말 세일 기간에 손님 20명이 동시에 계산대 앞에 줄을 서 있고, 한 손님이 "바코드가 안 찍혀요"라며 계속 재시도를 요구합니다.\n\n뒤 손님들이 짜증내고 있어요. 어떻게 처리하시겠어요?' },
    { id: 7, category: '체력', question: '매장은 서서 일하고 무거운 것도 들어야 하는데 체력 자신 있으세요?' },
    { id: 8, category: '청결', question: '매장은 청결이 정말 중요한데, 평소에 정리정돈 잘 하시는 편인가요?' },
    { id: 9, category: '스트레스', question: '일하다 보면 스트레스 받을 때도 있잖아요? 평소에 스트레스는 어떻게 푸세요?' },
    { id: 10, category: '학습', question: '상품 배치, 재고 관리 등 배울 게 많은데 배우는 속도는 어떠세요?' },
    { id: 11, category: '책임감', question: '실수로 가격을 잘못 안내했을 때 어떻게 하실 건가요?' },
    { id: 12, category: '장점', question: '본인의 장점을 딱 하나만 말씀해주신다면?' },
    { id: 13, category: '단점', question: '반대로 개선하고 싶은 부분은 뭐예요?' },
    { id: 14, category: '목표', question: '매장에서 일하게 되면 6개월 뒤에는 어떤 모습이고 싶으세요?' },
    { id: 15, category: '마무리', question: '마지막으로 하고 싶으신 말씀 있으세요?' }
  ],
  fastfood: [
    { id: 1, category: '동기', question: '패스트푸드에서 일하고 싶으신 특별한 이유가 있으세요?' },
    { id: 2, category: '관심도', question: '평소에 패스트푸드 자주 가시는 편인가요? 어떤 점이 좋으세요?' },
    { id: 3, category: '경험', question: '이전에 비슷한 일 해보신 적 있으세요?' },
    { id: 4, category: '팀워크', question: '친구들이랑 같이 뭔가 할 때 주로 어떤 역할 하시나요?' },
    { id: 5, category: '곤란상황1', question: '🍔 실전 상황입니다!\n\n손님이 "햄버거에 피클 빼달라고 했는데 들어있네요? 지금 바로 새로 만들어주세요. 근데 나 지금 급해요"라고 하십니다.\n\n점심 피크타임이라 주문 10개가 대기 중이에요. 어떻게 대응하시겠어요?' },
    { id: 6, category: '곤란상황2', question: '🍔 또 다른 상황입니다!\n\n점심 피크타임 오후 12시 30분, 주문 대기 손님이 20명인데 키오스크가 2대 고장나고 주방에서 "감자튀김 기름 교체 중이에요"라고 합니다.\n\n손님들이 "언제 되냐"고 짜증내고 있어요. 어떻게 하시겠어요?' },
    { id: 7, category: '빠른 대응', question: '패스트푸드는 빠른 속도가 중요한데, 빠르게 일 처리하는 거 자신 있으세요?' },
    { id: 8, category: '청결', question: '음식을 다루는 곳이라 위생이 정말 중요한데, 평소 청결에 신경 쓰시나요?' },
    { id: 9, category: '스트레스', question: '일하다 보면 스트레스 받을 때도 있잖아요? 평소에 스트레스는 어떻게 푸세요?' },
    { id: 10, category: '학습', question: '새로운 메뉴나 기계 사용법 배울 때 보통 얼마나 걸리는 편이세요?' },
    { id: 11, category: '책임감', question: '실수로 주문을 잘못 만들었을 때 어떻게 하실 건가요?' },
    { id: 12, category: '장점', question: '본인의 장점을 딱 하나만 말씀해주신다면?' },
    { id: 13, category: '단점', question: '반대로 개선하고 싶은 부분은 뭐예요?' },
    { id: 14, category: '목표', question: '여기서 일하게 되면 6개월 뒤에는 어떤 모습이고 싶으세요?' },
    { id: 15, category: '마무리', question: '마지막으로 하고 싶으신 말씀 있으세요?' }
  ]
};

export class HybridInterviewEngine {
  private context: InterviewContext;
  private maxQuestions = 15;
  private questionSet: Array<{ id: number; category: string; question: string }>;
  private env: any;

  constructor(
    jobType: 'cafe' | 'cvs' | 'restaurant' | 'retail' | 'fastfood',
    region: string = '서울',
    expectedWage: number = 10000,
    testResult: any = null,
    env: any = null
  ) {
    this.env = env;
    this.questionSet = STRUCTURED_QUESTIONS[jobType];
    
    this.context = {
      interview_id: this.generateUUID(),
      job_type: jobType,
      region: region,
      expected_wage: expectedWage,
      current_step: 0, // 0부터 시작 (첫 질문은 1번)
      conversation_log: [],
      current_scores: {
        reliability: 0,
        job_fit: 0,
        service_mind: 0,
        logistics: 0
      },
      critical_flags: [],
      started_at: new Date().toISOString(),
      user_profile: testResult
    };

    if (testResult) {
      console.log('✅ 적성검사 결과 연동:', {
        type: testResult.resultType?.primary,
        confidence: testResult.confidence
      });
    }
  }

  /**
   * 면접 시작
   */
  startInterview(): InterviewResponse {
    const jobTypeNames = {
      cafe: '카페',
      cvs: '편의점',
      restaurant: '음식점',
      retail: '매장/마트',
      fastfood: '패스트푸드'
    };

    const jobName = jobTypeNames[this.context.job_type];
    
    // 업종별 맞춤형 인트로 메시지
    const jobIntros = {
      cafe: '☕ 카페는 향긋한 커피 향과 함께 손님들의 하루를 응원하는 곳이에요. 음료 제조 실력도 중요하지만, 따뜻한 미소와 친절한 서비스가 더 중요하답니다!',
      cvs: '🏪 편의점은 24시간 우리 동네를 지키는 든든한 곳이에요. 다양한 상품 관리와 계산 업무를 하면서 손님들과 소통하는 일이에요!',
      restaurant: '🍽️ 음식점은 맛있는 음식으로 손님들을 행복하게 만드는 곳이에요. 빠르고 정확한 서빙과 팀워크가 중요한 일이랍니다!',
      retail: '🛒 매장/마트는 다양한 상품을 판매하고 손님들의 쇼핑을 도와드리는 곳이에요. 상품 지식과 친절한 응대가 핵심이에요!',
      fastfood: '🍔 패스트푸드는 빠르고 정확하게 음식을 제공하는 곳이에요. 스피드와 정확성, 그리고 밝은 에너지가 필요한 일이랍니다!'
    };

    const jobIntro = jobIntros[this.context.job_type] || `${jobName}에서 함께 일하게 되어 기대되네요!`;
    
    // 적성검사 결과 기반 개인화 메시지
    let personalityMessage = '';
    if (this.context.user_profile) {
      const personality = this.context.user_profile.resultType?.primary || '균형잡힌';
      const personalityDescriptions = {
        'strategic': '전략적이고 계획적인',
        'analytical': '분석적이고 꼼꼼한',
        'communicative': '소통 능력이 뛰어난',
        'executive': '실행력이 강한'
      };
      const personalityDesc = personalityDescriptions[personality] || personality;
      personalityMessage = `\n\n✨ 적성검사 결과 **${personalityDesc}** 성향이시네요! ${jobName} 일에 정말 잘 맞으실 것 같아요.`;
    }
    
    // 최종 환영 메시지 조합
    const welcomeMessage = `안녕하세요! 😊 ${jobName} 면접을 시작하겠습니다!\n\n${jobIntro}${personalityMessage}\n\n편하게 대화하듯이 이야기 나눠볼게요. 준비되셨나요?\n\n`;

    // 첫 질문
    const firstQuestion = this.questionSet[0];
    this.context.current_step = 1;
    this.context.question_count = 1;

    this.context.conversation_log.push({
      role: 'system',
      content: `${jobName} 면접 시작`,
      timestamp: new Date().toISOString()
    });

    this.context.conversation_log.push({
      role: 'assistant',
      content: welcomeMessage + firstQuestion.question,
      timestamp: new Date().toISOString()
    });

    return {
      status: 'ongoing',
      message: welcomeMessage,
      question: firstQuestion.question,
      progress: `1/${this.maxQuestions}`,
      debug: {
        current_scores: this.context.current_scores,
        questionSource: 'hybrid',
        step: 1,
        category: firstQuestion.category
      }
    };
  }

  /**
   * 답변 처리 + 다음 질문
   */
  async processAnswer(userAnswer: string): Promise<InterviewResponse> {
    try {
      console.log(`🔄 Processing answer: step=${this.context.current_step}, max=${this.maxQuestions}, questionSet.length=${this.questionSet.length}`);
      
      // 1. 답변 저장
      this.context.conversation_log.push({
        role: 'user',
        content: userAnswer,
        timestamp: new Date().toISOString()
      });

      // 2. Critical 답변 체크
      const criticalResult = this.checkCriticalAnswer(userAnswer);
      if (criticalResult && criticalResult.fail) {
        return {
          status: 'rejected',
          message: criticalResult.message,
          result: {
            final_grade: 'F',
            total_score: 40,
            critical_reason: criticalResult.reason
          },
          debug: {
            questionSource: 'critical_fail'
          }
        };
      }

      // 3. 답변 평가 및 점수 업데이트
      const evaluation = this.evaluateAnswer(userAnswer, this.context.current_step);
      this.updateScores(evaluation);

      // 4. 면접 종료 조건 체크
      if (this.context.current_step >= this.maxQuestions) {
        console.log('🏁 Interview complete, finalizing...');
        return this.finalizeInterview();
      }

      // 5. 다음 질문 가져오기 (current_step 증가 전에!)
      console.log(`📍 Fetching question at index: ${this.context.current_step}`);
      const nextQuestion = this.questionSet[this.context.current_step];
      if (!nextQuestion) {
        console.error(`❌ No question found for step ${this.context.current_step}, questionSet.length=${this.questionSet.length}`);
        console.error(`❌ Available questions:`, this.questionSet.map((q, i) => `${i}: ${q.id}`));
        throw new Error(`Question not found for step ${this.context.current_step}`);
      }
      console.log(`✅ Found question: id=${nextQuestion.id}, category=${nextQuestion.category}`);
      
      // 6. GPT-4로 자연스러운 피드백 생성
      const feedback = await this.generateFeedback(userAnswer);
      console.log(`🎨 Generated feedback: "${feedback}"`);

      // 7. current_step 증가
      console.log(`➡️ Incrementing step from ${this.context.current_step} to ${this.context.current_step + 1}`);
      this.context.current_step++;

      // 8. 피드백 + 다음 질문 조합 (화면에 표시될 최종 메시지)
      const fullResponseMessage = feedback ? `${feedback}\n\n${nextQuestion.question}` : nextQuestion.question;
      console.log(`💬 Full response message: "${fullResponseMessage.substring(0, 100)}..."`);

      this.context.conversation_log.push({
        role: 'assistant',
        content: fullResponseMessage,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'ongoing',
        message: fullResponseMessage, // ✨ 피드백 + 질문을 message에 모두 포함
        question: nextQuestion.question, // 별도로도 제공 (호환성)
        progress: `${this.context.current_step}/${this.maxQuestions}`, // ✨ +1 제거 (이미 증가했으므로)
        debug: {
          current_scores: this.context.current_scores,
          evaluation,
          questionSource: 'hybrid',
          hasFeedback: !!feedback,
          feedbackLength: feedback?.length || 0
        }
      };
    } catch (error: any) {
      console.error('❌ processAnswer error:', error);
      throw error; // 에러를 상위로 전파
    }
  }

  /**
   * 🧠 GPT-4로 답변 분석 및 자연스러운 피드백 생성 (스마트 면접관!)
   * 
   * 기존: 단순 추임새 ("좋아요!", "그렇구나!")
   * 개선: 답변 내용을 실제로 이해하고 맥락 기반 피드백 제공
   */
  private async generateFeedback(userAnswer: string): Promise<string | null> {
    if (!this.env?.OPENAI_API_KEY) {
      console.log('⚠️ OPENAI_API_KEY 없음 - 피드백 생략');
      return null;
    }

    try {
      // 5초 타임아웃 설정
      const timeoutPromise = new Promise<string | null>((resolve) => {
        setTimeout(() => {
          console.warn('⏱️ GPT-4 피드백 생성 타임아웃 (5초) - fallback 사용');
          const fallbackFeedbacks = [
            '좋아요! 😊',
            '그렇구나!',
            '잘 말씀해주셨어요!',
            '오~ 괜찮은데요!',
            '흥미로운 답변이네요!'
          ];
          resolve(fallbackFeedbacks[Math.floor(Math.random() * fallbackFeedbacks.length)]);
        }, 5000);
      });

      const gpt4Promise = (async () => {
        const client = new OpenAI({
          apiKey: this.env.OPENAI_API_KEY,
          baseURL: this.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
        });

        // 최근 3턴 대화 맥락
        const recentConversation = this.context.conversation_log.slice(-6).map(entry => 
          `${entry.role === 'user' ? '지원자' : 'AI 면접관'}: ${entry.content}`
        ).join('\n');

        const currentQuestion = this.questionSet[this.context.current_step - 1];
        const currentQuestionCategory = currentQuestion?.category || '기타';
        const currentQuestionText = currentQuestion?.question || '';

        // ✨ 적성검사 결과 기반 맥락 추가
        let personalityContext = '';
        if (this.context.user_profile?.resultType?.primary) {
          const personalityType = this.context.user_profile.resultType.primary;
          const typeDescriptions: { [key: string]: string } = {
            'strategic': '전략적이고 계획적인 성향',
            'analytical': '분석적이고 꼼꼼한 성향',
            'communicative': '소통 능력이 뛰어나고 사교적인 성향',
            'executive': '실행력이 강하고 결과 지향적인 성향'
          };
          const description = typeDescriptions[personalityType] || personalityType;
          personalityContext = `\n\n**지원자 성향**: ${description} (적성검사 결과)\n- 이 정보를 참고하여 더 개인화된 피드백을 제공하세요.`;
        }

        // 🧠 스마트 분석 프롬프트
        const systemPrompt = `당신은 10년 경력의 따뜻하고 **분석 능력이 뛰어난** 면접관입니다.
지원자의 답변 **내용을 실제로 분석**하고 **맥락 기반 피드백**을 제공하세요.

**핵심 원칙:**
1. **답변 내용 이해**: 답변의 핵심을 파악하고 언급하세요
   예: "침착하게 상황을 정리하고 손님들에게 양해를 구하신다는 부분이 좋네요!"
   
2. **구체적 피드백**: 답변의 장점/단점을 구체적으로 언급
   예: "주문을 받으면서 동시에 조리 준비를 하신다는 점이 멀티태스킹 능력을 잘 보여주네요!"
   
3. **공감 + 격려**: 따뜻한 톤 유지
   예: "정말 당황스러운 상황이죠. 하지만 냉정하게 대처하시는 모습이 인상적이에요!"
   
4. **자연스러운 전환**: 다음 질문으로 부드럽게 이어지도록
   
5. **길이**: 1~3문장 (80자 내외, 다음 질문은 시스템이 추가함)

**금지 사항:**
- 질문하지 마세요
- 너무 형식적인 표현
- 평가 점수 언급
- 단순 추임새만 반복 ("좋아요!", "그렇구나!" 등)

**현재 질문**: ${currentQuestionText}
**질문 카테고리**: ${currentQuestionCategory}${personalityContext}

**예시:**
Q: "피크타임에 프라이기가 고장 났을 때 어떻게 대응하시겠어요?"
A: "손님들에게 상황을 설명하고 양해를 구한 뒤, 주문을 받으면서 기름 온도가 오르면 바로 제조합니다."
→ "침착하게 상황을 정리하고 손님들에게 먼저 양해를 구하신다는 점이 좋네요! 주문을 미리 받아두는 것도 효율적인 방법이에요. 👍"

Q: "카페에서 일하고 싶은 이유가 뭐예요?"
A: "커피 향이 좋아서요."
→ "커피 향을 좋아하시는군요! 😊 카페 분위기를 좋아하시는 분들이 일도 즐겁게 하시더라고요."`;

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `**최근 대화 맥락:**
${recentConversation}

**현재 질문:** ${currentQuestionText}

**지원자의 답변:** "${userAnswer}"

위 답변의 **내용을 분석**하고, 구체적이고 자연스러운 피드백을 80자 내외로 제공하세요.` }
          ],
          temperature: 0.8,
          max_tokens: 150
        });

        const feedback = response.choices[0]?.message?.content?.trim() || null;
        
        if (feedback) {
          console.log(`✅ GPT-4 스마트 피드백 생성 성공: "${feedback}"`);
        }
        
        return feedback;
      })();

      // Promise.race로 타임아웃 처리
      const feedback = await Promise.race([gpt4Promise, timeoutPromise]);
      return feedback;

    } catch (error: any) {
      console.error('❌ GPT-4 피드백 생성 실패:', error);
      // 에러 시 기본 피드백 반환 (세션 중단 방지)
      return '잘 말씀해주셨어요! 😊';
    }
  }

  /**
   * Critical 답변 체크
   */
  private checkCriticalAnswer(answer: string): { fail: boolean; reason?: string; message?: string } | null {
    const lower = answer.toLowerCase().trim();

    // 폭력/범죄 관련
    if (lower.includes('때리') || lower.includes('죽이') || lower.includes('훔치')) {
      return {
        fail: true,
        reason: '부적절한 답변 (폭력/범죄)',
        message: '죄송합니다. 부적절한 답변으로 면접을 계속할 수 없습니다.'
      };
    }

    // 업무 거부
    if (lower.includes('안 할') || lower.includes('싫어') && lower.includes('일')) {
      this.context.critical_flags.push('업무 의지 부족');
    }

    return null;
  }

  /**
   * 답변 평가 (개선된 알고리즘)
   */
  private evaluateAnswer(answer: string, questionStep: number): any {
    const lower = answer.toLowerCase().trim();
    const evaluation: any = {
      reliability: 0,
      job_fit: 0,
      service_mind: 0,
      logistics: 0
    };

    // 기본 점수: 답변 길이에 따라
    let baseScore = 3; // 기본 3점
    if (lower.length >= 50) baseScore = 6; // 긴 답변 6점
    else if (lower.length >= 20) baseScore = 5; // 중간 답변 5점
    else if (lower.length >= 10) baseScore = 4; // 짧은 답변 4점
    else baseScore = 2; // 너무 짧은 답변 2점

    // 긍정 키워드 보너스
    const positiveKeywords = [
      '좋아', '열정', '최선', '노력', '배우', '성장', '책임', 
      '경험', '자신', '할 수', '할게', '하겠', '배웠', '배울',
      '관심', '좋은', '잘', '맡', '성실', '정직', '신뢰'
    ];
    
    const negativeKeywords = ['모르겠', '별로', '그냥', '싫', '안', '없'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach(kw => {
      if (lower.includes(kw)) positiveCount++;
    });

    negativeKeywords.forEach(kw => {
      if (lower.includes(kw)) negativeCount++;
    });

    // 긍정 키워드 보너스 (+1점 per keyword, 최대 +5)
    const bonus = Math.min(positiveCount, 5);
    
    // 부정 키워드 페널티 (-1점 per keyword, 최대 -3)
    const penalty = Math.min(negativeCount, 3);
    
    // 최종 점수 (최소 1점, 최대 10점)
    const finalScore = Math.max(1, Math.min(10, baseScore + bonus - penalty));

    console.log(`📊 평가: "${answer.substring(0, 30)}..." → 기본 ${baseScore}점 + 보너스 ${bonus}점 - 페널티 ${penalty}점 = ${finalScore}점`);

    // 카테고리별 점수 분배 (질문 단계에 따라)
    if (questionStep <= 4) {
      // 초반: 동기, 관심도, 경험, 팀워크
      evaluation.job_fit = finalScore;
      evaluation.reliability = Math.floor(finalScore * 0.6);
    } else if (questionStep <= 8) {
      // 중반: 상황대처, 멀티태스킹, 청결, 스트레스
      evaluation.service_mind = finalScore;
      evaluation.logistics = Math.floor(finalScore * 0.6);
    } else {
      // 후반: 학습, 책임감, 장단점, 목표
      evaluation.reliability = finalScore;
      evaluation.job_fit = Math.floor(finalScore * 0.6);
    }

    return evaluation;
  }

  /**
   * 점수 업데이트
   */
  private updateScores(evaluation: any): void {
    this.context.current_scores.reliability += evaluation.reliability || 0;
    this.context.current_scores.job_fit += evaluation.job_fit || 0;
    this.context.current_scores.service_mind += evaluation.service_mind || 0;
    this.context.current_scores.logistics += evaluation.logistics || 0;
  }

  /**
   * 면접 종료 및 결과 생성
   */
  private finalizeInterview(): InterviewResponse {
    const scores = this.context.current_scores;
    const totalScore = scores.reliability + scores.job_fit + scores.service_mind + scores.logistics;
    const avgScore = Math.round(totalScore / 4);

    console.log(`🎯 최종 점수: 신뢰도 ${scores.reliability}, 직무적합도 ${scores.job_fit}, 서비스마인드 ${scores.service_mind}, 업무처리 ${scores.logistics} → 평균 ${avgScore}점`);

    // 등급 계산 (더 관대하게 조정)
    let finalGrade = 'C';
    if (avgScore >= 35) finalGrade = 'S';
    else if (avgScore >= 28) finalGrade = 'A';
    else if (avgScore >= 20) finalGrade = 'B';
    else if (avgScore >= 12) finalGrade = 'C';
    else finalGrade = 'D';

    console.log(`🏆 최종 등급: ${finalGrade} (평균 ${avgScore}점)`);

    // 한 줄 평가
    const oneLiner = this.generateOneLiner(finalGrade, this.context.job_type);

    // 강점 및 관심사항
    const strengths = this.generateStrengths(scores);
    const concerns = this.generateConcerns(scores);
    const recommendation = this.generateRecommendation(finalGrade);

    return {
      status: 'completed',
      message: '수고하셨어요! 😊\n면접 결과는 곧 알려드릴게요!',
      result: {
        final_grade: finalGrade,
        total_score: avgScore,
        detailed_scores: scores,
        one_liner: oneLiner,
        strengths,
        concerns,
        recommendation
      },
      debug: {
        questionSource: 'completion',
        total_questions: this.context.current_step
      }
    };
  }

  /**
   * 한 줄 평가 생성
   */
  private generateOneLiner(grade: string, jobType: string): string {
    const jobNames = {
      cafe: '카페',
      cvs: '편의점',
      restaurant: '음식점',
      retail: '매장',
      fastfood: '패스트푸드'
    };

    const gradeMessages = {
      S: `${jobNames[jobType]} 전문가 수준! 👑`,
      A: `${jobNames[jobType]}에 정말 잘 맞으실 것 같아요! 👍`,
      B: `${jobNames[jobType]}에서 충분히 잘 하실 수 있어요!`,
      C: `기본기는 괜찮지만 조금 더 노력이 필요해요!`,
      D: `아직 준비가 더 필요해 보여요.`
    };

    return gradeMessages[grade] || gradeMessages['C'];
  }

  /**
   * 강점 생성
   */
  private generateStrengths(scores: any): string[] {
    const strengths: string[] = [];
    
    if (scores.reliability >= 30) strengths.push('책임감이 강함');
    else if (scores.reliability >= 20) strengths.push('기본적인 신뢰도 확보');
    
    if (scores.job_fit >= 30) strengths.push('직무 적합도가 높음');
    else if (scores.job_fit >= 20) strengths.push('직무에 대한 이해도 양호');
    
    if (scores.service_mind >= 30) strengths.push('고객 서비스 마인드 우수');
    else if (scores.service_mind >= 20) strengths.push('서비스 태도 긍정적');
    
    if (scores.logistics >= 30) strengths.push('업무 처리 능력 뛰어남');
    else if (scores.logistics >= 20) strengths.push('기본 업무 수행 가능');
    
    return strengths.length > 0 ? strengths : ['성실한 태도'];
  }

  /**
   * 관심사항 생성
   */
  private generateConcerns(scores: any): string[] {
    const concerns: string[] = [];
    
    if (scores.reliability < 15) concerns.push('책임감 향상 필요');
    if (scores.job_fit < 15) concerns.push('직무 이해도 개선 필요');
    if (scores.service_mind < 15) concerns.push('고객 서비스 마인드 보완 필요');
    if (scores.logistics < 15) concerns.push('업무 처리 능력 개발 필요');
    
    return concerns.length > 0 ? concerns : ['특별한 관심사항 없음'];
  }

  /**
   * 추천 사항 생성
   */
  private generateRecommendation(grade: string): string {
    const recommendations = {
      S: '즉시 채용 추천',
      A: '적극 채용 추천',
      B: '채용 고려 가능',
      C: '추가 교육 후 채용 고려',
      D: '채용 보류'
    };
    
    return recommendations[grade] || recommendations['C'];
  }

  /**
   * UUID 생성
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 컨텍스트 반환
   */
  getContext(): InterviewContext {
    return this.context;
  }

  /**
   * ✨ 세션 직렬화 (D1 저장용)
   * 엔진의 모든 상태를 JSON 호환 객체로 변환
   */
  serialize(): any {
    return {
      context: this.context,
      maxQuestions: this.maxQuestions,
      questionSet: this.questionSet,
      // env는 직렬화하지 않음 (복원 시 다시 주입)
    };
  }

  /**
   * ✨ 세션 역직렬화 (D1 복원용)
   * 직렬화된 데이터에서 엔진 상태 복원
   */
  static deserialize(serializedData: any, env: any = null): HybridInterviewEngine {
    // 빈 엔진 생성 (생성자를 우회)
    const engine = Object.create(HybridInterviewEngine.prototype);
    
    // 상태 복원
    engine.context = serializedData.context;
    engine.maxQuestions = serializedData.maxQuestions || 15;
    engine.questionSet = serializedData.questionSet;
    engine.env = env;
    
    console.log('✅ Engine deserialized:', {
      jobType: engine.context.job_type,
      currentStep: engine.context.current_step,
      questionCount: engine.context.conversation_log.length
    });
    
    return engine;
  }
}

export default HybridInterviewEngine;
