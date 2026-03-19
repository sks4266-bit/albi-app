# API 키 설정 가이드

## 🔐 프로덕션 배포를 위한 필수 설정

알비(ALBI) 서비스를 프로덕션 환경에서 정상적으로 운영하기 위해서는 다음 2개의 API 키를 설정해야 합니다.

---

## 1. Toss Payments API 키 설정

### 📋 필요한 키
- **Client Key** (클라이언트 키): 프론트엔드에서 결제 UI를 로드할 때 사용
- **Secret Key** (시크릿 키): 서버에서 결제 승인/취소 API를 호출할 때 사용

### 🔑 키 발급 방법

1. **Toss Payments 개발자 센터 접속**
   - URL: https://developers.tosspayments.com/
   - 회원가입 및 로그인

2. **사업자 정보 등록**
   - 내 정보 > 사업자 정보 등록
   - 사업자등록번호: 531-08-03526
   - 상호명: 알비
   - 대표자: 박지훈

3. **API 키 발급**
   - 개발자 센터 > API 키 관리
   - 테스트 키와 라이브 키 확인
   - **라이브 키**를 사용해야 실제 결제가 가능합니다

4. **결제 수단 설정**
   - 지원 결제 수단: 카드, 계좌이체, 가상계좌, Toss Pay
   - PG 수수료 및 정산 주기 확인

### 💻 Cloudflare에 키 설정하기

#### 방법 1: Wrangler CLI 사용 (권장)
```bash
cd /home/user/webapp

# Client Key 설정 (프론트엔드용)
npx wrangler secret put TOSS_CLIENT_KEY --env production
# 입력 프롬프트에서 실제 Client Key 입력

# Secret Key 설정 (백엔드용)
npx wrangler secret put TOSS_SECRET_KEY --env production
# 입력 프롬프트에서 실제 Secret Key 입력
```

#### 방법 2: Cloudflare Dashboard 사용
1. Cloudflare Dashboard 로그인
2. Workers & Pages > albi-app 선택
3. Settings > Environment Variables
4. Production 환경에서 Add variable 클릭
   - Variable name: `TOSS_CLIENT_KEY`
   - Value: [실제 클라이언트 키 입력]
   - Type: Encrypted (Secret)
5. 같은 방식으로 `TOSS_SECRET_KEY` 추가

### ✅ 설정 확인
```bash
# 키 목록 확인 (값은 표시되지 않음)
npx wrangler secret list --env production
```

---

## 2. Resend Email API 키 설정

### 📋 필요한 키
- **API Key**: 이메일 발송 API 호출에 사용

### 🔑 키 발급 방법

1. **Resend 가입**
   - URL: https://resend.com/
   - 회원가입 및 로그인

2. **도메인 인증**
   - Settings > Domains > Add Domain
   - 도메인 입력: `albi.kr`
   - DNS 레코드 추가 (Cloudflare DNS 설정)
     - SPF: `v=spf1 include:resend.com ~all`
     - DKIM: Resend에서 제공하는 CNAME 레코드 추가
     - DMARC: `v=DMARC1; p=none;`

3. **API 키 발급**
   - Settings > API Keys > Create API Key
   - Name: `ALBI Production`
   - Permission: Sending access
   - 발급된 키 복사 (한 번만 표시됨)

### 💻 Cloudflare에 키 설정하기

#### 방법 1: Wrangler CLI 사용 (권장)
```bash
cd /home/user/webapp

# Resend API Key 설정
npx wrangler secret put RESEND_API_KEY --env production
# 입력 프롬프트에서 실제 API Key 입력 (re_로 시작)
```

#### 방법 2: Cloudflare Dashboard 사용
1. Cloudflare Dashboard 로그인
2. Workers & Pages > albi-app 선택
3. Settings > Environment Variables
4. Production 환경에서 Add variable 클릭
   - Variable name: `RESEND_API_KEY`
   - Value: [실제 API 키 입력, re_로 시작]
   - Type: Encrypted (Secret)

### ✅ 설정 확인
```bash
# 키 목록 확인
npx wrangler secret list --env production
```

### 📧 발신자 주소 설정
이메일 발송 시 다음 발신자 주소를 사용합니다:
- From: `ALBI <noreply@albi.kr>`
- 도메인 인증이 완료되어야 정상 발송됩니다

---

## 3. 로컬 개발 환경 설정 (.dev.vars)

프로덕션 배포 전 로컬 테스트를 위해 `.dev.vars` 파일을 생성하세요.

### 파일 생성
```bash
cd /home/user/webapp
cat > .dev.vars << 'EOF'
# Toss Payments (테스트 키)
TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Resend Email (실제 API 키 또는 테스트 키)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF
```

### ⚠️ 보안 주의사항
- `.dev.vars` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.dev.vars`가 포함되어 있는지 확인
- 실제 키는 프로덕션 환경(Cloudflare)에만 설정

```bash
# .gitignore 확인
grep ".dev.vars" .gitignore
```

---

## 4. API 키 설정 후 배포

모든 키 설정이 완료되면 다시 배포합니다:

```bash
cd /home/user/webapp

# 배포
npm run deploy

# 배포 URL 확인
# https://albi-app.pages.dev 또는 https://albi.kr
```

---

## 5. 기능별 API 키 사용 현황

### Toss Payments API 키 사용처
- ✅ **결제 준비 (Prepare)**: `POST /api/payments/prepare`
- ✅ **결제 승인 (Confirm)**: `POST /api/payments/success`
- ✅ **환불 처리 (Refund)**: `POST /api/payments/refund`
- 📄 **설정 위치**: `functions/api/payments/[[path]].ts`

### Resend Email API 키 사용처
- ✅ **세금계산서 승인 이메일**: 관리자가 세금계산서 승인 시 자동 발송
- ✅ **세금계산서 거절 이메일**: 관리자가 세금계산서 거절 시 자동 발송
- ✅ **결제 완료 이메일** (향후 구현): 결제 성공 시 영수증 이메일
- 📄 **설정 위치**: `functions/api/admin/[[path]].ts`

---

## 6. 문제 해결 (Troubleshooting)

### Toss Payments 오류
```
Error: Invalid API Key
```
**해결 방법:**
1. 라이브 키를 사용하고 있는지 확인 (테스트 키는 프로덕션 불가)
2. 키가 정확히 입력되었는지 확인 (공백, 줄바꿈 없이)
3. Cloudflare 환경 변수가 Production에 설정되었는지 확인

### Resend Email 오류
```
Error: Domain not verified
```
**해결 방법:**
1. Resend Dashboard에서 도메인 인증 상태 확인
2. Cloudflare DNS에 SPF/DKIM 레코드 추가 확인
3. DNS 전파 대기 (최대 48시간, 일반적으로 10분 내)

```
Error: Invalid API Key
```
**해결 방법:**
1. API 키가 `re_`로 시작하는지 확인
2. 키 권한이 'Sending access'인지 확인
3. 키가 삭제되지 않았는지 Resend Dashboard에서 확인

### 환경 변수 미적용
```
Error: env.TOSS_SECRET_KEY is undefined
```
**해결 방법:**
1. `npx wrangler secret list` 명령으로 키 존재 여부 확인
2. 재배포 수행: `npm run deploy`
3. Cloudflare Dashboard에서 환경 변수 직접 확인

---

## 7. 체크리스트

프로덕션 배포 전 다음 항목을 모두 확인하세요:

### Toss Payments
- [ ] Toss Payments 개발자 센터 가입 완료
- [ ] 사업자 정보 등록 (531-08-03526)
- [ ] 라이브 API 키 발급 완료
- [ ] TOSS_CLIENT_KEY Cloudflare Secret 설정
- [ ] TOSS_SECRET_KEY Cloudflare Secret 설정
- [ ] 결제 수단 설정 완료 (카드/계좌이체/가상계좌/TossPay)

### Resend Email
- [ ] Resend 가입 완료
- [ ] albi.kr 도메인 추가
- [ ] Cloudflare DNS에 SPF 레코드 추가
- [ ] Cloudflare DNS에 DKIM CNAME 레코드 추가
- [ ] Resend Dashboard에서 도메인 인증 완료 확인
- [ ] API 키 발급 완료 (re_로 시작)
- [ ] RESEND_API_KEY Cloudflare Secret 설정

### 배포 확인
- [ ] `npm run deploy` 배포 성공
- [ ] https://albi.kr 접속 확인
- [ ] 테스트 결제 진행 (소액)
- [ ] 세금계산서 발급 테스트
- [ ] 이메일 수신 확인

---

## 8. 비용 안내

### Toss Payments 수수료
- 카드 결제: 약 3.3% (협상 가능)
- 계좌이체: 약 1.5%
- 가상계좌: 건당 200~300원
- 정산 주기: D+1 ~ D+7 (PG사 정책에 따름)

### Resend 요금제
- Free: 월 3,000통 무료
- Pro: 월 $20 (월 50,000통)
- 현재 발송량 예상: 월 1,000통 미만 (무료 플랜으로 충분)

---

## 9. 참고 링크

- **Toss Payments 개발자 문서**: https://docs.tosspayments.com/
- **Resend 문서**: https://resend.com/docs
- **Cloudflare Workers 환경 변수**: https://developers.cloudflare.com/workers/configuration/environment-variables/
- **Cloudflare DNS 설정**: https://dash.cloudflare.com/

---

**작성일**: 2026-02-16  
**작성자**: AI Developer Assistant  
**문의**: 설정 과정에서 문제가 발생하면 Toss Payments/Resend 고객지원팀에 문의하세요.
