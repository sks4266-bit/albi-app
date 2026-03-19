# 🚨 구글 OAuth 리디렉션 URI 긴급 수정 가이드

작성일: 2026-03-19
상태: 🔴 긴급 조치 필요

---

## 🔍 **현재 오류 상황**

### 오류 정보
```
오류 코드: redirect_uri_mismatch
Client ID: 851913480828-jmjakc448nekunr07hsi60if6gp9q49j.apps.googleusercontent.com
요청 URI: https://albi.kr/api/auth/google/callback
```

### 문제 원인
**Google Cloud Console에 `https://albi.kr/api/auth/google/callback`이 등록되지 않았습니다.**

---

## ✅ **해결 방법 (5분 소요)**

### 📋 **Step 1: Google Cloud Console 접속**

1. **브라우저에서 다음 URL 접속**:
```
https://console.cloud.google.com/apis/credentials?project=YOUR_PROJECT_ID
```

또는 직접 검색:
```
Google Cloud Console → API 및 서비스 → 사용자 인증 정보
```

---

### 🔑 **Step 2: OAuth 2.0 클라이언트 ID 찾기**

1. "사용자 인증 정보" 페이지에서 다음 **Client ID** 찾기:
```
851913480828-jmjakc448nekunr07hsi60if6gp9q49j.apps.googleusercontent.com
```

2. 해당 클라이언트 ID 이름 클릭 (편집 모드로 진입)

---

### ✏️ **Step 3: 승인된 리디렉션 URI 추가**

"승인된 리디렉션 URI" 섹션에서 다음 URI들을 **정확히** 추가:

#### **필수 추가** (최우선):
```
https://albi.kr/api/auth/google/callback
```

#### **선택 추가** (권장):
```
https://albi-app.pages.dev/api/auth/google/callback
```

#### **개발용** (선택):
```
http://localhost:3000/api/auth/google/callback
```

**⚠️ 중요 사항**:
- URI는 **정확히 일치**해야 함 (대소문자, 슬래시 포함)
- 끝에 슬래시(`/`) **없어야 함**
- `https://` 프로토콜 사용 (http 아님)
- 쿼리 파라미터나 해시 **없어야 함**

---

### 💾 **Step 4: 저장**

1. "저장" 버튼 클릭
2. ⏰ **5분 대기** (Google API 변경사항 전파 시간)
3. 설정 완료!

---

### 🧪 **Step 5: 테스트**

#### **A. 브라우저에서 직접 테스트**

1. **새 브라우저 탭 열기** (시크릿 모드 권장)
2. 주소창에 입력:
```
https://albi.kr/login.html
```

3. **"Google로 로그인"** 버튼 클릭

4. 구글 계정 선택 및 권한 승인

5. ✅ **성공 시**: 자동으로 `/auth-callback.html`로 리디렉션되고 로그인 완료

6. ❌ **실패 시**: 
   - 5분 더 대기 후 재시도
   - Google Cloud Console에서 URI 철자 확인
   - 브라우저 캐시 삭제 후 재시도

---

#### **B. API 직접 호출 테스트** (선택)

```bash
# 구글 OAuth 엔드포인트 호출
curl -I https://albi.kr/api/auth/google

# 예상 결과: 302 리디렉션 (Google 인증 페이지로)
```

---

## 📸 **스크린샷 가이드**

### Google Cloud Console 화면 예시:

```
┌─────────────────────────────────────────────────────┐
│  OAuth 2.0 클라이언트 ID 편집                         │
├─────────────────────────────────────────────────────┤
│                                                       │
│  이름: Web client 1                                   │
│                                                       │
│  클라이언트 ID:                                       │
│  851913480828-jmjakc448nekunr07hsi60if6gp9q49j...    │
│                                                       │
│  클라이언트 보안 비밀번호:                             │
│  ••••••••••••••••••••••                              │
│                                                       │
│  승인된 자바스크립트 원본:                             │
│  https://albi.kr                                      │
│  https://albi-app.pages.dev                           │
│                                                       │
│  승인된 리디렉션 URI:  [+ URI 추가] 버튼               │
│  ┌──────────────────────────────────────────┐        │
│  │ https://albi.kr/api/auth/google/callback │  [X]  │
│  └──────────────────────────────────────────┘        │
│  ┌──────────────────────────────────────────┐        │
│  │ https://albi-app.pages.dev/api/auth/...  │  [X]  │
│  └──────────────────────────────────────────┘        │
│                                                       │
│  [취소]                              [저장] ← 클릭!  │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 **트러블슈팅**

### 문제 1: "저장" 버튼이 비활성화됨
**해결책**: 
- URI 형식 확인 (https://, 끝에 슬래시 없음)
- 중복된 URI 제거
- 페이지 새로고침 후 재시도

---

### 문제 2: 저장 후에도 오류 지속
**해결책**:
- ⏰ **5-10분 추가 대기** (Google API 전파 시간)
- 브라우저 캐시 삭제:
  - Chrome: Ctrl+Shift+Delete → "캐시된 이미지 및 파일" 체크 → 삭제
  - Safari: 개발자 메뉴 → "캐시 비우기"
- **시크릿/프라이빗 모드**에서 재시도

---

### 문제 3: Client ID를 찾을 수 없음
**해결책**:
1. Google Cloud Console에서 **올바른 프로젝트** 선택 확인
2. "API 및 서비스" → "사용자 인증 정보" 메뉴 확인
3. "OAuth 2.0 클라이언트 ID" 섹션에서 검색

Client ID: `851913480828-jmjakc448nekunr07hsi60if6gp9q49j`

---

### 문제 4: 권한 부족 오류
**해결책**:
- Google Cloud 프로젝트에 대한 **편집자** 또는 **소유자** 권한 필요
- 프로젝트 관리자에게 권한 요청
- 또는 관리자에게 직접 URI 추가 요청

---

## 📋 **체크리스트**

### 설정 전
- [ ] Google 계정 로그인 확인
- [ ] Google Cloud Console 접속 가능 확인
- [ ] 프로젝트 편집 권한 확인

### 설정 중
- [ ] Client ID `851913480828-jmjakc448nekunr07hsi60if6gp9q49j` 찾기
- [ ] "승인된 리디렉션 URI" 섹션 열기
- [ ] `https://albi.kr/api/auth/google/callback` 추가
- [ ] `https://albi-app.pages.dev/api/auth/google/callback` 추가 (선택)
- [ ] URI 철자 및 형식 확인
- [ ] "저장" 버튼 클릭
- [ ] 성공 메시지 확인

### 설정 후
- [ ] ⏰ 5분 대기
- [ ] 브라우저 캐시 삭제
- [ ] https://albi.kr/login.html 접속
- [ ] "Google로 로그인" 클릭
- [ ] 로그인 성공 확인

---

## 🎯 **빠른 설정 요약**

```
1. https://console.cloud.google.com/apis/credentials 접속
2. Client ID (851913480828-...) 클릭
3. "승인된 리디렉션 URI"에 추가:
   → https://albi.kr/api/auth/google/callback
4. 저장
5. 5분 대기
6. https://albi.kr/login.html에서 테스트
```

---

## 📞 **추가 지원**

### Google OAuth 공식 문서
- [OAuth 2.0 리디렉션 URI 설정](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)
- [redirect_uri_mismatch 오류 해결](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch)

### Cloudflare Pages 로그 확인
```
Cloudflare Dashboard
→ Pages
→ albi-app
→ Functions
→ Logs
→ "google callback" 검색
```

---

## ✅ **완료 확인**

설정 완료 후 다음 사항 확인:

1. **로그인 테스트 성공**
   - ✅ Google 계정 선택 화면 표시
   - ✅ 권한 승인 화면 표시
   - ✅ `/auth-callback.html`로 리디렉션
   - ✅ 대시보드/채팅 페이지 접근 가능

2. **오류 없음**
   - ✅ `redirect_uri_mismatch` 오류 사라짐
   - ✅ 브라우저 콘솔에 오류 없음

3. **세션 유지**
   - ✅ 페이지 새로고침 후에도 로그인 유지
   - ✅ 사용자 정보 표시 (이름, 이메일 등)

---

## 🚨 **긴급 요청**

**이 설정은 코드 수정 없이 Google Cloud Console에서만 진행됩니다.**

**예상 소요 시간**: 
- 설정: 5분
- 전파 대기: 5분
- 테스트: 2분
- **총 12분**

설정 완료 후 바로 알려주시면 추가 지원해드리겠습니다! 🚀
