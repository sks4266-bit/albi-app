#!/bin/bash

echo "🧪 로컬 API 테스트"
echo "================================"

# 테스트용 세션 토큰 생성
TEST_USER_ID="test-user-$(date +%s)"
TEST_TOKEN="test-token-$(date +%s)"

echo "1️⃣ 테스트 데이터 생성..."
npx wrangler d1 execute albi-production --local --command="
-- 테스트 사용자 생성
INSERT OR REPLACE INTO users (id, name, email, phone, password, user_type, created_at)
VALUES ('${TEST_USER_ID}', '테스트사용자', 'test@example.com', '01012345678', 'hashed_password', 'user', datetime('now'));

-- 테스트 세션 생성
INSERT OR REPLACE INTO sessions (id, user_id, token, expires_at, created_at)
VALUES ('test-session-001', '${TEST_USER_ID}', '${TEST_TOKEN}', datetime('now', '+7 days'), datetime('now'));

-- 테스트 지원 데이터 생성
INSERT OR REPLACE INTO job_applications (id, user_id, job_id, status, message, applied_at, updated_at)
VALUES 
  (9001, '${TEST_USER_ID}', 'job-test-001', 'pending', '지원 메시지 1', datetime('now'), datetime('now')),
  (9002, '${TEST_USER_ID}', 'job-test-002', 'hired', '지원 메시지 2', datetime('now', '-1 day'), datetime('now'));
" 2>&1 | grep -E "(success|error|Error)" | head -5

echo ""
echo "2️⃣ API 테스트 시작..."
sleep 3

echo ""
echo "📡 전체 지원 목록 조회..."
RESPONSE=$(curl -s http://localhost:3000/api/mypage/applications \
  -H "Authorization: Bearer ${TEST_TOKEN}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "응답: $RESPONSE"

echo ""
echo "📡 채용 확정 목록 조회..."
RESPONSE=$(curl -s "http://localhost:3000/api/mypage/applications?status=hired" \
  -H "Authorization: Bearer ${TEST_TOKEN}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "응답: $RESPONSE"

echo ""
echo "✅ 테스트 완료"
