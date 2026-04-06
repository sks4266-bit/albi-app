# 🔐 KCP 정기결제 연동 가이드

작성일: 2026-03-19
목적: PortOne → KCP 정기결제로 전환

---

## 📋 **작업 완료 현황**

### ✅ **완료된 작업**

1. **KCP API 서버 엔드포인트 생성** (`/functions/api/kcp/[[path]].ts`)
   - ✅ `/api/kcp/register` - 거래 등록 (배치키 발급 요청)
   - ✅ `/api/kcp/batch-auth` - 배치키 발급 응답 처리
   - ✅ `/api/kcp/execute-payment` - 정기결제 실행
   - ✅ `/api/kcp/batch-key/:user_id` - 배치키 상태 조회

2. **DB 마이그레이션 생성** (`/migrations/0030_create_kcp_tables.sql`)
   - ✅ `kcp_transactions` 테이블 (거래 등록 정보)
   - ✅ `kcp_payments` 테이블 (정기결제 실행 내역)
   - ✅ `users` 테이블에 KCP 관련 컬럼 추가

3. **payment.html 백업**
   - ✅ `payment.html.backup-portone` (기존 PortOne 버전)

---

## 🚧 **남은 작업**

### **1. payment.html JavaScript 교체**

기존 PortOne SDK 코드를 KCP 정기결제 코드로 교체해야 합니다.

#### **A. PortOne SDK 제거**

**제거할 코드** (line 480):
```html
<script src="https://cdn.portone.io/v2/browser-sdk.js"></script>
```

#### **B. KCP 정기결제 로직 추가**

**추가할 코드** (JavaScript 섹션에):

```javascript
// KCP 정기결제 요청 함수
async function requestKCPSubscription() {
    if (!selectedPlan) {
        alert('플랜을 선택해주세요.');
        return;
    }

    const userName = document.getElementById('userName').value.trim();
    const userEmail = document.getElementById('userEmail').value.trim();

    if (!userName || !userEmail) {
        alert('이름과 이메일을 입력해주세요.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        alert('올바른 이메일 형식을 입력해주세요.');
        return;
    }

    const plan = plans[selectedPlan];
    const userId = urlParams.get('user_id') || localStorage.getItem('albi_user_id') || 'user_' + Date.now();

    try {
        // 1. 서버에 KCP 거래 등록 요청
        const response = await fetch('/api/kcp/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan_type: selectedPlan,
                user_id: userId,
                user_name: userName,
                user_email: userEmail,
                amount: plan.price
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert('거래 등록 실패: ' + (result.error || '알 수 없는 오류'));
            console.error('KCP Register Error:', result);
            return;
        }

        console.log('✅ KCP 거래 등록 성공:', result.data);

        // 2. KCP 결제창 호출
        openKCPPaymentWindow(result.data);

    } catch (error) {
        console.error('❌ KCP 결제 요청 실패:', error);
        alert('결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// KCP 결제창 호출 함수
function openKCPPaymentWindow(paymentData) {
    // Hidden form 생성
    const form = document.createElement('form');
    form.name = 'kcp_payment_form';
    form.method = 'post';
    form.action = paymentData.pay_url;
    form.target = '_self';

    // 결제 파라미터 추가
    const params = {
        site_cd: paymentData.site_cd,
        pay_method: paymentData.pay_method,
        currency: paymentData.currency,
        shop_name: paymentData.site_name,
        ActionResult: paymentData.ActionResult,
        Ret_URL: paymentData.Ret_URL,
        approval_key: paymentData.approval_key,
        PayUrl: paymentData.pay_url,
        kcp_bath_info_view: paymentData.kcp_bath_info_view,
        ordr_idxx: paymentData.ordr_idxx,
        good_name: paymentData.good_name,
        good_mny: paymentData.good_mny,
        buyr_name: paymentData.buyr_name
    };

    // Hidden input 필드 생성
    for (const [key, value] of Object.entries(params)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    // Form을 body에 추가하고 submit
    document.body.appendChild(form);
    
    console.log('🚀 KCP 결제창 호출:', params);
    
    form.submit();
}
```

#### **C. 기존 PortOne 결제 버튼 교체**

**찾기** (대략 line 270-280):
```html
<button onclick="requestPayment()" ...>
```

**교체**:
```html
<button onclick="requestKCPSubscription()" ...>
```

---

### **2. KCP 환경 변수 설정**

Cloudflare Pages에서 환경 변수 추가:

```
KCP_SITE_CD=테스트: T로 시작, 운영: 실제 사이트 코드
KCP_SITE_KEY=KCP에서 발급받은 사이트 키
KCP_SITE_NAME=알비
```

**설정 위치**:
```
Cloudflare Dashboard
→ Pages → albi-app
→ Settings → Environment variables
→ Production 및 Preview 환경 모두 추가
```

---

### **3. DB 마이그레이션 실행**

**로컬 개발 환경**:
```bash
cd /home/user/webapp
npx wrangler d1 migrations apply albi-production --local
```

**프로덕션 환경**:
```bash
cd /home/user/webapp
npx wrangler d1 migrations apply albi-production
```

---

### **4. payment-callback.html 생성**

KCP 결제 응답을 처리할 페이지:

**파일**: `/public/payment-callback.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 완료 - 알비</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center p-6">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div id="success-content" style="display: none;">
            <div class="text-6xl mb-6">
                <i class="fas fa-check-circle text-green-500"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-4">결제 완료!</h1>
            <p class="text-gray-600 mb-6">
                <span id="plan-name"></span> 플랜 구독이 시작되었습니다.<br>
                결제 금액: <strong id="payment-amount"></strong>원
            </p>
            <div class="space-y-3">
                <a href="/mentor-chat.html" class="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                    <i class="fas fa-comments mr-2"></i>멘토 채팅 시작
                </a>
                <a href="/subscription-manage.html" class="block w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition">
                    <i class="fas fa-cog mr-2"></i>구독 관리
                </a>
            </div>
        </div>

        <div id="error-content" style="display: none;">
            <div class="text-6xl mb-6">
                <i class="fas fa-times-circle text-red-500"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-4">결제 실패</h1>
            <p class="text-gray-600 mb-6" id="error-message">
                결제 처리 중 오류가 발생했습니다.
            </p>
            <div class="space-y-3">
                <a href="/payment.html" class="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                    <i class="fas fa-redo mr-2"></i>다시 시도
                </a>
                <a href="/contact.html" class="block w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition">
                    <i class="fas fa-headset mr-2"></i>고객 지원
                </a>
            </div>
        </div>
    </div>

    <script>
        // URL 파라미터 파싱
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success') === 'true';
        const plan = urlParams.get('plan');
        const amount = urlParams.get('amount');
        const message = urlParams.get('message');

        if (success) {
            document.getElementById('success-content').style.display = 'block';
            if (plan) document.getElementById('plan-name').textContent = plan.toUpperCase();
            if (amount) document.getElementById('payment-amount').textContent = parseInt(amount).toLocaleString();
        } else {
            document.getElementById('error-content').style.display = 'block';
            if (message) {
                document.getElementById('error-message').textContent = decodeURIComponent(message);
            }
        }
    </script>
</body>
</html>
```

---

## 🧪 **테스트 시나리오**

### **1. 로컬 테스트** (샌드박스)

```bash
# 1. DB 마이그레이션
cd /home/user/webapp
npx wrangler d1 migrations apply albi-production --local

# 2. 빌드
npm run build

# 3. 서버 시작
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs

# 4. 브라우저 테스트
# http://localhost:3000/payment.html
```

### **2. 테스트 플로우**

1. ✅ 플랜 선택 (예: Standard)
2. ✅ 이름, 이메일 입력
3. ✅ "결제하기" 버튼 클릭
4. ✅ KCP 테스트 결제창 표시 확인
5. ✅ 카드 정보 입력 (테스트 카드)
6. ✅ 배치키 발급 성공 확인
7. ✅ `/payment-callback.html?success=true` 리디렉션 확인
8. ✅ DB에 `kcp_transactions` 데이터 저장 확인
9. ✅ `users` 테이블에 `kcp_batch_key` 저장 확인

---

## 📊 **KCP 테스트 카드 정보**

**KCP 개발 환경 테스트 카드**:
```
카드번호: 9446-0100-1234-5678
유효기간: 12/25 (미래 날짜)
CVC: 123
비밀번호: 00
생년월일: 900101
```

---

## 🚀 **배포 체크리스트**

- [ ] KCP 계약 완료 (site_cd, site_key 발급)
- [ ] Cloudflare 환경 변수 설정 (KCP_SITE_CD, KCP_SITE_KEY, KCP_SITE_NAME)
- [ ] DB 마이그레이션 실행 (프로덕션)
- [ ] payment.html JavaScript 교체
- [ ] payment-callback.html 생성
- [ ] 빌드 및 배포
- [ ] 테스트 환경에서 결제 테스트
- [ ] 프로덕션 환경에서 결제 테스트
- [ ] 정기결제 자동 청구 스케줄러 설정

---

## 📝 **KCP 정기결제 작동 원리**

```
1. 최초 결제 (배치키 발급)
   ┌──────────────────────────────────────┐
   │ 사용자: 플랜 선택 → 결제 정보 입력  │
   └────────────┬─────────────────────────┘
                ↓
   ┌──────────────────────────────────────┐
   │ 알비 서버: /api/kcp/register 호출    │
   │ → KCP에 거래 등록 요청                │
   │ → approval_key + PayUrl 수신         │
   └────────────┬─────────────────────────┘
                ↓
   ┌──────────────────────────────────────┐
   │ KCP 결제창: 카드 정보 입력            │
   │ → 본인 인증 (3D Secure 등)           │
   │ → 배치키 발급                         │
   └────────────┬─────────────────────────┘
                ↓
   ┌──────────────────────────────────────┐
   │ 알비 서버: /api/kcp/batch-auth       │
   │ → batch_key 저장                      │
   │ → users 테이블에 kcp_batch_key 저장  │
   │ → subscription_status = 'active'     │
   └──────────────────────────────────────┘

2. 정기결제 (매월 자동 청구)
   ┌──────────────────────────────────────┐
   │ 스케줄러: 매월 1일 0시 실행           │
   └────────────┬─────────────────────────┘
                ↓
   ┌──────────────────────────────────────┐
   │ 알비 서버: /api/kcp/execute-payment  │
   │ → users에서 kcp_batch_key 조회       │
   │ → KCP 배치결제 API 호출               │
   │ → batch_key + amount 전송            │
   └────────────┬─────────────────────────┘
                ↓
   ┌──────────────────────────────────────┐
   │ KCP: 자동 결제 처리                   │
   │ → 인증 없이 카드 청구                 │
   │ → 결제 결과 반환 (res_cd, tno)       │
   └────────────┬─────────────────────────┘
                ↓
   ┌──────────────────────────────────────┐
   │ 알비 서버: kcp_payments 테이블 저장  │
   │ → 결제 성공 시 포인트 추가            │
   │ → 실패 시 사용자에게 알림             │
   └──────────────────────────────────────┘
```

---

## ⚠️ **중요 참고 사항**

1. **KCP 계약 필수**
   - 정기결제(자동결제) 서비스는 별도 계약 필요
   - site_cd, site_key 발급 필요

2. **보안**
   - site_key는 절대 클라이언트에 노출 금지
   - 환경 변수로 관리
   - HTTPS 필수

3. **배치키 관리**
   - 배치키는 민감 정보이므로 암호화 저장 권장
   - 사용자가 해지 요청 시 배치키 삭제

4. **정기결제 스케줄러**
   - Cloudflare Workers Cron Triggers 사용
   - 또는 외부 스케줄러 (GitHub Actions, Vercel Cron 등)

---

## 📞 **KCP 지원**

- 개발자 문서: https://developer.kcp.co.kr
- 기술 지원: 1544-8661
- 이메일: tech@kcp.co.kr
