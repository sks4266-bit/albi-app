# Albi 모바일 앱 아키텍처 설계서

## 📋 문서 정보

- **프로젝트명**: Albi Mobile App
- **버전**: v1.0.0
- **작성일**: 2026-03-09
- **작성자**: Albi Development Team
- **목적**: React Native 기반 크로스플랫폼 모바일 앱 개발

---

## 🎯 프로젝트 개요

### 1.1 프로젝트 목표

Albi 웹 서비스를 모바일 앱으로 확장하여 3개 플랫폼에 동시 배포:
- **토스 앱인토스** (3,000만 사용자, 무료)
- **구글 플레이 스토어** (안드로이드, $25)
- **애플 앱스토어** (iOS, $99/년)

### 1.2 핵심 전략

**React Native + WebView 하이브리드 방식**
- 네이티브 화면: 로그인, 메인, 프로필 등 핵심 UX
- WebView: 채팅, 멘토링, 결제 등 복잡한 기능
- 기존 웹 코드 최대한 재사용 (90% 이상)

### 1.3 주요 장점

| 항목 | 설명 |
|------|------|
| **코드 재사용** | 토스/안드로이드/iOS에서 90% 코드 공유 |
| **빠른 개발** | 6-10주 내 3개 플랫폼 동시 출시 |
| **유지보수** | 웹/앱 동시 업데이트 가능 |
| **네이티브 기능** | 푸시, 생체인증, 카메라 등 추가 |
| **심사 통과** | 충분한 네이티브 기능으로 스토어 정책 충족 |

---

## 🏗️ 시스템 아키텍처

### 2.1 전체 구조도

```
┌──────────────────────────────────────────────────────────────┐
│                     Albi Mobile App                          │
│                   (React Native)                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           네이티브 레이어 (React Native)            │   │
│  │                                                     │   │
│  │  ┌──────────────┬──────────────┬──────────────┐   │   │
│  │  │ 로그인/가입  │  메인 화면   │  프로필      │   │   │
│  │  │ (Native)     │  (Native)    │  (Native)    │   │   │
│  │  └──────────────┴──────────────┴──────────────┘   │   │
│  │                                                     │   │
│  │  ┌──────────────┬──────────────┬──────────────┐   │   │
│  │  │ 알림 센터    │  설정        │  마이페이지  │   │   │
│  │  │ (Native)     │  (Native)    │  (Native)    │   │   │
│  │  └──────────────┴──────────────┴──────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          WebView 레이어 (기존 웹 재사용)            │   │
│  │                                                     │   │
│  │  ┌──────────────┬──────────────┬──────────────┐   │   │
│  │  │ 채팅         │  멘토 채팅   │  결제        │   │   │
│  │  │ (WebView)    │  (WebView)   │  (WebView)   │   │   │
│  │  └──────────────┴──────────────┴──────────────┘   │   │
│  │                                                     │   │
│  │  ┌──────────────┬──────────────┬──────────────┐   │   │
│  │  │ 공고 관리    │  지원자 관리 │  기타 기능   │   │   │
│  │  │ (WebView)    │  (WebView)   │  (WebView)   │   │   │
│  │  └──────────────┴──────────────┴──────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         네이티브 서비스 레이어                       │   │
│  │                                                     │   │
│  │  • 푸시 알림 (FCM/APNs)                            │   │
│  │  • 생체 인증 (지문/Face ID)                        │   │
│  │  • 카메라/갤러리                                   │   │
│  │  • 로컬 저장소 (AsyncStorage)                      │   │
│  │  • 위치 정보 (선택)                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────┐
│                    Backend API Server                        │
│              (기존 Cloudflare Pages + Hono)                  │
│                                                              │
│  • REST API Endpoints                                        │
│  • 인증/인가 (세션, JWT)                                     │
│  • 데이터베이스 (Cloudflare D1)                             │
│  • 파일 스토리지 (Cloudflare R2)                            │
│  • 결제 연동 (PortOne V2)                                   │
│  • 소셜 로그인 (카카오, 네이버, 구글, 토스)                │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 화면 구성 (Screen Map)

```
앱 시작
  │
  ├─ 🔐 Splash Screen (네이티브)
  │
  ├─ 🔐 Login/Signup (네이티브)
  │   ├─ 이메일 로그인
  │   ├─ 소셜 로그인 (카카오, 네이버, 구글, 토스)
  │   └─ 회원가입
  │
  ├─ 🏠 Main Screen (네이티브)
  │   ├─ 홈 탭
  │   ├─ 채팅 탭 → WebView (https://albi.kr/chat)
  │   ├─ 알림 탭 (네이티브)
  │   └─ 마이페이지 탭 (네이티브)
  │
  ├─ 💬 Chat Screen (WebView)
  │   └─ https://albi.kr/chat
  │
  ├─ 👨‍🏫 Mentor Chat Screen (WebView)
  │   └─ https://albi.kr/mentor-chat
  │
  ├─ 💳 Payment Screen (WebView)
  │   └─ https://albi.kr/payment
  │
  ├─ 📋 Job Listings (WebView)
  │   └─ https://albi.kr/jobs
  │
  ├─ 👤 Profile Screen (네이티브 + WebView 혼합)
  │   ├─ 프로필 헤더 (네이티브)
  │   └─ 상세 정보 (WebView)
  │
  └─ ⚙️ Settings Screen (네이티브)
      ├─ 알림 설정
      ├─ 생체 인증 설정
      ├─ 앱 버전 정보
      └─ 로그아웃
```

---

## 🛠️ 기술 스택

### 3.1 코어 프레임워크

| 항목 | 기술 | 버전 | 목적 |
|------|------|------|------|
| **기본 프레임워크** | React Native | 0.73+ | 크로스플랫폼 개발 |
| **언어** | TypeScript | 5.3+ | 타입 안정성 |
| **상태 관리** | Zustand | 4.5+ | 경량 상태 관리 |
| **네비게이션** | React Navigation | 6.x | 화면 전환 |
| **WebView** | react-native-webview | 13.x | 웹 콘텐츠 표시 |

### 3.2 네이티브 기능

| 기능 | 라이브러리 | 용도 |
|------|-----------|------|
| **푸시 알림** | @react-native-firebase/messaging | FCM/APNs 통합 |
| **생체 인증** | react-native-biometrics | 지문/Face ID |
| **로컬 저장소** | @react-native-async-storage/async-storage | 데이터 캐싱 |
| **네트워크 요청** | axios | REST API 호출 |
| **이미지 처리** | react-native-image-picker | 카메라/갤러리 |
| **권한 관리** | react-native-permissions | 앱 권한 요청 |

### 3.3 UI/UX 라이브러리

| 항목 | 라이브러리 | 목적 |
|------|-----------|------|
| **UI 컴포넌트** | React Native Paper | Material Design |
| **아이콘** | react-native-vector-icons | 아이콘 세트 |
| **애니메이션** | react-native-reanimated | 부드러운 애니메이션 |
| **스타일링** | styled-components/native | CSS-in-JS |

### 3.4 개발 도구

| 도구 | 용도 |
|------|------|
| **Metro Bundler** | React Native 번들러 |
| **ESLint + Prettier** | 코드 품질 관리 |
| **Flipper** | 디버깅 도구 |
| **Reactotron** | 상태 관리 디버깅 |

### 3.5 플랫폼별 빌드 도구

| 플랫폼 | 도구 |
|--------|------|
| **토스 앱인토스** | @apps-in-toss/granite, AIT CLI |
| **Android** | Gradle, Android Studio |
| **iOS** | Xcode, CocoaPods |

---

## 📱 화면별 구현 전략

### 4.1 네이티브 화면 (React Native 직접 구현)

#### 🔐 로그인/회원가입 화면

**구현 이유**: 첫인상이 중요, 네이티브 성능 필수

**기능**:
- 이메일/비밀번호 로그인
- 소셜 로그인 (카카오, 네이버, 구글, 토스)
- 생체 인증 (옵션)
- 자동 로그인

**API 연동**:
```typescript
// POST /api/auth/login
{
  email: string;
  password: string;
}

// Response
{
  success: boolean;
  user: UserProfile;
  sessionToken: string;
}
```

#### 🏠 메인 화면 (탭 네비게이션)

**구현 이유**: 앱의 핵심 허브, 네이티브 성능 필수

**구조**:
```typescript
<Tab.Navigator>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Chat" component={ChatWebViewScreen} />
  <Tab.Screen name="Notifications" component={NotificationsScreen} />
  <Tab.Screen name="MyPage" component={MyPageScreen} />
</Tab.Navigator>
```

**기능**:
- 홈: 대시보드, 최근 활동
- 채팅: WebView로 전환
- 알림: 푸시 알림 목록 (네이티브)
- 마이페이지: 사용자 정보

#### 👤 프로필 화면

**구현 이유**: 개인정보 표시, 빠른 로딩 필요

**구조**:
- 상단: 네이티브 (프로필 이미지, 이름, 포인트)
- 하단: WebView (상세 정보, 활동 이력)

#### ⚙️ 설정 화면

**구현 이유**: 네이티브 권한 관리 필요

**기능**:
- 알림 설정 (on/off)
- 생체 인증 설정
- 앱 버전 정보
- 로그아웃

### 4.2 WebView 화면 (기존 웹 재사용)

#### 💬 채팅 화면 (`https://albi.kr/chat`)

**구현 이유**: 실시간 채팅은 웹으로 이미 완성도 높음

**WebView 설정**:
```typescript
<WebView
  source={{ uri: 'https://albi.kr/chat' }}
  injectedJavaScript={`
    // 앱 토큰 전달
    window.appToken = "${sessionToken}";
    window.isNativeApp = true;
  `}
  onMessage={(event) => {
    // 웹 → 앱 메시지 수신
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'notification') {
      showPushNotification(data);
    }
  }}
/>
```

#### 👨‍🏫 멘토 채팅 화면 (`https://albi.kr/mentor-chat`)

**구현 이유**: 채팅과 동일한 이유

#### 💳 결제 화면 (`https://albi.kr/payment`)

**구현 이유**: PortOne 결제 연동이 이미 완성됨

**특별 처리**:
- 결제 완료 시 앱으로 메시지 전달
- 앱에서 결제 성공 화면 표시

#### 📋 기타 복잡한 기능

모두 WebView로 처리:
- 공고 관리
- 지원자 관리
- 정산 관리
- 통계 대시보드

---

## 🔐 인증 및 보안

### 5.1 인증 흐름

```
1. 사용자 로그인 (네이티브 화면)
   ↓
2. 백엔드 인증 API 호출 (/api/auth/login)
   ↓
3. sessionToken 발급 받음
   ↓
4. AsyncStorage에 토큰 저장
   ↓
5. 앱 내 모든 API 요청에 토큰 포함
   ↓
6. WebView에 토큰 주입 (injectedJavaScript)
   ↓
7. 웹에서도 동일한 토큰 사용
```

### 5.2 토큰 관리

**저장 위치**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 토큰 저장
await AsyncStorage.setItem('sessionToken', token);

// 토큰 조회
const token = await AsyncStorage.getItem('sessionToken');

// 토큰 삭제 (로그아웃)
await AsyncStorage.removeItem('sessionToken');
```

**토큰 갱신**:
- Access Token: 1시간 (짧은 수명)
- Refresh Token: 30일 (긴 수명)
- 자동 갱신 로직 구현

### 5.3 생체 인증

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

// 지문/Face ID 인증
const { success } = await rnBiometrics.simplePrompt({
  promptMessage: 'Albi 로그인'
});

if (success) {
  // 자동 로그인
}
```

---

## 🔔 푸시 알림

### 6.1 알림 아키텍처

```
백엔드 이벤트 발생
  ↓
FCM/APNs로 푸시 전송
  ↓
앱이 알림 수신
  ↓
- 포그라운드: 인앱 알림 표시
- 백그라운드: 시스템 알림 표시
  ↓
사용자 탭
  ↓
해당 화면으로 이동 (딥링크)
```

### 6.2 알림 종류

| 알림 유형 | 딥링크 | 화면 |
|----------|--------|------|
| **새 채팅 메시지** | `albi://chat?id=123` | 채팅 화면 (WebView) |
| **멘토 매칭 완료** | `albi://mentor-chat?id=456` | 멘토 채팅 (WebView) |
| **결제 완료** | `albi://payment/success?id=789` | 결제 완료 (네이티브) |
| **공고 지원 알림** | `albi://jobs?id=101` | 공고 상세 (WebView) |

### 6.3 푸시 알림 구현

```typescript
import messaging from '@react-native-firebase/messaging';

// FCM 토큰 받기
const fcmToken = await messaging().getToken();
// 백엔드로 전송하여 저장

// 포그라운드 알림 수신
messaging().onMessage(async remoteMessage => {
  console.log('포그라운드 알림:', remoteMessage);
  // 인앱 알림 표시
});

// 백그라운드 알림 탭 처리
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('백그라운드 알림 탭:', remoteMessage);
  // 딥링크로 화면 이동
});
```

---

## 🌐 WebView 통신 (Native ↔ Web)

### 7.1 Native → Web 메시지 전송

**토큰 주입**:
```typescript
<WebView
  injectedJavaScript={`
    // 앱 정보 주입
    window.appInfo = {
      version: "1.0.0",
      platform: "${Platform.OS}",
      token: "${sessionToken}"
    };
    
    // 웹에 알림
    window.dispatchEvent(new Event('app-ready'));
  `}
/>
```

### 7.2 Web → Native 메시지 전송

**웹 측 (albi.kr)**:
```javascript
// 네이티브 앱인지 확인
if (window.ReactNativeWebView) {
  // 앱으로 메시지 전송
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'open-camera',
    data: {}
  }));
}
```

**앱 측 (React Native)**:
```typescript
<WebView
  onMessage={(event) => {
    const message = JSON.parse(event.nativeEvent.data);
    
    switch (message.type) {
      case 'open-camera':
        // 카메라 열기
        openCamera();
        break;
      case 'show-toast':
        // 토스트 메시지 표시
        showToast(message.data.text);
        break;
      case 'navigate':
        // 다른 화면으로 이동
        navigation.navigate(message.data.screen);
        break;
    }
  }}
/>
```

### 7.3 공통 인터페이스

```typescript
// types/WebViewMessage.ts
export interface WebViewMessage {
  type: 'open-camera' | 'show-toast' | 'navigate' | 'request-permission' | 'share';
  data: any;
}

// 앱 → 웹
export interface AppToWebMessage {
  type: 'token-updated' | 'notification-received' | 'network-status';
  data: any;
}
```

---

## 📦 프로젝트 구조

```
AlbiApp/
├── android/                 # 안드로이드 네이티브 코드
├── ios/                     # iOS 네이티브 코드
├── src/
│   ├── components/          # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── WebViewContainer.tsx
│   │
│   ├── screens/            # 화면 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx      # 로그인 (네이티브)
│   │   │   └── SignupScreen.tsx     # 회원가입 (네이티브)
│   │   ├── main/
│   │   │   ├── HomeScreen.tsx       # 홈 (네이티브)
│   │   │   ├── ChatWebViewScreen.tsx   # 채팅 (WebView)
│   │   │   ├── NotificationsScreen.tsx  # 알림 (네이티브)
│   │   │   └── MyPageScreen.tsx     # 마이페이지 (네이티브)
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx    # 프로필 (네이티브 + WebView)
│   │   └── settings/
│   │       └── SettingsScreen.tsx   # 설정 (네이티브)
│   │
│   ├── navigation/         # 네비게이션 설정
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   │
│   ├── services/          # 비즈니스 로직
│   │   ├── api.ts         # API 클라이언트
│   │   ├── auth.ts        # 인증 서비스
│   │   ├── push.ts        # 푸시 알림
│   │   ├── biometric.ts   # 생체 인증
│   │   └── storage.ts     # 로컬 저장소
│   │
│   ├── store/            # 상태 관리 (Zustand)
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── hooks/            # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useWebView.ts
│   │   └── usePushNotification.ts
│   │
│   ├── types/            # TypeScript 타입
│   │   ├── User.ts
│   │   ├── WebViewMessage.ts
│   │   └── Navigation.ts
│   │
│   ├── utils/            # 유틸리티
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   │
│   ├── assets/           # 정적 파일
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   │
│   └── App.tsx           # 앱 엔트리 포인트
│
├── .env                  # 환경 변수
├── .eslintrc.js         # ESLint 설정
├── .prettierrc          # Prettier 설정
├── app.json             # 앱 설정
├── babel.config.js      # Babel 설정
├── metro.config.js      # Metro 번들러 설정
├── package.json         # 의존성
├── tsconfig.json        # TypeScript 설정
│
├── granite.config.ts    # 토스 앱인토스 설정
└── README.md
```

---

## 🚀 개발 로드맵

### Phase 1: 환경 설정 (1주)

**작업 내용**:
- [ ] React Native 프로젝트 생성
- [ ] 필수 라이브러리 설치
- [ ] 프로젝트 구조 설정
- [ ] ESLint/Prettier 설정
- [ ] Git 저장소 설정
- [ ] 개발 환경 테스트 (iOS/Android)

**산출물**:
- 실행 가능한 기본 프로젝트
- 개발 가이드 문서

### Phase 2: 네이티브 화면 개발 (3주)

**Week 1: 인증 화면**
- [ ] 로그인 화면 UI
- [ ] 회원가입 화면 UI
- [ ] API 연동 (로그인/회원가입)
- [ ] 소셜 로그인 SDK 연동
- [ ] AsyncStorage 토큰 저장

**Week 2: 메인 화면**
- [ ] 탭 네비게이션 구조
- [ ] 홈 화면 UI
- [ ] 알림 화면 UI
- [ ] 마이페이지 화면 UI
- [ ] API 연동 (사용자 정보 조회)

**Week 3: 프로필 및 설정**
- [ ] 프로필 화면 (네이티브 부분)
- [ ] 설정 화면
- [ ] 생체 인증 연동
- [ ] 푸시 알림 기본 설정

**산출물**:
- 완성된 네이티브 화면들
- 인증 흐름 동작 확인

### Phase 3: WebView 통합 (2주)

**Week 1: WebView 기본 설정**
- [ ] WebViewContainer 컴포넌트
- [ ] 토큰 주입 로직
- [ ] 채팅 화면 WebView 연동
- [ ] 멘토 채팅 화면 WebView 연동

**Week 2: Native ↔ Web 통신**
- [ ] postMessage 인터페이스 구현
- [ ] 딥링크 처리
- [ ] 웹 측 수정 (네이티브 앱 감지)
- [ ] 통신 테스트 및 디버깅

**산출물**:
- WebView 통합 완료
- Native ↔ Web 통신 동작 확인

### Phase 4: 네이티브 기능 구현 (2주)

**Week 1: 푸시 알림**
- [ ] Firebase 프로젝트 설정
- [ ] FCM/APNs 설정
- [ ] 앱에서 토큰 수집
- [ ] 백엔드 푸시 발송 API
- [ ] 알림 수신 및 처리

**Week 2: 추가 기능**
- [ ] 카메라/갤러리 연동
- [ ] 파일 업로드
- [ ] 공유 기능
- [ ] 권한 관리

**산출물**:
- 푸시 알림 동작 확인
- 네이티브 기능 완료

### Phase 5: 토스 앱인토스 배포 (1주)

- [ ] granite.config.ts 설정
- [ ] 앱 아이콘 제작 (512x512)
- [ ] 스플래시 스크린
- [ ] .ait 빌드
- [ ] 토스 콘솔 업로드
- [ ] QR 코드 테스트
- [ ] 심사 제출

**산출물**:
- 토스 앱인토스 출시 완료

### Phase 6: 안드로이드 빌드 (1주)

- [ ] Google Play Console 계정 ($25)
- [ ] 앱 서명 키 생성
- [ ] AAB 빌드
- [ ] 스토어 등록정보 작성
- [ ] 스크린샷 준비
- [ ] 심사 제출

**산출물**:
- 구글 플레이 스토어 출시 완료

### Phase 7: iOS 빌드 (2주)

- [ ] Apple Developer 계정 ($99/년)
- [ ] 인증서 및 프로비저닝 프로필
- [ ] Xcode Archive 빌드
- [ ] App Store Connect 등록
- [ ] 스크린샷 준비 (iOS)
- [ ] 심사 제출

**산출물**:
- 애플 앱스토어 출시 완료

---

## 💰 예산 계획

### 개발 비용

| 항목 | 세부 내용 | 비용 |
|------|----------|------|
| **개발 인력** | 개발자 1명 x 10주 | (내부 인력) |
| **디자인** | 앱 아이콘, 스플래시 | 외주 or 내부 |
| **테스트** | QA 테스트 | 내부 진행 |

### 플랫폼 비용

| 플랫폼 | 비용 | 주기 | 비고 |
|--------|------|------|------|
| **토스 앱인토스** | **무료** | - | 배포 무제한 |
| **구글 플레이** | **$25** | 1회 | 평생 사용 |
| **애플 앱스토어** | **$99** | 연간 | 매년 갱신 |
| **총 첫해 비용** | **$124** | - | 약 17만원 |

### 유지보수 비용 (연간)

| 항목 | 비용 |
|------|------|
| **애플 개발자 계정** | $99/년 |
| **푸시 알림 (Firebase)** | 무료 (Free Tier) |
| **백엔드 (Cloudflare)** | 현재 비용 유지 |
| **연간 총 비용** | ~$99 (약 14만원) |

---

## 🧪 테스트 전략

### 단위 테스트 (Unit Test)

```typescript
// __tests__/services/auth.test.ts
import { login } from '../services/auth';

describe('Auth Service', () => {
  test('로그인 성공', async () => {
    const result = await login('test@albi.kr', 'password123');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });
});
```

### 통합 테스트 (Integration Test)

- 네이티브 화면 → API 연동
- WebView 통신 테스트
- 푸시 알림 전달 확인

### E2E 테스트

```typescript
// e2e/login.e2e.js (Detox)
describe('로그인 테스트', () => {
  it('로그인 성공 후 메인 화면 이동', async () => {
    await element(by.id('email-input')).typeText('test@albi.kr');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('main-screen'))).toBeVisible();
  });
});
```

### 수동 테스트 체크리스트

**네이티브 기능**:
- [ ] 로그인/로그아웃
- [ ] 소셜 로그인 (4개)
- [ ] 생체 인증
- [ ] 푸시 알림 수신
- [ ] 카메라/갤러리

**WebView 기능**:
- [ ] 채팅 기능
- [ ] 결제 기능
- [ ] 토큰 자동 주입 확인

**플랫폼별 테스트**:
- [ ] 토스 앱인토스 (QR 코드)
- [ ] 안드로이드 실기기
- [ ] iOS 실기기

---

## 🔒 보안 고려사항

### 데이터 보안

1. **토큰 저장**: AsyncStorage (암호화 권장)
2. **네트워크 통신**: HTTPS only
3. **민감 정보**: 로그에 노출 금지

### 앱 보안

1. **코드 난독화**: ProGuard (Android), Obfuscation (iOS)
2. **루팅/탈옥 감지**: jailmonkey 라이브러리
3. **SSL Pinning**: 중요 API에 적용

### 권한 관리

```typescript
// 필요한 권한만 최소한으로 요청
const permissions = [
  'camera',          // 프로필 사진 업로드
  'photo-library',   // 갤러리 접근
  'notifications'    // 푸시 알림
];
```

---

## 📈 성능 최적화

### React Native 최적화

1. **이미지 최적화**: WebP 포맷, 적절한 크기
2. **리스트 렌더링**: FlatList 사용 (VirtualizedList)
3. **메모이제이션**: useMemo, useCallback 활용
4. **불필요한 리렌더링 방지**: React.memo

### WebView 최적화

1. **캐싱 활성화**:
```typescript
<WebView
  cacheEnabled={true}
  cacheMode="LOAD_CACHE_ELSE_NETWORK"
/>
```

2. **JavaScript 최적화**: 웹 측 번들 크기 최소화
3. **이미지 Lazy Loading**: 웹에서 구현

### 앱 용량 최적화

- 불필요한 네이티브 라이브러리 제거
- 이미지 압축
- Android: AAB 포맷 (동적 전달)
- iOS: App Thinning

---

## 🐛 디버깅 및 모니터링

### 개발 중 디버깅

1. **Flipper**: 네트워크, 로그, 레이아웃 확인
2. **React Native Debugger**: Redux, 네트워크
3. **Reactotron**: 상태 관리 디버깅

### 프로덕션 모니터링

1. **Crashlytics**: 크래시 리포트
2. **Analytics**: 사용자 행동 분석 (Firebase Analytics)
3. **Performance Monitoring**: 성능 측정

```typescript
// Crashlytics 예시
import crashlytics from '@react-native-firebase/crashlytics';

try {
  // 위험한 작업
} catch (error) {
  crashlytics().recordError(error);
}
```

---

## 📚 참고 자료

### 공식 문서

- [React Native 공식 문서](https://reactnative.dev/)
- [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [React Navigation](https://reactnavigation.org/)
- [Firebase for React Native](https://rnfirebase.io/)

### 배포 가이드

- [구글 플레이 스토어 출시](https://reactnative.dev/docs/signed-apk-android)
- [애플 앱스토어 출시](https://reactnative.dev/docs/publishing-to-app-store)

### 커뮤니티

- [React Native Community](https://github.com/react-native-community)
- [토스 앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

---

## ✅ 성공 기준

### 기술적 목표

- [ ] 3개 플랫폼 동시 출시 (토스, 안드로이드, iOS)
- [ ] 앱 용량 < 50MB (Android), < 100MB (iOS)
- [ ] 앱 시작 시간 < 3초
- [ ] API 응답 시간 < 1초
- [ ] 크래시 발생률 < 1%

### 비즈니스 목표

- [ ] 토스 앱인토스 심사 통과
- [ ] 구글 플레이 심사 통과
- [ ] 애플 앱스토어 심사 통과
- [ ] 월 활성 사용자 1,000명 (3개월 내)
- [ ] 앱 평점 4.5+ 유지

---

## 📞 팀 연락처 및 역할

| 역할 | 담당자 | 연락처 |
|------|--------|--------|
| **프로젝트 관리자** | TBD | - |
| **React Native 개발** | TBD | - |
| **백엔드 API** | 기존 팀 | - |
| **UI/UX 디자인** | TBD | - |
| **QA 테스트** | TBD | - |

---

## 📝 변경 이력

| 버전 | 날짜 | 내용 | 작성자 |
|------|------|------|--------|
| v1.0.0 | 2026-03-09 | 초기 아키텍처 설계 | Albi Team |

---

**문서 끝**
