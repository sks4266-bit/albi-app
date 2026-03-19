# 🔐 관리자 페이지 및 이메일 상태 보고서

## 📋 관리자 페이지 현황

### ✅ 파일 존재 여부
- **관리자 로그인**: `/admin-login.html` ✅
- **관리자 대시보드**: `/admin-dashboard.html` ✅
- **인증 API**: `/api/admin-auth` ✅

### 🔑 로그인 정보

#### 기본 비밀번호
```
albi2024!@#
```

#### 로그인 방법
1. 페이지 접속: `https://albi.kr/admin-login.html`
2. 비밀번호 입력: `albi2024!@#`
3. 로그인 버튼 클릭

#### API 테스트 결과
```bash
# POST /api/admin-auth
curl -X POST https://albi.kr/api/admin-auth \
  -H "Content-Type: application/json" \
  -d '{"password": "albi2024!@#"}'

# 응답
{
  "success": true,
  "token": "eyJwYXNzd29yZCI6ImFsYmkyMDI0IUAjIiwidGltZXN0YW1wIjoxNzcyNjM0MDI0NzEwfQ==",
  "message": "로그인 성공"
}
```

✅ **API는 정상 작동 중!**

### ⚠️ 현재 이슈

**admin 페이지 접근 시 308 리다이렉트 발생**
- 파일은 dist/에 있음
- Cloudflare Pages 라우팅 설정 문제로 추정
- API는 정상 작동 (/api/admin-auth 접근 가능)

### 🔒 보안 설정

#### 현재 설정
- 기본 비밀번호: `albi2024!@#` (코드에 하드코딩)
- 토큰 유효기간: 24시간
- JWT 간단 구현 (Base64 인코딩)

#### 프로덕션 권장사항
```bash
# Cloudflare secret으로 비밀번호 설정
npx wrangler pages secret put ADMIN_PASSWORD --project-name albi-app

# 입력 프롬프트:
# Enter a secret value: [your-strong-password]
```

---

## 📧 이메일 (albi260128@gmail.com) 현황

### 📊 사용 현황
- **총 참조 횟수**: 16곳
- **주요 사용처**:
  1. 결제 페이지 (payment.html)
  2. 결제 실패 페이지 (payment-fail.html)
  3. 멘토 채팅 (mentor-chat.html)
  4. 404 에러 페이지
  5. 결제 내역 (payment-history.html)
  6. 추천 공고 (recommended-jobs.html)
  7. 이메일 발송 API (send-email.ts)

### ⚠️ 이메일 사용 가능 여부

**현재 상태**: ❌ **사용 불가능**

#### 이유
1. **도메인 미소유**: `albi.kr` 도메인이 사용자 소유가 아닐 가능성
2. **이메일 서버 미설정**: 이메일 수신을 위한 MX 레코드 설정 필요
3. **이메일 서비스 미연동**: Gmail, Outlook, 또는 전문 이메일 서비스 필요

#### 확인 방법
```bash
# 도메인 MX 레코드 확인
nslookup -type=MX albi.kr

# 또는
dig albi.kr MX
```

### 📝 이메일 사용을 위한 설정 방법

#### 옵션 1: Gmail/Google Workspace (권장)
1. Google Workspace 가입 (월 $6/사용자)
2. 도메인 소유권 인증
3. MX 레코드 설정
4. albi260128@gmail.com 계정 생성

#### 옵션 2: Cloudflare Email Routing (무료)
1. Cloudflare 대시보드 → Email → Email Routing
2. 이메일 라우팅 활성화
3. `albi260128@gmail.com` → 개인 이메일로 포워딩 설정
4. MX 레코드 자동 설정됨

#### 옵션 3: SendGrid/Mailgun (이메일 발송 전용)
1. SendGrid/Mailgun 계정 생성
2. API 키 발급
3. 도메인 인증
4. 발송 전용 (수신 불가)

### 🔄 임시 대안

사용자가 이메일 수신이 불가능한 경우:

1. **개인 이메일로 변경**
   ```bash
   # 모든 albi260128@gmail.com을 개인 이메일로 교체
   find . -name "*.html" -type f -exec sed -i 's/support@albi\.kr/your-email@gmail.com/g' {} +
   ```

2. **문의 폼 사용**
   - 이메일 링크 대신 `/contact.html` 문의 폼으로 리다이렉트

3. **카카오톡 채널 연동**
   - 카카오톡 채널 링크로 대체

---

## 🛠️ 해결 방안

### 1. 관리자 페이지 접근 문제 해결

```bash
# _routes.json 확인 및 수정 필요
# admin-*.html 파일이 제외되지 않도록 설정
```

**또는**

직접 배포된 파일 확인:
```
https://afc23813.albi-app.pages.dev/admin-login.html
```

### 2. 이메일 설정

#### A. 도메인 소유 확인
```bash
whois albi.kr
```

#### B. Cloudflare Email Routing 설정 (가장 간단)
1. Cloudflare 대시보드 로그인
2. albi.kr 선택
3. Email → Email Routing
4. 포워딩 규칙 추가: albi260128@gmail.com → [your-email]

#### C. MX 레코드 설정 확인
```
Name: @
Type: MX
Priority: 10
Content: [메일서버 주소]
```

---

## 📌 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 관리자 페이지 파일 | ✅ 존재 | dist/에 빌드됨 |
| 관리자 API | ✅ 작동 | 로그인 성공 확인 |
| 관리자 페이지 접근 | ⚠️ 이슈 | 308 리다이렉트 발생 |
| 로그인 비밀번호 | ✅ 확인 | `albi2024!@#` |
| albi260128@gmail.com | ❌ 미설정 | 이메일 서버 설정 필요 |
| 이메일 참조 | ✅ 16곳 | 코드에 사용 중 |

---

## 🚀 다음 단계

### 우선순위 1: 관리자 페이지 접근 해결
- 라우팅 설정 확인
- 재배포 필요 가능성

### 우선순위 2: 이메일 설정
- Cloudflare Email Routing 활성화 (무료)
- 또는 개인 이메일로 임시 변경

### 우선순위 3: 보안 강화
- Cloudflare secret으로 관리자 비밀번호 설정
- JWT 라이브러리 사용 (현재는 Base64만 사용)

---

생성일: 2026-03-04
