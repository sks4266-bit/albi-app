# 🔍 Google OAuth Client ID 불일치 문제 분석

작성일: 2026-03-19
상태: 🔴 환경 변수 확인 필요

---

## 📋 **문제 발견**

### Google Cloud Console 설정 (스크린샷):
```
Client ID: 171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com
```

**승인된 리디렉션 URI** (이미 정확히 설정됨 ✅):
```
URI 1: http://localhost:3000/api/auth/google/callback
URI 2: https://albi-app.pages.dev/api/auth/google/callback
URI 3: https://albi.kr/api/auth/google/callback
```

### 오류 메시지에 표시된 Client ID:
```
Client ID: 851913480828-jmjakc448nekunr07hsi60if6gp9q49j.apps.googleusercontent.com
```

**→ 두 개의 다른 OAuth 클라이언트 존재!**

---

## 🤔 **왜 이런 문제가 발생했을까?**

### 가능한 원인:

1. **환경 변수 불일치** (가장 가능성 높음)
   - Cloudflare Pages의 `GOOGLE_CLIENT_ID` 환경 변수가 이전 Client ID로 설정됨
   - 로컬 개발 환경과 프로덕션 환경의 Client ID가 다름

2. **여러 OAuth 클라이언트 사용**
   - 테스트용 Client ID: `851913480828-...`
   - 프로덕션용 Client ID: `171235009067-...`
   - 하지만 프로덕션에서 테스트용 Client ID를 사용 중

3. **캐시 또는 오래된 배포**
   - 이전 배포의 환경 변수가 남아있음
   - 브라우저 캐시가 이전 OAuth 흐름을 기억

---

## ✅ **해결 방법**

### **Solution 1: Cloudflare Pages 환경 변수 확인 및 수정**

#### **Step 1: Cloudflare Dashboard 접속**
```
https://dash.cloudflare.com
```

#### **Step 2: 프로젝트 선택**
```
Pages → albi-app → Settings → Environment variables
```

#### **Step 3: 환경 변수 확인**

다음 변수들을 확인:

**GOOGLE_CLIENT_ID**:
- 현재 값: `851913480828-...` (잘못됨 ❌)
- 올바른 값: `171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com` ✅

**GOOGLE_CLIENT_SECRET**:
- 스크린샷의 "클라이언트 보안 비밀번호"에서 확인
- 값: `******dyj` (끝 3자리만 표시됨)

**GOOGLE_REDIRECT_URI** (선택):
- 값: `https://albi.kr/api/auth/google/callback`

#### **Step 4: 환경 변수 수정**

1. **Production** 탭에서 `GOOGLE_CLIENT_ID` 찾기
2. **Edit** 버튼 클릭
3. 새 값 입력:
   ```
   171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com
   ```
4. **Save** 클릭

5. **Preview** 탭에서도 동일하게 수정 (있다면)

#### **Step 5: 재배포**

환경 변수 변경 후 **반드시 재배포 필요**:

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name albi-app
```

또는 Cloudflare Dashboard에서:
```
Pages → albi-app → Deployments → ⋯ (최신 배포) → Retry deployment
```

---

### **Solution 2: 로컬 환경 변수 확인 (.dev.vars)**

로컬 개발 환경에서도 동일한 Client ID 사용:

#### **파일 생성/수정**: `/home/user/webapp/.dev.vars`

```env
# Google OAuth
GOOGLE_CLIENT_ID=171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Kakao OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_secret
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/callback

# Naver OAuth
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_secret
NAVER_REDIRECT_URI=http://localhost:3000/api/auth/naver/callback
```

**⚠️ 주의**: `.dev.vars` 파일은 `.gitignore`에 포함되어야 함 (보안)

---

## 🧪 **테스트 및 검증**

### **1. 환경 변수 확인**

#### Cloudflare Pages에서 확인:
```
Cloudflare Dashboard
→ Pages → albi-app → Settings → Environment variables
→ GOOGLE_CLIENT_ID 값 확인
```

#### 로컬에서 확인:
```bash
cd /home/user/webapp
cat .dev.vars | grep GOOGLE_CLIENT_ID
```

---

### **2. 브라우저 테스트**

#### **A. 캐시 완전 삭제**
```
Chrome:
1. Ctrl+Shift+Delete
2. "전체 기간" 선택
3. "쿠키 및 기타 사이트 데이터" 체크
4. "캐시된 이미지 및 파일" 체크
5. "데이터 삭제" 클릭
```

#### **B. 시크릿 모드에서 테스트**
```
Chrome: Ctrl+Shift+N
Safari: Cmd+Shift+N
Firefox: Ctrl+Shift+P
```

#### **C. 로그인 시도**
```
1. https://albi.kr/login.html 접속
2. F12 → Network 탭 열기
3. "Google로 로그인" 클릭
4. 요청 확인:
   - URL: https://accounts.google.com/o/oauth2/v2/auth?...
   - client_id 파라미터 확인
   - 예상 값: 171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g
```

---

### **3. API 직접 테스트**

```bash
# OAuth 엔드포인트 호출
curl -v https://albi.kr/api/auth/google 2>&1 | grep "client_id"

# 예상 출력:
# client_id=171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g
```

---

## 🔍 **디버깅 방법**

### **Cloudflare Functions 로그 확인**

```
Cloudflare Dashboard
→ Pages → albi-app → Functions → Logs
→ 필터: "Google OAuth"
→ 로그 확인:
   - [Google OAuth] Origin: https://albi.kr
   - [Google OAuth] Client ID exists: true
   - [Google OAuth] Redirect URI: https://albi.kr/api/auth/google/callback
```

### **브라우저 개발자 도구**

```javascript
// 콘솔에서 실행 (로그인 페이지에서)
// Google OAuth 요청 URL 확인
const googleAuthUrl = document.querySelector('a[href*="google"]')?.href;
console.log('Google Auth URL:', googleAuthUrl);

// client_id 파라미터 추출
const url = new URL(googleAuthUrl);
const clientId = url.searchParams.get('client_id');
console.log('Client ID:', clientId);
```

---

## 📊 **체크리스트**

### 환경 변수 확인
- [ ] Cloudflare Dashboard 접속
- [ ] Pages → albi-app → Settings → Environment variables
- [ ] `GOOGLE_CLIENT_ID` 값 확인
- [ ] 올바른 값으로 수정: `171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_SECRET` 값 확인 (있다면)
- [ ] Production 환경 저장
- [ ] Preview 환경 저장 (있다면)

### 재배포
- [ ] 환경 변수 변경 확인
- [ ] 빌드 실행: `npm run build`
- [ ] 배포 실행: `npx wrangler pages deploy dist --project-name albi-app`
- [ ] 또는 Cloudflare Dashboard에서 "Retry deployment"
- [ ] 배포 완료 대기 (약 2-3분)

### 테스트
- [ ] 브라우저 캐시 삭제
- [ ] 시크릿 모드에서 테스트
- [ ] https://albi.kr/login.html 접속
- [ ] F12 → Network 탭 열기
- [ ] "Google로 로그인" 클릭
- [ ] client_id 파라미터 확인
- [ ] Google 계정 선택
- [ ] 권한 승인
- [ ] ✅ 로그인 성공 확인

---

## 🎯 **예상 결과**

### 환경 변수 수정 전:
```
❌ client_id=851913480828-jmjakc448nekunr07hsi60if6gp9q49j...
❌ redirect_uri_mismatch 오류
```

### 환경 변수 수정 후:
```
✅ client_id=171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g...
✅ redirect_uri=https://albi.kr/api/auth/google/callback
✅ 로그인 성공
```

---

## 🚨 **긴급 조치 순서**

1. ✅ **Google Cloud Console 설정 확인** (이미 완료)
   - Redirect URI 3개 모두 등록됨

2. ⚠️ **Cloudflare Pages 환경 변수 수정** (필수)
   - `GOOGLE_CLIENT_ID` 값 변경
   - 올바른 Client ID: `171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g`

3. 🔄 **재배포** (필수)
   - 환경 변수 변경 후 반드시 재배포

4. 🧪 **테스트** (필수)
   - 캐시 삭제 후 로그인 테스트

---

## 📝 **요약**

### 문제 원인
- Google Cloud Console은 정확히 설정됨 ✅
- Cloudflare Pages 환경 변수가 잘못된 Client ID 사용 ❌

### 해결 방법
1. Cloudflare Dashboard → Environment variables
2. `GOOGLE_CLIENT_ID` 수정
3. 재배포
4. 테스트

### 예상 소요 시간
- 환경 변수 수정: 2분
- 재배포: 3분
- 테스트: 2분
- **총 7분**

---

**다음 단계**: Cloudflare Pages 환경 변수 확인 및 수정을 진행해주세요! 🚀
