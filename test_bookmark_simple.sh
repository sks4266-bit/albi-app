#!/bin/bash

echo "=== 북마크 API 간단 테스트 ==="
echo ""

# 고정 테스트 데이터
SESSION_TOKEN="test-session-$(date +%s)"
USER_ID="test-user-$(date +%s)"
JOB_ID="test-job-$(date +%s)"

echo "1️⃣ 테스트 세션 생성..."
cd /home/user/webapp
npx wrangler d1 execute albi-production --local --command="
INSERT INTO sessions (token, user_id, expires_at) 
VALUES ('$SESSION_TOKEN', '$USER_ID', datetime('now', '+1 day'));
" 2>&1 | grep -E "changes|error" || echo "   세션 생성 시도"

echo ""
echo "2️⃣ 북마크 추가 (POST /api/bookmarks)..."
curl -s -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -d "{\"job_id\": \"$JOB_ID\"}"

echo ""
echo ""
echo "3️⃣ 북마크 목록 조회 (GET /api/bookmarks/list)..."
curl -s -X GET http://localhost:3000/api/bookmarks/list \
  -H "Authorization: Bearer $SESSION_TOKEN"

echo ""
echo ""
echo "✅ 테스트 완료!"
