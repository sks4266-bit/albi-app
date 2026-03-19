#!/bin/bash

# Albi E2E 테스트 스크립트
# 주요 기능들을 자동으로 테스트합니다

BASE_URL="https://44fc24c6.albi-app.pages.dev"
TEST_USER_ID="test-user-$(date +%s)"

echo "🧪 Albi E2E 테스트 시작"
echo "================================"
echo "Base URL: $BASE_URL"
echo "Test User ID: $TEST_USER_ID"
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
PASSED=0
FAILED=0

# 테스트 함수
test_api() {
    local name=$1
    local endpoint=$2
    local method=$3
    local data=$4
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

test_page() {
    local name=$1
    local path=$2
    
    echo -n "Testing Page: $name ... "
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📄 1. 페이지 접근성 테스트"
echo "----------------------------"
test_page "랜딩 페이지" "/"
test_page "AI 면접" "/chat"
test_page "텍스트 멘토" "/mentor-chat.html"
test_page "음성 멘토" "/voice-mentor.html"
test_page "결제 페이지" "/payment.html"
test_page "성장 대시보드" "/growth-dashboard.html"
test_page "결제 내역" "/payment-history.html"
test_page "과제 제출" "/assignments.html"
test_page "AI 교정" "/proofread.html"
test_page "포트폴리오" "/portfolio.html"
test_page "이메일 관리" "/email-management.html"
echo ""

echo "🔌 2. API 엔드포인트 테스트"
echo "----------------------------"

# 구독 조회
test_api "구독 상태 조회" "/api/mentor-subscription?user_id=$TEST_USER_ID" "GET"

# 성장 통계
test_api "성장 통계 조회" "/api/growth-stats?user_id=$TEST_USER_ID" "GET"

# 결제 내역
test_api "결제 내역 조회" "/api/payment-history?user_id=$TEST_USER_ID" "GET"

# 과제 목록
test_api "과제 목록 조회" "/api/submit-assignment?user_id=$TEST_USER_ID" "GET"

# 포트폴리오 목록
test_api "포트폴리오 조회" "/api/portfolio?user_id=$TEST_USER_ID" "GET"

echo ""

echo "💬 3. AI 멘토 채팅 테스트"
echo "----------------------------"
test_api "AI 멘토 채팅" "/api/mentor-chat" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"message\":\"안녕하세요\"}"
echo ""

echo "📝 4. 과제 제출 테스트"
echo "----------------------------"
test_api "과제 제출" "/api/submit-assignment" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"title\":\"테스트 이력서\",\"type\":\"resume\",\"difficulty\":\"easy\",\"content\":\"테스트 내용입니다.\"}"
echo ""

echo "✨ 5. AI 교정 테스트"
echo "----------------------------"
test_api "AI 교정" "/api/proofread" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"text\":\"안녕하세요 저는 개발자입니다\",\"type\":\"general\",\"target\":\"formal\"}"
echo ""

echo "💼 6. 포트폴리오 생성 테스트"
echo "----------------------------"
test_api "포트폴리오 생성" "/api/portfolio" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"title\":\"테스트 이력서\",\"portfolio_type\":\"resume\",\"content\":{\"name\":\"홍길동\",\"email\":\"test@example.com\"}}"
echo ""

echo "================================"
echo "🎯 테스트 결과 요약"
echo "================================"
echo -e "통과: ${GREEN}$PASSED${NC}"
echo -e "실패: ${RED}$FAILED${NC}"
echo "총 테스트: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}✗ 일부 테스트 실패${NC}"
    exit 1
fi
