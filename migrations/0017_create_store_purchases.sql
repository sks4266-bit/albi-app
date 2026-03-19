-- ========================================
-- 스토어 구매 내역 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS store_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  product_icon TEXT,
  product_category TEXT,
  gift_code TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_store_purchases_user_id ON store_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_created_at ON store_purchases(created_at);
