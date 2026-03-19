#!/bin/bash

echo "=========================================="
echo "🎯 알비 관리자 대시보드 테스트"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 기본 URL
BASE_URL="https://albi-app.pages.dev"

echo -e "${BLUE}📍 배포 URL:${NC} $BASE_URL"
echo -e "${BLUE}📍 관리자 대시보드:${NC} $BASE_URL/admin-dashboard.html"
echo ""
echo -e "${YELLOW}🔑 로그인 정보:${NC}"
echo "   - ID: admin"
echo "   - PW: albi2026!@"
echo ""

# 로그인
echo -e "${GREEN}1️⃣  관리자 로그인 테스트${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"albi2026!@"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
SUCCESS=$(echo $LOGIN_RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "   ✅ 로그인 성공"
  echo "   Token: ${TOKEN:0:30}..."
else
  echo "   ❌ 로그인 실패"
  echo $LOGIN_RESPONSE | jq
  exit 1
fi
echo ""

# Stats API
echo -e "${GREEN}2️⃣  통계 API 테스트${NC}"
STATS=$(curl -s -X GET $BASE_URL/api/admin/stats \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $STATS | jq -r '.success')" = "true" ]; then
  echo "   ✅ 통계 조회 성공"
  echo "   - 총 사용자: $(echo $STATS | jq -r '.stats.users.total')명"
  echo "   - 오늘 가입: $(echo $STATS | jq -r '.stats.users.today')명"
  echo "   - 포인트 잔액: $(echo $STATS | jq -r '.stats.points.balance')P"
  echo "   - 총 발행: $(echo $STATS | jq -r '.stats.points.totalIssued')P"
  echo "   - 총 사용: $(echo $STATS | jq -r '.stats.points.totalUsed')P"
  echo "   - 스토어 구매: $(echo $STATS | jq -r '.stats.store.totalPurchases')건"
  echo "   - 추천 전환율: $(echo $STATS | jq -r '.stats.referrals.conversionRate')%"
else
  echo "   ❌ 통계 조회 실패"
  echo $STATS | jq
fi
echo ""

# Charts API
echo -e "${GREEN}3️⃣  차트 API 테스트${NC}"
CHARTS=$(curl -s -X GET $BASE_URL/api/admin/charts \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $CHARTS | jq -r '.success')" = "true" ]; then
  echo "   ✅ 차트 데이터 조회 성공"
  echo "   - 사용자 증가 데이터: $(echo $CHARTS | jq -r '.charts.userGrowth | length')건"
  echo "   - 포인트 흐름 데이터: $(echo $CHARTS | jq -r '.charts.pointsFlow | length')건"
  echo "   - 월별 매출 데이터: $(echo $CHARTS | jq -r '.charts.monthlyRevenue | length')건"
  echo "   - 거래 유형 데이터: $(echo $CHARTS | jq -r '.charts.pointsByType | length')건"
else
  echo "   ❌ 차트 조회 실패"
  echo $CHARTS | jq
fi
echo ""

# Users API
echo -e "${GREEN}4️⃣  사용자 관리 API 테스트${NC}"
USERS=$(curl -s -X GET "$BASE_URL/api/admin/users?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $USERS | jq -r '.success')" = "true" ]; then
  echo "   ✅ 사용자 목록 조회 성공"
  echo "   - 총 사용자: $(echo $USERS | jq -r '.pagination.total')명"
  echo "   - 현재 페이지: $(echo $USERS | jq -r '.pagination.page')/$(echo $USERS | jq -r '.pagination.totalPages')"
  echo "   - 조회된 사용자: $(echo $USERS | jq -r '.users | length')명"
else
  echo "   ❌ 사용자 조회 실패"
  echo $USERS | jq
fi
echo ""

# Transactions API
echo -e "${GREEN}5️⃣  포인트 거래 API 테스트${NC}"
TRANSACTIONS=$(curl -s -X GET "$BASE_URL/api/admin/transactions?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $TRANSACTIONS | jq -r '.success')" = "true" ]; then
  echo "   ✅ 거래 내역 조회 성공"
  echo "   - 총 거래: $(echo $TRANSACTIONS | jq -r '.pagination.total')건"
  echo "   - 총 발행: $(echo $TRANSACTIONS | jq -r '.stats.totalIssued')P"
  echo "   - 총 사용: $(echo $TRANSACTIONS | jq -r '.stats.totalUsed')P"
else
  echo "   ❌ 거래 내역 조회 실패"
  echo $TRANSACTIONS | jq
fi
echo ""

# Purchases API
echo -e "${GREEN}6️⃣  스토어 구매 API 테스트${NC}"
PURCHASES=$(curl -s -X GET "$BASE_URL/api/admin/purchases?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $PURCHASES | jq -r '.success')" = "true" ]; then
  echo "   ✅ 구매 내역 조회 성공"
  echo "   - 총 구매: $(echo $PURCHASES | jq -r '.pagination.total')건"
  echo "   - 완료: $(echo $PURCHASES | jq -r '.stats.completedCount')건"
  echo "   - 대기: $(echo $PURCHASES | jq -r '.stats.pendingCount')건"
  echo "   - 총 포인트: $(echo $PURCHASES | jq -r '.stats.totalPoints')P"
else
  echo "   ❌ 구매 내역 조회 실패"
  echo $PURCHASES | jq
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✅ 모든 테스트 완료!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}🌐 접속 URL:${NC}"
echo "   - 프로덕션: https://albi.kr/admin-dashboard.html"
echo "   - 최신 배포: $BASE_URL/admin-dashboard.html"
echo ""
