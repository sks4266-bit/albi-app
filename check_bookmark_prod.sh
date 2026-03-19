#!/bin/bash
echo "🔍 프로덕션 북마크 API 확인"
echo "1️⃣ 로그인 테스트 (프로덕션)"
curl -s -X POST https://albi-app.pages.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test-bookmark@example.com","password":"test123","name":"북마크테스트","user_type":"jobseeker"}' | jq .

echo -e "\n2️⃣ 로그인"
LOGIN_RESPONSE=$(curl -s -X POST https://albi-app.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-bookmark@example.com","password":"test123"}')
echo "$LOGIN_RESPONSE" | jq .

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "❌ 토큰이 없습니다"
  exit 1
fi

echo -e "\n3️⃣ 북마크 추가 (job-001)"
curl -s -X POST https://albi-app.pages.dev/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"job_id":"job-001"}' | jq .

echo -e "\n4️⃣ 북마크 목록 조회"
curl -s -X GET https://albi-app.pages.dev/api/bookmarks/list \
  -H "Authorization: Bearer $TOKEN" | jq .

