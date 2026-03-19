#!/bin/bash

# 🌐 Resend 커스텀 도메인 설정 헬퍼 스크립트
# 사용법: ./scripts/setup-custom-domain.sh yourdomain.com

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 도메인 입력 확인
if [ -z "$1" ]; then
  echo -e "${RED}❌ 오류: 도메인을 입력해주세요${NC}"
  echo -e "${BLUE}사용법: ./scripts/setup-custom-domain.sh yourdomain.com${NC}"
  exit 1
fi

DOMAIN=$1

echo -e "${GREEN}🌐 Resend 커스텀 도메인 설정${NC}"
echo -e "${BLUE}도메인: ${DOMAIN}${NC}"
echo ""

# Step 1: DNS 레코드 확인
echo -e "${YELLOW}📋 Step 1: DNS 레코드 확인${NC}"
echo "다음 DNS 레코드를 설정했는지 확인하세요:"
echo ""
echo "Record 1 (SPF):"
echo "  Type: TXT"
echo "  Name: @"
echo "  Value: v=spf1 include:_spf.resend.com ~all"
echo ""
echo "Record 2 (DKIM):"
echo "  Type: TXT"
echo "  Name: resend._domainkey"
echo "  Value: [Resend에서 제공한 값]"
echo ""
echo "Record 3 (Verification):"
echo "  Type: TXT"
echo "  Name: _resend"
echo "  Value: [Resend에서 제공한 값]"
echo ""

read -p "DNS 레코드를 설정했나요? (y/n): " dns_ready
if [ "$dns_ready" != "y" ]; then
  echo -e "${YELLOW}⚠️  DNS 레코드를 먼저 설정한 후 다시 실행해주세요${NC}"
  echo -e "${BLUE}가이드: CUSTOM_DOMAIN_SETUP.md 참고${NC}"
  exit 0
fi

# Step 2: DNS 전파 확인
echo ""
echo -e "${YELLOW}📡 Step 2: DNS 전파 확인${NC}"
echo "DNS 레코드 조회 중..."
echo ""

echo "1. SPF 레코드:"
dig TXT ${DOMAIN} +short | grep "spf1" || echo "  ❌ SPF 레코드 없음"

echo ""
echo "2. DKIM 레코드:"
dig TXT resend._domainkey.${DOMAIN} +short || echo "  ❌ DKIM 레코드 없음"

echo ""
echo "3. Verification 레코드:"
dig TXT _resend.${DOMAIN} +short || echo "  ❌ Verification 레코드 없음"

echo ""
read -p "모든 DNS 레코드가 확인되었나요? (y/n): " dns_verified
if [ "$dns_verified" != "y" ]; then
  echo -e "${YELLOW}⚠️  DNS 전파를 기다리거나 설정을 확인해주세요${NC}"
  echo -e "${BLUE}DNS 전파는 최대 48시간이 걸릴 수 있습니다${NC}"
  echo -e "${BLUE}빠른 확인: https://dnschecker.org/${NC}"
  exit 0
fi

# Step 3: Resend 도메인 인증 확인
echo ""
echo -e "${YELLOW}✅ Step 3: Resend 도메인 인증 확인${NC}"
echo "Resend 대시보드에서 도메인 상태를 확인하세요:"
echo "  https://resend.com/domains"
echo ""

read -p "Resend에서 도메인이 'Verified' 상태인가요? (y/n): " resend_verified
if [ "$resend_verified" != "y" ]; then
  echo -e "${YELLOW}⚠️  Resend에서 'Verify Domain' 버튼을 클릭하고 인증을 완료해주세요${NC}"
  exit 0
fi

# Step 4: 코드 수정
echo ""
echo -e "${YELLOW}🔧 Step 4: 코드 수정${NC}"
echo "이메일 발신자 주소를 커스텀 도메인으로 변경합니다..."

# 백업 생성
cp functions/api/contracts/email-service.ts functions/api/contracts/email-service.ts.backup
echo -e "${GREEN}✅ 백업 생성: email-service.ts.backup${NC}"

# 도메인 변경
sed -i "s/onboarding@resend.dev/noreply@${DOMAIN}/g" functions/api/contracts/email-service.ts

# 변경 확인
echo ""
echo "변경된 내용:"
grep "from:" functions/api/contracts/email-service.ts | head -1
echo ""

read -p "변경 내용이 올바른가요? (y/n): " code_ok
if [ "$code_ok" != "y" ]; then
  # 롤백
  mv functions/api/contracts/email-service.ts.backup functions/api/contracts/email-service.ts
  echo -e "${RED}❌ 변경 취소됨${NC}"
  exit 1
fi

# 백업 파일 삭제
rm functions/api/contracts/email-service.ts.backup

# Step 5: Git 커밋
echo ""
echo -e "${YELLOW}📝 Step 5: Git 커밋${NC}"
git add functions/api/contracts/email-service.ts
git commit -m "Update: Change email sender to custom domain (${DOMAIN})"
echo -e "${GREEN}✅ Git 커밋 완료${NC}"

# Step 6: 배포
echo ""
echo -e "${YELLOW}🚀 Step 6: Cloudflare Pages 배포${NC}"
read -p "지금 배포하시겠습니까? (y/n): " deploy_now
if [ "$deploy_now" = "y" ]; then
  npm run deploy
  echo ""
  echo -e "${GREEN}✅ 배포 완료!${NC}"
else
  echo -e "${BLUE}ℹ️  나중에 수동으로 배포하려면: npm run deploy${NC}"
fi

# 완료
echo ""
echo -e "${GREEN}🎉 커스텀 도메인 설정 완료!${NC}"
echo ""
echo -e "${BLUE}📧 테스트 방법:${NC}"
echo "1. https://albi-app.pages.dev/contract 접속"
echo "2. 계약서 작성 (실제 이메일 주소 입력)"
echo "3. 이메일 확인 → 발신자: ALBI <noreply@${DOMAIN}>"
echo ""
echo -e "${GREEN}✅ 이제 임의의 이메일 주소로 발송할 수 있습니다!${NC}"
