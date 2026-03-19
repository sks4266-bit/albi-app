# 알비 결제 시스템 테스트 가이드 (PortOne V2)

## 🔧 설정 완료 항목

### 1. PortOne V2 가맹점 정보
- **Store ID**: `store-1db2baf1-49d6-4b31-afcb-4662f37d7b05` ✅ 적용됨
- **API Secret**: `kkadEZAwrT5b63SscSZvd0L1TfYihLUfTN6VwpcVL1DGu4eGCXGODf44UrXEgFkqAzkZlw3lchhLVubE` ✅ 환경변수 설정됨

### 2. 환경 변수 설정
- `.dev.vars` (로컬): ✅ PORTONE_STORE_ID, PORTONE_API_SECRET 설정 완료
- Cloudflare Pages Secrets (프로덕션): ✅ 두 시크릿 설정 완료

### 3. SDK 변경
- **기존**: Iamport V1 SDK (`https://cdn.iamport.kr/v1/iamport.js`)
- **현재**: PortOne V2 SDK (`https://cdn.portone.io/v2/browser-sdk.js`) ✅

## 🧪 테스트 시나리오

### 시나리오 1: 플랜 선택 및 결제 폼 표시
1. https://albi.kr/payment.html 접속
2. 4개 플랜 카드 확인 (Basic, Standard, Premium, Unlimited)
3. **Standard 플랜** "선택하기" 버튼 클릭
4. ✅ 결제 폼이 부드럽게 나타나는지 확인
5. ✅ JavaScript 오류가 없는지 브라우저 콘솔 확인

### 시나리오 2: 결제 정보 입력
1. **이름** 입력: "홍길동"
2. **이메일** 입력: "test@example.com"
3. ✅ 입력 필드가 정상 작동하는지 확인

### 시나리오 3: 결제 요청 (PortOne 창 띄우기)
1. "결제하기 (₩4,900)" 버튼 클릭
2. ✅ **PortOne 결제 창이 뜨는지 확인** (팝업 차단 해제 필요)
3. ✅ 결제 정보가 올바르게 전달되었는지 확인:
   - 상품명: "알비 Standard 플랜 (월간 정기구독)"
   - 금액: ₩4,900
   - 구매자: 입력한 이름/이메일

### 시나리오 4: 테스트 결제 진행

**⚠️ 중요**: PortOne V2 테스트 결제를 위해서는:
1. **PortOne 관리자 콘솔** (https://console.portone.io/) 로그인
2. **채널 설정** → 테스트 채널 생성
3. **채널 키 발급** (payment.html의 `channelKey` 필드에 필요)

**PortOne V2 테스트 카드 정보**:
- 카드번호: 테스트 모드에서 제공하는 카드 사용
- 자세한 정보: https://developers.portone.io/docs/ko/ready/test

### 시나리오 5: 결제 완료 후 확인
1. 테스트 결제 완료
2. ✅ "/mypage.html?subscription=success"로 리다이렉트 확인
3. ✅ 알림창에 "정기구독이 시작되었습니다!" 메시지 확인
4. ✅ 다음 결제일 표시 확인

## 🔍 디버깅 체크리스트

### JavaScript 콘솔 확인사항
```javascript
// 브라우저 콘솔에서 확인
console.log(typeof PortOne); // "object"이어야 함
console.log(window.PortOne); // PortOne 객체가 로드되었는지 확인
```

### 네트워크 탭 확인사항
1. `https://cdn.portone.io/v2/browser-sdk.js` 로딩 성공 ✅
2. `POST /api/subscription/create` - 200 응답, payment_id/billing_key 반환
3. PortOne 결제 API 호출 확인
4. `POST /api/subscription/confirm` - 200 응답, 구독 활성화 확인

## 📊 데이터베이스 확인

### 로컬 테스트 후 확인:
```bash
# 구독 레코드 확인
npx wrangler d1 execute albi-production --local --command="SELECT * FROM mentor_subscriptions WHERE status='active' ORDER BY created_at DESC LIMIT 5"

# 결제 내역 확인
npx wrangler d1 execute albi-production --local --command="SELECT * FROM subscription_payments ORDER BY created_at DESC LIMIT 5"

# 빌링키 확인
npx wrangler d1 execute albi-production --local --command="SELECT user_id, customer_uid, billing_key, card_name, card_number, status FROM billing_keys"
```

## ⚠️ PortOne V2 설정 필수사항

### 1. PortOne 관리자 콘솔 설정
- **URL**: https://console.portone.io/
- **로그인**: Store ID로 로그인
- **설정 필요**:
  1. **채널 생성**: 결제 → 채널 관리 → 신규 채널 추가
  2. **채널 키 발급**: 생성된 채널에서 키 복사
  3. **웹훅 URL 설정**: `https://albi.kr/api/subscription/webhook`
  4. **정기결제(빌링키) 활성화**: 채널 설정에서 활성화

### 2. payment.html 채널 키 업데이트 필요
```javascript
channelKey: 'channel-key-for-billing', // ← 실제 발급받은 채널 키로 교체 필요!
```

### 3. API 인증 방식
PortOne V2는 다음과 같이 인증합니다:
```
Authorization: PortOne <API_SECRET>
```

## 🔄 Iamport V1 → PortOne V2 마이그레이션 내용

### Frontend (payment.html)
- ❌ ~~`IMP.init('imp34551422')`~~
- ✅ `PortOne.requestPayment({ storeId, paymentId, ... })`

### Backend API
- ❌ ~~`https://api.iamport.kr/users/getToken`~~
- ✅ `https://api.portone.io/payments/{paymentId}` (직접 인증)

### 환경 변수
- ❌ ~~IAMPORT_API_KEY, IAMPORT_API_SECRET~~
- ✅ PORTONE_STORE_ID, PORTONE_API_SECRET

## 🚀 다음 단계

1. ✅ **PortOne 관리자 콘솔 로그인** (Store ID 사용)
2. ⏳ **테스트 채널 생성 및 채널 키 발급**
3. ⏳ **payment.html의 channelKey 업데이트**
4. ⏳ **테스트 결제 진행**
5. ⏳ **결제 성공 후 구독 활성화 확인**
6. ⏳ **마이페이지에서 구독 정보 표시 확인**

## 📚 참고 문서
- **PortOne V2 API 문서**: https://developers.portone.io/api/rest-v2?v=v2
- **빌링키 결제**: https://developers.portone.io/docs/ko/auth/guide/billingkey
- **정기결제 가이드**: https://developers.portone.io/docs/ko/auth/guide/subscription

---

**배포 완료**: https://albi.kr/payment.html
**미리보기**: https://cfdffdfc.albi-app.pages.dev/payment.html
