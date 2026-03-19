/**
 * 패널 면접 개별 평가 API
 * Phase 8.3: 패널 면접 고도화
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const {
            sessionId,
            interviewerId,
            questionIndex,
            answer,
            videoMetrics
        } = body;

        // 입력 검증
        if (!sessionId || !interviewerId || questionIndex === undefined || !answer) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // OpenAI API로 개별 평가
        const evaluation = await evaluateAnswer(
            interviewerId,
            questionIndex,
            answer,
            videoMetrics,
            env.OPENAI_API_KEY
        );

        // D1 데이터베이스에 저장
        await env.DB.prepare(`
            INSERT INTO panel_interview_evaluations (
                session_id,
                interviewer_id,
                question_index,
                answer_text,
                video_metrics,
                evaluation_result,
                score,
                feedback,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            sessionId,
            interviewerId,
            questionIndex,
            answer,
            JSON.stringify(videoMetrics || {}),
            JSON.stringify(evaluation),
            evaluation.score,
            evaluation.feedback,
            new Date().toISOString()
        ).run();

        return new Response(JSON.stringify({
            success: true,
            data: evaluation
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[panel-evaluate] Error:', error);
        
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
 * 답변 평가 (OpenAI GPT-4)
 */
async function evaluateAnswer(interviewerId, questionIndex, answer, videoMetrics, apiKey) {
    // 면접관 정보 (간단한 매핑)
    const interviewerProfiles = {
        'interviewer_001': {
            name: '김서연',
            role: 'HR 매니저',
            specialty: '인성, 조직적합성, 커뮤니케이션',
            weights: { personality: 0.4, communication: 0.3, cultureFit: 0.2, other: 0.1 }
        },
        'interviewer_002': {
            name: '박준혁',
            role: '기술 리드',
            specialty: '기술역량, 문제해결, 코딩',
            weights: { technicalSkill: 0.5, problemSolving: 0.3, codeQuality: 0.15, other: 0.05 }
        },
        'interviewer_003': {
            name: '이민지',
            role: '프로젝트 매니저',
            specialty: '프로젝트관리, 리더십, 의사결정',
            weights: { leadership: 0.3, execution: 0.3, decisionMaking: 0.25, communication: 0.15 }
        },
        'interviewer_004': {
            name: '최동욱',
            role: '임원',
            specialty: '전략적 사고, 비즈니스 감각, 리더십',
            weights: { strategicThinking: 0.4, businessAcumen: 0.3, leadership: 0.2, vision: 0.1 }
        },
        'interviewer_005': {
            name: '강혜진',
            role: '마케팅 디렉터',
            specialty: '창의성, 마케팅 전략, 커뮤니케이션',
            weights: { creativity: 0.35, marketing: 0.35, communication: 0.2, other: 0.1 }
        }
    };

    const interviewer = interviewerProfiles[interviewerId] || interviewerProfiles['interviewer_001'];

    // 프롬프트 구성
    const prompt = `당신은 ${interviewer.name} (${interviewer.role})입니다.
전문 분야: ${interviewer.specialty}

면접 질문 ${questionIndex + 1}에 대한 지원자의 답변을 평가해주세요.

**지원자 답변:**
${answer}

**영상 분석 지표:**
- 표정 점수: ${videoMetrics?.expressionScore || 'N/A'}
- 시선 점수: ${videoMetrics?.gazeScore || 'N/A'}
- 자세 점수: ${videoMetrics?.postureScore || 'N/A'}

**평가 기준:**
${Object.entries(interviewer.weights).map(([key, weight]) => 
    `- ${key}: ${(weight * 100).toFixed(0)}%`
).join('\n')}

다음 JSON 형식으로 평가를 제공해주세요:
{
  "score": 0-100 점수,
  "grade": "A+/A/B/C/D",
  "strengths": ["강점 1", "강점 2", ...],
  "weaknesses": ["개선점 1", "개선점 2", ...],
  "feedback": "종합 피드백 (2-3문장)",
  "detailedScores": {
    각 평가 기준별 점수 (0-100)
  }
}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `당신은 전문 ${interviewer.role}입니다. 면접 답변을 공정하고 전문적으로 평가합니다.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const evaluation = JSON.parse(content);

        return {
            interviewerId,
            interviewerName: interviewer.name,
            interviewerRole: interviewer.role,
            ...evaluation
        };

    } catch (error) {
        console.error('[evaluateAnswer] Error:', error);
        
        // 기본 평가 반환
        return {
            interviewerId,
            interviewerName: interviewer.name,
            interviewerRole: interviewer.role,
            score: 70,
            grade: 'B',
            strengths: ['답변 내용이 적절했습니다.'],
            weaknesses: ['더 구체적인 예시가 필요합니다.'],
            feedback: '전반적으로 양호한 답변입니다. 더 자세한 설명이 추가되면 좋겠습니다.',
            detailedScores: {}
        };
    }
}
