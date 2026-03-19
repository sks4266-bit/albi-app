# 🔐 Albi Production Deployment Guide

## 📋 목차
1. [Cloudflare Secrets 설정](#cloudflare-secrets-설정)
2. [Resend API 키 발급](#resend-api-키-발급)
3. [Toss Payments 라이브 키 발급](#toss-payments-라이브-키-발급)
4. [Cron Trigger 설정](#cron-trigger-설정)
5. [배포 및 확인](#배포-및-확인)

---

## 🔑 Cloudflare Secrets 설정

### 1. OpenAI API (GenSpark Proxy)
이미 `.dev.vars`에 설정되어 있습니다. 프로덕션에 적용:

```bash
# 현재 키 확인
echo $OPENAI_API_KEY

# Cloudflare에 설정
cd /home/user/webapp
npx wrangler secret put OPENAI_API_KEY --env production
# 입력 프롬프트에서: gsk-eyJjb2dlbl9pZCI6ImFkYTNiYjhlLTkyZmEtNDU2Yy1hMTEwLWRhZmQyNWJjMWUwYyIsImtleV9pZCI6ImE4NmZjNDI5LTVjNDItNGY3Yi1hMmFiLWRiNzc2YjgzZThkOSIsImN0aW1lIjoxNzcyMjIwNjk2LCJjbGF1ZGVfYmlnX21vZGVsIjpudWxsLCJjbGF1ZGVfbWlkZGxlX21vZGVsIjpudWxsLCJjbGF1ZGVfc21hbGxfbW9kZWwiOm51bGx9fBTGZHP_w_1-da467eexy7kVMJ3Gp2t40jOtl_Npa1N7

npx wrangler secret put OPENAI_BASE_URL --env production
# 입력: https://www.genspark.ai/api/llm_proxy/v1
```

### 2. Toss Payments (테스트 → 라이브 전환)

**현재 테스트 키**:
- Client Key: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`
- Secret Key: `test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R`

**라이브 키 발급 방법**:
1. https://developers.tosspayments.com/ 접속
2. 로그인 → "내 개발 정보" 메뉴
3. "실제 운영 키" 탭 선택
4. **사업자 정보 등록 필요** (개인사업자 또는 법인)
5. 발급 후 아래 명령어로 설정:

```bash
# 라이브 키 설정
npx wrangler secret put TOSS_CLIENT_KEY --env production
# 입력: live_ck_XXXXXXXXXXXXXXXXXXXXX

npx wrangler secret put TOSS_SECRET_KEY --env production
# 입력: live_sk_XXXXXXXXXXXXXXXXXXXXX
```

**⚠️ 주의사항**:
- 테스트 키는 실제 결제가 발생하지 않습니다
- 라이브 키는 실제 결제가 발생하므로 신중하게 관리
- Secret Key는 절대 클라이언트에 노출하면 안됨

### 3. Resend Email API

**현재 상태**: 테스트 키 (`re_test_XXXX`)

**실제 키 발급**:
1. https://resend.com 접속 및 가입
2. "API Keys" 메뉴에서 새 키 생성
3. 도메인 인증 (선택사항, 발신자 이메일 커스터마이징)
4. 발급 후 설정:

```bash
npx wrangler secret put RESEND_API_KEY --env production
# 입력: re_XXXXXXXXXXXXXXXXXXXXX (실제 키)
```

**무료 플랜**:
- 월 3,000통 무료
- 일 100통 제한
- 충분한 테스트 가능

**도메인 인증 (선택)**:
- `noreply@albi.kr` 같은 커스텀 발신자 설정
- DNS 레코드 추가 필요

### 4. 환경 변수 설정

```bash
npx wrangler secret put ENVIRONMENT --env production
# 입력: production
```

---

## 📧 Resend API 키 발급 (상세)

### 단계별 가이드

**1단계: 회원가입**
```plaintext
URL: https://resend.com
1. Sign Up 클릭
2. 이메일 입력 및 인증
3. 프로젝트 이름 입력 (예: Albi)
```

**2단계: API 키 생성**
```plaintext
1. Dashboard → API Keys
2. "Create API Key" 클릭
3. 이름: "Albi Production"
4. Permission: Full Access
5. 생성된 키 복사 (한 번만 표시됨!)
```

**3단계: Cloudflare 설정**
```bash
cd /home/user/webapp
npx wrangler secret put RESEND_API_KEY
# 프롬프트에 복사한 키 붙여넣기
```

**4단계: 테스트**
```bash
# 배포 후 이메일 발송 테스트
curl -X POST "https://albi-app.pages.dev/api/send-email" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "test@example.com",
    "template": "subscription_welcome",
    "data": {
      "user_name": "테스트",
      "plan": "monthly"
    }
  }'
```

---

## 💳 Toss Payments 라이브 키 발급

### 사업자 등록 필요 사항

**개인사업자**:
- 사업자등록증
- 신분증
- 통장 사본

**법인사업자**:
- 법인등록증
- 대표자 신분증
- 법인 통장 사본

### 발급 절차

**1단계: 개발자센터 접속**
```plaintext
URL: https://developers.tosspayments.com
1. 로그인 (기존 계정 사용)
2. "내 개발 정보" 메뉴
```

**2단계: 사업자 정보 등록**
```plaintext
1. "사업자 정보" 탭
2. 사업자 종류 선택 (개인/법인)
3. 필수 서류 업로드
4. 승인 대기 (1-2 영업일)
```

**3단계: 실제 운영 키 발급**
```plaintext
1. "실제 운영 키" 탭
2. 클라이언트 키 확인 (live_ck_XXX)
3. 시크릿 키 발급 (live_sk_XXX)
4. 키 복사 및 안전하게 보관
```

**4단계: Cloudflare 설정**
```bash
npx wrangler secret put TOSS_CLIENT_KEY
# live_ck_XXXXX 입력

npx wrangler secret put TOSS_SECRET_KEY
# live_sk_XXXXX 입력
```

**5단계: 프론트엔드 업데이트**
```javascript
// public/payment.html에서 클라이언트 키 업데이트
const clientKey = 'live_ck_XXXXXXXXXXXXX'; // 라이브 키로 변경
```

---

## ⏰ Cron Trigger 설정

### wrangler.jsonc 설정

현재 파일에 추가:
```jsonc
{
  "name": "albi-app",
  // ... 기존 설정 ...
  
  "triggers": {
    "crons": [
      "0 9 * * *"  // 매일 오전 9시 (UTC) 실행
    ]
  }
}
```

### Cloudflare Dashboard 설정

**방법 1: Wrangler CLI**
```bash
npx wrangler pages project create albi-app
# Cron은 자동으로 wrangler.jsonc 설정을 따름
```

**방법 2: Dashboard**
```plaintext
1. Cloudflare Dashboard 접속
2. Workers & Pages → albi-app
3. Settings → Triggers
4. Cron Triggers → Add Cron Trigger
5. 스케줄 입력: "0 9 * * *"
6. Save
```

### 외부 Cron 서비스 (대안)

**EasyCron** (무료 플랜):
```plaintext
URL: https://www.easycron.com
1. 회원가입
2. New Cron Job 클릭
3. URL: https://albi-app.pages.dev/api/check-subscriptions
4. Schedule: Daily at 09:00 AM (UTC+0)
5. Create
```

**cron-job.org** (무료):
```plaintext
URL: https://cron-job.org
1. 회원가입
2. Cronjobs → Create Cronjob
3. URL: https://albi-app.pages.dev/api/check-subscriptions
4. Schedule: 0 9 * * * (매일 9시)
5. Create
```

---

## 🚀 배포 및 확인

### 1. Secrets 확인

```bash
# 설정된 모든 secrets 목록
npx wrangler secret list

# 예상 출력:
# [
#   { "name": "OPENAI_API_KEY", "type": "secret_text" },
#   { "name": "OPENAI_BASE_URL", "type": "secret_text" },
#   { "name": "TOSS_CLIENT_KEY", "type": "secret_text" },
#   { "name": "TOSS_SECRET_KEY", "type": "secret_text" },
#   { "name": "RESEND_API_KEY", "type": "secret_text" },
#   { "name": "ENVIRONMENT", "type": "secret_text" }
# ]
```

### 2. 프로덕션 배포

```bash
cd /home/user/webapp
npm run deploy

# 배포 완료 후 URL 확인
# ✨ Deployment complete! Take a peek over at https://XXXXX.albi-app.pages.dev
```

### 3. 기능 테스트

**AI 멘토 채팅 테스트**:
```bash
curl -X POST "https://albi-app.pages.dev/api/mentor-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "message": "안녕하세요"
  }'
```

**결제 시스템 테스트**:
1. https://albi-app.pages.dev/payment.html 접속
2. "구독하기" 클릭
3. 테스트 카드 정보:
   - 카드번호: 4242424242424242
   - 유효기간: 12/25
   - CVC: 123

**이메일 발송 테스트**:
```bash
curl -X POST "https://albi-app.pages.dev/api/send-email" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "your@email.com",
    "template": "subscription_welcome",
    "data": {
      "user_name": "홍길동",
      "plan": "monthly"
    }
  }'
```

**Cron 작업 테스트**:
```bash
curl "https://albi-app.pages.dev/api/check-subscriptions"
# 예상 출력: {"success": true, "message": "...", "stats": {...}}
```

### 4. 모니터링

**Cloudflare Analytics**:
```plaintext
1. Dashboard → Workers & Pages → albi-app
2. Analytics 탭 확인
   - 요청 수
   - 에러율
   - 평균 응답 시간
```

**로그 확인**:
```bash
# 실시간 로그 스트리밍
npx wrangler pages deployment tail

# 특정 배포 로그
npx wrangler pages deployment list
```

---

## 📝 체크리스트

### 배포 전 확인사항

- [ ] `.dev.vars` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] 모든 API 키가 Cloudflare Secrets에 설정되었는가?
- [ ] 테스트 환경에서 정상 작동을 확인했는가?
- [ ] D1 마이그레이션이 프로덕션에 적용되었는가?
- [ ] `wrangler.jsonc`에 Cron 설정이 추가되었는가?

### 배포 후 확인사항

- [ ] 모든 페이지가 정상적으로 로드되는가?
- [ ] AI 채팅이 정상 작동하는가?
- [ ] 결제 플로우가 정상 작동하는가? (테스트 모드)
- [ ] 이메일 발송이 정상 작동하는가?
- [ ] Cron 작업이 정상 실행되는가?
- [ ] 에러 로그가 없는가?

### 라이브 전환 확인사항

- [ ] Toss Payments 사업자 승인 완료
- [ ] 실제 결제 테스트 완료
- [ ] Resend 이메일 도메인 인증 완료
- [ ] 프로덕션 모니터링 설정 완료
- [ ] 백업 및 롤백 계획 수립

---

## 🆘 문제 해결

### 1. Secret 설정 오류

```bash
# Secret 삭제
npx wrangler secret delete OPENAI_API_KEY

# 다시 설정
npx wrangler secret put OPENAI_API_KEY
```

### 2. 배포 실패

```bash
# 로그 확인
npx wrangler pages deployment list
npx wrangler pages deployment tail

# 캐시 클리어 후 재배포
rm -rf .wrangler dist
npm run build
npm run deploy
```

### 3. D1 데이터베이스 오류

```bash
# 마이그레이션 상태 확인
npx wrangler d1 migrations list albi-production --remote

# 특정 마이그레이션 재실행
npx wrangler d1 execute albi-production --remote --file=./migrations/XXXX.sql
```

### 4. 이메일 발송 실패

```bash
# Resend API 키 확인
npx wrangler secret list | grep RESEND

# 테스트 이메일 발송
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@resend.dev",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

## 📞 지원 및 문의

- **Cloudflare**: https://community.cloudflare.com
- **Toss Payments**: https://docs.tosspayments.com
- **Resend**: https://resend.com/docs

---

**마지막 업데이트**: 2026-02-27
**버전**: v5.9
**작성자**: Albi Development Team
