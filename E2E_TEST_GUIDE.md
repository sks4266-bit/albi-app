# 🧪 PortOne V2 결제 E2E 테스트 가이드

## 📋 테스트 체크리스트

### ✅ 사전 준비
- [ ] PortOne 대시보드 웹훅 설정 완료
- [ ] Cloudflare 환경 변수 설정 완료 (PORTONE_WEBHOOK_SECRET)
- [ ] 프로덕션 배포 완료 (https://albi.kr)
- [ ] 개발자 도구 콘솔 열기 (F12)

---

## 🎯 테스트 시나리오

### **Scenario 1: 카드 결제 (NHN KCP) - 빌링키 발급**

#### Step 1: 결제 페이지 접속
```
URL: https://albi.kr/payment.html
```

#### Step 2: 테스트 계정 확인
```
이름: 홍길동 (자동 입력됨)
이메일: test@example.com (자동 입력됨)
```

#### Step 3: 플랜 선택
```
- Basic (₩2,900)
- Standard (₩4,900) ← 추천
- Premium (₩9,900)
- Unlimited (₩19,900)
```

#### Step 4: 결제수단 선택
```
[ ] 카드 (NHN KCP) ← 선택
[ ] 카카오페이
[ ] 휴대폰 결제 (다날)
[ ] KG이니시스
```

#### Step 5: 결제 버튼 클릭
```
[결제하기] 클릭
```

#### Step 6: 콘솔 로그 확인
```javascript
✅ Payment method selected: card
✅ Using channel: NHN KCP
✅ Subscription created: sub_xxx
✅ Requesting payment with PortOne SDK
```

#### Step 7: PortOne 결제 팝업
```
- 테스트 카드 정보 입력
- 카드번호: 1234-5678-9012-3456
- 유효기간: 12/25
- CVC: 123
- 비밀번호 앞 2자리: 00
```

#### Step 8: 결제 완료
```
✅ 결제 성공 메시지
✅ payment-callback.html로 리디렉션
```

#### Step 9: 결제 콜백 페이지
```
URL: https://albi.kr/payment-callback.html?payment_id=xxx
```

**예상 화면:**
```
✅ 결제가 완료되었습니다!

Standard 플랜 구독이 시작되었습니다.
금액: ₩4,900

다음 결제일: 2026-04-05
구독 ID: sub_1772728275291_xxx

3초 후 마이페이지로 이동합니다...
```

#### Step 10: 콘솔 로그 확인
```javascript
✅ Payment ID extracted: payment_xxx
✅ Fetching payment info...
✅ Payment info received: { status: 'PAID', amount: 4900 }
✅ Confirming subscription...
✅ Subscription confirmed successfully
✅ Redirecting to mypage in 3 seconds...
```

#### Step 11: 데이터베이스 확인
```sql
-- mentor_subscriptions 테이블
SELECT * FROM mentor_subscriptions 
WHERE subscription_id = 'sub_xxx';

-- 예상 결과:
-- status: 'active'
-- plan_type: 'standard'
-- amount: 4900
-- next_payment_date: '2026-04-05'
```

```sql
-- billing_keys 테이블
SELECT * FROM billing_keys 
WHERE user_id = 'test_user_xxx';

-- 예상 결과:
-- billing_key: 'billing_xxx'
-- card_name: 'KB국민카드'
-- card_number: '1234-****-****-3456'
-- status: 'active'
```

```sql
-- subscription_payments 테이블
SELECT * FROM subscription_payments 
WHERE subscription_id = 'sub_xxx';

-- 예상 결과:
-- status: 'completed'
-- amount: 4900
-- pg_provider: 'kcp_v2'
-- paid_at: '2026-03-05 14:00:00'
```

#### Step 12: 웹훅 수신 확인
```bash
# 로그 확인 (Cloudflare Pages)
npx wrangler pages deployment tail --project-name albi-app

# 예상 로그:
[INFO] Webhook received: Transaction.Paid
[INFO] Payment ID: payment_xxx
[INFO] Signature verified
[INFO] Updating subscription status to 'active'
[INFO] Webhook processed successfully
```

---

### **Scenario 2: 카카오페이 결제 - 빌링키 발급**

#### Step 1-3: 동일 (결제 페이지 → 플랜 선택)

#### Step 4: 결제수단 선택
```
[ ] 카드 (NHN KCP)
[x] 카카오페이 ← 선택
[ ] 휴대폰 결제 (다날)
[ ] KG이니시스
```

#### Step 5-6: 결제 진행
```javascript
✅ Payment method selected: kakaopay
✅ Using channel: 카카오페이
✅ Subscription created: sub_xxx
```

#### Step 7: 카카오페이 팝업
```
- 카카오 로그인
- 결제 수단 선택 (카드/계좌)
- 결제 승인
```

#### Step 8-12: 동일 (결제 완료 → 콜백 → DB 확인 → 웹훅)

**예상 DB:**
```sql
-- billing_keys
pg_provider: 'kakaopay'
card_name: '카카오페이'
status: 'active'
```

---

### **Scenario 3: 휴대폰 결제 (다날) - 일회성**

#### Step 4: 결제수단 선택
```
[ ] 카드 (NHN KCP)
[ ] 카카오페이
[x] 휴대폰 결제 (다날) ← 선택
[ ] KG이니시스
```

#### Step 7: 다날 휴대폰 인증 팝업
```
- 휴대폰 번호 입력
- 인증번호 수신
- 인증번호 입력
```

#### ⚠️ 주의: 빌링키 미발급
```
휴대폰 결제는 일회성 결제만 지원됩니다.
빌링키가 발급되지 않으므로 자동 갱신이 불가능합니다.

DB 확인:
- billing_keys 테이블에 레코드 없음
- subscription_payments.status = 'completed'
- mentor_subscriptions.status = 'active' (하지만 next_payment_date null)
```

---

### **Scenario 4: INICIS 결제 - 빌링키 발급**

#### Step 4: 결제수단 선택
```
[ ] 카드 (NHN KCP)
[ ] 카카오페이
[ ] 휴대폰 결제 (다날)
[x] KG이니시스 ← 선택
```

#### Step 7: INICIS 결제 팝업
```
- 카드 선택
- 카드 정보 입력
- 휴대폰 본인 인증 (필수)
```

#### ✅ phoneNumber 필드 확인
```javascript
customer: {
  customerId: "billing_xxx",
  fullName: "홍길동",
  email: "test@example.com",
  phoneNumber: "01012345678" // ← 필수!
}
```

---

## 🔍 디버깅 체크리스트

### ❌ 결제 팝업이 안 뜨는 경우

1. **CSP 에러 확인**
```javascript
// 콘솔에 CSP 에러가 있는지 확인
// 예: "Refused to frame 'https://...' because it violates CSP"
```

**해결:** public/_headers 파일 확인
```
Content-Security-Policy: ... frame-src https://*.portone.io https://*.iamport.kr ...
```

2. **PortOne SDK 로딩 실패**
```javascript
console.log(typeof window.PortOne); // 'undefined'면 실패
```

**해결:** payment.html 하단 스크립트 확인
```html
<script type="module" src="/static/payment.js"></script>
```

### ❌ API 500 에러

1. **구독 생성 실패**
```
POST /api/subscription/create → 500 Internal Server Error
```

**원인:** DB 연결 실패 또는 환경 변수 미설정

**확인:**
```bash
npx wrangler pages deployment tail --project-name albi-app
# 로그에서 에러 메시지 확인
```

2. **결제 검증 실패**
```
POST /api/subscription/confirm → 500 Internal Server Error
```

**원인:** PORTONE_API_SECRET 미설정

**해결:**
```bash
# Cloudflare Pages → Settings → Environment Variables
PORTONE_API_SECRET=PortOne [YOUR_API_SECRET]
```

### ❌ 웹훅 401 Unauthorized

**원인:** 웹훅 서명 검증 실패

**확인:**
```bash
# Cloudflare 환경 변수 확인
npx wrangler pages deployment list --project-name albi-app

# PORTONE_WEBHOOK_SECRET 값 확인
# 예상 값: whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
```

**해결:**
```bash
# PortOne 대시보드에서 웹훅 시크릿 재확인
# Cloudflare 환경 변수와 일치해야 함
```

---

## 📊 성공 기준

### ✅ 최소 성공 조건
- [ ] 카드 결제 성공 (빌링키 발급)
- [ ] payment-callback.html 리디렉션 성공
- [ ] DB에 구독 정보 저장 (status: 'active')
- [ ] 웹훅 수신 (Transaction.Paid)
- [ ] 콘솔 에러 없음

### ✅ 전체 성공 조건
- [ ] 카드 결제 (NHN KCP) ✅
- [ ] 카카오페이 결제 ✅
- [ ] INICIS 결제 ✅
- [ ] 휴대폰 결제 (일회성) ✅
- [ ] 웹훅 5개 이벤트 모두 처리 가능
- [ ] 자동 결제 API 정상 작동

---

## 🚀 다음 단계

### 1. 구독 관리 페이지 완성
```
URL: /subscription-manage.html

기능:
- 구독 상태 표시
- 다음 결제일 표시
- 구독 해지 버튼
- 환불 요청 버튼
- 결제 내역 조회
```

### 2. 자동 갱신 테스트
```bash
# next_payment_date를 오늘로 설정 (테스트)
UPDATE mentor_subscriptions 
SET next_payment_date = DATE('now')
WHERE subscription_id = 'sub_xxx';

# 자동 결제 API 실행
curl -X POST https://albi.kr/api/subscription/auto-billing \
  -H "X-API-Key: auto-billing-secret-key-2026"

# 로그 확인
SELECT * FROM scheduled_payment_logs 
ORDER BY created_at DESC LIMIT 1;
```

### 3. 프로덕션 전환
```
- PortOne 대시보드 → 테스트 모드 → 프로덕션 모드 전환
- 실제 카드로 소액 결제 테스트 (₩100)
- 환불 테스트
- 모니터링 시스템 구축
```

---

**📝 테스트 완료 후 체크리스트를 업데이트하세요!**

