/**
 * 과제 제출 및 조회 API
 * POST /api/submit-assignment - 과제 제출
 * GET /api/submit-assignment?user_id=XXX - 과제 목록 조회
 */

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
}

interface AssignmentSubmission {
  user_id: string;
  title: string;
  content: string;
  assignment_type: 'resume' | 'cover_letter' | 'interview_prep' | 'skill_test' | 'custom';
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // GET: 과제 목록 조회
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const user_id = url.searchParams.get('user_id');

      if (!user_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'user_id is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 과제 목록 조회 (최신순)
      const assignments = await env.DB.prepare(`
        SELECT 
          a.assignment_id,
          a.title,
          a.content,
          a.assignment_type,
          a.difficulty,
          a.status,
          a.submitted_at,
          a.reviewed_at,
          a.completed_at,
          f.feedback_id,
          f.feedback_text,
          f.score,
          f.strengths,
          f.improvements,
          f.suggestions
        FROM mentor_assignments a
        LEFT JOIN mentor_feedbacks f ON a.assignment_id = f.assignment_id
        WHERE a.user_id = ?
        ORDER BY a.submitted_at DESC
      `).bind(user_id).all();

      // 통계
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_assignments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          AVG(CASE WHEN status = 'completed' THEN (SELECT score FROM mentor_feedbacks WHERE assignment_id = mentor_assignments.assignment_id) ELSE NULL END) as avg_score
        FROM mentor_assignments
        WHERE user_id = ?
      `).bind(user_id).first();

      return new Response(JSON.stringify({
        success: true,
        data: {
          assignments: assignments.results.map(a => ({
            assignment_id: a.assignment_id,
            title: a.title,
            content: a.content,
            assignment_type: a.assignment_type,
            difficulty: a.difficulty,
            status: a.status,
            submitted_at: a.submitted_at,
            reviewed_at: a.reviewed_at,
            completed_at: a.completed_at,
            feedback: a.feedback_id ? {
              feedback_id: a.feedback_id,
              feedback_text: a.feedback_text,
              score: a.score,
              strengths: a.strengths ? JSON.parse(a.strengths) : [],
              improvements: a.improvements ? JSON.parse(a.improvements) : [],
              suggestions: a.suggestions ? JSON.parse(a.suggestions) : []
            } : null
          })),
          stats: {
            total_assignments: stats?.total_assignments || 0,
            completed_count: stats?.completed_count || 0,
            avg_score: stats?.avg_score ? Math.round(stats.avg_score) : 0
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (error: any) {
      console.error('Get assignments error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // POST: 과제 제출
  if (request.method === 'POST') {
    try {
      const body = await request.json() as AssignmentSubmission;
      const { user_id, title, content, assignment_type, difficulty } = body;

      if (!user_id || !title || !content || !assignment_type) {
        return new Response(JSON.stringify({
          success: false,
          error: 'user_id, title, content, assignment_type are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 구독 확인
      const subscription = await env.DB.prepare(`
        SELECT * FROM mentor_subscriptions
        WHERE user_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(user_id).first();

      if (!subscription) {
        return new Response(JSON.stringify({
          success: false,
          error: '활성 구독이 필요합니다',
          requires_subscription: true
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 과제 ID 생성
      const assignment_id = 'asn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // 과제 저장
      await env.DB.prepare(`
        INSERT INTO mentor_assignments (
          assignment_id, user_id, title, content,
          assignment_type, difficulty, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'submitted')
      `).bind(
        assignment_id,
        user_id,
        title,
        content,
        assignment_type,
        difficulty || 'medium'
      ).run();

      console.log(`✅ Assignment submitted: ${assignment_id}`);

      // AI 피드백 생성 (비동기)
      generateAIFeedback(env, assignment_id, user_id, title, content, assignment_type);

      return new Response(JSON.stringify({
        success: true,
        message: '과제가 제출되었습니다. AI 피드백을 생성 중입니다.',
        assignment_id: assignment_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (error: any) {
      console.error('Submit assignment error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
};

// AI 피드백 생성 (비동기)
async function generateAIFeedback(
  env: Env,
  assignment_id: string,
  user_id: string,
  title: string,
  content: string,
  assignment_type: string
) {
  try {
    // 과제 상태를 'reviewing'으로 변경
    await env.DB.prepare(`
      UPDATE mentor_assignments
      SET status = 'reviewing', reviewed_at = CURRENT_TIMESTAMP
      WHERE assignment_id = ?
    `).bind(assignment_id).run();

    // GPT-5로 피드백 생성
    const systemPrompt = getSystemPromptForType(assignment_type);
    
    const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `제목: ${title}\n\n내용:\n${content}` }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`GPT API error: ${response.status}`);
    }

    const data = await response.json();
    const feedbackText = data.choices[0].message.content;

    // 피드백 파싱
    const parsed = parseFeedback(feedbackText);

    // 피드백 ID 생성
    const feedback_id = 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 피드백 저장
    await env.DB.prepare(`
      INSERT INTO mentor_feedbacks (
        feedback_id, assignment_id, user_id,
        feedback_text, score, strengths, improvements, suggestions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      feedback_id,
      assignment_id,
      user_id,
      feedbackText,
      parsed.score,
      JSON.stringify(parsed.strengths),
      JSON.stringify(parsed.improvements),
      JSON.stringify(parsed.suggestions)
    ).run();

    // 과제 상태를 'completed'로 변경
    await env.DB.prepare(`
      UPDATE mentor_assignments
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE assignment_id = ?
    `).bind(assignment_id).run();

    console.log(`✅ AI feedback generated: ${feedback_id}`);

  } catch (error) {
    console.error('AI feedback generation failed:', error);
    
    // 실패 시 상태를 'submitted'로 되돌림
    await env.DB.prepare(`
      UPDATE mentor_assignments
      SET status = 'submitted'
      WHERE assignment_id = ?
    `).bind(assignment_id).run();
  }
}

// 과제 유형별 시스템 프롬프트
function getSystemPromptForType(type: string): string {
  const prompts: Record<string, string> = {
    'resume': `당신은 전문 이력서 코칭 전문가입니다. 제출된 이력서를 분석하고 다음 형식으로 피드백을 제공하세요:

[점수: 0-100]
[강점]
- 강점 1
- 강점 2
[개선사항]
- 개선사항 1
- 개선사항 2
[제안]
- 제안 1
- 제안 2

구체적이고 실용적인 조언을 제공하세요.`,

    'cover_letter': `당신은 자기소개서 전문 첨삭가입니다. 제출된 자기소개서를 분석하고 다음 형식으로 피드백을 제공하세요:

[점수: 0-100]
[강점]
- 강점 1
- 강점 2
[개선사항]
- 개선사항 1
- 개선사항 2
[제안]
- 제안 1
- 제안 2

진정성, 구체성, 논리성을 중심으로 평가하세요.`,

    'interview_prep': `당신은 면접 준비 코치입니다. 제출된 면접 답변을 분석하고 다음 형식으로 피드백을 제공하세요:

[점수: 0-100]
[강점]
- 강점 1
- 강점 2
[개선사항]
- 개선사항 1
- 개선사항 2
[제안]
- 제안 1
- 제안 2

답변의 명확성, 구체성, 설득력을 평가하세요.`,

    'skill_test': `당신은 기술 평가 전문가입니다. 제출된 답변을 분석하고 다음 형식으로 피드백을 제공하세요:

[점수: 0-100]
[강점]
- 강점 1
- 강점 2
[개선사항]
- 개선사항 1
- 개선사항 2
[제안]
- 제안 1
- 제안 2

정확성, 깊이, 실용성을 중심으로 평가하세요.`,

    'custom': `당신은 전문 멘토입니다. 제출된 내용을 분석하고 다음 형식으로 피드백을 제공하세요:

[점수: 0-100]
[강점]
- 강점 1
- 강점 2
[개선사항]
- 개선사항 1
- 개선사항 2
[제안]
- 제안 1
- 제안 2

건설적이고 구체적인 피드백을 제공하세요.`
  };

  return prompts[type] || prompts['custom'];
}

// 피드백 파싱
function parseFeedback(text: string) {
  const scoreMatch = text.match(/\[점수:\s*(\d+)\]/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

  const strengthsMatch = text.match(/\[강점\]([\s\S]*?)(?=\[개선사항\]|\[제안\]|$)/);
  const improvementsMatch = text.match(/\[개선사항\]([\s\S]*?)(?=\[제안\]|$)/);
  const suggestionsMatch = text.match(/\[제안\]([\s\S]*?)$/);

  const strengths = strengthsMatch 
    ? strengthsMatch[1].split('\n').filter(s => s.trim().startsWith('-')).map(s => s.trim().substring(1).trim())
    : [];

  const improvements = improvementsMatch
    ? improvementsMatch[1].split('\n').filter(s => s.trim().startsWith('-')).map(s => s.trim().substring(1).trim())
    : [];

  const suggestions = suggestionsMatch
    ? suggestionsMatch[1].split('\n').filter(s => s.trim().startsWith('-')).map(s => s.trim().substring(1).trim())
    : [];

  return { score, strengths, improvements, suggestions };
}
