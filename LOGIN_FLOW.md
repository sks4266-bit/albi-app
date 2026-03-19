# 로그인 연동 플로우

## 📋 개요
직무적성 테스트 결과 페이지에서 로그인 후 다시 결과 페이지로 돌아오는 완전한 플로우를 설명합니다.

## 🔄 전체 플로우

### 1단계: 테스트 완료
```
사용자가 /job-test.html에서 16문항 완료
↓
localStorage에 저장:
- testResult: 테스트 결과 전체
- myTestResults: 히스토리 (최대 10개)
↓
/job-test-result.html로 자동 이동
```

### 2단계: 결과 페이지 로드 (비로그인)
```javascript
// job-test-result.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 로그인 상태 확인
    const userId = localStorage.getItem('albi_user_id');
    const sessionToken = localStorage.getItem('albi_session_token');
    isLoggedIn = !!(userId && sessionToken);
    
    // 2. 테스트 결과 로드
    const savedResult = localStorage.getItem('testResult');
    if (!savedResult) {
        // 결과 없음 페이지 표시
        return;
    }
    
    // 3. 테스트 데이터 로드
    await loadTestData();
    
    // 4. 결과 표시
    displayResult();
    
    // 5. 비로그인이면 블러 처리
    if (!isLoggedIn) {
        applyBlur();
        setTimeout(() => {
            // 2초 후 로그인 프롬프트 표시
            document.getElementById('loginPrompt').classList.remove('hidden');
        }, 2000);
    }
});
```

### 3단계: 로그인 버튼 클릭
```javascript
function goToLogin() {
    // localStorage에 리다이렉트 URL 저장
    localStorage.setItem('redirect_after_login', '/job-test-result.html');
    
    console.log('✅ 로그인 후 리다이렉트 URL 저장: /job-test-result.html');
    
    // 로그인 페이지로 이동
    window.location.href = '/login.html';
}
```

**중요**: testResult는 localStorage에 그대로 유지됩니다!

### 4단계: 로그인 처리
```javascript
// login.html
async function login() {
    // 로그인 API 호출
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
    });
    
    const data = await response.json();
    
    // localStorage에 저장
    localStorage.setItem('albi_user_id', data.data.userId);
    localStorage.setItem('albi_session_token', data.data.sessionToken);
    localStorage.setItem('albi_user_name', data.data.name);
    
    // 리다이렉트 URL 확인
    const redirectUrl = localStorage.getItem('redirect_after_login');
    
    if (redirectUrl) {
        // 저장된 리다이렉트 URL로 이동
        localStorage.removeItem('redirect_after_login');
        window.location.href = redirectUrl;  // → /job-test-result.html
    } else {
        // 기본 페이지로 이동
        window.location.href = '/chat.html';
    }
}
```

### 5단계: 결과 페이지 재로드 (로그인 상태)
```javascript
// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 로그인 상태 확인
    const userId = localStorage.getItem('albi_user_id');
    const sessionToken = localStorage.getItem('albi_session_token');
    isLoggedIn = !!(userId && sessionToken);  // ✅ true
    
    // 2. 테스트 결과 로드 (localStorage에서)
    const savedResult = localStorage.getItem('testResult');  // ✅ 여전히 존재
    testResult = JSON.parse(savedResult);
    
    // 3. 테스트 데이터 로드
    await loadTestData();
    
    // 4. 결과 표시
    displayResult();  // ✅ 전체 결과 표시
    
    // 5. 로그인 상태이므로 블러 처리 안함
    if (!isLoggedIn) {
        // 실행 안됨
    } else {
        // 마이페이지에 결과 저장
        saveToMyPage();  // ✅
    }
});
```

## 🔑 핵심 포인트

### ✅ localStorage 데이터 보존
```javascript
// 로그인 전
localStorage.setItem('testResult', JSON.stringify(result));

// 로그인 (login.html)
// → testResult는 그대로 유지!

// 로그인 후 (job-test-result.html)
const savedResult = localStorage.getItem('testResult');  // ✅ 여전히 존재
```

### ✅ 리다이렉트 처리
```javascript
// job-test-result.js
function goToLogin() {
    localStorage.setItem('redirect_after_login', '/job-test-result.html');
    window.location.href = '/login.html';
}

// login.html
const redirectUrl = localStorage.getItem('redirect_after_login');
if (redirectUrl) {
    localStorage.removeItem('redirect_after_login');
    window.location.href = redirectUrl;  // → /job-test-result.html
}
```

### ✅ 로그인 상태 체크
```javascript
// 정확한 체크
const userId = localStorage.getItem('albi_user_id');
const sessionToken = localStorage.getItem('albi_session_token');
isLoggedIn = !!(userId && sessionToken);

// ❌ 잘못된 체크 (이전)
const user = localStorage.getItem('user');  // 이건 없음!
isLoggedIn = !!user;
```

## 📊 데이터 흐름도

```
┌─────────────────────────────────────┐
│ 1. 테스트 완료                       │
│    localStorage.testResult = {...}   │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. 결과 페이지 (비로그인)            │
│    - testResult 로드 ✅              │
│    - 기본 정보 표시                  │
│    - 2초 후 블러 + 로그인 프롬프트   │
└───────────────┬─────────────────────┘
                ↓ (로그인 버튼 클릭)
┌─────────────────────────────────────┐
│ 3. goToLogin() 실행                  │
│    localStorage.redirect = result    │
│    → /login.html 이동                │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 4. 로그인 처리                       │
│    - API 호출                        │
│    - 세션 저장                       │
│    - redirect URL 확인               │
│    → /job-test-result.html 이동      │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 5. 결과 페이지 (로그인)              │
│    - testResult 로드 ✅ (여전히 존재)│
│    - 전체 결과 표시                  │
│    - 블러 없음                       │
│    - 마이페이지 저장                 │
└─────────────────────────────────────┘
```

## 🐛 문제 해결

### 문제 1: 로그인 후 결과가 사라짐
**원인**: 로그인 상태 체크가 잘못됨
```javascript
// ❌ 잘못된 체크
const user = localStorage.getItem('user');  // undefined
isLoggedIn = !!user;  // false

// ✅ 올바른 체크
const userId = localStorage.getItem('albi_user_id');
const sessionToken = localStorage.getItem('albi_session_token');
isLoggedIn = !!(userId && sessionToken);
```

### 문제 2: 로그인 후 메인 페이지로 이동
**원인**: 리다이렉트 URL이 localStorage에 저장되지 않음
```javascript
// ❌ 잘못된 방법
window.location.href = '/login.html?redirect=/job-test-result.html';
// login.html이 쿼리 스트링을 읽지 않음!

// ✅ 올바른 방법
localStorage.setItem('redirect_after_login', '/job-test-result.html');
window.location.href = '/login.html';
```

### 문제 3: testResult가 사라짐
**해결**: localStorage는 도메인별로 독립적이므로, 로그인해도 사라지지 않습니다.
- 확인: `localStorage.getItem('testResult')` → 여전히 존재

## ✅ 검증 체크리스트

1. **테스트 완료 후**:
   - [ ] localStorage에 testResult 저장됨
   - [ ] /job-test-result.html로 자동 이동
   - [ ] 기본 정보 표시됨

2. **비로그인 상태**:
   - [ ] 2초 후 블러 처리
   - [ ] 로그인 프롬프트 표시
   - [ ] "로그인하고 결과 보기" 버튼 동작

3. **로그인 버튼 클릭**:
   - [ ] localStorage.redirect_after_login 저장됨
   - [ ] /login.html로 이동

4. **로그인 완료**:
   - [ ] localStorage에 세션 정보 저장
   - [ ] /job-test-result.html로 자동 리다이렉트

5. **로그인 후 결과 페이지**:
   - [ ] testResult 여전히 존재
   - [ ] 전체 결과 표시
   - [ ] 블러 없음
   - [ ] 마이페이지에 저장

## 📱 테스트 시나리오

### 시나리오 1: 정상 플로우
```bash
1. /job-test.html 접속
2. 16문항 완료
3. /job-test-result.html 자동 이동
4. 기본 정보 확인 (블러 전)
5. 2초 대기
6. 블러 처리 + 로그인 프롬프트 확인
7. "로그인하고 결과 보기" 클릭
8. /login.html 이동
9. 로그인 (test@test.com / password)
10. /job-test-result.html 자동 리다이렉트 ✅
11. 전체 결과 확인 (블러 없음) ✅
12. /mypage.html → 적성 테스트 탭 → 결과 확인 ✅
```

### 시나리오 2: 이미 로그인된 상태
```bash
1. 로그인 상태에서 /job-test.html 접속
2. 16문항 완료
3. /job-test-result.html 자동 이동
4. 전체 결과 즉시 표시 (블러 없음) ✅
5. /mypage.html → 적성 테스트 탭 → 결과 자동 저장됨 ✅
```

## 🔐 소셜 로그인 플로우

### 카카오/네이버/구글 로그인

```
1️⃣ 결과 페이지에서 로그인 버튼 클릭
   goToLogin() 실행
   ↓
   localStorage.redirect_after_login = '/job-test-result.html'
   ↓
   /login.html 이동

2️⃣ 소셜 로그인 버튼 클릭 (예: 카카오)
   socialLogin('kakao') 실행
   ↓
   redirect_after_login 확인 (로그 출력)
   ↓
   /api/auth/kakao로 리다이렉트
   ↓
   카카오 로그인 페이지
   ↓
   로그인 완료 후 콜백

3️⃣ OAuth 콜백 처리
   /auth-callback.html?session=XXX&provider=kakao&name=홍길동
   ↓
   localStorage에 세션 정보 저장:
   - albi_session_token
   - albi_user_name
   ↓
   /api/auth/me 호출로 사용자 정보 조회
   ↓
   localStorage에 추가 정보 저장:
   - albi_user_id
   - albi_user_type
   - albi_user_email
   ↓
   redirect_after_login 확인 ✅
   ↓
   저장된 URL로 리다이렉트: /job-test-result.html

4️⃣ 결과 페이지 재로드 (로그인 상태)
   localStorage.testResult 읽기 ✅
   ↓
   전체 결과 표시 (블러 없음)
   ↓
   마이페이지에 자동 저장
```

### 핵심 코드

#### `socialLogin()` 함수 (login.html)
```javascript
function socialLogin(provider) {
  // redirect_after_login 확인 (이미 저장되어 있음)
  const redirectUrl = localStorage.getItem('redirect_after_login');
  if (redirectUrl) {
    console.log('✅ redirect_after_login 설정됨:', redirectUrl);
  }
  
  // OAuth 페이지로 리다이렉트
  // localStorage는 동일 도메인이므로 유지됨!
  window.location.href = `/api/auth/${provider}`;
}
```

#### `auth-callback.html` 콜백 처리
```javascript
// 사용자 정보 저장 후
localStorage.setItem('albi_user_id', data.data.id);
localStorage.setItem('albi_session_token', sessionId);

// 리다이렉트 URL 확인
const redirectUrl = localStorage.getItem('redirect_after_login');

if (redirectUrl) {
  console.log('↪️ 저장된 리다이렉트 URL로 이동:', redirectUrl);
  localStorage.removeItem('redirect_after_login');
  window.location.href = redirectUrl;  // → /job-test-result.html
} else {
  window.location.href = '/';
}
```

### 중요 사항

1. **localStorage 유지**: 
   - OAuth 플로우 중에도 `localStorage`는 유지됨
   - `redirect_after_login`이 소셜 로그인 과정에서 삭제되지 않음

2. **testResult 보존**:
   - `testResult`도 OAuth 플로우 중에 유지됨
   - 로그인 후 결과 페이지에서 정상적으로 읽을 수 있음

3. **콜백 처리**:
   - `auth-callback.html`에서 반드시 `redirect_after_login` 확인
   - 없으면 메인 페이지(`/`)로 이동

## 🔗 관련 파일

- `/public/job-test-result.html` - 결과 페이지 HTML
- `/public/static/job-test-result.js` - 결과 페이지 로직
- `/public/login.html` - 로그인 페이지
- `/public/auth-callback.html` - 소셜 로그인 콜백 처리
- `/public/mypage.html` - 마이페이지 (결과 히스토리)

## 📞 문의
- 이메일: albi260128@gmail.com
- 전화: 010-4459-4226
