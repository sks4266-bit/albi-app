-- 세금계산서 발행 요청 테이블 생성
CREATE TABLE IF NOT EXISTS tax_invoice_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  business_number TEXT NOT NULL,
  business_name TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  business_address TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'issued', 'rejected')),
  issued_at DATETIME,
  rejected_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tax_invoice_requests_payment_id ON tax_invoice_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoice_requests_user_id ON tax_invoice_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoice_requests_status ON tax_invoice_requests(status);
