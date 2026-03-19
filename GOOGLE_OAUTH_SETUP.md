# Google OAuth 설정 가이드

## 🚨 필수: Google Cloud Console 설정

현재 **redirect_uri_mismatch** 오류가 발생하는 이유는 Google Cloud Console에 승인된 리디렉션 URI가 등록되어 있지 않기 때문입니다.

### 📋 등록해야 할 리디렉션 URI

다음 URL들을 **모두** Google Cloud Console의 **승인된 리디렉션 URI**에 추가해주세요:

1. `https://albi.kr/api/auth/google/callback`
2. `https://albi-app.pages.dev/api/auth/google/callback`
3. (선택) 개발 중인 Cloudflare Pages URL들 (예: `https://[random-id].albi-app.pages.dev/api/auth/google/callback`)

### 🔧 설정 방법

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 선택**
   - 알비 프로젝트 선택

3. **API 및 서비스 → 사용자 인증 정보**
   - 좌측 메뉴에서 "사용자 인증 정보" 클릭

4. **OAuth 2.0 클라이언트 ID 선택**
   - 웹 애플리케이션 클라이언트 ID 선택

5. **승인된 리디렉션 URI 추가**
   - "승인된 리디렉션 URI" 섹션에서 "+ URI 추가" 클릭
   - 위의 URL들을 하나씩 추가
   - **저장** 버튼 클릭

6. **변경사항 적용 대기**
   - Google의 경우 설정 변경 후 최대 5분 정도 소요될 수 있습니다

### ✅ 설정 완료 확인

설정이 완료되면 다음과 같이 테스트해보세요:

1. https://albi.kr/login.html 접속
2. "Google로 시작하기" 버튼 클릭
3. Google 로그인 완료 후 albi.kr로 정상 리다이렉트되는지 확인

### 🔒 현재 사용 중인 OAuth 정보

**환경 변수 (Cloudflare Pages)**:
- `GOOGLE_CLIENT_ID`: (설정됨)
- `GOOGLE_CLIENT_SECRET`: (설정됨)
- ~~`GOOGLE_REDIRECT_URI`~~: (더 이상 사용 안 함 - 자동으로 현재 도메인 사용)

**자동 감지되는 리디렉션 URI**:
- 코드에서 `${origin}/api/auth/google/callback` 형식으로 자동 생성
- `albi.kr`로 접속 시: `https://albi.kr/api/auth/google/callback`
- `albi-app.pages.dev`로 접속 시: `https://albi-app.pages.dev/api/auth/google/callback`

### 🎯 카카오, 네이버도 동일하게 설정

**카카오 개발자 센터** (https://developers.kakao.com)
- 플랫폼 설정 → Web 도메인 등록
  - `https://albi.kr`
  - `https://albi-app.pages.dev`
- Redirect URI 설정
  - `https://albi.kr/api/auth/kakao/callback`
  - `https://albi-app.pages.dev/api/auth/kakao/callback`

**네이버 개발자 센터** (https://developers.naver.com)
- API 설정 → Callback URL
  - `https://albi.kr/api/auth/naver/callback`
  - `https://albi-app.pages.dev/api/auth/naver/callback`
