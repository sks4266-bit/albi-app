-- 사용자 피드백 시스템
-- 별점 및 코멘트 저장

-- 사용자 피드백 테이블
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id TEXT UNIQUE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  url TEXT,
  timestamp INTEGER,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON user_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_url ON user_feedback(url);
