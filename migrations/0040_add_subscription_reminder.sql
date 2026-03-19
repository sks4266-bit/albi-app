-- ============================================
-- 구독 알림 기능 추가
-- ============================================

-- mentor_subscriptions 테이블에 reminder_sent 컬럼 추가
ALTER TABLE mentor_subscriptions ADD COLUMN reminder_sent DATETIME;

-- 인덱스 추가 (만료 예정 구독 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires 
ON mentor_subscriptions(status, expires_at);
