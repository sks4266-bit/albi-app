/**
 * 산업별/직무별 맞춤 면접 설정
 * Phase 8.4: 신규 기능 추가
 */

export const INDUSTRIES = [
    {
        id: 'it',
        name: 'IT/소프트웨어',
        icon: 'fa-laptop-code',
        positions: [
            { id: 'backend', name: '백엔드 개발자', questions: 7 },
            { id: 'frontend', name: '프론트엔드 개발자', questions: 7 },
            { id: 'fullstack', name: '풀스택 개발자', questions: 7 },
            { id: 'devops', name: 'DevOps 엔지니어', questions: 7 },
            { id: 'data', name: '데이터 엔지니어', questions: 7 },
            { id: 'ml', name: 'ML/AI 엔지니어', questions: 7 },
            { id: 'mobile', name: '모바일 개발자', questions: 7 },
            { id: 'pm', name: 'IT 프로젝트 매니저', questions: 7 }
        ],
        focusAreas: ['기술 역량', '문제 해결', '협업', '학습 능력'],
        difficulty: {
            beginner: '신입 (0-2년)',
            intermediate: '주니어 (3-5년)',
            advanced: '시니어 (5년 이상)'
        }
    },
    {
        id: 'finance',
        name: '금융/회계',
        icon: 'fa-chart-line',
        positions: [
            { id: 'analyst', name: '재무 분석가', questions: 7 },
            { id: 'accountant', name: '회계사', questions: 7 },
            { id: 'auditor', name: '감사', questions: 7 },
            { id: 'investment', name: '투자 분석가', questions: 7 },
            { id: 'risk', name: '리스크 관리', questions: 7 },
            { id: 'compliance', name: '컴플라이언스', questions: 7 }
        ],
        focusAreas: ['재무 지식', '분석 능력', '리스크 관리', '규제 이해'],
        difficulty: {
            beginner: '신입 (0-2년)',
            intermediate: '경력 (3-7년)',
            advanced: '전문가 (7년 이상)'
        }
    },
    {
        id: 'marketing',
        name: '마케팅/광고',
        icon: 'fa-bullhorn',
        positions: [
            { id: 'digital', name: '디지털 마케터', questions: 7 },
            { id: 'content', name: '콘텐츠 마케터', questions: 7 },
            { id: 'brand', name: '브랜드 매니저', questions: 7 },
            { id: 'growth', name: '그로스 해커', questions: 7 },
            { id: 'performance', name: '퍼포먼스 마케터', questions: 7 },
            { id: 'sns', name: 'SNS 마케터', questions: 7 }
        ],
        focusAreas: ['창의성', '데이터 분석', '트렌드 이해', '커뮤니케이션'],
        difficulty: {
            beginner: '신입 (0-2년)',
            intermediate: '매니저 (3-5년)',
            advanced: '디렉터 (5년 이상)'
        }
    },
    {
        id: 'sales',
        name: '영업/비즈니스',
        icon: 'fa-handshake',
        positions: [
            { id: 'b2b', name: 'B2B 영업', questions: 7 },
            { id: 'b2c', name: 'B2C 영업', questions: 7 },
            { id: 'account', name: '어카운트 매니저', questions: 7 },
            { id: 'bd', name: 'BD (사업개발)', questions: 7 },
            { id: 'cs', name: '고객 성공 매니저', questions: 7 }
        ],
        focusAreas: ['설득력', '관계 구축', '목표 달성', '협상 능력'],
        difficulty: {
            beginner: '신입 (0-2년)',
            intermediate: '시니어 (3-5년)',
            advanced: '리더 (5년 이상)'
        }
    },
    {
        id: 'hr',
        name: '인사/HR',
        icon: 'fa-users',
        positions: [
            { id: 'recruiter', name: '채용 담당자', questions: 7 },
            { id: 'hr-manager', name: 'HR 매니저', questions: 7 },
            { id: 'hrbp', name: 'HRBP', questions: 7 },
            { id: 'training', name: '교육 담당자', questions: 7 },
            { id: 'compensation', name: '보상 담당자', questions: 7 }
        ],
        focusAreas: ['인사 제도', '커뮤니케이션', '조직 이해', '공감 능력'],
        difficulty: {
            beginner: '신입 (0-2년)',
            intermediate: '담당자 (3-5년)',
            advanced: '매니저 (5년 이상)'
        }
    },
    {
        id: 'design',
        name: '디자인/크리에이티브',
        icon: 'fa-palette',
        positions: [
            { id: 'uiux', name: 'UI/UX 디자이너', questions: 7 },
            { id: 'graphic', name: '그래픽 디자이너', questions: 7 },
            { id: 'product', name: '프로덕트 디자이너', questions: 7 },
            { id: 'brand-designer', name: '브랜드 디자이너', questions: 7 },
            { id: 'motion', name: '모션 디자이너', questions: 7 }
        ],
        focusAreas: ['창의성', '디자인 원칙', '사용자 이해', '협업'],
        difficulty: {
            beginner: '주니어 (0-3년)',
            intermediate: '미드레벨 (3-6년)',
            advanced: '시니어 (6년 이상)'
        }
    },
    {
        id: 'manufacturing',
        name: '제조/생산',
        icon: 'fa-industry',
        positions: [
            { id: 'production', name: '생산관리', questions: 7 },
            { id: 'quality', name: '품질관리', questions: 7 },
            { id: 'supply', name: '공급망 관리', questions: 7 },
            { id: 'engineer', name: '생산기술', questions: 7 },
            { id: 'safety', name: '안전 관리', questions: 7 }
        ],
        focusAreas: ['프로세스 이해', '품질 관리', '안전 의식', '효율성'],
        difficulty: {
            beginner: '신입 (0-3년)',
            intermediate: '경력 (3-7년)',
            advanced: '전문가 (7년 이상)'
        }
    },
    {
        id: 'general',
        name: '일반/기타',
        icon: 'fa-briefcase',
        positions: [
            { id: 'admin', name: '일반 사무', questions: 7 },
            { id: 'assistant', name: '어시스턴트', questions: 7 },
            { id: 'intern', name: '인턴', questions: 7 },
            { id: 'entry', name: '신입 일반', questions: 7 }
        ],
        focusAreas: ['성실성', '학습 능력', '커뮤니케이션', '기본 역량'],
        difficulty: {
            beginner: '신입 (0-1년)',
            intermediate: '주니어 (1-3년)',
            advanced: '시니어 (3년 이상)'
        }
    }
];

/**
 * 난이도 설정
 */
export const DIFFICULTY_LEVELS = {
    beginner: {
        id: 'beginner',
        name: '초급',
        description: '신입/경력 1-2년',
        questionStyle: '기본적인 개념과 경험 중심',
        evaluationCriteria: ['기본 지식', '학습 의욕', '성장 가능성', '태도'],
        timePerQuestion: 120, // 2분
        helpLevel: 'high' // 코칭 적극 제공
    },
    intermediate: {
        id: 'intermediate',
        name: '중급',
        description: '경력 3-5년',
        questionStyle: '실무 경험과 문제 해결 능력 중심',
        evaluationCriteria: ['실무 능력', '문제 해결', '팀워크', '전문성'],
        timePerQuestion: 180, // 3분
        helpLevel: 'medium' // 보통 코칭
    },
    advanced: {
        id: 'advanced',
        name: '고급',
        description: '경력 5년 이상/시니어',
        questionStyle: '전략적 사고와 리더십 중심',
        evaluationCriteria: ['전략적 사고', '리더십', '비즈니스 이해', '의사결정'],
        timePerQuestion: 240, // 4분
        helpLevel: 'low' // 최소 코칭
    }
};

/**
 * 산업/직무에 따른 질문 프롬프트 생성
 */
export function generateIndustryPrompt(industry, position, difficulty) {
    const industryData = INDUSTRIES.find(i => i.id === industry);
    const positionData = industryData?.positions.find(p => p.id === position);
    const difficultyData = DIFFICULTY_LEVELS[difficulty];
    
    if (!industryData || !positionData || !difficultyData) {
        return null;
    }
    
    return {
        industry: industryData.name,
        position: positionData.name,
        difficulty: difficultyData.name,
        focusAreas: industryData.focusAreas,
        evaluationCriteria: difficultyData.evaluationCriteria,
        questionStyle: difficultyData.questionStyle,
        timePerQuestion: difficultyData.timePerQuestion,
        helpLevel: difficultyData.helpLevel
    };
}

/**
 * 맞춤 질문 생성을 위한 프롬프트 템플릿
 */
export function getCustomQuestionPrompt(config) {
    return `당신은 ${config.industry} 분야의 ${config.position} 채용을 담당하는 면접관입니다.

**지원자 수준:** ${config.difficulty} (${config.evaluationCriteria.join(', ')} 평가)
**주요 평가 영역:** ${config.focusAreas.join(', ')}
**질문 스타일:** ${config.questionStyle}

다음 7가지 질문을 생성해주세요:
1. 자기소개 및 지원 동기
2. 전공/경력 관련 기술 질문
3. 프로젝트/경험 기반 상황 질문 (STAR)
4. 문제 해결 능력 평가 질문
5. 팀워크/협업 경험 질문
6. 직무 전문성 질문
7. 성장 계획 및 비전 질문

각 질문은 ${config.timePerQuestion}초 내에 답변 가능한 수준이어야 합니다.

JSON 형식으로 반환:
{
  "questions": [
    {
      "index": 0,
      "category": "카테고리",
      "question": "질문 내용",
      "expectedDuration": 초,
      "evaluationPoints": ["평가 포인트1", "평가 포인트2", ...]
    },
    ...
  ]
}`;
}
