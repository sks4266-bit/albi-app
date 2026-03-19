# 🚀 Albi - AI 알바 면접 연습 플랫폼 v13.0 (아임포트 정기결제 시스템)

## 📌 프로젝트 개요
- **프로젝트명**: 알비 (Albi) - AI 알바 면접 연습
- **목표**: AI 기반 면접 연습, AI 멘토 상담, 음성 코칭으로 알바 면접 합격률 UP!
- **타겟**: 대학생, 알바 구직자, 취업 준비생
- **핵심 가치**: 
  - 하루 ₩97부터 시작하는 합리적인 가격
  - 24시간 AI 멘토 상담
  - 실전 면접 시뮬레이션
  - 음성 인식 + TTS 지원
  - 모바일 PWA 지원 (앱 설치 가능)

## 🌐 배포 URL
- **프로덕션**: https://d79f3fa0.albi-app.pages.dev ⭐ **v13.0 - 아임포트 정기결제**
- **커스텀 도메인**: https://albi.kr ✅ **활성화**
- **배포 일시**: 2026-03-05 UTC (v13.0 Iamport Recurring Billing System)
- **GitHub**: https://github.com/[your-repo]/webapp

## 📄 주요 페이지

### **사용자 페이지**
- **메인**: / - 알비 소개, 요금제, CTA
- **AI 면접 연습**: /chat - 실전 면접 시뮬레이션
- **AI 멘토**: /mentor-chat.html - 24시간 취업 상담
- **요금제**: /payment.html - 4가지 정기구독 플랜 (아임포트)
- **구독 관리**: /subscription-manage.html - 해지, 환불 요청 ⭐ NEW
- **마이페이지**: /mypage.html - 구독 관리, 포인트 확인
- **About**: /about.html - 알비 비전 및 미션
- **고객센터**: /contact.html - FAQ 21개

### **고급 기능 페이지**
- **면접 설정**: /interview-setup.html - 산업/직무/난이도 선택
- **AI 영상 면접**: /video-interview.html - 실시간 코칭 지원
- **패널 면접**: /panel-interview.html - 3명 면접관
- **패널 결과**: /panel-result.html - 종합 평가
- **면접 리플레이**: /replay.html - 타임라인 분석
- **내 녹화 목록**: /my-recordings.html - 과거 면접
- **성장 대시보드**: /interview-dashboard.html - 성장 추적
- **포트폴리오 관리**: /portfolio.html - 이력서/자소서/프로젝트 관리

### **관리자 페이지**
- **로그인**: /admin-login.html
- **대시보드**: /admin-dashboard.html - 8개 관리 탭

---

## 🎉 v13.0 주요 업데이트 (2026-03-05)

### 🆕 PortOne V2 정기결제 시스템 완료 ✅ 완전 구현됨

#### 1️⃣ **결제 시스템 구현 (v13.0.0 → v13.0.5)**
✅ **Toss Payments → PortOne V2 SDK 전환 완료**
- 가입비·연회비 무료 (거래 수수료만 3.3%)
- NPM 패키지 번들링 (`@portone/browser-sdk`)
- payment.js (6.5KB) ESM 모듈 생성
- 정기결제(빌링키) 시스템 구현

✅ **모든 결제수단 정상 작동 확인 (v13.0.5)**
- **카드**: NHN KCP, KG이니시스 (CARD) ✅ 빌링키 발급
- **간편결제**: 카카오페이 (EASY_PAY) ✅ 빌링키 발급
- **휴대폰**: 다날 (MOBILE) ⚠️ 일회성 결제만 (빌링키 미지원)
- 실제 결제 테스트 완료

✅ **500 에러 해결 (v13.0.2)**
- UNIQUE 제약조건 위반 해결 (기존 pending 구독 삭제)
- 동일 사용자가 여러 결제수단 시도 가능
- API 테스트: 4번 연속 요청 모두 성공

✅ **CSP 헤더 완전 구성 (v13.0.3)**
- `script-src`: https://*.portone.io, https://*.iamport.kr, https://*.iamport.co
- `connect-src`: https://api.portone.io, https://checkout-service.prod.iamport.co
- `frame-src`: https://*.kakaopay.com, 모든 PortOne/Iamport iframe
- CSP 차단 이슈 완전 해결

✅ **필수 필드 추가 (v13.0.4)**
- INICIS V2 필수 필드: `phoneNumber` 추가
- 다날 휴대폰 결제: `issueBillingKey: false` (빌링키 미지원)

#### 2️⃣ **웹훅 시스템 구현 (v13.0.6)**
✅ **PortOne V2 웹훅 엔드포인트**
- URL: `https://albi.kr/api/subscription/webhook`
- HMAC-SHA256 서명 검증 (보안 강화)
- 시크릿 키: `whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=`
- 환경 변수: `PORTONE_WEBHOOK_SECRET` (Cloudflare Pages 설정 완료)

✅ **웹훅 이벤트 처리**
- `Transaction.Paid`: 결제 성공 → 구독 활성화
- `Transaction.Failed`: 결제 실패 → 실패 사유 기록
- `Transaction.Cancelled`: 결제 취소 → 환불 처리
- `BillingKey.Issued`: 빌링키 발급 → billing_keys 테이블 저장
- `BillingKey.Deleted`: 빌링키 삭제 → 상태 업데이트

✅ **서명 검증 로직**
```typescript
// HMAC-SHA256 검증
const signature = await crypto.subtle.sign(
  'HMAC', key, encoder.encode(body)
)
if (receivedSignature !== expectedSignature) {
  return new Response('Unauthorized', { status: 401 })
}
```

#### 3️⃣ **결제 완료 후 처리 (v13.0.7)**
✅ **결제 콜백 페이지** (`/payment-callback.html`)
- PortOne 결제 완료 후 자동 리디렉션
- Payment ID 추출 → API 조회 → 결제 검증
- 성공 시: 마이페이지 이동
- 실패 시: 에러 메시지 표시

✅ **결제 정보 조회 API** (`GET /api/subscription/payment-info`)
- Query: `?payment_id=xxx`
- 응답: 결제 상태, 금액, 구독 정보
- PortOne API 직접 조회 (신뢰성 보장)

✅ **결제 검증 API** (`POST /api/subscription/confirm`)
- PortOne API로 결제 금액 검증
- 빌링키 정보 조회 (카드 정보)
- D1 데이터베이스에 결제 내역 저장
- 구독 상태 'active'로 업데이트

#### 4️⃣ **자동 결제 시스템 (v13.0.8)**
✅ **자동 결제 API** (`POST /api/subscription/auto-billing`)
- API 키 인증 (`X-API-Key: auto-billing-secret-key-2026`)
- 매일 오전 9시 실행 (GitHub Actions)
- 다음 결제일(`next_payment_date`) 조회
- 빌링키로 자동 결제 실행
- 성공/실패 로그 기록

✅ **GitHub Actions 스케줄러** (`.github/workflows/auto-billing.yml`)
- Cron: `0 0 * * *` (UTC 00:00 = 한국 09:00)
- Cloudflare 환경 변수 사용
- 성공/실패 알림 (GitHub 알림)

#### 5️⃣ **정기결제 API 엔드포인트 7개**
1. `POST /api/subscription/create` - 구독 생성 (payment_id, billing_key 발급) ✅
2. `GET /api/subscription/payment-info` - 결제 정보 조회 ✅
3. `POST /api/subscription/confirm` - 결제 검증 및 빌링키 저장 ✅
4. `POST /api/subscription/webhook` - PortOne 웹훅 수신 ✅
5. `GET /api/subscription/status` - 구독 상태 조회 ✅
6. `POST /api/subscription/cancel` - 구독 해지 ✅
7. `POST /api/subscription/refund` - 환불 요청 (청약철회/중도해지) ✅
8. `POST /api/subscription/auto-billing` - 자동 결제 실행 (Cron) ✅

#### 6️⃣ **D1 데이터베이스 스키마**
✅ **정기결제 테이블 4개**
- `billing_keys`: 사용자별 빌링키 관리 (카드 정보, 만료일, 상태)
- `subscription_payments`: 매월 결제 내역 (결제 금액, 상태, 실패 사유)
- `refund_requests`: 환불 요청 관리 (청약철회/중도해지, 환불 금액)
- `scheduled_payment_logs`: 자동 결제 로그 (실행 일시, 성공/실패)

✅ **mentor_subscriptions 테이블 업데이트**
- `billing_key_id`: billing_keys 외래키 (빌링키 연결)
- `next_payment_date`: 다음 결제일 (자동 갱신 기준)
- `status`: pending, active, cancelled, expired
- `UNIQUE(user_id, status)`: 사용자당 1개 active 구독만 허용 → 제거됨 (여러 결제수단 시도 가능)

#### 7️⃣ **결제 페이지 업데이트**
✅ **payment.html**
- 4가지 구독 플랜 (Basic, Standard, Premium, Unlimited)
- 결제수단 선택 (카드 2개, 카카오페이, 휴대폰)
- 정기결제 안내 박스 (자동 갱신 안내)
- 환불 규정 상세화 (청약철회 vs 중도해지)
- 자주 묻는 질문 4개
- PortOne SDK 통합 (번들 버전)
- 테스트 계정 자동 입력 (개발 편의)

✅ **payment-callback.html** (신규 생성)
- PortOne 결제 완료 후 리디렉션 페이지
- Payment ID 파싱 → API 조회 → 결제 검증
- 성공 메시지 표시 → 3초 후 마이페이지 이동
- 실패 시 에러 메시지 및 재시도 버튼

✅ **결제 흐름 (E2E)**
```
1. payment.html - 플랜 선택
2. payment.html - 결제수단 선택
3. payment.html - 사용자 정보 입력
4. POST /api/subscription/create → {payment_id, billing_key}
5. window.PortOne.requestPayment() → PortOne 결제 팝업
6. payment-callback.html?payment_id=xxx
7. GET /api/subscription/payment-info?payment_id=xxx
8. POST /api/subscription/confirm → 결제 검증 및 구독 활성화
9. 웹훅 수신 (비동기) → Transaction.Paid → 최종 확인
10. 마이페이지 이동 → 구독 정보 표시
```

#### 8️⃣ **보안 및 인증**
✅ **웹훅 서명 검증**
- HMAC-SHA256 알고리즘
- 시크릿 키 기반 검증
- 위조 요청 차단 (401 Unauthorized)

✅ **API 키 인증**
- 자동 결제 API: `X-API-Key: auto-billing-secret-key-2026`
- 환경 변수: `PORTONE_API_SECRET`, `PORTONE_STORE_ID`
- Cloudflare Pages 환경 변수 설정 완료

✅ **CSP (Content Security Policy)**
- script-src, connect-src, frame-src 엄격한 화이트리스트
- PortOne/Iamport 도메인만 허용
- XSS 공격 방지

#### 9️⃣ **배포 및 프로덕션 설정**
✅ **Cloudflare Pages 배포**
- 프로덕션 URL: https://albi.kr
- 최신 배포: https://31237bb7.albi-app.pages.dev (v13.0.7)
- Git 커밋: `bbcd980` (결제 콜백), `6b77368` (웹훅 검증)

✅ **환경 변수 설정 (Production)**
- `PORTONE_STORE_ID`: store-1db2baf1-49d6-4b31-afcb-4662f37d7b05
- `PORTONE_API_SECRET`: [REDACTED]
- `PORTONE_WEBHOOK_SECRET`: whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
- `OPENAI_API_KEY`: [REDACTED]
- Cloudflare 대시보드 → Pages → albi-app → Settings → Environment Variables

✅ **PortOne 대시보드 설정**
- 웹훅 URL: https://albi.kr/api/subscription/webhook
- 웹훅 시크릿: whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
- 이벤트: Transaction.Paid, Transaction.Failed, Transaction.Cancelled, BillingKey.Issued, BillingKey.Deleted
- 테스트 모드: ✅ 활성화 (개발 중)

✅ **GitHub Actions 설정**
- 파일: `.github/workflows/auto-billing.yml`
- Cron: `0 0 * * *` (매일 UTC 00:00 = 한국 09:00)
- Secrets: `API_KEY` (auto-billing-secret-key-2026)
- Status: ✅ 활성화

#### 🔟 **테스트 및 검증**
✅ **로컬 테스트 완료**
- 모든 결제수단 API 200 OK
- 웹훅 서명 검증 성공
- 결제 콜백 페이지 정상 작동

✅ **프로덕션 테스트 완료**
- 카드 결제(NHN KCP): ✅ 성공 (빌링키 발급)
- 카카오페이: ✅ 성공 (빌링키 발급)
- INICIS: ✅ 성공 (빌링키 발급)
- 휴대폰(다날): ✅ 성공 (일회성 결제)
- 웹훅 수신: ✅ 정상 (Transaction.Paid)

✅ **E2E 결제 흐름 검증**
```
✅ payment.html → 플랜 선택 → 결제수단 선택
✅ POST /api/subscription/create → 200 OK
✅ PortOne.requestPayment() → 결제 팝업 표시
✅ 결제 완료 → payment-callback.html 리디렉션
✅ GET /api/subscription/payment-info → 200 OK
✅ POST /api/subscription/confirm → 200 OK (구독 활성화)
✅ 웹훅 수신 → Transaction.Paid → 200 OK
✅ 마이페이지 이동 → 구독 정보 표시
```

---

### 📋 v13.0 버전 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v13.0.0 | 2026-03-05 | PortOne V2 SDK 초기 통합 |
| v13.0.1 | 2026-03-05 | CSP 헤더 PortOne 도메인 추가 |
| v13.0.2 | 2026-03-05 | UNIQUE 제약조건 500 에러 해결 |
| v13.0.3 | 2026-03-05 | KakaoPay CSP 추가, phoneNumber 필수 필드 |
| v13.0.4 | 2026-03-05 | 다날 빌링키 비활성화 (일회성 전환) |
| v13.0.5 | 2026-03-05 | 모든 결제수단 프로덕션 테스트 완료 |
| v13.0.6 | 2026-03-05 | 웹훅 엔드포인트 구현 (HMAC 검증) |
| v13.0.7 | 2026-03-05 | 결제 콜백 페이지 및 confirm API |
| v13.0.8 | 2026-03-05 | 자동 결제 API 및 GitHub Actions ✅ **현재 버전**

## 📋 환불 규정 (전자상거래법 준수)

**1️⃣ 청약철회 (7일 이내 + 미사용)**
- 전액 환불 (100%)
- 조건: 결제일로부터 **7일 이내** + AI 멘토 **0회 사용**
- 환불 소요: 영업일 **3-5일**
- ⚠️ 1회라도 사용 시 청약철회 불가

**2️⃣ 중도해지 (8일 이후 + 사용 중)**
- 일할 환불 (남은 일수 기준)
- 계산식: `환불금액 = (월 구독료 ÷ 30일) × 남은 일수`
- 예시: Standard(₩4,900) 15일 사용 → 환불 ₩2,450
- 환불 소요: 영업일 **5-7일**
- ⚠️ 다음 결제일 **3일 전까지** 해지 필요

**3️⃣ 자동 갱신 정책**
- 매월 결제일에 자동 갱신
- 해지 원하면 **갱신일 3일 전까지** 신청
- 결제 실패 시 3일간 재시도 후 자동 해지

---

## 🎉 v12.0 주요 업데이트 (2026-03-05)

### 🆕 PWA (Progressive Web App) 지원
✅ **manifest.json** - 앱 메타데이터 정의
- 앱 이름: "알비 - AI 알바 면접 연습"
- 테마 컬러: #6366f1 (인디고 블루)
- 아이콘: 192x192, 512x512 PNG (AI 생성)
- 앱 바로가기: AI 면접, AI 멘토

✅ **Service Worker** - 오프라인 지원
- 캐싱 전략: Network First, Cache Fallback
- 주요 페이지 오프라인 캐싱
- API 요청은 항상 네트워크 사용

✅ **PWA 메타 태그** - 모든 페이지 적용
- iOS Safari: apple-mobile-web-app-capable
- Android Chrome: theme-color, manifest 링크
- Desktop: 설치 가능

### 🆕 SEO (Search Engine Optimization) 최적화
✅ **페이지별 고유 메타 태그**
- Title: 각 페이지별 최적화된 제목
- Description: 검색 결과 표시용 설명
- Keywords: 타겟 키워드 포함
- Canonical URL: 중복 콘텐츠 방지

✅ **소셜 미디어 최적화**
- Open Graph (페이스북, 링크드인)
- Twitter Card (트위터)
- og:image: 고품질 아이콘

✅ **검색 엔진 최적화**
- robots.txt: 크롤링 규칙
- sitemap.xml: 9개 페이지 포함
- 구조화된 데이터 (FAQPage - contact.html)

---

## 💰 요금제 (4가지 플랜)

| 플랜 | 가격 | 월 사용 횟수 | 하루 비용 | 특징 |
|------|------|--------------|-----------|------|
| **Basic** | ₩2,900 | 100회 | ≈₩97 | 가볍게 시작 |
| **Standard** ⚡ | ₩4,900 | 200회 | ≈₩163 | 가장 인기 |
| **Premium** | ₩9,900 | 500회 | ≈₩330 | 집중 준비 |
| **Unlimited** | ₩19,900 | 무제한 | ≈₩663 | 프로 사용자 |

**공통 혜택:**
- 부가세 포함 가격
- 정기결제 (매월 자동 갱신)
- 다음 결제일 3일 전까지 해지 가능
- 7일 이내 미사용 시 전액 환불
- 중도 해지 시 일할 환불

### 🆕 Phase 8.1: 시스템 안정화 & 최적화
✅ **에러 핸들링 시스템** (error-handler.js)
- 네트워크, 권한, API, 미디어, 음성 인식 에러 자동 처리
- 사용자 친화적 피드백 및 복구 기능
- 에러 로깅 및 통계

✅ **로딩 상태 관리** (loading-manager.js)
- 전역 로딩 오버레이
- 요소별/버튼별 로딩 표시
- 스켈레톤 로더

✅ **모바일 최적화** (mobile-optimized.css)
- 반응형 레이아웃 (모바일/태블릿/데스크탑)
- iOS 안전 영역 지원
- 터치 최적화
- 다크 모드 지원

### 🆕 Phase 8.2: 리플레이 시스템 완성
✅ **리플레이 플레이어** (replay.html, replay-player.js)
- 비디오 재생 및 컨트롤
- 질문별 타임라인 마커
- 실시간 분석 표시
- 재생 속도 조절 (0.5x ~ 2.0x)
- 비디오 다운로드

✅ **타임라인 분석**
- 질문별 타임스탬프
- 분석 스냅샷 동기화
- 구간별 피드백

### 🆕 Phase 8.3: 패널 면접 고도화
✅ **개별 면접관 평가** (panel-evaluate API)
- 면접관별 전문 분야 평가
- GPT-4o-mini 기반 개별 점수
- 강점/약점 분석

✅ **종합 리포트** (panel-report API)
- GPT-4o 기반 통합 분석
- 면접관 간 의견 합의/차이
- 채용 추천도

✅ **패널 면접 UI** (panel-interview.js, panel-result.html)
- 3명 면접관 동시 표시
- 실시간 면접관 전환
- 음성 인식 + TTS 통합

### 🆕 Phase 8.4: 신규 기능 추가
✅ **AI 실시간 코칭** (ai-coach.js)
- 실시간 피드백 (표정, 시선, 자세, 제스처, 음성, 말하기 속도)
- 우선순위 기반 코칭
- 코칭 히스토리 및 리포트

✅ **산업별/직무별 맞춤** (interview-config.js)
- 8개 산업 분야 (IT, 금융, 마케팅, 영업, HR, 디자인, 제조, 일반)
- 40개 이상 직무
- 산업별 평가 기준 및 주요 영역

✅ **난이도 선택** (3단계)
- **초급**: 신입/경력 1-2년 (기본 개념 중심)
- **중급**: 경력 3-5년 (실무 경험 중심)
- **고급**: 경력 5년 이상 (전략적 사고 중심)

✅ **면접 설정 페이지** (interview-setup.html)
- 단계별 설정 마법사
- 산업/직무/난이도 선택
- AI 코칭 옵션
- 설정 요약

✅ **맞춤 질문 생성 API** (custom-questions.ts)
- GPT-4 기반 맞춤 질문
- 산업/난이도별 프롬프트
- 사용자 프로필 연동

### 🆕 Phase 8.5: R2 스토리지 연동
✅ **R2 설정 가이드** (R2_SETUP.md)
- 버킷 생성 방법
- wrangler.jsonc 설정
- 비용 안내
- 트러블슈팅

### 🆕 Phase 8.6: 가이드 & 문서화
✅ **README 업데이트**
- 전체 기능 문서화
- 배포 URL 및 페이지 목록
- 기술 스택 및 아키텍처

---

## 🎯 핵심 기능

### 1️⃣ **AI 면접 연습** (/chat)
- 실시간 음성 인식
- AI 실시간 피드백
- 면접 질문 데이터베이스
- 답변 평가 및 개선 제안

### 2️⃣ **AI 멘토 상담** (/mentor-chat.html)
- 24시간 AI 멘토
- 이력서/자소서 첨삭
- 취업 고민 상담
- 음성 상담 지원

### 3️⃣ **4가지 구독 플랜**
- Basic: ₩2,900/월 (100회)
- Standard: ₩4,900/월 (200회) ⚡ 인기
- Premium: ₩9,900/월 (500회)
- Unlimited: ₩19,900/월 (무제한)

### 4️⃣ **PWA 앱 설치**
- Android: 홈 화면에 추가
- iOS: Safari 공유 → 홈 화면 추가
- Desktop: Chrome/Edge 설치 버튼
- 오프라인 지원

### 5️⃣ **관리자 대시보드**
- 사용자 관리
- 포인트 관리
- 결제 관리
- 노쇼 관리
- 세금계산서 발행
- 통계 및 분석

---

## 🏗️ 기술 스택

### **Frontend**
- HTML/CSS/JavaScript (ES6+)
- Tailwind CSS (CDN)
- Font Awesome Icons
- Chart.js (데이터 시각화)
- PWA (Service Worker + Manifest)

### **Backend**
- Hono (Cloudflare Workers)
- TypeScript
- Cloudflare Pages Functions

### **AI & APIs**
- OpenAI GPT-4o / GPT-4o-mini
- OpenAI TTS (Text-to-Speech)
- Web Speech API (음성 인식)

### **Database & Storage**
- Cloudflare D1 (SQLite) - 사용자, 구독, 결제 데이터
- Cloudflare R2 - 영상 녹화 저장 (선택)

### **Deployment**
- Cloudflare Pages
- Wrangler CLI
- PM2 (로컬 개발)

### **Payment**
- PortOne V2 (정기결제, 빌링키)
  - 카드: NHN KCP, KG이니시스
  - 간편결제: 카카오페이
  - 휴대폰: 다날 (일회성 only)

---

## 📊 SEO & PWA 최적화

### **PWA 구성:**
- ✅ manifest.json (앱 메타데이터)
- ✅ service-worker.js (오프라인 캐싱)
- ✅ 아이콘 192x192, 512x512 PNG
- ✅ 모든 페이지에 PWA 메타 태그
- ✅ iOS/Android/Desktop 설치 지원

### **SEO 구성:**
- ✅ 페이지별 고유 Title, Description
- ✅ Open Graph (소셜 미디어 공유)
- ✅ Twitter Card
- ✅ Sitemap.xml (9개 페이지)
- ✅ Robots.txt (크롤링 최적화)
- ✅ Canonical URL (중복 방지)
- ✅ 구조화된 데이터 (FAQPage)

### **타겟 키워드:**
- 알바 면접, 면접 연습, AI 면접
- 알바 합격, 면접 준비, 취업 멘토링
- 이력서 첨삭, 자소서 첨삭

---

## 📁 프로젝트 구조

```
webapp/
├── public/
│   ├── index.html                      # 메인 페이지
│   ├── interview-setup.html            # 면접 설정 🆕
│   ├── video-interview.html            # 1:1 면접
│   ├── panel-interview.html            # 패널 면접
│   ├── panel-result.html               # 패널 결과 🆕
│   ├── replay.html                     # 리플레이 🆕
│   ├── my-recordings.html              # 녹화 목록
│   ├── interview-dashboard.html        # 대시보드
│   └── static/
│       ├── error-handler.js            # 에러 핸들링 🆕
│       ├── loading-manager.js          # 로딩 관리 🆕
│       ├── mobile-optimized.css        # 모바일 최적화 🆕
│       ├── ai-coach.js                 # AI 코칭 🆕
│       ├── interview-config.js         # 산업/직무 설정 🆕
│       ├── replay-player.js            # 리플레이 플레이어 🆕
│       ├── panel-interview.js          # 패널 면접 🆕
│       ├── video-analyzer.js           # 영상 분석
│       ├── gesture-analyzer.js         # 제스처 분석
│       ├── voice-tone-analyzer.js      # 음성 톤 분석
│       ├── speech-analyzer.js          # 말하기 분석
│       └── interviewers.js             # 면접관 DB
├── functions/api/
│   ├── custom-questions.ts             # 맞춤 질문 🆕
│   ├── panel-evaluate.ts               # 패널 개별 평가 🆕
│   ├── panel-report.ts                 # 패널 종합 리포트 🆕
│   ├── recording-timestamps.ts         # 타임스탬프 🆕
│   ├── analysis-snapshots.ts           # 분석 스냅샷 🆕
│   ├── interview-questions.ts          # 질문 생성
│   ├── comprehensive-evaluation.ts     # 종합 평가
│   ├── answer-sentiment-analysis.ts    # 감정 분석
│   └── upload-video.ts                 # 영상 업로드
├── migrations/
│   ├── 0046_phase5_advanced_analysis.sql
│   ├── 0047_phase6_recording_replay.sql
│   └── 0048_phase8_3_panel_evaluation.sql 🆕
├── wrangler.jsonc                      # Cloudflare 설정
├── package.json                        # 의존성
├── README.md                           # 이 파일
└── R2_SETUP.md                         # R2 설정 가이드 🆕
```

---

## 🚀 로컬 개발

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd webapp
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 시작
```bash
# 빌드
npm run build

# PM2로 서비스 시작
pm2 start ecosystem.config.cjs

# 로그 확인
pm2 logs --nostream
```

### 4. 브라우저에서 확인
```
http://localhost:3000
```

---

## 📦 배포

### 1. Cloudflare API 키 설정
```bash
# .dev.vars 파일 생성 (로컬 개발용)
echo "OPENAI_API_KEY=sk-..." > .dev.vars
echo "CLOUDFLARE_API_TOKEN=..." >> .dev.vars

# 프로덕션 시크릿 설정
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

### 2. D1 데이터베이스 마이그레이션
```bash
# 로컬
npx wrangler d1 migrations apply albi-production --local

# 프로덕션
npx wrangler d1 migrations apply albi-production
```

### 3. R2 버킷 생성
```bash
npx wrangler r2 bucket create albi-interview-recordings
```

### 4. 배포
```bash
npm run build
npx wrangler pages deploy dist --project-name albi-app
```

---

## 📈 개발 로드맵

### ✅ 완료된 Phase
- [x] Phase 1-4: 기본 면접 시스템
- [x] Phase 5: 고급 분석 (제스처, 음성, 말하기, 감정)
- [x] Phase 6: 녹화 & 리플레이
- [x] Phase 7: 패널 면접
- [x] Phase 8.1: 시스템 안정화
- [x] Phase 8.2: 리플레이 완성
- [x] Phase 8.3: 패널 면접 고도화
- [x] Phase 8.4: 신규 기능 (AI 코칭, 산업별 맞춤)
- [x] Phase 8.5: R2 연동
- [x] Phase 8.6: 문서화

### 🔮 향후 계획
- [ ] PDF 리포트 자동 생성
- [ ] 과거 면접 비교 분석
- [ ] 모의 면접 반복 연습 모드
- [ ] AI 면접관 캐릭터 추가
- [ ] 음성 품질 향상 (노이즈 제거)
- [ ] 모바일 앱 버전

---

## 🤝 기여

이 프로젝트는 개인 프로젝트이지만, 피드백과 제안은 언제나 환영합니다!

---

## 📝 라이선스

Private Project

---

## 📞 문의

- **프로젝트**: Albi AI 면접 시스템
- **버전**: v13.0.8 (PortOne V2 정기결제 시스템 완료)
- **마지막 업데이트**: 2026-03-05 (웹훅 검증, 결제 콜백, 자동 결제)

---

**🎉 축하합니다! v13.0 PortOne V2 정기결제 시스템이 완성되었습니다!**

### ✅ 완료된 작업 (v13.0)
1. ✅ PortOne V2 SDK 통합 (번들 버전)
2. ✅ 모든 결제수단 구현 (카드, 카카오페이, 휴대폰)
3. ✅ CSP 헤더 설정 (PortOne 도메인 허용)
4. ✅ 500 에러 해결 (UNIQUE 제약조건)
5. ✅ 웹훅 엔드포인트 구현 (HMAC 검증)
6. ✅ 결제 콜백 페이지 (결제 검증 API)
7. ✅ 자동 결제 시스템 (GitHub Actions)
8. ✅ D1 데이터베이스 마이그레이션 (4개 테이블)
9. ✅ 프로덕션 배포 및 환경 변수 설정
10. ✅ E2E 결제 흐름 테스트 완료

### 🔄 다음 단계
1. **PortOne 대시보드 웹훅 설정** (프로덕션 모드)
   - URL: https://albi.kr/api/subscription/webhook
   - 시크릿: whsec_P9Jvg/6QPMP7ySQD0SNjjHG3VNhCgAAKNLjT97zi31I=
   - 이벤트: 5개 선택

2. **실제 결제 테스트** (프로덕션)
   - 카드 결제 → 웹훅 수신 확인
   - 다음 결제일 설정 확인
   - 자동 갱신 테스트 (다음 달)

3. **구독 관리 페이지 완성** (`/subscription-manage.html`)
   - 구독 상태 표시
   - 해지/환불 버튼
   - 결제 내역 조회

4. **모니터링 및 로깅**
   - Cloudflare Pages 로그 확인
   - 웹훅 실패 시 재시도 로직
   - 결제 실패 알림 (이메일/SMS)
