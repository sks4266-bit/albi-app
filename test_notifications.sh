#!/bin/bash

echo "🔔 알림 API 테스트"
echo "================================"

# 테스트용 세션 생성
TEST_USER_ID="test-user-notify-$(date +%s)"
TEST_TOKEN="test-token-$(date +%s)"

echo "1️⃣ 테스트 데이터 생성..."
npx wrangler d1 execute albi-production --local --command="
-- 테스트 사용자 생성
INSERT OR REPLACE INTO users (id, name, email, phone, password, user_type, created_at)
VALUES ('${TEST_USER_ID}', '알림테스트', 'notify@example.com', '01012345678', 'hashed', 'user', datetime('now'));

-- 테스트 세션 생성
INSERT OR REPLACE INTO sessions (id, user_id, token, expires_at, created_at)
VALUES ('notify-session-001', '${TEST_USER_ID}', '${TEST_TOKEN}', datetime('now', '+7 days'), datetime('now'));

-- 테스트 알림 생성
INSERT OR REPLACE INTO notifications (id, user_id, type, title, message, is_read, created_at)
VALUES 
  ('notif-001', '${TEST_USER_ID}', 'info', '테스트 알림 1', '알림 메시지 1', 0, datetime('now')),
  ('notif-002', '${TEST_USER_ID}', 'info', '테스트 알림 2', '알림 메시지 2', 0, datetime('now', '-1 hour'));
" 2>&1 | grep -v "│"

echo ""
echo "2️⃣ API 테스트..."
sleep 3

echo ""
echo "📡 읽지 않은 알림 개수 조회..."
RESPONSE=$(curl -s "http://localhost:3000/api/notifications?unread_only=true" \
  -H "Authorization: Bearer ${TEST_TOKEN}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "응답: $RESPONSE"

echo ""
echo "📡 전체 알림 목록 조회..."
RESPONSE=$(curl -s "http://localhost:3000/api/notifications" \
  -H "Authorization: Bearer ${TEST_TOKEN}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "응답: $RESPONSE"

echo ""
echo "✅ 테스트 완료"
