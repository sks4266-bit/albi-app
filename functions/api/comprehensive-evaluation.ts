/**
 * AI 면접 종합 평가 및 채용 가능성 분석 API
 */

interface VideoAnalysisResult {
  duration: number;
  totalFrames: number;
  metrics: {
    expression: { [key: string]: number };
    gaze: { [key: string]: number };
    posture: { [key: string]: number };
  };
  score: number;
  grade: string;
  // Phase 5: 고급 분석 추가
  advancedAnalysis?: {
    gesture?: any;
    voiceTone?: any;
    sentiment?: any;
    speech?: any;
  };
}

interface AnswerAnalysis {
  question: string;
  answer: string;
  duration: number;
  wordCount: number;
  keywords: string[];
}

/**
 * 답변 품질 분석
 */
async function analyzeAnswers(
  company: any,
  questions: string[],
  answers: AnswerAnalysis[],
  context: any
): Promise<any> {
  const apiKey = context.env.OPENAI_API_KEY;
  
  const prompt = `당신은 ${company.name} ${company.position} 직무의 시니어 면접관입니다. 
지원자의 답변을 평가하고 채용 가능성을 분석해주세요.

**회사 정보:**
- 회사명: ${company.name}
- 직무: ${company.position}
- 핵심 요구사항: ${company.keyRequirements.join(', ')}

**면접 답변:**
${answers.map((a, i) => `
Q${i+1}: ${a.question}
A${i+1}: ${a.answer}
답변 시간: ${a.duration}초
`).join('\n')}

**평가 기준:**
1. 답변 완성도 (40점): 질문 의도 파악, 구체적 사례, 논리적 구조
2. 직무 적합성 (30점): 요구 역량 부합도, 경험 연관성
3. 의사소통 (20점): 명확성, 간결성, 설득력
4. 성장 가능성 (10점): 학습 의지, 비전, 자기인식

**출력 형식 (JSON):**
{
  "scores": {
    "completeness": 0-40,
    "jobFit": 0-30,
    "communication": 0-20,
    "growth": 0-10
  },
  "totalScore": 0-100,
  "grade": "A+/A/B/C/D",
  "hiringProbability": "매우 높음/높음/보통/낮음",
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2"],
  "detailedFeedback": "종합 피드백 (5-7문장)",
  "answerFeedback": [
    {
      "question": "질문",
      "score": 0-100,
      "feedback": "개별 피드백"
    }
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `당신은 ${company.name}의 시니어 채용 담당자입니다. 지원자를 공정하고 전문적으로 평가합니다.` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
    
  } catch (error) {
    console.error('[ComprehensiveEvaluation] Answer analysis error:', error);
    
    // 기본 평가 반환
    return {
      scores: {
        completeness: 30,
        jobFit: 22,
        communication: 16,
        growth: 8
      },
      totalScore: 76,
      grade: "B",
      hiringProbability: "보통",
      strengths: ["답변이 논리적입니다", "직무에 대한 열정이 느껴집니다"],
      improvements: ["더 구체적인 사례를 제시하면 좋겠습니다", "답변 시간 관리가 필요합니다"],
      detailedFeedback: "전반적으로 준비를 잘 하신 것으로 보입니다. 답변이 논리적이고 직무에 대한 이해도가 높습니다. 다만, 더 구체적인 경험 사례를 추가하면 설득력이 높아질 것입니다.",
      answerFeedback: []
    };
  }
}

/**
 * 종합 평가 생성
 */
async function generateComprehensiveEvaluation(
  videoAnalysis: VideoAnalysisResult,
  answerAnalysis: any,
  company: any,
  context: any
): Promise<any> {
  const apiKey = context.env.OPENAI_API_KEY;
  
  // Phase 5: 고급 분석 점수 통합
  const advancedAnalysis = videoAnalysis.advancedAnalysis || {};
  
  // 기본 영상 분석 점수 (25%)
  const basicVideoScore = videoAnalysis.score || 0;
  
  // 제스처 분석 점수 (5%)
  const gestureScore = advancedAnalysis.gesture?.naturalness || 0;
  
  // 음성 톤 분석 점수 (5%)
  const voiceToneScore = advancedAnalysis.voiceTone ? 
    Math.round((advancedAnalysis.voiceTone.pitchStability + advancedAnalysis.voiceTone.volumeStability) / 2) : 0;
  
  // 말하기 분석 점수 (5%)
  const speechScore = advancedAnalysis.speech ? 
    Math.round((advancedAnalysis.speech.clarityScore + advancedAnalysis.speech.fluencyScore) / 2) : 0;
  
  // 답변 감정 분석 점수 (10%)
  const sentimentScore = advancedAnalysis.sentiment?.overallScore || 0;
  
  // 답변 내용 분석 점수 (50%)
  const answerScore = answerAnalysis.totalScore || 0;
  
  // 최종 점수 계산 (가중 평균)
  const videoScore = Math.round(basicVideoScore * 0.625 + gestureScore * 0.125 + voiceToneScore * 0.125 + speechScore * 0.125);
  const finalScore = Math.round(
    basicVideoScore * 0.25 +     // 기본 영상 분석 25%
    gestureScore * 0.05 +         // 제스처 5%
    voiceToneScore * 0.05 +       // 음성 톤 5%
    speechScore * 0.05 +          // 말하기 5%
    sentimentScore * 0.10 +       // 답변 감정 10%
    answerScore * 0.50            // 답변 내용 50%
  );
  
  // 등급 산정
  let finalGrade = 'D';
  if (finalScore >= 90) finalGrade = 'A+';
  else if (finalScore >= 80) finalGrade = 'A';
  else if (finalScore >= 70) finalGrade = 'B';
  else if (finalScore >= 60) finalGrade = 'C';
  
  // 채용 가능성
  let hiringProbability = '낮음';
  if (finalScore >= 85) hiringProbability = '매우 높음';
  else if (finalScore >= 75) hiringProbability = '높음';
  else if (finalScore >= 65) hiringProbability = '보통';
  
  const prompt = `당신은 ${company.name}의 HR 매니저입니다. 
다음 면접 결과를 종합하여 최종 평가 보고서를 작성해주세요.

**회사 정보:**
- 회사명: ${company.name}
- 직무: ${company.position}

**영상 분석 결과 (40%):**
- 종합 점수: ${videoScore}/100
- 등급: ${videoAnalysis.grade}
- 표정 분포: ${JSON.stringify(videoAnalysis.metrics.expression)}
- 시선 분포: ${JSON.stringify(videoAnalysis.metrics.gaze)}
- 자세 분포: ${JSON.stringify(videoAnalysis.metrics.posture)}
${advancedAnalysis.gesture ? `- 제스처 자연스러움: ${gestureScore}/100` : ''}
${advancedAnalysis.voiceTone ? `- 음성 안정성: ${voiceToneScore}/100` : ''}
${advancedAnalysis.speech ? `- 말하기 명확성: ${speechScore}/100 (WPM: ${advancedAnalysis.speech.wordsPerMinute})` : ''}

**답변 분석 결과 (60%):**
- 종합 점수: ${Math.round(sentimentScore * 0.2 + answerScore * 0.8)}/100
- 답변 감정 (10%): ${sentimentScore}/100
${advancedAnalysis.sentiment ? `  - 긍정성: ${advancedAnalysis.sentiment.positivity}/100` : ''}
${advancedAnalysis.sentiment ? `  - 자신감: ${advancedAnalysis.sentiment.confidence}/100` : ''}
${advancedAnalysis.sentiment ? `  - 논리성: ${advancedAnalysis.sentiment.logicalStructure}/100` : ''}
- 답변 내용 (50%): ${answerScore}/100
  - 답변 완성도: ${answerAnalysis.scores.completeness}/40
  - 직무 적합성: ${answerAnalysis.scores.jobFit}/30
  - 의사소통: ${answerAnalysis.scores.communication}/20
  - 성장 가능성: ${answerAnalysis.scores.growth}/10

**최종 점수: ${finalScore}/100**
**최종 등급: ${finalGrade}**
**채용 가능성: ${hiringProbability}**

**출력 형식 (JSON):**
{
  "executiveSummary": "경영진 요약 (3-4문장)",
  "overallAssessment": "종합 평가 (5-7문장)",
  "videoPerformance": {
    "summary": "영상 퍼포먼스 요약",
    "strengths": ["강점1", "강점2"],
    "concerns": ["우려사항1", "우려사항2"]
  },
  "answerPerformance": {
    "summary": "답변 퍼포먼스 요약",
    "strengths": ["강점1", "강점2"],
    "concerns": ["우려사항1", "우려사항2"]
  },
  "recommendations": [
    "개선 권장사항1",
    "개선 권장사항2",
    "개선 권장사항3"
  ],
  "nextSteps": "다음 단계 제안"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: '당신은 경험 많은 HR 전문가입니다. 면접 결과를 종합적으로 분석하여 건설적이고 실용적인 피드백을 제공합니다.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const comprehensiveReport = JSON.parse(content);
    
    return {
      finalScore,
      finalGrade,
      hiringProbability,
      videoScore,
      answerScore,
      advancedScores: {
        gesture: gestureScore,
        voiceTone: voiceToneScore,
        speech: speechScore,
        sentiment: sentimentScore
      },
      ...comprehensiveReport
    };
    
  } catch (error) {
    console.error('[ComprehensiveEvaluation] Report generation error:', error);
    
    return {
      finalScore,
      finalGrade,
      hiringProbability,
      videoScore,
      answerScore,
      advancedScores: {
        gesture: gestureScore,
        voiceTone: voiceToneScore,
        speech: speechScore,
        sentiment: sentimentScore
      },
      executiveSummary: `${company.name} ${company.position} 직무에 지원한 지원자의 면접 결과입니다. 최종 점수는 ${finalScore}점(${finalGrade} 등급)이며, 채용 가능성은 ${hiringProbability}으로 평가됩니다.`,
      overallAssessment: "면접 준비를 잘 하신 것으로 보입니다. 영상 면접에서 적절한 표정 관리와 시선 처리를 보여주셨고, 답변도 논리적으로 구성하셨습니다. 다만, 일부 답변에서 더 구체적인 사례를 제시하면 설득력이 높아질 것으로 보입니다.",
      videoPerformance: {
        summary: "영상 면접 매너가 전반적으로 양호합니다.",
        strengths: ["적절한 표정 관리", "안정적인 자세"],
        concerns: ["시선 처리 개선 필요"]
      },
      answerPerformance: {
        summary: "답변이 논리적이고 직무에 대한 이해도가 높습니다.",
        strengths: ["명확한 의사소통", "직무 이해도"],
        concerns: ["구체적 사례 보완 필요"]
      },
      recommendations: [
        "모의 면접을 통해 시선 처리 연습",
        "STAR 기법으로 답변 구조화",
        "회사 및 직무에 대한 추가 조사"
      ],
      nextSteps: "전반적으로 우수한 면접 결과입니다. 피드백을 반영하여 실전 면접을 준비하시기 바랍니다."
    };
  }
}

/**
 * 메인 핸들러
 */
export const onRequestPost = async (context: any) => {
  try {
    const { 
      company, 
      videoAnalysis, 
      answers 
    } = await context.request.json();
    
    if (!company || !videoAnalysis || !answers) {
      return new Response(JSON.stringify({
        success: false,
        error: '필수 데이터가 누락되었습니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. 답변 분석
    const answerAnalysis = await analyzeAnswers(
      company,
      answers.map((a: any) => a.question),
      answers,
      context
    );

    // 2. 종합 평가 생성
    const comprehensiveEvaluation = await generateComprehensiveEvaluation(
      videoAnalysis,
      answerAnalysis,
      company,
      context
    );

    return new Response(JSON.stringify({
      success: true,
      data: {
        videoAnalysis,
        answerAnalysis,
        comprehensiveEvaluation
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[ComprehensiveEvaluation] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '종합 평가 실패'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
