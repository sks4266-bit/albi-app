-- ========================================
-- 체험 신청 테이블 (Experiences)
-- ========================================
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  jobseeker_id TEXT NOT NULL,
  employer_id TEXT NOT NULL,
  
  -- 신청 정보
  status TEXT DEFAULT 'pending',
  requested_date TEXT,
  requested_time TEXT,
  message TEXT,
  points_used INTEGER DEFAULT 10,
  points_refunded INTEGER DEFAULT 0,
  
  -- 승인 정보
  approved_date TEXT,
  approved_time TEXT,
  
  -- 완료 정보
  completed_at DATETIME,
  
  -- 리뷰 정보
  rating INTEGER,
  review TEXT,
  review_submitted INTEGER DEFAULT 0,
  review_submitted_at DATETIME,
  
  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (jobseeker_id) REFERENCES users(id),
  FOREIGN KEY (employer_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_experiences_job ON experiences(job_id);
CREATE INDEX IF NOT EXISTS idx_experiences_jobseeker ON experiences(jobseeker_id);
CREATE INDEX IF NOT EXISTS idx_experiences_employer ON experiences(employer_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_review_submitted ON experiences(review_submitted);
CREATE INDEX IF NOT EXISTS idx_experiences_created ON experiences(created_at DESC);
