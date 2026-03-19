/**
 * 맞춤형 면접 질문 생성 API
 * POST /api/generate-interview
 * 
 * Body:
 * - userId: 사용자 ID
 * - userProfile: 사용자 프로필 데이터
 * 
 * 반환:
 * - interviewer: 면접관 정보
 * - company: 추천 기업 정보
 * - questions: 맞춤형 질문 리스트
 */

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };
        
        // OPTIONS 요청 처리
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }
        
        const body = await request.json();
        const { userId, userProfile } = body;
        
        // 1. 면접관 캐릭터 생성
        const interviewer = generateInterviewer(userProfile);
        
        // 2. 회사 매칭
        const company = await matchCompany(userProfile, env);
        
        // 3. GPT로 맞춤형 질문 생성
        const questions = await generateCustomQuestions(userProfile, company, interviewer, env);
        
        return new Response(JSON.stringify({
            success: true,
            userId,
            interviewer,
            company,
            questions,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('[GenerateInterview] Error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * 면접관 캐릭터 생성
 */
function generateInterviewer(userProfile) {
    // 사용자 프로필에 따라 적합한 면접관 선택
    const interviewers = [
        {
            id: 'interviewer_1',
            name: '김민준',
            title: 'HR 팀장',
            company: 'TBD',
            personality: 'friendly', // friendly, professional, strict
            image: '/static/images/interviewer-1.jpg',
            voice: 'ko-KR-Neural2-C', // Google TTS voice
            description: '10년 경력의 인사 전문가. 지원자의 잠재력을 발견하는 것을 중요하게 생각합니다.',
            style: '친근하고 격려하는 스타일로, 지원자가 편안하게 자신의 강점을 표현할 수 있도록 돕습니다.'
        },
        {
            id: 'interviewer_2',
            name: '이서연',
            title: '개발팀 리더',
            company: 'TBD',
            personality: 'professional',
            image: '/static/images/interviewer-2.jpg',
            voice: 'ko-KR-Neural2-A',
            description: '5년 차 시니어 개발자. 기술력과 문제 해결 능력을 중시합니다.',
            style: '전문적이고 체계적인 접근으로, 지원자의 실력을 객관적으로 평가합니다.'
        },
        {
            id: 'interviewer_3',
            name: '박준혁',
            title: '임원 면접관',
            company: 'TBD',
            personality: 'strict',
            image: '/static/images/interviewer-3.jpg',
            voice: 'ko-KR-Neural2-C',
            description: '15년 경력의 경영진. 리더십과 전략적 사고를 평가합니다.',
            style: '엄격하고 날카로운 질문으로 지원자의 깊이 있는 사고를 검증합니다.'
        }
    ];
    
    // 기본적으로 친근한 면접관 선택 (추후 사용자 레벨에 따라 변경 가능)
    const selectedInterviewer = interviewers[0];
    
    return selectedInterviewer;
}

/**
 * 회사 매칭
 */
async function matchCompany(userProfile, env) {
    // 사용자 프로필 기반으로 적합한 회사 추천
    const companies = [
        {
            id: 'company_1',
            name: '네이버',
            industry: 'IT/인터넷',
            size: '대기업',
            culture: '도전적이고 혁신적인 문화',
            benefits: '연봉 상위권, 복지 우수',
            matchScore: 0
        },
        {
            id: 'company_2',
            name: '카카오',
            industry: 'IT/플랫폼',
            size: '대기업',
            culture: '수평적이고 자율적인 문화',
            benefits: '스톡옵션, 유연 근무',
            matchScore: 0
        },
        {
            id: 'company_3',
            name: '라인',
            industry: 'IT/메신저',
            size: '대기업',
            culture: '글로벌 지향, 기술 중심',
            benefits: '글로벌 경험, 기술 성장',
            matchScore: 0
        },
        {
            id: 'company_4',
            name: '쿠팡',
            industry: 'IT/이커머스',
            size: '대기업',
            culture: '빠른 성장, 고강도 업무',
            benefits: '높은 연봉, 빠른 성장',
            matchScore: 0
        },
        {
            id: 'company_5',
            name: '토스',
            industry: '핀테크',
            size: '중견기업',
            culture: '혁신적, 도전적',
            benefits: '스톡옵션, 파격적 복지',
            matchScore: 0
        }
    ];
    
    // 매칭 점수 계산 (간단한 알고리즘)
    companies.forEach(company => {
        let score = 0;
        
        // 관심 분야 매칭
        if (userProfile.interests) {
            if (userProfile.interests.some(interest => 
                interest.toLowerCase().includes('개발') || 
                interest.toLowerCase().includes('it') ||
                interest.toLowerCase().includes('프로그래밍')
            )) {
                if (company.industry.includes('IT')) score += 30;
            }
        }
        
        // 목표 직무 매칭
        if (userProfile.targetPositions) {
            userProfile.targetPositions.forEach(position => {
                if (position.toLowerCase().includes('개발자') && company.industry.includes('IT')) {
                    score += 20;
                }
                if (position.toLowerCase().includes('기획') && company.size === '대기업') {
                    score += 15;
                }
            });
        }
        
        // 기본 점수 (랜덤)
        score += Math.floor(Math.random() * 50);
        
        company.matchScore = score;
    });
    
    // 점수 순으로 정렬
    companies.sort((a, b) => b.matchScore - a.matchScore);
    
    // 최고 점수 회사 선택
    return companies[0];
}

/**
 * GPT로 맞춤형 질문 생성
 */
async function generateCustomQuestions(userProfile, company, interviewer, env) {
    try {
        // GPT 프롬프트 생성
        const prompt = `
당신은 ${company.name}의 ${interviewer.title} ${interviewer.name}입니다.

**면접관 성격**: ${interviewer.personality}
**면접관 스타일**: ${interviewer.style}

**지원자 정보:**
- 관심 분야: ${userProfile.interests.join(', ') || '정보 없음'}
- 목표 직무: ${userProfile.targetPositions.join(', ') || '정보 없음'}
- 적성검사 결과: ${userProfile.aptitudeTest?.type || '정보 없음'}

**회사 정보:**
- 회사명: ${company.name}
- 산업: ${company.industry}
- 규모: ${company.size}
- 문화: ${company.culture}

**질문 생성 요구사항:**
1. 총 7개의 면접 질문을 생성해주세요
2. 질문은 지원자의 프로필과 ${company.name}의 채용 기준에 맞춰져야 합니다
3. 질문 순서:
   - 1번: 자기소개 (아이스브레이킹)
   - 2번: 지원 동기
   - 3-4번: 경험 기반 질문 (지원자 프로필 활용)
   - 5-6번: 역량 평가 질문 (문제 해결, 팀워크 등)
   - 7번: 마무리 질문 (포부, 마지막 하고 싶은 말)

4. 각 질문은 자연스럽고 실제 면접처럼 느껴져야 합니다
5. ${interviewer.personality} 스타일을 반영해주세요

**JSON 형식으로 반환:**
{
    "questions": [
        {
            "id": 1,
            "category": "intro",
            "question": "질문 내용",
            "intent": "질문 의도",
            "keywords": ["키워드1", "키워드2"],
            "expectedDuration": 60
        },
        ...
    ]
}
`;

        // OpenAI API 호출
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: '당신은 전문 면접관입니다. 지원자의 배경을 고려하여 적절한 면접 질문을 생성합니다.'
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
            throw new Error('OpenAI API 호출 실패');
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // JSON 파싱
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return result.questions;
        }
        
        // GPT 응답 파싱 실패 시 기본 질문 반환
        return getDefaultQuestions(company, interviewer);
        
    } catch (error) {
        console.error('[GenerateQuestions] Error:', error);
        return getDefaultQuestions(company, interviewer);
    }
}

/**
 * 기본 질문 (GPT 실패 시)
 */
function getDefaultQuestions(company, interviewer) {
    return [
        {
            id: 1,
            category: 'intro',
            question: `안녕하세요, ${company.name} ${interviewer.title} ${interviewer.name}입니다. 먼저 간단하게 자기소개를 부탁드립니다.`,
            intent: '지원자의 기본 정보와 커뮤니케이션 능력 파악',
            keywords: ['학력', '경력', '강점'],
            expectedDuration: 60
        },
        {
            id: 2,
            category: 'motivation',
            question: `${company.name}에 지원하신 동기는 무엇인가요?`,
            intent: '회사에 대한 관심도와 준비성 평가',
            keywords: ['회사 분석', '직무 이해', '열정'],
            expectedDuration: 60
        },
        {
            id: 3,
            category: 'experience',
            question: '가장 기억에 남는 프로젝트나 경험에 대해 말씀해주세요.',
            intent: '실무 경험과 문제 해결 능력 확인',
            keywords: ['프로젝트', '역할', '성과'],
            expectedDuration: 90
        },
        {
            id: 4,
            category: 'teamwork',
            question: '팀 프로젝트에서 갈등이 생겼을 때 어떻게 해결하시나요?',
            intent: '팀워크와 갈등 해결 능력 평가',
            keywords: ['소통', '협력', '문제 해결'],
            expectedDuration: 60
        },
        {
            id: 5,
            category: 'strength',
            question: '본인의 가장 큰 강점과 약점은 무엇인가요?',
            intent: '자기 인식과 개선 의지 확인',
            keywords: ['강점', '약점', '개선'],
            expectedDuration: 60
        },
        {
            id: 6,
            category: 'problem_solving',
            question: '예상치 못한 문제가 발생했을 때 어떻게 대처하시나요?',
            intent: '문제 해결 능력과 위기 관리 능력 평가',
            keywords: ['문제 해결', '대처', '결과'],
            expectedDuration: 60
        },
        {
            id: 7,
            category: 'closing',
            question: `마지막으로 ${company.name}에 입사하게 된다면 어떤 목표를 가지고 일하시겠습니까?`,
            intent: '비전과 장기적인 목표 확인',
            keywords: ['목표', '비전', '기여'],
            expectedDuration: 60
        }
    ];
}
