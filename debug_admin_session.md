# 관리자 대시보드 401 에러 디버깅 가이드

## 1단계: 로그인 확인

1. **브라우저 개발자 도구 열기** (F12)
2. **Console 탭**에서 다음 명령어 실행:
```javascript
// 저장된 토큰 확인
console.log('Admin Token:', localStorage.getItem('adminToken'));
console.log('Admin User:', localStorage.getItem('adminUser'));
```

## 2단계: 로그인 상태 확인

만약 토큰이 `null`이거나 없다면:
- **로그인을 다시 시도**하세요: https://albi.kr/admin-login.html
- Username: `admin`
- Password: `albi2026!@`

## 3단계: 로그인 응답 확인

로그인 시 **Network 탭**을 열고:
1. `/api/admin/login` 요청 찾기
2. **Response** 탭에서 응답 확인:
   - `success: true`인지 확인
   - `token` 값이 있는지 확인

## 4단계: 세션 만료 확인

토큰이 있는데도 401 에러가 나면:
```javascript
// 수동으로 API 테스트
const token = localStorage.getItem('adminToken');
fetch('https://albi.kr/api/admin/charts', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

## 5단계: 새로 로그인

위 단계들이 모두 실패하면:
1. localStorage 클리어:
```javascript
localStorage.removeItem('adminToken');
localStorage.removeItem('adminUser');
```
2. 로그인 페이지로 이동: https://albi.kr/admin-login.html
3. 다시 로그인 시도

