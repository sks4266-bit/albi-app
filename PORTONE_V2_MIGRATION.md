# PortOne V2 마이그레이션 완료 ✅

## 📋 변경 요약

### 1. 결제 SDK 변경
**기존 (Iamport V1)**:
```html
<script src="https://cdn.iamport.kr/v1/iamport.js"></script>
<script>
  const IMP = window.IMP;
  IMP.init('imp34551422');
  IMP.request_pay({ ... }, callback);
</script>
```

**현재 (PortOne V2)**:
```html
<script src="https://cdn.portone.io/v2/browser-sdk.js"></script>
<script>
  const response = await PortOne.requestPayment({
    storeId: 'store-1db2baf1-49d6-4b31-afcb-4662f37d7b05',
    paymentId: '...',
    channelKey: '...', // 필수!
    orderName: '...',
    totalAmount: 4900,
    currency: 'KRW',
    issueBillingKey: true
  });
</script>
```

### 2. REST API 변경

#### 인증 방식
**기존 (Iamport V1)**:
```javascript
// 1단계: 토큰 발급
POST https://api.iamport.kr/users/getToken
Body: { imp_key, imp_secret }

// 2단계: 토큰으로 API 호출
GET https://api.iamport.kr/payments/{imp_uid}
Headers: { Authorization: Bearer <access_token> }
```

**현재 (PortOne V2)**:
```javascript
// 토큰 발급 불필요! API Secret 직접 사용
GET https://api.portone.io/payments/{paymentId}
Headers: { Authorization: PortOne <API_SECRET> }
```

#### 결제 검증 API
- **기존**: `GET /payments/{imp_uid}` → 응답: `{ code: 0, response: {...} }`
- **현재**: `GET /payments/{paymentId}` → 응답: `{ paymentId, status: 'PAID', ... }`

#### 빌링키 조회 API
- **기존**: `GET /subscribe/customers/{customer_uid}`
- **현재**: `GET /billing-keys/{billingKey}`

#### 빌링키 결제 API
- **기존**: `POST /subscribe/payments/again`
- **현재**: `POST /billing-keys/{billingKey}/pay`

### 3. 환경 변수 변경

| 항목 | 기존 (Iamport V1) | 현재 (PortOne V2) |
|------|------------------|------------------|
| 식별자 | `IAMPORT_API_KEY` | `PORTONE_STORE_ID` |
| 인증키 | `IAMPORT_API_SECRET` | `PORTONE_API_SECRET` |
| Store ID | `IAMPORT_STORE_ID` | (통합됨) |

### 4. 파일 변경 목록

✅ **수정된 파일**:
- `public/payment.html` - PortOne V2 SDK 적용
- `functions/api/subscription/create.ts` - payment_id, billing_key 생성
- `functions/api/subscription/confirm.ts` - PortOne V2 API 검증
- `functions/api/subscription/auto-billing.ts` - PortOne V2 자동결제
- `.dev.vars` - 환경 변수 업데이트
- `PAYMENT_TEST_GUIDE.md` - 테스트 가이드 업데이트

✅ **Cloudflare Secrets 설정**:
- `PORTONE_STORE_ID` ✅
- `PORTONE_API_SECRET` ✅
- ~~`IAMPORT_API_KEY`~~ (삭제됨)
- ~~`IAMPORT_API_SECRET`~~ (삭제됨)

## ⚠️ 필수 설정 사항

### 1. PortOne 관리자 콘솔 로그인
**URL**: https://console.portone.io/
**Store ID**: `store-1db2baf1-49d6-4b31-afcb-4662f37d7b05`

### 2. 채널 생성 및 키 발급 (필수!)
1. **결제 → 채널 관리** 메뉴 이동
2. **신규 채널 추가** 클릭
3. PG사 선택 (예: NICE 페이먼츠, KG이니시스 등)
4. **정기결제(빌링키)** 옵션 활성화
5. **채널 키 복사**

### 3. payment.html에 채널 키 적용
```javascript
// public/payment.html 596번째 줄
channelKey: 'channel-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // 실제 발급받은 채널 키
```

### 4. 웹훅 URL 설정
**PortOne 콘솔** → **설정 → 웹훅**:
```
https://albi.kr/api/subscription/webhook
```

## 🧪 테스트 체크리스트

- [ ] PortOne 관리자 콘솔 로그인 완료
- [ ] 테스트 채널 생성 및 채널 키 발급
- [ ] payment.html에 실제 채널 키 적용
- [ ] 코드 수정 후 재배포
- [ ] https://albi.kr/payment.html 접속 테스트
- [ ] 플랜 선택 시 결제 폼 표시 확인
- [ ] 결제하기 버튼 클릭 시 PortOne 결제 창 확인
- [ ] 테스트 결제 진행 및 성공 확인
- [ ] 마이페이지에서 구독 정보 확인

## 🚀 배포 정보

- **프로덕션**: https://albi.kr/payment.html
- **미리보기**: https://179583fc.albi-app.pages.dev/payment.html
- **Git 커밋**:
  - `f4931f8` - feat: Migrate from Iamport V1 to PortOne V2 API
  - `470734a` - docs: Update payment test guide for PortOne V2
  - `5513218` - feat: Add channel key validation alert for PortOne setup

## 📚 참고 자료

- **PortOne V2 공식 문서**: https://developers.portone.io/api/rest-v2?v=v2
- **빌링키 결제 가이드**: https://developers.portone.io/docs/ko/auth/guide/billingkey
- **SDK 사용법**: https://developers.portone.io/docs/ko/sdk/javascript-sdk
- **채널 설정**: https://developers.portone.io/docs/ko/console/guide/channel

---

**마이그레이션 완료일**: 2026-03-05
**상태**: ✅ 코드 마이그레이션 완료, ⏳ 채널 키 설정 대기
