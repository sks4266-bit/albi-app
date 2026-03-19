#!/bin/bash

echo "=== 북마크 API 테스트 ==="
echo ""

# 1. 테스트 세션 생성
echo "1️⃣ 테스트 세션 생성 중..."
SESSION_TOKEN=$(uuidgen)
USER_ID=$(uuidgen)

cd /home/user/webapp
npx wrangler d1 execute albi-production --local --command="
INSERT INTO sessions (token, user_id, expires_at) 
VALUES ('$SESSION_TOKEN', '$USER_ID', datetime('now', '+1 day'));
" > /dev/null 2>&1

echo "✅ 세션 생성 완료"
echo "   User ID: $USER_ID"
echo "   Token: $SESSION_TOKEN"
echo ""

# 2. 북마크 추가 테스트
echo "2️⃣ 북마크 추가 테스트..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -d "{\"job_id\": \"test-job-$(date +%s)\"}")

echo "   응답: $RESPONSE"
echo ""

# 3. 북마크 목록 조회
echo "3️⃣ 북마크 목록 조회..."
RESPONSE=$(curl -s -X GET http://localhost:3000/api/bookmarks/list \
  -H "Authorization: Bearer $SESSION_TOKEN")

echo "   응답: $RESPONSE"
echo ""

echo "✅ 테스트 완료!"
