-- ============================================
-- 과제 시스템 테이블 생성
-- ============================================

-- 과제 제출 테이블
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  assignment_type TEXT NOT NULL, -- 'resume', 'cover_letter', 'interview_prep', 'skill_test', 'custom'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  status TEXT DEFAULT 'submitted', -- 'submitted', 'reviewing', 'completed', 'rejected'
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI 피드백 테이블
CREATE TABLE IF NOT EXISTS mentor_feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id TEXT UNIQUE NOT NULL,
  assignment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  score INTEGER, -- 0-100
  strengths TEXT, -- JSON array
  improvements TEXT, -- JSON array
  suggestions TEXT, -- JSON array
  reviewed_by TEXT DEFAULT 'AI', -- 'AI' or admin user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(assignment_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_assignments_user 
ON mentor_assignments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_assignments_status 
ON mentor_assignments(status, submitted_at);

CREATE INDEX IF NOT EXISTS idx_feedbacks_assignment 
ON mentor_feedbacks(assignment_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user 
ON mentor_feedbacks(user_id, created_at);
