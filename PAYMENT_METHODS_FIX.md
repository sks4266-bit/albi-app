# 결제수단 500 에러 해결 방법

## 문제 분석

### 증상
- **카드 결제**: ✅ 정상 작동
- **카카오페이**: ❌ 500 에러
- **휴대폰 결제**: ❌ 500 에러  
- **INICIS**: ❌ 500 에러

### 원인

#### 1. UNIQUE 제약조건 위반
`mentor_subscriptions` 테이블에 `UNIQUE(user_id, status)` 제약조건이 있음:

```sql
CREATE TABLE mentor_subscriptions (
  ...
  UNIQUE(user_id, status)
);
```

**발생 시나리오**:
1. 사용자가 카드 결제 시도 → `(user_id: 'test_user', status: 'pending')` 레코드 생성 ✅
2. 사용자가 카카오페이 시도 → 동일한 `(user_id: 'test_user', status: 'pending')` 생성 시도 → **UNIQUE 제약 위반** ❌
3. 이후 모든 시도 실패

#### 2. 빌링키 발급 조건 오류
기존 코드:
```javascript
issueBillingKey: selectedPaymentMethod === 'card' || 
                 selectedPaymentMethod === 'kakaopay' || 
                 selectedPaymentMethod === 'inicis'
```

**문제**: 휴대폰 결제(`phone`)가 제외되어 있었으나, PortOne V2는 **휴대폰 결제도 빌링키 발급을 지원**합니다.

## 해결 방법

### 1. 기존 pending 구독 삭제
`functions/api/subscription/create.ts` 수정:

```typescript
// 기존 pending 구독 삭제 (중복 방지)
await db.prepare(`
  DELETE FROM mentor_subscriptions 
  WHERE user_id = ? AND status = 'pending'
`).bind(user_id).run();

// 새 구독 생성
await db.prepare(`
  INSERT INTO mentor_subscriptions (...)
  VALUES (...)
`).bind(...).run();
```

### 2. 모든 결제수단에 빌링키 발급 허용
`public/payment.html` 수정:

```javascript
// Before
issueBillingKey: selectedPaymentMethod === 'card' || 
                 selectedPaymentMethod === 'kakaopay' || 
                 selectedPaymentMethod === 'inicis'

// After  
issueBillingKey: true
```

## 결과

### API 테스트 결과
```bash
# 동일한 사용자로 4번 연속 요청
Attempt 1: ✅ SUCCESS - payment_1772713486331_3ztmpsef
Attempt 2: ✅ SUCCESS - payment_1772713487079_v0u3eapl
Attempt 3: ✅ SUCCESS - payment_1772713487903_fr54umxu
Attempt 4: ✅ SUCCESS - payment_1772713488922_womvn0cf
```

### 지원되는 빌링키 결제수단
PortOne V2에서 빌링키를 발급받을 수 있는 결제수단:
- ✅ **카드** (NHN KCP, INICIS, etc.)
- ✅ **카카오페이** 
- ✅ **휴대폰 결제** (다날)
- ✅ **기타 간편결제**

## 배포 정보
- **Git 커밋**: 
  - `b07d258` (기존 pending 구독 삭제)
  - `4296c2b` (모든 결제수단 빌링키 발급)
- **프로덕션 URL**: https://albi.kr/payment.html
- **최신 배포**: https://d9221af5.albi-app.pages.dev/payment.html

## 테스트 방법

1. **캐시 완전 삭제**:
   - Chrome DevTools (F12) → Application → Clear site data
   - 또는 시크릿 모드 사용

2. **결제 테스트**:
   - https://albi.kr/payment.html 접속
   - Standard 플랜 선택 (₩4,900)
   - 각 결제수단 선택 및 테스트:
     - ✅ 카드 (NHN KCP)
     - ✅ 카카오페이
     - ✅ 휴대폰 (다날)
     - ✅ INICIS

3. **예상 콘솔 출력**:
```
✅ Payment module loaded with PortOne V2 SDK
✅ Payment method selected: kakaopay
✅ Using channel: {name: '카카오페이', ...}
✅ Subscription created: {payment_id: '...', billing_key: '...'}
```

## 주요 개선사항
1. **UNIQUE 제약 회피**: 기존 pending 구독 자동 삭제
2. **빌링키 일관성**: 모든 결제수단에서 빌링키 발급
3. **사용자 경험 개선**: 여러 결제수단 시도 가능
4. **에러 감소**: UNIQUE 제약 위반 에러 제거

작성일: 2026-03-05
상태: ✅ 완료
