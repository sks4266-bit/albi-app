# 🔄 결제 페이지 캐시 클리어 가이드

## ⚠️ 중요: 브라우저 캐시 때문에 이전 버전이 보일 수 있습니다!

### 📱 캐시 클리어 방법

#### 방법 1: 강력 새로고침 (권장)
- **Windows/Linux**: `Ctrl + Shift + R` 또는 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

#### 방법 2: 브라우저 캐시 완전 삭제
1. **Chrome/Edge**:
   - `F12` (개발자 도구 열기)
   - Application 탭 → Storage → Clear site data
   - "Clear site data" 버튼 클릭

2. **Service Worker 삭제**:
   - `F12` → Application → Service Workers
   - "Unregister" 클릭

3. **페이지 새로고침**:
   - `Ctrl + Shift + R`

#### 방법 3: 시크릿 모드
- **Chrome/Edge**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- 시크릿 창에서 https://albi.kr/payment.html 접속

---

## ✅ 캐시 클리어 후 확인사항

### 1. 결제 수단 선택 UI 표시 확인
```
✅ 4개 버튼이 표시되어야 함:
   💳 신용/체크카드
   🏢 KG이니시스
   💬 카카오페이
   📱 휴대폰 결제
```

### 2. JavaScript 콘솔 확인
```javascript
// F12 → Console 탭
✅ PortOne SDK loaded successfully
✅ Payment method selected: card
```

### 3. 오류 없음 확인
```
❌ 이 오류들이 없어야 함:
   - "PortOne SDK not loaded"
   - "Cannot read properties of undefined"
   - Service Worker CORS errors
```

---

## 🧪 테스트 순서

1. **캐시 클리어** (위 방법 중 하나 사용)
2. **페이지 접속**: https://albi.kr/payment.html
3. **F12 → Console** 열어서 오류 확인
4. **Standard 플랜** 선택
5. **결제 수단** 선택 (카드/카카오페이/휴대폰/이니시스)
6. **이름/이메일** 입력
7. **"결제하기"** 버튼 클릭
8. ✅ **PortOne 결제 창이 뜨는지 확인!**

---

## 🔍 문제 해결

### "PortOne SDK not loaded" 오류가 계속 뜨는 경우

1. **CDN 차단 확인**:
   - 회사/학교 네트워크에서 `cdn.portone.io` 차단 여부 확인
   - VPN/프록시 사용 시 해제 후 재시도

2. **스크립트 로딩 확인**:
   - F12 → Network 탭
   - `browser-sdk.js` 파일이 200 OK로 로딩되는지 확인

3. **콘솔에서 직접 확인**:
   ```javascript
   console.log(window.PortOne);
   // undefined이면 SDK가 안 로딩됨
   ```

### Service Worker 오류가 계속 뜨는 경우

1. **Service Worker 완전 삭제**:
   - F12 → Application → Service Workers
   - 모든 Service Worker "Unregister" 클릭

2. **캐시 스토리지 삭제**:
   - F12 → Application → Storage
   - "Clear site data" 클릭

3. **페이지 새로고침**:
   - `Ctrl + Shift + R`

---

**업데이트 날짜**: 2026-03-05  
**배포 버전**: https://7a6e23a7.albi-app.pages.dev
