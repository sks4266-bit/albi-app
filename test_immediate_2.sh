#!/bin/bash

TOKEN="mflcr4x15vcniwagrg0rqbfc3n4tlwm2"

echo "=== 바로채용 공고 등록 ==="
JOB1=$(curl -s -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer ${TOKEN}" \
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
  }')
echo $JOB1 | jq .
JOB1_ID=$(echo $JOB1 | jq -r '.jobId // empty')

echo ""
echo "=== 일반 체험 공고 등록 ==="
JOB2=$(curl -s -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer ${TOKEN}" \
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
  }')
echo $JOB2 | jq .
JOB2_ID=$(echo $JOB2 | jq -r '.jobId // empty')

if [ -n "$JOB1_ID" ]; then
  echo ""
  echo "=== 바로채용 공고 상세 조회 (ID: $JOB1_ID) ==="
  curl -s "http://localhost:3000/api/jobs/${JOB1_ID}" | jq '{
    title: .job.title,
    hiring_type: .job.hiring_type,
    total_work_hours: .job.total_work_hours
  }'
fi

if [ -n "$JOB2_ID" ]; then
  echo ""
  echo "=== 일반 공고 상세 조회 (ID: $JOB2_ID) ==="
  curl -s "http://localhost:3000/api/jobs/${JOB2_ID}" | jq '{
    title: .job.title,
    hiring_type: .job.hiring_type,
    experience_times: .job.experience_times
  }'
fi
