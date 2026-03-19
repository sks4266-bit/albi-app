# 홈택스 API 자동 인증 설정 가이드

## 📋 개요
구인자 인증을 자동화하기 위해 **국세청 홈택스 사업자등록번호 조회 API**를 연동했습니다.

## 🔑 API 키 발급 방법

### 1. 공공데이터포털 회원가입
1. [공공데이터포털](https://www.data.go.kr) 접속
2. 회원가입 (개인 또는 사업자)

### 2. API 활용 신청
1. [국세청_사업자등록정보 진위확인 서비스](https://www.data.go.kr/data/15081808/openapi.do) 접속
2. "활용신청" 버튼 클릭
3. 활용 목적 입력 (예: 구인구직 플랫폼 구인자 인증)
4. 신청 완료 후 승인 대기 (보통 1-2시간 소요)

### 3. API 키 확인
1. [마이페이지 > 오픈API](https://www.data.go.kr/mypage/mypage-openapi.do) 접속
2. "인증키(encoding)" 복사

## ⚙️ Cloudflare Pages 환경 변수 설정

### 로컬 개발 환경 (.dev.vars)
```bash
# 프로젝트 루트에 .dev.vars 파일 생성
cd /home/user/webapp
cat > .dev.vars << 'EOF'
HOMETAX_API_KEY=your_api_key_here
EOF
```

### 프로덕션 환경 (Cloudflare Dashboard)
1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. Pages > albi-app 선택
3. Settings > Environment variables 메뉴
4. Production 탭에서 "Add variable" 클릭
5. 변수 이름: `HOMETAX_API_KEY`
6. 변수 값: 발급받은 API 키
7. "Save" 클릭

또는 Wrangler CLI 사용:
```bash
npx wrangler pages secret put HOMETAX_API_KEY --project-name albi-app
# 프롬프트에서 API 키 입력
```

## 🚀 동작 방식

### 자동 인증 플로우
1. 사용자가 사업자등록번호와 상호명 입력
2. `/api/employer/auto-verify` API 호출
3. 홈택스 API로 사업자등록번호 실시간 검증
   - ✅ 계속사업자(01): 자동 승인
   - ⚠️ 휴업자(02): 인증 거절
   - ❌ 폐업자(03): 인증 거절
4. 자동 승인 시:
   - `employer_verification_requests` 테이블에 approved 상태로 저장
   - `users` 테이블의 `business_registration_verified` 필드를 1로 업데이트
   - 사용자에게 즉시 구인 공고 작성 권한 부여

### API 키가 없는 경우
- 수동 승인 프로세스로 자동 전환
- 관리자가 직접 승인해야 함
- 기존 플로우와 동일하게 작동

## 📊 API 응답 예시

### 성공 응답 (계속사업자)
```json
{
  "success": true,
  "verified": true,
  "message": "✅ 사업자등록번호가 자동으로 인증되었습니다! 이제 구인 공고를 등록할 수 있습니다.",
  "businessInfo": {
    "businessNumber": "123-45-67890",
    "businessName": "주식회사 알비",
    "status": {
      "b_no": "1234567890",
      "b_stt": "계속사업자",
      "b_stt_cd": "01",
      "tax_type": "부가가치세 일반과세자",
      "end_dt": ""
    }
  }
}
```

### 실패 응답 (휴업자/폐업자)
```json
{
  "success": false,
  "verified": false,
  "error": "휴업 중인 사업자입니다.",
  "details": "사업자등록번호가 휴업 상태입니다."
}
```

## 🧪 테스트 방법

### 1. 로컬 환경 테스트
```bash
# 1. .dev.vars 파일에 API 키 설정
echo "HOMETAX_API_KEY=your_api_key_here" > .dev.vars

# 2. 개발 서버 재시작
fuser -k 3000/tcp 2>/dev/null || true
pm2 restart albi-app

# 3. 브라우저에서 테스트
# http://localhost:3000/login
# 마이페이지 > 구인자 인증 탭
```

### 2. 프로덕션 테스트
```bash
# 1. Cloudflare에 환경 변수 설정 (위 가이드 참조)

# 2. 배포
npm run deploy

# 3. 브라우저에서 테스트
# https://albi-app.pages.dev/login
# 마이페이지 > 구인자 인증 탭
```

## 🔍 디버깅

### 콘솔 로그 확인
브라우저 개발자 도구(F12) > Console 탭에서 다음 로그 확인:
- `🏢 사업자등록번호 자동 인증 시작`
- `✅ 세션 확인 완료`
- `📝 요청 데이터`
- `🌐 홈택스 API 호출`
- `📦 홈택스 API 응답`
- `✅ 사용자 인증 완료`

### Cloudflare Logs 확인
```bash
# 실시간 로그 스트리밍
npx wrangler pages deployment tail --project-name albi-app
```

## 📝 주의사항
1. **API 할당량**: 공공데이터포털 API는 무료지만 일일 사용량 제한이 있을 수 있습니다.
2. **API 키 보안**: API 키는 절대 코드에 하드코딩하지 말고 환경 변수로 관리하세요.
3. **에러 처리**: API 호출 실패 시 자동으로 수동 승인 프로세스로 전환됩니다.

## 🎯 향후 개선 사항
- [ ] API 캐싱으로 중복 호출 방지
- [ ] 대량 검증 지원 (배치 처리)
- [ ] 관리자 대시보드에서 자동/수동 인증 통계 제공
