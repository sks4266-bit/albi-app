-- 노쇼 신고 테이블
CREATE TABLE IF NOT EXISTS noshow_reports (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,  -- 신고자 (구인자)
  reported_user_id TEXT NOT NULL,  -- 신고된 사용자 (구직자)
  job_id TEXT NOT NULL,
  reason TEXT,  -- 신고 사유
  evidence TEXT,  -- 증거 (사진 URL 등)
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  trust_score_deducted INTEGER DEFAULT 0,  -- 차감된 신뢰도 점수
  admin_notes TEXT,  -- 관리자 메모
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolved_by TEXT,  -- 처리한 관리자 ID
  FOREIGN KEY (application_id) REFERENCES experiences(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_noshow_reports_application ON noshow_reports(application_id);
CREATE INDEX IF NOT EXISTS idx_noshow_reports_reported_user ON noshow_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_noshow_reports_status ON noshow_reports(status);
