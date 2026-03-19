# 🔧 구글 OAuth 리디렉션 및 서치콘솔 문제 해결 가이드

작성일: 2026-03-19
상태: ⚠️ 조치 필요

---

## 📋 문제 요약

### 1️⃣ **구글 로그인 실패 (400 오류: redirect_uri_mismatch)**

**원인**: Google Cloud Console에 등록된 리디렉션 URI와 실제 요청하는 URI가 다름

**현재 코드 동작**:
- 코드: `${origin}/api/auth/google/callback`
- 실제 요청 URI (동적): 
  - `https://albi.kr/api/auth/google/callback`
  - `https://albi-app.pages.dev/api/auth/google/callback`

### 2️⃣ **구글 서치콘솔 유효성 검사 실패**

**원인**: sitemap.xml의 URL 형식과 실제 페이지 접근 방식 불일치

**현재 상황**:
- sitemap.xml: `/chat` (확장자 없음)
- 실제 파일: `/chat.html`
- Cloudflare Pages: 둘 다 접근 가능 (자동 rewrite)
- 구글봇: 혼란 발생 가능

---

## ✅ 해결 방법

### 🎯 Solution 1: Google OAuth 리디렉션 URI 등록

#### **Step 1: Google Cloud Console 접속**
```
https://console.cloud.google.com/apis/credentials
```

#### **Step 2: OAuth 2.0 클라이언트 ID 선택**
- 프로젝트에서 사용 중인 OAuth 2.0 클라이언트 ID 클릭
- "승인된 리디렉션 URI" 섹션으로 이동

#### **Step 3: 다음 URI들을 추가**

**필수 (프로덕션)**:
```
https://albi.kr/api/auth/google/callback
```

**선택 (Cloudflare Pages 기본 도메인)**:
```
https://albi-app.pages.dev/api/auth/google/callback
```

**선택 (개발/테스트)**:
```
http://localhost:3000/api/auth/google/callback
```

#### **Step 4: 저장**
- 변경사항 저장
- 몇 분 후 적용됨 (최대 5분)

#### **Step 5: 테스트**
```bash
# 구글 로그인 테스트
curl -I https://albi.kr/api/auth/google

# 콜백 테스트 (실제 로그인 시도)
# 브라우저에서: https://albi.kr/login.html
# -> "Google로 로그인" 클릭
```

---

### 🗺️ Solution 2: Sitemap.xml 수정 (HTML 확장자 추가)

#### **현재 sitemap.xml 문제**:
```xml
<!-- 현재 (잘못된 형식) -->
<url>
  <loc>https://albi.kr/chat</loc>
  <priority>0.9</priority>
</url>
```

#### **수정 방법**:

**Option A: .html 확장자 추가 (권장)**
```xml
<!-- 수정 후 (권장) -->
<url>
  <loc>https://albi.kr/chat.html</loc>
  <priority>0.9</priority>
</url>
```

**장점**:
- 실제 파일과 정확히 일치
- 구글봇 혼란 방지
- 명확한 URL 구조

**Option B: _redirects 파일로 canonical URL 명시**

현재 `/home/user/webapp/public/_redirects`에서 이미 처리 중:
```
/chat  /chat.html  200!
```

이 경우 sitemap은 확장자 없이 유지하고, `<link rel="canonical">` 태그를 HTML에 추가:

```html
<!-- chat.html에 추가 -->
<head>
  <link rel="canonical" href="https://albi.kr/chat" />
</head>
```

---

## 🔍 현재 상태 확인

### 1. 구글 로그인 테스트
```bash
# 현재 OAuth flow 확인
curl -I https://albi.kr/api/auth/google

# 로그 확인 (Cloudflare Pages Dashboard)
# Functions > Logs > google callback
```

### 2. 리디렉션 체인 확인
```bash
# /chat 접근 시 리디렉션 확인
curl -I https://albi.kr/chat

# 예상 결과: HTTP/2 200 (리디렉션 없음, rewrite 사용)
```

### 3. sitemap.xml 유효성 확인
```bash
# sitemap 다운로드
curl -s https://albi.kr/sitemap.xml | head -100

# 구글 서치콘솔에서 확인:
# https://search.google.com/search-console
# Sitemaps > sitemap.xml 제출
```

---

## 📊 체크리스트

### Google OAuth 설정
- [ ] Google Cloud Console 접속
- [ ] OAuth 2.0 클라이언트 ID 확인
- [ ] `https://albi.kr/api/auth/google/callback` 추가
- [ ] `https://albi-app.pages.dev/api/auth/google/callback` 추가 (선택)
- [ ] 변경사항 저장
- [ ] 5분 대기
- [ ] 구글 로그인 테스트 (브라우저에서)
- [ ] 로그인 성공 확인

### Sitemap.xml 수정
- [ ] sitemap.xml 수정 필요 여부 결정
  - [ ] Option A: .html 확장자 추가 (권장)
  - [ ] Option B: canonical 태그 추가
- [ ] 수정 사항 배포
- [ ] 구글 서치콘솔에서 sitemap 재제출
- [ ] URL 검사 도구로 개별 페이지 확인
- [ ] 색인 생성 요청

---

## 🚨 긴급 조치 (즉시 가능)

### 1. Google Cloud Console 설정 (5분 소요)
**즉시 실행 가능 - 코드 수정 불필요**

1. https://console.cloud.google.com/apis/credentials 접속
2. OAuth 클라이언트 편집
3. 리디렉션 URI 2개 추가:
   - `https://albi.kr/api/auth/google/callback`
   - `https://albi-app.pages.dev/api/auth/google/callback`
4. 저장 후 5분 대기
5. 구글 로그인 테스트

### 2. Sitemap.xml 수정 (10분 소요)
**코드 수정 및 배포 필요**

```bash
# 1. sitemap.xml 수정
# /home/user/webapp/public/sitemap.xml

# 2. 빌드 및 배포
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name albi-app

# 3. 구글 서치콘솔에서 sitemap 재제출
```

---

## 📞 추가 지원

### 구글 OAuth 오류 디버깅
```javascript
// functions/api/auth/[[path]].ts 267번째 줄
console.log('[Google OAuth] Redirect URI:', redirectUri)
```

이 로그를 Cloudflare Pages 대시보드 > Functions > Logs에서 확인

### 서치콘솔 문제 해결
1. https://search.google.com/search-console
2. URL 검사 도구 사용
3. "실시간 테스트" 클릭
4. 리디렉션 체인 확인
5. "색인 생성 요청" 클릭

---

## 🎯 우선순위

1. **최우선**: Google OAuth 리디렉션 URI 등록 (5분, 즉시 가능)
2. **우선**: Sitemap.xml 수정 (10분, 배포 필요)
3. **선택**: Canonical 태그 추가 (SEO 최적화)

---

## 📝 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Google Search Console 가이드](https://support.google.com/webmasters/answer/9012289)
