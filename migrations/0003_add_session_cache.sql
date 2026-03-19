-- 세션 캐시 테이블 생성
CREATE TABLE IF NOT EXISTS interview_session_cache (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  engine_state TEXT NOT NULL, -- JSON 직렬화된 엔진 상태
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_session_cache_user ON interview_session_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_session_cache_expires ON interview_session_cache(expires_at);
