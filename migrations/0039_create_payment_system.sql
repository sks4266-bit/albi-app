-- ============================================
-- 결제 시스템 테이블 생성
-- ============================================

-- 결제 요청 테이블
CREATE TABLE IF NOT EXISTS payment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, failed, cancelled
  payment_key TEXT,
  approved_at DATETIME,
  toss_response TEXT, -- JSON
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payment_requests_order_id ON payment_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- payment_method 컬럼 추가 (이미 있으면 무시)
-- ALTER TABLE mentor_subscriptions ADD COLUMN payment_method TEXT;
