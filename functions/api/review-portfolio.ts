/**
 * Portfolio AI Review API
 * OpenAI GPT-4를 사용한 포트폴리오 심층 분석 및 구체적 개선 방향 제시
 */

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
}

interface PortfolioReviewRequest {
  portfolio_id: string;
  user_id: string;
}

interface ReviewResult {
  score: number;
  feedback: string;
  improvements: string[];
  strengths: string[];
  detailed_analysis: {
    content_quality: number;
    structure: number;
    professionalism: number;
    completeness: number;
  };
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PortfolioReviewRequest = await context.request.json();
    const { portfolio_id, user_id } = body;

    if (!portfolio_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'portfolio_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[AI Review] Analyzing portfolio:', portfolio_id);

    // D1에서 포트폴리오 데이터 조회
    const portfolio = await context.env.DB.prepare(`
      SELECT * FROM mentor_portfolios WHERE portfolio_id = ?
    `).bind(portfolio_id).first();

    if (!portfolio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Portfolio not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // content JSON 파싱
    const portfolioData = {
      ...portfolio,
      content: JSON.parse(portfolio.content)
    };

    // OpenAI로 심층 AI 리뷰 생성
    const review = await generateDetailedAIReview(portfolioData, context.env.OPENAI_API_KEY);

    // 리뷰 결과를 DB에 저장
    const review_id = 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    await context.env.DB.prepare(`
      INSERT INTO portfolio_reviews (
        review_id, portfolio_id, user_id, review_text, score,
        improvements, before_version, after_version, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      review_id,
      portfolio_id,
      user_id,
      review.feedback,
      review.score,
      JSON.stringify(review.improvements),
      portfolio.version,
      portfolio.version,
      now
    ).run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        portfolio_id,
        score: review.score,
        feedback: review.feedback,
        improvements: review.improvements,
        strengths: review.strengths,
        detailed_analysis: review.detailed_analysis,
        reviewed_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI Review] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'AI review failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function generateDetailedAIReview(portfolio: any, apiKey: string): Promise<ReviewResult> {
  const { title, portfolio_type, content } = portfolio;

  // 콘텐츠를 상세 텍스트로 변환
  const contentText = Object.entries(content)
    .map(([key, value]) => `【${key}】\n${value}`)
    .join('\n\n');

  const typeNames: Record<string, string> = {
    'resume': '이력서',
    'cover_letter': '자기소개서',
    'project': '프로젝트 설명서',
    'self_intro': '자기소개'
  };

  // 포트폴리오 유형별 평가 기준
  const evaluationCriteria: Record<string, string> = {
    'resume': `
평가 기준:
1. 경력 기술의 구체성 (정량적 성과, 사용 기술, 업무 내용)
2. 학력 및 자격증의 관련성
3. 기술 스택의 명확성 및 최신성
4. 전체적인 구성과 가독성
5. 맞춤법 및 문법`,
    'cover_letter': `
평가 기준:
1. 지원 동기의 설득력과 구체성
2. 성장 과정의 스토리텔링
3. 역량 증명 (STAR 기법 활용 여부)
4. 입사 후 포부의 현실성
5. 문장 구성력 및 표현력`,
    'project': `
평가 기준:
1. 프로젝트 목적 및 배경의 명확성
2. 역할 및 기여도의 구체성
3. 정량적 성과 지표
4. 기술 스택 및 문제 해결 과정
5. 프로젝트의 완성도 및 영향력`,
    'self_intro': `
평가 기준:
1. 자기소개의 독창성과 진정성
2. 강점의 구체적 증명
3. 커리어 목표의 명확성
4. 전체적인 스토리텔링
5. 개성과 차별화 포인트`
  };

  // OpenAI API 호출용 프롬프트 (더 상세하고 구체적)
  const prompt = `당신은 10년 경력의 전문 HR 컨설턴트이자 포트폴리오 심사 전문가입니다. 
다음 ${typeNames[portfolio_type] || '포트폴리오'}를 매우 구체적이고 실용적으로 분석하고 평가해주세요.

포트폴리오 제목: ${title}
포트폴리오 유형: ${typeNames[portfolio_type]}

${evaluationCriteria[portfolio_type] || ''}

내용:
${contentText}

다음 형식으로 **매우 구체적이고 실행 가능한** 분석을 제공해주세요:

1. **점수 (0-100)**: 위 평가 기준에 따라 객관적으로 평가
2. **전체 피드백 (3-4문장)**: 
   - 이 포트폴리오의 전반적인 수준
   - 가장 인상적인 점
   - 가장 개선이 필요한 점
3. **강점 (3-4개, 각 1-2문장)**:
   - 구체적으로 어떤 부분이 우수한지 인용하여 설명
   - 왜 그것이 강점인지 명확히 설명
4. **개선사항 (5-7개, 각 2-3문장)**:
   - **구체적인 문제점 지적**: 어떤 부분이 부족한지
   - **구체적인 개선 방법**: 정확히 무엇을 어떻게 수정해야 하는지
   - **개선 예시**: 가능하면 Before/After 예시 제시
5. **세부 분석 (각 0-100점)**:
   - content_quality: 내용의 질과 구체성
   - structure: 구성과 논리적 흐름
   - professionalism: 전문성과 완성도
   - completeness: 정보의 완전성

**중요**: 개선사항은 "더 구체적으로 작성하세요" 같은 일반적인 조언이 아니라, 
실제로 어떤 내용을 어떻게 수정해야 하는지 구체적인 예시와 함께 제시해주세요.

JSON 형식으로 응답:
{
  "score": 숫자,
  "feedback": "전체 피드백 (3-4문장)",
  "strengths": [
    "구체적 강점 1 (내용 인용 포함)",
    "구체적 강점 2",
    "구체적 강점 3"
  ],
  "improvements": [
    "【문제점】부족한 부분 + 【개선 방법】구체적 수정 방법 + 【예시】개선 예시",
    "【문제점】... 【개선 방법】... 【예시】...",
    "..."
  ],
  "detailed_analysis": {
    "content_quality": 숫자,
    "structure": 숫자,
    "professionalism": 숫자,
    "completeness": 숫자
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 10년 경력의 HR 전문가이자 포트폴리오 리뷰 전문가입니다. 매우 구체적이고 실행 가능한 피드백을 제공하며, 일반적인 조언이 아닌 실제 개선 방법과 예시를 제시합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('[AI Review] OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // JSON 파싱
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, result.score || 70)),
        feedback: result.feedback || '전반적으로 좋은 포트폴리오입니다.',
        improvements: result.improvements || [
          '【문제점】정량적 성과 지표가 부족합니다. 【개선 방법】"매출 20% 증가", "응답 속도 40% 개선" 같은 구체적 수치를 추가하세요. 【예시】"프로젝트를 성공적으로 완료" → "프로젝트를 완료하여 고객 만족도를 15% 향상시키고 운영 비용을 월 500만원 절감"'
        ],
        strengths: result.strengths || ['명확한 구성', '전문성'],
        detailed_analysis: result.detailed_analysis || {
          content_quality: 70,
          structure: 75,
          professionalism: 70,
          completeness: 65
        }
      };
    }

    // 파싱 실패 시 상세 Fallback 리뷰 반환
    return generateDetailedFallbackReview(portfolio);

  } catch (error) {
    console.error('[AI Review] OpenAI API error:', error);
    return generateDetailedFallbackReview(portfolio);
  }
}

function generateDetailedFallbackReview(portfolio: any): ReviewResult {
  const { portfolio_type, content } = portfolio;

  // 콘텐츠 분석
  const contentLength = JSON.stringify(content).length;
  const filledFields = Object.values(content).filter(v => v && String(v).trim()).length;
  const totalFields = Object.keys(content).length;
  
  // 기본 점수 계산
  let score = 50;
  if (contentLength > 300) score += 5;
  if (contentLength > 600) score += 5;
  if (contentLength > 1000) score += 10;
  if (contentLength > 2000) score += 10;
  if (filledFields >= totalFields * 0.5) score += 10;
  if (filledFields >= totalFields * 0.8) score += 10;

  const typeMessages: Record<string, any> = {
    'resume': {
      feedback: '이력서의 기본 구조는 갖추었으나, 경력 사항에 정량적 성과와 구체적인 업무 내용을 추가하면 더욱 설득력 있는 이력서가 될 것입니다.',
      improvements: [
        '【문제점】경력 기술이 일반적입니다. 【개선 방법】각 경력마다 "무엇을, 어떻게, 얼마나" 달성했는지 구체적으로 작성하세요. 【예시】"백엔드 개발" → "Node.js 기반 RESTful API 설계 및 구현으로 서비스 응답 속도 40% 개선 (평균 500ms → 300ms)"',
        '【문제점】기술 스택만 나열되어 있습니다. 【개선 방법】각 기술의 숙련도와 실무 사용 기간을 명시하세요. 【예시】"Python" → "Python (3년, 실무 프로젝트 5개 이상 경험, Django/Flask 프레임워크 숙련)"',
        '【문제점】학력 정보가 간단합니다. 【개선 방법】전공, 학점, 관련 프로젝트나 수상 경력을 추가하세요. 【예시】"서울대학교 졸업" → "서울대학교 컴퓨터공학과 졸업 (학점: 3.8/4.5, 캡스톤 프로젝트 우수상 수상)"'
      ],
      strengths: ['필수 정보가 모두 포함되어 있습니다', '전체적인 레이아웃이 깔끔합니다']
    },
    'cover_letter': {
      feedback: '자기소개서의 기본 흐름은 있으나, 지원 동기와 역량 증명 부분에서 더 구체적인 스토리와 증거가 필요합니다. STAR 기법을 활용하여 경험을 서술하면 설득력이 높아질 것입니다.',
      improvements: [
        '【문제점】지원 동기가 추상적입니다. 【개선 방법】회사의 구체적인 비전/제품/문화를 언급하고 본인의 경험과 연결하세요. 【예시】"귀사에 관심이 있습니다" → "귀사의 AI 기반 추천 시스템에 깊은 인상을 받았으며, 제가 이전 회사에서 구축한 실시간 데이터 파이프라인 경험을 활용하여 기여하고 싶습니다"',
        '【문제점】역량 증명이 일반적입니다. 【개선 방법】STAR 기법(상황-과제-행동-결과)으로 구체적 경험을 서술하세요. 【예시】"팀워크가 좋습니다" → "[상황] 서비스 응답 속도가 느려 이탈률 증가 [과제] 2주 내 50% 개선 목표 [행동] Redis 캐싱 도입 및 비동기 처리 [결과] 62% 개선, 이탈률 15% 감소"',
        '【문제점】입사 후 포부가 막연합니다. 【개선 방법】단기(1년)/중기(3년) 목표를 구체적으로 제시하세요. 【예시】"열심히 하겠습니다" → "1년 내 귀사의 추천 시스템 백엔드 최적화에 기여하고, 3년 내 시니어 개발자로 성장하여 신규 서비스 아키텍처 설계를 주도하고 싶습니다"'
      ],
      strengths: ['전체적인 구성이 논리적입니다', '문장력이 좋습니다']
    },
    'project': {
      feedback: '프로젝트의 개요는 이해되나, 본인의 구체적인 역할과 정량적 성과가 부족합니다. 기술적 챌린지와 해결 과정을 상세히 기술하면 더 설득력 있는 프로젝트 설명서가 될 것입니다.',
      improvements: [
        '【문제점】프로젝트 개요만 있고 배경이 없습니다. 【개선 방법】왜 이 프로젝트가 필요했는지, 어떤 문제를 해결하려 했는지 명시하세요. 【예시】"쇼핑몰 구축" → "기존 레거시 시스템의 느린 응답 속도(평균 2초)로 인한 고객 이탈 문제를 해결하기 위해 새로운 쇼핑몰 시스템 구축"',
        '【문제점】역할 기술이 모호합니다. 【개선 방법】전체 중 본인의 기여도와 구체적 담당 업무를 명시하세요. 【예시】"백엔드 개발 담당" → "5명 팀 중 백엔드 리드로서 주문 처리 시스템(전체 코드의 40%) 설계 및 구현, Redis 캐싱 아키텍처 설계, 3명의 주니어 개발자 코드 리뷰"',
        '【문제점】성과가 정성적입니다. 【개선 방법】Before/After 비교 가능한 정량적 지표를 추가하세요. 【예시】"성능 개선" → "응답 속도 70% 개선(2초 → 600ms), 동시 접속자 수 5배 증가(1,000명 → 5,000명), 서버 비용 30% 절감(월 500만원 → 350만원)"'
      ],
      strengths: ['프로젝트의 목적이 명확합니다', '사용 기술 스택이 잘 정리되어 있습니다']
    },
    'self_intro': {
      feedback: '자기소개의 기본적인 내용은 갖추었으나, 차별화 포인트와 구체적인 강점 증명이 부족합니다. 스토리텔링을 강화하고 본인만의 독특한 경험을 부각시키면 더욱 인상적인 자기소개가 될 것입니다.',
      improvements: [
        '【문제점】자기소개가 일반적입니다. 【개선 방법】본인만의 독특한 경험이나 관점을 부각시키세요. 【예시】"개발을 좋아합니다" → "중학생 때 첫 코딩으로 가족의 가계부 앱을 만들었고, 어머니가 \'이제 돈 관리가 쉬워졌다\'고 하셨을 때 기술이 사람의 삶을 바꿀 수 있다는 것을 깨달았습니다"',
        '【문제점】강점이 추상적입니다. 【개선 방법】각 강점마다 구체적 증거와 에피소드를 제시하세요. 【예시】"빠른 학습 능력" → "입사 후 3개월 만에 회사의 레거시 코드베이스(20만 줄)를 이해하고 핵심 모듈 리팩토링을 주도하여 팀 생산성을 25% 향상"',
        '【문제점】커리어 목표가 막연합니다. 【개선 방법】단계별 목표와 달성 방법을 구체적으로 제시하세요. 【예시】"좋은 개발자가 되고 싶습니다" → "1-2년: 시니어 백엔드 개발자로 아키텍처 설계 역량 강화, 3-5년: 테크 리드로 주니어 멘토링 및 기술 문화 구축, 5년 이상: CTO로 기술 전략 수립"'
      ],
      strengths: ['문장이 매끄럽게 읽힙니다', '전체적인 흐름이 자연스럽습니다']
    }
  };

  const typeData = typeMessages[portfolio_type] || typeMessages['resume'];

  return {
    score,
    feedback: typeData.feedback,
    improvements: typeData.improvements,
    strengths: typeData.strengths,
    detailed_analysis: {
      content_quality: Math.min(100, score + 5),
      structure: Math.min(100, score),
      professionalism: Math.min(100, score - 5),
      completeness: Math.min(100, Math.round((filledFields / totalFields) * 100))
    }
  };
}
