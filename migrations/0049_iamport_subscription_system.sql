-- ============================================
-- 아임포트 정기결제 시스템 스키마
-- ============================================

-- 1. 빌링키 테이블 (고객별 카드 정보 저장)
CREATE TABLE IF NOT EXISTS billing_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  customer_uid TEXT UNIQUE NOT NULL, -- 아임포트 고객 고유 ID
  
  -- 카드 정보 (아임포트에서 제공)
  card_name TEXT,           -- 카드사 이름 (예: 현대카드)
  card_number TEXT,         -- 마스킹된 카드 번호 (예: 1234-****-****-5678)
  card_code TEXT,           -- 카드사 코드
  
  -- 빌링키 상태
  billing_key TEXT NOT NULL,  -- 아임포트 빌링키 (실제 결제에 사용)
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, revoked
  
  -- 날짜
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  last_used_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_keys_user_id ON billing_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_keys_customer_uid ON billing_keys(customer_uid);
CREATE INDEX IF NOT EXISTS idx_billing_keys_status ON billing_keys(status);

-- 2. 구독 테이블 확장 (mentor_subscriptions 테이블에 컬럼 추가)
-- billing_key_id 추가 (빌링키 참조)
-- ALTER TABLE mentor_subscriptions ADD COLUMN billing_key_id INTEGER REFERENCES billing_keys(id);
-- merchant_uid 추가 (주문 고유 ID)
-- ALTER TABLE mentor_subscriptions ADD COLUMN merchant_uid TEXT;
-- customer_uid 추가 (아임포트 고객 ID)
-- ALTER TABLE mentor_subscriptions ADD COLUMN customer_uid TEXT;

-- 3. 정기결제 내역 테이블 (매월 자동 결제 기록)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 결제 정보
  merchant_uid TEXT UNIQUE NOT NULL, -- 주문번호
  imp_uid TEXT,                       -- 아임포트 거래 고유번호
  customer_uid TEXT NOT NULL,         -- 고객 고유 ID
  
  -- 금액 & 플랜
  amount INTEGER NOT NULL,
  plan_type TEXT NOT NULL, -- basic, standard, premium, unlimited
  
  -- 결제 상태
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, cancelled, refunded
  pg_provider TEXT DEFAULT 'nice',        -- PG사 (nice, kcp, inicis)
  pay_method TEXT DEFAULT 'card',         -- 결제수단 (card만 가능)
  
  -- 카드 정보
  card_name TEXT,
  card_number TEXT,
  
  -- 날짜
  paid_at DATETIME,
  failed_at DATETIME,
  refunded_at DATETIME,
  
  -- 응답 데이터
  pg_response TEXT,    -- PG사 응답 JSON
  fail_reason TEXT,    -- 실패 사유
  refund_reason TEXT,  -- 환불 사유
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_user ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_merchant_uid ON subscription_payments(merchant_uid);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_sub_payments_paid_at ON subscription_payments(paid_at);

-- 4. 환불 요청 테이블
CREATE TABLE IF NOT EXISTS refund_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payment_id INTEGER NOT NULL, -- subscription_payments.id
  
  -- 환불 정보
  refund_type TEXT NOT NULL,   -- withdrawal (청약철회), cancellation (중도해지)
  refund_amount INTEGER NOT NULL,
  reason TEXT,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  admin_note TEXT,
  
  -- 날짜
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  completed_at DATETIME,
  
  -- 아임포트 환불 정보
  imp_uid TEXT,            -- 환불 거래 고유번호
  refund_holder TEXT,      -- 환불 계좌 예금주
  refund_bank TEXT,        -- 환불 은행
  refund_account TEXT,     -- 환불 계좌번호
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_subscription ON refund_requests(subscription_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- 5. 스케줄 작업 로그 (자동 결제 스케줄러용)
CREATE TABLE IF NOT EXISTS scheduled_payment_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_logs_subscription ON scheduled_payment_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_logs_date ON scheduled_payment_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_logs_status ON scheduled_payment_logs(execution_status);
