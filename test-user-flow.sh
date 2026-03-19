#!/bin/bash

echo "=== 🔍 Albi 사용자 흐름 검증 ==="
echo ""

BASE_URL="http://localhost:3000"

echo "1️⃣  메인 페이지 → 적성검사 링크 확인"
curl -s "$BASE_URL/" | grep -o "href=\"/job-test" && echo "✅ 메인 페이지에 적성검사 링크 있음" || echo "❌ 메인 페이지에 적성검사 링크 없음"
echo ""

echo "2️⃣  메인 페이지 → AI 멘토 링크 확인"
curl -s "$BASE_URL/" | grep -o "href=\"/mentor-chat" && echo "✅ 메인 페이지에 AI 멘토 링크 있음" || echo "❌ 메인 페이지에 AI 멘토 링크 없음"
echo ""

echo "3️⃣  적성검사 결과 → AI 면접 연결 버튼 확인"
curl -s "$BASE_URL/job-test-result.html" | grep -o "AI 면접 시작하기" && echo "✅ 적성검사 결과에 AI 면접 버튼 있음" || echo "❌ 적성검사 결과에 AI 면접 버튼 없음"
echo ""

echo "4️⃣  적성검사 결과 → AI 멘토 연결 버튼 확인"
curl -s "$BASE_URL/job-test-result.html" | grep -o "AI 멘토 상담하기" && echo "✅ 적성검사 결과에 AI 멘토 버튼 있음" || echo "❌ 적성검사 결과에 AI 멘토 버튼 없음"
echo ""

echo "5️⃣  AI 면접 페이지에서 적성검사 데이터 사용 확인"
curl -s "$BASE_URL/chat.html" | grep -o "localStorage.getItem('testResult')" && echo "✅ AI 면접이 적성검사 데이터를 사용함" || echo "❌ AI 면접이 적성검사 데이터를 사용하지 않음"
echo ""

echo "6️⃣  AI 면접 완료 → AI 멘토 연결 버튼 확인"
curl -s "$BASE_URL/chat.html" | grep -o "AI 멘토와 취업 상담하기" && echo "✅ AI 면접 결과에 AI 멘토 버튼 있음" || echo "❌ AI 면접 결과에 AI 멘토 버튼 없음"
echo ""

echo "=== 📋 전체 흐름 요약 ==="
echo ""
echo "✅ 권장 흐름:"
echo "   1. 메인 페이지 (/)"
echo "   2. 적성검사 시작 (/job-test.html)"
echo "   3. 적성검사 결과 (/job-test-result.html)"
echo "   4. AI 면접 시작 (/chat?from=test)"
echo "   5. AI 면접 완료"
echo "   6. AI 멘토 상담 (/mentor-chat)"
echo ""
echo "✅ 대안 흐름:"
echo "   1. 메인 페이지 (/)"
echo "   2. AI 멘토 직접 접속 (/mentor-chat)"
echo ""
