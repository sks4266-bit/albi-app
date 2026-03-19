/**
 * 🐝 알비 채팅 API - AI 면접 통합 엔드포인트
 * chat.html과 호환되는 형식으로 응답
 * 
 * Cloudflare Pages Functions 직접 핸들러 방식
 */

import { HybridInterviewEngine } from '../../src/hybrid-interview-engine';
import { EmployerInterviewEngine } from '../../src/employer-interview-engine';

interface Env {
  DB: D1Database;
  KV?: KVNamespace;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
}

// 세션 데이터 인터페이스
interface SessionData {
  sessionId: string;
  userId: string;
  userType: 'jobseeker' | 'employer';
  jobType: string;
  questionCount: number;
  createdAt: string;
  lastActivity: string;
  lastQuestion?: string;
  rejectionCount?: number;
  // ✨ 엔진 타입 및 직렬화된 상태
  engineType: 'hybrid' | 'employer';
  serializedEngine: any; // serialize()로 직렬화된 엔진
}

// ✨ D1에 세션 저장
async function saveSessionToD1(db: D1Database, sessionData: SessionData): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30분 후 만료
    const serializedData = JSON.stringify(sessionData);
    
    console.log('💾 Attempting to save session to D1:', {
      sessionId: sessionData.sessionId,
      dataSize: serializedData.length,
      questionCount: sessionData.questionCount
    });
    
    const result = await db.prepare(`
      INSERT OR REPLACE INTO interview_session_cache 
      (session_id, user_id, engine_state, created_at, last_activity, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      sessionData.sessionId,
      sessionData.userId,
      serializedData,
      sessionData.createdAt,
      sessionData.lastActivity,
      expiresAt
    ).run();
    
    console.log('✅ Session saved to D1:', sessionData.sessionId, 'result:', result?.success);
    return result?.success || false;
  } catch (error: any) {
    console.error('❌ Failed to save session to D1:', {
      sessionId: sessionData.sessionId,
      error: error?.message || error,
      stack: error?.stack?.substring(0, 200)
    });
    return false;
  }
}

// ✨ D1에서 세션 로드
async function loadSessionFromD1(db: D1Database, sessionId: string): Promise<SessionData | null> {
  try {
    const result = await db.prepare(`
      SELECT engine_state FROM interview_session_cache 
      WHERE session_id = ? AND expires_at > datetime('now')
    `).bind(sessionId).first();
    
    if (!result) {
      console.log('ℹ️ No session found in D1:', sessionId);
      return null;
    }
    
    const sessionData = JSON.parse(result.engine_state as string) as SessionData;
    console.log('✅ Session loaded from D1:', sessionId);
    return sessionData;
  } catch (error) {
    console.error('❌ Failed to load session from D1:', error);
    return null;
  }
}

// ✨ 만료된 세션 정리 (주기적으로 호출)
async function cleanExpiredSessions(db: D1Database): Promise<void> {
  try {
    await db.prepare(`
      DELETE FROM interview_session_cache 
      WHERE expires_at < datetime('now')
    `).run();
    console.log('🧹 Expired sessions cleaned');
  } catch (error) {
    console.error('❌ Failed to clean expired sessions:', error);
  }
}

// DB 저장 헬퍼 함수
async function saveConversationToDB(
  db: D1Database,
  sessionId: string,
  userId: string,
  userType: string,
  jobType: string,
  turnNumber: number,
  question: string,
  answer: string,
  aiResponse: string,
  turnScore: number,
  evaluationJson: any,
  responseTimeMs: number,
  sessionStatus: string
) {
  try {
    await db.prepare(`
      INSERT INTO interview_conversations 
      (session_id, user_id, user_type, job_type, turn_number, 
       question, answer, ai_response, turn_score, evaluation_json, 
       response_time_ms, session_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId, userId, userType, jobType, turnNumber,
      question, answer, aiResponse, turnScore, JSON.stringify(evaluationJson),
      responseTimeMs, sessionStatus
    ).run();
    
    console.log('✅ Conversation saved to DB');
  } catch (error) {
    console.error('❌ Failed to save conversation:', error);
    // 저장 실패해도 면접은 계속 진행
  }
}

async function saveSessionSummary(
  db: D1Database,
  sessionId: string,
  userId: string,
  jobType: string,
  region: string,
  expectedWage: number,
  finalGrade: string,
  totalScore: number,
  finalScoresJson: any,
  questionCount: number,
  totalDurationSeconds: number,
  status: string,
  recommendation: string,
  strengths: string[],
  concerns: string[],
  oneLiner: string,
  criticalReason: string
) {
  try {
    await db.prepare(`
      INSERT INTO interview_sessions 
      (session_id, user_id, job_type, region, expected_wage,
       final_grade, total_score, final_scores_json, question_count,
       total_duration_seconds, completion_rate, status, recommendation,
       strengths, concerns, one_liner, critical_reason, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      sessionId, userId, jobType, region, expectedWage,
      finalGrade, totalScore, JSON.stringify(finalScoresJson), questionCount,
      totalDurationSeconds, questionCount / 15.0, status, recommendation,
      JSON.stringify(strengths), JSON.stringify(concerns), oneLiner, criticalReason
    ).run();
    
    console.log('✅ Session summary saved to DB');
  } catch (error) {
    console.error('❌ Failed to save session summary:', error);
  }
}

/**
 * 사용자 메시지에서 업종(jobType) 추출 함수
 */
function detectJobTypeFromMessage(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();
  
  // 키워드 매핑
  const jobTypeKeywords = {
    'cafe': ['카페', '커피', '커피숍', 'cafe', 'coffee'],
    'cvs': ['편의점', '편스토어', 'cvs', '세븐', 'cu', 'gs25'],
    'restaurant': ['음식점', '식당', '레스토랑', 'restaurant'],
    'retail': ['매장', '마트', '할인점', '소매', 'retail'],
    'fastfood': ['패스트푸드', '햄버거', '버거', '맥도날드', '롯데리아', 'fastfood']
  };
  
  // "~에서 일하고 싶어요", "~로 할게요" 같은 패턴 감지
  const workIntentKeywords = ['일하고 싶', '선택', '할게요', '하고 싶', '지원', '면접'];
  const hasWorkIntent = workIntentKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!hasWorkIntent) {
    return null; // 업종 선택 의도가 없는 일반 답변
  }
  
  // 키워드로 업종 감지
  for (const [jobType, keywords] of Object.entries(jobTypeKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      console.log(`✅ Detected jobType: ${jobType} from message: "${message}"`);
      return jobType;
    }
  }
  
  return null;
}

/**
 * 답변 검증 함수 - 맥락 기반 부드러운 피드백 제공
 */
function validateAnswer(answer: string, question: string, rejectionCount: number = 0): { isValid: boolean; reason?: string; feedback?: string } {
  const trimmedAnswer = answer.trim();
  
  // 🔥 핵심 개선: 2회 이상 차단된 경우 무조건 통과 (사용자 좌절 방지)
  if (rejectionCount >= 2) {
    console.log('⚠️ User rejected twice, allowing answer:', trimmedAnswer);
    return { isValid: true };
  }
  
  // 1. 빈 답변
  if (!trimmedAnswer) {
    return {
      isValid: false,
      reason: 'empty',
      feedback: '앗, 답변이 비어있네요! 😊 편하게 생각하시는 대로 말씀해주세요. 면접은 대화처럼 진행되니까요!'
    };
  }
  
  // 2. 부정 답변 허용 (경험 없음, 모르겠음 등은 정상 답변)
  const negativeAnswers = [
    '없어요', '없습니다', '안 해봤어요', '해본 적 없어요', '경험 없어요',
    '모르겠어요', '잘 모르겠어요', '확실히 모르겠어요',
    '아니요', '아닙니다', '안 그래요', '그렇지 않아요'
  ];
  
  // "아니요 없어요", "없어요 경험이 없어서요" 같은 조합도 허용
  const hasNegativePhrase = negativeAnswers.some(phrase => trimmedAnswer.includes(phrase));
  if (hasNegativePhrase && trimmedAnswer.length >= 4) {
    console.log('✅ Negative answer accepted:', trimmedAnswer);
    return { isValid: true };
  }
  
  // 3. 너무 짧은 답변 (3자 미만만 차단)
  if (trimmedAnswer.length < 3) {
    return {
      isValid: false,
      reason: 'too_short',
      feedback: `"${trimmedAnswer}" 라고 말씀해주셨는데, 조금만 더 구체적으로 설명해주시면 좋을 것 같아요! 😊`
    };
  }
  
  // 4. 단순 단답형 (한 글자 또는 극단적으로 짧은 경우만)
  const veryShortAnswers = ['네', '응', '어', '음', '예'];
  if (veryShortAnswers.includes(trimmedAnswer)) {
    return {
      isValid: false,
      reason: 'one_word',
      feedback: `네, 알겠습니다! 그런데 면접에서는 "왜 그렇게 생각하시는지" 같은 부분도 함께 말씀해주시면 좋아요. 😊\n\n💡 예시: "네, 왜냐하면..." 이런 식으로 시작해보시겠어요?`
    };
  }
  
  // 5. 반복된 문자 (예: "ㅋㅋㅋㅋㅋ", "ㅠㅠㅠㅠㅠ")
  if (/(.)\1{4,}/.test(trimmedAnswer)) {
    return {
      isValid: false,
      reason: 'repeated_chars',
      feedback: '면접 분위기를 편하게 만들어주셔서 감사해요! 😊 하지만 면접관에게는 진지한 모습을 보여주는 것도 중요하답니다. 다시 한번 답변해주시겠어요?'
    };
  }
  
  // 6. 의미 없는 답변 (숫자만, 특수문자만)
  if (/^[\d\s!@#$%^&*()_+=\-\[\]{};:'",.<>/?\\|`~]+$/.test(trimmedAnswer)) {
    return {
      isValid: false,
      reason: 'meaningless',
      feedback: '앗! 답변이 제대로 입력되지 않았나봐요. 😅 편하게 문장으로 말씀해주시면 됩니다!'
    };
  }
  
  // 7. 스킵 의도 키워드만 차단 (모르는 것은 OK)
  const skipKeywords = ['패스', 'pass', '넘어가', '스킵', 'skip', '다음 질문'];
  if (skipKeywords.some(keyword => trimmedAnswer.includes(keyword))) {
    return {
      isValid: false,
      reason: 'skip_intent',
      feedback: '괜찮아요! 😊 정확히 모르시더라도 "제 생각엔..." 이라고 시작하시면 됩니다. 면접에서는 정답보다 "어떻게 생각하고 표현하는지"가 더 중요하거든요!'
    };
  }
  
  // 모든 검증 통과
  return { isValid: true };
}

// ✨ 메모리 캐시 (1차 캐시, 빠른 접근용 - 30초 TTL)
// 엔진 포함한 전체 세션 객체 저장
const memoryCache = new Map<string, {
  engine: any; // HybridInterviewEngine 또는 EmployerInterviewEngine
  userId: string;
  userType: string;
  jobType: string;
  questionCount: number;
  createdAt: string;
  lastActivity: string;
  lastQuestion?: string;
  rejectionCount: number;
  timestamp: number; // 캐시 타임스탬프
}>();

/**
 * POST /api/chat
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('🚀 API called');
  
  // 🧹 만료된 세션 정리 (10% 확률로 실행)
  if (Math.random() < 0.1) {
    cleanExpiredSessions(context.env.DB).catch(err => console.error('Clean error:', err));
  }
  
  try {
    console.log('📦 Parsing request body...');
    const body = await context.request.json() as any;
    console.log('✅ Body parsed:', JSON.stringify(body).substring(0, 100));
    const { 
      message, 
      userId = 'anonymous-' + Date.now(), 
      userType = 'jobseeker',
      jobType = 'cafe',
      testResult = null, // ✨ 적성검사 결과 받기
      isQuickAnswer = false // ✨ UI 버튼 클릭 여부
    } = body;

    console.log('📥 Chat request:', { userId, userType, jobType, message: message?.substring(0, 30), isQuickAnswer });

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '메시지를 입력해주세요.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✨ 1차: 메모리 캐시에서 세션 로드 (엔진 포함)
    let session: any = null;
    const cachedSession = memoryCache.get(userId);
    
    if (cachedSession && Date.now() - cachedSession.timestamp < 30000) {
      // 30초 이내 메모리 캐시 사용
      session = cachedSession;
      console.log('💾 Using memory cache:', userId);
    } else {
      // ✨ 2차: D1에서 로드 후 엔진 역직렬화
      const sessionData = await loadSessionFromD1(context.env.DB, userId);
      if (sessionData) {
        console.log('🔄 Deserializing engine from D1...');
        
        try {
          // ✨ 엔진 역직렬화
          let engine: any;
          if (sessionData.engineType === 'employer') {
            engine = EmployerInterviewEngine.deserialize(sessionData.serializedEngine);
          } else {
            engine = HybridInterviewEngine.deserialize(sessionData.serializedEngine, context.env);
          }
          
          // ✨ 세션 객체 재구성 (엔진 포함)
          session = {
            engine,
            userId: sessionData.userId,
            userType: sessionData.userType,
            jobType: sessionData.jobType,
            questionCount: sessionData.questionCount,
            createdAt: sessionData.createdAt,
            lastActivity: sessionData.lastActivity,
            lastQuestion: sessionData.lastQuestion,
            rejectionCount: sessionData.rejectionCount || 0,
            timestamp: Date.now()
          };
          
          // 메모리 캐시에 저장
          memoryCache.set(userId, session);
          console.log('✅ Engine deserialized and cached:', { 
            jobType: session.jobType, 
            questionCount: session.questionCount 
          });
        } catch (err) {
          console.error('❌ Failed to deserialize engine:', err);
          session = null;
        }
      }
    }
    
    // 🔍 사용자 메시지에서 jobType 감지 (UI 버튼 클릭일 경우에만)
    const detectedJobType = isQuickAnswer ? detectJobTypeFromMessage(message) : null;
    let finalJobType = jobType; // 기본값은 요청 body의 jobType
    
    console.log('🔍 Job type detection:', { isQuickAnswer, detectedJobType, currentJobType: session?.jobType });
    
    // 🔥 핵심 수정: UI 버튼으로 새로운 업종을 선택한 경우에만 기존 세션 삭제
    if (isQuickAnswer && detectedJobType && session && session.jobType !== detectedJobType) {
      console.log(`🔄 User changed jobType from ${session.jobType} to ${detectedJobType} via UI button, deleting old session`);
      // D1과 메모리 캐시에서 세션 삭제
      await context.env.DB.prepare(`DELETE FROM interview_session_cache WHERE session_id = ?`).bind(userId).run();
      memoryCache.delete(userId);
      session = null; // 세션 초기화하여 새로 생성하도록 유도
      finalJobType = detectedJobType; // 감지된 업종으로 변경
    } else if (isQuickAnswer && detectedJobType) {
      console.log(`✅ UI button click detected: ${detectedJobType}`);
      finalJobType = detectedJobType; // 새 세션일 경우에도 감지된 업종 사용
    } else if (session) {
      console.log(`✅ Using existing session jobType: ${session.jobType}`);
      // 기존 세션이 있으면 세션의 jobType 유지 (일반 답변은 업종 감지하지 않음)
      finalJobType = session.jobType;
    }

    if (!session) {
      console.log('🆕 Creating new session for:', userId, userType, 'jobType:', finalJobType);
      
      try {
        console.log('🔧 Creating engine instance...');
        // 엔진 선택
        let engine: any;
        
        if (userType === 'employer') {
          console.log('👔 Creating EmployerInterviewEngine...');
          engine = new EmployerInterviewEngine(finalJobType);
          console.log('✅ EmployerInterviewEngine created');
        } else {
          console.log('🚀 Creating HybridInterviewEngine (Structured + GPT-4)...');
          // ✨ 적성검사 결과 + Cloudflare 환경 변수를 엔진에 전달
          engine = new HybridInterviewEngine(finalJobType, '서울', 10000, testResult, context.env);
          console.log('✅ HybridInterviewEngine created with testResult:', testResult ? 'Yes' : 'No');
        }

        console.log('📝 Starting interview...');
        // 면접 시작
        const startResponse = engine.startInterview();
        console.log('✅ Interview started, response:', JSON.stringify(startResponse).substring(0, 100));
        
        // ✨ startResponse.message에 이미 업종별 인트로 포함되어 있음
        // message + question 조합하여 최종 응답 생성
        const fullMessage = startResponse.message 
          ? `${startResponse.message}${startResponse.question}` 
          : startResponse.question || '안녕하세요! 면접을 시작하겠습니다.';
        
        console.log(`✅ Full welcome message prepared for ${finalJobType}`);
        
        // ✨ 세션 저장 (엔진 포함)
        session = {
          engine,
          userId,
          userType,
          jobType: finalJobType,
          questionCount: 1,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          lastQuestion: fullMessage,
          rejectionCount: 0,
          timestamp: Date.now()
        };
        
        // 메모리 캐시에 저장
        memoryCache.set(userId, session);
        console.log('✅ Session created:', userId, 'jobType:', finalJobType);
        
        // ✨ D1에 세션 저장 (엔진 직렬화)
        const sessionData: SessionData = {
          sessionId: userId,
          userId,
          userType,
          jobType: finalJobType,
          questionCount: 1,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          lastQuestion: fullMessage,
          rejectionCount: 0,
          engineType: userType === 'employer' ? 'employer' : 'hybrid',
          serializedEngine: engine.serialize() // ✨ 엔진 직렬화
        };
        
        // ✨ D1에 세션 저장 (동기 대기)
        const saveSuccess = await saveSessionToD1(context.env.DB, sessionData);
        if (!saveSuccess) {
          console.warn('⚠️ D1 save failed, session will only persist in memory (30s)');
        }
        
        // 세션 시작 DB 저장 (첫 인사)
        saveConversationToDB(
          context.env.DB,
          userId,
          userId,
          userType,
          finalJobType, // ✨ finalJobType 사용
          0, // 첫 번째 턴
          '면접 시작',
          '시작',
          fullMessage, // ✅ fullMessage 사용 (firstQuestion → fullMessage 수정)
          0,
          {},
          0,
          'in_progress'
        ).catch(err => console.error('DB save error:', err));

        // 첫 질문 반환
        return new Response(JSON.stringify({
          success: true,
          data: {
            content: fullMessage,  // ✨ 전체 메시지 (인트로 + 질문)
            sessionData: {
              progress: `${startResponse.progress || '1/15'}`,
              status: 'in_progress',
              questionCount: 1,
              debug: startResponse.debug  // ✨ debug 정보도 포함
            }
          }
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      } catch (engineError: any) {
        console.error('❌ Engine creation failed:', engineError);
        return new Response(JSON.stringify({
          success: false,
          error: '면접 엔진 초기화 실패: ' + (engineError?.message || 'Unknown error')
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 기존 세션 - 답변 처리
    console.log('♻️ Using existing session:', userId);
    session.lastActivity = new Date().toISOString();
    
    const startTime = Date.now();
    const userAnswer = message.trim();

    // 📝 답변 검증 로직 (맥락 기반, 부드러운 피드백)
    const rejectionCount = session.rejectionCount || 0;
    const validationResult = validateAnswer(userAnswer, session.lastQuestion || '', rejectionCount);
    
    if (!validationResult.isValid) {
      console.log('⚠️ Invalid answer detected:', validationResult.reason, '(rejection count:', rejectionCount, ')');
      
      // 차단 횟수 증가
      session.rejectionCount = rejectionCount + 1;
      
      return Response.json({
        success: true,
        data: {
          content: validationResult.feedback,
          sessionData: {
            progress: `${session.questionCount}/15`,
            status: 'in_progress',
            questionCount: session.questionCount
          }
        }
      });
    }

    // 검증 통과 → 차단 횟수 초기화
    session.rejectionCount = 0;
    session.questionCount++;

    try {
      console.log(`🔄 Processing answer for session ${userId}, step ${session.questionCount}`);
      const response = await session.engine.processAnswer(userAnswer);
      console.log('📤 Engine response status:', response.status);
      console.log('📊 Engine response debug:', JSON.stringify(response.debug).substring(0, 200));
      
      const responseTime = Date.now() - startTime;

      // DB에 대화 저장 (비동기, 실패해도 계속 진행)
      const previousQuestion = session.lastQuestion || '면접 시작';
      const aiResponse = response.question || response.message || '답변 감사합니다!';
      const turnScore = response.debug?.score || 0;
      const evaluationJson = response.debug?.evaluation || {};
      
      saveConversationToDB(
        context.env.DB,
        userId, // sessionId로 사용
        userId,
        userType,
        session.jobType, // ✨ 세션의 jobType 사용 (사용자가 변경할 수 없도록)
        session.questionCount,
        previousQuestion,
        message.trim(),
        aiResponse,
        turnScore,
        evaluationJson,
        responseTime,
        response.status || 'in_progress'
      ).catch(err => console.error('DB save error:', err));
      
      // 다음 턴을 위해 질문 저장
      session.lastQuestion = aiResponse;

      // 응답 형식 변환
      const chatResponse: any = {
        success: true,
        data: {
          content: response.message || response.question || '답변 감사합니다!', // ✨ message 우선 (피드백+질문 포함)
          sessionData: {
            progress: `${session.questionCount}/15`,
            status: response.status || 'in_progress',
            questionCount: session.questionCount,
            debug: response.debug // ✨ 디버그 정보 포함
          }
        }
      };

      // 완료 처리
      if (response.status === 'completed') {
        console.log('✅ Interview completed for:', userId);
        
        if (userType === 'jobseeker' && response.result) {
          chatResponse.data.profile = {
            name: response.result.name || '익명',
            one_liner: response.result.one_liner || '면접 완료',
            final_grade: response.result.final_grade || 'C',
            total_score: response.result.total_score || 60,
            scores: response.result.scores || {},
            strengths: response.result.strengths || [],
            concerns: response.result.concerns || [],
            recommendation: response.result.recommendation || '면접이 완료되었습니다.'
          };
          
          // 세션 요약 저장
          const sessionDuration = Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000);
          saveSessionSummary(
            context.env.DB,
            userId, // sessionId
            userId,
            jobType,
            '서울',
            10000,
            response.result.final_grade || 'C',
            response.result.total_score || 60,
            response.result.scores || {},
            session.questionCount,
            sessionDuration,
            'completed',
            response.result.recommendation || '면접 완료',
            response.result.strengths || [],
            response.result.concerns || [],
            response.result.one_liner || '면접 완료',
            ''
          ).catch(err => console.error('Session summary save error:', err));
          
          // AI 면접 완료 보상 20P 지급
          try {
            await context.env.DB.prepare(`
              UPDATE users SET points = points + 20 WHERE id = ?
            `).bind(userId).run();
            
            await context.env.DB.prepare(`
              INSERT INTO point_transactions (
                id, user_id, amount, description, created_at
              ) VALUES (?, ?, 20, 'AI 면접 완료 보상', datetime('now'))
            `).bind(
              `pt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              userId
            ).run();
            
            console.log('✅ AI 면접 완료 보상 20P 지급:', userId);
          } catch (pointError) {
            console.error('❌ 포인트 지급 오류:', pointError);
            // 포인트 지급 실패해도 면접 결과는 정상 반환
          }
        } else if (userType === 'employer' && response.matches) {
          chatResponse.data.sessionData.matches = response.matches;
          chatResponse.data.sessionData.requirement = response.requirement || {};
        }
      } 
      
      // 탈락 처리
      else if (response.status === 'rejected' && response.result) {
        console.log('❌ Interview rejected for:', userId);
        chatResponse.data.profile = {
          name: response.result.name || '익명',
          one_liner: response.result.one_liner || '면접 탈락',
          final_grade: 'F',
          total_score: response.result.total_score || 40,
          critical_reason: response.result.critical_reason || '기준 미달',
          recommendation: response.result.recommendation || '다시 도전하세요!'
        };
        
        // 세션 요약 저장 (탈락)
        const sessionDuration = Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000);
        saveSessionSummary(
          context.env.DB,
          userId, // sessionId
          userId,
          jobType,
          '서울',
          10000,
          'F',
          response.result.total_score || 40,
          {},
          session.questionCount,
          sessionDuration,
          'rejected',
          '비추천',
          [],
          [],
          response.result.one_liner || '면접 탈락',
          response.result.critical_reason || '기준 미달'
        ).catch(err => console.error('Session summary save error:', err));
      }

      // ✨ D1에 세션 저장 (답변 처리 후 상태 업데이트)
      const updatedSessionData: SessionData = {
        sessionId: userId,
        userId: session.userId,
        userType: session.userType,
        jobType: session.jobType,
        questionCount: session.questionCount,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        lastQuestion: session.lastQuestion,
        rejectionCount: session.rejectionCount,
        engineType: session.userType === 'employer' ? 'employer' : 'hybrid',
        serializedEngine: session.engine.serialize() // ✨ 업데이트된 엔진 상태 직렬화
      };
      
      const updateSuccess = await saveSessionToD1(context.env.DB, updatedSessionData);
      if (!updateSuccess) {
        console.warn('⚠️ D1 update failed, session state may be lost on worker restart');
      }

      return new Response(JSON.stringify(chatResponse), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (processError: any) {
      console.error('❌ Answer processing failed:', processError);
      console.error('❌ Error stack:', processError?.stack);
      console.error('❌ Error details:', {
        message: processError?.message,
        name: processError?.name,
        cause: processError?.cause
      });
      
      // 🔥 에러 발생 시에도 세션 유지하고 Fallback 응답 제공
      const fallbackResponses = [
        '흥미로운 답변이네요! 다음 질문으로 넘어갈게요. 😊',
        '잘 말씀해주셨어요! 계속 진행하겠습니다.',
        '좋은 답변 감사합니다! 다음 질문 드릴게요.',
        '네, 알겠습니다! 면접을 계속 이어가겠습니다.'
      ];
      const fallbackMessage = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      // 세션 questionCount는 유지 (증가하지 않음, 같은 질문 다시)
      console.log(`⚠️ Using fallback response, maintaining session at step ${session.questionCount}`);
      
      return new Response(JSON.stringify({
        success: true, // ✅ success: true로 변경 (세션 유지)
        data: {
          content: `${fallbackMessage}\n\n${session.lastQuestion || '다음 질문을 준비하고 있습니다...'}`,
          sessionData: {
            progress: `${session.questionCount}/15`,
            status: 'in_progress',
            questionCount: session.questionCount,
            debug: {
              error: true,
              errorMessage: processError?.message,
              errorStack: processError?.stack?.substring(0, 200),
              questionSource: 'fallback'
            }
          }
        }
      }), {
        status: 200, // ✅ 200으로 변경
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Chat API Error:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause
    });
    
    // ✨ 최상위 에러도 더 자세한 정보 반환
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || '서버 오류가 발생했습니다.',
      details: {
        name: error?.name,
        stack: error?.stack?.substring(0, 500)
      }
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

/**
 * OPTIONS /api/chat - CORS preflight
 */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
};

/**
 * GET /api/chat - Health check
 */
export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({
    success: true,
    data: {
      message: 'Chat API is running! 🐝',
      activeSessions: chatSessions.size,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
