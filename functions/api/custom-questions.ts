/**
 * 맞춤 면접 질문 생성 API
 * Phase 8.4: 신규 기능 추가
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const {
            industry,
            position,
            difficulty,
            email
        } = body;

        // 입력 검증
        if (!industry || !position || !difficulty) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: industry, position, difficulty'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 맞춤 질문 생성
        const questions = await generateCustomQuestions(
            industry,
            position,
            difficulty,
            email,
            env.OPENAI_API_KEY,
            env.DB
        );

        return new Response(JSON.stringify({
            success: true,
            data: {
                questions,
                config: {
                    industry,
                    position,
                    difficulty
                }
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[custom-questions] Error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 맞춤 질문 생성
 */
async function generateCustomQuestions(industry, position, difficulty, email, apiKey, db) {
    // 산업/직무/난이도 정보 (간단한 매핑)
    const industryNames = {
        'it': 'IT/소프트웨어',
        'finance': '금융/회계',
        'marketing': '마케팅/광고',
        'sales': '영업/비즈니스',
        'hr': '인사/HR',
        'design': '디자인/크리에이티브',
        'manufacturing': '제조/생산',
        'general': '일반/기타'
    };

    const difficultyInfo = {
        'beginner': {
            name: '초급',
            description: '신입/경력 1-2년',
            style: '기본적인 개념과 경험 중심',
            criteria: ['기본 지식', '학습 의욕', '성장 가능성', '태도']
        },
        'intermediate': {
            name: '중급',
            description: '경력 3-5년',
            style: '실무 경험과 문제 해결 능력 중심',
            criteria: ['실무 능력', '문제 해결', '팀워크', '전문성']
        },
        'advanced': {
            name: '고급',
            description: '경력 5년 이상/시니어',
            style: '전략적 사고와 리더십 중심',
            criteria: ['전략적 사고', '리더십', '비즈니스 이해', '의사결정']
        }
    };

    const industryName = industryNames[industry] || '일반';
    const diffData = difficultyInfo[difficulty] || difficultyInfo['intermediate'];

    // 사용자 프로필 조회 (선택사항)
    let userProfile = null;
    if (email && db) {
        try {
            const { results } = await db.prepare(`
                SELECT * FROM user_profiles WHERE email = ? LIMIT 1
            `).bind(email).all();
            
            if (results && results.length > 0) {
                userProfile = results[0];
            }
        } catch (error) {
            console.warn('[generateCustomQuestions] Failed to load user profile:', error);
        }
    }

    // 프롬프트 구성
    const prompt = `당신은 ${industryName} 분야의 ${position} 채용을 담당하는 전문 면접관입니다.

**지원자 수준:** ${diffData.name} (${diffData.description})
**평가 기준:** ${diffData.criteria.join(', ')}
**질문 스타일:** ${diffData.style}

${userProfile ? `
**지원자 정보:**
- 이름: ${userProfile.name || 'N/A'}
- 학교: ${userProfile.school || 'N/A'}
- 전공: ${userProfile.major || 'N/A'}
- 관심 분야: ${userProfile.interests || 'N/A'}
` : ''}

다음 7가지 면접 질문을 생성해주세요:

1. **자기소개 및 지원 동기** - 지원자의 배경과 이 직무에 관심을 가진 이유
2. **전공/경력 관련 질문** - 기술적 지식이나 실무 경험 확인
3. **프로젝트/경험 질문 (STAR)** - 구체적인 상황과 행동, 결과 파악
4. **문제 해결 능력** - 어려운 상황에서의 대처 방법
5. **팀워크/협업 경험** - 다른 사람들과 함께 일한 경험
6. **직무 전문성** - 해당 직무에 대한 이해도와 전문 지식
7. **성장 계획 및 비전** - 앞으로의 커리어 목표와 학습 계획

각 질문은 다음 형식의 JSON으로 반환해주세요:
{
  "questions": [
    {
      "index": 0,
      "category": "자기소개",
      "question": "질문 내용 (한국어)",
      "expectedDuration": 120,
      "evaluationPoints": ["평가 포인트1", "평가 포인트2", "평가 포인트3"],
      "tips": "답변 시 고려할 점"
    },
    ...
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
                        content: `당신은 ${industryName} 분야의 전문 면접관입니다. ${diffData.name} 수준의 지원자에게 적합한 질문을 생성합니다.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);

        return result.questions || [];

    } catch (error) {
        console.error('[generateCustomQuestions] Error:', error);
        
        // 기본 질문 반환
        return getDefaultQuestions(position, difficulty);
    }
}

/**
 * 기본 질문 (API 실패 시)
 */
function getDefaultQuestions(position, difficulty) {
    return [
        {
            index: 0,
            category: '자기소개',
            question: '간단하게 자기소개를 부탁드립니다. 본인의 강점과 이 직무에 지원한 이유를 포함해서 말씀해주세요.',
            expectedDuration: 120,
            evaluationPoints: ['명확한 의사소통', '지원 동기', '자기 이해도'],
            tips: '2분 이내로 핵심만 간결하게 전달하세요.'
        },
        {
            index: 1,
            category: '전공/경력',
            question: '학교에서 배운 내용 중 이 직무와 가장 관련이 깊다고 생각하는 것은 무엇인가요?',
            expectedDuration: 120,
            evaluationPoints: ['전공 지식', '직무 이해', '학습 능력'],
            tips: '구체적인 예시와 함께 설명하세요.'
        },
        {
            index: 2,
            category: '프로젝트 경험',
            question: '가장 기억에 남는 프로젝트나 과제 경험에 대해 말씀해주세요. 어떤 역할을 맡았고, 어떤 결과를 얻었나요?',
            expectedDuration: 180,
            evaluationPoints: ['프로젝트 경험', '역할 수행', '성과 도출'],
            tips: 'STAR 기법(상황-과제-행동-결과)을 활용하세요.'
        },
        {
            index: 3,
            category: '문제 해결',
            question: '어려운 문제에 직면했을 때 어떻게 해결하시나요? 구체적인 사례를 들어 설명해주세요.',
            expectedDuration: 150,
            evaluationPoints: ['문제 분석', '해결 방법', '결과'],
            tips: '논리적인 사고 과정을 보여주세요.'
        },
        {
            index: 4,
            category: '팀워크',
            question: '팀 프로젝트에서 의견 충돌이 있었던 경험이 있나요? 어떻게 해결하셨나요?',
            expectedDuration: 120,
            evaluationPoints: ['협업 능력', '갈등 해결', '커뮤니케이션'],
            tips: '상대방을 존중하면서도 목표를 달성한 경험을 이야기하세요.'
        },
        {
            index: 5,
            category: '직무 전문성',
            question: `${position} 직무를 수행하는 데 가장 중요하다고 생각하는 역량은 무엇이며, 본인은 그 역량을 어떻게 갖추었나요?`,
            expectedDuration: 150,
            evaluationPoints: ['직무 이해', '역량 분석', '자기 평가'],
            tips: '구체적인 근거와 함께 설명하세요.'
        },
        {
            index: 6,
            category: '성장 계획',
            question: '입사 후 어떤 목표를 가지고 일하고 싶으신가요? 5년 후 본인의 모습을 그려본다면?',
            expectedDuration: 120,
            evaluationPoints: ['비전', '학습 의욕', '장기 계획'],
            tips: '현실적이면서도 구체적인 계획을 제시하세요.'
        }
    ];
}
