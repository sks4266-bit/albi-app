#!/bin/bash

# 세션 토큰 생성
echo "=== 세션 생성 ==="
SESSION_TOKEN="test-immediate-$(date +%s)"
npx wrangler d1 execute albi-production --local --command="
INSERT INTO sessions (id, user_id, token, expires_at) 
VALUES ('test-sess-$(date +%s)', 'test-employer-1', '${SESSION_TOKEN}', datetime('now', '+1 day'));
"

echo ""
echo "=== 바로채용 공고 등록 테스트 ==="
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer ${SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🔥 당일급구 카페 아르바이트",
    "company_name": "테스트 카페",
    "job_type": "cafe",
    "hourly_wage": 12000,
    "work_hours": "하루 6시간",
    "work_days": "평일",
    "total_work_hours": 30,
    "address": "서울 강남구 테헤란로 123",
    "region": "서울",
    "latitude": 37.5,
    "longitude": 127.0,
    "description": "당일 근무 가능한 분 급구합니다",
    "hiring_type": "immediate"
  }' | jq .

echo ""
echo "=== 일반 체험 공고 등록 테스트 ==="
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer ${SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "편의점 야간 아르바이트",
    "company_name": "테스트 편의점",
    "job_type": "cvs",
    "hourly_wage": 11000,
    "work_hours": "하루 4시간",
    "work_days": "주말",
    "total_work_hours": 20,
    "address": "서울 송파구 올림픽로 456",
    "region": "서울",
    "latitude": 37.5,
    "longitude": 127.1,
    "description": "체험 후 채용 가능합니다",
    "experience_times": "[\"22:00\", \"23:00\"]",
    "hiring_type": "trial"
  }' | jq .

echo ""
echo "=== 공고 목록 조회 ==="
curl http://localhost:3000/api/jobs | jq '.jobs[] | {id, title, hiring_type}'
