#!/bin/bash

echo "=== 1. 메인 페이지 (index.html) 확인 ==="
echo "▶ AI 멘토 관련 링크/버튼"
grep -n "멘토" public/index.html | head -20

echo ""
echo "=== 2. 적성검사 결과 페이지 (job-test-result.html) 확인 ==="
echo "▶ AI 면접 시작 버튼"
grep -n "AI 면접" public/job-test-result.html | head -10

echo ""
echo "▶ AI 멘토 버튼"
grep -n "멘토" public/job-test-result.html | head -10

echo ""
echo "=== 3. AI 면접 완료 후 (chat.html) 확인 ==="
echo "▶ AI 멘토 링크"
grep -n "mentor-chat" public/chat.html | head -10

echo ""
echo "=== 4. 네비게이션 확인 ==="
echo "▶ 헤더 메뉴"
grep -A 5 "nav\|header" public/index.html | grep -E "(적성|면접|멘토)" | head -10
