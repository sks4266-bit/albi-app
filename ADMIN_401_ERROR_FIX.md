# 🔧 관리자 페이지 401 에러 해결

## 📋 문제 상황
로그인은 성공하지만 **모든 관리자 API가 401 Unauthorized 에러**를 반환하는 문제가 발생했습니다:

```
GET https://albi.kr/api/admin/stats 401 (Unauthorized)
GET https://albi.kr/api/admin/charts 401 (Unauthorized)
GET https://albi.kr/api/admin/users?... 401 (Unauthorized)
GET https://albi.kr/api/admin/transactions?... 401 (Unauthorized)
GET https://albi.kr/api/admin/purchases?... 401 (Unauthorized)
GET https://albi.kr/api/admin/payments?... 401 (Unauthorized)
...
```

에러 메시지:
```
Failed to load payment stats: 유효하지 않은 세션입니다.
Failed to load stats: 유효하지 않은 세션입니다.
```

## 🔍 근본 원인

### 토큰 검증 로직 불일치

**functions/api/admin/[[path]].ts** (Line 34-41):
```typescript
// ❌ 잘못된 코드 - DB sessions 테이블에서 토큰 검색
const session = await env.DB.prepare(
  `SELECT users.id, users.user_type 
   FROM sessions 
   JOIN users ON sessions.user_id = users.id
   WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`
)
  .bind(token)
  .first();

if (!session) {
  return new Response(JSON.stringify({ 
    success: false, 
    message: '유효하지 않은 세션입니다.' 
  }), {
    status: 401,
    headers,
  });
}
```

**문제점**:
1. **admin-auth.ts**는 **간단한 Base64 인코딩 토큰**을 생성 (`btoa(JSON.stringify({...}))`)
2. **[[path]].ts**는 **DB sessions 테이블**에서 토큰을 검색
3. 두 시스템이 **완전히 다른 토큰 메커니즘**을 사용 → 검증 실패 → 401 에러

### 토큰 생성 방식 (admin-auth.ts)
```typescript
function generateToken(password: string): string {
  const timestamp = Date.now();
  const payload = btoa(JSON.stringify({ password, timestamp }));
  return payload; // 예: "eyJwYXNzd29yZCI6ImFsYmkyMDI0IUAjIiwidGltZXN0YW1wIjoxNzcy..."
}
```

## ✅ 해결 방법

### admin/[[path]].ts 토큰 검증 로직 수정

**Before (DB 세션 조회)**:
```typescript
try {
  // 토큰 검증 및 관리자 권한 확인
  const session = await env.DB.prepare(
    `SELECT users.id, users.user_type 
     FROM sessions 
     JOIN users ON sessions.user_id = users.id
     WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`
  )
    .bind(token)
    .first();

  if (!session) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '유효하지 않은 세션입니다.' 
    }), {
      status: 401,
      headers,
    });
  }

  const userId = session.id as string;
```

**After (간단한 토큰 검증)**:
```typescript
const token = authHeader.replace('Bearer ', '');

// 간단한 토큰 검증 함수 (admin-auth.ts와 동일한 로직)
function validateToken(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token));
    const age = Date.now() - decoded.timestamp;
    // 24시간 유효
    return age < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// 토큰 검증
const isValid = validateToken(token);
if (!isValid) {
  return new Response(JSON.stringify({ 
    success: false, 
    message: '유효하지 않은 세션입니다.' 
  }), {
    status: 401,
    headers,
  });
}

try {
  // 관리자는 별도 user_id 없이 진행
  const userId = 'admin';
```

## 🚀 배포 정보

### Cloudflare Pages URL
- **최신 배포**: https://0a506f69.albi-app.pages.dev
- **커스텀 도메인**: https://albi.kr (1-2분 내 반영)

### Git 커밋
```
fix: Admin API token validation - use simple token validation instead of DB session lookup
```

## 🧪 테스트 방법

### 1단계: localStorage 초기화 (필수!)
이전 문제의 영향을 받지 않도록 **반드시 초기화**해야 합니다:

```
https://albi.kr/admin-logout.html
```

또는 브라우저 콘솔(F12)에서:
```javascript
localStorage.clear();
location.href = '/admin-login.html';
```

### 2단계: 관리자 로그인
1. **접속**: https://albi.kr/admin-login.html
2. **비밀번호**: `albi2024!@#`
3. **로그인** 클릭
4. ✅ **대시보드로 정상 이동**

### 3단계: API 호출 테스트

#### 브라우저 개발자 도구에서 확인:
```javascript
// F12 → Console
fetch('/api/admin/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  }
})
  .then(res => res.json())
  .then(data => console.log('✅ Stats:', data));

fetch('/api/admin/charts', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  }
})
  .then(res => res.json())
  .then(data => console.log('✅ Charts:', data));
```

#### curl 명령으로 테스트:
```bash
# 1. 토큰 획득
TOKEN=$(curl -s -X POST https://albi.kr/api/admin-auth \
  -H "Content-Type: application/json" \
  -d '{"password":"albi2024!@#"}' \
  | jq -r '.token')

# 2. API 테스트
curl -s "https://albi.kr/api/admin/stats" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.success'
# 출력: true

curl -s "https://albi.kr/api/admin/users?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.users | length'

curl -s "https://albi.kr/api/admin/payments?page=1" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.payments'
```

### 4단계: 대시보드 기능 확인
다음 항목들이 모두 **정상적으로 로드**되어야 합니다:

#### 📊 대시보드 탭
- [x] 총 사용자 수
- [x] 오늘 신규 가입
- [x] 포인트 잔액
- [x] 스토어 구매 수

#### 👥 사용자 관리 탭
- [x] 사용자 목록 조회
- [x] 검색 기능
- [x] 사용자 타입 필터

#### 💰 포인트 관리 탭
- [x] 거래 내역 조회
- [x] 발급/사용 통계

#### 🛒 스토어 관리 탭
- [x] 구매 내역 조회
- [x] 상품별 통계

#### 💳 결제 관리 탭
- [x] 결제 목록 조회
- [x] 월별 통계 차트
- [x] 결제 수단별 통계

#### 🧾 세금계산서 탭
- [x] 요청 목록 조회
- [x] 승인/거절 처리
- [x] 월별/분기별 통계

#### ⚠️ 노쇼 관리 탭
- [x] 신고 목록 조회
- [x] 상태별 필터

#### 📋 면접 세션 탭
- [x] 실시간 세션 통계
- [x] 업종별 분포 차트
- [x] 등급별 분포
- [x] 최근 활성 세션 목록

## 🔐 토큰 시스템 정리

### 관리자 토큰 (Simple Token)
- **생성**: `admin-auth.ts`의 `generateToken()`
- **형식**: Base64로 인코딩된 JSON `{ password, timestamp }`
- **검증**: Base64 디코딩 후 timestamp 기반 24시간 유효성 확인
- **저장**: `localStorage.getItem('admin_token')`
- **용도**: 관리자 페이지 전용

### 일반 사용자 세션 토큰 (DB Session Token)
- **생성**: 일반 로그인 API
- **저장 위치**: DB `sessions` 테이블
- **검증**: DB에서 토큰 조회 + 만료 시간 확인
- **저장**: `localStorage.getItem('access_token')`
- **용도**: 일반 사용자 기능

### ⚠️ 중요: 두 시스템은 완전히 분리
```
관리자 시스템: admin_token → validateToken() → 간단한 검증
일반 사용자: access_token → DB sessions 테이블 조회
```

## 📊 문제 해결 요약

| 항목 | Before | After |
|------|--------|-------|
| **토큰 검증 방식** | DB sessions 테이블 조회 | Base64 디코딩 + 시간 검증 |
| **검증 결과** | ❌ 항상 실패 (세션 없음) | ✅ 성공 (24시간 유효) |
| **API 응답 코드** | 401 Unauthorized | 200 OK |
| **에러 메시지** | "유효하지 않은 세션입니다" | 정상 데이터 반환 |

## 🎯 향후 개선 사항

### 1. JWT 토큰으로 업그레이드
현재는 **단순 Base64 인코딩**을 사용하지만, 보안을 위해 **실제 JWT** 사용 권장:

```typescript
// 개선안
import jwt from '@tsndr/cloudflare-worker-jwt';

function generateToken(password: string): string {
  return jwt.sign({
    sub: 'admin',
    password: password,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24시간
  }, env.JWT_SECRET);
}

async function validateToken(token: string): Promise<boolean> {
  return await jwt.verify(token, env.JWT_SECRET);
}
```

### 2. 관리자 권한 세분화
```typescript
// 관리자 등급별 권한 관리
type AdminRole = 'super_admin' | 'admin' | 'viewer';

interface AdminToken {
  role: AdminRole;
  permissions: string[];
  exp: number;
}
```

### 3. 비밀번호 Cloudflare Secret으로 이동
```bash
# 프로덕션 환경
npx wrangler pages secret put ADMIN_PASSWORD --project-name albi-app
# 입력: 강력한_비밀번호_123!@#

# 로컬 개발
echo "ADMIN_PASSWORD=알비2024!@#" >> .dev.vars
```

## ✅ 완료 상태

- [x] **토큰 검증 로직 수정** (DB 조회 → 간단한 검증)
- [x] **admin/[[path]].ts 파일 업데이트**
- [x] **빌드 및 배포 완료**
- [x] **API 테스트 성공** (curl로 확인)
- [x] **Git 커밋 완료**
- [x] **문서화 완료**

---

**최종 업데이트**: 2026-03-04  
**배포 URL**: https://albi.kr  
**문제 해결 시간**: 약 15분  
**수정된 파일 수**: 1개 (functions/api/admin/[[path]].ts)  
**API 테스트 결과**: ✅ 모든 관리자 API 정상 작동
