/**
 * 면접 상세 결과 조회 API
 * 특정 면접의 전체 데이터를 조회
 */

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: '세션 ID가 필요합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { DB } = context.env;

    // 1. 면접 세션 조회
    const session = await DB.prepare(`
      SELECT 
        is.*,
        u.email, u.name as user_name
      FROM interview_sessions is
      LEFT JOIN users u ON is.user_id = u.id
      WHERE is.session_id = ?
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        error: '면접 결과를 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. 질문 조회
    const questions = await DB.prepare(`
      SELECT id, question_index, question_text, created_at
      FROM interview_questions
      WHERE session_id = ?
      ORDER BY question_index
    `).bind(session.id).all();

    // 3. 답변 조회
    const answers = await DB.prepare(`
      SELECT 
        ia.*,
        iq.question_text
      FROM interview_answers ia
      LEFT JOIN interview_questions iq ON ia.question_id = iq.id
      WHERE ia.session_id = ?
      ORDER BY ia.question_index
    `).bind(session.id).all();

    // 4. 영상 분석 결과 조회
    const videoAnalysis = await DB.prepare(`
      SELECT *
      FROM video_analysis
      WHERE session_id = ?
    `).bind(session.id).first();

    // 5. 종합 평가 조회
    const evaluation = await DB.prepare(`
      SELECT *
      FROM comprehensive_evaluation
      WHERE session_id = ?
    `).bind(session.id).first();

    // JSON 필드 파싱
    const parsedSession = {
      ...session,
      keyRequirements: JSON.parse(session.key_requirements || '[]')
    };

    const parsedAnswers = answers.results.map((answer: any) => ({
      ...answer,
      keywords: JSON.parse(answer.keywords || '[]')
    }));

    const parsedEvaluation = evaluation ? {
      ...evaluation,
      videoStrengths: JSON.parse(evaluation.video_strengths || '[]'),
      videoConcerns: JSON.parse(evaluation.video_concerns || '[]'),
      answerStrengths: JSON.parse(evaluation.answer_strengths || '[]'),
      answerConcerns: JSON.parse(evaluation.answer_concerns || '[]'),
      recommendations: JSON.parse(evaluation.recommendations || '[]')
    } : null;

    const parsedVideoAnalysis = videoAnalysis ? {
      ...videoAnalysis,
      expressionMetrics: {
        happy: videoAnalysis.expression_happy,
        neutral: videoAnalysis.expression_neutral,
        nervous: videoAnalysis.expression_nervous,
        speaking: videoAnalysis.expression_speaking
      },
      gazeMetrics: {
        center: videoAnalysis.gaze_center,
        left: videoAnalysis.gaze_left,
        right: videoAnalysis.gaze_right,
        up: videoAnalysis.gaze_up,
        down: videoAnalysis.gaze_down
      },
      postureMetrics: {
        good: videoAnalysis.posture_good,
        tilted: videoAnalysis.posture_tilted,
        leaning: videoAnalysis.posture_leaning,
        fidgeting: videoAnalysis.posture_fidgeting
      }
    } : null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        session: parsedSession,
        questions: questions.results,
        answers: parsedAnswers,
        videoAnalysis: parsedVideoAnalysis,
        evaluation: parsedEvaluation
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[InterviewDetail] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '면접 상세 조회 실패'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
