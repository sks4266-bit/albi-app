-- 멘토 구독 테이블
CREATE TABLE IF NOT EXISTS mentor_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 구독 정보
  plan TEXT NOT NULL DEFAULT 'monthly', -- 'monthly'
  price INTEGER NOT NULL DEFAULT 4900,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  
  -- 날짜
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  cancelled_at DATETIME,
  
  -- 결제 정보
  payment_method TEXT,
  last_payment_date DATETIME,
  next_payment_date DATETIME,
  
  -- 통계
  total_messages_used INTEGER DEFAULT 0,
  
  UNIQUE(user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_mentor_subs_user ON mentor_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_subs_status ON mentor_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_mentor_subs_expires ON mentor_subscriptions(expires_at);
