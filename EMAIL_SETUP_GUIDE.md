# 📧 이메일 알림 서비스 설정 가이드

## 📌 개요
전자계약서 시스템은 **Resend API**를 사용하여 이메일 알림을 전송합니다.

---

## 1️⃣ Resend API 키 발급

### 단계:
1. [Resend 웹사이트](https://resend.com/) 방문
2. 계정 생성 또는 로그인
3. **Dashboard** → **API Keys** 메뉴 이동
4. **Create API Key** 클릭
5. API 키 이름 입력 (예: `albi-contracts`)
6. **Full Access** 권한 선택
7. 생성된 API 키 복사 (형식: `re_...`)

### 무료 플랜 제한:
- **월 100건** 이메일 전송 가능
- **커스텀 도메인** 설정 필요 (예: `noreply@yourdomain.com`)
- **테스트용**: 인증된 이메일 주소로만 전송 가능

### 유료 플랜 (Production):
- **월 $20** 부터 시작
- **월 50,000건** 이메일 전송
- 커스텀 도메인 무제한
- DKIM/SPF 인증 지원

---

## 2️⃣ 로컬 개발 환경 설정

### `.dev.vars` 파일 수정:
```bash
# Resend API 설정 (이메일 알림)
RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE
```

### 테스트:
```bash
# 로컬 개발 서버 시작
npm run dev:sandbox

# 계약서 생성 후 이메일 전송 테스트
# contract.html에서 전자계약서 제출
```

---

## 3️⃣ 프로덕션 환경 설정

### Cloudflare Pages Secret 설정:
```bash
# Cloudflare API 키 설정 먼저 확인
npx wrangler whoami

# Resend API 키를 Secret으로 등록
npx wrangler pages secret put RESEND_API_KEY --project-name albi-app

# 입력 프롬프트가 나오면 API 키 붙여넣기
# Enter a secret value: re_YOUR_ACTUAL_API_KEY_HERE
```

### Secret 확인:
```bash
# 등록된 Secret 목록 확인
npx wrangler pages secret list --project-name albi-app
```

---

## 4️⃣ 이메일 템플릿 커스터마이징

### 파일 위치:
`functions/api/contracts/email-service.ts`

### 현재 템플릿:
- **근로자용 이메일**: 계약서 체결 완료 안내
- **사업주용 이메일**: 계약서 접수 확인

### 수정 방법:
```typescript
// functions/api/contracts/email-service.ts

export async function sendContractEmail(env: Env, contractData: ContractData): Promise<boolean> {
  const RESEND_API_KEY = env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found');
    return false;
  }

  // 이메일 HTML 템플릿 수정
  const workerEmailHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <!-- 여기에 커스텀 CSS 추가 -->
      </head>
      <body>
        <!-- 여기에 커스텀 HTML 추가 -->
      </body>
    </html>
  `;
  
  // ...
}
```

---

## 5️⃣ 이메일 전송 플로우

### 계약서 제출 시:
1. **사용자**: `contract.html`에서 전자서명 및 제출
2. **API**: `POST /api/contracts` 호출
3. **DB 저장**: 계약서 데이터 저장
4. **이메일 전송**:
   - 근로자 이메일 주소로 완료 알림
   - 사업주 이메일 주소로 접수 확인
5. **응답**: 성공 메시지 + PDF URL 반환

### 코드 흐름:
```typescript
// functions/api/contracts/index.ts

// 1. 계약서 데이터 저장
const insertResult = await env.DB.prepare(`
  INSERT INTO contracts (...)
  VALUES (...)
`).bind(...).run();

// 2. 이메일 전송
try {
  const emailSent = await sendContractEmail(env, contractData);
  if (emailSent) {
    console.log('✅ 이메일 전송 성공');
  } else {
    console.warn('⚠️ 이메일 전송 실패 (계약서는 저장됨)');
  }
} catch (error) {
  console.error('❌ 이메일 전송 중 오류:', error);
}

// 3. 응답 반환
return c.json({
  success: true,
  contractId,
  pdfUrl: `/api/contracts/${contractId}/pdf`
});
```

---

## 6️⃣ 테스트 체크리스트

### 로컬 환경:
- [ ] `.dev.vars`에 `RESEND_API_KEY` 설정
- [ ] `npm run dev:sandbox` 실행
- [ ] `contract.html` 접속 (`http://localhost:3000/contract`)
- [ ] 계약서 폼 작성 및 서명
- [ ] 제출 버튼 클릭
- [ ] 이메일 수신 확인 (근로자 & 사업주)
- [ ] 콘솔 로그 확인: `✅ 이메일 전송 성공`

### 프로덕션 환경:
- [ ] `npx wrangler pages secret put RESEND_API_KEY` 실행
- [ ] `npm run deploy` 배포
- [ ] `https://albi-app.pages.dev/contract` 접속
- [ ] 계약서 제출 및 이메일 수신 확인
- [ ] Cloudflare Dashboard → Logs 확인

---

## 7️⃣ 트러블슈팅

### 문제 1: 이메일이 전송되지 않음
**원인**:
- `RESEND_API_KEY`가 설정되지 않음
- API 키가 만료되었거나 잘못됨
- 무료 플랜에서 인증되지 않은 이메일로 전송

**해결**:
```bash
# 로컬: .dev.vars 확인
cat .dev.vars | grep RESEND_API_KEY

# 프로덕션: Secret 확인
npx wrangler pages secret list --project-name albi-app

# Secret 재설정
npx wrangler pages secret put RESEND_API_KEY --project-name albi-app
```

### 문제 2: 이메일이 스팸함으로 이동
**원인**:
- 커스텀 도메인 미설정
- DKIM/SPF 인증 미설정

**해결**:
1. Resend Dashboard에서 **Domains** 메뉴로 이동
2. 커스텀 도메인 추가 (예: `yourdomain.com`)
3. DNS 레코드 설정 (DKIM, SPF)
4. 인증 완료 후 `from` 이메일을 `noreply@yourdomain.com`으로 변경

### 문제 3: 환경변수가 인식되지 않음
**원인**:
- Cloudflare Pages Functions는 빌드 시점이 아닌 런타임에 환경변수를 로드

**해결**:
```typescript
// ❌ 잘못된 방법 (Node.js 스타일)
const API_KEY = process.env.RESEND_API_KEY;

// ✅ 올바른 방법 (Cloudflare Pages Functions)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const API_KEY = env.RESEND_API_KEY;
};
```

---

## 8️⃣ 다음 단계

### 추가 기능:
- [ ] **이메일 템플릿 다양화** (계약 완료, 해지, 갱신)
- [ ] **이메일 전송 이력 저장** (DB 테이블 추가)
- [ ] **재전송 기능** (이메일 전송 실패 시)
- [ ] **이메일 미리보기** (관리자 대시보드)
- [ ] **이메일 통계** (전송 성공률, 오픈율)

### SMS 알림 추가:
- Twilio 또는 AWS SNS 연동
- 계약서 체결 시 SMS + 이메일 동시 전송
- 긴급 알림은 SMS 우선

---

## 📞 지원

### Resend 공식 문서:
- https://resend.com/docs

### API Reference:
- https://resend.com/docs/api-reference/emails/send-email

### 알비 팀 문의:
- 이메일: support@albi.com
- 채팅: 웹사이트 우측 하단

---

**마지막 업데이트**: 2026-02-14  
**작성자**: AI Developer Agent
