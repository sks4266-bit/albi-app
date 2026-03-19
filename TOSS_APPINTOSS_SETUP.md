# 🎯 토스 앱인토스(Apps in Toss) 연동 해제 콜백 설정 가이드

## 📋 **개요**

토스 앱인토스 서비스에서 사용자가 "로그인 연결 해제"를 할 때, 파트너사 서버로 이벤트를 전달받아 처리하는 웹훅입니다.

---

## 🔧 **1. 앱인토스 콘솔 설정 정보**

### ✅ **입력해야 할 정보**

| 항목 | 값 | 설명 |
|------|-----|------|
| **콜백 URL** | `https://albi.kr/api/auth/toss-unlink` | 연동 해제 시 호출될 엔드포인트 |
| **HTTP 메서드** | `POST` | POST 방식 권장 (보안상 안전) |
| **Basic Auth 헤더** | `YOUR_TOSS_CLIENT_ID:YOUR_TOSS_CLIENT_SECRET` | **평문으로 입력** (자동 Base64 인코딩됨) |

### ⚠️ **Basic Auth 헤더 입력 시 주의사항**

```
❌ 잘못된 예시 (Base64 인코딩된 값 입력):
dG9zc19jbGllbnRfaWQ6dG9zc19jbGllbnRfc2VjcmV0

✅ 올바른 예시 (평문으로 입력):
toss_client_id:toss_client_secret
```

- **콜론(`:`)으로 구분하여 평문으로 입력하세요**
- 앱인토스가 자동으로 Base64 인코딩하여 헤더에 담아 전송합니다
- 스페이스나 줄바꿈 없이 정확히 입력하세요

---

## 📍 **2. 콜백 URL 설정 경로**

1. **앱인토스 콘솔 접속**: https://console-apps-in-toss.toss.im/
2. **대표 관리자 계정으로 로그인**
3. **워크스페이스 선택**
4. **미니앱 선택**
5. **좌측 메뉴 > "토스 로그인" 선택**
6. **"연결 끊기 콜백 정보" 섹션으로 이동**
7. **위 정보 입력 후 저장**

---

## 🔐 **3. Cloudflare 환경변수 설정**

콜백 인증을 위해 다음 환경변수를 설정해야 합니다:

### **로컬 개발 환경 (.dev.vars)**

```bash
# 토스 앱인토스 인증 정보
TOSS_CLIENT_ID=your_toss_client_id_here
TOSS_CLIENT_SECRET=your_toss_client_secret_here
```

### **프로덕션 환경 (Wrangler Secrets)**

```bash
# TOSS_CLIENT_ID 설정
npx wrangler pages secret put TOSS_CLIENT_ID --project-name albi-app
# 입력 프롬프트에서 실제 값 입력

# TOSS_CLIENT_SECRET 설정
npx wrangler pages secret put TOSS_CLIENT_SECRET --project-name albi-app
# 입력 프롬프트에서 실제 값 입력
```

---

## 🗄️ **4. 데이터베이스 마이그레이션**

토스 userKey를 저장하기 위해 DB 마이그레이션을 실행해야 합니다:

### **로컬 개발 환경**

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply albi-app-production --local
```

### **프로덕션 환경**

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply albi-app-production
```

**마이그레이션 내용** (`migrations/0050_add_toss_user_key.sql`):
```sql
ALTER TABLE users ADD COLUMN toss_user_key TEXT;
CREATE INDEX IF NOT EXISTS idx_users_toss_user_key ON users(toss_user_key);
```

---

## 🔄 **5. 연동 해제 콜백 처리 흐름**

```
1. 사용자가 토스 앱에서 "연결 끊기" 버튼 클릭
   ↓
2. 토스 서버가 콜백 URL로 POST 요청 전송
   Header: Authorization: Basic <Base64(CLIENT_ID:CLIENT_SECRET)>
   Body: { "userKey": "443731104" }
   ↓
3. albi.kr 서버가 Basic Auth 검증
   ↓
4. DB에서 toss_user_key로 사용자 조회
   ↓
5. users.toss_user_key = NULL 업데이트
   ↓
6. 해당 사용자의 모든 세션 삭제
   ↓
7. 성공 응답 반환: { "success": true }
```

---

## 📡 **6. 연동 해제 이벤트 경로 (referrer)**

앱인토스는 연동 해제 경로에 따라 `referrer` 값을 전달할 수 있습니다:

| referrer | 설명 | 처리 방법 |
|----------|------|----------|
| `UNLINK` | 토스 앱 > 설정 > 토스로 로그인한 서비스 > 연결 끊기 | 로그아웃 처리 |
| `WITHDRAWAL_TERMS` | 토스 앱 > 설정 > 약관 및 개인정보 처리 동의 > 동의 철회 | 로그아웃 처리 |
| `WITHDRAWAL_TOSS` | 토스 회원 탈퇴 | 로그아웃 처리 |

---

## 🧪 **7. 테스트 방법**

### **방법 1: 앱인토스 콘솔 테스트**

1. 앱인토스 콘솔 > 토스 로그인 > 연결 끊기 콜백 정보
2. **"테스트 전송"** 버튼 클릭
3. 응답 확인: `{ "success": true }`

### **방법 2: curl 명령어 테스트**

```bash
# Base64 인코딩 (CLIENT_ID:CLIENT_SECRET)
echo -n "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" | base64
# 결과 예시: dG9zc19jbGllbnRfaWQ6dG9zc19jbGllbnRfc2VjcmV0

# POST 방식 테스트 (JSON)
curl -X POST https://albi.kr/api/auth/toss-unlink \
  -H "Authorization: Basic <BASE64_ENCODED_CREDENTIALS>" \
  -H "Content-Type: application/json" \
  -d '{"userKey":"443731104"}'

# GET 방식 테스트 (Query Parameter)
curl -X GET "https://albi.kr/api/auth/toss-unlink?userKey=443731104" \
  -H "Authorization: Basic <BASE64_ENCODED_CREDENTIALS>"
```

### **예상 응답**

**성공 시:**
```json
{
  "success": true,
  "message": "Toss account unlinked successfully",
  "user_id": "user-1234567890-abc123"
}
```

**사용자 없음 (이미 삭제됨):**
```json
{
  "success": true,
  "message": "User not found but unlink accepted"
}
```

**인증 실패 시:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## 🔍 **8. 로그 확인**

### **로컬 개발 환경**

```bash
# PM2 로그 확인
pm2 logs albi-app --nostream

# 또는 Wrangler 로그
cd /home/user/webapp
npx wrangler pages dev dist --d1=albi-app-production --local --ip 0.0.0.0 --port 3000
```

### **프로덕션 환경**

```bash
# Cloudflare Pages 실시간 로그 확인
npx wrangler pages deployment tail --project-name albi-app
```

**로그 예시:**
```
[Toss Unlink] Request received: { userKey: '443731104', method: 'POST' }
[Toss Unlink] User found: user-abc123 홍길동
✅ [Toss Unlink] Successfully unlinked: user-abc123
✅ [Toss Unlink] Sessions deleted: user-abc123
```

---

## 🚨 **9. 트러블슈팅**

### **문제 1: 401 Unauthorized**

**원인:**
- Basic Auth 헤더가 잘못 설정됨
- CLIENT_ID 또는 CLIENT_SECRET이 일치하지 않음

**해결:**
1. 앱인토스 콘솔에서 Basic Auth 헤더 재확인 (평문으로 입력했는지 확인)
2. Cloudflare 환경변수 확인: `npx wrangler pages secret list --project-name albi-app`
3. 환경변수 재설정: `npx wrangler pages secret put TOSS_CLIENT_ID --project-name albi-app`

### **문제 2: 400 Missing userKey**

**원인:**
- 요청 body 또는 query parameter에 userKey가 없음
- Content-Type이 잘못 설정됨

**해결:**
1. POST 방식: `Content-Type: application/json` 확인
2. 요청 body 확인: `{"userKey": "443731104"}`
3. GET 방식: URL에 query parameter 확인: `?userKey=443731104`

### **문제 3: 500 Internal Server Error**

**원인:**
- DB 연결 오류
- 마이그레이션이 실행되지 않음 (toss_user_key 컬럼 없음)

**해결:**
1. DB 마이그레이션 실행: `npx wrangler d1 migrations apply albi-app-production --local`
2. 프로덕션 마이그레이션: `npx wrangler d1 migrations apply albi-app-production`
3. 로그 확인: `pm2 logs albi-app --nostream`

### **문제 4: 콜백이 호출되지 않음**

**원인:**
- 앱인토스 콘솔에 잘못된 URL 입력
- 방화벽 또는 네트워크 차단

**해결:**
1. 콜백 URL 재확인: `https://albi.kr/api/auth/toss-unlink` (정확히 입력)
2. HTTPS 사용 확인 (HTTP는 안 됨)
3. 앱인토스 콘솔 > "테스트 전송"으로 확인

---

## ✅ **10. 체크리스트**

### **설정 완료 체크리스트**

- [ ] 앱인토스 콘솔에 콜백 URL 등록 완료
- [ ] HTTP 메서드 POST 선택
- [ ] Basic Auth 헤더 평문으로 입력 (CLIENT_ID:CLIENT_SECRET)
- [ ] Cloudflare 환경변수 설정 완료 (TOSS_CLIENT_ID, TOSS_CLIENT_SECRET)
- [ ] DB 마이그레이션 실행 완료 (로컬 + 프로덕션)
- [ ] 로컬 환경 테스트 완료
- [ ] 프로덕션 배포 완료
- [ ] curl 테스트 성공
- [ ] 앱인토스 콘솔 "테스트 전송" 성공

### **모니터링 체크리스트**

- [ ] Cloudflare Pages 로그 모니터링 설정
- [ ] 알림 설정 (에러 발생 시 알림)
- [ ] 주기적인 테스트 (매주 1회)

---

## 📚 **11. 참고 자료**

- **앱인토스 공식 문서**: https://developers-apps-in-toss.toss.im/login/store-login.html
- **앱인토스 콘솔 가이드**: https://developers-apps-in-toss.toss.im/login/console.html
- **앱인토스 개발자 커뮤니티**: https://techchat-apps-in-toss.toss.im/

---

## 🎯 **12. 빠른 시작 (Quick Start)**

```bash
# 1. DB 마이그레이션
cd /home/user/webapp
npx wrangler d1 migrations apply albi-app-production --local

# 2. 환경변수 설정 (.dev.vars 파일 생성)
echo "TOSS_CLIENT_ID=your_client_id" >> .dev.vars
echo "TOSS_CLIENT_SECRET=your_client_secret" >> .dev.vars

# 3. 로컬 테스트
npm run build
pm2 start ecosystem.config.cjs

# 4. 테스트 요청
curl -X POST http://localhost:3000/api/auth/toss-unlink \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"userKey":"test_user_key"}'

# 5. 프로덕션 배포
npx wrangler d1 migrations apply albi-app-production
npx wrangler pages secret put TOSS_CLIENT_ID --project-name albi-app
npx wrangler pages secret put TOSS_CLIENT_SECRET --project-name albi-app
npm run deploy
```

---

**✨ 이제 앱인토스 콘솔에서 위 정보를 입력하고 테스트하세요!**
