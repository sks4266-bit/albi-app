# 🌐 커스텀 도메인 설정 가이드

## 📋 사전 준비사항

### 1️⃣ 필요한 것들
- [ ] 소유한 도메인 (예: albi-app.com, yourdomain.com)
- [ ] 도메인 등록업체 접근 권한 (DNS 레코드 수정 가능)
- [ ] Resend 계정 로그인 (API 키가 있는 계정)

### 2️⃣ 도메인이 없는 경우
아래 업체에서 도메인 구매 가능:
- **국내:** 가비아 (gabia.com), 후이즈 (whois.co.kr), 카페24
- **해외:** Namecheap (추천), GoDaddy, Google Domains
- **비용:** 연간 $10~$20 (약 13,000~26,000원)

---

## 🚀 설정 단계

### **Step 1: Resend에서 도메인 추가**

1. **Resend 대시보드 접속**
   ```
   https://resend.com/domains
   ```

2. **"Add Domain" 버튼 클릭**

3. **도메인 입력**
   - 전체 도메인: `albi-app.com` (예시)
   - 서브도메인도 가능: `mail.yourdomain.com`

4. **Region 선택**
   - 한국 사용자 대상: **US East (N. Virginia)** (가장 가까움)

5. **DNS 레코드 복사**
   Resend가 제공하는 3개의 DNS 레코드를 메모장에 복사:
   
   ```
   📝 Record 1: SPF (Sender Policy Framework)
   Type: TXT
   Name: @ (또는 albi-app.com)
   Value: v=spf1 include:_spf.resend.com ~all
   
   📝 Record 2: DKIM (DomainKeys Identified Mail)
   Type: TXT
   Name: resend._domainkey
   Value: [Resend에서 제공하는 긴 문자열]
   
   📝 Record 3: Custom Domain Verification
   Type: TXT
   Name: _resend
   Value: [Resend에서 제공하는 값]
   ```

---

### **Step 2: DNS 레코드 추가**

#### **A. 가비아 (gabia.com) 사용 시**

1. **가비아 로그인** → My가비아 → 도메인 관리
2. **DNS 관리** 클릭
3. **레코드 추가**
   ```
   레코드 1:
   - 타입: TXT
   - 호스트: @
   - 값: v=spf1 include:_spf.resend.com ~all
   - TTL: 3600
   
   레코드 2:
   - 타입: TXT
   - 호스트: resend._domainkey
   - 값: [Resend 제공 값]
   - TTL: 3600
   
   레코드 3:
   - 타입: TXT
   - 호스트: _resend
   - 값: [Resend 제공 값]
   - TTL: 3600
   ```
4. **저장** 클릭

#### **B. Cloudflare DNS 사용 시**

1. **Cloudflare 대시보드** → 해당 도메인 선택
2. **DNS** 탭 → **Add record**
   ```
   Record 1:
   - Type: TXT
   - Name: @
   - Content: v=spf1 include:_spf.resend.com ~all
   - Proxy status: DNS only (회색 구름)
   - TTL: Auto
   
   Record 2:
   - Type: TXT
   - Name: resend._domainkey
   - Content: [Resend 제공 값]
   - Proxy status: DNS only
   - TTL: Auto
   
   Record 3:
   - Type: TXT
   - Name: _resend
   - Content: [Resend 제공 값]
   - Proxy status: DNS only
   - TTL: Auto
   ```
3. **Save**

---

### **Step 3: DNS 전파 확인**

#### **온라인 도구**
```
https://dnschecker.org/
→ 도메인 입력
→ Record Type: TXT 선택
→ 전 세계 DNS 서버 상태 확인
```

#### **명령줄 확인**
```bash
# SPF 레코드 확인
dig TXT yourdomain.com +short

# DKIM 레코드 확인
dig TXT resend._domainkey.yourdomain.com +short

# Verification 레코드 확인
dig TXT _resend.yourdomain.com +short
```

**대기 시간:** 최소 5~10분, 평균 1~2시간, 최대 48시간

---

### **Step 4: Resend에서 도메인 인증**

1. **Resend 대시보드** → Domains 페이지
2. **Verify Domain** 버튼 클릭
3. **상태 확인**
   - ✅ **Verified**: 인증 완료! 사용 가능
   - ⏳ **Pending**: DNS 전파 대기 중
   - ❌ **Failed**: DNS 레코드 확인 필요

---

### **Step 5: 코드 수정 및 배포**

#### **도메인이 인증되면 아래 명령어 실행:**

```bash
cd /home/user/webapp

# 실제 도메인으로 변경 (예: albi-app.com)
DOMAIN="albi-app.com"

# 이메일 서비스 파일 수정
sed -i "s/onboarding@resend.dev/noreply@${DOMAIN}/g" functions/api/contracts/email-service.ts

# 변경 확인
grep "from:" functions/api/contracts/email-service.ts

# Git 커밋
git add functions/api/contracts/email-service.ts
git commit -m "Update: Change email sender to custom domain (${DOMAIN})"

# Cloudflare Pages 배포
npm run deploy
```

---

### **Step 6: 테스트**

1. https://albi-app.pages.dev/contract 접속
2. 계약서 작성 (실제 이메일 주소 입력 가능!)
3. 제출 후 이메일 확인
4. ✅ 발신자: ALBI <noreply@yourdomain.com>

---

## 🎯 DNS 레코드 예시

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | v=spf1 include:_spf.resend.com ~all | 3600 |
| TXT | resend._domainkey | k=rsa; p=MIGfMA0GCS... | 3600 |
| TXT | _resend | resend-verify-abc123... | 3600 |

---

## ⚠️ 주의사항

### **1. DNS 레코드 정확성**
- 공백, 따옴표 제거
- 복사-붙여넣기 권장

### **2. Cloudflare Proxy**
- TXT 레코드는 **"DNS only"** (회색 구름) 설정
- Proxy 활성화 시 인증 실패

### **3. 기존 SPF 레코드 통합**
```
기존: v=spf1 include:_spf.google.com ~all
통합: v=spf1 include:_spf.google.com include:_spf.resend.com ~all
```

---

## 🆘 트러블슈팅

### **"Domain verification failed"**
```bash
# DNS 레코드 확인
dig TXT _resend.yourdomain.com +short

# 결과 없으면 DNS 설정 재확인
# 결과 있으면 5~10분 대기 후 재시도
```

### **이메일이 스팸함으로**
1. Resend 도메인 상태 "Verified" 확인
2. 초기 발송량 제한 (하루 10~20통)
3. 점진적으로 증가

---

## 📊 설정 완료 체크리스트

- [ ] Resend 도메인 추가
- [ ] DNS 레코드 3개 추가
- [ ] DNS 전파 확인
- [ ] Resend "Verified" 상태
- [ ] 코드 수정 및 배포
- [ ] 실제 이메일 테스트

---

## 💡 추가 팁

### **서브도메인 권장**
```
추천: noreply@yourdomain.com
대안: noreply@mail.yourdomain.com
```

### **여러 발신 주소**
```typescript
from: 'ALBI 계약서 <contract@yourdomain.com>'
from: 'ALBI 알림 <noreply@yourdomain.com>'
from: 'ALBI 지원팀 <support@yourdomain.com>'
```

---

## 📚 참고 자료

- **Resend 문서:** https://resend.com/docs/dashboard/domains/introduction
- **DNS 확인 도구:** https://dnschecker.org/
- **SPF 검증:** https://www.kitterman.com/spf/validate.html

---

**✅ 도메인 설정이 완료되면 임의의 이메일 주소로 발송 가능합니다!**
