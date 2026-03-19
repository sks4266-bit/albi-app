# 알비 포인트 시스템 가이드

## 📊 포인트 시스템 개요

알비 포인트는 사용자가 플랫폼 활동을 통해 적립하고 스토어에서 기프티콘으로 교환할 수 있는 리워드 시스템입니다.

## 🎁 포인트 적립 방법

### 1. 회원가입 (20P 또는 1,020P)
- **기본 가입**: 20P 지급
- **추천인 코드 사용 시**: 1,020P 지급 (기본 20P + 추천 보상 1,000P)

**구현 위치**: `functions/api/auth/signup.ts`

**적립 로직**:
```typescript
// 추천인 코드 없이 가입
points: 20

// 추천인 코드로 가입
points: 1,020 (기본 20P + 추천 1,000P)
```

**테스트 방법**:
1. 회원가입 페이지에서 추천인 코드 입력란 확인
2. 추천인 코드 입력 후 가입
3. 성공 메시지에서 1,020P 확인
4. 마이페이지에서 포인트 잔액 확인

### 2. 친구 추천 (500P + 3,000P)
- **친구 가입 시**: 500P 지급 (추천인에게)
- **친구 첫 매칭 성공 시**: 3,000P 추가 지급 (추천인에게)

**구현 위치**: 
- 가입 시: `functions/api/auth/signup.ts`
- 첫 매칭 시: `TO BE IMPLEMENTED`

**적립 로직**:
```typescript
// 친구가 추천 코드로 가입하면
referrer: +500P (즉시 지급)

// 친구가 첫 매칭 성공하면
referrer: +3,000P (추가 지급)
```

**데이터베이스 구조**:
```sql
-- referrals 테이블
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id TEXT NOT NULL,      -- 추천인 ID
  referee_id TEXT NOT NULL,        -- 피추천인 ID
  reward_given BOOLEAN DEFAULT 0,  -- 가입 보상 지급 여부
  hire_reward_given BOOLEAN DEFAULT 0, -- 매칭 보상 지급 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**테스트 방법**:
1. 사용자 A 로그인
2. 마이페이지에서 추천 코드 확인 (예: AB1234)
3. 사용자 B가 A의 추천 코드로 가입
4. A의 포인트가 500P 증가했는지 확인
5. B가 첫 매칭 완료 (TO BE TESTED)
6. A의 포인트가 3,000P 추가 증가했는지 확인 (TO BE TESTED)

### 3. AI 매칭 완료 (예정)
- **첫 매칭 완료**: 100P 지급 (예정)
- **매칭 성공 (채용 확정)**: 1,000P 지급 (예정)

**구현 상태**: ⚠️ **미구현**

**구현 필요 위치**:
- AI 매칭 완료 시: `functions/api/ai-matching.ts`
- 계약 체결 시: `functions/api/contracts/index.ts`

## 💰 포인트 사용 방법

### 스토어에서 기프티콘 구매

**구현 위치**: `functions/api/store/[[path]].ts`

**사용 로직**:
```typescript
// 포인트 차감
currentPoints - productPrice = newPoints

// 포인트 부족 시
if (currentPoints < productPrice) {
  return error: '포인트가 부족합니다.'
}
```

**구매 가능 상품** (12종):
1. 스타벅스 아메리카노 (100P) - 인기
2. GS25 모바일상품권 5천원 (100P)
3. CU 모바일상품권 5천원 (100P)
4. 배스킨라빈스 파인트 (150P)
5. CGV 영화관람권 (200P) - 인기
6. BBQ 치킨 기프티콘 (300P)
7. 카카오 이모티콘 (50P)
8. 올리브영 1만원권 (200P)
9. 도미노피자 기프티콘 (300P)
10. 투썸플레이스 케이크 (150P)
11. 메가커피 아이스 아메리카노 (50P) - 인기
12. 교보문고 도서상품권 1만원 (200P)

**테스트 방법**:
1. 로그인 후 스토어 페이지 접속 (`/store.html`)
2. 상품 선택 후 구매
3. 포인트 차감 확인
4. 기프티콘 코드 발급 확인
5. 이메일로 기프티콘 전송 확인

## 📋 포인트 거래 내역

**테이블**: `point_transactions`

```sql
CREATE TABLE point_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,        -- 양수(적립), 음수(사용)
  type TEXT NOT NULL,              -- 'signup', 'referral_signup', 'spend', etc.
  description TEXT NOT NULL,
  balance_after INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**거래 유형**:
- `signup`: 가입 축하 포인트
- `referral_signup`: 친구 추천 보상 (가입)
- `referral_hire`: 친구 추천 보상 (매칭 성공)
- `matching_complete`: AI 매칭 완료 보상
- `hire_success`: 채용 성공 보상
- `spend`: 스토어 구매로 포인트 사용

## 🧪 테스트 체크리스트

### ✅ 완료된 테스트
- [x] 회원가입 시 기본 20P 지급
- [x] 추천인 코드 입력란 UI 추가
- [x] 추천인 코드 검증 로직
- [x] 추천인 코드 사용 시 1,020P 지급
- [x] 추천인에게 500P 지급
- [x] referrals 테이블에 관계 저장
- [x] 스토어 구매 시 포인트 차감
- [x] 포인트 거래 내역 저장

### ⏳ 미완료 테스트
- [ ] 친구 첫 매칭 성공 시 추천인에게 3,000P 지급
- [ ] AI 매칭 완료 시 포인트 지급
- [ ] 채용 성공 시 포인트 지급
- [ ] 포인트 부족 시 구매 불가 확인
- [ ] 포인트 거래 내역 조회
- [ ] 마이페이지 포인트 표시

## 🔧 구현 필요 기능

### 1. 첫 매칭 성공 시 추천인 보상 (3,000P)

**구현 위치**: `functions/api/contracts/index.ts` 또는 `functions/api/ai-matching.ts`

**구현 로직**:
```typescript
// 계약 체결 또는 채용 확정 시
async function awardFirstHireReward(userId: string) {
  // 1. 이 사용자가 피추천인인지 확인
  const referralData = await DB.prepare(`
    SELECT referrer_id, hire_reward_given 
    FROM referrals 
    WHERE referee_id = ? AND hire_reward_given = 0
  `).bind(userId).first();
  
  if (!referralData) return; // 추천인 없음 또는 이미 지급됨
  
  // 2. 추천인에게 3,000P 지급
  await DB.prepare(`
    UPDATE users SET points = points + 3000 
    WHERE id = ?
  `).bind(referralData.referrer_id).run();
  
  // 3. 포인트 거래 내역 저장
  await DB.prepare(`
    INSERT INTO point_transactions (user_id, amount, type, description, created_at)
    VALUES (?, 3000, 'referral_hire', '친구 추천 보상 (첫 매칭 성공)', datetime('now'))
  `).bind(referralData.referrer_id).run();
  
  // 4. 보상 지급 플래그 업데이트
  await DB.prepare(`
    UPDATE referrals SET hire_reward_given = 1 
    WHERE referee_id = ?
  `).bind(userId).run();
}
```

### 2. AI 매칭 완료 보상 (100P)

**구현 위치**: `functions/api/ai-matching.ts`

**구현 시점**: 매칭 단계 4 완료 시

```typescript
// 매칭 완료 시
if (currentStep === 4 && !user.matching_reward_given) {
  await DB.prepare(`
    UPDATE users SET points = points + 100, matching_reward_given = 1 
    WHERE id = ?
  `).bind(userId).run();
  
  await DB.prepare(`
    INSERT INTO point_transactions (user_id, amount, type, description, created_at)
    VALUES (?, 100, 'matching_complete', 'AI 매칭 완료 보상', datetime('now'))
  `).bind(userId).run();
}
```

## 📱 사용자 플로우

### 신규 사용자 (추천 코드 사용)
1. 회원가입 → **1,020P 획득** ✅
2. AI 매칭 완료 → **100P 획득** ⏳
3. 첫 채용 성공 → **1,000P 획득** ⏳
4. 스토어에서 기프티콘 구매 → **포인트 사용** ✅
5. 누적: 2,120P - 구매액

### 추천인 (친구 초대)
1. 친구가 추천 코드로 가입 → **500P 획득** ✅
2. 친구가 첫 매칭 성공 → **3,000P 획득** ⏳
3. 누적: 3,500P per referral

## 🎯 포인트 경제 설계

### 적립
- 가입: 20P (기본) / 1,020P (추천)
- 친구 추천: 500P (가입) + 3,000P (매칭)
- AI 매칭: 100P
- 채용 성공: 1,000P

### 사용
- 기프티콘: 50P ~ 300P

### 예상 사용자 여정
신규 사용자가 추천 코드 사용 → 1,020P 시작 → 매칭 완료 +100P → 총 1,120P → 스타벅스(100P) 또는 메가커피(50P) 구매 가능

## 🚀 배포 전 체크리스트

- [x] 추천인 코드 생성 로직
- [x] 추천인 코드 검증
- [x] 가입 보상 지급
- [x] 추천인 보상 지급
- [x] 스토어 포인트 차감
- [x] 포인트 거래 내역 기록
- [ ] 첫 매칭 보상 지급
- [ ] AI 매칭 완료 보상
- [ ] 포인트 거래 내역 UI
- [ ] 마이페이지 추천 코드 표시

## 📞 문의사항

포인트 시스템 관련 문의는 albi260128@gmail.com로 연락주세요.
