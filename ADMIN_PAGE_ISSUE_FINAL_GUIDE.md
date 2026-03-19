# 🔧 관리자 페이지 접근 문제 - 최종 해결 가이드

## 🚨 현재 문제 상황

**증상**: 관리자 로그인 후 "면접 세션 통계" 페이지만 표시되고, 원래의 관리자 대시보드(사용자 관리, 포인트 관리 등)가 나오지 않음

**원인**: 브라우저 localStorage에 저장된 인증 토큰이 이전 설정을 유지하고 있음

---

## ✅ 즉시 해결 방법 (3가지 중 선택)

### 방법 1: 로그아웃 헬퍼 페이지 사용 (가장 간단!) ⭐

**다음 URL을 브라우저에 입력하세요:**
```
https://albi.kr/admin-logout.html
```

또는 현재 페이지에서:
1. 주소창에 직접 입력: `https://albi.kr/admin-logout.html`
2. 엔터 키 입력
3. 자동으로 localStorage 초기화 → 로그인 페이지로 이동

---

### 방법 2: 브라우저 콘솔 사용

1. **F12** 키를 눌러 개발자 도구 열기
2. **Console** 탭 선택
3. 다음 명령어 **복사해서 붙여넣기**:
```javascript
localStorage.clear(); location.href='/admin-login.html';
```
4. **Enter** 키 입력

---

### 방법 3: 시크릿/프라이빗 모드 사용

1. 새 시크릿 창 열기:
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Safari: `Cmd + Shift + N`

2. 주소 입력:
```
https://albi.kr/admin-login.html
```

3. 비밀번호 입력: `albi2024!@#`

---

## 📊 로그인 후 정상 화면

로그인 성공 후 다음과 같은 **관리자 대시보드**가 표시되어야 합니다:

```
┌─────────────────────────────────────────────┐
│  🏠 알비 관리자           [로그아웃]         │
├─────────────────────────────────────────────┤
│  📊대시보드 | 👥사용자관리 | 💰포인트관리    │
│  🛒스토어관리 | 💳결제관리 | 📄세금계산서    │
│  ⚠️노쇼관리 | 📋면접세션                    │
└─────────────────────────────────────────────┘
```

**8개 탭 메뉴**가 상단에 표시되며, 기본적으로 "대시보드" 탭이 활성화됩니다.

---

## 🔍 확인 방법

### 올바른 페이지 (관리자 대시보드)
- **URL**: `https://albi.kr/admin-dashboard` 또는 `https://albi.kr/admin-dashboard.html`
- **상단 탭**: 8개 (대시보드, 사용자 관리, 포인트 관리, 스토어 관리, 결제 관리, 세금계산서, 노쇼 관리, 면접 세션)
- **제목**: "관리자 대시보드 - 알비"

### 잘못된 페이지 (독립 모니터링)
- **URL**: `https://albi.kr/session-stats.html`
- **특징**: "면접 세션 모니터링" 타이틀만 표시
- **상단 메시지**: "독립 모니터링 페이지입니다" (파란색 안내)

---

## 🎯 수정된 내용

### 1. 로그인 리다이렉트 수정
```javascript
// Before (잘못됨)
redirect: '/session-stats.html'

// After (정상)
redirect: '/admin-dashboard.html'
```

### 2. 로그아웃 헬퍼 페이지 추가
- **URL**: `/admin-logout.html`
- **기능**: localStorage 자동 초기화 + 로그인 페이지 이동

### 3. session-stats 페이지 개선
- 상단에 안내 메시지 추가
- "대시보드" 버튼 추가 (관리자 대시보드로 이동)

---

## 📱 페이지 구조

```
관리자 시스템
├── 로그인 페이지 (/admin-login.html)
│   └── → 로그인 성공 시
│
├── 관리자 대시보드 (/admin-dashboard.html) ← 여기로 이동!
│   ├── 대시보드 탭
│   ├── 사용자 관리 탭
│   ├── 포인트 관리 탭
│   ├── 스토어 관리 탭
│   ├── 결제 관리 탭
│   ├── 세금계산서 탭
│   ├── 노쇼 관리 탭
│   └── 면접 세션 탭 (통합 버전)
│
├── 면접 세션 통계 (/session-stats.html) ← 독립 모니터링 전용
│   └── 실시간 모니터링 전용 페이지
│
└── 로그아웃 헬퍼 (/admin-logout.html)
    └── localStorage 초기화 도구
```

---

## 🚀 배포 정보

- **최신 배포**: https://27e42013.albi-app.pages.dev
- **커스텀 도메인**: https://albi.kr
- **배포 시간**: 2026-03-04 14:55
- **Git 커밋**: `fix: Add admin logout helper page and improve session-stats navigation`

---

## 💡 추가 팁

### localStorage 확인 방법
F12 → Application 탭 → Local Storage → https://albi.kr
- `admin_token` 또는 `adminToken` 키가 있으면 로그인 상태

### 완전 초기화
```javascript
// 콘솔에서 실행
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📞 문제가 계속되면

1. **캐시 제거**: Ctrl+Shift+Delete → 캐시/쿠키 삭제
2. **다른 브라우저 시도**: Chrome, Firefox, Edge 등
3. **로그 확인**: F12 → Console 탭에서 에러 메시지 확인

---

**작성일**: 2026-03-04 14:55
**상태**: ✅ 해결 방법 제공
**우선순위**: ⭐ 로그아웃 헬퍼 페이지 사용 권장
