# 🚀 커스텀 도메인 설정 완료 가이드

## 📌 빠른 시작

### **현재 상태**
- ✅ 이메일 기능 작동 중 (테스트 도메인: `onboarding@resend.dev`)
- ⚠️ Resend 계정에 등록된 이메일로만 발송 가능
- ⚠️ "via Resend" 발신자 표시

### **커스텀 도메인 설정 후**
- ✅ 임의의 이메일 주소로 발송 가능
- ✅ 프로페셔널한 발신자 표시 (`ALBI <noreply@yourdomain.com>`)
- ✅ 스팸 필터링 개선 (SPF/DKIM 인증)

---

## 🎯 3단계 설정 방법

### **1단계: 도메인 준비** (5분)

**도메인이 있는 경우:**
- 도메인 등록업체 로그인 (가비아, Cloudflare 등)
- DNS 관리 메뉴 접속

**도메인이 없는 경우:**
- Namecheap, 가비아 등에서 구매 ($10~$20/년)
- 구매 후 DNS 관리 권한 확보

---

### **2단계: Resend 설정** (10분)

#### **A. 도메인 추가**
```
1. https://resend.com/domains 접속
2. "Add Domain" 클릭
3. 도메인 입력 (예: albi-app.com)
4. Region: US East (N. Virginia) 선택
5. DNS 레코드 복사 (3개)
```

#### **B. DNS 레코드 추가**
Resend가 제공한 3개 레코드를 DNS에 추가:

**가비아 사용 시:**
```
My가비아 → 도메인 관리 → DNS 관리
→ TXT 레코드 3개 추가 (SPF, DKIM, Verification)
```

**Cloudflare 사용 시:**
```
대시보드 → DNS → Add record
→ TXT 레코드 3개 추가
→ Proxy status: DNS only (회색 구름)
```

#### **C. DNS 전파 대기**
- 최소: 5~10분
- 평균: 1~2시간
- 확인: https://dnschecker.org/

#### **D. 도메인 인증**
```
Resend 대시보드 → "Verify Domain" 클릭
→ 상태가 "Verified"가 될 때까지 대기
```

---

### **3단계: 코드 배포** (5분)

#### **방법 1: 자동 스크립트 (권장)**
```bash
cd /home/user/webapp
./scripts/setup-custom-domain.sh yourdomain.com
```

스크립트가 자동으로:
- DNS 레코드 확인
- 코드 수정
- Git 커밋
- Cloudflare Pages 배포

#### **방법 2: 수동 실행**
```bash
cd /home/user/webapp

# 도메인 변경
DOMAIN="yourdomain.com"
sed -i "s/onboarding@resend.dev/noreply@${DOMAIN}/g" \
  functions/api/contracts/email-service.ts

# 확인
grep "from:" functions/api/contracts/email-service.ts

# 커밋 및 배포
git add functions/api/contracts/email-service.ts
git commit -m "Update: Email sender domain to ${DOMAIN}"
npm run deploy
```

---

## ✅ 테스트

### **1. 계약서 생성 테스트**
```
1. https://albi-app.pages.dev/contract
2. 계약서 작성
3. 이메일: 실제 이메일 주소 입력 (제한 없음!)
4. 제출
5. ✅ 이메일 수신 확인
```

### **2. 이메일 확인 포인트**
- **발신자:** ALBI <noreply@yourdomain.com>
- **제목:** [ALBI] 계약서 체결 완료
- **위치:** 받은편지함 (스팸 아님)
- **"via Resend":** 표시 없음 ✅

---

## 📋 DNS 레코드 템플릿

### **복사해서 사용하세요:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | v=spf1 include:_spf.resend.com ~all | 3600 |
| TXT | resend._domainkey | [Resend 제공 값] | 3600 |
| TXT | _resend | [Resend 제공 값] | 3600 |

**주의:** `[Resend 제공 값]`은 Resend 대시보드에서 복사해야 합니다!

---

## 🔍 DNS 확인 명령어

```bash
# SPF 레코드
dig TXT yourdomain.com +short | grep spf1

# DKIM 레코드
dig TXT resend._domainkey.yourdomain.com +short

# Verification 레코드
dig TXT _resend.yourdomain.com +short
```

모든 레코드가 표시되면 Resend에서 "Verify Domain" 클릭!

---

## 🆘 문제 해결

### **"Domain verification failed"**
→ DNS 레코드 확인 후 5~10분 대기

### **DNS 레코드가 보이지 않음**
→ TTL 시간 대기 또는 https://dnschecker.org/ 확인

### **이메일이 스팸함으로**
→ Resend 도메인 "Verified" 확인 후 초기 발송량 제한

### **Cloudflare Proxy 문제**
→ TXT 레코드는 "DNS only" (회색 구름) 설정

---

## 📚 관련 문서

- **상세 가이드:** `CUSTOM_DOMAIN_SETUP.md`
- **헬퍼 스크립트:** `scripts/setup-custom-domain.sh`
- **이메일 설정:** `EMAIL_SETUP_UPDATE.md`
- **Resend 공식 문서:** https://resend.com/docs/dashboard/domains/introduction

---

## 💡 추천 설정

### **발신 주소**
```typescript
// 계약서
from: 'ALBI 계약서 <contract@yourdomain.com>'

// 일반 알림
from: 'ALBI <noreply@yourdomain.com>'

// 지원팀
from: 'ALBI 지원 <support@yourdomain.com>'
```

### **이메일 분석**
Resend 대시보드에서 확인:
- 발송 성공률
- 오픈율 (열람률)
- 클릭률
- 반송률

---

## 🎉 완료!

**커스텀 도메인 설정이 완료되면:**
- ✅ 모든 사용자에게 이메일 발송 가능
- ✅ 프로페셔널한 브랜드 이미지
- ✅ 높은 이메일 도달률 (SPF/DKIM 인증)

**다음 단계:**
1. 이메일 템플릿 최적화
2. SMS 알림 추가 (CoolSMS)
3. 푸시 알림 (PWA)

---

## 📞 지원

질문이나 문제가 있으면:
1. `CUSTOM_DOMAIN_SETUP.md` 트러블슈팅 섹션 확인
2. Resend 지원팀: https://resend.com/support
3. DNS 확인 도구: https://dnschecker.org/

---

**✅ 설정을 시작하려면 위 3단계를 순서대로 진행하세요!**
