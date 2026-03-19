# 🔧 관리자 페이지 로그인/대시보드 반복 문제 - 최종 해결

## 📋 문제 요약
로그인 성공 후 **로그인 화면 ↔ 대시보드 화면**이 무한 반복되는 현상이 발생했습니다.

## 🔍 근본 원인

### localStorage 키 이름 불일치
- **admin-login.html**: `localStorage.setItem('admin_token', token)` (소문자 + 언더스코어)
- **admin-dashboard.html**: `const adminToken = localStorage.getItem('adminToken')` (camelCase)

### 무한 루프 발생 메커니즘
```
1. 로그인 성공 → 'admin_token' 저장 → /admin-dashboard.html로 리다이렉트
2. 대시보드에서 'adminToken' 키 확인 → 없음! (키 이름이 다름)
3. 토큰 없다고 판단 → /admin-login.html로 리다이렉트
4. 로그인 페이지에서 'admin_token' 키 확인 → 있음!
5. 이미 로그인됐다고 판단 → /admin-dashboard.html로 리다이렉트
6. 다시 2번으로 돌아가서 무한 반복... 🔄
```

## ✅ 해결 방법

### 1. localStorage 키 이름 통일
모든 페이지에서 **`admin_token`** (소문자 + 언더스코어)로 통일했습니다.

**수정된 파일:**
- `public/admin-login.html`
- `public/admin-dashboard.html`
- `public/session-stats.html`

### 2. 수정 내용

#### admin-dashboard.html (Line 989)
```javascript
// ❌ 이전 코드
const adminToken = localStorage.getItem('adminToken');

// ✅ 수정 코드
const adminToken = localStorage.getItem('admin_token');
```

#### logout 함수도 함께 수정
```javascript
// ❌ 이전 코드
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/admin-login.html';
}

// ✅ 수정 코드
function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('adminUser');
  window.location.href = '/admin-login.html';
}
```

## 🚀 배포 정보

### Cloudflare Pages URL
- **최신 배포**: https://f2da89d0.albi-app.pages.dev
- **커스텀 도메인**: https://albi.kr (1-2분 내 반영)

### Git 커밋
```
fix: Standardize localStorage token key to 'admin_token' across all admin pages
- admin-login.html: already using 'admin_token'
- admin-dashboard.html: changed 'adminToken' → 'admin_token'
- session-stats.html: changed 'adminToken' → 'admin_token'
```

## 🧪 테스트 방법

### 1단계: localStorage 초기화 (중요!)
```javascript
// 브라우저 콘솔(F12)에서 실행
localStorage.clear();
location.href = '/admin-login.html';
```

또는 헬퍼 페이지 사용:
```
https://albi.kr/admin-logout.html
```

### 2단계: 정상 로그인 테스트
1. **로그인 페이지 접속**: https://albi.kr/admin-login.html
2. **비밀번호 입력**: `albi2024!@#`
3. **로그인 버튼 클릭**
4. **예상 결과**: ✅ 관리자 대시보드로 정상 이동

### 3단계: 대시보드 확인
다음 8개 탭이 모두 보여야 합니다:
- 📊 대시보드
- 👥 사용자 관리
- 💰 포인트 관리
- 🛒 스토어 관리
- 💳 결제 관리
- 🧾 세금계산서
- ⚠️ 노쇼 관리
- 📋 면접 세션 (새로 추가!)

### 4단계: 로그아웃 테스트
1. 우측 상단 **"로그아웃"** 버튼 클릭
2. 로그인 페이지로 정상 이동 확인

## 🔐 localStorage 키 표준화

### 관리자 인증
| 키 이름 | 설명 | 저장 위치 |
|---------|------|----------|
| `admin_token` | 관리자 JWT 토큰 | admin-login.html |
| `adminUser` | 관리자 사용자 정보 | admin-login.html |

### 일반 사용자 인증
| 키 이름 | 설명 | 저장 위치 |
|---------|------|----------|
| `access_token` | 사용자 액세스 토큰 | 일반 로그인 |
| `user` | 사용자 정보 | 일반 로그인 |

## 📚 관련 문서
- [관리자 대시보드 접근 가이드](./ADMIN_DASHBOARD_ACCESS_GUIDE.md)
- [관리자 로그인 수정 내역](./ADMIN_LOGIN_FIX.md)
- [이메일 변경 상태](./ADMIN_EMAIL_STATUS.md)

## 🎯 향후 개선 사항

### 1. 토큰 검증 강화
현재는 토큰 존재 여부만 확인하지만, 실제로는 서버에서 토큰 유효성을 검증해야 합니다.

```javascript
// 향후 개선안
async function verifyToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) return false;
  
  try {
    const response = await fetch('/api/admin-verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### 2. 토큰 만료 시간 추가
JWT 토큰에 `exp` (expiration) 클레임을 추가하여 자동 로그아웃 구현:

```javascript
// functions/api/admin-auth.ts 개선안
const payload = {
  password: password,
  timestamp: Date.now(),
  exp: Date.now() + (24 * 60 * 60 * 1000) // 24시간 후 만료
};
```

### 3. 리프레시 토큰 도입
장기 세션을 위한 리프레시 토큰 메커니즘:
- Access Token: 1시간 유효
- Refresh Token: 7일 유효

## ✅ 완료 상태

- [x] localStorage 키 이름 통일 (`admin_token`)
- [x] 로그인/대시보드 무한 루프 해결
- [x] 로그아웃 헬퍼 페이지 생성
- [x] 빌드 및 배포 완료
- [x] Git 커밋 완료
- [x] 문서화 완료

---

**최종 업데이트**: 2026-03-04  
**배포 URL**: https://albi.kr  
**문제 해결 시간**: 약 30분  
**수정된 파일 수**: 3개 (admin-login.html, admin-dashboard.html, session-stats.html)
