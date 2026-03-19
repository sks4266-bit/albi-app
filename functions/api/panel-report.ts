/**
 * 패널 면접 종합 리포트 API
 * Phase 8.3: 패널 면접 고도화
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'sessionId is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 개별 평가 데이터 조회
        const { results: evaluations } = await env.DB.prepare(`
            SELECT 
                interviewer_id,
                question_index,
                evaluation_result,
                score,
                feedback
            FROM panel_interview_evaluations
            WHERE session_id = ?
            ORDER BY interviewer_id, question_index
        `).bind(sessionId).all();

        if (!evaluations || evaluations.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No evaluations found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 평가 결과 파싱
        const parsedEvaluations = evaluations.map(e => ({
            ...e,
            evaluation_result: typeof e.evaluation_result === 'string' 
                ? JSON.parse(e.evaluation_result) 
                : e.evaluation_result
        }));

        // 종합 리포트 생성
        const comprehensiveReport = await generateComprehensiveReport(
            parsedEvaluations,
            env.OPENAI_API_KEY
        );

        // 리포트 저장
        await env.DB.prepare(`
            INSERT OR REPLACE INTO panel_interview_reports (
                session_id,
                report_data,
                final_score,
                final_grade,
                hiring_recommendation,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            sessionId,
            JSON.stringify(comprehensiveReport),
            comprehensiveReport.finalScore,
            comprehensiveReport.finalGrade,
            comprehensiveReport.hiringRecommendation,
            new Date().toISOString()
        ).run();

        return new Response(JSON.stringify({
            success: true,
            data: comprehensiveReport
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[panel-report] Error:', error);
        
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
 * 종합 리포트 생성
 */
async function generateComprehensiveReport(evaluations, apiKey) {
    // 면접관별 평균 점수 계산
    const interviewerScores = {};
    const interviewerFeedbacks = {};

    evaluations.forEach(e => {
        const id = e.interviewer_id;
        if (!interviewerScores[id]) {
            interviewerScores[id] = [];
            interviewerFeedbacks[id] = [];
        }
        interviewerScores[id].push(e.score);
        interviewerFeedbacks[id].push(e.feedback);
    });

    const interviewerAverages = Object.keys(interviewerScores).map(id => {
        const scores = interviewerScores[id];
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { interviewerId: id, avgScore };
    });

    // 전체 평균 점수
    const allScores = evaluations.map(e => e.score);
    const finalScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    // 등급 결정
    let finalGrade = 'D';
    if (finalScore >= 90) finalGrade = 'A+';
    else if (finalScore >= 80) finalGrade = 'A';
    else if (finalScore >= 70) finalGrade = 'B';
    else if (finalScore >= 60) finalGrade = 'C';

    // 채용 추천
    let hiringRecommendation = '검토 필요';
    if (finalScore >= 85) hiringRecommendation = '적극 추천';
    else if (finalScore >= 75) hiringRecommendation = '추천';
    else if (finalScore >= 65) hiringRecommendation = '조건부 추천';
    else hiringRecommendation = '재검토';

    // GPT-4를 사용한 종합 분석
    const synthesisPrompt = `다음은 패널 면접 결과입니다.

**면접관별 평가 요약:**
${interviewerAverages.map(ia => {
    const feedbacks = interviewerFeedbacks[ia.interviewerId];
    return `
면접관 ${ia.interviewerId}:
- 평균 점수: ${ia.avgScore.toFixed(1)}
- 피드백: ${feedbacks.join(' ')}
`;
}).join('\n')}

**전체 점수:** ${finalScore}점 (${finalGrade})

다음 JSON 형식으로 종합 리포트를 작성해주세요:
{
  "executiveSummary": "경영진을 위한 요약 (2-3문장)",
  "overallAssessment": "전체 평가 (3-4문장)",
  "keyStrengths": ["주요 강점 1", "주요 강점 2", ...],
  "keyConcerns": ["주요 우려사항 1", "주요 우려사항 2", ...],
  "consensusAreas": ["면접관들의 공통 의견"],
  "divergentViews": ["면접관들 간 의견 차이"],
  "recommendations": ["추천사항 1", "추천사항 2", ...],
  "nextSteps": ["다음 단계 제안"]
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
                        content: '당신은 경험 많은 채용 담당자입니다. 패널 면접 결과를 종합하여 공정하고 통찰력 있는 리포트를 작성합니다.'
                    },
                    {
                        role: 'user',
                        content: synthesisPrompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const synthesis = JSON.parse(content);

        return {
            finalScore,
            finalGrade,
            hiringRecommendation,
            interviewerScores: interviewerAverages,
            individualEvaluations: evaluations.map(e => ({
                interviewerId: e.interviewer_id,
                interviewerName: e.evaluation_result.interviewerName,
                interviewerRole: e.evaluation_result.interviewerRole,
                questionIndex: e.question_index,
                score: e.score,
                grade: e.evaluation_result.grade,
                feedback: e.feedback,
                strengths: e.evaluation_result.strengths,
                weaknesses: e.evaluation_result.weaknesses
            })),
            synthesis,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('[generateComprehensiveReport] Error:', error);
        
        // 기본 리포트 반환
        return {
            finalScore,
            finalGrade,
            hiringRecommendation,
            interviewerScores: interviewerAverages,
            individualEvaluations: evaluations.map(e => ({
                interviewerId: e.interviewer_id,
                questionIndex: e.question_index,
                score: e.score,
                feedback: e.feedback
            })),
            synthesis: {
                executiveSummary: `전체 평균 ${finalScore}점으로 ${finalGrade} 등급입니다.`,
                overallAssessment: '전반적으로 양호한 면접 수행 결과를 보였습니다.',
                keyStrengths: ['성실한 답변 태도'],
                keyConcerns: ['추가 검토 필요'],
                consensusAreas: ['전문성 확인'],
                divergentViews: [],
                recommendations: ['추가 인터뷰 고려'],
                nextSteps: ['다음 단계 진행']
            },
            generatedAt: new Date().toISOString()
        };
    }
}
