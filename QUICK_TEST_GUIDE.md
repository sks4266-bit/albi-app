# 🧪 Google Cloud API 빠른 테스트 가이드

## 📝 개요

Google Cloud Vision API와 Google OAuth 2.0 설정이 완료되었습니다. 이제 실제로 작동하는지 테스트해봅시다!

---

## 🎯 테스트 1: Google 로그인

### **1단계: 로그인 페이지 접속**
```
https://albi-app.pages.dev/login.html
```

### **2단계: Google 로그인 버튼 클릭**
- 로그인 페이지에서 "Google로 계속하기" 버튼 클릭
- Google 계정 선택
- 권한 승인 (이메일, 프로필 정보)

### **3단계: 자동 로그인 확인**
- 로그인 후 메인 페이지로 리다이렉트
- 우측 상단에 사용자 이름 표시 확인
- 브라우저 개발자 도구 → Application → Local Storage 확인:
  - `albi_user_id`
  - `albi_session_token`
  - `albi_user_name`

### **예상 결과**
✅ Google 계정으로 자동 로그인  
✅ 사용자 정보 표시  
✅ 세션 유지 (7일)  

---

## 🎯 테스트 2: 사업자등록증 OCR (Vision API)

### **1단계: 마이페이지 접속**
```
https://albi-app.pages.dev/mypage.html
```

### **2단계: 구인자 인증 탭 클릭**
- 마이페이지 하단의 "구인자 인증" 탭 클릭
- 사업자등록증 업로드 섹션 확인

### **3단계: 사업자등록증 업로드**
- "파일 선택" 버튼 클릭
- 사업자등록증 이미지 선택 (JPG/PNG, 5MB 이하)
- 업로드 대기 (1-3초)

### **4단계: 자동 인식 결과 확인**
- **사업자등록번호** 필드 자동 입력 확인
  - 예: `123-45-67890`
- **상호명** 필드 자동 입력 확인
  - 예: `주식회사 알비`
- 신뢰도 점수 확인
  - 일반적으로 0.85 ~ 0.98

### **5단계: 인증 신청**
- 정보 확인 후 "인증 신청" 버튼 클릭
- 성공 메시지 확인: "구인자 인증 신청이 완료되었습니다."

### **예상 결과**
✅ 사업자등록번호 자동 인식  
✅ 상호명 자동 인식  
✅ 높은 정확도 (90-98%)  
✅ 빠른 처리 속도 (1-3초)  

---

## 🔍 Vision API 정확도 비교

### **이전 (Tesseract.js)**
- ❌ 정확도: 70-85%
- ❌ 처리 시간: 5-10초
- ❌ 브라우저에서 처리 (느림)
- ❌ 한글 인식 불안정

### **현재 (Google Cloud Vision API)**
- ✅ 정확도: 90-98%
- ✅ 처리 시간: 1-3초
- ✅ 서버에서 처리 (빠름)
- ✅ 한글 인식 우수

---

## 🐛 문제 해결

### **Google 로그인이 작동하지 않는 경우**

1. **브라우저 개발자 도구 확인**
   - F12 → Console 탭
   - 오류 메시지 확인

2. **OAuth 설정 확인**
   ```bash
   curl -I https://albi-app.pages.dev/api/auth/google
   ```
   - 응답: `location: https://accounts.google.com/o/oauth2/v2/auth...`

3. **리디렉션 URI 확인**
   - Google Cloud Console → API 및 서비스 → 사용자 인증 정보
   - 승인된 리디렉션 URI:
     - `https://albi-app.pages.dev/api/auth/google/callback`

---

### **OCR이 작동하지 않는 경우**

1. **API 키 확인**
   ```bash
   npx wrangler pages secret list --project-name albi-app | grep GOOGLE_VISION
   ```

2. **Vision API 활성화 확인**
   - https://console.cloud.google.com/apis/library/vision.googleapis.com
   - "API 사용 설정됨" 확인

3. **결제 정보 등록 확인**
   - Google Cloud Console → 결제
   - 무료 티어도 결제 정보 등록 필요

4. **브라우저 개발자 도구 확인**
   - Network 탭 → `/api/ocr/business-registration` 요청
   - 응답 확인

---

### **OCR 정확도가 낮은 경우**

1. **이미지 품질 개선**
   - 선명한 스캔 사용
   - 조명이 균일한 환경에서 촬영
   - 최소 300 DPI 권장

2. **지원하는 파일 형식**
   - ✅ JPG/JPEG
   - ✅ PNG
   - ✅ PDF (단일 페이지)
   - ❌ HEIC, BMP, TIFF (미지원)

3. **파일 크기 제한**
   - 최대 5MB
   - 너무 큰 파일은 리사이징 권장

---

## 📊 API 사용량 확인

### **Google Cloud Console**
1. https://console.cloud.google.com 접속
2. "API 및 서비스" → "대시보드" 클릭
3. "Cloud Vision API" 선택
4. 사용량 그래프 확인

### **무료 티어 한도**
- **Vision API**: 월 1,000건 무료
- **OAuth 2.0**: 무제한 무료

---

## 🎓 추가 테스트 시나리오

### **시나리오 1: 구직자 → 구인자 전환**
1. 구직자로 회원가입/로그인
2. 마이페이지 → 구인자 인증
3. 사업자등록증 업로드
4. 인증 승인 대기
5. 승인 후 공고 작성

### **시나리오 2: 여러 소셜 로그인 연동**
1. 카카오로 로그인
2. 로그아웃
3. Google로 로그인 (같은 이메일)
4. 계정 자동 연동 확인

### **시나리오 3: 모바일 테스트**
1. 모바일 브라우저에서 접속
2. Google 로그인
3. 사업자등록증 사진 촬영
4. OCR 자동 인식

---

## ✅ 체크리스트

### **Google 로그인 테스트**
- [ ] 로그인 페이지에서 Google 버튼 클릭
- [ ] Google 계정 선택
- [ ] 권한 승인
- [ ] 메인 페이지로 리다이렉트
- [ ] 사용자 이름 표시
- [ ] Local Storage에 세션 저장

### **Vision API OCR 테스트**
- [ ] 마이페이지 → 구인자 인증 탭
- [ ] 사업자등록증 업로드
- [ ] 사업자등록번호 자동 인식
- [ ] 상호명 자동 인식
- [ ] 신뢰도 점수 표시
- [ ] 인증 신청 성공

---

## 🎉 테스트 성공 시

모든 테스트가 통과하면:
1. ✅ Google Cloud API 설정 완료
2. ✅ Cloudflare Pages 배포 성공
3. ✅ 프로덕션 환경 준비 완료

다음 단계:
- 실제 사용자 테스트
- 사용량 모니터링
- 비용 최적화

---

## 📞 문제 발생 시

테스트 중 문제가 발생하면:
1. 브라우저 개발자 도구 Console 확인
2. Network 탭에서 API 요청 확인
3. Cloudflare Pages Functions 로그 확인
4. Google Cloud Console 로그 확인

**도움말**:
- [Google Cloud Vision API 문서](https://cloud.google.com/vision/docs)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)

---

**🚀 준비 완료! 테스트를 시작하세요!**
