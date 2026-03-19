/**
 * 🐝 알비 AI 면접 엔진 (Phase 1 핵심)
 * 실전 면접 진행, 실시간 평가, Critical 질문 처리
 */

import { 
  ALBI_SYSTEM_PROMPT, 
  JOB_TYPE_CRITICAL_QUESTIONS,
  INTERVIEW_COMPLETE_MESSAGES 
} from './ai-interview-prompts';
import { EVALUATION_SYSTEM } from './ai-interview-complete-dataset';
import { EXCEPTION_HANDLER, REGIONAL_EVALUATION } from './ai-interview-advanced-systems';
import { AdvancedSituationHandler } from './ai-interview-advanced-handler';
import { generateDynamicQuestion, analyzeAnswerDepth } from './gpt-helper';

interface InterviewContext {
  interview_id: string;
  job_type: 'cafe' | 'cvs' | 'restaurant' | 'retail' | 'fastfood';
  region: string;
  expected_wage: number;
  current_step: string;
  question_count: number;
  conversation_log: Array<{ role: string; content: string; timestamp: string }>;
  current_scores: {
    reliability: number;
    job_fit: number;
    service_mind: number;
    logistics: number;
  };
  critical_flags: string[];
  started_at: string;
  user_profile?: any;
}

interface InterviewResponse {
  status: 'ongoing' | 'completed' | 'rejected';
  message: string;
  question?: string;
  progress?: string;
  result?: any;
  debug?: any;
}

export class AlbiInterviewEngine {
  private context: InterviewContext;
  private maxQuestions = 15;
  private minQuestions = 8;
  private criticalQuestionsAsked = new Set<string>();
  private askedQuestions = new Set<string>(); // 이미 물어본 질문 추적
  private env: any; // Cloudflare 환경 변수

  constructor(
    jobType: 'cafe' | 'cvs' | 'restaurant' | 'retail' | 'fastfood',
    region: string = '서울',
    expectedWage: number = 10000,
    testResult: any = null, // ✨ 적성검사 결과 받기
    env: any = null // ✨ Cloudflare 환경 변수
  ) {
    this.env = env;
    this.context = {
      interview_id: this.generateUUID(),
      job_type: jobType,
      region: region,
      expected_wage: expectedWage,
      current_step: 'intro',
      question_count: 0,
      conversation_log: [],
      current_scores: {
        reliability: 0,
        job_fit: 0,
        service_mind: 0,
        logistics: 0
      },
      critical_flags: [],
      started_at: new Date().toISOString(),
      user_profile: testResult // ✨ 적성검사 결과 저장
    };
    
    // ✨ 적성검사 결과가 있으면 로그 출력
    if (testResult) {
      console.log('✅ 적성검사 결과 연동 완료:', {
        type: testResult.resultType?.primary,
        confidence: testResult.confidence,
        dimensions: testResult.dimensions
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

    // ✨ 적성검사 결과 기반 인사말
    let personalizedIntro = '';
    if (this.context.user_profile) {
      const testType = this.context.user_profile.resultType?.primary || '';
      const typeNames: any = {
        'strategy': '전략형',
        'execution': '실행형',
        'innovation': '혁신형',
        'harmony': '조화형'
      };
      const typeName = typeNames[testType] || '귀하';
      personalizedIntro = `\n\n적성검사 결과를 보니 ${typeName}이시네요! 그 특성을 고려해서 질문 드릴게요. 😊`;
    }
    
    const introMessage = `안녕하세요! 저는 ${jobTypeNames[this.context.job_type]} 전문 면접관 알비예요 🐝

편하게 대화하는 느낌으로 진행할 거예요. 
총 ${this.minQuestions}~${this.maxQuestions}개 질문 정도 예상되고, 약 8분 정도 걸려요.${personalizedIntro}

준비되셨으면 시작할게요!`;

    const firstQuestion = this.getFirstQuestion();
    
    this.context.conversation_log.push({
      role: 'assistant',
      content: introMessage + '\n\n' + firstQuestion,
      timestamp: new Date().toISOString()
    });

    this.context.question_count = 1;

    return {
      status: 'ongoing',
      message: introMessage,
      question: firstQuestion,
      progress: `${this.context.question_count}/${this.maxQuestions}`,
      debug: {
        questionSource: 'initial',
        current_scores: this.context.current_scores
      }
    };
  }

  /**
   * 답변 처리 및 다음 질문 생성
   */
  async processAnswer(userAnswer: string): Promise<InterviewResponse> {
    // 대화 기록 추가
    this.context.conversation_log.push({
      role: 'user',
      content: userAnswer,
      timestamp: new Date().toISOString()
    });

    // 1. 기존 예외 상황 체크 (폴백) - AdvancedSituationHandler는 GPT-4 실패 시에만 사용
    const exceptionResult = this.checkException(userAnswer);
    if (exceptionResult) {
      // ⚠️ Critical: followUp 질문도 askedQuestions에 추가하여 중복 방지
      this.askedQuestions.add(exceptionResult.followUp);
      this.context.question_count++;
      
      this.context.conversation_log.push({
        role: 'assistant',
        content: exceptionResult.response + '\n\n' + exceptionResult.followUp,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'ongoing',
        message: exceptionResult.response,
        question: exceptionResult.followUp,
        progress: `${this.context.question_count}/${this.maxQuestions}`,
        debug: {
          questionSource: 'exception',
          current_scores: this.context.current_scores
        }
      };
    }

    // 2. Critical 질문 체크
    const criticalResult = this.checkCriticalAnswer(userAnswer);
    if (criticalResult && criticalResult.fail) {
      return this.handleRejection(criticalResult.reason);
    }

    // 3. 답변 평가 (키워드 기반)
    const evaluation = this.evaluateAnswer(userAnswer);
    
    // 4. 점수 업데이트
    this.updateScores(evaluation);

    // 5. 면접 종료 조건 체크
    if (this.shouldEndInterview()) {
      return this.finalizeInterview();
    }

    // 6. ✨ 항상 GPT-4로 다음 질문 생성 시도
    console.log('🤖 GPT-4 동적 질문 생성 시도...');
    try {
      const dynamicQuestion = await generateDynamicQuestion({
        jobType: this.context.job_type,
        testResult: this.context.user_profile,
        conversationHistory: this.context.conversation_log,
        lastAnswer: userAnswer,
        questionCount: this.context.question_count
      }, this.env);
      
      this.context.question_count++;
      
      const responseMessage = this.generateResponseMessage(evaluation);
      const fullResponse = responseMessage ? responseMessage + '\n\n' + dynamicQuestion : dynamicQuestion;
      
      this.context.conversation_log.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ GPT-4 질문 사용:', dynamicQuestion.substring(0, 50) + '...');
      
      return {
        status: 'ongoing',
        message: responseMessage,
        question: dynamicQuestion,
        progress: `${this.context.question_count}/${this.maxQuestions}`,
        debug: {
          current_scores: this.context.current_scores,
          evaluation: evaluation,
          questionSource: 'GPT-4'
        }
      };
    } catch (error) {
      console.error('❌ GPT-4 질문 생성 실패, 기본 로직 사용:', error);
    }
    
    // 7. 폴백: 고급 상황 대응 체크
    const advancedResponse = AdvancedSituationHandler.handle(userAnswer, this.context);
    if (advancedResponse && advancedResponse.detected) {
      console.log('📋 Using AdvancedSituationHandler fallback');
      this.askedQuestions.add(advancedResponse.followUp);
      this.context.question_count++;
      
      // 점수 조정 (있는 경우)
      if (advancedResponse.score_adjustment) {
        const category = advancedResponse.category.includes('reliability') ? 'reliability' :
                        advancedResponse.category.includes('service') ? 'service_mind' : 'job_fit';
        this.context.current_scores[category as keyof typeof this.context.current_scores] += advancedResponse.score_adjustment;
      }
      
      this.context.conversation_log.push({
        role: 'assistant',
        content: advancedResponse.response + '\n\n' + advancedResponse.followUp,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'ongoing',
        message: advancedResponse.response,
        question: advancedResponse.followUp,
        progress: `${this.context.question_count}/${this.maxQuestions}`,
        debug: {
          questionSource: 'advanced-handler',
          situation: advancedResponse.category,
          current_scores: this.context.current_scores
        }
      };
    }
    
    // 8. 최종 폴백: 기본 질문 생성 로직
    const nextQuestion = this.generateNextQuestion(evaluation);
    this.context.question_count++;

    const responseMessage = this.generateResponseMessage(evaluation);
    
    this.context.conversation_log.push({
      role: 'assistant',
      content: responseMessage + '\n\n' + nextQuestion,
      timestamp: new Date().toISOString()
    });

    console.log('⚠️ 기본 질문 사용:', nextQuestion.substring(0, 50) + '...');

    return {
      status: 'ongoing',
      message: responseMessage,
      question: nextQuestion,
      progress: `${this.context.question_count}/${this.maxQuestions}`,
      debug: {
        current_scores: this.context.current_scores,
        evaluation: evaluation,
        questionSource: 'fallback'
      }
    };
  }

  /**
   * 첫 질문 생성
   */
  private getFirstQuestion(): string {
    const jobTypeQuestions = {
      cafe: '먼저 카페에서 일하고 싶은 이유를 말씀해주세요! 😊',
      cvs: '먼저 편의점에서 일하고 싶은 이유를 말씀해주세요! 😊',
      restaurant: '먼저 음식점에서 일하고 싶은 이유를 말씀해주세요! 😊',
      retail: '먼저 매장/마트에서 일하고 싶은 이유를 말씀해주세요! 😊',
      fastfood: '먼저 패스트푸드점에서 일하고 싶은 이유를 말씀해주세요! 😊'
    };

    return jobTypeQuestions[this.context.job_type];
  }

  /**
   * 예외 상황 체크 (애매한 답변, 거짓말 의심 등)
   * ✨ 다양한 followUp 질문으로 같은 질문 반복 방지
   */
  private checkException(answer: string): { response: string; followUp: string } | null {
    // A. 애매/회피 답변
    const vaguePatterns = ['그냥요', '모르겠어요', '글쎄요', '별로', '잘 모르겠', '음...'];
    if (vaguePatterns.some(pattern => answer.includes(pattern))) {
      const followUps = [
        '예를 들어, 이전에 비슷한 경험이 있으셨나요?',
        '구체적으로 어떤 상황이 떠오르시나요?',
        '혹시 관련된 일을 해보신 적이 있으신가요?',
        '어떤 점이 궁금하신가요?'
      ];
      return {
        response: '긴장하셨나 봐요! 편하게 생각나는 대로 말씀해주세요 😊',
        followUp: this.getUnaskedQuestion(followUps) || followUps[0]
      };
    }

    // B. 과장 의심
    const exaggerationPatterns = ['모든 것', '완벽하게', '전부 다', '100%', '항상'];
    if (exaggerationPatterns.some(pattern => answer.includes(pattern))) {
      const followUps = [
        '실제 경험을 예로 들어주시면 더 좋을 것 같아요!',
        '그때 구체적으로 어떤 일이 있었나요?',
        '인상 깊었던 순간을 하나만 말씀해주세요!',
        '특히 기억에 남는 사례가 있나요?'
      ];
      return {
        response: '오~ 대단하시네요! 그럼 구체적으로 어떻게 하셨어요?',
        followUp: this.getUnaskedQuestion(followUps) || followUps[0]
      };
    }

    // C. 부정적 태도
    const negativePatterns = ['별로', '싫어', '못 해', '귀찮아', '안 할래요'];
    if (negativePatterns.some(pattern => answer.includes(pattern))) {
      const followUps = [
        '그 부분을 개선할 수 있는 환경이라면 어떠세요?',
        '어떤 조건이라면 가능하실까요?',
        '더 나은 방법은 없을까요?',
        '다른 관점에서 생각해보시면 어떠세요?'
      ];
      return {
        response: '그런 경험이 있으셨나 봐요. 구체적으로 무엇이 힘들었나요?',
        followUp: this.getUnaskedQuestion(followUps) || followUps[0]
      };
    }

    return null;
  }

  /**
   * Critical 질문 답변 체크
   */
  private checkCriticalAnswer(answer: string): { fail: boolean; reason: string } | null {
    const criticalQuestions = JOB_TYPE_CRITICAL_QUESTIONS[this.context.job_type];
    const lastQuestion = this.context.conversation_log[this.context.conversation_log.length - 2]?.content;

    for (const critical of criticalQuestions) {
      if (lastQuestion && lastQuestion.includes(critical.question)) {
        // 탈락 키워드 체크
        const hasFail = critical.fail_keywords.some(keyword => 
          answer.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasFail) {
          return {
            fail: true,
            reason: `${critical.category} 영역에서 치명적 답변 감지`
          };
        }

        // 합격 키워드 체크
        const hasPass = critical.pass_keywords.some(keyword =>
          answer.toLowerCase().includes(keyword.toLowerCase())
        );

        // 유연한 답변 인정: 
        // 1) 합격 키워드가 있거나
        // 2) 답변 길이가 2자 이상이고 부정 표현이 아니면 일단 통과
        // 3) 빈 답변이나 1자만 있으면 탈락
        const hasNegative = /안.*돼|못.*해|불가능|싫어|거부|거절/.test(answer.toLowerCase());
        
        if (answer.trim().length < 2) {
          return {
            fail: true,
            reason: `${critical.category} 영역에서 불충분한 답변 (너무 짧음)`
          };
        }
        
        // 합격 키워드도 없고 부정 표현이 강할 때만 탈락
        if (!hasPass && hasNegative) {
          return {
            fail: true,
            reason: `${critical.category} 영역에서 부정적 답변`
          };
        }
      }
    }

    return null;
  }

  /**
   * 답변 평가 (확장된 긍정/부정 인식 + 문맥 분석)
   */
  private evaluateAnswer(answer: string): {
    reliability: number;
    job_fit: number;
    service_mind: number;
    logistics: number;
  } {
    const scores = {
      reliability: 0,
      job_fit: 0,
      service_mind: 0,
      logistics: 0
    };

    const lower = answer.toLowerCase();

    // ========================================
    // 1. 긍정 표현 인식 (100+ 패턴)
    // ========================================
    const positivePatterns = [
      // 직접적 긍정
      /^네[\.!,\s]?$/, /^예[\.!,\s]?$/, /^응[\.!,\s]?$/, /^그럼요[\.!,\s]?$/, /^당연하죠[\.!,\s]?$/,
      /^맞아요[\.!,\s]?$/, /^그렇죠[\.!,\s]?$/, /^좋아요[\.!,\s]?$/, /^오케이[\.!,\s]?$/,
      
      // 가능/능력 표현
      /가능해요/, /가능합니다/, /할 수 있어요/, /할 수 있습니다/, /문제없어요/, /문제없습니다/,
      /괜찮아요/, /괜찮습니다/, /대응.*가능/, /처리.*가능/, /할 줄 알/, /잘 할/, /자신.*있/,
      
      // 경험 표현
      /있어요/, /있습니다/, /했어요/, /했습니다/, /해봤어요/, /해봤습니다/, /해본 적/, /경험.*있/,
      /일.*해본/, /일.*했던/, /근무.*했/, /근무.*경험/, /\d+년/, /\d+개월/, /\d+달/,
      
      // 긍정적 태도
      /좋아해요/, /좋아합니다/, /즐거워요/, /재밌어요/, /흥미로워요/, /관심.*있/,
      /열심히/, /성실하게/, /책임감/, /노력/, /최선/, /신경.*쓰/,
      
      // 구체적 정보 (브랜드명, 업종명)
      /스타벅스/, /투썸/, /이디야/, /CU/, /GS25/, /세븐/, /이마트/, /롯데/,
      /카페/, /편의점/, /음식점/, /식당/, /매장/, /레스토랑/, /바리스타/, /캐셔/
    ];

    // ========================================
    // 2. 부정 표현 인식 (50+ 패턴)
    // ========================================
    const negativePatterns = [
      // 직접적 부정
      /^아니[요\.!,\s]?$/, /^아뇨[\.!,\s]?$/, /^노[\.!,\s]?$/, /^싫어[요\.!,\s]?$/,
      
      // 불가능 표현
      /못.*해요/, /못.*합니다/, /안.*돼요/, /안.*됩니다/, /불가능/, /어려워요/, /어렵습니다/,
      /힘들어요/, /힘듭니다/, /무리/, /버거워/,
      
      // 부정적 태도
      /싫어/, /별로/, /관심.*없/, /귀찮/, /스트레스/, /부담/, /피곤/, /지쳐/,
      /대충/, /적당히/, /그냥/, /뭐/, /글쎄/,
      
      // 경험/능력 부족
      /경험.*없/, /해본.*적.*없/, /모르겠/, /잘 모르/, /처음/, /첫/
    ];

    // ========================================
    // 3. 긍정/부정 매칭 및 점수 계산
    // ========================================
    let positiveCount = 0;
    let negativeCount = 0;

    for (const pattern of positivePatterns) {
      if (pattern.test(lower)) {
        positiveCount++;
      }
    }

    for (const pattern of negativePatterns) {
      if (pattern.test(lower)) {
        negativeCount++;
      }
    }

    // ========================================
    // 4. 문맥 기반 점수 부여
    // ========================================
    
    // 긍정 신호가 강할 때
    if (positiveCount > negativeCount) {
      scores.reliability += positiveCount * 3;
      scores.job_fit += positiveCount * 3;
      scores.service_mind += positiveCount * 2;
      scores.logistics += positiveCount * 2;
    }
    
    // 부정 신호가 강할 때
    if (negativeCount > positiveCount) {
      scores.reliability -= negativeCount * 2;
      scores.job_fit -= negativeCount * 2;
      scores.service_mind -= negativeCount * 2;
      scores.logistics -= negativeCount * 1;
    }

    // ========================================
    // 5. 구체적 정보 보너스
    // ========================================
    
    // 숫자/기간 포함 시 (예: "3년", "6개월")
    if (/\d+[년개월달주일]/.test(answer)) {
      scores.reliability += 5;
      scores.job_fit += 5;
    }

    // 브랜드명 포함 시 (예: "스타벅스", "CU")
    if (/스타벅스|투썸|이디야|파스쿠찌|할리스|CU|GS25|세븐|이마트/.test(answer)) {
      scores.job_fit += 5;
      scores.reliability += 3;
    }

    // 직무명 포함 시 (예: "바리스타", "캐셔")
    if (/바리스타|캐셔|서빙|주방|매니저|알바|아르바이트/.test(answer)) {
      scores.job_fit += 4;
    }

    // ========================================
    // 6. 답변 길이 보정 (유연한 평가)
    // ========================================
    
    // 짧은 답변도 수용 (1자 이상이면 일단 긍정)
    if (answer.trim().length >= 1) {
      scores.reliability += 1;
      scores.job_fit += 1;
    }

    // 중간 길이 (10자 이상)
    if (answer.length >= 10) {
      scores.reliability += 2;
      scores.job_fit += 2;
    }

    // 상세한 답변 (50자 이상)
    if (answer.length >= 50) {
      scores.reliability += 3;
      scores.job_fit += 3;
      scores.service_mind += 2;
    }

    // ========================================
    // 7. 기본 긍정 점수 (너무 엄격하지 않게)
    // ========================================
    // 부정이 아니면 일단 중립~긍정으로 간주
    if (negativeCount === 0) {
      scores.reliability += 2;
      scores.job_fit += 2;
      scores.service_mind += 1;
      scores.logistics += 1;
    }

    return scores;
  }

  /**
   * 점수 업데이트
   */
  private updateScores(evaluation: {
    reliability: number;
    job_fit: number;
    service_mind: number;
    logistics: number;
  }): void {
    this.context.current_scores.reliability += evaluation.reliability;
    this.context.current_scores.job_fit += evaluation.job_fit;
    this.context.current_scores.service_mind += evaluation.service_mind;
    this.context.current_scores.logistics += evaluation.logistics;

    // 점수 범위 제한 (0-35, 0-30, 0-25, 0-10)
    this.context.current_scores.reliability = Math.max(0, Math.min(35, this.context.current_scores.reliability));
    this.context.current_scores.job_fit = Math.max(0, Math.min(30, this.context.current_scores.job_fit));
    this.context.current_scores.service_mind = Math.max(0, Math.min(25, this.context.current_scores.service_mind));
    this.context.current_scores.logistics = Math.max(0, Math.min(10, this.context.current_scores.logistics));
  }

  /**
   * 면접 종료 조건 체크
   */
  private shouldEndInterview(): boolean {
    // 최소 질문 수 미달
    if (this.context.question_count < this.minQuestions) {
      return false;
    }

    // 최대 질문 수 도달
    if (this.context.question_count >= this.maxQuestions) {
      return true;
    }

    // Critical 질문 모두 물어봤는지 체크
    const criticalQuestions = JOB_TYPE_CRITICAL_QUESTIONS[this.context.job_type];
    const askedAll = criticalQuestions.every(q => this.criticalQuestionsAsked.has(q.id));

    // 충분한 점수 수집 & Critical 질문 완료
    if (this.context.question_count >= this.minQuestions && askedAll) {
      return true;
    }

    return false;
  }

  /**
   * 다음 질문 생성 (중복 방지 + 다양한 질문)
   */
  private generateNextQuestion(evaluation: any): string {
    // 1. Critical 질문 우선
    const criticalQuestions = JOB_TYPE_CRITICAL_QUESTIONS[this.context.job_type];
    for (const critical of criticalQuestions) {
      if (!this.criticalQuestionsAsked.has(critical.id)) {
        this.criticalQuestionsAsked.add(critical.id);
        this.askedQuestions.add(critical.question);
        return critical.question;
      }
    }

    // 2. 점수 부족 영역 질문 (다양한 질문 풀)
    const scores = this.context.current_scores;
    
    // Reliability 영역 질문 풀
    if (scores.reliability < 20) {
      const reliabilityQuestions = [
        '무단 결근이나 지각을 하지 않으려면 어떻게 관리하시나요?',
        '약속한 시간을 지키는 것이 어려울 때는 어떻게 하시나요?',
        '업무 중 실수를 했을 때 어떻게 대처하시나요?',
        '책임감 있게 일했던 경험을 말씀해주세요.'
      ];
      const question = this.getUnaskedQuestion(reliabilityQuestions);
      if (question) return question;
    }
    
    // Job Fit 영역 질문 풀
    if (scores.job_fit < 15) {
      const jobFitQuestions = [
        '이 일을 배우는 데 얼마나 시간이 걸릴 것 같나요?',
        '비슷한 업무 경험이 있으신가요?',
        '새로운 일을 배울 때 어떤 방식을 선호하시나요?',
        '이 업종에서 일하고 싶은 특별한 이유가 있나요?'
      ];
      const question = this.getUnaskedQuestion(jobFitQuestions);
      if (question) return question;
    }
    
    // Service Mind 영역 질문 풀
    if (scores.service_mind < 12) {
      const serviceMindQuestions = [
        '까다로운 손님을 만나면 어떻게 대처하시겠어요?',
        '손님이 불만을 제기하면 어떻게 하시겠어요?',
        '친절하게 응대했던 경험을 말씀해주세요.',
        '바쁜 시간에 여러 손님을 동시에 응대해야 한다면 어떻게 하시겠어요?'
      ];
      const question = this.getUnaskedQuestion(serviceMindQuestions);
      if (question) return question;
    }

    // 3. 일반 질문 (다양한 질문 풀)
    const generalQuestions = [
      // 팀워크
      '팀으로 일하는 것과 혼자 일하는 것 중 어느 게 더 편하신가요?',
      '동료와 의견이 다를 때 어떻게 해결하시나요?',
      
      // 스트레스 관리
      '스트레스를 받았을 때 어떻게 해소하시나요?',
      '힘든 일이 있을 때 어떻게 극복하시나요?',
      
      // 경험
      '이전 알바에서 가장 좋았던 점은 무엇이었나요?',
      '이전 알바에서 가장 힘들었던 점은 무엇이었나요?',
      '알바를 하면서 가장 뿌듯했던 순간은 언제였나요?',
      
      // 근무 조건
      '장기적으로 이 일을 하실 의향이 있으신가요?',
      '주말이나 공휴일 근무도 가능하신가요?',
      '선호하는 근무 시간대가 있으신가요?',
      
      // 기타
      '이 업종에서 가장 중요하다고 생각하는 것은 무엇인가요?',
      '마지막으로 하고 싶은 말씀이나 궁금한 점 있으신가요?'
    ];

    const question = this.getUnaskedQuestion(generalQuestions);
    if (question) return question;

    // 4. 모든 질문을 다 물어봤으면 마무리 질문
    return '마지막으로 추가로 말씀하고 싶은 것이 있으신가요?';
  }

  /**
   * 아직 물어보지 않은 질문 가져오기
   */
  private getUnaskedQuestion(questions: string[]): string | null {
    const unasked = questions.filter(q => !this.askedQuestions.has(q));
    if (unasked.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unasked.length);
    const selectedQuestion = unasked[randomIndex];
    this.askedQuestions.add(selectedQuestion);
    return selectedQuestion;
  }

  /**
   * 응답 메시지 생성
   */
  private generateResponseMessage(evaluation: any): string {
    // ========================================
    // 더 유연하고 긍정적인 피드백 (50+ 패턴)
    // ========================================
    
    const totalScore = evaluation.reliability + evaluation.job_fit + evaluation.service_mind + evaluation.logistics;

    // 1. 매우 긍정적 답변 (점수 15+)
    if (totalScore >= 15) {
      const veryPositive = [
        '오! 정말 좋은 답변이에요! 👏',
        '완벽해요! 그런 경험이 큰 도움이 될 거예요 ✨',
        '대단하네요! 정말 인상적이에요 🌟',
        '와! 그런 자세라면 어디서든 환영받으실 거예요 💪',
        '그렇군요! 훌륭한 태도예요 🎯'
      ];
      return veryPositive[Math.floor(Math.random() * veryPositive.length)];
    }

    // 2. 긍정적 답변 (점수 8-14)
    if (totalScore >= 8) {
      const positive = [
        '네, 잘 들었어요! 😊',
        '좋아요! 그런 생각이시군요 👍',
        '그렇군요! 잘 이해했어요 ✓',
        '감사합니다! 좋은 답변이에요 🙂',
        '알겠습니다! 다음으로 넘어갈게요 ➡️',
        '오케이! 충분히 이해했어요 ✅',
        '네네, 알겠어요! 👌',
        '그런 경험이시군요! 😄'
      ];
      return positive[Math.floor(Math.random() * positive.length)];
    }

    // 3. 중립적 답변 (점수 3-7)
    if (totalScore >= 3) {
      const neutral = [
        '네, 이해했어요!',
        '알겠습니다! 감사합니다',
        '그렇군요! 다음 질문 드릴게요',
        '좋아요! 계속 진행할게요',
        '오케이! 다음으로 넘어가볼까요?',
        '네, 듣고 있어요! 😊'
      ];
      return neutral[Math.floor(Math.random() * neutral.length)];
    }

    // 4. 약간 부정적 답변 (점수 0-2) - 격려
    if (totalScore >= 0) {
      const encouraging = [
        '그렇군요! 솔직하게 말씀해주셔서 감사해요 😊',
        '네, 충분히 이해해요! 다음 질문으로 넘어갈게요',
        '알겠어요! 다른 부분도 알아볼게요',
        '괜찮아요! 편하게 대답해주세요 🙂',
        '네네, 그럴 수 있죠! 다음 질문 드릴게요'
      ];
      return encouraging[Math.floor(Math.random() * encouraging.length)];
    }

    // 5. 부정적 답변 (점수 음수) - 공감 + 격려
    const empathetic = [
      '그런 경험이 있으셨군요. 솔직하게 말씀해주셔서 감사해요 😊',
      '네, 이해해요! 누구나 그럴 수 있어요 🙂',
      '괜찮아요! 편하게 생각나는 대로 말씀해주세요',
      '알겠습니다! 다른 측면도 살펴볼게요',
      '네네, 충분히 공감해요! 다음 질문으로 넘어갈게요'
    ];
    return empathetic[Math.floor(Math.random() * empathetic.length)];
  }

  /**
   * 탈락 처리
   */
  private handleRejection(reason: string): InterviewResponse {
    const totalScore = 0; // F급은 0점
    const grade = 'F';

    const result = {
      interview_id: this.context.interview_id,
      job_type: this.context.job_type,
      final_grade: grade,
      total_score: totalScore,
      scores: this.context.current_scores,
      recommendation: '비추천',
      trial_focus: '',
      one_liner: reason,
      strengths: [],
      concerns: [reason],
      critical_fail: true,
      critical_reason: reason,
      interview_duration: this.calculateDuration(),
      question_count: this.context.question_count,
      timestamp: new Date().toISOString()
    };

    const completeMsg = INTERVIEW_COMPLETE_MESSAGES[grade];

    return {
      status: 'rejected',
      message: `${completeMsg.emoji} ${completeMsg.title}\n\n${completeMsg.message}\n\n사유: ${reason}`,
      result: result
    };
  }

  /**
   * 면접 완료 및 최종 결과
   */
  private finalizeInterview(): InterviewResponse {
    // 총점 계산
    const totalScore = 
      this.context.current_scores.reliability +
      this.context.current_scores.job_fit +
      this.context.current_scores.service_mind +
      this.context.current_scores.logistics;

    // 등급 결정
    const grade = this.calculateGrade(totalScore);

    // 강점/주의사항 추출
    const strengths = this.extractStrengths();
    const concerns = this.extractConcerns();

    // 추천 메시지
    const recommendation = this.getRecommendation(grade);

    const result = {
      interview_id: this.context.interview_id,
      job_type: this.context.job_type,
      final_grade: grade,
      total_score: totalScore,
      scores: this.context.current_scores,
      recommendation: recommendation,
      trial_focus: this.getTrialFocus(grade),
      one_liner: this.getOneLiner(grade, totalScore),
      strengths: strengths,
      concerns: concerns,
      critical_fail: false,
      critical_reason: '',
      interview_duration: this.calculateDuration(),
      question_count: this.context.question_count,
      timestamp: new Date().toISOString()
    };

    const completeMsg = INTERVIEW_COMPLETE_MESSAGES[grade];

    return {
      status: 'completed',
      message: `${completeMsg.emoji} ${completeMsg.title}\n\n${completeMsg.message}\n\n알비가 사장님께 전달해드릴게요! ✨`,
      result: result
    };
  }

  /**
   * 등급 계산
   */
  private calculateGrade(totalScore: number): 'S' | 'A' | 'B' | 'C' | 'F' {
    if (totalScore >= 90) return 'S';
    if (totalScore >= 75) return 'A';
    if (totalScore >= 60) return 'B';
    if (totalScore >= 40) return 'C';
    return 'F';
  }

  /**
   * 강점 추출
   */
  private extractStrengths(): string[] {
    const strengths: string[] = [];
    const scores = this.context.current_scores;

    if (scores.reliability >= 25) strengths.push('성실성과 책임감이 뛰어남');
    if (scores.job_fit >= 20) strengths.push('직무 적합도가 높음');
    if (scores.service_mind >= 18) strengths.push('서비스 마인드가 우수함');
    if (scores.logistics >= 8) strengths.push('근무 조건 매칭 우수');

    return strengths.length > 0 ? strengths : ['기본 역량 보유'];
  }

  /**
   * 주의사항 추출
   */
  private extractConcerns(): string[] {
    const concerns: string[] = [];
    const scores = this.context.current_scores;

    if (scores.reliability < 20) concerns.push('성실성 영역 보완 필요');
    if (scores.job_fit < 15) concerns.push('직무 경험 부족');
    if (scores.service_mind < 12) concerns.push('고객 응대 역량 강화 필요');
    if (scores.logistics < 5) concerns.push('근무 조건 재협의 필요');

    return concerns;
  }

  /**
   * 추천 메시지
   */
  private getRecommendation(grade: string): string {
    const recommendations: Record<string, string> = {
      S: '강력추천',
      A: '추천',
      B: '보류',
      C: '재검토',
      F: '비추천'
    };
    return recommendations[grade];
  }

  /**
   * 1시간 체험 포커스
   */
  private getTrialFocus(grade: string): string {
    if (grade === 'S') return '즉시 채용 가능, 체험 불필요';
    if (grade === 'A') return '실제 업무 속도와 고객 응대 스타일 확인';
    if (grade === 'B') return '기본 업무 숙지 속도와 학습 태도 확인';
    return '전반적 직무 적합성 재평가';
  }

  /**
   * 한줄 요약
   */
  private getOneLiner(grade: string, score: number): string {
    if (grade === 'S') return `${score}점 만점에 가까운 최고의 인재`;
    if (grade === 'A') return `${score}점의 우수한 후보, 체험 후 채용 권장`;
    if (grade === 'B') return `${score}점의 보통 수준, 교육 후 활용 가능`;
    if (grade === 'C') return `${score}점으로 다른 후보와 비교 필요`;
    return `${score}점으로 채용 비추천`;
  }

  /**
   * 면접 소요 시간 계산
   */
  private calculateDuration(): string {
    const start = new Date(this.context.started_at);
    const end = new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  }

  /**
   * UUID 생성
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 컨텍스트 가져오기 (디버깅용)
   */
  getContext(): InterviewContext {
    return this.context;
  }
}

export default AlbiInterviewEngine;
