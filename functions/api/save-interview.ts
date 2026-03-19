/**
 * 면접 이력 저장 API
 * 면접 종료 후 모든 데이터를 D1에 저장
 */

interface SaveInterviewRequest {
  email: string;
  sessionId: string;
  company: {
    name: string;
    industry: string;
    position: string;
    keyRequirements: string[];
  };
  questions: string[];
  answers: Array<{
    question: string;
    answer: string;
    duration: number;
    wordCount: number;
    keywords: string[];
  }>;
  videoAnalysis: {
    duration: number;
    totalFrames: number;
    metrics: {
      expression: { [key: string]: number };
      gaze: { [key: string]: number };
      posture: { [key: string]: number };
    };
    score: number;
    grade: string;
  };
  comprehensiveEvaluation: {
    finalScore: number;
    finalGrade: string;
    hiringProbability: string;
    videoScore: number;
    answerScore: number;
    executiveSummary: string;
    overallAssessment: string;
    videoPerformance: {
      summary: string;
      strengths: string[];
      concerns: string[];
    };
    answerPerformance: {
      summary: string;
      strengths: string[];
      concerns: string[];
    };
    recommendations: string[];
    nextSteps: string;
  };
  answerAnalysis: {
    scores: {
      completeness: number;
      jobFit: number;
      communication: number;
      growth: number;
    };
    totalScore: number;
    grade: string;
    answerFeedback: Array<{
      question: string;
      score: number;
      feedback: string;
    }>;
  };
  startedAt: string;
  endedAt: string;
}

export const onRequestPost = async (context: any) => {
  try {
    const request: SaveInterviewRequest = await context.request.json();
    const { DB } = context.env;

    console.log('[SaveInterview] Saving interview:', request.sessionId);

    // 1. 사용자 확인 또는 생성
    const existingUser = await DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(request.email).first();

    let userId: number;
    
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const insertUser = await DB.prepare(
        'INSERT INTO users (email, created_at, updated_at) VALUES (?, datetime("now"), datetime("now"))'
      ).bind(request.email).run();
      
      userId = insertUser.meta.last_row_id;
    }

    // 2. 면접 세션 저장
    const duration = Math.floor((new Date(request.endedAt).getTime() - new Date(request.startedAt).getTime()) / 1000);
    
    const insertSession = await DB.prepare(`
      INSERT INTO interview_sessions (
        user_id, session_id, company_name, company_industry, position, key_requirements,
        started_at, ended_at, duration_seconds,
        video_score, answer_score, final_score, final_grade, hiring_probability,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))
    `).bind(
      userId,
      request.sessionId,
      request.company.name,
      request.company.industry || '',
      request.company.position,
      JSON.stringify(request.company.keyRequirements),
      request.startedAt,
      request.endedAt,
      duration,
      request.comprehensiveEvaluation.videoScore,
      request.comprehensiveEvaluation.answerScore,
      request.comprehensiveEvaluation.finalScore,
      request.comprehensiveEvaluation.finalGrade,
      request.comprehensiveEvaluation.hiringProbability,
      'completed'
    ).run();

    const sessionDbId = insertSession.meta.last_row_id;

    // 3. 질문 저장
    for (let i = 0; i < request.questions.length; i++) {
      await DB.prepare(`
        INSERT INTO interview_questions (session_id, question_index, question_text, created_at)
        VALUES (?, ?, ?, datetime("now"))
      `).bind(sessionDbId, i, request.questions[i]).run();
    }

    // 4. 답변 저장
    const questionIds = await DB.prepare(
      'SELECT id, question_index FROM interview_questions WHERE session_id = ? ORDER BY question_index'
    ).bind(sessionDbId).all();

    for (let i = 0; i < request.answers.length; i++) {
      const answer = request.answers[i];
      const questionId = questionIds.results[i]?.id;
      const answerFeedback = request.answerAnalysis.answerFeedback[i];

      if (questionId) {
        await DB.prepare(`
          INSERT INTO interview_answers (
            session_id, question_id, question_index,
            answer_text, answer_duration_seconds, word_count, keywords,
            answer_score, feedback, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
        `).bind(
          sessionDbId,
          questionId,
          i,
          answer.answer,
          answer.duration,
          answer.wordCount,
          JSON.stringify(answer.keywords),
          answerFeedback?.score || 0,
          answerFeedback?.feedback || ''
        ).run();
      }
    }

    // 5. 영상 분석 결과 저장
    const va = request.videoAnalysis;
    await DB.prepare(`
      INSERT INTO video_analysis (
        session_id, total_frames, analyzed_frames, fps,
        expression_happy, expression_neutral, expression_nervous, expression_speaking, expression_score,
        gaze_center, gaze_left, gaze_right, gaze_up, gaze_down, gaze_score, gaze_focus_rate,
        posture_good, posture_tilted, posture_leaning, posture_fidgeting, posture_score,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `).bind(
      sessionDbId,
      va.totalFrames,
      va.totalFrames,
      va.duration > 0 ? va.totalFrames / va.duration : 0,
      va.metrics.expression.happy || 0,
      va.metrics.expression.neutral || 0,
      va.metrics.expression.nervous || 0,
      va.metrics.expression.speaking || 0,
      va.score,
      va.metrics.gaze.center || 0,
      va.metrics.gaze.left || 0,
      va.metrics.gaze.right || 0,
      va.metrics.gaze.up || 0,
      va.metrics.gaze.down || 0,
      Math.round((va.metrics.gaze.center || 0) / va.totalFrames * 100),
      (va.metrics.gaze.center || 0) / va.totalFrames,
      va.metrics.posture.good || 0,
      va.metrics.posture.tilted || 0,
      va.metrics.posture.leaning || 0,
      va.metrics.posture.fidgeting || 0,
      va.score
    ).run();

    // 6. 종합 평가 저장
    const ce = request.comprehensiveEvaluation;
    await DB.prepare(`
      INSERT INTO comprehensive_evaluation (
        session_id, executive_summary, overall_assessment,
        video_summary, video_strengths, video_concerns,
        answer_summary, answer_strengths, answer_concerns,
        recommendations, next_steps, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `).bind(
      sessionDbId,
      ce.executiveSummary,
      ce.overallAssessment,
      ce.videoPerformance.summary,
      JSON.stringify(ce.videoPerformance.strengths),
      JSON.stringify(ce.videoPerformance.concerns),
      ce.answerPerformance.summary,
      JSON.stringify(ce.answerPerformance.strengths),
      JSON.stringify(ce.answerPerformance.concerns),
      JSON.stringify(ce.recommendations),
      ce.nextSteps
    ).run();

    console.log('[SaveInterview] Interview saved successfully:', sessionDbId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        sessionDbId,
        sessionId: request.sessionId,
        userId
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[SaveInterview] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '면접 저장 실패'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
