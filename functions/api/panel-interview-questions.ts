/**
 * 패널 면접 질문 생성 API
 * - 면접관별 전문 분야에 맞는 맞춤 질문 생성
 * - 3명의 면접관이 순차적으로 질문
 * - 각 면접관당 2-3개 질문
 */

interface PanelInterviewRequest {
  userId: string;
  company: {
    name: string;
    position: string;
    industry?: string;
  };
  panelIds: string[]; // 면접관 ID 목록
  userProfile?: any;
}

// 면접관 데이터 (interviewers.js와 동일)
const INTERVIEWERS = [
  {
    id: 'interviewer_001',
    name: '김서연',
    role: 'HR 매니저',
    specialty: 'HR',
    specialtyAreas: ['인성', '조직적합성', '커뮤니케이션', '팀워크'],
    questionStyle: '개방형 질문 선호. "~에 대해 말씀해 주시겠어요?" 스타일'
  },
  {
    id: 'interviewer_002',
    name: '박준혁',
    role: '기술 리드',
    specialty: 'TECH',
    specialtyAreas: ['기술역량', '문제해결', '코딩', '시스템설계'],
    questionStyle: '기술 심화 질문. "어떻게 구현하셨나요?" "성능 최적화는?" 스타일'
  },
  {
    id: 'interviewer_003',
    name: '이민지',
    role: '프로젝트 매니저',
    specialty: 'PM',
    specialtyAreas: ['프로젝트관리', '리더십', '의사결정', '위기관리'],
    questionStyle: '상황 기반 질문(STAR). "어떤 상황에서 어떻게 대처했나요?" 스타일'
  },
  {
    id: 'interviewer_004',
    name: '최동욱',
    role: 'C-레벨 임원',
    specialty: 'EXEC',
    specialtyAreas: ['전략적사고', '비즈니스감각', '비전', '성장가능성'],
    questionStyle: '압박 질문 포함. "왜?"를 반복적으로 물으며 깊이를 탐색'
  },
  {
    id: 'interviewer_005',
    name: '강혜진',
    role: '마케팅 이사',
    specialty: 'MARKETING',
    specialtyAreas: ['창의성', '트렌드이해', '고객중심사고', '브랜드전략'],
    questionStyle: '창의성 질문. "어떤 새로운 접근이 가능할까요?" 스타일'
  }
];

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await context.request.json() as PanelInterviewRequest;
    const { company, panelIds, userProfile } = body;

    if (!company || !panelIds || panelIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 면접관 정보 가져오기
    const panel = panelIds.map(id => INTERVIEWERS.find(i => i.id === id)).filter(Boolean);

    if (panel.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid interviewers found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GPT를 사용한 패널 질문 생성
    const panelQuestions = await generatePanelQuestions(company, panel, userProfile, context.env);

    return new Response(JSON.stringify({
      success: true,
      data: {
        panel,
        questions: panelQuestions,
        totalQuestions: panelQuestions.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Panel interview questions generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate panel questions'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * GPT를 사용한 패널 질문 생성
 */
async function generatePanelQuestions(
  company: any,
  panel: any[],
  userProfile: any,
  env: any
): Promise<any[]> {
  const OPENAI_API_KEY = env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const prompt = `당신은 ${company.name}의 면접 패널입니다. 다음 ${panel.length}명의 면접관이 순차적으로 질문합니다.

**회사 정보:**
- 회사명: ${company.name}
- 직무: ${company.position}

**면접 패널:**
${panel.map((interviewer, index) => `
${index + 1}. ${interviewer.name} (${interviewer.role})
   - 전문 분야: ${interviewer.specialtyAreas.join(', ')}
   - 질문 스타일: ${interviewer.questionStyle}
`).join('\n')}

**요구사항:**
각 면접관이 자신의 전문 분야에서 2-3개씩 질문을 생성해주세요.
- 1번 면접관(${panel[0].name}): 자기소개 + 전문 분야 질문 2개
- 나머지 면접관: 각자 전문 분야 질문 2-3개

총 ${panel.length * 2 + 1}개 질문을 생성해주세요.

**JSON 형식:**
[
  {
    "interviewerId": "interviewer_001",
    "interviewerName": "김서연",
    "question": "간단히 자기소개 부탁드립니다.",
    "category": "자기소개",
    "expectedDuration": 120
  },
  ...
]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: '당신은 면접 질문 생성 전문가입니다. 각 면접관의 전문 분야와 스타일에 맞는 질문을 생성합니다. 항상 유효한 JSON 형식으로 응답합니다.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    // questions 배열 반환
    return result.questions || [];
    
  } catch (error) {
    console.error('GPT question generation error:', error);
    
    // 기본 질문 반환 (fallback)
    return generateFallbackQuestions(panel);
  }
}

/**
 * Fallback 질문 생성
 */
function generateFallbackQuestions(panel: any[]): any[] {
  const questions: any[] = [];
  
  panel.forEach((interviewer, index) => {
    if (index === 0) {
      // 첫 번째 면접관: 자기소개
      questions.push({
        interviewerId: interviewer.id,
        interviewerName: interviewer.name,
        question: '간단히 자기소개 부탁드립니다.',
        category: '자기소개',
        expectedDuration: 120
      });
    }
    
    // 전문 분야 질문 2개
    questions.push({
      interviewerId: interviewer.id,
      interviewerName: interviewer.name,
      question: `${interviewer.specialtyAreas[0]}에 대한 경험을 말씀해 주세요.`,
      category: interviewer.specialtyAreas[0],
      expectedDuration: 180
    });
    
    questions.push({
      interviewerId: interviewer.id,
      interviewerName: interviewer.name,
      question: `${interviewer.specialtyAreas[1]} 관련하여 어려웠던 상황과 해결 과정을 설명해 주세요.`,
      category: interviewer.specialtyAreas[1],
      expectedDuration: 180
    });
  });
  
  return questions;
}
