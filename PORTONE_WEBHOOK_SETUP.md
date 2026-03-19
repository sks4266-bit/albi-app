# 🔔 PortOne V2 웹훅 설정 가이드

## 📌 개요

이 문서는 PortOne V2 웹훅을 Cloudflare Pages 프로젝트에 연동하는 방법을 설명합니다.

---

## 🔐 웹훅 정보

### **엔드포인트 URL**
```
https://albi.kr/api/subscription/webhook
```

### **웹훅 시크릿**
```
whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
```

### **서명 알고리즘**
```
HMAC-SHA256
```

---

## 🚀 PortOne 대시보드 설정

### **Step 1: PortOne 관리자 대시보드 로그인**

```
URL: https://admin.portone.io/
계정: [Your PortOne Account]
```

### **Step 2: 웹훅 메뉴 이동**

```
좌측 메뉴 → "결제연동" → "웹훅"
```

### **Step 3: 웹훅 URL 추가**

1. **"웹훅 추가" 버튼 클릭**

2. **웹훅 URL 입력**
```
https://albi.kr/api/subscription/webhook
```

3. **웹훅 시크릿 입력**
```
whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
```

4. **설명 (선택)**
```
Albi 정기결제 시스템 웹훅
```

### **Step 4: 이벤트 선택**

**필수 이벤트 5개를 선택하세요:**

- ☑️ **Transaction.Paid**
  - 결제 성공 시 발생
  - 용도: 구독 활성화, 결제 내역 저장

- ☑️ **Transaction.Failed**
  - 결제 실패 시 발생
  - 용도: 실패 사유 기록, 사용자 알림

- ☑️ **Transaction.Cancelled**
  - 결제 취소 시 발생
  - 용도: 환불 처리, 구독 상태 업데이트

- ☑️ **BillingKey.Issued**
  - 빌링키 발급 시 발생
  - 용도: 빌링키 정보 저장 (카드 정보, 만료일)

- ☑️ **BillingKey.Deleted**
  - 빌링키 삭제 시 발생
  - 용도: 빌링키 상태 업데이트 (revoked)

### **Step 5: 모드 선택**

**개발 중:**
- ☑️ **테스트 모드** (현재)
- ☐ 프로덕션 모드

**프로덕션 배포 후:**
- ☐ 테스트 모드
- ☑️ **프로덕션 모드** (실제 결제)

### **Step 6: 저장**

"저장" 버튼 클릭

---

## 🧪 웹훅 테스트

### **방법 1: PortOne 대시보드에서 테스트**

```
1. PortOne 대시보드 → 웹훅 → [방금 추가한 웹훅] 클릭

2. "테스트 전송" 버튼 클릭

3. 이벤트 선택: Transaction.Paid

4. "전송" 버튼 클릭

5. 응답 확인:
   ✅ 200 OK
   {
     "success": true,
     "message": "Webhook processed",
     "type": "Transaction.Paid"
   }
```

### **방법 2: curl 명령어로 테스트**

```bash
# 웹훅 페이로드 생성 (서명 없이 - 실패해야 정상)
curl -X POST https://albi.kr/api/subscription/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Transaction.Paid",
    "timestamp": "2026-03-05T14:00:00Z",
    "data": {
      "transactionId": "test_transaction_123",
      "paymentId": "payment_test_123",
      "status": "PAID",
      "amount": {
        "total": 4900,
        "currency": "KRW"
      }
    }
  }'

# 예상 응답: 401 Unauthorized (서명 없음)
```

### **방법 3: 실제 결제로 테스트**

```
1. https://albi.kr/payment.html 접속

2. Standard 플랜 선택 (₩4,900)

3. 카드 결제 선택 (NHN KCP)

4. 결제 진행

5. 결제 완료 후 1-2초 대기

6. 웹훅 자동 수신 확인:
   npx wrangler pages deployment tail --project-name albi-app
```

---

## 📊 웹훅 처리 로직

### **Transaction.Paid (결제 성공)**

```typescript
// 1. subscription_payments 테이블 업데이트
UPDATE subscription_payments 
SET 
  status = 'completed',
  paid_at = datetime('now'),
  pg_response = [webhook_data]
WHERE payment_id = [paymentId];

// 2. mentor_subscriptions 테이블 업데이트
UPDATE mentor_subscriptions 
SET 
  status = 'active',
  next_payment_date = date('now', '+1 month')
WHERE subscription_id = [subscriptionId];

// 3. 사용자 알림 (선택)
// - 이메일 발송
// - SMS 발송
```

### **Transaction.Failed (결제 실패)**

```typescript
// 1. subscription_payments 테이블 업데이트
UPDATE subscription_payments 
SET 
  status = 'failed',
  failed_at = datetime('now'),
  fail_reason = [webhook_data.failReason]
WHERE payment_id = [paymentId];

// 2. scheduled_payment_logs 기록
INSERT INTO scheduled_payment_logs (
  subscription_id,
  execution_status,
  error_message
) VALUES (
  [subscriptionId],
  'failed',
  [webhook_data.failReason]
);

// 3. 재시도 로직 (3회까지)
// - 1일 후 재시도
// - 2일 후 재시도
// - 3일 후 재시도
// - 3회 실패 시 구독 자동 해지
```

### **Transaction.Cancelled (결제 취소)**

```typescript
// 1. subscription_payments 테이블 업데이트
UPDATE subscription_payments 
SET 
  status = 'cancelled',
  refunded_at = datetime('now')
WHERE payment_id = [paymentId];

// 2. refund_requests 테이블 생성
INSERT INTO refund_requests (
  subscription_id,
  payment_id,
  refund_amount,
  status
) VALUES (
  [subscriptionId],
  [paymentId],
  [amount],
  'completed'
);

// 3. mentor_subscriptions 상태 업데이트
UPDATE mentor_subscriptions 
SET status = 'cancelled'
WHERE subscription_id = [subscriptionId];
```

### **BillingKey.Issued (빌링키 발급)**

```typescript
// billing_keys 테이블에 저장
INSERT INTO billing_keys (
  user_id,
  customer_uid,
  billing_key,
  card_name,
  card_number,
  status
) VALUES (
  [userId],
  [customerUid],
  [billingKey],
  [cardName],
  [maskedCardNumber],
  'active'
);
```

### **BillingKey.Deleted (빌링키 삭제)**

```typescript
// billing_keys 상태 업데이트
UPDATE billing_keys 
SET 
  status = 'revoked',
  updated_at = datetime('now')
WHERE billing_key = [billingKey];
```

---

## 🔒 보안 검증

### **서명 검증 과정**

```typescript
// 1. 웹훅 요청 헤더에서 서명 추출
const receivedSignature = request.headers.get('webhook-signature');

// 2. 요청 본문으로 서명 생성
const body = await request.text();
const encoder = new TextEncoder();
const keyData = encoder.encode(PORTONE_WEBHOOK_SECRET);

// 3. HMAC-SHA256 서명 계산
const key = await crypto.subtle.importKey(
  'raw',
  keyData,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
);

const signature = await crypto.subtle.sign(
  'HMAC',
  key,
  encoder.encode(body)
);

// 4. Base64 인코딩
const expectedSignature = btoa(
  String.fromCharCode(...new Uint8Array(signature))
);

// 5. 서명 비교
if (receivedSignature !== expectedSignature) {
  return new Response('Unauthorized', { status: 401 });
}
```

### **보안 체크리스트**

- ✅ 웹훅 시크릿 환경 변수로 관리 (PORTONE_WEBHOOK_SECRET)
- ✅ HMAC-SHA256 서명 검증
- ✅ HTTPS 프로토콜 사용
- ✅ 401 Unauthorized 응답 (서명 불일치 시)
- ✅ 중복 이벤트 처리 방지 (transactionId 체크)

---

## 🐛 트러블슈팅

### **문제 1: 401 Unauthorized**

**증상:**
```
POST /api/subscription/webhook → 401 Unauthorized
```

**원인:**
- 웹훅 서명 검증 실패
- 웹훅 시크릿 불일치

**해결:**
```bash
# 1. Cloudflare 환경 변수 확인
# Cloudflare Pages → albi-app → Settings → Environment Variables
# PORTONE_WEBHOOK_SECRET 값 확인

# 2. PortOne 대시보드에서 웹훅 시크릿 확인
# 두 값이 정확히 일치해야 함

# 3. 값이 다르면 Cloudflare 환경 변수 업데이트
# 저장 후 자동 재배포 (1-2분 소요)
```

### **문제 2: 웹훅 수신 안 됨**

**증상:**
```
결제 완료했지만 웹훅 로그가 없음
```

**원인:**
- PortOne 대시보드에서 웹훅 URL 미등록
- 웹훅 이벤트 선택 안 함

**해결:**
```
1. PortOne 대시보드 → 웹훅 → URL 등록 확인
2. 이벤트 5개 모두 선택되었는지 확인
3. "테스트 전송" 버튼으로 확인
```

### **문제 3: 500 Internal Server Error**

**증상:**
```
POST /api/subscription/webhook → 500 Internal Server Error
```

**원인:**
- D1 데이터베이스 연결 실패
- 환경 변수 미설정

**해결:**
```bash
# 로그 확인
npx wrangler pages deployment tail --project-name albi-app

# 에러 메시지 확인 후 수정
```

---

## 📝 체크리스트

### ✅ 설정 완료 체크리스트

- [ ] PortOne 대시보드 웹훅 URL 등록
- [ ] 웹훅 시크릿 입력
- [ ] 이벤트 5개 선택
- [ ] Cloudflare 환경 변수 설정 (PORTONE_WEBHOOK_SECRET)
- [ ] 테스트 전송 성공 (200 OK)
- [ ] 실제 결제로 웹훅 수신 확인

### ✅ 모니터링 체크리스트

- [ ] 웹훅 로그 확인 (npx wrangler pages deployment tail)
- [ ] DB 데이터 확인 (subscription_payments)
- [ ] 에러 알림 설정 (선택)

---

## 📞 참고 자료

- **PortOne 웹훅 가이드**: https://developers.portone.io/opi/ko/integration/start/v2/webhook
- **PortOne API 문서**: https://developers.portone.io/api/rest-v2
- **Cloudflare Pages 환경 변수**: https://developers.cloudflare.com/pages/platform/functions/bindings/#environment-variables

---

**✅ 설정 완료 후 E2E_TEST_GUIDE.md를 참고하여 전체 결제 흐름을 테스트하세요!**

