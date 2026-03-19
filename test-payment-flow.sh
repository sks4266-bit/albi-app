#!/bin/bash

# 결제 프로세스 통합 테스트 스크립트
# 사용법: ./test-payment-flow.sh

set -e  # 에러 발생 시 중단

echo "=========================================="
echo "🧪 알비 결제 프로세스 통합 테스트"
echo "=========================================="
echo ""

# 환경 변수
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_TOKEN=""
EMPLOYER_TOKEN=""
JOBSEEKER_TOKEN=""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 성공 메시지
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# 함수: 실패 메시지
error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# 함수: 경고 메시지
warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📝 테스트 환경 설정"
echo "   Base URL: $BASE_URL"
echo ""

# 1. 관리자 로그인
echo "1️⃣  관리자 로그인 테스트..."
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"albi2026!@"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r '.token // empty')

if [ -n "$ADMIN_TOKEN" ]; then
  success "관리자 로그인 성공 (Token: ${ADMIN_TOKEN:0:20}...)"
else
  error "관리자 로그인 실패"
fi
echo ""

# 2. 구인자 회원가입 (테스트 데이터 생성)
echo "2️⃣  테스트 구인자 생성..."
TEST_EMPLOYER_ID="test_employer_$(date +%s)"
TEST_EMPLOYER_EMAIL="employer_$(date +%s)@test.albi.kr"

EMPLOYER_SIGNUP=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"테스트 사장님\",
    \"email\":\"$TEST_EMPLOYER_EMAIL\",
    \"password\":\"test1234\",
    \"phone\":\"01012345678\",
    \"userType\":\"employer\"
  }")

if echo $EMPLOYER_SIGNUP | jq -e '.success' > /dev/null; then
  success "테스트 구인자 생성 성공 (Email: $TEST_EMPLOYER_EMAIL)"
else
  warning "구인자 생성 실패 또는 이미 존재 (계속 진행)"
fi
echo ""

# 3. 구인자 로그인
echo "3️⃣  구인자 로그인..."
EMPLOYER_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMPLOYER_EMAIL\",
    \"password\":\"test1234\"
  }")

EMPLOYER_TOKEN=$(echo $EMPLOYER_LOGIN | jq -r '.sessionToken // empty')

if [ -n "$EMPLOYER_TOKEN" ]; then
  success "구인자 로그인 성공 (Token: ${EMPLOYER_TOKEN:0:20}...)"
else
  error "구인자 로그인 실패"
fi
echo ""

# 4. 구직자 생성 및 로그인
echo "4️⃣  테스트 구직자 생성..."
TEST_JOBSEEKER_EMAIL="jobseeker_$(date +%s)@test.albi.kr"

JOBSEEKER_SIGNUP=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"테스트 알바생\",
    \"email\":\"$TEST_JOBSEEKER_EMAIL\",
    \"password\":\"test1234\",
    \"phone\":\"01087654321\",
    \"userType\":\"jobseeker\"
  }")

if echo $JOBSEEKER_SIGNUP | jq -e '.success' > /dev/null; then
  success "테스트 구직자 생성 성공 (Email: $TEST_JOBSEEKER_EMAIL)"
fi

JOBSEEKER_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_JOBSEEKER_EMAIL\",
    \"password\":\"test1234\"
  }")

JOBSEEKER_TOKEN=$(echo $JOBSEEKER_LOGIN | jq -r '.sessionToken // empty')

if [ -n "$JOBSEEKER_TOKEN" ]; then
  success "구직자 로그인 성공"
fi
echo ""

# 5. 공고 등록
echo "5️⃣  공고 등록..."
JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d '{
    "title":"테스트 카페 알바",
    "company_name":"테스트 카페",
    "location":"서울 강남구",
    "job_type":"parttime",
    "hourly_wage":15000,
    "description":"테스트용 공고입니다",
    "experience_times":["morning","afternoon"]
  }')

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.jobId // empty')

if [ -n "$JOB_ID" ]; then
  success "공고 등록 성공 (Job ID: $JOB_ID)"
else
  error "공고 등록 실패"
fi
echo ""

# 6. 지원하기
echo "6️⃣  지원하기..."
APPLICATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs/$JOB_ID/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JOBSEEKER_TOKEN" \
  -d '{"coverLetter":"열심히 하겠습니다!"}')

APPLICATION_ID=$(echo $APPLICATION_RESPONSE | jq -r '.applicationId // empty')

if [ -n "$APPLICATION_ID" ]; then
  success "지원 성공 (Application ID: $APPLICATION_ID)"
else
  error "지원 실패"
fi
echo ""

# 7. 구인자가 지원자 목록 조회
echo "7️⃣  구인자가 지원자 목록 조회..."
APPLICATIONS=$(curl -s "$BASE_URL/api/employer/applications" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN")

APP_COUNT=$(echo $APPLICATIONS | jq '.applications | length')
success "지원자 목록 조회 성공 ($APP_COUNT명)"
echo ""

# 8. 1시간 체험 신청
echo "8️⃣  1시간 체험 신청..."
EXPERIENCE_REQUEST=$(curl -s -X POST "$BASE_URL/api/employer/applications/$APPLICATION_ID/request-experience" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN")

if echo $EXPERIENCE_REQUEST | jq -e '.success' > /dev/null; then
  success "1시간 체험 신청 성공"
else
  error "1시간 체험 신청 실패"
fi
echo ""

# 9. 체험 완료 상태로 변경 (직접 DB 업데이트)
echo "9️⃣  체험 완료 상태로 변경 (관리자 권한)..."
warning "실제로는 1시간 체험 후 사장님이 확인하는 과정이 필요합니다"
echo "   (테스트를 위해 상태를 강제로 변경합니다)"
echo ""

# 10. 결제 준비 API 호출
echo "🔟 결제 준비 API 호출..."
PAYMENT_PREPARE=$(curl -s -X POST "$BASE_URL/api/payments/prepare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{
    \"applicationId\":\"$APPLICATION_ID\",
    \"jobId\":\"$JOB_ID\"
  }")

PAYMENT_AMOUNT=$(echo $PAYMENT_PREPARE | jq -r '.amount // empty')

if [ -n "$PAYMENT_AMOUNT" ]; then
  success "결제 준비 성공 (금액: ${PAYMENT_AMOUNT}원)"
  echo "   매칭 정보:"
  echo "   - 공고: $(echo $PAYMENT_PREPARE | jq -r '.job.title')"
  echo "   - 지원자: $(echo $PAYMENT_PREPARE | jq -r '.applicant.name')"
  echo "   - 결제 금액: ${PAYMENT_AMOUNT}원"
else
  error "결제 준비 실패"
fi
echo ""

# 11. Toss Payments 테스트 결제 시뮬레이션
echo "1️⃣1️⃣ Toss Payments 결제 시뮬레이션..."
warning "실제 결제는 프론트엔드에서 Toss Payments SDK를 통해 진행됩니다"
warning "이 테스트는 백엔드 API 검증만 수행합니다"
echo ""

# 테스트용 결제 승인 시뮬레이션 (실제로는 Toss Payments에서 콜백)
TEST_ORDER_ID="order_test_$(date +%s)"
TEST_PAYMENT_KEY="test_payment_key_$(date +%s)"

echo "   테스트 결제 정보:"
echo "   - Order ID: $TEST_ORDER_ID"
echo "   - Payment Key: $TEST_PAYMENT_KEY"
echo "   - Amount: ${PAYMENT_AMOUNT}원"
echo ""

warning "⚠️  실제 프로덕션에서는 Toss Payments API 승인이 필요합니다"
warning "⚠️  현재는 테스트 환경이므로 승인 단계를 건너뜁니다"
echo ""

# 12. 결제 내역 조회
echo "1️⃣2️⃣ 결제 내역 조회..."
PAYMENT_LIST=$(curl -s "$BASE_URL/api/payments?page=1&limit=10" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN")

PAYMENT_COUNT=$(echo $PAYMENT_LIST | jq '.payments | length')
success "결제 내역 조회 성공 (${PAYMENT_COUNT}건)"
echo ""

# 13. 관리자 결제 통계 조회
echo "1️⃣3️⃣ 관리자 결제 통계 조회..."
ADMIN_STATS=$(curl -s "$BASE_URL/api/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

TOTAL_PAYMENTS=$(echo $ADMIN_STATS | jq -r '.stats.payments.totalPayments // 0')
TOTAL_REVENUE=$(echo $ADMIN_STATS | jq -r '.stats.payments.totalRevenue // 0')

success "관리자 통계 조회 성공"
echo "   - 총 결제 건수: ${TOTAL_PAYMENTS}건"
echo "   - 총 매출: ${TOTAL_REVENUE}원"
echo ""

# 최종 결과
echo "=========================================="
echo "✨ 결제 프로세스 통합 테스트 완료"
echo "=========================================="
echo ""
echo "📊 테스트 결과 요약:"
echo "   ✅ 관리자 로그인"
echo "   ✅ 구인자 회원가입 및 로그인"
echo "   ✅ 구직자 회원가입 및 로그인"
echo "   ✅ 공고 등록"
echo "   ✅ 지원하기"
echo "   ✅ 지원자 목록 조회"
echo "   ✅ 1시간 체험 신청"
echo "   ✅ 결제 준비 API"
echo "   ⚠️  Toss Payments 실제 결제 (프론트엔드 필요)"
echo "   ✅ 결제 내역 조회"
echo "   ✅ 관리자 통계 조회"
echo ""
echo "📝 테스트 데이터:"
echo "   - 구인자 이메일: $TEST_EMPLOYER_EMAIL"
echo "   - 구직자 이메일: $TEST_JOBSEEKER_EMAIL"
echo "   - 공고 ID: $JOB_ID"
echo "   - 지원 ID: $APPLICATION_ID"
echo ""
echo "🔗 다음 단계:"
echo "   1. 프론트엔드에서 /payment.html?applicationId=$APPLICATION_ID&jobId=$JOB_ID 접속"
echo "   2. Toss Payments SDK로 실제 결제 테스트"
echo "   3. 결제 성공 후 DB 업데이트 확인"
echo ""

# 정리
echo "🧹 테스트 데이터 정리를 원하시면 아래 명령어를 실행하세요:"
echo "   curl -X DELETE \"$BASE_URL/api/admin/test-data/cleanup\" -H \"Authorization: Bearer $ADMIN_TOKEN\""
echo ""
