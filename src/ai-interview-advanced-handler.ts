/**
 * 🚀 실전 상황 대응 시스템
 * 사용자가 막히는 50가지 시나리오 자동 처리
 */

export interface SituationResponse {
  detected: boolean;
  response: string;
  followUp: string;
  score_adjustment?: number;
  category: string;
}

export class AdvancedSituationHandler {
  
  /**
   * 메인 핸들러: 모든 상황 체크
   */
  static handle(userAnswer: string, context: any): SituationResponse | null {
    const answer = userAnswer.toLowerCase().trim();
    
    // 우선순위 순서로 체크
    return (
      this.handleQuestions(answer, context) ||
      this.handleVagueAnswers(answer, context) ||
      this.handleNegativeAttitude(answer, context) ||
      this.handleUnrealisticExpectations(answer, context) ||
      this.handlePersonalQuestions(answer, context) ||
      this.handleTechnicalIssues(answer, context) ||
      this.handleEmotionalStates(answer, context) ||
      this.handleMisunderstandings(answer, context) ||
      this.handleShortAnswers(answer, context) ||
      this.handleRepetitiveAnswers(answer, context)
    );
  }

  /**
   * 1. 지원자의 질문 처리 (최우선!)
   */
  private static handleQuestions(answer: string, context: any): SituationResponse | null {
    const questionPatterns = [
      { pattern: /급여|시급|월급|돈|얼마/i, topic: 'salary' },
      { pattern: /근무시간|몇시|시간|언제|일정/i, topic: 'hours' },
      { pattern: /휴일|쉬는날|주말|공휴일/i, topic: 'holidays' },
      { pattern: /위치|어디|거리|교통|가는법/i, topic: 'location' },
      { pattern: /복장|옷|유니폼|옷차림/i, topic: 'dress' },
      { pattern: /교육|훈련|배우|가르쳐|알려/i, topic: 'training' },
      { pattern: /언제|얼마나|며칠|기간/i, topic: 'duration' },
      { pattern: /뭐|무엇|어떤|어떻게/i, topic: 'what' }
    ];

    for (const { pattern, topic } of questionPatterns) {
      if (pattern.test(answer) && answer.includes('?') || answer.endsWith('요')) {
        return this.getAnswerForQuestion(topic, context);
      }
    }

    return null;
  }

  private static getAnswerForQuestion(topic: string, context: any): SituationResponse {
    const jobType = context.job_type || 'cafe';
    
    const answers: Record<string, any> = {
      salary: {
        response: `급여는 최저시급 기준으로 시작하고, 경력 있으면 협상 가능해요! 주휴수당도 포함이고요 💰`,
        followUp: `혹시 이전에 ${this.getJobTypeName(jobType)} 관련 경험 있으세요?`
      },
      hours: {
        response: `근무시간은 보통 4-8시간 정도고, 시간대는 조정 가능해요! ⏰`,
        followUp: `선호하는 근무 시간대가 있으신가요? (오전/오후/저녁)`
      },
      holidays: {
        response: `주 5일 근무가 기본이고, 주말은 협의 가능해요. 주휴일도 있고요! 📅`,
        followUp: `혹시 주말 근무 가능하신가요?`
      },
      location: {
        response: `위치는 면접 후에 상세히 안내드려요! 대중교통 접근도 좋은 곳이고요 🚇`,
        followUp: `출퇴근 거리는 어느 정도까지 괜찮으세요?`
      },
      dress: {
        response: `복장은 ${this.getJobTypeName(jobType)}에 맞는 단정한 옷차림이면 돼요! 유니폼도 제공하고요 👕`,
        followUp: `이전에 서비스직 경험 있으신가요?`
      },
      training: {
        response: `교육은 첫 주에 집중적으로 해드려요! 선배들이 친절하게 알려주시니 걱정 마세요 📚`,
        followUp: `새로운 걸 배우는 거 좋아하시나요?`
      },
      duration: {
        response: `면접은 지금 진행 중이고, 결과는 바로 나와요! 체험은 1시간 정도 진행되고요 ⏱️`,
        followUp: `혹시 언제부터 일 시작 가능하신가요?`
      },
      what: {
        response: `궁금한 점이 있으시군요! 편하게 물어보세요 😊`,
        followUp: `구체적으로 어떤 게 궁금하신가요?`
      }
    };

    const answer = answers[topic] || answers.what;
    
    return {
      detected: true,
      category: 'question',
      ...answer
    };
  }

  /**
   * 2. 애매한 답변 처리 (확장판)
   */
  private static handleVagueAnswers(answer: string, context: any): SituationResponse | null {
    const vaguePatterns = [
      /^(그냥|음|어|흠|글쎄|잘 모르겠|별로)$/i,
      /그냥요|글쎄요|잘 모르겠어요|별로예요/i,
      /^.{1,3}$/  // 1-3글자 초단답
    ];

    if (vaguePatterns.some(p => p.test(answer))) {
      const responses = [
        {
          response: `편하게 생각나는 대로 얘기해주세요! 😊 정답은 없어요.`,
          followUp: `예를 들어, 이전에 힘들었던 경험이나 잘했던 일 있으신가요?`
        },
        {
          response: `긴장하셨나 봐요! 천천히 말씀해주시면 돼요 ☺️`,
          followUp: `혹시 평소에 어떤 걸 좋아하시나요?`
        },
        {
          response: `조금 더 구체적으로 말씀해주시면 더 정확히 평가해드릴 수 있어요!`,
          followUp: `최근에 뭔가 배우거나 도전해본 일 있으세요?`
        }
      ];

      const random = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        detected: true,
        category: 'vague',
        score_adjustment: -5,
        ...random
      };
    }

    return null;
  }

  /**
   * 3. 부정적 태도 처리 (공감형)
   */
  private static handleNegativeAttitude(answer: string, context: any): SituationResponse | null {
    const negativePatterns = [
      { pattern: /싫어|못 해|안 할|귀찮|힘들|싫은데|별로/i, level: 'strong' },
      { pattern: /어렵|걱정|불안|자신없|부담|두려/i, level: 'weak' }
    ];

    for (const { pattern, level } of negativePatterns) {
      if (pattern.test(answer)) {
        if (level === 'strong') {
          return {
            detected: true,
            category: 'negative_strong',
            response: `그런 경험이 있으셨군요. 그때 구체적으로 어떤 점이 힘드셨나요?`,
            followUp: `만약 그 부분을 개선할 수 있는 환경이라면 어떠세요?`,
            score_adjustment: -10
          };
        } else {
          return {
            detected: true,
            category: 'negative_weak',
            response: `걱정되시는 부분이 있으시군요! 처음에는 다들 그래요 😊`,
            followUp: `어떤 점이 가장 걱정되시나요? 도와드릴 수 있을 것 같아요!`,
            score_adjustment: 0
          };
        }
      }
    }

    return null;
  }

  /**
   * 4. 비현실적 기대 처리 (현실 가이드)
   */
  private static handleUnrealisticExpectations(answer: string, context: any): SituationResponse | null {
    // 시급 과다 요구
    if (/시급.*[2-9]\d{4,}|월.*[5-9]\d{6}/i.test(answer)) {
      return {
        detected: true,
        category: 'unrealistic_salary',
        response: `그 금액은 시장 평균보다 높은 편이에요. 시작은 최저시급으로 하고, 실력 보여주시면 빠르게 올라갈 수 있어요! 💪`,
        followUp: `경력을 쌓으면서 시급 올리는 건 어떠세요?`,
        score_adjustment: -5
      };
    }

    // 근무시간 극소
    if (/주.*1|주.*2|한달.*며칠|일주일.*한번/i.test(answer) && /일하|근무/i.test(answer)) {
      return {
        detected: true,
        category: 'unrealistic_hours',
        response: `주 1-2일은 너무 적어서 정규 근무로는 어려워요. 최소 주 3-4일은 필요해요! 📅`,
        followUp: `주 3-4일 정도는 가능하신가요?`,
        score_adjustment: -10
      };
    }

    return null;
  }

  /**
   * 5. 개인정보 질문 처리 (정중히 회피)
   */
  private static handlePersonalQuestions(answer: string, context: any): SituationResponse | null {
    const personalPatterns = [
      /나이|몇살|연세|어린가요|늙었나요/i,
      /사는곳|주소|집|어디 사/i,
      /전화번호|연락처|폰번호/i,
      /결혼|애인|여자친구|남자친구/i
    ];

    if (personalPatterns.some(p => p.test(answer))) {
      return {
        detected: true,
        category: 'personal',
        response: `그 부분은 면접에서 여쭤보기 어려운 내용이에요! 😊 다른 부분으로 진행할게요.`,
        followUp: `대신 일과 관련된 경험을 여쭤볼게요. 이전에 팀으로 일해본 경험 있으세요?`,
        score_adjustment: 0
      };
    }

    return null;
  }

  /**
   * 6. 기술적 이해 부족 처리 (재설명)
   */
  private static handleTechnicalIssues(answer: string, context: any): SituationResponse | null {
    const confusionPatterns = [
      /무슨 말|이해 못|무슨 뜻|뭔 말|이해가 안|무슨소리/i,
      /다시|again|한번 더|못 들었/i
    ];

    if (confusionPatterns.some(p => p.test(answer))) {
      return {
        detected: true,
        category: 'confusion',
        response: `제가 질문을 좀 어렵게 했네요! 쉽게 다시 말씀드릴게요 😊`,
        followUp: `간단히 말하면, 평소에 어떤 스타일로 일하시는지 궁금해요!`,
        score_adjustment: 0
      };
    }

    return null;
  }

  /**
   * 7. 감정 상태 처리 (공감)
   */
  private static handleEmotionalStates(answer: string, context: any): SituationResponse | null {
    const emotionalPatterns = [
      { pattern: /긴장|떨려|불안|무서워/i, emotion: 'nervous' },
      { pattern: /피곤|힘들|지쳐|너무 어려/i, emotion: 'tired' },
      { pattern: /화나|짜증|기분 나빠/i, emotion: 'angry' }
    ];

    for (const { pattern, emotion } of emotionalPatterns) {
      if (pattern.test(answer)) {
        const responses: Record<string, any> = {
          nervous: {
            response: `긴장하지 마세요! 😊 편안하게 대화하는 거예요. 천천히 해도 괜찮아요!`,
            followUp: `편하게, 평소 스타일로 얘기해주시면 돼요. 어떤 일이 재미있으세요?`
          },
          tired: {
            response: `힘드시군요! 잠깐 쉬면서 천천히 하셔도 돼요 ☺️`,
            followUp: `무리하지 마시고, 간단하게만 답변해주셔도 충분해요!`
          },
          angry: {
            response: `기분이 안 좋으셨나 봐요. 불편하셨다면 죄송해요!`,
            followUp: `천천히 하시고, 편하신 대로 답변해주세요!`
          }
        };

        return {
          detected: true,
          category: `emotional_${emotion}`,
          ...responses[emotion]
        };
      }
    }

    return null;
  }

  /**
   * 8. 오해/엇갈림 처리 (명확화)
   */
  private static handleMisunderstandings(answer: string, context: any): SituationResponse | null {
    // 질문과 전혀 무관한 답변
    if (answer.length > 10 && !this.isRelevantAnswer(answer, context)) {
      return {
        detected: true,
        category: 'irrelevant',
        response: `답변 감사해요! 근데 조금 다른 얘기를 하신 것 같아요 😅`,
        followUp: `제가 여쭤본 건, ${this.getRelevantContext(context)}입니다!`,
        score_adjustment: -3
      };
    }

    return null;
  }

  /**
   * 9. 짧은 답변 처리 (유도)
   */
  private static handleShortAnswers(answer: string, context: any): SituationResponse | null {
    if (answer.length < 5 && !['네', '아니오', '예', '응', '아니'].includes(answer)) {
      return {
        detected: true,
        category: 'too_short',
        response: `조금 더 자세히 말씀해주시면 좋을 것 같아요!`,
        followUp: `예를 들어, 구체적인 상황이나 경험을 들려주실 수 있나요?`,
        score_adjustment: -2
      };
    }

    return null;
  }

  /**
   * 10. 반복 답변 처리 (다양성 유도)
   */
  private static handleRepetitiveAnswers(answer: string, context: any): SituationResponse | null {
    // 이전 답변과 90% 이상 유사
    if (context.conversation_log && context.conversation_log.length > 2) {
      const lastUserAnswers = context.conversation_log
        .filter((log: any) => log.role === 'user')
        .slice(-3)
        .map((log: any) => log.content);

      if (lastUserAnswers.some((prev: string) => this.getSimilarity(prev, answer) > 0.9)) {
        return {
          detected: true,
          category: 'repetitive',
          response: `비슷한 답변을 계속 하시는 것 같아요! 다른 관점에서 말씀해주실 수 있나요? 😊`,
          followUp: `다른 경험이나 생각도 궁금해요!`,
          score_adjustment: -5
        };
      }
    }

    return null;
  }

  // ========== 헬퍼 함수들 ==========

  private static getJobTypeName(jobType: string): string {
    const names: Record<string, string> = {
      cafe: '카페',
      cvs: '편의점',
      restaurant: '음식점',
      retail: '매장',
      fastfood: '패스트푸드'
    };
    return names[jobType] || '서비스업';
  }

  private static isRelevantAnswer(answer: string, context: any): boolean {
    // TODO: 실제로는 더 정교한 관련성 체크
    return answer.length > 5;
  }

  private static getRelevantContext(context: any): string {
    return '이전 질문에 대한 답변';
  }

  private static getSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / maxLen;
  }
}
