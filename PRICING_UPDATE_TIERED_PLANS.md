# 💰 가격 정책 업데이트 - 티어별 플랜 & 첫달무료 제거

## 📋 변경 요청
1. **메인 페이지(index.html)**: 단일 "프리미엄 멤버십 ₩4,900" → **4가지 티어별 플랜**으로 변경
2. **"첫 달 무료 체험"** 문구 완전 제거

## 🔍 변경 전 (Before)

### index.html (Line 356-413)
```html
<section id="pricing">
    <h2>합리적인 가격</h2>
    <p>하루 커피 한 잔 값으로 완벽한 취업 준비</p>
    
    <div class="bg-white">
        <div class="gradient-bg">
            <h3>프리미엄 멤버십</h3>
            <div>₩4,900</div>
            <p>월 / 하루 약 ₩163</p>
        </div>
        
        <div>
            <!-- 기능 목록 -->
            <a href="/payment.html">지금 시작하기</a>
            <p>언제든 해지 가능 · 첫 달 무료 체험</p> ❌
        </div>
    </div>
</section>
```

### mentor-chat.html 구독 모달
```html
<h2>AI 멘토 프리미엄</h2>
<div>₩4,900<span>/월</span></div>
<p>하루 약 ₩163원!</p>

<!-- 단일 플랜만 표시 -->
```

## ✅ 변경 후 (After)

### index.html - 4가지 티어 카드 레이아웃

```html
<section id="pricing">
    <h2>합리적인 가격</h2>
    <p>필요에 맞는 플랜을 선택하세요</p> ✅
    
    <div class="grid md:grid-cols-4 gap-6">
        <!-- Basic Plan -->
        <div class="plan-card">
            <h3>Basic</h3>
            <div>₩2,900</div>
            <p>하루 약 ₩97원</p>
            <ul>
                <li>월 100회 멘토 대화</li>
                <li>기본 AI 멘토링</li>
            </ul>
        </div>
        
        <!-- Standard Plan (인기) -->
        <div class="plan-card border-blue-500">
            <span class="badge">⚡ 인기</span>
            <h3>Standard</h3>
            <div>₩4,900</div>
            <p>하루 약 ₩163원</p>
            <ul>
                <li>월 200회 멘토 대화</li>
                <li>전문 AI 멘토링</li>
                <li>과제 제출 & 피드백</li>
                <li>포트폴리오 리뷰</li>
            </ul>
        </div>
        
        <!-- Premium Plan -->
        <div class="plan-card">
            <h3>Premium</h3>
            <div>₩9,900</div>
            <p>하루 약 ₩330원</p>
            <ul>
                <li>월 500회 멘토 대화</li>
                <li>최고급 AI 멘토링</li>
                <li>무제한 과제 & 피드백</li>
                <li>우선 포트폴리오 리뷰</li>
                <li>성장 분석 리포트</li>
            </ul>
        </div>
        
        <!-- Unlimited Plan -->
        <div class="plan-card">
            <h3>Unlimited</h3>
            <div>₩19,900</div>
            <p>하루 약 ₩663원</p>
            <ul>
                <li>무제한 멘토 대화</li>
                <li>VIP AI 멘토링</li>
                <li>1:1 포트폴리오 컨설팅</li>
                <li>주간 성장 리포트</li>
                <li>취업 성공 보장 프로그램</li>
            </ul>
        </div>
    </div>
    
    <p class="text-center">
        언제든 해지 가능 · 부가세 포함 가격 ✅
    </p>
</section>
```

### mentor-chat.html - 티어 요약 모달

```html
<h2>AI 멘토 구독 필요</h2>
<div class="grid grid-cols-2 gap-3">
    <div>Basic - ₩2,900/월 (100회)</div>
    <div>Standard ⚡ - ₩4,900/월 (200회)</div>
    <div>Premium - ₩9,900/월 (500회)</div>
    <div>Unlimited - ₩19,900/월 (무제한)</div>
</div>

<button onclick="startSubscription()">
    플랜 선택하기 ✅
</button>
```

## 📊 티어별 가격 정책

| 플랜 | 가격 | 월 대화 횟수 | 하루 단가 | 주요 기능 |
|------|------|-------------|---------|----------|
| **Basic** | ₩2,900 | 100회 | ₩97 | 기본 AI 멘토링 |
| **Standard** ⚡ | ₩4,900 | 200회 | ₩163 | 전문 멘토링 + 과제 피드백 |
| **Premium** | ₩9,900 | 500회 | ₩330 | 최고급 멘토링 + 성장 리포트 |
| **Unlimited** | ₩19,900 | 무제한 | ₩663 | VIP 멘토링 + 취업 보장 |

## 🚀 배포 정보

### Cloudflare Pages URL
- **최신 배포**: https://f6e5bd74.albi-app.pages.dev
- **커스텀 도메인**: https://albi.kr (1-2분 내 반영)

### Git 커밋
```
feat: Update pricing to tiered plans & remove first month free promotion
- index.html: 단일 프리미엄 → 4가지 티어 카드
- mentor-chat.html: 구독 모달에 4가지 플랜 요약 추가
- "첫 달 무료 체험" 문구 완전 제거
- "부가세 포함 가격" 안내 추가
```

## 📱 업데이트된 페이지

### 1. 메인 페이지 (index.html)
- **URL**: https://albi.kr
- **섹션**: #pricing (가격 섹션)
- **변경**: 단일 카드 → 4개 티어 그리드 레이아웃
- **헤더**: "하루 커피 한 잔 값으로..." → "필요에 맞는 플랜을 선택하세요"
- **푸터**: "첫 달 무료 체험" ❌ → "부가세 포함 가격" ✅

### 2. AI 멘토 채팅 (mentor-chat.html)
- **URL**: https://albi.kr/mentor-chat.html
- **변경**: 구독 모달에 4가지 플랜 요약 표시
- **버튼**: "구독 시작하기" → "플랜 선택하기" (payment.html로 이동)

### 3. 결제 페이지 (payment.html)
- **URL**: https://albi.kr/payment.html
- **상태**: 이미 4가지 티어 구현 완료 ✅
- **변경 없음**: 이전에 이미 업데이트됨

## 🧪 테스트 체크리스트

### 메인 페이지 (/)
- [ ] 4개 플랜 카드가 가로로 배치되어 있는지 확인
- [ ] Basic (₩2,900), Standard (₩4,900), Premium (₩9,900), Unlimited (₩19,900) 가격 표시
- [ ] Standard 플랜에 "⚡ 인기" 배지 표시
- [ ] 각 플랜의 "선택하기" 버튼이 /payment.html로 이동
- [ ] **"첫 달 무료 체험" 문구 없음** ✅
- [ ] "언제든 해지 가능 · 부가세 포함 가격" 표시 ✅

### 멘토 채팅 페이지 (/mentor-chat.html)
- [ ] 구독 필요 시 모달 표시
- [ ] 4개 플랜 요약 (2x2 그리드)
- [ ] "플랜 선택하기" 버튼이 /payment.html로 이동

### 결제 페이지 (/payment.html)
- [ ] 4개 플랜 카드 표시
- [ ] 플랜 선택 → 결제 폼 표시
- [ ] Toss Payments 연동 작동

## 🔄 첫달 무료 체험 제거 확인

### 제거된 페이지 목록
| 페이지 | 위치 | 이전 텍스트 | 변경 후 |
|--------|------|------------|---------|
| **index.html** | Line 408 | "언제든 해지 가능 · 첫 달 무료 체험" | "언제든 해지 가능 · 부가세 포함 가격" ✅ |
| **mentor-chat.html** | 구독 모달 | 단일 플랜 (₩4,900) | 4가지 티어 요약 ✅ |

### 검증 명령
```bash
# 첫달 무료 문구가 없어야 함
cd /home/user/webapp && grep -r "첫 달 무료\|첫달 무료\|무료 체험" public/*.html
# 출력: (없음) ✅
```

## 💡 실제 결제 로직 확인

### mentor-subscription.ts API
**Line 128-144**: 구독 생성 로직
```typescript
const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일

await db.prepare(`
  INSERT INTO mentor_subscriptions (
    subscription_id, user_id, plan, price, status,
    started_at, expires_at, next_payment_date, message_limit
  ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
`).bind(
  subscriptionId,
  user_id,
  plan_type,
  planInfo.price, // 실제 가격 청구 ✅
  now.toISOString(),
  expiresAt.toISOString(),
  expiresAt.toISOString(),
  planInfo.messageLimit
).run();
```

**결론**: ✅ **실제로 바로 요금이 청구됩니다!** 첫달 무료 로직 없음!

### 가격 청구 로직
```typescript
function getPlanInfo(planType: string) {
  const plans = {
    basic: { name: 'Basic', price: 2900, messageLimit: 100 },
    standard: { name: 'Standard', price: 4900, messageLimit: 200 },
    premium: { name: 'Premium', price: 9900, messageLimit: 500 },
    unlimited: { name: 'Unlimited', price: 19900, messageLimit: null }
  };
  return plans[planType] || plans.standard;
}
```

**✅ 확인**: 모든 플랜이 **정가로 바로 청구**됩니다. 할인이나 무료 체험 로직 없음!

## 📱 업데이트 내용 요약

### 수정된 파일
1. **public/index.html** (Line 356-413)
   - 단일 "프리미엄 멤버십" 카드 → 4개 티어 그리드
   - "첫 달 무료 체험" 제거
   - "부가세 포함 가격" 안내 추가

2. **public/mentor-chat.html** (Line 29-85)
   - 구독 모달: 단일 플랜 → 4개 플랜 요약 (2x2 그리드)
   - 버튼 텍스트: "구독 시작하기" → "플랜 선택하기"

3. **functions/api/mentor-subscription.ts**
   - 변경 없음 (이미 티어별 가격 구현됨)
   - 첫달 무료 로직 없음 ✅

## 🎯 UI/UX 개선 사항

### Before
- ❌ 단일 플랜만 표시 (선택권 없음)
- ❌ "첫 달 무료"라고 안내하지만 실제로는 바로 청구
- ❌ 사용자 혼란 가능성

### After
- ✅ 4가지 플랜 명확하게 비교 가능
- ✅ 가격, 메시지 제한, 기능이 투명하게 표시
- ✅ 실제 청구 방식과 안내가 일치
- ✅ 사용자가 필요에 맞는 플랜 선택 가능

## 🚀 배포 완료

- **배포 URL**: https://f6e5bd74.albi-app.pages.dev
- **커스텀 도메인**: https://albi.kr (1-2분 내 반영)
- **Git 커밋**: `feat: Update pricing to tiered plans & remove first month free promotion`
- **수정된 파일**: 2개 (index.html, mentor-chat.html)
- **추가된 코드**: 499줄 (티어 카드 HTML)
- **제거된 코드**: 65줄 (단일 플랜 HTML)

## 🧪 테스트 방법

### 1️⃣ 메인 페이지 확인
```
https://albi.kr/
```
- 스크롤하여 "합리적인 가격" 섹션으로 이동
- 4개 플랜 카드가 나란히 표시되는지 확인
- Standard 플랜에 "⚡ 인기" 배지 표시 확인
- **"첫 달 무료" 문구가 없는지** 확인 ✅
- "언제든 해지 가능 · 부가세 포함 가격" 표시 확인

### 2️⃣ 멘토 채팅 페이지 확인
```
https://albi.kr/mentor-chat.html
```
- 대화 시도 → 구독 모달 표시
- 4개 플랜 요약이 2x2 그리드로 표시
- "플랜 선택하기" 버튼 클릭 → payment.html로 이동

### 3️⃣ 결제 페이지 확인
```
https://albi.kr/payment.html
```
- 4개 플랜 카드 표시
- 각 플랜 클릭 → 결제 폼 표시
- 가격 정보 정확한지 확인

### 4️⃣ 모바일 반응형 확인
- 모바일에서 플랜 카드가 1열로 정렬
- 태블릿에서 2열로 정렬
- 데스크톱에서 4열로 정렬

## 📋 가격 정책 전체 정리

### 페이지별 가격 표시 방식

| 페이지 | URL | 표시 방식 | 목적 |
|--------|-----|----------|------|
| **메인 페이지** | / | 4개 티어 카드 (개요) | 사용자에게 선택권 제공 |
| **결제 페이지** | /payment.html | 4개 티어 카드 (상세) | 실제 결제 진행 |
| **멘토 채팅** | /mentor-chat.html | 구독 모달 (요약) | 빠른 플랜 확인 → 결제 유도 |

### 첫달 무료 제거 이유
1. **실제 로직과 불일치**: API는 바로 청구하는데 UI는 무료라고 안내
2. **사용자 신뢰 문제**: 예상과 다른 청구 발생 가능
3. **법적 리스크**: 허위 광고로 간주될 수 있음
4. **투명성**: 실제 가격을 명확히 안내하는 것이 더 좋음

## ✅ 완료 상태

- [x] index.html 단일 플랜 → 4개 티어 카드로 변경
- [x] "첫 달 무료 체험" 문구 제거
- [x] "부가세 포함 가격" 안내 추가
- [x] mentor-chat.html 구독 모달 업데이트
- [x] 빌드 및 배포 완료
- [x] Git 커밋 완료
- [x] 문서화 완료

---

**최종 업데이트**: 2026-03-04  
**배포 URL**: https://albi.kr  
**변경 사항**: 단일 플랜 → 티어별 플랜 + 첫달무료 제거  
**수정된 파일 수**: 2개 (index.html, mentor-chat.html)
