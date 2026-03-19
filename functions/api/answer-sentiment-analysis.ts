/**
 * 답변 감정 분석 API
 * GPT-4 기반 텍스트 감정 분석
 * - 긍정성 (Positivity)
 * - 자신감 (Confidence)
 * - 논리성 (Logical Structure)
 * - 전문성 (Professionalism)
 */

interface SentimentAnalysisRequest {
  question: string;
  answer: string;
  language: string;
}

interface SentimentAnalysisResult {
  positivity: number;        // 0-100: 긍정적 표현 정도
  confidence: number;         // 0-100: 자신감 수준
  logicalStructure: number;   // 0-100: 논리적 구조
  professionalism: number;    // 0-100: 전문성
  overallScore: number;       // 0-100: 종합 점수
  strengths: string[];        // 강점
  weaknesses: string[];       // 약점
  detailedFeedback: string;   // 상세 피드백
}

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await context.request.json() as SentimentAnalysisRequest;
    const { question, answer, language = 'ko' } = body;

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'Question and answer are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // OpenAI API 호출
    const result = await analyzeSentiment(question, answer, language, context.env);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('답변 감정 분석 오류:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * GPT-4를 사용한 감정 분석
 */
async function analyzeSentiment(
  question: string,
  answer: string,
  language: string,
  env: any
): Promise<SentimentAnalysisResult> {
  const OPENAI_API_KEY = env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // 언어별 프롬프트
  const prompts: Record<string, string> = {
    ko: `당신은 전문 면접 코치입니다. 다음 면접 질문과 답변을 분석하여 JSON 형식으로 평가해주세요.

**질문**: ${question}

**답변**: ${answer}

다음 4가지 기준으로 0-100점 척도로 평가하고, 각 항목별 피드백을 제공해주세요:

1. **긍정성 (Positivity)**: 긍정적이고 적극적인 표현 사용 정도
2. **자신감 (Confidence)**: 확신있고 자신감 있는 어조
3. **논리성 (Logical Structure)**: 논리적이고 체계적인 답변 구조
4. **전문성 (Professionalism)**: 전문적이고 격식있는 표현

응답은 반드시 다음 JSON 형식을 따라주세요:
{
  "positivity": 85,
  "confidence": 75,
  "logicalStructure": 80,
  "professionalism": 90,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "detailedFeedback": "전반적인 상세 피드백..."
}`,
    en: `You are a professional interview coach. Please analyze the following interview question and answer in JSON format.

**Question**: ${question}

**Answer**: ${answer}

Evaluate the following 4 criteria on a 0-100 scale and provide feedback for each:

1. **Positivity**: Use of positive and proactive expressions
2. **Confidence**: Confident and assured tone
3. **Logical Structure**: Logical and structured answer
4. **Professionalism**: Professional and formal expressions

Respond in the following JSON format:
{
  "positivity": 85,
  "confidence": 75,
  "logicalStructure": 80,
  "professionalism": 90,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "detailedFeedback": "Overall detailed feedback..."
}`,
    zh: `您是一位专业的面试教练。请以 JSON 格式分析以下面试问题和答案。

**问题**: ${question}

**答案**: ${answer}

请按以下 4 个标准以 0-100 分进行评估，并为每项提供反馈：

1. **积极性 (Positivity)**: 使用积极和主动表达的程度
2. **自信 (Confidence)**: 自信和肯定的语气
3. **逻辑性 (Logical Structure)**: 逻辑性和结构化的答案
4. **专业性 (Professionalism)**: 专业和正式的表达

请按以下 JSON 格式回复:
{
  "positivity": 85,
  "confidence": 75,
  "logicalStructure": 80,
  "professionalism": 90,
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["缺点1", "缺点2"],
  "detailedFeedback": "整体详细反馈..."
}`
  };

  const systemPrompt = prompts[language] || prompts['ko'];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach specializing in sentiment analysis. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: systemPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // JSON 파싱
    let analysis;
    try {
      // JSON 블록 추출 (```json ... ``` 형식 처리)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      // 기본값 반환
      analysis = {
        positivity: 70,
        confidence: 70,
        logicalStructure: 70,
        professionalism: 70,
        strengths: ['답변을 제공함'],
        weaknesses: ['분석 실패'],
        detailedFeedback: '답변 분석 중 오류가 발생했습니다.'
      };
    }

    // 종합 점수 계산 (가중 평균)
    const overallScore = Math.round(
      (analysis.positivity * 0.2) +
      (analysis.confidence * 0.3) +
      (analysis.logicalStructure * 0.3) +
      (analysis.professionalism * 0.2)
    );

    return {
      positivity: analysis.positivity || 0,
      confidence: analysis.confidence || 0,
      logicalStructure: analysis.logicalStructure || 0,
      professionalism: analysis.professionalism || 0,
      overallScore,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      detailedFeedback: analysis.detailedFeedback || ''
    };
  } catch (error: any) {
    console.error('GPT-4 분석 오류:', error);
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
}
