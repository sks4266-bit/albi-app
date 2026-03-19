#!/bin/bash

echo "=== 새로운 요금 체계 테스트 ==="
echo ""

# 테스트 케이스
test_cases=(
  "1:1시간 체험"
  "2:초단기 최소"
  "3:초단기"
  "10:초단기"
  "20:초단기 최대"
  "21:단기 시작"
  "100:단기"
  "160:단기 최대"
  "161:장기 시작"
  "240:장기"
)

for case in "${test_cases[@]}"; do
  hours="${case%%:*}"
  label="${case#*:}"
  
  if [ "$hours" -le 1 ]; then
    amount=0
  elif [ "$hours" -le 20 ]; then
    amount=$((hours * 1500))
    if [ "$amount" -lt 3000 ]; then
      amount=3000
    fi
  elif [ "$hours" -le 160 ]; then
    amount=30000
  else
    amount=50000
  fi
  
  formatted_amount=$(printf "%'d" $amount)
  echo "✓ $label ($hours시간): ${formatted_amount}원"
done

echo ""
echo "=== 주요 개선 사항 ==="
echo "• 3시간: 6,000원 → 4,500원 (1,500원 절감)"
echo "• 10시간: 20,000원 → 15,000원 (5,000원 절감)"
echo "• 20시간: 40,000원 → 30,000원 (10,000원 절감!) ✨"
