# 포인트 시스템 최적화 (2026-02-15)

## 📊 문제 인식
기존 포인트 시스템은 과도한 포인트 지급으로 인해 스토어 상품 소진 문제와 수익 구조 불균형이 발생했습니다.

### 기존 문제점
- **회원가입 시 1,020P 지급** (추천코드 사용 시) → 스토어 최고가 상품 3개 이상 구매 가능
- **추천인에게 500P 지급** → 과도한 인센티브
- **중복된 포인트 로직** → referral API와 signup API에서 이중 처리
- **1시간 체험 신청 -10P** → 너무 낮은 비용으로 신중하지 않은 신청 유발

## 🎯 최적화 목표
**스토어 상품 가격 기준 경제성 있는 포인트 분배**

### 스토어 상품 가격 분석
| 상품 | 가격 |
|---|---|
| 메가커피, 이모티콘 | 50P |
| 스타벅스, GS25, CU | 100P |
| 배스킨라빈스, 투썸 | 150P |
| CGV, 올리브영 | 200P |
| BBQ, 도미노피자 | 300P |

**평균가: 약 160P**

## ✅ 새로운 포인트 정책

### 1. 회원가입 및 추천 시스템
| 항목 | 이전 | 최적화 | 변경 이유 |
|---|---|---|---|
| **기본 회원가입** | 20P | **50P** | 최저가 상품 1개 구매 가능 |
| **추천코드로 가입** | 1,020P | **100P** | 최저가 2개 또는 중간가 1개 |
| **추천인 보상 (가입 시)** | 500P | **50P** | 적정한 친구 초대 인센티브 |
| **추천인 보상 (첫 고용 시)** | 3,000P (미구현) | **200P** | 실제 성과에 대한 합리적 보상 |

### 2. 활동 포인트
| 항목 | 이전 | 최적화 | 변경 이유 |
|---|---|---|---|
| **AI 매칭 완료** | 100P (미구현) | **30P** | 소소한 활동 참여 보상 |
| **1시간 체험 신청** | -10P | **-30P** | 신중한 신청 유도 |
| **체험 취소/거절 환불** | +10P | **+30P** | 차감액 전액 환불 |

### 3. 스토어 구매
- **포인트 차감**: 상품 가격만큼 정확히 차감 ✅ (기존과 동일)
- **구매 후 잔액 업데이트**: 정상 작동 ✅

## 🔄 수정된 파일

### 1. `/functions/api/auth/signup.ts`
**변경사항:**
- 기본 가입: 20P → **50P**
- 추천코드 가입: 1,020P → **100P**
- 추천인 보상: 500P → **50P**
- 메시지 업데이트

**주요 코드:**
```typescript
// 포인트 지급
referrerId ? 100 : 50

// 포인트 내역
signupPoints = referrerId ? 100 : 50
description = referrerId 
  ? '가입 축하 포인트 (50P) + 추천 코드 사용 보너스 (50P)' 
  : '가입 축하 포인트 (50P)'

// 추천인 보상
UPDATE users SET points = points + 50 WHERE id = ?
```

### 2. `/functions/api/referral/[[path]].ts`
**변경사항:**
- `/apply-code` 엔드포인트 비활성화 (중복 제거)
- signup.ts에서 통합 처리하도록 안내 메시지 반환

**이유:** 
- 기존에는 signup.ts와 referral API에서 이중으로 포인트를 지급
- 하나의 엔드포인트(signup)에서만 처리하도록 통합

### 3. `/functions/api/experiences/[[path]].ts`
**변경사항:**
- 체험 신청 비용: 10P → **30P**
- 모든 관련 로직 업데이트 (포인트 확인, 차감, 환불, 메시지)

**주요 코드:**
```typescript
// 포인트 확인
if (!user || user.points < 30) {
  return c.json({ error: '포인트가 부족합니다. (필요: 30P)' }, 400)
}

// 차감
UPDATE users SET points = points - 30

// 내역
INSERT INTO point_transactions ... VALUES (..., -30, '1시간 체험 신청', ...)
```

### 4. `/functions/api/ai-matching.ts`
**변경사항:**
- AI 매칭 완료 시 **30P 지급** 로직 추가
- 중복 지급 방지 플래그 (`pointsAwarded`) 추가

**주요 코드:**
```typescript
// 매칭 완료 시
if (matchingComplete && !session.pointsAwarded) {
  // 포인트 지급
  await env.DB.prepare(`
    UPDATE users SET points = points + 30 WHERE id = ?
  `).bind(dbSession.user_id).run();
  
  // 내역 추가
  INSERT INTO point_transactions (..., 30, 'AI 매칭 완료 보상', ...)
  
  session.pointsAwarded = true;
}
```

### 5. `/functions/api/contracts/index.ts`
**변경사항:**
- 계약서 생성 시 **첫 고용 성공 포인트 200P** 지급 로직 추가
- `referrals` 테이블의 `hire_reward_given` 플래그로 중복 방지

**주요 코드:**
```typescript
// 근로자의 추천인 확인
const worker = await DB.prepare(`
  SELECT id, referred_by FROM users WHERE phone = ?
`).bind(body.worker_phone).first();

if (worker && worker.referred_by) {
  // 이미 보상 받았는지 확인
  const referral = await DB.prepare(`
    SELECT hire_reward_given FROM referrals 
    WHERE referrer_id = ? AND referee_id = ?
  `).bind(worker.referred_by, worker.id).first();
  
  if (referral && !referral.hire_reward_given) {
    // 추천인에게 200P 지급
    UPDATE users SET points = points + 200
    
    // 보상 플래그 업데이트
    UPDATE referrals SET hire_reward_given = 1
  }
}
```

## 📈 예상 효과

### 사용자 시나리오 분석

**시나리오 1: 일반 가입 후 스토어 이용**
- 회원가입: +50P
- AI 매칭 완료: +30P
- **총 획득: 80P** → 메가커피 또는 이모티콘 구매 가능 ✅

**시나리오 2: 추천코드로 가입**
- 회원가입 (추천코드): +100P
- AI 매칭 완료: +30P
- **총 획득: 130P** → 스타벅스, GS25 구매 가능 ✅

**시나리오 3: 친구 추천 (추천인)**
- 친구 가입: +50P
- 친구 첫 고용 성공: +200P
- **총 획득: 250P** → 고가 상품 구매 가능 ✅

**시나리오 4: 체험 신청 활동**
- 초기 보유: 100P
- 체험 신청 3회: -90P
- **잔액: 10P** → 신중한 신청 유도 ✅

## 🎯 수익 구조 개선

### 이전 시스템 (문제)
```
추천코드 가입 1명 = 1,020P = 스토어 상품 3~20개 구매 가능
→ 스토어 손실 발생
```

### 최적화 후
```
추천코드 가입 1명 = 100P = 스토어 상품 1~2개 구매 가능
→ 적정 수준의 인센티브 유지
```

### 포인트 획득 난이도
| 목표 상품 | 필요 포인트 | 달성 방법 |
|---|---|---|
| 메가커피 (50P) | 50P | 기본 가입 |
| 스타벅스 (100P) | 100P | 추천코드 가입 |
| 배스킨라빈스 (150P) | 150P | 가입 + 매칭 + 체험 환불 |
| CGV (200P) | 200P | 가입 + 매칭 + 친구 추천 |
| BBQ치킨 (300P) | 300P | 친구 첫 고용 + 활동 |

## ✅ 검증 완료 사항

1. **중복 로직 제거** ✅
   - referral API의 `/apply-code` 비활성화
   - signup.ts에서 통합 처리

2. **모든 포인트 지급/차감 경로 최적화** ✅
   - 회원가입 (50P/100P)
   - 추천인 보상 (50P/200P)
   - AI 매칭 완료 (30P)
   - 체험 신청 (-30P)
   - 스토어 구매 (상품 가격만큼 차감)

3. **포인트 내역 기록** ✅
   - 모든 지급/차감 시 `point_transactions` 테이블에 기록
   - 상세한 설명 포함

4. **중복 지급 방지** ✅
   - AI 매칭: `session.pointsAwarded` 플래그
   - 첫 고용 보상: `referrals.hire_reward_given` 플래그

## 🚀 배포 정보

- **배포 일시**: 2026-02-15
- **변경된 파일**: 5개
- **영향받는 테이블**: `users`, `point_transactions`, `referrals`
- **하위 호환성**: 기존 사용자 포인트는 유지됨

## 📝 주의사항

1. **기존 사용자 포인트는 그대로 유지**됩니다.
2. 새로운 정책은 **이 배포 이후의 활동**에만 적용됩니다.
3. 이미 지급된 포인트는 회수하지 않습니다.
4. 스토어 구매는 정상적으로 작동합니다.

## 🔮 향후 개선 사항

1. **포인트 히스토리 UI** - 사용자가 포인트 획득/사용 내역 확인
2. **일일 출석 보상** - 매일 로그인 시 소액 포인트 지급
3. **리뷰 작성 보상** - 체험 후 리뷰 작성 시 포인트 지급
4. **레벨 시스템** - 활동량에 따른 등급 및 추가 혜택

---

**문서 작성자**: AI Developer  
**최종 업데이트**: 2026-02-15
