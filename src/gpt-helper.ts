/**
 * GPT-4 기반 동적 질문 생성 헬퍼
 * 적성검사 결과 + 대화 맥락 → 심층 면접 질문
 */

import OpenAI from 'openai';

// ✨ Cloudflare Workers 환경에서는 클라이언트를 함수 내에서 생성
function createOpenAIClient(env?: any): OpenAI {
  return new OpenAI({
    apiKey: env?.OPENAI_API_KEY || 'gsk-dummy',
    baseURL: env?.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1',
  });
}

interface GenerateQuestionParams {
  jobType: string;
  testResult: any;
  conversationHistory: Array<{ role: string; content: string }>;
  lastAnswer: string;
  questionCount: number;
}

/**
 * GPT-4를 사용하여 맥락 기반 심층 질문 생성
 */
export async function generateDynamicQuestion(params: GenerateQuestionParams, env?: any): Promise<string> {
  const { jobType, testResult, conversationHistory, lastAnswer, questionCount } = params;
  
  // 적성검사 결과 요약
  const testSummary = testResult ? `
적성검사 결과:
- 유형: ${testResult.resultType?.primary || '알 수 없음'}
- 신뢰도: ${testResult.confidence ? (testResult.confidence * 100).toFixed(0) + '%' : '알 수 없음'}
- 차원 점수: ${JSON.stringify(testResult.dimensions || {})}
  `.trim() : '적성검사 결과 없음';
  
  // 대화 맥락 요약 (최근 5턴으로 확장)
  const recentConversation = conversationHistory.slice(-10).map(msg => 
    `${msg.role === 'user' ? '지원자' : '면접관'}: ${msg.content}`
  ).join('\n');
  
  // 이미 물어본 질문 추출 (번호 포함)
  const askedQuestions = conversationHistory
    .filter(msg => msg.role === 'assistant')
    .map((msg, idx) => `${idx + 1}. ${msg.content}`)
    .join('\n');
  
  // GPT-4 프롬프트 - 초자연스러운 대화형 면접관
  const systemPrompt = `당신은 ${jobType}에서 10년 경력의 친근한 매니저입니다. 지금 새로운 팀원을 뽑기 위해 편안한 대화를 나누고 있습니다.

**당신의 성격:**
- 🌟 따뜻하고 공감 능력이 뛰어남
- 💬 진짜 사람처럼 자연스럽게 대화함
- 😊 지원자를 편안하게 만들어줌
- 🎯 대화 속에서 자연스럽게 능력을 파악함

**절대 금지:**
- ❌ "그렇게 생각하시는 특별한 경험이 있으신가요?" (너무 형식적)
- ❌ "구체적인 예시를 들어주실 수 있을까요?" (반복적)
- ❌ "혹시 이전에 ~~ 경험 있으세요?" (패턴화)
- ❌ 같은 질문 반복
- ❌ 로봇 같은 말투

**대신 이렇게 말하세요:**
- ✅ "우와, 봉골레 파스타! 저도 진짜 좋아하는데요 😊 혹시 어떻게 만드셨어요?"
- ✅ "여자친구분이 정말 행복해하셨겠네요! 그럼 음식점에서 손님들한테도 그런 기쁨을 주고 싶으신 거예요?"
- ✅ "요리 실력이 좋으시네요! 근데 음식점은 집이랑 좀 다르잖아요. 빠르게 여러 요리를 동시에 만들어야 하는데, 그런 상황은 어떻게 대처하실 것 같아요?"
- ✅ "아, 그렇구나! 그럼 혹시 손님이 음식에 불만을 표현하면 어떻게 하실 것 같아요?"

${testSummary}

**대화 흐름:**
- 현재 ${questionCount}/15번째 대화
- 최근 대화:
${recentConversation}

**⚠️ 이미 나온 질문 (절대 반복 금지!):**
${askedQuestions || '(첫 대화)'}

**지원자가 방금 말한 것:**
"${lastAnswer}"

**당신의 임무:**
위 대답을 듣고, **진짜 사람처럼 자연스럽게 반응**하면서 다음 질문으로 이어가세요.

**대화 전략 (${questionCount}/15):**
${questionCount <= 5 ? '→ 지금: 지원자의 동기와 열정을 자연스럽게 파악하는 중 (왜 일하고 싶은지, 무엇을 좋아하는지)' : ''}
${questionCount > 5 && questionCount <= 10 ? '→ 지금: 실제 상황 대처 능력 확인 중 (바쁠 때, 어려울 때, 팀워크)' : ''}
${questionCount > 10 ? '→ 지금: 장기적 태도와 성장 가능성 평가 중 (스트레스, 목표, 배우려는 자세)' : ''}

**핵심 원칙:**
1. 지원자가 한 말에 **공감**하며 시작 ("우와!", "정말요?", "그렇구나!", "멋진데요!")
2. 자연스럽게 **새로운 관점**으로 이어가기
3. **이모티콘 1~2개** 사용 (😊, 👍, 🤔 등)
4. **반말처럼 친근**하되 존댓말 유지

**출력:**
질문 하나만 반환. 설명 금지.`;

  try {
    console.log('🔑 API Key exists:', env?.OPENAI_API_KEY ? 'YES' : 'NO');
    console.log('🌐 Base URL:', env?.OPENAI_BASE_URL || 'DEFAULT');
    
    const client = createOpenAIClient(env);
    console.log('📡 Calling GPT-5 API...');
    
    const response = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `지원자가 "${lastAnswer}" 라고 말했어요. 이제 어떻게 자연스럽게 대화를 이어갈까요? (이미 물어본 질문은 절대 반복하지 말고, 새로운 각도로 물어보세요)` }
      ],
      temperature: 0.95, // 최대 다양성
      max_tokens: 150,
    });

    console.log('📥 API Response received');
    
    let generatedQuestion = response.choices[0]?.message?.content?.trim() || '';
    
    if (!generatedQuestion) {
      throw new Error('GPT-4가 빈 질문을 반환했습니다.');
    }
    
    // 🔥 중복 검사: 이미 물어본 질문과 유사한지 확인
    const isDuplicate = conversationHistory
      .filter(msg => msg.role === 'assistant')
      .some(msg => {
        const similarity = calculateSimilarity(msg.content, generatedQuestion);
        return similarity > 0.6; // 60% 이상 유사하면 중복으로 판단
      });
    
    if (isDuplicate) {
      console.warn('⚠️ GPT-4가 중복 질문 생성, 재시도 중...');
      // 재시도 프롬프트
      const retryResponse = await client.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `❌ 방금 생성한 질문 "${generatedQuestion}"은 이미 물어봤습니다!\n\n완전히 다른 각도의 질문을 해주세요. 예: 경험 → 상황 대처, 동기 → 목표, 과거 → 미래` }
        ],
        temperature: 1.0, // 최대 다양성
        max_tokens: 150,
      });
      
      generatedQuestion = retryResponse.choices[0]?.message?.content?.trim() || generatedQuestion;
    }
    
    console.log('✅ GPT-4 동적 질문 생성 성공:', generatedQuestion.substring(0, 50) + '...');
    return generatedQuestion;
    
  } catch (error: any) {
    console.error('❌ GPT-4 질문 생성 실패:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    // 폴백: 기본 후속 질문
    const fallbackQuestions = [
      '그 이유를 좀 더 구체적으로 설명해주시겠어요?',
      '그렇게 생각하시는 특별한 경험이 있으신가요?',
      '조금 더 자세히 말씀해주시면 좋겠어요.',
      '구체적인 예시를 들어주실 수 있을까요?'
    ];
    
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
}

/**
 * 문자열 유사도 계산 (간단한 Jaccard 유사도)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 답변 깊이 분석 (사용 안 함 - GPT-4가 직접 판단)
 * 이 함수는 하위 호환성을 위해 유지하지만, 항상 true를 반환
 */
export function analyzeAnswerDepth(answer: string): {
  isSufficient: boolean;
  reason: string;
} {
  // GPT-4가 모든 답변을 분석하므로 항상 충분하다고 판단
  return {
    isSufficient: true,
    reason: 'GPT-4가 직접 분석합니다.'
  };
}
