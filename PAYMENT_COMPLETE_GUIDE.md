# 알비 결제 시스템 완전 가이드 (PortOne V2) 🚀

## ✅ 설정 완료 항목

### 1. PortOne V2 가맹점 정보
- **Store ID**: `store-1db2baf1-49d6-4b31-afcb-4662f37d7b05` ✅
- **API Secret**: `kkadEZAwrT5b63SscSZvd0L1TfYihLUfTN6VwpcVL1DGu4eGCXGODf44UrXEgFkqAzkZlw3lchhLVubE` ✅

### 2. 결제 채널 설정 (4개 모두 적용 완료!)

| 결제 수단 | PG사 | PG Provider | 채널 키 | 상태 |
|----------|------|-------------|---------|------|
| 💳 신용/체크카드 | NHN KCP | `kcp_v2` | `channel-key-f8f466e2-764d-40d4-b003-f85733fdc50a` | ✅ |
| 🏢 KG이니시스 | KG이니시스 | `inicis_v2` | `channel-key-e6161fd4-04fe-4de4-8073-c2f74961ec46` | ✅ |
| 💬 카카오페이 | 카카오페이 | `kakaopay` | `channel-key-2fd86a82-009e-43dd-b9ba-3c37f5f85374` | ✅ |
| 📱 휴대폰 결제 | 다날 | `danal` | `channel-key-0b99f096-a083-492c-933d-c34bbbfac4fb` | ✅ |

### 3. 환경 변수 설정
- ✅ `.dev.vars` (로컬): PORTONE_STORE_ID, PORTONE_API_SECRET
- ✅ Cloudflare Pages Secrets (프로덕션): 두 시크릿 설정 완료

### 4. 빌링키 지원
- ✅ **신용/체크카드**: 정기결제 지원
- ✅ **카카오페이**: 정기결제 지원
- ✅ **KG이니시스**: 정기결제 지원
- ⚠️ **휴대폰 결제**: 정기결제 미지원 (일회성 결제만 가능)

---

## 🧪 테스트 시나리오

### 시나리오 1: 플랜 선택 및 결제 폼 표시 ✅
1. **https://albi.kr/payment.html** 접속
2. 4개 플랜 카드 확인 (Basic ₩2,900 / Standard ₩4,900 / Premium ₩9,900 / Unlimited ₩19,900)
3. **Standard 플랜** "선택하기" 버튼 클릭
4. ✅ 결제 폼이 스크롤 애니메이션과 함께 표시됨
5. ✅ 플랜 정보 확인: "₩4,900/월, 월 200회 대화 가능"

### 시나리오 2: 결제 수단 선택 ✅
1. 결제 폼에서 **4가지 결제 수단** 확인:
   - 💳 **신용/체크카드** (기본 선택됨)
   - 🏢 **KG이니시스**
   - 💬 **카카오페이**
   - 📱 **휴대폰 결제**
2. 각 버튼 클릭 시 선택 상태 변경 확인 (파란색 테두리 + 배경)

### 시나리오 3: 결제 정보 입력 ✅
1. **이름** 입력: "홍길동"
2. **이메일** 입력: "test@example.com"
3. **결제 수단** 선택: 원하는 방식 클릭

### 시나리오 4: 결제 요청 (PortOne 창 띄우기) ✅
1. "결제하기 (₩4,900)" 버튼 클릭
2. ✅ **PortOne 결제 창이 정상적으로 뜹니다!**
3. ✅ 선택한 결제 수단에 맞는 PG사 화면 표시:
   - **카드**: NHN KCP 결제 화면
   - **카카오페이**: 카카오페이 QR/앱 연동 화면
   - **휴대폰**: 다날 휴대폰 인증 화면
   - **이니시스**: KG이니시스 결제 화면

### 시나리오 5: 테스트 결제 진행 🧪

#### 카드 결제 테스트 (NHN KCP)
```
카드번호: 9410-1234-5678-1234 (테스트 카드)
유효기간: 12/30
CVC: 123
비밀번호: 12
```

#### 카카오페이 테스트
- 카카오페이 테스트 계정 필요
- QR 코드 스캔 또는 앱 연동

#### 휴대폰 결제 테스트
- 테스트 전화번호: 010-0000-0000
- 인증번호: 000000

### 시나리오 6: 결제 완료 후 확인 ✅
1. 테스트 결제 완료
2. ✅ 알림창: "✅ 정기구독이 시작되었습니다! 다음 결제일: 2026-04-04"
3. ✅ 자동 리다이렉트: `/mypage.html?subscription=success`
4. ✅ 마이페이지에서 구독 정보 확인

---

## 🔍 브라우저 디버깅

### JavaScript 콘솔 확인
```javascript
// 페이지 로드 후 콘솔에서 확인
console.log(typeof PortOne); // "object"
console.log(PortOne); // PortOne SDK 객체
console.log(CHANNELS); // 4개 채널 정보
console.log(selectedPaymentMethod); // 선택된 결제 수단
```

### 네트워크 탭 확인
1. ✅ `https://cdn.portone.io/v2/browser-sdk.js` 로딩 성공
2. ✅ `POST /api/subscription/create` → 200 OK, payment_id/billing_key 반환
3. ✅ PortOne 결제 API 호출 성공
4. ✅ `POST /api/subscription/confirm` → 200 OK, 구독 활성화

---

## 📊 데이터베이스 확인

### 로컬 테스트 후 확인:
```bash
# 구독 레코드 확인
npx wrangler d1 execute albi-production --local --command="SELECT subscription_id, user_id, plan, price, status, next_payment_date FROM mentor_subscriptions WHERE status='active' ORDER BY created_at DESC LIMIT 5"

# 결제 내역 확인
npx wrangler d1 execute albi-production --local --command="SELECT merchant_uid, user_id, amount, plan_type, status, pg_provider, card_name FROM subscription_payments ORDER BY created_at DESC LIMIT 5"

# 빌링키 확인
npx wrangler d1 execute albi-production --local --command="SELECT user_id, customer_uid, card_name, card_number, status FROM billing_keys WHERE status='active'"
```

---

## 🎯 결제 흐름 (Flow)

### 1. 사용자 액션
```
플랜 선택 → 이름/이메일 입력 → 결제 수단 선택 → "결제하기" 클릭
```

### 2. 프론트엔드 (payment.html)
```javascript
1. selectPlan('standard') - 플랜 선택, 결제 폼 표시
2. selectPaymentMethod('card') - 결제 수단 선택
3. requestPayment() 호출:
   - POST /api/subscription/create → payment_id, billing_key 생성
   - PortOne.requestPayment() → 결제 창 띄움
   - 결제 성공 시 confirmSubscription() 호출
```

### 3. 백엔드 API
```
POST /api/subscription/create
→ D1에 구독 레코드 생성 (pending)
→ payment_id, billing_key 반환

PortOne 결제 진행 (사용자가 PG사에서 결제)

POST /api/subscription/confirm
→ GET https://api.portone.io/payments/{paymentId} (검증)
→ 빌링키 저장 (billing_keys 테이블)
→ 구독 활성화 (mentor_subscriptions → active)
→ 결제 내역 저장 (subscription_payments)
→ 리다이렉트: /mypage.html?subscription=success
```

---

## 🔐 보안 체크리스트

- ✅ API Secret은 환경 변수로 관리 (코드에 하드코딩 안 됨)
- ✅ 결제 금액 검증 (서버에서 PortOne API로 재확인)
- ✅ 사용자 인증 (user_id 기반)
- ✅ HTTPS 통신 (Cloudflare Pages 자동 적용)
- ✅ 웹훅 URL 설정 (결제 상태 변경 알림)

---

## 📱 결제 수단별 특징

### 💳 신용/체크카드 (NHN KCP)
- **특징**: 가장 범용적, 모든 카드사 지원
- **정기결제**: ✅ 지원 (빌링키 발급)
- **수수료**: 약 3.3%
- **장점**: 안정적, 빠른 승인

### 🏢 KG이니시스
- **특징**: 국내 주요 PG사, 다양한 결제 수단
- **정기결제**: ✅ 지원 (빌링키 발급)
- **수수료**: 약 3.3%
- **장점**: 안정성 높음

### 💬 카카오페이
- **특징**: 간편결제, 모바일 최적화
- **정기결제**: ✅ 지원 (빌링키 발급)
- **수수료**: 약 3.0%
- **장점**: 빠른 결제, 모바일 친화적

### 📱 휴대폰 결제 (다날)
- **특징**: 통신사 결제, 카드 없이 가능
- **정기결제**: ❌ 미지원 (일회성만)
- **수수료**: 약 10% (높음!)
- **제한**: 월 30만원 한도, 정기결제 불가

---

## 🚀 배포 정보

- **프로덕션**: https://albi.kr/payment.html
- **미리보기**: https://5961d549.albi-app.pages.dev/payment.html
- **Git 커밋**: `672ebec` - feat: Add payment method selection UI with 4 channels

---

## 🎉 완료된 기능

### ✅ 결제 페이지
- [x] 4가지 플랜 카드 표시 (Basic/Standard/Premium/Unlimited)
- [x] 플랜 선택 시 결제 폼 표시
- [x] 4가지 결제 수단 선택 UI (카드/이니시스/카카오페이/휴대폰)
- [x] 이름/이메일 입력 폼
- [x] 결제하기 버튼 (PortOne V2 연동)
- [x] 정기결제 안내 문구
- [x] 환불 규정 상세 안내
- [x] FAQ 섹션

### ✅ 결제 API
- [x] `/api/subscription/create` - 구독 생성, payment_id/billing_key 발급
- [x] `/api/subscription/confirm` - 결제 검증 및 구독 활성화
- [x] `/api/subscription/auto-billing` - 자동 정기결제 (30일마다)
- [x] `/api/subscription/status` - 구독 상태 조회
- [x] `/api/subscription/cancel` - 구독 해지
- [x] `/api/subscription/payments` - 결제 내역 조회

### ✅ 환경 설정
- [x] PortOne V2 SDK 적용
- [x] 실제 Store ID 및 API Secret 설정
- [x] 4개 채널 모두 실제 키 적용
- [x] Cloudflare Pages Secrets 설정

---

## 🧪 즉시 테스트 가능!

### 1️⃣ 결제 페이지 접속
```
https://albi.kr/payment.html
```

### 2️⃣ 플랜 선택
- Basic (₩2,900), Standard (₩4,900), Premium (₩9,900), Unlimited (₩19,900) 중 선택

### 3️⃣ 정보 입력 & 결제 수단 선택
- 이름: "홍길동"
- 이메일: "test@example.com"
- 결제 수단: 💳 카드 / 💬 카카오페이 / 📱 휴대폰 / 🏢 이니시스

### 4️⃣ 결제 진행
- "결제하기" 버튼 클릭
- ✅ **PortOne 결제 창이 바로 뜹니다!**
- 선택한 PG사 화면에서 결제 진행

### 5️⃣ 결제 완료 확인
- 알림창: "✅ 정기구독이 시작되었습니다!"
- 자동 이동: 마이페이지 → 구독 정보 확인

---

## 💡 테스트 팁

### PortOne 테스트 모드 설정
1. **PortOne 관리자 콘솔**: https://console.portone.io/
2. **로그인**: Store ID 입력
3. **설정 → 개발자 도구 → 테스트 모드** 활성화
4. 테스트 카드/계정으로 실제 결제 없이 테스트 가능

### 브라우저 콘솔 모니터링
```javascript
// 결제 진행 중 콘솔 메시지 확인
✅ Subscription created: { payment_id, billing_key, ... }
✅ Using channel: { name: 'NHN KCP', key: '...' }
✅ Payment completed: { paymentId, status: 'PAID' }
✅ Subscription activated
```

---

## 📚 참고 자료

- **PortOne V2 공식 문서**: https://developers.portone.io/api/rest-v2?v=v2
- **빌링키 가이드**: https://developers.portone.io/docs/ko/auth/guide/billingkey
- **SDK 사용법**: https://developers.portone.io/docs/ko/sdk/javascript-sdk
- **테스트 결제**: https://developers.portone.io/docs/ko/ready/test

---

## 🎊 마이그레이션 완료 요약

### 변경 사항
- ❌ ~~Iamport V1~~ → ✅ **PortOne V2**
- ❌ ~~단일 PG사~~ → ✅ **4개 PG사 선택 가능**
- ❌ ~~토큰 기반 인증~~ → ✅ **API Secret 직접 인증**
- ❌ ~~콜백 방식~~ → ✅ **async/await 방식**

### Git 커밋 히스토리
- `f4931f8` - feat: Migrate from Iamport V1 to PortOne V2 API
- `5513218` - feat: Add channel key validation alert
- `672ebec` - feat: Add payment method selection UI with 4 channels

---

**배포 완료일**: 2026-03-05  
**상태**: ✅ **완전 가동 - 즉시 결제 테스트 가능!**  
**프로덕션 URL**: https://albi.kr/payment.html

🎉 **이제 실제 결제 창이 뜹니다! 바로 테스트해보세요!** 🎉
