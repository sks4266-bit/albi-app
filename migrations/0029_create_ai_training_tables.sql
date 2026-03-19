-- =====================================================
-- AI 면접 학습 시스템 테이블
-- 목적: DeepSeek 방식 자체 학습 모델 구축
-- =====================================================

-- 1. 면접 대화 저장 테이블 (모든 대화 기록)
CREATE TABLE IF NOT EXISTS interview_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 세션 정보
  session_id TEXT NOT NULL,
  user_id TEXT,
  user_type TEXT DEFAULT 'jobseeker', -- 'jobseeker' or 'employer'
  job_type TEXT NOT NULL, -- 'cafe', 'cvs', 'restaurant', 'retail', 'fastfood'
  
  -- 대화 내용
  turn_number INTEGER NOT NULL, -- 대화 순서 (1, 2, 3...)
  question TEXT NOT NULL, -- AI 면접관 질문
  answer TEXT NOT NULL, -- 지원자 답변
  ai_response TEXT, -- AI의 다음 응답
  
  -- 평가 데이터
  turn_score INTEGER, -- 이 답변의 점수 (0-100)
  evaluation_json TEXT, -- JSON 형식의 상세 평가 { reliability: 30, job_fit: 25, ... }
  
  -- 메타데이터
  response_time_ms INTEGER, -- 답변 소요 시간 (밀리초)
  session_status TEXT, -- 'ongoing', 'completed', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 인덱스용
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. 면접 세션 요약 테이블 (세션별 최종 결과)
CREATE TABLE IF NOT EXISTS interview_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 세션 식별
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  
  -- 기본 정보
  job_type TEXT NOT NULL,
  region TEXT,
  expected_wage INTEGER,
  
  -- 최종 결과
  final_grade TEXT, -- 'S', 'A', 'B', 'C', 'F'
  total_score INTEGER, -- 0-100
  final_scores_json TEXT, -- JSON { reliability: 30, job_fit: 25, ... }
  
  -- 면접 통계
  question_count INTEGER,
  total_duration_seconds INTEGER,
  completion_rate REAL, -- 0.0-1.0 (완료율)
  
  -- 최종 평가
  status TEXT, -- 'completed', 'rejected', 'abandoned'
  recommendation TEXT, -- '강력추천', '추천', '보류', '비추천'
  strengths TEXT, -- JSON 배열
  concerns TEXT, -- JSON 배열
  one_liner TEXT,
  critical_reason TEXT, -- F등급인 경우 탈락 사유
  
  -- 타임스탬프
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 학습된 패턴 테이블 (고득점 답변 패턴)
CREATE TABLE IF NOT EXISTS learned_answer_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 패턴 정보
  job_type TEXT NOT NULL,
  question_category TEXT, -- 'reliability', 'job_fit', 'service_mind', 'logistics'
  question_keywords TEXT, -- 질문 키워드 (쉼표 구분)
  
  -- 패턴 내용
  answer_pattern TEXT NOT NULL, -- 고득점 답변 패턴 (예: "카페+6개월+좋았")
  answer_keywords TEXT, -- 답변 키워드 (쉼표 구분)
  
  -- 통계 데이터
  average_score REAL, -- 평균 점수
  frequency INTEGER DEFAULT 1, -- 출현 빈도
  confidence REAL, -- 신뢰도 (0.0-1.0)
  
  -- 메타데이터
  first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 유니크 제약
  UNIQUE(job_type, answer_pattern)
);

-- 4. 평가 개선 로그 (모델 성능 추적)
CREATE TABLE IF NOT EXISTS evaluation_improvements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 개선 정보
  model_version TEXT, -- 'v1.0', 'v1.1', ...
  improvement_type TEXT, -- 'pattern_added', 'rule_updated', 'model_retrained'
  description TEXT,
  
  -- 성능 지표
  before_accuracy REAL,
  after_accuracy REAL,
  sample_size INTEGER,
  
  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 인덱스 생성 (빠른 조회를 위해)
-- =====================================================

-- 면접 대화 인덱스
CREATE INDEX IF NOT EXISTS idx_conversations_session ON interview_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON interview_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_type ON interview_conversations(job_type);
CREATE INDEX IF NOT EXISTS idx_conversations_score ON interview_conversations(turn_score);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON interview_conversations(created_at);

-- 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_user ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_job_type ON interview_sessions(job_type);
CREATE INDEX IF NOT EXISTS idx_sessions_grade ON interview_sessions(final_grade);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON interview_sessions(completed_at);

-- 패턴 인덱스
CREATE INDEX IF NOT EXISTS idx_patterns_job_type ON learned_answer_patterns(job_type);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON learned_answer_patterns(question_category);
CREATE INDEX IF NOT EXISTS idx_patterns_score ON learned_answer_patterns(average_score);
CREATE INDEX IF NOT EXISTS idx_patterns_frequency ON learned_answer_patterns(frequency);

-- =====================================================
-- 초기 데이터 (기본 패턴)
-- =====================================================

-- 카페 고득점 패턴 예시
INSERT OR IGNORE INTO learned_answer_patterns 
(job_type, question_category, answer_pattern, answer_keywords, average_score, confidence, frequency)
VALUES 
('cafe', 'job_fit', '카페+경험+6개월', '카페,경험,개월,일했', 85.0, 0.9, 10),
('cafe', 'service_mind', '사과+즉시+다시', '사과,죄송,즉시,다시,새로', 90.0, 0.95, 8),
('cafe', 'reliability', '책임감+끝까지+완수', '책임,끝까지,완수,마지막,완료', 88.0, 0.92, 7);

-- 편의점 고득점 패턴 예시
INSERT OR IGNORE INTO learned_answer_patterns 
(job_type, question_category, answer_pattern, answer_keywords, average_score, confidence, frequency)
VALUES 
('cvs', 'job_fit', '편의점+근무+경험', '편의점,근무,경험,일,했', 82.0, 0.88, 6),
('cvs', 'service_mind', '친절+고객+응대', '친절,고객,응대,웃으며,인사', 86.0, 0.9, 5);
