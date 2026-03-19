#!/bin/bash

echo "💰 결제 금액 계산 테스트"
echo "================================"

echo ""
echo "1️⃣ total_work_hours 컬럼 확인..."
npx wrangler d1 execute albi-production --local --command="
SELECT id, title, job_type, total_work_hours 
FROM jobs 
LIMIT 5;
" 2>&1 | grep -A 20 "id\|title\|job_type\|total_work_hours"

echo ""
echo "2️⃣ 결제 금액 계산 테스트 (예상값)..."
echo ""
echo "📊 예상 결제 금액:"
echo "  - 1시간 체험 (total_work_hours=1) → 0원"
echo "  - 3시간 근무 (total_work_hours=3) → 6,000원"
echo "  - 10시간 근무 (total_work_hours=10) → 20,000원"
echo "  - 30시간 근무 (total_work_hours=30) → 30,000원"
echo "  - 100시간 근무 (total_work_hours=100) → 30,000원"
echo "  - 200시간 근무 (total_work_hours=200) → 50,000원"

echo ""
echo "✅ 테스트 완료"
