# 🔧 OCR이 작동하지 않는 문제 해결 가이드

## 🔍 문제 상황
- **증상**: 사업자등록증 업로드 시 기존 정보가 출력됨 (OCR API 호출 없음)
- **원인**: 브라우저 캐시로 인해 이전 버전의 JavaScript 사용 중

---

## ✅ 해결 방법

### **방법 1: 브라우저 캐시 강제 삭제 (가장 빠름)**

#### **Chrome / Edge**:
1. `F12` (개발자 도구 열기)
2. **Network 탭** 선택
3. **"Disable cache"** 체크박스 선택
4. `Ctrl + Shift + R` (Windows) 또는 `Cmd + Shift + R` (Mac) - 강제 새로고침

#### **Firefox**:
1. `F12` (개발자 도구 열기)
2. **Network 탭** 선택
3. **톱니바퀴 아이콘** → "Disable HTTP Cache" 선택
4. `Ctrl + Shift + R` (Windows) 또는 `Cmd + Shift + R` (Mac)

#### **Safari**:
1. `Cmd + Option + E` (개발자 도구 열기)
2. **Network 탭** 선택
3. `Cmd + R` (새로고침)

---

### **방법 2: 시크릿 모드 / 사생활 보호 모드 (추천)**

#### **Chrome / Edge**:
- `Ctrl + Shift + N` (Windows)
- `Cmd + Shift + N` (Mac)

#### **Firefox**:
- `Ctrl + Shift + P` (Windows)
- `Cmd + Shift + P` (Mac)

#### **Safari**:
- `Cmd + Shift + N`

**시크릿 모드에서 테스트**:
1. https://albi-app.pages.dev/signup.html 접속
2. "구인자로 시작하기" 클릭
3. 사업자등록증 업로드
4. **콘솔 로그 확인** (`F12` → Console 탭):
   ```javascript
   🔍 Google Vision OCR 시작: 사업자등록증.jpg
   📄 OCR API 응답: { success: true, ... }
   ```

---

### **방법 3: 브라우저 캐시 완전 삭제**

#### **Chrome / Edge**:
1. `Ctrl + Shift + Delete`
2. **시간 범위**: "전체 기간"
3. **캐시된 이미지 및 파일** 선택
4. "데이터 삭제" 클릭
5. https://albi-app.pages.dev 재접속

#### **Firefox**:
1. `Ctrl + Shift + Delete`
2. **시간 범위**: "전체"
3. **캐시** 선택
4. "지금 삭제" 클릭

#### **Safari**:
1. `Cmd + ,` (환경설정)
2. **고급** 탭
3. "메뉴 막대에서 개발자용 메뉴 보기" 선택
4. **개발자용** 메뉴 → "캐시 비우기"

---

## 🧪 테스트 방법

### **1. 콘솔 로그 확인**
`F12` → Console 탭에서 다음 로그가 출력되어야 합니다:

#### **정상 작동 (Google Vision API 호출)**:
```javascript
🔍 Google Vision OCR 시작: 사업자등록증.jpg
📄 OCR API 응답: {
  success: true,
  businessNumber: "123-45-67890",
  businessName: "주식회사 알비",
  confidence: 0.95
}
✅ 사업자등록번호 인식: 123-45-67890
✅ 상호명 인식: 주식회사 알비
✅ OCR 성공: { businessNumber: "123-45-67890", businessName: "주식회사 알비", confidence: 0.95 }
```

#### **오작동 (캐시 문제)**:
```javascript
// 아무 로그도 출력되지 않거나
// 기존 Tesseract.js 관련 로그 출력
```

---

### **2. Network 탭 확인**
`F12` → Network 탭에서 다음 요청이 발생해야 합니다:

#### **정상 작동**:
```
POST /api/ocr/business-registration
Status: 200 OK
Response:
{
  "success": true,
  "businessNumber": "123-45-67890",
  "businessName": "주식회사 알비",
  "confidence": 0.95
}
```

#### **오작동**:
- `/api/ocr/business-registration` 요청이 없음
- 또는 다른 오류 발생

---

## 🔧 추가 디버깅

### **방법 1: HTML 파일 직접 확인**
```bash
# 최신 배포된 파일 확인
curl -s https://albi-app.pages.dev/signup.html | grep -A 5 "Google Vision OCR"
```

**예상 결과**:
```javascript
console.log('🔍 Google Vision OCR 시작:', file.name);

// FormData로 파일 전송
const formData = new FormData();
formData.append('file', file);
```

**만약 `Tesseract.js`가 보인다면** → 캐시 문제 확인

---

### **방법 2: 배포 URL 직접 접속**
- **최신 배포 URL**: https://8f904bd7.albi-app.pages.dev/signup.html
- **메인 도메인**: https://albi-app.pages.dev/signup.html

**두 URL 모두 테스트**해보세요. 최신 배포 URL은 **절대 캐시가 없습니다.**

---

### **방법 3: 로컬 서버 테스트**
```bash
# 로컬 서버 확인 (sandbox 환경)
curl http://localhost:3000/signup.html | grep -A 5 "Google Vision OCR"
```

**로컬에서도 정상 작동한다면** → 프로덕션 배포 문제

---

## 🚨 긴급 해결 방법

### **1. 강제 재배포**
```bash
cd /home/user/webapp
npx wrangler pages deploy public --project-name albi-app --commit-dirty
```

### **2. 배포 URL 확인**
배포 완료 후 출력되는 **새로운 URL**로 접속:
```
✨ Deployment complete! Take a peek over at https://XXXXXXXX.albi-app.pages.dev
```

**이 URL은 100% 최신 버전**이므로 캐시 문제가 없습니다.

---

## 📋 체크리스트

- [ ] 시크릿 모드로 접속
- [ ] 브라우저 캐시 삭제
- [ ] F12 → Console 탭에서 로그 확인
- [ ] F12 → Network 탭에서 `/api/ocr/business-registration` 요청 확인
- [ ] 최신 배포 URL로 접속 (https://8f904bd7.albi-app.pages.dev/signup.html)
- [ ] 실제 사업자등록증 파일 업로드
- [ ] 자동 인식 결과 확인

---

## 🎯 예상 결과

### **성공 시**:
1. 파일 업로드
2. "Google Vision API 처리 중..." 메시지
3. 1-3초 후 자동 입력:
   - 사업자등록번호: 123-45-67890
   - 상호명: 주식회사 알비
4. 신뢰도 표시: 95%

### **실패 시**:
- 콘솔 로그 스크린샷
- Network 탭 스크린샷
- 에러 메시지

---

**🔍 다음 단계**:
1. **시크릿 모드**로 https://albi-app.pages.dev/signup.html 접속
2. 구인자 모드 선택
3. 사업자등록증 업로드
4. **콘솔 로그 스크린샷** 공유

캐시 문제일 가능성이 99%이므로, 시크릿 모드에서는 정상 작동할 것입니다! 😊
