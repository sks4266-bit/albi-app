-- 교정 이력 테이블
CREATE TABLE IF NOT EXISTS proofread_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proofread_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL, -- resume, cover_letter, email, essay, general
  target_tone TEXT NOT NULL, -- formal, casual, business, academic
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  changes_json TEXT, -- JSON array
  statistics_json TEXT, -- JSON object
  overall_assessment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proofread_user ON proofread_history(user_id);
CREATE INDEX IF NOT EXISTS idx_proofread_created ON proofread_history(created_at);
