/**
 * AI 영상 면접 - 개인화 질문 생성 API
 */

interface CompanyProfile {
  name: string;
  industry: string;
  position: string;
  keyRequirements: string[];
}

interface UserProfile {
  name?: string;
  email?: string;
  aptitudeTest?: any;
  interviewHistory?: any[];
  mentorChats?: any[];
  portfolio?: any;
}

/**
 * 사용자 프로필 기반 맞춤 회사 추천 - 다국어 지원
 */
async function recommendCompanies(profile: UserProfile, context: any, language: string = 'ko'): Promise<CompanyProfile[]> {
  const apiKey = context.env.OPENAI_API_KEY;
  
  const prompts: { [key: string]: string } = {
    ko: `당신은 취업 전문가입니다. 다음 사용자 프로필을 분석하여 실제 한국 대기업 3곳을 추천하고, 각 회사의 적합한 직무를 선정해주세요.`,
    en: `You are a career expert. Analyze the following user profile and recommend 3 real Korean companies with suitable positions.`,
    zh: `您是职业专家。分析以下用户资料并推荐3家真实的韩国公司及合适的职位。`
  };
  
  const prompt = `${prompts[language] || prompts['ko']}

**User Profile:**
${JSON.stringify(profile, null, 2)}

**Requirements:**
1. Real Korean companies (Samsung, LG, Hyundai, SK, Kakao, Naver, etc.)
2. Consider aptitude test, interview history, portfolio
3. Suitable position for each company
4. 3-5 key requirements for each position

**Output Format (JSON):**
[
  {
    "name": "Company Name",
    "industry": "Industry",
    "position": "Position",
    "keyRequirements": ["Requirement1", "Requirement2", "Requirement3"]
  }
]`;

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
          { role: 'system', content: prompts[language] || prompts['ko'] },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);
    
    return result.companies || [];
  } catch (error) {
    console.error('[InterviewQuestions] Company recommendation error:', error);
    
    // 기본 회사 목록 반환
    return [
      {
        name: "삼성전자",
        industry: "전자/IT",
        position: "소프트웨어 엔지니어",
        keyRequirements: ["알고리즘", "문제해결능력", "팀워크", "기술 트렌드 이해"]
      },
      {
        name: "네이버",
        industry: "인터넷/플랫폼",
        position: "백엔드 개발자",
        keyRequirements: ["서버 개발", "데이터베이스", "클라우드", "성능 최적화"]
      },
      {
        name: "카카오",
        industry: "인터넷/모바일",
        position: "프론트엔드 개발자",
        keyRequirements: ["React/Vue", "UI/UX", "웹 표준", "사용자 경험"]
      }
    ];
  }
}

/**
 * 회사별 맞춤 면접 질문 생성 - 다국어 지원
 */
async function generateInterviewQuestions(
  company: CompanyProfile,
  profile: UserProfile,
  context: any,
  language: string = 'ko'
): Promise<string[]> {
  const apiKey = context.env.OPENAI_API_KEY;
  
  const systemPrompts: { [key: string]: string } = {
    ko: `당신은 ${company.name} ${company.position} 직무의 시니어 면접관입니다.`,
    en: `You are a senior interviewer for ${company.position} at ${company.name}.`,
    zh: `您是${company.name}公司${company.position}职位的资深面试官。`
  };
  
  const prompt = `${systemPrompts[language] || systemPrompts['ko']}
  
**Company Info:**
- Company: ${company.name}
- Position: ${company.position}
- Key Requirements: ${company.keyRequirements.join(', ')}

**Candidate Profile:**
${JSON.stringify(profile, null, 2)}

**Generate 7 Interview Questions:**
1. Self-introduction (30s-1min)
2. Motivation and company/position understanding
3. Technical/competency question (with specific experience)
4. Problem-solving situation (STAR method)
5. Teamwork/collaboration experience
6. Growth and career plan
7. Closing question

**Requirements:**
- Questions appropriate for ${company.name} interview
- Customized based on candidate background
- Specific and answerable
- One sentence per question

**Output Format (JSON):**
{
  "questions": ["Question1", "Question2", "Question3", "Question4", "Question5", "Question6", "Question7"]
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
            content: systemPrompts[language] || systemPrompts['ko']
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
    
    return result.questions || [];
  } catch (error) {
    console.error('[InterviewQuestions] Question generation error:', error);
    
    // 기본 질문 반환 (언어별)
    const defaultQuestions: { [key: string]: string[] } = {
      ko: [
        "자기소개를 1분 이내로 부탁드립니다.",
        `${company.name}에 지원하신 동기는 무엇인가요?`,
        `${company.position} 직무에 필요한 본인의 강점은 무엇인가요?`,
        "가장 어려웠던 프로젝트와 그것을 어떻게 해결했는지 말씀해주세요.",
        "팀 내에서 갈등이 발생했을 때 어떻게 대처하시나요?",
        `${company.name}에서 이루고 싶은 목표는 무엇인가요?`,
        "마지막으로 하고 싶은 말씀이 있으신가요?"
      ],
      en: [
        "Please introduce yourself within 1 minute.",
        `Why did you apply to ${company.name}?`,
        `What are your strengths for the ${company.position} position?`,
        "Tell me about your most challenging project and how you solved it.",
        "How do you handle conflicts within a team?",
        `What are your goals at ${company.name}?`,
        "Do you have any final comments?"
      ],
      zh: [
        "请在1分钟内自我介绍。",
        `您为什么申请${company.name}？`,
        `您在${company.position}职位上的优势是什么？`,
        "请告诉我您最具挑战性的项目以及如何解决的。",
        "您如何处理团队内的冲突？",
        `您在${company.name}的目标是什么？`,
        "您还有什么要补充的吗？"
      ]
    };
    
    return defaultQuestions[language] || defaultQuestions['ko'];
  }
}

/**
 * 메인 핸들러 - 다국어 지원
 */
export const onRequestPost = async (context: any) => {
  try {
    const { email, language = 'ko' } = await context.request.json();
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: language === 'en' ? 'Email is required.' : language === 'zh' ? '需要电子邮件。' : '이메일이 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자 프로필 가져오기
    const profileResponse = await fetch(`${context.request.url.split('/api/')[0]}/api/user-profile?email=${encodeURIComponent(email)}`);
    
    if (!profileResponse.ok) {
      throw new Error('사용자 프로필 조회 실패');
    }

    const profileData = await profileResponse.json();
    const profile: UserProfile = profileData.profile || {};

    // 1. 맞춤 회사 추천 (언어 전달)
    const companies = await recommendCompanies(profile, context, language);
    
    // 2. 각 회사별 면접 질문 생성 (언어 전달)
    const interviewData = await Promise.all(
      companies.map(async (company) => {
        const questions = await generateInterviewQuestions(company, profile, context, language);
        return {
          company,
          questions
        };
      })
    );

    // 3. 첫 번째 회사를 기본으로 선택
    const selectedInterview = interviewData[0];

    return new Response(JSON.stringify({
      success: true,
      data: {
        profile,
        companies,
        selectedCompany: selectedInterview.company,
        questions: selectedInterview.questions,
        allInterviews: interviewData,
        language
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[InterviewQuestions] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '질문 생성 실패'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
