#!/bin/bash

# Albi 성능 모니터링 스크립트
# 주요 API 엔드포인트의 응답 시간을 측정합니다

BASE_URL="https://44fc24c6.albi-app.pages.dev"
TEST_USER_ID="perf-test-user"

echo "📊 Albi 성능 모니터링"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 성능 측정 함수
measure_perf() {
    local name=$1
    local url=$2
    local method=$3
    local data=$4
    
    echo -n "$name: "
    
    if [ "$method" = "GET" ]; then
        time_total=$(curl -s -w "%{time_total}" -o /dev/null "$url")
    else
        time_total=$(curl -s -w "%{time_total}" -o /dev/null -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # 밀리초로 변환
    time_ms=$(echo "$time_total * 1000" | bc)
    time_ms_int=$(printf "%.0f" $time_ms)
    
    # 성능 등급 결정
    if [ $time_ms_int -lt 200 ]; then
        echo -e "${GREEN}${time_ms_int}ms ⚡ Excellent${NC}"
    elif [ $time_ms_int -lt 500 ]; then
        echo -e "${GREEN}${time_ms_int}ms ✓ Good${NC}"
    elif [ $time_ms_int -lt 1000 ]; then
        echo -e "${YELLOW}${time_ms_int}ms ⚠ Fair${NC}"
    else
        echo -e "${RED}${time_ms_int}ms ✗ Slow${NC}"
    fi
}

echo "📄 정적 페이지 (CDN)"
echo "----------------------------"
measure_perf "랜딩 페이지        " "$BASE_URL/" "GET"
measure_perf "AI 면접           " "$BASE_URL/chat" "GET"
measure_perf "텍스트 멘토       " "$BASE_URL/mentor-chat.html" "GET"
measure_perf "음성 멘토         " "$BASE_URL/voice-mentor.html" "GET"
echo ""

echo "🔌 API 엔드포인트 (Workers)"
echo "----------------------------"
measure_perf "구독 상태 조회    " "$BASE_URL/api/mentor-subscription?user_id=$TEST_USER_ID" "GET"
measure_perf "성장 통계 조회    " "$BASE_URL/api/growth-stats?user_id=$TEST_USER_ID" "GET"
measure_perf "결제 내역 조회    " "$BASE_URL/api/payment-history?user_id=$TEST_USER_ID" "GET"
measure_perf "과제 목록 조회    " "$BASE_URL/api/submit-assignment?user_id=$TEST_USER_ID" "GET"
measure_perf "포트폴리오 조회   " "$BASE_URL/api/portfolio?user_id=$TEST_USER_ID" "GET"
echo ""

echo "💬 AI 기반 API (AI 처리 시간 포함)"
echo "----------------------------"
echo "⚠️  구독 필요 API는 403 에러가 정상입니다"
measure_perf "AI 멘토 채팅      " "$BASE_URL/api/mentor-chat" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"message\":\"안녕하세요\"}"
measure_perf "AI 교정           " "$BASE_URL/api/proofread" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"text\":\"테스트\",\"type\":\"general\",\"target\":\"formal\"}"
measure_perf "포트폴리오 생성   " "$BASE_URL/api/portfolio" "POST" \
    "{\"user_id\":\"$TEST_USER_ID\",\"title\":\"테스트\",\"portfolio_type\":\"resume\",\"content\":{\"name\":\"홍길동\"}}"
echo ""

echo "================================"
echo "📈 성능 등급 기준"
echo "================================"
echo -e "${GREEN}⚡ Excellent${NC}: < 200ms"
echo -e "${GREEN}✓ Good${NC}:      200-500ms"
echo -e "${YELLOW}⚠ Fair${NC}:      500-1000ms"
echo -e "${RED}✗ Slow${NC}:      > 1000ms"
echo ""

echo "💡 성능 개선 팁:"
echo "  - 정적 페이지는 Cloudflare CDN으로 캐싱"
echo "  - API는 Cloudflare Workers 엣지에서 처리"
echo "  - AI API는 GPT 응답 시간에 영향받음"
echo "  - D1 쿼리 최적화로 응답 속도 개선"
