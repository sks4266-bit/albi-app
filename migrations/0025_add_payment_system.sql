-- 결제 시스템 추가
-- 구인자가 매칭 성공 시 결제하는 시스템

-- 1. payments 테이블 생성 (결제 내역)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  application_id TEXT,
  job_id TEXT,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  pg_provider TEXT,
  paid_at DATETIME,
  cancelled_at DATETIME,
  refunded_at DATETIME,
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  description TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (application_id) REFERENCES job_applications(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 3. job_applications 테이블에 결제 관련 컬럼 추가 (이미 존재하면 무시)
-- ALTER TABLE job_applications ADD COLUMN payment_required BOOLEAN DEFAULT 0;
-- ALTER TABLE job_applications ADD COLUMN payment_id TEXT;
-- ALTER TABLE job_applications ADD COLUMN payment_amount INTEGER DEFAULT 0;

-- 4. 결제 통계를 위한 뷰 생성 (선택사항)
-- CREATE VIEW IF NOT EXISTS payment_stats AS
-- SELECT 
--   DATE(created_at) as payment_date,
--   COUNT(*) as total_payments,
--   SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
--   SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
--   SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds
-- FROM payments
-- GROUP BY DATE(created_at);

-- 결제 상태 값:
-- - pending: 결제 대기
-- - processing: 결제 처리 중
-- - completed: 결제 완료
-- - failed: 결제 실패
-- - cancelled: 결제 취소
-- - refunded: 환불 완료
-- - partial_refund: 부분 환불

-- 결제 수단:
-- - card: 신용/체크카드
-- - transfer: 계좌이체
-- - virtual_account: 가상계좌
-- - phone: 휴대폰 결제
-- - kakaopay: 카카오페이
-- - naverpay: 네이버페이
-- - tosspay: 토스페이
