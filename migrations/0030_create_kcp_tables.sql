-- KCP 정기결제 거래 테이블
CREATE TABLE IF NOT EXISTS kcp_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordr_idxx TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  approval_key TEXT,
  pay_url TEXT,
  trace_no TEXT,
  batch_key TEXT,
  status TEXT NOT NULL DEFAULT 'registered',
  res_cd TEXT,
  res_msg TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kcp_transactions_user_id ON kcp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_kcp_transactions_ordr_idxx ON kcp_transactions(ordr_idxx);
CREATE INDEX IF NOT EXISTS idx_kcp_transactions_status ON kcp_transactions(status);

-- KCP 정기결제 실행 내역 테이블
CREATE TABLE IF NOT EXISTS kcp_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordr_idxx TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  good_name TEXT NOT NULL,
  batch_key TEXT NOT NULL,
  res_cd TEXT,
  res_msg TEXT,
  tno TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kcp_payments_user_id ON kcp_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kcp_payments_status ON kcp_payments(status);
CREATE INDEX IF NOT EXISTS idx_kcp_payments_created_at ON kcp_payments(created_at);

-- users 테이블에 KCP 배치키 컬럼 추가
ALTER TABLE users ADD COLUMN kcp_batch_key TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN subscription_plan TEXT;
ALTER TABLE users ADD COLUMN subscription_started_at DATETIME;
ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_users_kcp_batch_key ON users(kcp_batch_key);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
