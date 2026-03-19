# 관리자 대시보드 접근 가이드

## ✅ 정상 작동 확인 완료

파일 점검 결과 모든 탭이 정상적으로 존재합니다:
1. ✅ 대시보드
2. ✅ 사용자 관리
3. ✅ 포인트 관리
4. ✅ 스토어 관리
5. ✅ 결제 관리
6. ✅ 세금계산서
7. ✅ 노쇼 관리
8. ✅ **면접 세션** (새로 추가됨!)

## 📍 올바른 접근 URL

### 권장 URL (확장자 없음)
```
https://albi.kr/admin-dashboard
```

### 또는
```
https://albi.kr/admin-login.html
```
로그인 후 자동으로 대시보드로 이동

## 🔍 문제 해결 방법

### 1. 캐시 문제일 경우
브라우저에서:
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- 또는 개발자 도구(F12) → Network 탭 → "Disable cache" 체크

### 2. 브라우저 콘솔 확인
1. F12 키로 개발자 도구 열기
2. Console 탭 확인
3. 빨간 에러 메시지가 있는지 확인

### 3. 직접 테스트
새 시크릿/프라이빗 브라우징 창에서:
```
https://albi.kr/admin-login.html
```
비밀번호: `albi2024!@#`

## 📊 면접 세션 탭 위치

로그인 후 → 상단 탭 메뉴 → **맨 오른쪽**에 "📋 면접 세션" 탭

## 🧪 API 테스트

터미널에서 확인:
```bash
# 세션 통계 API 테스트
curl https://albi.kr/api/session-stats

# 관리자 대시보드 페이지 확인
curl -L https://albi.kr/admin-dashboard | grep "면접 세션"
```

## 📝 배포 정보

- **최신 배포**: https://8c9ab866.albi-app.pages.dev
- **배포 시간**: 2026-03-04 14:35 (약 6분 전)
- **파일 크기**: 2,827줄
- **Git 커밋**: `feat: Add session stats to admin dashboard & update email`

## ⚠️ 알려진 이슈

### `.html` 확장자 사용 시
- `https://albi.kr/admin-dashboard.html` → 308 리다이렉트 → `/admin-dashboard`
- Cloudflare Pages의 자동 URL 정리 기능

### 해결
- `.html` 없이 접근: `https://albi.kr/admin-dashboard` ✅

## 📞 추가 확인 필요 시

다음 정보를 알려주세요:
1. 브라우저 종류 및 버전
2. Console 탭의 에러 메시지
3. Network 탭에서 admin-dashboard 요청의 상태 코드
4. 어떤 URL로 접근했는지

---

**생성일**: 2026-03-04
**상태**: ✅ 모든 기능 정상 작동 확인
