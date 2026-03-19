# 🚀 알비(ALBI) 프로덕션 배포 가이드

## 📋 목차
1. [개요](#개요)
2. [Toss Payments API 키 설정](#toss-payments-api-키-설정)
3. [Resend 이메일 API 키 설정](#resend-이메일-api-키-설정)
4. [Cloudflare Pages 환경 변수 설정](#cloudflare-pages-환경-변수-설정)
5. [배포 및 테스트](#배포-및-테스트)
6. [트러블슈팅](#트러블슈팅)

---

## 개요

알비 플랫폼을 프로덕션 환경에서 운영하기 위해서는 다음 API 키들이 필요합니다:

- ✅ **Toss Payments API 키** - 실제 결제 처리
- ✅ **Resend API 키** - 이메일 알림 발송
- ✅ **Cloudflare D1 Database** - 데이터베이스 (이미 설정됨)

**예상 소요 시간**: 약 30분

---

## Toss Payments API 키 설정

### 1단계: Toss Payments 계정 생성

1. **Toss Payments 개발자 센터 접속**
   - URL: https://developers.tosspayments.com
   - "시작하기" 버튼 클릭

2. **회원가입 및 로그인**
   - 이메일 또는 카카오/네이버 계정으로 가입
   - 이메일 인증 완료

3. **사업자 정보 등록**
   - 상호명: 알비 주식회사
   - 사업자등록번호: 531-08-03526
   - 대표자: 박지훈
   - 사업장 주소: 경상남도 양산시 동면 사송로 155, 807동 1405호

### 2단계: API 키 발급

1. **개발자 콘솔 접속**
   - 로그인 후 "내 앱" 메뉴 선택
   - "새 앱 만들기" 클릭

2. **앱 정보 입력**
   ```
   앱 이름: ALBI 채용 플랫폼
   설명: 1시간 체험 알바 매칭 플랫폼
   ```

3. **API 키 확인**
   - **클라이언트 키** (공개 키)
     - 예: `live_ck_xxxxxxxxxxxxxxxx`
     - 프론트엔드에서 사용 (결제 위젯)
   
   - **시크릿 키** (비밀 키) ⚠️ 절대 노출 금지!
     - 예: `live_sk_xxxxxxxxxxxxxxxx`
     - 백엔드에서만 사용 (결제 승인)

### 3단계: 결제 수단 설정

1. **지원할 결제 수단 선택**
   ```
   ✅ 신용/체크카드
   ✅ 계좌이체
   ✅ 가상계좌
   ✅ 토스페이
   ✅ 카카오페이
   ✅ 네이버페이
   ```

2. **PG사 연동 신청**
   - Toss Payments 콘솔에서 "PG 연동" 메뉴 선택
   - 필요한 서류 제출 (사업자등록증, 통장 사본 등)
   - 심사 기간: 약 3-5 영업일

### 4단계: 수수료 확인

```
📊 Toss Payments 수수료 구조:

신용카드: 3.3%
계좌이체: 1.0%
가상계좌: 건당 200원
토스페이: 2.5%

예시: 50,000원 결제 시
- 신용카드: 1,650원 (3.3%)
- 계좌이체: 500원 (1.0%)
- 가상계좌: 200원

💡 TIP: 계좌이체 유도 시 수수료 절감 가능
```

### 5단계: Webhook URL 설정

1. **Webhook 엔드포인트 등록**
   ```
   URL: https://albi.kr/api/payments/webhook
   이벤트: 결제 승인, 결제 취소
   ```

2. **보안 설정**
   - IP 화이트리스트 등록
   - HTTPS 필수

---

## Resend 이메일 API 키 설정

### 1단계: Resend 계정 생성

1. **Resend 웹사이트 접속**
   - URL: https://resend.com
   - "Sign Up" 버튼 클릭

2. **계정 생성**
   - GitHub 계정으로 간편 가입 추천
   - 또는 이메일로 가입

### 2단계: 도메인 인증

1. **도메인 추가**
   ```
   Domain: albi.kr
   Subdomain: noreply (권장)
   Full Email: noreply@albi.kr
   ```

2. **DNS 레코드 추가**
   
   Cloudflare DNS 설정에 다음 레코드 추가:
   
   ```
   Type: TXT
   Name: _resend
   Value: resend-verify=xxxxxxxxxxxxxxxx
   
   Type: MX
   Name: albi.kr
   Value: feedback-smtp.resend.com
   Priority: 10
   
   Type: TXT
   Name: albi.kr
   Value: v=spf1 include:_spf.resend.com ~all
   
   Type: TXT
   Name: _dmarc.albi.kr
   Value: v=DMARC1; p=none; rua=mailto:dmarc@albi.kr
   ```

3. **인증 확인**
   - DNS 전파 시간: 약 10-30분
   - Resend 대시보드에서 "Verify Domain" 클릭
   - 상태가 "Verified" 로 변경되면 완료

### 3단계: API 키 발급

1. **API Keys 메뉴 접속**
   - 좌측 메뉴에서 "API Keys" 선택
   - "Create API Key" 클릭

2. **API 키 생성**
   ```
   Name: ALBI Production
   Permission: Full Access
   ```

3. **API 키 복사**
   - 형식: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ 한 번만 표시되므로 즉시 저장!

### 4단계: 이메일 템플릿 테스트

1. **테스트 이메일 발송**
   ```bash
   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer re_xxxxxxxxxxxxxx' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "ALBI <noreply@albi.kr>",
       "to": ["your-email@example.com"],
       "subject": "테스트 이메일",
       "html": "<h1>알비 이메일 테스트</h1>"
     }'
   ```

2. **수신 확인**
   - 스팸 폴더 확인
   - 발신자 이름이 "ALBI" 로 표시되는지 확인

### 5단계: 요금제 확인

```
📊 Resend 요금제:

Free Tier:
- 월 3,000통 무료
- API 접근
- 도메인 인증
- 이메일 분석

Pro ($20/월):
- 월 50,000통
- 전용 IP
- 우선 지원

💡 TIP: 초기에는 Free Tier로 충분
```

---

## Cloudflare Pages 환경 변수 설정

### 1단계: Wrangler CLI 설치 확인

```bash
# Wrangler 버전 확인
npx wrangler --version

# 로그인 (이미 로그인되어 있으면 생략)
npx wrangler login
```

### 2단계: 프로젝트 디렉토리 이동

```bash
cd /home/user/webapp
```

### 3단계: Secret 환경 변수 설정

#### Toss Payments Secret Key 설정

```bash
npx wrangler secret put TOSS_SECRET_KEY --project-name albi-app

# 프롬프트에 입력:
# live_sk_xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Resend API Key 설정

```bash
npx wrangler secret put RESEND_API_KEY --project-name albi-app

# 프롬프트에 입력:
# re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 환경 변수 확인

```bash
# 설정된 Secret 목록 확인
npx wrangler secret list --project-name albi-app

# 출력 예시:
# TOSS_SECRET_KEY
# RESEND_API_KEY
```

### 4단계: 클라이언트 키 설정 (프론트엔드)

**주의**: 클라이언트 키는 공개되어도 안전하므로 코드에 직접 포함 가능

`public/payment.html` 파일 수정:

```javascript
// 테스트 키를 실제 키로 변경
const clientKey = 'live_ck_xxxxxxxxxxxxxxxx'; // Toss Payments 클라이언트 키
const tossPayments = TossPayments(clientKey);
```

---

## 배포 및 테스트

### 1단계: 빌드 및 배포

```bash
# 프로젝트 빌드
npm run build

# Cloudflare Pages에 배포
npm run deploy

# 또는
npx wrangler pages deploy public --project-name albi-app
```

### 2단계: 배포 확인

```bash
# 배포 URL 확인
# 출력: https://xxxxx.albi-app.pages.dev

# 커스텀 도메인 확인
curl -I https://albi.kr
```

### 3단계: 결제 테스트

#### 테스트 카드 정보 (Toss Payments)

```
카드번호: 4330-1234-5678-9012
유효기간: 12/28
CVC: 123
비밀번호 앞 2자리: 00

결과: 승인 성공
```

#### 테스트 시나리오

1. **결제 준비 테스트**
   ```bash
   curl -X POST https://albi.kr/api/payments/prepare \
     -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"applicationId":"app_123","jobId":"job_123"}'
   ```

2. **결제 페이지 접근**
   ```
   https://albi.kr/payment?applicationId=app_123&jobId=job_123
   ```

3. **테스트 카드로 결제 진행**
   - 결제 성공 시 → 영수증 페이지로 리다이렉트
   - 이메일 알림 수신 확인 (구인자, 구직자)

4. **결제 내역 확인**
   ```
   https://albi.kr/employer/mypage (결제 내역 탭)
   ```

### 4단계: 이메일 알림 테스트

1. **테스트 결제 진행**
   - 실제 금액 (50,000원) 결제
   - 또는 Toss Payments 테스트 모드 활용

2. **이메일 수신 확인**
   - 구인자: "결제가 완료되었습니다" 이메일
   - 구직자: "채용이 확정되었습니다" 이메일

3. **이메일 내용 확인**
   - 올바른 금액 표시
   - 영수증/마이페이지 링크 작동
   - 모바일 반응형 확인

### 5단계: 관리자 대시보드 확인

```
URL: https://albi.kr/admin-dashboard.html

확인 사항:
✅ 결제 통계 표시
✅ 결제 목록 조회
✅ 결제 수단별 통계
✅ 환불 처리 가능
```

---

## 트러블슈팅

### Toss Payments 관련

#### 문제: "인증되지 않은 요청입니다"

```
원인: Secret Key가 잘못 설정됨
해결: 
1. Secret Key 재확인
2. wrangler secret put TOSS_SECRET_KEY 재실행
3. 배포 후 테스트
```

#### 문제: "결제 수단을 사용할 수 없습니다"

```
원인: PG 연동이 완료되지 않음
해결:
1. Toss Payments 콘솔에서 PG 연동 상태 확인
2. 심사 진행 중이면 대기
3. 필요 서류 보완
```

#### 문제: "결제 금액이 일치하지 않습니다"

```
원인: 프론트엔드와 백엔드 금액 불일치
해결:
1. payment.html의 amount 확인
2. /api/payments/prepare API 응답의 amount 확인
3. 금액 계산 로직 점검
```

### Resend 이메일 관련

#### 문제: 이메일이 발송되지 않음

```
원인: API 키 또는 도메인 인증 문제
해결:
1. API 키 확인: wrangler secret list
2. 도메인 인증 상태 확인 (Resend 대시보드)
3. DNS 레코드 재확인
4. Cloudflare DNS 프록시 비활성화 (MX 레코드)
```

#### 문제: 이메일이 스팸으로 분류됨

```
원인: SPF/DKIM/DMARC 설정 미비
해결:
1. Resend 대시보드에서 DNS 레코드 재확인
2. DMARC 정책 강화 (p=quarantine 또는 p=reject)
3. 발신 패턴 개선 (천천히 발송량 증가)
4. 이메일 내용 품질 향상 (스팸 단어 제거)
```

#### 문제: API 요청 한도 초과

```
원인: Free Tier 월 3,000통 초과
해결:
1. 현재 사용량 확인 (Resend 대시보드)
2. Pro 요금제 업그레이드 ($20/월)
3. 이메일 발송 최적화 (불필요한 알림 제거)
```

### Cloudflare Pages 관련

#### 문제: 환경 변수가 인식되지 않음

```
원인: Secret이 제대로 설정되지 않음
해결:
1. wrangler secret list 확인
2. 철자 오류 확인 (TOSS_SECRET_KEY, RESEND_API_KEY)
3. 재배포 (npm run deploy)
4. 캐시 클리어 (Ctrl+Shift+R)
```

#### 문제: Functions 빌드 오류

```
원인: TypeScript 타입 오류 또는 의존성 문제
해결:
1. npm install로 의존성 재설치
2. TypeScript 에러 확인 (npm run build)
3. wrangler.jsonc 설정 확인
4. Functions 파일 경로 확인
```

---

## 체크리스트

배포 전 최종 확인:

### API 키 설정
- [ ] Toss Payments Secret Key 설정 완료
- [ ] Toss Payments Client Key 프론트엔드에 적용
- [ ] Resend API Key 설정 완료
- [ ] 환경 변수 목록 확인 (`wrangler secret list`)

### 도메인 및 DNS
- [ ] albi.kr 도메인 연결 확인
- [ ] Resend 도메인 인증 완료 (noreply@albi.kr)
- [ ] DNS 레코드 전파 확인

### 기능 테스트
- [ ] 테스트 결제 진행 (테스트 카드)
- [ ] 결제 성공 → 영수증 페이지 이동 확인
- [ ] 구인자 이메일 수신 확인
- [ ] 구직자 이메일 수신 확인
- [ ] 관리자 대시보드 결제 통계 확인
- [ ] 환불 프로세스 테스트

### 보안
- [ ] API 키 노출 여부 확인 (GitHub, 로그)
- [ ] HTTPS 적용 확인
- [ ] CORS 설정 확인
- [ ] 관리자 인증 확인

### 모니터링
- [ ] Cloudflare Analytics 확인
- [ ] Toss Payments 대시보드 확인
- [ ] Resend 대시보드 확인
- [ ] 에러 로그 모니터링 설정

---

## 추가 리소스

### 공식 문서
- **Toss Payments**: https://docs.tosspayments.com
- **Resend**: https://resend.com/docs
- **Cloudflare Pages**: https://developers.cloudflare.com/pages
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler

### 고객 지원
- **Toss Payments**: support@tosspayments.com
- **Resend**: support@resend.com
- **Cloudflare**: Cloudflare 대시보드 → Support

### 알비 내부 문서
- [결제 및 가격 전략](./PAYMENT_PRICING_STRATEGY.md)
- [배포 완료 보고서](./DEPLOYMENT_SUMMARY.md)
- [유니콘 전략 보고서](./UNICORN_STRATEGY_COMPLETION_REPORT.md)

---

## 문의

설정 과정에서 문제가 발생하면:

📧 **이메일**: albi260128@gmail.com  
📞 **전화**: 010-4459-4226  
🏢 **회사**: 알비 주식회사  

---

**마지막 업데이트**: 2026-02-16  
**작성자**: Claude AI Assistant  
**버전**: 1.0
