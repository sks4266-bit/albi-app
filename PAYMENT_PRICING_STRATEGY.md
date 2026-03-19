# 알비 결제 메커니즘 및 가격 정책

## 📊 결제 메커니즘 (Payment Mechanism)

### 1. 결제 시점 (Payment Trigger)
**매칭 성공 → 1시간 체험 완료 → 정식 채용 결정 → 결제 발생**

```
구직자 지원 → AI 면접 통과 → 사장님 1시간 체험 신청
    ↓
1시간 체험 완료 (체험비: 무료)
    ↓
사장님이 "정식 채용 결정" 버튼 클릭
    ↓
🔔 결제 페이지로 자동 이동 (결제 필수)
    ↓
결제 완료 → 알비에 성공 수수료 납부
    ↓
구직자에게 정식 채용 확정 알림 전송
```

### 2. 가격 정책 (Pricing Strategy)

#### 🏢 구인자(사장님) 결제 구조

**기본 원칙**: "성공한 만큼만 지불 (Pay Per Success)"

| 결제 시점 | 금액 | 조건 |
|----------|------|------|
| **공고 등록** | **무료** | 제한 없음 |
| **지원자 조회** | **무료** | 제한 없음 |
| **AI 면접 결과 조회** | **무료** | 제한 없음 |
| **1시간 체험 신청** | **무료** | 제한 없음 |
| **정식 채용 성공 시** | **50,000원** | ✅ **필수 결제** |

**정식 채용 성공 수수료: 50,000원**
- 1시간 체험 후 정식 채용 결정 시 발생
- 한 명 채용당 1회 결제
- VAT 별도 (총 55,000원)

#### 📊 수수료 정책 비교

**알바천국/알바몬 vs 알비**

| 항목 | 알바천국/알바몬 | 알비(ALBI) |
|------|---------------|-----------|
| 공고 등록비 | 월 30만원~ | **무료** |
| 구인자 모집 비용 | 없음 | **무료** |
| 채용 성공 수수료 | 없음 | **50,000원/명** |
| 총 비용 (월 3명 채용) | 30만원+ | **15만원** |
| 특징 | 선불 정액제 | **후불 성공 보수제** |

**알비의 경쟁력**:
- ✅ 초기 비용 **0원** (공고 등록 무료)
- ✅ 성공한 만큼만 지불 (Risk-Free)
- ✅ AI 면접으로 **채용 실패율 80% 감소**
- ✅ 1시간 체험으로 **미스매칭 방지**

#### 💰 수익 모델 시뮬레이션

**시나리오 1: 소규모 사장님 (월 1명 채용)**
```
알바천국: 30만원 (고정)
알비: 5만원 (성공 시만)
→ 절감액: 25만원 (83% 절감)
```

**시나리오 2: 중규모 사장님 (월 3명 채용)**
```
알바천국: 30만원 (고정)
알비: 15만원 (3명 × 5만원)
→ 절감액: 15만원 (50% 절감)
```

**시나리오 3: 대규모 프랜차이즈 (월 10명 채용)**
```
알바천국: 50만원+ (프리미엄 플랜)
알비: 50만원 (10명 × 5만원)
→ 동일 비용, But AI 면접으로 품질 보장
```

### 3. 결제 방법 (Payment Methods)

**지원 PG사: Toss Payments (토스페이먼츠)**

지원 결제 수단:
- ✅ 신용/체크카드 (모든 카드사)
- ✅ 계좌이체 (실시간)
- ✅ 가상계좌 (입금 확인 후 승인)
- ✅ 카카오페이
- ✅ 네이버페이
- ✅ 토스페이

### 4. 환불 정책 (Refund Policy)

#### 전액 환불 조건
1. **채용자 조기 퇴사** (7일 이내)
   - 환불: 100% 전액
   - 조건: 정당한 사유 (허위 이력, 무단결근 등)

2. **시스템 오류**
   - 환불: 100% 전액
   - 조건: 알비 시스템 장애로 인한 피해

#### 부분 환불 조건
1. **채용자 조기 퇴사** (8~30일)
   - 환불: 50% (25,000원)
   - 조건: 구인자 또는 구직자 사유

#### 환불 불가 조건
1. 31일 이상 근무 후 퇴사
2. 구인자 귀책 사유 (부당 대우, 미급여 등)
3. 환불 신청 기한 초과 (90일 경과)

### 5. 결제 플로우 (Payment Flow)

#### Frontend (구인자)
```typescript
// 1. 1시간 체험 완료 후 정식 채용 결정
const confirmHiring = async (applicationId: string) => {
  // 결제 페이지로 이동
  window.location.href = `/payment.html?applicationId=${applicationId}&amount=50000`;
}

// 2. 결제 페이지에서 Toss Payments 호출
const initiatePayment = async () => {
  const tossPayments = await loadTossPayments(CLIENT_KEY);
  
  await tossPayments.requestPayment('카드', {
    amount: 50000,
    orderId: generateOrderId(),
    orderName: '알비 채용 성공 수수료',
    customerName: user.name,
    successUrl: `${ORIGIN}/payment/success`,
    failUrl: `${ORIGIN}/payment/fail`,
  });
}

// 3. 결제 성공 콜백
const handlePaymentSuccess = async (params) => {
  // 서버에 결제 승인 요청
  await fetch('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
      applicationId: params.applicationId
    })
  });
}
```

#### Backend (API)
```typescript
// 1. 결제 승인 API
POST /api/payments/confirm
{
  paymentKey: string,
  orderId: string,
  amount: number,
  applicationId: string
}

// 2. Toss Payments API 호출 (결제 승인)
const confirmPayment = async (paymentKey, orderId, amount) => {
  const response = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${TOSS_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    }
  );
  return response.json();
}

// 3. 결제 기록 저장
await DB.prepare(`
  INSERT INTO payments 
  (id, user_id, application_id, job_id, amount, payment_method, 
   payment_status, transaction_id, pg_provider, paid_at, description)
  VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, 'toss', ?, ?)
`).bind(
  paymentId, userId, applicationId, jobId, 50000, 
  paymentMethod, transactionId, new Date().toISOString(),
  '알비 채용 성공 수수료'
).run();

// 4. job_applications 업데이트
await DB.prepare(`
  UPDATE job_applications 
  SET payment_required = 1, payment_id = ?, payment_amount = ?, status = 'hired'
  WHERE id = ?
`).bind(paymentId, 50000, applicationId).run();

// 5. 구직자에게 채용 확정 알림
await sendNotification(jobseekerId, '축하합니다! 정식 채용이 확정되었습니다 🎉');
```

## 📈 글로벌 확장 전략 (Global Expansion)

### 1. 단계별 확장 로드맵

**Phase 1: 한국 시장 장악 (2026 Q1-Q2)**
- 목표: 월간 활성 사용자 10만명
- 전략: 알바천국 대체 포지셔닝
- 결제: 원화(KRW) 단일 통화

**Phase 2: 아시아 진출 (2026 Q3-Q4)**
- 목표: 일본, 베트남, 필리핀 진출
- 전략: 현지 파트너십
- 결제: 다중 통화 지원 (JPY, VND, PHP)

**Phase 3: 글로벌 확장 (2027 Q1-Q4)**
- 목표: 미국, 유럽, 동남아 전역
- 전략: 글로벌 브랜딩
- 결제: 30개국 통화 지원

### 2. 다국어 지원 구조

**지원 언어 (우선순위)**
1. 한국어 (KO) - 메인
2. 영어 (EN) - 글로벌 표준
3. 일본어 (JA) - 아시아 시장
4. 중국어 간체 (ZH_CN) - 중국 시장
5. 베트남어 (VI) - 동남아 시장
6. 스페인어 (ES) - 남미 시장

**번역 파일 구조**
```
public/
├── locales/
│   ├── ko.json  # 한국어
│   ├── en.json  # 영어
│   ├── ja.json  # 일본어
│   ├── zh-cn.json  # 중국어 간체
│   ├── vi.json  # 베트남어
│   └── es.json  # 스페인어
```

### 3. 글로벌 결제 지원

**각국별 PG 연동 계획**

| 국가 | PG사 | 지원 결제 수단 |
|------|------|--------------|
| 🇰🇷 한국 | Toss Payments | 카드, 계좌이체, 간편결제 |
| 🇯🇵 일본 | Stripe, PayPay | JCB, PayPay, 편의점 결제 |
| 🇻🇳 베트남 | VNPay | 현지 은행, MoMo, ZaloPay |
| 🇵🇭 필리핀 | PayMongo | GCash, PayMaya, 카드 |
| 🇺🇸 미국 | Stripe | 카드, ACH, Venmo |
| 🇪🇺 유럽 | Stripe | 카드, SEPA, iDEAL |

### 4. 글로벌 가격 정책

**각국별 채용 성공 수수료**

| 국가 | 수수료 | 환율 기준 | 비고 |
|------|--------|----------|------|
| 한국 | 50,000원 | - | 기준 |
| 일본 | 5,000엔 | 1엔 = 10원 | PPP 조정 |
| 베트남 | 1,000,000동 | 1동 = 0.05원 | 현지 구매력 |
| 필리핀 | 1,000페소 | 1페소 = 23원 | 현지 구매력 |
| 미국 | $40 | 1달러 = 1,250원 | PPP 조정 |
| 유럽 | €35 | 1유로 = 1,450원 | PPP 조정 |

**가격 책정 기준**
- 구매력평가(PPP) 반영
- 현지 경쟁사 대비 20% 저렴
- 최저시급의 3~5배 수준

## 🚀 유니콘 기업으로 가는 길

### 1. 핵심 차별화 요소

**vs 알바천국**
- ✅ AI 면접으로 채용 품질 80% 향상
- ✅ 1시간 체험으로 미스매칭 제로
- ✅ 후불 성공 보수제 (초기 비용 0원)
- ✅ 글로벌 확장 가능 플랫폼

**vs Indeed/ZipRecruiter (글로벌 경쟁사)**
- ✅ AI 기반 퍼펙트 매칭 (90% 정확도)
- ✅ 1시간 체험 시스템 (세계 최초)
- ✅ 알비포인트 인센티브 시스템
- ✅ 모바일 최적화 (MZ세대 타겟)

### 2. 성장 지표 (KPI)

**2026년 목표**
- 월간 활성 사용자(MAU): 10만명
- 월간 거래액(GMV): 10억원
- 연간 매출(ARR): 120억원
- 구직자/구인자 비율: 5:1
- 채용 성공률: 80%
- 재사용률: 70%

**2027년 목표 (유니콘 도약)**
- MAU: 100만명 (10배 성장)
- GMV: 100억원/월
- ARR: 1,200억원
- 기업가치: 1조원+
- 글로벌 MAU: 30%

### 3. 수익화 전략 (Monetization)

**핵심 수익원**
1. 채용 성공 수수료: 70% (주력)
2. 프리미엄 기능: 20%
3. 광고 수익: 10%

**프리미엄 기능 (추후 도입)**
- 공고 상단 노출: 월 5만원
- AI 면접 우선권: 월 3만원
- 채용 데이터 분석: 월 10만원
- 복수 공고 패키지: 월 30만원

### 4. 투자 유치 전략

**Pre-Series A (2026 Q3)**
- 목표 금액: 50억원
- 투자자: 국내 VC (본엔젤스, 블루포인트파트너스)
- 사용처: 마케팅, 개발 인력 확충

**Series A (2027 Q1)**
- 목표 금액: 200억원
- 투자자: 글로벌 VC (Sequoia, Softbank)
- 사용처: 글로벌 확장, AI 고도화

**Series B (2027 Q4) - 유니콘 달성**
- 목표 금액: 1,000억원
- 기업가치: 1조원+
- 투자자: Tiger Global, DST Global
- 사용처: M&A, 글로벌 마케팅

### 5. 경쟁 우위 유지 전략

**기술 해자 (Technology Moat)**
- AI 면접 데이터 500만건+ 축적
- 머신러닝 매칭 정확도 95%+
- 1시간 체험 플랫폼 특허 출원

**네트워크 효과 (Network Effect)**
- 구직자 증가 → 구인자 증가
- 구인자 증가 → 더 많은 공고
- 더 많은 공고 → 구직자 재유입
- **선순환 구조 형성**

**브랜드 파워 (Brand Moat)**
- "알바 찾으면 알비" 브랜드 인지도
- MZ세대 1위 알바 플랫폼
- "AI 면접 = 알비" 동일시

## 📊 데이터베이스 스케일링 전략

### 1. 현재 구조 (Cloudflare D1)
- 용도: 프로토타입, 초기 서비스
- 한계: 100GB, 동시 요청 제한
- 적합: MAU 10만명까지

### 2. 중기 구조 (Hybrid Architecture)
- Primary: Cloudflare D1 (읽기 위주)
- Secondary: PostgreSQL (쓰기, 분석)
- Cache: Redis (세션, 실시간)

### 3. 장기 구조 (Microservices)
- User Service: PostgreSQL
- Job Service: MongoDB
- Payment Service: MySQL
- Analytics: BigQuery
- Cache: Redis Cluster

## 🔐 보안 및 컴플라이언스

### 1. 데이터 보안
- SSL/TLS 암호화
- 개인정보 암호화 저장
- 정기 보안 감사

### 2. 규제 대응
- 한국: 개인정보보호법 준수
- 유럽: GDPR 대응
- 미국: CCPA 대응

### 3. 결제 보안
- PCI-DSS Level 1 인증
- 3D Secure 인증
- 사기 탐지 시스템

---

**문서 작성일**: 2026-02-16  
**최종 검토**: 박지훈 대표  
**다음 업데이트**: 2026-03-01
