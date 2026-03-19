import * as PortOne from "@portone/browser-sdk/v2";

// PortOne 채널 정보
const CHANNELS = {
  card: {
    name: 'NHN KCP',
    key: 'channel-key-f8f466e2-764d-40d4-b003-f85733fdc50a',
    pgProvider: 'kcp_v2',
    payMethod: 'CARD' as const,
    icon: 'fa-credit-card',
    displayName: '신용/체크카드'
  },
  inicis: {
    name: 'KG이니시스',
    key: 'channel-key-e6161fd4-04fe-4de4-8073-c2f74961ec46',
    pgProvider: 'inicis_v2',
    payMethod: 'CARD' as const,
    icon: 'fa-building',
    displayName: 'KG이니시스'
  },
  kakaopay: {
    name: '카카오페이',
    key: 'channel-key-2fd86a82-009e-43dd-b9ba-3c37f5f85374',
    pgProvider: 'kakaopay',
    payMethod: 'EASY_PAY' as const,
    icon: 'fa-comment',
    displayName: '카카오페이'
  },
  phone: {
    name: '다날 휴대폰결제',
    key: 'channel-key-0b99f096-a083-492c-933d-c34bbbfac4fb',
    pgProvider: 'danal',
    payMethod: 'MOBILE' as const,
    icon: 'fa-mobile-alt',
    displayName: '휴대폰 결제'
  }
};

// 플랜 정보
const plans = {
  basic: {
    name: 'Basic',
    price: 2900,
    messages: 100,
    displayPrice: '₩2,900',
    displayMessages: '월 100회 대화 가능'
  },
  standard: {
    name: 'Standard',
    price: 4900,
    messages: 200,
    displayPrice: '₩4,900',
    displayMessages: '월 200회 대화 가능'
  },
  premium: {
    name: 'Premium',
    price: 9900,
    messages: 500,
    displayPrice: '₩9,900',
    displayMessages: '월 500회 대화 가능'
  },
  unlimited: {
    name: 'Unlimited',
    price: 19900,
    messages: null,
    displayPrice: '₩19,900',
    displayMessages: '무제한 대화 가능'
  }
};

type PlanType = keyof typeof plans;
type PaymentMethod = keyof typeof CHANNELS;

let selectedPlan: PlanType | null = null;
let selectedPaymentMethod: PaymentMethod = 'card';

// URL 파라미터에서 user_id 가져오기
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || localStorage.getItem('test_user_id') || 'user_' + Date.now();
const fromPage = urlParams.get('from');

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
  console.log('✅ Payment module loaded with PortOne V2 SDK');
  
  // 테스트 계정 정보 자동 입력
  const testEmail = localStorage.getItem('test_email');
  const testUserId = localStorage.getItem('test_user_id');
  
  if (testEmail && testUserId) {
    const userEmailInput = document.getElementById('userEmail') as HTMLInputElement;
    const userNameInput = document.getElementById('userName') as HTMLInputElement;
    
    if (userEmailInput) userEmailInput.value = testEmail;
    if (userNameInput) {
      const userName = testUserId.split('_')[2] || 'TestUser';
      userNameInput.value = '테스트' + userName;
    }
    
    console.log('✅ 테스트 계정 정보 자동 입력됨:', testEmail);
  }
  
  // 기본 결제 수단 선택 (카드)
  selectPaymentMethod('card');
  
  // 돌아가기 버튼 추가 (멘토 채팅에서 온 경우)
  if (fromPage === 'mentor-chat') {
    const backButton = document.createElement('a');
    backButton.href = '/mentor-chat.html';
    backButton.className = 'inline-block text-gray-600 hover:text-gray-800 mb-4';
    backButton.innerHTML = '<i class="fas fa-arrow-left mr-2"></i>멘토 채팅으로 돌아가기';
    const container = document.querySelector('.max-w-7xl');
    if (container) container.prepend(backButton);
  }
});

// 플랜 선택
function selectPlan(planType: PlanType) {
  // 모든 카드 선택 해제
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.remove('selected');
  });

  // 선택된 카드 강조
  const planCard = document.getElementById('plan-' + planType);
  if (planCard) planCard.classList.add('selected');

  selectedPlan = planType;
  const plan = plans[planType];

  // 결제 폼 표시
  const paymentForm = document.getElementById('payment-form');
  const planNameEl = document.getElementById('selected-plan-name');
  const planPriceEl = document.getElementById('selected-plan-price');
  const planMessagesEl = document.getElementById('selected-plan-messages');
  const buttonTextEl = document.getElementById('payment-button-text');
  
  if (paymentForm) paymentForm.style.display = 'block';
  if (planNameEl) planNameEl.textContent = plan.name;
  if (planPriceEl) planPriceEl.textContent = plan.displayPrice + '/월';
  if (planMessagesEl) planMessagesEl.textContent = plan.displayMessages;
  if (buttonTextEl) buttonTextEl.textContent = `결제하기 (${plan.displayPrice})`;

  // 스크롤 이동
  if (paymentForm) {
    paymentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// 결제 수단 선택
function selectPaymentMethod(method: PaymentMethod) {
  selectedPaymentMethod = method;
  
  // 모든 버튼 선택 해제
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // 선택된 버튼 강조
  const selectedBtn = document.getElementById('payment-method-' + method);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }
  
  console.log('✅ Payment method selected:', method, CHANNELS[method]);
}

// 결제 요청
async function requestPayment() {
  if (!selectedPlan) {
    alert('플랜을 선택해주세요.');
    return;
  }

  const userNameInput = document.getElementById('userName') as HTMLInputElement;
  const userEmailInput = document.getElementById('userEmail') as HTMLInputElement;
  
  const userName = userNameInput?.value.trim();
  const userEmail = userEmailInput?.value.trim();

  if (!userName || !userEmail) {
    alert('이름과 이메일을 입력해주세요.');
    return;
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    alert('올바른 이메일 형식을 입력해주세요.');
    return;
  }

  const plan = plans[selectedPlan];

  try {
    console.log('✅ PortOne SDK ready');

    // 결제 수단 확인
    if (!selectedPaymentMethod) {
      alert('결제 수단을 선택해주세요.');
      return;
    }

    const channel = CHANNELS[selectedPaymentMethod];
    console.log('✅ Using channel:', channel);

    // 1. 서버에 결제 요청 생성
    const response = await fetch('/api/subscription/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        plan_type: selectedPlan,
        amount: plan.price
      })
    });

    const result = await response.json();

    if (!result.success) {
      alert('구독 생성 실패: ' + result.message);
      return;
    }

    console.log('✅ Subscription created:', result.data);
    const { payment_id, billing_key } = result.data;

    // 2. PortOne V2 결제 요청 (정기결제)
    const paymentResponse = await PortOne.requestPayment({
      storeId: 'store-1db2baf1-49d6-4b31-afcb-4662f37d7b05',
      paymentId: payment_id,
      orderName: `알비 ${plan.name} 플랜 (월간 정기구독)`,
      totalAmount: plan.price,
      currency: 'CURRENCY_KRW',
      channelKey: channel.key,
      payMethod: channel.payMethod,
      
      // 빌링키 발급 설정
      issueBillingKey: selectedPaymentMethod === 'card' || selectedPaymentMethod === 'kakaopay' || selectedPaymentMethod === 'inicis',
      billingKeyMethod: channel.payMethod,
      customer: {
        customerId: billing_key,
        fullName: userName,
        email: userEmail
      },
      
      // 리다이렉트 URL
      redirectUrl: `${window.location.origin}/payment-callback.html`,
      
      // 웹훅
      noticeUrls: [`${window.location.origin}/api/subscription/webhook`]
    });
    
    // 결제 결과 처리
    if (paymentResponse.code != null) {
      // 결제 실패
      alert(`결제 실패: ${paymentResponse.message}`);
      return;
    }
    
    // 결제 성공 → 서버에 확인
    confirmSubscription(paymentResponse);

  } catch (error: any) {
    console.error('❌ Payment error:', error);
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
  }
}

// 결제 성공 후 서버에 확인
async function confirmSubscription(paymentData: any) {
  try {
    const response = await fetch('/api/subscription/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: paymentData.paymentId,
        transaction_id: paymentData.transactionId,
        billing_key: paymentData.billingKey,
        paid_amount: paymentData.amount
      })
    });

    const result = await response.json();

    if (result.success) {
      alert('✅ 정기구독이 시작되었습니다!\n\n다음 결제일: ' + result.data.next_billing_date);
      window.location.href = '/mypage.html?subscription=success';
    } else {
      alert('구독 활성화 실패: ' + result.message);
    }
  } catch (error: any) {
    console.error('❌ Confirm error:', error);
    alert('구독 확인 중 오류가 발생했습니다.');
  }
}

// 전역으로 함수 노출
(window as any).selectPlan = selectPlan;
(window as any).selectPaymentMethod = selectPaymentMethod;
(window as any).requestPayment = requestPayment;
