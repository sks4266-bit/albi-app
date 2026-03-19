-- ============================================
-- 친구초대 시스템
-- ============================================

-- users 테이블에 referral_code 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE users ADD COLUMN referral_code TEXT;

-- users 테이블에 referred_by 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE users ADD COLUMN referred_by TEXT;

-- 추천 관계 테이블
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id TEXT NOT NULL, -- 추천인
  referee_id TEXT NOT NULL, -- 피추천인
  reward_given BOOLEAN DEFAULT 0, -- 가입 보상 지급 여부
  hire_reward_given BOOLEAN DEFAULT 0, -- 채용 보상 지급 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(referrer_id, referee_id)
);

-- 인덱스 생성 (추천 코드가 이미 있으므로 건너뜀)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
