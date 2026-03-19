# 🎯 최종 테스트 가이드 - 모든 결제수단 작동 확인

## ✅ 수정 완료 사항 (2026-03-05 12:24 UTC)

### 1. API 500 에러 해결
- **문제**: 동일 사용자가 여러 결제수단 시도 시 UNIQUE 제약 위반
- **해결**: 기존 pending 구독 자동 삭제
- **테스트**: 4번 연속 요청 모두 성공 ✅

### 2. 빌링키 발급 활성화
- **Before**: 카드/카카오페이/INICIS만 `issueBillingKey: true`
- **After**: **모든 결제수단** `issueBillingKey: true`
- **근거**: PortOne V2는 휴대폰 결제도 빌링키 발급 지원

### 3. CSP 헤더 완전 구성
- 모든 PortOne/Iamport 도메인 화이트리스트 추가
- `script-src`, `connect-src`, `frame-src`, `child-src` 모두 설정

## 🧪 테스트 절차

### ⚠️ 필수 사전 작업: 캐시 완전 삭제

**방법 1: Chrome DevTools (권장)**
```
1. F12 키 (DevTools 열기)
2. Application 탭 클릭
3. 왼쪽 "Storage" → "Clear site data" 클릭
4. 모든 항목 체크 (쿠키, 캐시, IndexedDB, 등)
5. "Clear site data" 버튼 클릭
6. Service Workers 탭 → "Unregister" 클릭
7. 브라우저 완전 재시작
```

**방법 2: 시크릿 모드 (간편)**
```
1. Ctrl+Shift+N (Chrome 시크릿 모드)
2. https://albi.kr/payment.html 접속
3. Ctrl+Shift+R (강력 새로고침)
```

### 1️⃣ 카드 결제 테스트 (NHN KCP)
```
1. Standard 플랜 선택 (₩4,900/월)
2. 결제수단: "카드" 선택
3. 이름/이메일 확인 (자동 입력됨)
4. "결제하기" 버튼 클릭
```

**예상 동작**:
- ✅ 콘솔: `✅ Payment method selected: card`
- ✅ 콘솔: `✅ Subscription created: {payment_id: '...'}`
- ✅ **PortOne 결제창 팝업** (NHN KCP)
- ✅ 테스트 카드번호 입력 가능

### 2️⃣ 카카오페이 테스트
```
1. 페이지 새로고침 (F5)
2. Standard 플랜 선택
3. 결제수단: "카카오페이" 선택
4. "결제하기" 버튼 클릭
```

**예상 동작**:
- ✅ 콘솔: `✅ Payment method selected: kakaopay`
- ✅ 콘솔: `✅ Subscription created: {payment_id: '...'}`
- ✅ **카카오페이 결제창 팝업**
- ❌ **500 에러 없음**

### 3️⃣ 휴대폰 결제 테스트 (다날)
```
1. 페이지 새로고침
2. Standard 플랜 선택
3. 결제수단: "휴대폰" 선택
4. "결제하기" 버튼 클릭
```

**예상 동작**:
- ✅ 콘솔: `✅ Payment method selected: phone`
- ✅ 콘솔: `✅ Subscription created: {payment_id: '...'}`
- ✅ **다날 휴대폰 인증창 팝업**
- ❌ **500 에러 없음**

### 4️⃣ INICIS 테스트 (KG이니시스)
```
1. 페이지 새로고침
2. Standard 플랜 선택
3. 결제수단: "INICIS" 선택
4. "결제하기" 버튼 클릭
```

**예상 동작**:
- ✅ 콘솔: `✅ Payment method selected: inicis`
- ✅ 콘솔: `✅ Subscription created: {payment_id: '...'}`
- ✅ **INICIS 결제창 팝업**
- ❌ **500 에러 없음**

### 5️⃣ 연속 시도 테스트 (중요!)
```
1. 카드 선택 → 결제하기 → 취소 (X 버튼)
2. 즉시 카카오페이 선택 → 결제하기 → 취소
3. 즉시 휴대폰 선택 → 결제하기 → 취소
4. 즉시 INICIS 선택 → 결제하기 → 정상 진행
```

**예상 결과**: 
- ✅ 4번 모두 결제창 팝업 성공
- ❌ **2~4번째 시도에서 500 에러 없음**
- ✅ API 매번 성공 응답

## 🐛 예상 가능한 문제

### 1. 캐시 문제
**증상**: 여전히 500 에러 발생
**해결**: 
- 브라우저 캐시 완전 삭제
- 시크릿 모드 사용
- 다른 브라우저로 테스트

### 2. Service Worker 이슈
**증상**: `Cache.addAll` 에러
**해결**: 
- F12 → Application → Service Workers → Unregister
- 페이지 새로고침

### 3. PortOne SDK 로드 실패
**증상**: `window.PortOne = undefined`
**해결**: 
- 이미 수정됨 (NPM 번들 사용)
- 최신 배포 버전 확인: https://d9221af5.albi-app.pages.dev/

## 📊 실제 테스트 결과

### API 레벨 테스트 (curl)
```bash
=== Testing card ===
✅ true - payment_1772713486331_3ztmpsef

=== Testing kakaopay ===
✅ true - payment_1772713487079_v0u3eapl

=== Testing phone ===
✅ true - payment_1772713487903_fr54umxu

=== Testing inicis ===
✅ true - payment_1772713488922_womvn0cf
```

**결과**: 모든 결제수단 API 정상 ✅

## 🔗 URL 정보
- **프로덕션**: https://albi.kr/payment.html
- **최신 배포**: https://d9221af5.albi-app.pages.dev/payment.html
- **테스트 페이지**: https://albi.kr/test-portone.html

## 📝 Git 커밋 히스토리
```
a7055c3 - docs: Update README with payment methods fix details
4296c2b - fix: Enable billing key for all payment methods
b07d258 - fix: Delete existing pending subscriptions before creating new ones
2cf7273 - fix: Add comprehensive PortOne/Iamport domains to CSP
```

## ✨ 핵심 개선 사항
1. **UNIQUE 제약 회피**: 기존 pending 구독 삭제 → 여러 번 시도 가능
2. **빌링키 일관성**: 모든 결제수단 빌링키 발급 가능
3. **CSP 완전 구성**: 모든 PortOne/Iamport 도메인 허용
4. **SDK 안정성**: NPM 패키지 번들링으로 로딩 안정성 확보

## ✅ 완료 체크리스트
- [x] API 500 에러 해결
- [x] 모든 결제수단 빌링키 활성화
- [x] CSP 헤더 완전 구성
- [x] D1 마이그레이션 프로덕션 적용
- [x] API 테스트 (4개 결제수단 모두 성공)
- [x] 배포 완료
- [ ] 실제 브라우저 테스트 (사용자 확인 필요)

---

**작성일**: 2026-03-05 12:25 UTC  
**상태**: ✅ 수정 완료 - 사용자 테스트 대기 중

**다음 단계**: 시크릿 모드에서 https://albi.kr/payment.html 접속 → 4가지 결제수단 모두 테스트
