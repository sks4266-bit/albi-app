-- 멘토링 세션 테이블
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 세션 정보
  status TEXT NOT NULL DEFAULT 'active',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  -- 사용자 기본 정보
  job_type TEXT NOT NULL,
  region TEXT,
  expected_wage INTEGER,
  
  -- 분석 데이터 (JSON)
  aptitude_result TEXT,
  interview_result TEXT,
  mentor_analysis TEXT,
  
  -- 목표 및 진도
  goals TEXT,
  progress_percentage REAL DEFAULT 0,
  
  -- 통계
  total_messages INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_user ON mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_status ON mentor_sessions(status);

-- 멘토 대화 테이블
CREATE TABLE IF NOT EXISTS mentor_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 대화 내용
  turn_number INTEGER NOT NULL,
  user_message TEXT NOT NULL,
  mentor_response TEXT NOT NULL,
  
  -- 메타 데이터
  message_type TEXT,
  category TEXT,
  
  -- AI 분석
  sentiment TEXT,
  key_topics TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_conversations_session ON mentor_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_user ON mentor_conversations(user_id);

-- 멘토 과제 테이블
CREATE TABLE IF NOT EXISTS mentor_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 과제 정보
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT,
  estimated_hours INTEGER,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  
  -- 제출 및 피드백
  submission_content TEXT,
  mentor_feedback TEXT,
  score INTEGER,
  
  -- 일정
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME,
  submitted_at DATETIME,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_mentor_tasks_session ON mentor_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_tasks_user ON mentor_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_tasks_status ON mentor_tasks(status);

-- 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS mentor_portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- 포트폴리오 타입
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  
  -- 내용
  content TEXT NOT NULL,
  summary TEXT,
  
  -- 메타데이터
  tags TEXT,
  version INTEGER DEFAULT 1,
  
  -- 상태
  status TEXT DEFAULT 'draft',
  completeness_score INTEGER DEFAULT 0,
  
  -- 피드백
  mentor_feedback TEXT,
  improvement_suggestions TEXT,
  
  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_mentor_portfolio_user ON mentor_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_portfolio_type ON mentor_portfolio(type);
CREATE INDEX IF NOT EXISTS idx_mentor_portfolio_status ON mentor_portfolio(status);

-- 멘토링 포인트 테이블
CREATE TABLE IF NOT EXISTS mentor_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 트랜잭션 정보
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- 상세 정보
  description TEXT,
  service_type TEXT,
  related_id TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_points_user ON mentor_points(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_points_type ON mentor_points(type);
