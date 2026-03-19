# 📧 이메일 알림 수정 완료

## 🔧 문제 해결

### ❌ **이전 문제**
```typescript
from: 'ALBI <noreply@albi-app.com>'  // 인증되지 않은 도메인
```
→ Resend API에서 거부됨 (401 Unauthorized)

### ✅ **해결 방법**
```typescript
from: 'ALBI <onboarding@resend.dev>'  // Resend 테스트 도메인
```
→ 이메일 발송 정상 작동

---

## 📋 Resend 이메일 발송 제한사항

### 1️⃣ **테스트 도메인 (onboarding@resend.dev)**
- **장점:**
  - 즉시 사용 가능 (설정 불필요)
  - 무료로 사용 가능
  - 개발/테스트용으로 적합

- **제한사항:**
  - ⚠️ **받는 사람 제한**: Resend 계정에 등록된 이메일 주소로만 발송 가능
  - ⚠️ **발신자 표시**: "ALBI via Resend" 형태로 표시됨
  - ⚠️ **프로덕션 부적합**: 실제 사용자에게 발송 불가

### 2️⃣ **커스텀 도메인 (권장)**
프로덕션 환경에서는 반드시 자신의 도메인을 등록해야 합니다.

**설정 방법:**
1. Resend 대시보드 접속: https://resend.com/domains
2. "Add Domain" 클릭
3. 소유한 도메인 입력 (예: `albi-app.com`)
4. DNS 레코드 추가:
   ```
   Type: TXT
   Name: _resend
   Value: [Resend에서 제공하는 값]
   
   Type: CNAME
   Name: resend._domainkey
   Value: [Resend에서 제공하는 값]
   ```
5. DNS 전파 대기 (최대 48시간, 보통 1~2시간)
6. 도메인 인증 완료 후 코드 수정:
   ```typescript
   from: 'ALBI <noreply@albi-app.com>'  // 인증된 도메인 사용
   ```

---

## 🧪 테스트 방법

### **현재 상태 (테스트 도메인)**
1. 새 계약서 작성: https://albi-app.pages.dev/contract
2. **중요**: 근로자/고용주 이메일을 **Resend 계정에 등록된 이메일**로 입력
3. 계약서 제출
4. 이메일 확인 → 발신자: "ALBI via Resend <onboarding@resend.dev>"

### **Resend 계정에 이메일 추가 방법**
1. https://resend.com/settings/emails 접속
2. "Add Email" 클릭
3. 테스트용 이메일 주소 추가
4. 해당 주소로 발송 가능

---

## 🎯 현재 배포 상태

### ✅ **작동하는 기능**
- [x] 계약서 생성 및 저장
- [x] PDF 생성 및 다운로드 (`?format=pdf`)
- [x] 전자서명 기능
- [x] 이메일 알림 (Resend 계정 이메일 대상)

### ⚠️ **제한사항**
- 임의의 이메일 주소로 발송 불가
- Resend 계정에 등록된 이메일로만 발송 가능
- "via Resend" 표시

### 🚀 **프로덕션 전환 시**
1. 커스텀 도메인 등록 (albi-app.com)
2. DNS 설정 완료
3. `email-service.ts` 수정:
   ```typescript
   from: 'ALBI <noreply@albi-app.com>'
   ```
4. 재배포

---

## 📦 관련 파일

- `functions/api/contracts/email-service.ts`: 이메일 발송 로직
- `functions/api/contracts/index.ts`: 계약서 생성 후 이메일 호출
- `.dev.vars`: 로컬 개발 환경 변수 (RESEND_API_KEY)
- Cloudflare Secret: `RESEND_API_KEY` (프로덕션)

---

## 📊 배포 정보

- **배포 URL:** https://b37147ab.albi-app.pages.dev
- **프로덕션 URL:** https://albi-app.pages.dev
- **배포 일시:** 2026-02-14 17:15 (KST)
- **커밋:** 2737405

---

## 🆘 트러블슈팅

### **이메일이 여전히 발송되지 않는 경우**

1. **Resend API 키 확인**
   ```bash
   npx wrangler pages secret list --project-name albi-app | grep RESEND
   ```
   → "RESEND_API_KEY: Value Encrypted" 표시되어야 함

2. **받는 사람 이메일 확인**
   - Resend 대시보드에서 해당 이메일이 등록되었는지 확인
   - 등록되지 않은 이메일은 발송 실패

3. **Cloudflare 로그 확인**
   - Cloudflare Pages 대시보드 → Functions 탭 → Logs
   - "Email send failed" 에러 메시지 확인

4. **API 키 재생성**
   - Resend 대시보드에서 새 API 키 생성
   - Cloudflare Secret 업데이트:
     ```bash
     npx wrangler pages secret put RESEND_API_KEY --project-name albi-app
     ```

---

## 💡 권장사항

### **단기 (테스트/개발)**
- ✅ 현재 설정 유지 (onboarding@resend.dev)
- Resend 계정에 테스트 이메일 추가
- 기능 테스트 및 검증

### **중기 (프로덕션 준비)**
- 도메인 등록 및 DNS 설정
- 커스텀 도메인으로 전환
- 이메일 템플릿 최적화

### **장기 (확장)**
- 이메일 통계 모니터링
- 발송 실패 재시도 로직
- 이메일 큐 시스템 (대량 발송 대비)

---

**✅ 이제 계약서 생성 시 이메일 알림이 정상적으로 발송됩니다!**
(Resend 계정에 등록된 이메일 주소 대상)
