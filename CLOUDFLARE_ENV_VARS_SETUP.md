# Cloudflare Pages 환경 변수 설정 가이드

## 웹훅 시크릿 설정 방법

### 방법 1: Cloudflare 대시보드 (권장)

#### 1단계: Cloudflare Pages 프로젝트 접속
```
https://dash.cloudflare.com/
→ Pages
→ albi-app 선택
```

#### 2단계: 설정 페이지 이동
```
Settings 탭 클릭
→ Environment variables (환경 변수) 섹션
```

#### 3단계: 환경 변수 추가
```
Variable name: PORTONE_WEBHOOK_SECRET
Value: whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=

Environment:
☑ Production
☑ Preview (선택사항)

[Save] 버튼 클릭
```

#### 4단계: 재배포 (자동)
- 환경 변수 저장 후 자동으로 재배포됨
- 또는 수동 재배포:
  ```bash
  cd /home/user/webapp
  npx wrangler pages deploy dist --project-name albi-app
  ```

---

### 방법 2: Wrangler CLI (타임아웃 발생 시 사용 안함)

```bash
# 타임아웃 발생으로 권장하지 않음
# npx wrangler pages secret put PORTONE_WEBHOOK_SECRET --project-name albi-app
# → 대시보드 사용 권장
```

---

## 설정할 환경 변수 목록

### 필수 환경 변수

| 변수명 | 값 | 설명 |
|-------|-----|------|
| `PORTONE_STORE_ID` | `store-1db2baf1-49d6-4b31-afcb-4662f37d7b05` | PortOne 상점 ID |
| `PORTONE_API_SECRET` | (비밀) | PortOne API Secret |
| `PORTONE_WEBHOOK_SECRET` | `whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=` | ✅ **방금 설정** |

### 선택 환경 변수

| 변수명 | 값 | 설명 |
|-------|-----|------|
| `RESEND_API_KEY` | (비밀) | 이메일 발송용 (선택) |
| `ENVIRONMENT` | `production` | 환경 구분 (선택) |

---

## 웹훅 시크릿 작동 방식

### 1. PortOne → 우리 서버
```
POST /api/subscription/webhook
Headers:
  webhook-signature: <HMAC-SHA256 서명>
Body:
  {"type": "Transaction.Paid", ...}
```

### 2. 서버 측 검증
```typescript
// webhook.ts
const signature = request.headers.get('webhook-signature');
const secret = env.PORTONE_WEBHOOK_SECRET;

// HMAC-SHA256 검증
const isValid = await verifyWebhookSignature(body, signature, secret);

if (!isValid) {
  return Response.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 3. 검증 성공 시
```
✅ Webhook signature verified
→ 결제/빌링키 처리 진행
→ 200 OK 응답
```

### 4. 검증 실패 시
```
❌ Invalid webhook signature
→ 처리 중단
→ 401 Unauthorized 응답
```

---

## 환경 변수 확인 방법

### Cloudflare 대시보드
```
Pages → albi-app → Settings → Environment variables
→ PORTONE_WEBHOOK_SECRET 표시 확인
```

### 로컬 개발 환경
```bash
# .dev.vars 파일에 설정됨
cat /home/user/webapp/.dev.vars

# 출력:
# PORTONE_WEBHOOK_SECRET=whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
```

### 웹훅 테스트로 확인
```bash
# 서명 없이 요청 (실패해야 함)
curl -X POST https://albi.kr/api/subscription/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Transaction.Paid","data":{}}'

# 예상 응답 (환경 변수 설정 후):
# {"success":false,"message":"Missing webhook signature"}
# Status: 401 Unauthorized
```

---

## 보안 고려사항

### ✅ 권장 사항
1. **환경 변수 암호화**: Cloudflare가 자동으로 암호화 저장
2. **GitHub에 업로드 금지**: `.dev.vars`는 `.gitignore`에 포함
3. **시크릿 정기 갱신**: 3-6개월마다 PortOne에서 재발급
4. **로그에 출력 금지**: 시크릿 값을 로그에 기록하지 않음

### ⚠️ 주의사항
1. `.dev.vars` 파일은 **로컬 전용** (프로덕션 미사용)
2. Git에 커밋하지 않도록 `.gitignore` 확인
3. 시크릿 노출 시 즉시 PortOne에서 재발급

---

## 설정 확인 체크리스트

### Cloudflare Pages 대시보드
- [ ] Pages → albi-app → Settings 접속
- [ ] Environment variables 섹션 확인
- [ ] `PORTONE_WEBHOOK_SECRET` 추가 완료
- [ ] Production 환경 체크
- [ ] 저장 및 재배포 완료

### PortOne 대시보드
- [ ] 웹훅 URL 설정: `https://albi.kr/api/subscription/webhook`
- [ ] 웹훅 시크릿 발급 완료
- [ ] 이벤트 선택 완료 (Transaction.Paid 등)
- [ ] 저장 완료

### 테스트
- [ ] 실제 결제로 웹훅 수신 확인
- [ ] 서명 검증 로그 확인: `✅ Webhook signature verified`
- [ ] 결제 상태 정상 업데이트 확인

---

## 다음 단계

1. ✅ **Cloudflare 대시보드에서 환경 변수 설정**
   ```
   https://dash.cloudflare.com/pages/albi-app/settings/environment-variables
   
   Variable: PORTONE_WEBHOOK_SECRET
   Value: whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
   ```

2. ✅ **PortOne 대시보드에서 웹훅 테스트**
   ```
   결제연동 → 웹훅 → 테스트 전송
   → 응답 확인: {"success": true, "message": "Webhook processed"}
   ```

3. ✅ **실제 결제로 E2E 테스트**
   ```
   https://albi.kr/payment.html
   → Standard 플랜 카드 결제
   → 웹훅 수신 확인
   → DB 업데이트 확인
   ```

---

**작성일**: 2026-03-05 13:30 UTC  
**웹훅 시크릿**: `whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=`  
**설정 위치**: Cloudflare Pages → albi-app → Settings → Environment variables  
**상태**: ⏳ 환경 변수 설정 대기 중
