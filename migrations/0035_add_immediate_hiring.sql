-- 바로채용 시스템 추가
-- 작성일: 2026-02-19

-- 1. jobs 테이블에 hiring_type 컬럼 추가
ALTER TABLE jobs ADD COLUMN hiring_type TEXT DEFAULT 'trial';
-- 'trial' (체험 후 채용) / 'immediate' (바로 채용)

-- 2. users 테이블에 신뢰도 점수 컬럼 추가
ALTER TABLE users ADD COLUMN trust_score INTEGER DEFAULT 100;
-- 초기값: 100점 (만점)
-- 노쇼 발생 시 차감
-- 70점 이하: 경고, 50점 이하: 바로채용 제한

-- 3. 신뢰도 점수 기록 테이블 생성
CREATE TABLE IF NOT EXISTS trust_score_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  related_job_id TEXT,
  related_application_id TEXT,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_trust_score_logs_user_id ON trust_score_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_score_logs_created_at ON trust_score_logs(created_at);
