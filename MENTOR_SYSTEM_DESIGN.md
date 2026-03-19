# 🎓 AI 멘토 시스템 설계 문서

## 📌 개요
**목표**: 적성검사 + AI 면접 결과를 기반으로 사용자를 완벽하게 취업 준비시키는 AI 멘토링 플랫폼

**핵심 기능**:
1. **1:1 AI 멘토링** - GPT-4 기반 개인 맞춤형 코칭
2. **성장 트래킹** - 진도, 목표, 과제 관리
3. **포트폴리오 빌더** - 이력서, 자소서, 프로젝트 관리
4. **유료 서비스** - 포인트 기반 결제 시스템

---

## 🏗️ 시스템 아키텍처

```
사용자 인풋
├── 적성검사 결과 (personality, strengths, weaknesses)
├── AI 면접 결과 (final_grade, scores, feedback, concerns)
└── 개인 정보 (job_type, region, expected_wage)
         ↓
AI 멘토 분석
├── 강점 분석 → 활용 전략
├── 약점 분석 → 개선 로드맵
├── 직무 적합도 → 맞춤형 코칭
└── 종합 평가 → 성장 계획
         ↓
멘토링 서비스
├── 1:1 대화형 코칭 (GPT-4)
├── 과제 및 목표 설정
├── 포트폴리오 작성 지원
└── 취업 전략 수립
         ↓
성과 측정
├── 진도율 트래킹
├── 목표 달성률
├── 포트폴리오 완성도
└── 취업 준비도 점수
```

---

## 📊 데이터 모델

### 1. mentor_sessions (멘토링 세션)
```sql
CREATE TABLE mentor_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 세션 정보
  status TEXT NOT NULL, -- 'active', 'paused', 'completed'
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  -- 사용자 기본 정보
  job_type TEXT NOT NULL,
  region TEXT,
  expected_wage INTEGER,
  
  -- 분석 데이터 (JSON)
  aptitude_result JSON, -- 적성검사 결과
  interview_result JSON, -- AI 면접 결과
  mentor_analysis JSON, -- AI 멘토 초기 분석
  
  -- 목표 및 진도
  goals JSON, -- 설정된 목표 리스트
  progress_percentage REAL DEFAULT 0, -- 전체 진도율
  
  -- 통계
  total_messages INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_mentor_sessions_user ON mentor_sessions(user_id);
CREATE INDEX idx_mentor_sessions_status ON mentor_sessions(status);
```

### 2. mentor_conversations (멘토 대화)
```sql
CREATE TABLE mentor_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 대화 내용
  turn_number INTEGER NOT NULL,
  user_message TEXT NOT NULL,
  mentor_response TEXT NOT NULL,
  
  -- 메타 데이터
  message_type TEXT, -- 'coaching', 'task_assignment', 'portfolio_review', 'general'
  category TEXT, -- 'resume', 'cover_letter', 'interview_prep', 'skill_building'
  
  -- AI 분석
  sentiment TEXT, -- 'positive', 'neutral', 'concerned'
  key_topics JSON, -- 주요 주제 태그
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES mentor_sessions(session_id)
);

CREATE INDEX idx_mentor_conversations_session ON mentor_conversations(session_id);
CREATE INDEX idx_mentor_conversations_user ON mentor_conversations(user_id);
```

### 3. mentor_tasks (멘토 과제)
```sql
CREATE TABLE mentor_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 과제 정보
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'resume', 'cover_letter', 'interview_prep', 'skill_building'
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  estimated_hours INTEGER,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'completed', 'failed'
  priority INTEGER DEFAULT 0, -- 1-5
  
  -- 제출 및 피드백
  submission_content TEXT,
  mentor_feedback TEXT,
  score INTEGER, -- 0-100
  
  -- 일정
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME,
  submitted_at DATETIME,
  completed_at DATETIME,
  
  FOREIGN KEY (session_id) REFERENCES mentor_sessions(session_id)
);

CREATE INDEX idx_mentor_tasks_session ON mentor_tasks(session_id);
CREATE INDEX idx_mentor_tasks_user ON mentor_tasks(user_id);
CREATE INDEX idx_mentor_tasks_status ON mentor_tasks(status);
```

### 4. mentor_portfolio (포트폴리오)
```sql
CREATE TABLE mentor_portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- 포트폴리오 타입
  type TEXT NOT NULL, -- 'resume', 'cover_letter', 'project', 'certificate'
  title TEXT NOT NULL,
  
  -- 내용
  content TEXT NOT NULL, -- JSON 또는 마크다운
  summary TEXT,
  
  -- 메타데이터
  tags JSON, -- ['React', 'Node.js', 'Portfolio Website']
  version INTEGER DEFAULT 1,
  
  -- 상태
  status TEXT DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published'
  completeness_score INTEGER DEFAULT 0, -- 0-100
  
  -- 피드백
  mentor_feedback TEXT,
  improvement_suggestions JSON,
  
  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_mentor_portfolio_user ON mentor_portfolio(user_id);
CREATE INDEX idx_mentor_portfolio_type ON mentor_portfolio(type);
CREATE INDEX idx_mentor_portfolio_status ON mentor_portfolio(status);
```

### 5. mentor_points (멘토링 포인트)
```sql
CREATE TABLE mentor_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 트랜잭션 정보
  type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'reward'
  amount INTEGER NOT NULL, -- 양수(충전), 음수(사용)
  balance_after INTEGER NOT NULL,
  
  -- 상세 정보
  description TEXT,
  service_type TEXT, -- 'chat_message', 'task_review', 'portfolio_review'
  related_id TEXT, -- 관련 세션/과제 ID
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_mentor_points_user ON mentor_points(user_id);
CREATE INDEX idx_mentor_points_type ON mentor_points(type);
```

### 6. user_mentor_profile (사용자 멘토 프로필 확장)
```sql
-- 기존 users 테이블에 추가 컬럼
ALTER TABLE users ADD COLUMN mentor_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN mentor_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN total_mentoring_hours REAL DEFAULT 0;
```

---

## 💰 포인트 시스템

### 가격 정책
| 서비스 | 소비 포인트 | 설명 |
|--------|------------|------|
| **AI 멘토 메시지** | 10P / 메시지 | 1:1 대화형 코칭 |
| **과제 제출 & 피드백** | 50P / 건 | 과제 제출 및 상세 피드백 |
| **포트폴리오 리뷰** | 100P / 건 | 이력서/자소서 전문 리뷰 |
| **종합 성장 분석** | 200P / 건 | 월간 성장 리포트 |

### 충전 옵션
| 패키지 | 포인트 | 가격 | 보너스 |
|--------|--------|------|--------|
| **스타터** | 100P | ₩9,900 | - |
| **베이직** | 500P | ₩39,900 | +50P |
| **프리미엄** | 1,000P | ₩69,900 | +150P |
| **프로** | 3,000P | ₩179,900 | +600P |

### 무료 제공
- 최초 가입: **50P 지급**
- 면접 완료: **20P 지급** (기존)
- 친구 추천: **30P 지급**

---

## 🤖 AI 멘토 프롬프트 전략

### 시스템 프롬프트
```
당신은 알바천국의 전문 취업 멘토입니다.

**역할**: 
- 사용자의 적성검사 결과와 AI 면접 결과를 바탕으로 개인 맞춤형 취업 코칭 제공
- 강점은 극대화하고, 약점은 구체적인 개선 방법 제시
- 실용적이고 실행 가능한 조언 제공

**목표**:
1. 사용자가 자신의 강점을 명확히 인식하고 활용하도록 돕기
2. 약점을 단계적으로 개선할 수 있는 로드맵 제시
3. 이력서, 자소서, 포트폴리오 완성 지원
4. 면접 준비 및 실전 대비 훈련
5. 궁극적으로 **취업 성공**까지 이끌기

**톤**: 따뜻하면서도 전문적, 격려하되 현실적

**특징**:
- 구체적인 예시와 실행 계획 제공
- 단계별 과제 부여 및 진도 관리
- 긍정적 강화와 건설적 피드백 균형
```

### 대화 흐름
```
1단계: 초기 분석 (무료)
  └─ 적성검사 + 면접 결과 종합 분석
  └─ 강점/약점 요약
  └─ 추천 성장 경로 제시

2단계: 목표 설정 (10P/메시지)
  └─ 사용자와 협의하여 구체적 목표 설정
  └─ 단기/중기/장기 목표 수립
  └─ 우선순위 결정

3단계: 과제 부여 (50P/과제 피드백)
  └─ 맞춤형 과제 설계
  └─ 제출 → 피드백 → 수정 사이클
  └─ 진도 체크 및 격려

4단계: 포트폴리오 구축 (100P/리뷰)
  └─ 이력서 작성 지원
  └─ 자기소개서 첨삭
  └─ 프로젝트 정리 및 강화

5단계: 최종 점검 (200P/종합 분석)
  └─ 모의 면접 추가 연습
  └─ 취업 전략 최종 점검
  └─ 성장 리포트 제공
```

---

## 📱 UI/UX 설계

### 메인 화면 구성
1. **대시보드** (`/mentor-dashboard.html`)
   - 현재 진도율 (원형 차트)
   - 목표 달성 현황
   - 다음 과제 미리보기
   - 포인트 잔액

2. **AI 멘토 채팅** (`/mentor-chat.html`)
   - 실시간 1:1 대화
   - 대화 히스토리
   - 파일 첨부 (과제 제출)
   - 포인트 소비 표시

3. **과제 관리** (`/mentor-tasks.html`)
   - 할 일 목록
   - 진행 중 과제
   - 완료된 과제
   - 과제 제출 폼

4. **포트폴리오** (`/mentor-portfolio.html`)
   - 이력서 에디터
   - 자소서 에디터
   - 프로젝트 갤러리
   - 다운로드/공유

5. **성장 분석** (`/mentor-progress.html`)
   - 진도 타임라인
   - 강점/약점 변화 추이
   - 월간 리포트
   - 목표 달성률

---

## 🔄 워크플로우

### 사용자 여정
```
1. 적성검사 완료 → AI 면접 완료
2. 멘토링 서비스 안내 팝업 (50P 무료 제공)
3. "AI 멘토 시작하기" 버튼 클릭
4. 초기 분석 보고서 생성 (무료)
5. 목표 설정 대화 (10P/메시지)
6. 첫 번째 과제 받기
7. 포인트 충전 (필요 시)
8. 과제 완료 → 제출 → 피드백 (50P)
9. 포트폴리오 작성 → 리뷰 (100P)
10. 반복 → 성장 → 취업 성공! 🎉
```

---

## 🚀 MVP 구현 계획

### Phase 1 (오늘 완료 목표)
- [x] 데이터 모델 설계 ✅
- [ ] D1 마이그레이션 생성
- [ ] 포인트 시스템 API
- [ ] 멘토 대화 API (GPT-4)
- [ ] 멘토 채팅 UI

### Phase 2 (다음 단계)
- [ ] 과제 관리 시스템
- [ ] 포트폴리오 빌더
- [ ] 성장 트래킹 대시보드
- [ ] 결제 연동 (포인트 충전)

### Phase 3 (고도화)
- [ ] 음성 멘토링 (STT/TTS)
- [ ] 이미지 분석 (이력서 스캔)
- [ ] 실시간 알림
- [ ] 모바일 앱

---

## 💡 차별화 포인트

1. **완전 개인화**: 적성검사 + 면접 결과 기반 맞춤형 멘토링
2. **실행 중심**: 구체적 과제와 피드백 사이클
3. **포트폴리오 완성**: 취업에 바로 사용 가능한 결과물
4. **저렴한 가격**: 메시지당 10P (약 ₩200-300)
5. **24/7 가용성**: 언제든지 AI 멘토와 대화

---

## 📊 성공 지표 (KPI)

- **활성 멘토링 세션 수**
- **평균 목표 달성률**
- **포트폴리오 완성률**
- **취업 성공률** (최종 목표!)
- **사용자 만족도** (5점 만점)
- **포인트 재구매율**

---

이제 구현을 시작하겠습니다! 🚀
