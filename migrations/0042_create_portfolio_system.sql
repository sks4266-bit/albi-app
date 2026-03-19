-- ============================================
-- 포트폴리오 빌더 테이블 생성
-- ============================================

-- 포트폴리오 문서 테이블
CREATE TABLE IF NOT EXISTS mentor_portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  portfolio_type TEXT NOT NULL, -- 'resume', 'cover_letter', 'project_description', 'self_introduction'
  template_id TEXT, -- 템플릿 ID (선택)
  content TEXT NOT NULL, -- JSON 형식으로 저장
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'completed', 'published'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI 첨삭 기록 테이블
CREATE TABLE IF NOT EXISTS portfolio_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id TEXT UNIQUE NOT NULL,
  portfolio_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  review_text TEXT NOT NULL,
  score INTEGER, -- 0-100
  improvements TEXT, -- JSON array
  before_version INTEGER,
  after_version INTEGER,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES mentor_portfolios(portfolio_id)
);

-- 포트폴리오 버전 히스토리
CREATE TABLE IF NOT EXISTS portfolio_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id TEXT UNIQUE NOT NULL,
  portfolio_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL, -- JSON 형식
  changes_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES mentor_portfolios(portfolio_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolios_user 
ON mentor_portfolios(user_id, status);

CREATE INDEX IF NOT EXISTS idx_portfolios_type 
ON mentor_portfolios(portfolio_type, updated_at);

CREATE INDEX IF NOT EXISTS idx_reviews_portfolio 
ON portfolio_reviews(portfolio_id, reviewed_at);

CREATE INDEX IF NOT EXISTS idx_versions_portfolio 
ON portfolio_versions(portfolio_id, version_number);
