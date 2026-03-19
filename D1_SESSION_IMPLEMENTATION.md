# D1 Database 기반 세션 저장 구현 계획

## 🎯 목표
Cloudflare Workers의 stateless 특성으로 인한 세션 유실 문제를 D1 Database로 해결

## 📊 현재 문제
- 메모리 기반 `Map` 세션 저장소
- Worker 재시작 시 세션 초기화 (약 1-2분 후)
- 5/15 진행 후 6번째 답변에서 1/15로 리셋

## 🔧 해결 방안

### 1단계: 세션 데이터 구조 설계 ✅
```typescript
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
  engineState: {
    context: any;
    conversationLog: any[];
    currentQuestionIndex: number;
  };
}
```

### 2단계: D1 테이블 생성 ✅
```sql
CREATE TABLE interview_session_cache (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  engine_state TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);
```

### 3단계: 세션 저장/로드 함수 ✅
- `saveSessionToD1()` - D1에 세션 저장
- `loadSessionFromD1()` - D1에서 세션 로드
- `cleanExpiredSessions()` - 만료된 세션 정리

### 4단계: 2-tier 캐싱 전략 (진행 중)
```
요청 → 메모리 캐시 (30초 TTL)
       ↓ (miss)
       D1 Database (30분 TTL)
       ↓ (miss)
       새 세션 생성
```

### 5단계: 엔진 상태 직렬화/역직렬화 (TODO)
- `serializeEngine()` - 엔진 상태를 JSON으로 변환
- `deserializeEngine()` - JSON에서 엔진 상태 복원

## 📈 Deep Learning을 위한 데이터 수집

### 저장되는 데이터
1. **대화 전문** (`interview_conversations` 테이블)
   - 질문, 답변, AI 피드백
   - 점수, 평가 JSON
   - 응답 시간

2. **세션 요약** (`interview_sessions` 테이블)
   - 최종 점수, 등급
   - 강점, 약점
   - 추천 여부

3. **세션 상태** (`interview_session_cache` 테이블)
   - 엔진 상태 (컨텍스트, 로그)
   - 진행 상황

### AI 학습에 활용
- **답변 패턴 분석**: 좋은 답변 vs 나쁜 답변
- **점수 예측 모델**: 답변 → 예상 점수
- **피드백 생성 모델**: GPT-4 대체 가능
- **질문 추천 시스템**: 답변에 따른 최적 질문

## 🚀 향후 계획
1. ✅ D1 테이블 생성
2. ✅ 세션 저장/로드 함수
3. 🔄 2-tier 캐싱 구현
4. ⏳ 엔진 상태 직렬화
5. ⏳ 완전한 세션 복원
6. ⏳ 프로덕션 배포
