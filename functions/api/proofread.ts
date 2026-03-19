/**
 * AI 교정 API
 * POST /api/proofread - 텍스트 교정 요청
 */

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
}

interface ProofreadRequest {
  user_id: string;
  text: string; // 교정할 텍스트
  type: 'resume' | 'cover_letter' | 'email' | 'essay' | 'general'; // 문서 유형
  target?: 'formal' | 'casual' | 'business' | 'academic'; // 목적 톤
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await request.json() as ProofreadRequest;
    const { user_id, text, type, target = 'formal' } = body;

    if (!user_id || !text || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id, text, type are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 구독 확인
    const subscription = await env.DB.prepare(`
      SELECT * FROM mentor_subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
      ORDER BY expires_at DESC LIMIT 1
    `).bind(user_id).first();

    if (!subscription) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Active subscription required',
        redirect_url: '/payment.html'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // AI 교정 프롬프트 생성
    const typeDescriptions = {
      'resume': '이력서',
      'cover_letter': '자기소개서',
      'email': '이메일',
      'essay': '에세이',
      'general': '일반 문서'
    };

    const targetDescriptions = {
      'formal': '격식 있는',
      'casual': '편안한',
      'business': '비즈니스',
      'academic': '학술적인'
    };

    const systemPrompt = `당신은 전문 교정 전문가입니다.
사용자가 작성한 ${typeDescriptions[type]} 텍스트를 ${targetDescriptions[target]} 톤으로 교정해주세요.

**교정 기준**:
1. 맞춤법 및 띄어쓰기 오류 수정
2. 문장 구조 개선 (가독성, 명확성 향상)
3. 어휘 선택 개선 (${targetDescriptions[target]} 톤에 맞게)
4. 논리적 흐름 개선
5. 불필요한 표현 제거

**응답 형식 (JSON)**:
{
  "corrected_text": "교정된 전체 텍스트",
  "changes": [
    {
      "original": "원본 문장",
      "corrected": "교정된 문장",
      "reason": "수정 이유",
      "category": "spelling|grammar|structure|vocabulary|clarity"
    }
  ],
  "statistics": {
    "original_length": 원본 글자 수,
    "corrected_length": 교정 후 글자 수,
    "total_changes": 총 수정 개수,
    "spelling_errors": 맞춤법 오류 수,
    "grammar_errors": 문법 오류 수
  },
  "overall_assessment": "전체 평가 및 개선 제안 (2-3문장)"
}`;

    const userPrompt = `다음 텍스트를 교정해주세요:\n\n${text}`;

    console.log('🔍 AI 교정 시작:', { user_id, type, target, text_length: text.length });

    // GPT-5 API 호출
    const apiResponse = await fetch(env.OPENAI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-davinci-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // 정확한 교정을 위해 낮은 temperature
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ GPT API error:', errorText);
      throw new Error(`GPT API error: ${apiResponse.status} - ${errorText}`);
    }

    const aiResult = await apiResponse.json();
    const feedbackText = aiResult.choices[0].message.content;
    const feedback = JSON.parse(feedbackText);

    console.log('✅ AI 교정 완료:', {
      changes_count: feedback.changes?.length || 0,
      original_length: feedback.statistics?.original_length || 0,
      corrected_length: feedback.statistics?.corrected_length || 0
    });

    // 교정 이력 저장
    const proofread_id = 'proof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO proofread_history (
        proofread_id, user_id, document_type, target_tone,
        original_text, corrected_text, changes_json,
        statistics_json, overall_assessment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      proofread_id,
      user_id,
      type,
      target,
      text,
      feedback.corrected_text,
      JSON.stringify(feedback.changes || []),
      JSON.stringify(feedback.statistics || {}),
      feedback.overall_assessment || '',
      now
    ).run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        proofread_id,
        corrected_text: feedback.corrected_text,
        changes: feedback.changes || [],
        statistics: feedback.statistics || {},
        overall_assessment: feedback.overall_assessment || '',
        created_at: now
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    console.error('❌ Proofread error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
