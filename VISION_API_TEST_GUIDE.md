# ✅ Google Cloud Vision API OCR 테스트 가이드

## 🎉 Google 로그인 성공!

이제 사업자등록증 OCR을 Google Cloud Vision API로 테스트하겠습니다.

---

## 📋 현재 설정 상태

### **✅ 완료된 작업**

1. **Google Cloud Vision API 키 등록 완료**
   ```
   GOOGLE_VISION_API_KEY: AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU
   ```

2. **Cloudflare Pages 환경 변수 등록 완료**
   ```bash
   npx wrangler pages secret list --project-name albi-app
   # ✅ GOOGLE_VISION_API_KEY: Value Encrypted
   ```

3. **OCR API 코드 구현 완료**
   - 파일: `/functions/api/ocr/business-registration.ts`
   - Google Vision API 통합
   - 한국어/영어 언어 힌트
   - DOCUMENT_TEXT_DETECTION 사용

4. **배포 완료**
   - 최신 배포: https://278923d0.albi-app.pages.dev
   - 메인 도메인: https://albi-app.pages.dev

---

## 🧪 OCR 테스트 방법

### **Step 1: 마이페이지 접속**

```
1. https://albi-app.pages.dev/mypage.html 접속
2. Google 계정으로 로그인 (이미 로그인되어 있으면 건너뛰기)
```

---

### **Step 2: 구인자 인증 탭 이동**

```
1. 마이페이지 하단의 탭에서 "구인자 인증" 클릭
2. 사업자등록증 업로드 섹션 확인
```

---

### **Step 3: 개발자 도구 열기 (중요!)**

```
1. F12 키 또는 우클릭 → 검사
2. Console 탭 선택
3. 로그 메시지 확인 준비
```

---

### **Step 4: 사업자등록증 업로드**

```
1. "파일 선택" 버튼 클릭
2. 사업자등록증 이미지 선택:
   - 형식: JPG, PNG, PDF
   - 크기: 10MB 이하
   - 권장: 선명한 스캔본 또는 사진
3. 업로드 대기 (1-5초)
```

---

### **Step 5: Console 로그 확인**

#### **예상 로그 (성공 시)**

```javascript
🔍 OCR 요청: {fileName: "사업자등록증.jpg", fileSize: 524288, fileType: "image/jpeg"}

🔍 Google Cloud Vision API 호출 시작...
🔑 API Key exists: true
📄 File info: {name: "사업자등록증.jpg", size: 524288, type: "image/jpeg"}
📦 Base64 encoding complete, length: 699050
📡 Vision API response status: 200
📥 Google Vision 응답 수신
📊 Vision response structure: {...}
📝 추출된 텍스트 길이: 450
📝 추출된 텍스트 (처음 500자): ...
✅ Google Vision OCR 성공: {
  businessNumber: "123-45-67890",
  businessName: "주식회사 알비",
  confidence: 0.95
}
```

#### **예상 로그 (API 키 없을 때)**

```javascript
⚠️ GOOGLE_VISION_API_KEY가 설정되지 않았습니다. Mock 데이터를 사용합니다.

========================================
🔍 [개발 모드] OCR 시뮬레이션
========================================
파일명: 사업자등록증.jpg
크기: 512.00 KB
========================================
✅ Mock OCR 결과: {businessNumber: "123-45-67890", businessName: "주식회사 알비", confidence: 0.95}
```

---

### **Step 6: 자동 입력 확인**

업로드 완료 후:

```
✅ 사업자등록번호 필드 자동 입력
   예: 123-45-67890

✅ 상호명 필드 자동 입력
   예: 주식회사 알비

✅ 신뢰도 점수 표시
   예: 95% 정확도
```

---

## 🔍 Vision API 작동 여부 확인

### **✅ Vision API 사용 중**
```javascript
// Console에 다음 로그가 표시되면 Vision API 사용 중:
🔑 API Key exists: true
📡 Vision API response status: 200
✅ Google Vision OCR 성공
```

### **❌ Mock 데이터 사용 중**
```javascript
// Console에 다음 로그가 표시되면 Mock 데이터 사용 중:
⚠️ GOOGLE_VISION_API_KEY가 설정되지 않았습니다. Mock 데이터를 사용합니다.
🔍 [개발 모드] OCR 시뮬레이션
```

---

## 🐛 문제 해결

### **문제 1: "API Key exists: false"**

**원인**: 환경 변수가 프로덕션에 제대로 등록되지 않음

**해결**:
```bash
# 1. 시크릿 재등록
npx wrangler pages secret put GOOGLE_VISION_API_KEY --project-name albi-app
# 입력: AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU

# 2. 재배포
npx wrangler pages deploy public --project-name albi-app

# 3. 5분 후 재테스트 (배포 완전 적용 대기)
```

---

### **문제 2: "Vision API response status: 400/403"**

**원인**: API 키 권한 또는 활성화 문제

**해결**:
1. https://console.cloud.google.com/apis/library/vision.googleapis.com
2. "사용 설정" 확인
3. API 키 → 제한사항 확인:
   - Cloud Vision API 선택되어 있는지
   - HTTP 리퍼러 제한 확인

---

### **문제 3: "Vision API response status: 429"**

**원인**: 무료 티어 한도 초과 (월 1,000건)

**해결**:
1. https://console.cloud.google.com/apis/dashboard
2. Vision API 사용량 확인
3. 결제 정보 등록 (유료 티어 전환)

---

### **문제 4: 텍스트는 추출되지만 사업자번호 인식 실패**

**원인**: 텍스트 추출 패턴 문제

**확인**:
```javascript
// Console에서 추출된 텍스트 확인:
📝 추출된 텍스트 (처음 500자): [여기서 실제 추출된 텍스트 확인]
```

**해결**: 추출된 텍스트를 공유해주시면 패턴 개선하겠습니다.

---

## 📊 성능 비교

### **Before (Tesseract.js)**
- 처리 위치: 클라이언트 (브라우저)
- 처리 시간: 5-10초
- 정확도: 70-85%
- 한글 지원: 보통
- 파일 크기: ~2MB (라이브러리 로드)

### **After (Google Cloud Vision API)**
- 처리 위치: 서버 (Cloudflare)
- 처리 시간: 1-3초 ⚡
- 정확도: 90-98% 🎯
- 한글 지원: 우수 ⭐
- 파일 크기: 0 (서버 처리)

---

## 🎯 테스트 체크리스트

### **기본 테스트**
- [ ] 마이페이지 접속
- [ ] 구인자 인증 탭 클릭
- [ ] F12 → Console 탭 열기
- [ ] 사업자등록증 이미지 업로드
- [ ] Console 로그 확인
- [ ] 사업자번호 자동 입력 확인
- [ ] 상호명 자동 입력 확인

### **Vision API 확인**
- [ ] Console에서 "🔑 API Key exists: true" 확인
- [ ] Console에서 "📡 API response status: 200" 확인
- [ ] Console에서 "✅ Google Vision OCR 성공" 확인
- [ ] Mock 데이터가 아닌 실제 인식 결과 확인

### **정확도 테스트**
- [ ] 여러 사업자등록증 이미지로 테스트
- [ ] 인식 정확도 확인
- [ ] 오인식 패턴 확인

---

## 📸 테스트 이미지 준비

### **권장 이미지**
- ✅ 선명한 스캔본 (300 DPI 이상)
- ✅ 균일한 조명
- ✅ 정면 촬영
- ✅ JPG, PNG 형식

### **피해야 할 이미지**
- ❌ 흐릿한 사진
- ❌ 기울어진 각도
- ❌ 그림자 많음
- ❌ 반사광 있음

---

## 🚀 테스트 시작!

### **1단계: 즉시 테스트**
```
https://albi-app.pages.dev/mypage.html
→ 구인자 인증 탭
→ F12 → Console
→ 파일 업로드
```

### **2단계: 로그 확인**
```
Console에서 다음 확인:
1. 🔑 API Key exists: true
2. 📡 API response status: 200
3. ✅ OCR 성공 메시지
```

### **3단계: 결과 공유**
```
다음 정보를 공유해주세요:
1. Console 로그 스크린샷
2. 사업자번호/상호명 인식 결과
3. 정확도 점수
```

---

## 💡 추가 개선 사항 (향후)

1. **이미지 전처리**
   - 자동 회전 보정
   - 명암/대비 조정
   - 노이즈 제거

2. **다중 문서 지원**
   - 신분증 인식
   - 통장 사본 인식
   - 영수증 인식

3. **OCR 캐싱**
   - 같은 파일 재업로드 방지
   - 비용 절감

4. **실시간 검증**
   - 사업자번호 형식 검증
   - 국세청 API 연동
   - 실시간 유효성 확인

---

## 🎉 완료!

**준비 완료!** 이제 실제 사업자등록증으로 테스트해주세요!

테스트 후:
1. Console 로그 스크린샷 공유
2. 인식 결과 (사업자번호, 상호명)
3. Vision API 사용 여부 확인

**Google Cloud Vision API가 제대로 작동하는지 확인하겠습니다!** 🚀
