# 🔧 Google Cloud API 디버깅 및 테스트

## 🎯 배포 정보

**최신 배포 URL**: https://278923d0.albi-app.pages.dev
**메인 도메인**: https://albi-app.pages.dev
**배포 시간**: 2026-02-11 13:51 UTC

---

## 🧪 즉시 테스트 가능

### **1. Google 로그인 테스트**

#### 방법 1: 웹 브라우저
```
1. https://albi-app.pages.dev/login.html 접속
2. "Google로 계속하기" 버튼 클릭
3. Google 계정 선택
4. 결과 확인
```

#### 방법 2: 직접 API 호출
```bash
# Google OAuth 엔드포인트 확인
curl -I https://albi-app.pages.dev/api/auth/google

# 예상 응답:
# HTTP/2 302
# location: https://accounts.google.com/o/oauth2/v2/auth?client_id=851913480828-...
```

---

### **2. 사업자등록증 OCR 테스트**

#### 방법 1: 웹 브라우저
```
1. https://albi-app.pages.dev/mypage.html 접속
2. "구인자 인증" 탭 클릭
3. 사업자등록증 이미지 업로드
4. 자동 인식 결과 확인
```

#### 방법 2: curl로 직접 테스트 (테스트 이미지 필요)
```bash
curl -X POST https://albi-app.pages.dev/api/ocr/business-registration \
  -F "file=@사업자등록증.jpg"
```

---

## 🔍 디버깅 로그 확인 방법

### **브라우저 개발자 도구**
```
1. F12 또는 우클릭 → 검사
2. Console 탭 선택
3. 로그 메시지 확인:
   - [Google OAuth] ...
   - [Google Vision] ...
```

### **Cloudflare Pages Functions 로그**
```bash
# Wrangler로 실시간 로그 확인
npx wrangler pages deployment tail --project-name albi-app

# 또는 Cloudflare Dashboard에서:
# Pages → albi-app → Analytics → Functions Logs
```

---

## 📊 추가된 디버깅 로그

### **Google OAuth 로그**
```javascript
[Google OAuth] Starting auth flow
[Google OAuth] Client ID exists: true/false
[Google OAuth] Redirect URI: https://...

[Google OAuth Callback] Code: exists/missing
[Google OAuth Callback] Error: none/...
[Google OAuth Callback] Client ID exists: true/false
[Google OAuth Callback] Client Secret exists: true/false
[Google OAuth Callback] Token response status: 200
[Google OAuth Callback] Token data: {...}
```

### **Google Vision API 로그**
```javascript
[Google Vision] 🔍 호출 시작...
[Google Vision] 🔑 API Key exists: true/false
[Google Vision] 📄 File info: {name, size, type}
[Google Vision] 📦 Base64 encoding complete
[Google Vision] 📡 API response status: 200
[Google Vision] 📥 응답 수신
[Google Vision] 📊 Response structure: {...}
[Google Vision] 📝 추출된 텍스트: ...
[Google Vision] ✅ OCR 성공: {businessNumber, businessName, confidence}
```

---

## 🐛 예상 문제 및 해결 방법

### **문제 1: "GOOGLE_CLIENT_ID is not set!"**

**원인**: 환경 변수가 설정되지 않음

**해결**:
```bash
# Cloudflare Pages에서 시크릿 확인
npx wrangler pages secret list --project-name albi-app | grep GOOGLE

# 없다면 다시 등록
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name albi-app
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name albi-app
```

---

### **문제 2: "redirect_uri_mismatch"**

**원인**: Google Cloud Console에서 승인된 리디렉션 URI 불일치

**해결**:
1. https://console.cloud.google.com 접속
2. API 및 서비스 → 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 클릭
4. 승인된 리디렉션 URI 확인:
   ```
   https://albi-app.pages.dev/api/auth/google/callback
   https://278923d0.albi-app.pages.dev/api/auth/google/callback
   ```
5. 누락된 URI 추가 → 저장

---

### **문제 3: "GOOGLE_VISION_API_KEY가 설정되지 않았습니다"**

**원인**: Vision API 키 미설정

**해결**:
```bash
# API 키 확인
npx wrangler pages secret list --project-name albi-app | grep VISION

# 없다면 등록
npx wrangler pages secret put GOOGLE_VISION_API_KEY --project-name albi-app
# 입력: AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU
```

---

### **문제 4: Vision API "PERMISSION_DENIED" 또는 "API_KEY_INVALID"**

**원인**: API 키 권한 또는 활성화 문제

**해결**:
1. https://console.cloud.google.com/apis/library/vision.googleapis.com
2. "사용 설정" 확인
3. API 키 → 제한사항 확인:
   - Cloud Vision API 선택되어 있는지 확인
   - HTTP 리퍼러 제한이 너무 엄격하지 않은지 확인

---

### **문제 5: Vision API "QUOTA_EXCEEDED"**

**원인**: 무료 티어 한도 (월 1,000건) 초과

**해결**:
1. https://console.cloud.google.com/apis/dashboard
2. Vision API 사용량 확인
3. 결제 정보 등록 (유료 티어 전환)
4. 또는 할당량 초기화 대기 (매월 1일)

---

## ✅ 테스트 체크리스트

### **Google OAuth**
- [ ] `/api/auth/google` 엔드포인트 302 리다이렉트 확인
- [ ] Google 로그인 페이지 표시
- [ ] 계정 선택 후 권한 승인
- [ ] 콜백 URL로 리다이렉트
- [ ] 사용자 정보 자동 입력
- [ ] 세션 생성 및 로그인 완료

### **Google Vision API**
- [ ] 파일 업로드 성공
- [ ] API 호출 로그 확인
- [ ] 텍스트 추출 성공 (로그에 표시)
- [ ] 사업자등록번호 인식
- [ ] 상호명 인식
- [ ] 신뢰도 점수 표시

---

## 🎯 테스트 우선순위

### **1순위: Google OAuth 작동 확인**
```bash
# 간단한 테스트
curl -I https://albi-app.pages.dev/api/auth/google

# 성공 시: location 헤더에 accounts.google.com URL
# 실패 시: 500 에러 또는 에러 메시지
```

### **2순위: Vision API 작동 확인**
```
1. 브라우저에서 마이페이지 접속
2. 구인자 인증 탭 → 파일 업로드
3. F12 → Console 탭에서 로그 확인:
   - "🔑 API Key exists: true" 확인
   - "📡 API response status: 200" 확인
   - "✅ OCR 성공" 확인
```

---

## 📞 여전히 문제가 발생한다면?

### **필요한 정보 수집**
1. 브라우저 Console 로그 스크린샷
2. Network 탭에서 실패한 요청의 Response 탭
3. Cloudflare Pages Functions 로그

### **확인할 사항**
- [ ] 환경 변수가 모두 등록되었는가?
- [ ] Google Cloud Console에서 API가 활성화되었는가?
- [ ] 승인된 리디렉션 URI가 정확한가?
- [ ] 결제 정보가 등록되었는가? (무료 티어도 필요)

---

## 🚀 다음 단계

테스트가 성공하면:
1. ✅ 실제 사용자 시나리오 테스트
2. ✅ 모바일 환경 테스트
3. ✅ 에러 처리 개선
4. ✅ 사용량 모니터링 설정

---

**🎉 테스트를 시작하세요!**

문제가 발생하면 브라우저 Console 로그와 함께 알려주세요.
