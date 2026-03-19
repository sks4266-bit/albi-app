#!/bin/bash

echo "🔍 지원 목록 API 테스트"
echo "================================"

# 1. 세션 토큰 생성 (테스트용)
TEST_USER_ID="test-user-001"
TEST_TOKEN="test-token-$(date +%s)"

echo "📝 테스트 세션 생성..."
npx wrangler d1 execute albi-production --local --command="
INSERT OR REPLACE INTO sessions (id, user_id, token, expires_at, created_at)
VALUES ('test-session-001', '${TEST_USER_ID}', '${TEST_TOKEN}', datetime('now', '+7 days'), datetime('now'));
" 2>&1 | grep -v "│"

echo ""
echo "👤 테스트 사용자 생성..."
npx wrangler d1 execute albi-production --local --command="
INSERT OR REPLACE INTO users (id, name, email, phone, password, user_type, created_at)
VALUES ('${TEST_USER_ID}', '테스트사용자', 'test@example.com', '01012345678', 'hashed_password', 'user', datetime('now'));
" 2>&1 | grep -v "│"

echo ""
echo "📄 테스트 지원 데이터 생성..."
npx wrangler d1 execute albi-production --local --command="
INSERT OR REPLACE INTO job_applications (id, user_id, job_id, status, message, applied_at, updated_at)
VALUES 
  (1, '${TEST_USER_ID}', 'job-001', 'pending', '지원 메시지 1', datetime('now'), datetime('now')),
  (2, '${TEST_USER_ID}', 'job-002', 'hired', '지원 메시지 2', datetime('now', '-1 day'), datetime('now'));
" 2>&1 | grep -v "│"

echo ""
echo "🔍 현재 DB 상태 확인..."
echo "--- Sessions 테이블 ---"
npx wrangler d1 execute albi-production --local --command="SELECT * FROM sessions WHERE user_id = '${TEST_USER_ID}';" 2>&1 | grep -v "wrangler"

echo ""
echo "--- Users 테이블 ---"
npx wrangler d1 execute albi-production --local --command="SELECT id, name, email FROM users WHERE id = '${TEST_USER_ID}';" 2>&1 | grep -v "wrangler"

echo ""
echo "--- Job Applications 테이블 ---"
npx wrangler d1 execute albi-production --local --command="SELECT * FROM job_applications WHERE user_id = '${TEST_USER_ID}';" 2>&1 | grep -v "wrangler"

echo ""
echo "================================"
echo "1️⃣ 전체 지원 목록 조회"
curl -s http://localhost:3000/api/mypage/applications \
  -H "Authorization: Bearer ${TEST_TOKEN}" | jq '.'

echo ""
echo "================================"
echo "2️⃣ 채용 확정 목록 조회"
curl -s "http://localhost:3000/api/mypage/applications?status=hired" \
  -H "Authorization: Bearer ${TEST_TOKEN}" | jq '.'

echo ""
echo "✅ 테스트 완료"
