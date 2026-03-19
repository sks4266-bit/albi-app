# 🏗️ Albi 모바일 앱 - 기술 아키텍처 문서

## 📋 문서 개요

**프로젝트**: Albi 모바일 앱 (React Native + Toss Apps-in-Toss)  
**작성일**: 2026-03-09  
**버전**: 1.0  
**작성자**: Albi 개발팀

---

## 🎯 아키텍처 개요

### 핵심 전략: Hybrid Architecture
**기존 웹앱 (90%) + 네이티브 UI (10%) = 최적의 사용자 경험**

```
┌─────────────────────────────────────────────────────────┐
│              Albi 모바일 앱 아키텍처                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Toss 앱인토스  │  │ Google Play  │  │  App Store   │ │
│  │  (무료)       │  │   ($25)      │  │   ($99/년)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                           │                             │
│              ┌────────────▼────────────┐                │
│              │  React Native Core     │                │
│              │  (JavaScript Bundle)    │                │
│              └────────────┬────────────┘                │
│                           │                             │
│         ┌─────────────────┴─────────────────┐           │
│         │                                   │           │
│  ┌──────▼────────┐                ┌────────▼─────────┐ │
│  │ 네이티브 UI    │                │  WebView 컨테이너  │ │
│  │ (50%)         │                │  (50%)           │ │
│  ├───────────────┤                ├──────────────────┤ │
│  │ - 로그인      │                │ - AI 면접        │ │
│  │ - 메인        │                │ - 문서 교정      │ │
│  │ - AI 멘토 UI  │                │ - 포트폴리오     │ │
│  │ - 마이페이지   │                │ - 과제 제출      │ │
│  │ - 설정        │                │ - 결제 페이지     │ │
│  └───────────────┘                └──────────────────┘ │
│         │                                   │           │
│         └─────────────────┬─────────────────┘           │
│                           │                             │
│              ┌────────────▼────────────┐                │
│              │  JavaScript Bridge      │                │
│              │  (postMessage 통신)      │                │
│              └────────────┬────────────┘                │
│                           │                             │
│         ┌─────────────────┴─────────────────┐           │
│         │                                   │           │
│  ┌──────▼────────┐                ┌────────▼─────────┐ │
│  │ 네이티브 플러그인│                │  백엔드 API       │ │
│  ├───────────────┤                ├──────────────────┤ │
│  │ - 푸시 알림    │                │ Hono + Cloudflare│ │
│  │ - 생체 인증    │                │ Functions        │ │
│  │ - 카메라      │                │                  │ │
│  │ - 로컬 저장소  │                │ D1 Database      │ │
│  │ - Firebase    │                │ (SQLite)         │ │
│  └───────────────┘                └──────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 기술 스택

### Frontend (React Native)

#### 1. 코어 프레임워크
```json
{
  "react": "18.2.0",
  "react-native": "0.74.0",
  "typescript": "^5.0.0"
}
```

#### 2. 네비게이션
```json
{
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11"
}
```

#### 3. 상태 관리
```json
{
  "@reduxjs/toolkit": "^2.0.1",
  "react-redux": "^9.0.4",
  "redux-persist": "^6.0.0"
}
```

#### 4. UI 컴포넌트
```json
{
  "react-native-paper": "^5.11.3",
  "@react-native-community/slider": "^4.5.0",
  "react-native-vector-icons": "^10.0.3",
  "react-native-svg": "^14.1.0"
}
```

#### 5. WebView
```json
{
  "react-native-webview": "^13.6.3"
}
```

#### 6. 네이티브 플러그인
```json
{
  "@react-native-firebase/app": "^19.0.0",
  "@react-native-firebase/messaging": "^19.0.0",
  "react-native-biometrics": "^3.0.1",
  "react-native-image-picker": "^7.1.0",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

#### 7. Toss Apps-in-Toss
```json
{
  "@toss/granite": "^1.0.0"
}
```

### Backend (기존 웹앱 재사용)

#### Hono + Cloudflare Pages
```json
{
  "hono": "^4.0.0",
  "@cloudflare/workers-types": "4.20250705.0"
}
```

#### Database
- **Cloudflare D1** (SQLite, 54 tables)

#### AI & APIs
- **GPT-5** (GenSpark LLM Proxy)
- **PortOne** (결제)
- **Resend** (이메일)

---

## 📁 프로젝트 구조

```
AlbiApp/
├── android/                    # Android 네이티브 코드
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── res/
│   │   │   │   ├── mipmap-*/ic_launcher.png
│   │   │   │   └── values/
│   │   │   │       └── strings.xml
│   │   │   └── java/kr/albi/app/
│   │   └── build.gradle
│   └── gradle.properties
│
├── ios/                        # iOS 네이티브 코드
│   ├── AlbiApp/
│   │   ├── Info.plist
│   │   ├── Images.xcassets/
│   │   │   └── AppIcon.appiconset/
│   │   └── LaunchScreen.storyboard
│   ├── AlbiApp.xcodeproj
│   └── Podfile
│
├── src/
│   ├── screens/               # 네이티브 스크린
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── mentor/
│   │   │   ├── MentorChatScreen.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── VoiceButton.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── webview/
│   │       ├── WebViewScreen.tsx
│   │       ├── InterviewWebView.tsx
│   │       └── PaymentWebView.tsx
│   │
│   ├── components/            # 재사용 컴포넌트
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── navigation/
│   │   │   ├── BottomTabNavigator.tsx
│   │   │   └── StackNavigator.tsx
│   │   └── webview/
│   │       ├── WebViewBridge.tsx
│   │       └── WebViewErrorBoundary.tsx
│   │
│   ├── services/              # API & 서비스
│   │   ├── api/
│   │   │   ├── authApi.ts
│   │   │   ├── mentorApi.ts
│   │   │   ├── paymentApi.ts
│   │   │   └── profileApi.ts
│   │   ├── firebase/
│   │   │   ├── messaging.ts
│   │   │   └── analytics.ts
│   │   └── storage/
│   │       └── AsyncStorageService.ts
│   │
│   ├── store/                 # Redux Store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── mentorSlice.ts
│   │   │   └── profileSlice.ts
│   │   ├── store.ts
│   │   └── hooks.ts
│   │
│   ├── utils/                 # 유틸리티
│   │   ├── webviewBridge.ts
│   │   ├── tokenManager.ts
│   │   ├── biometrics.ts
│   │   └── deepLink.ts
│   │
│   ├── types/                 # TypeScript 타입
│   │   ├── auth.types.ts
│   │   ├── mentor.types.ts
│   │   └── webview.types.ts
│   │
│   ├── assets/                # 이미지, 폰트
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── config/                # 환경 설정
│   │   ├── env.ts
│   │   ├── constants.ts
│   │   └── navigation.ts
│   │
│   └── App.tsx                # 앱 엔트리 포인트
│
├── toss/                      # Toss Apps-in-Toss 설정
│   └── granite.config.ts
│
├── .env.development           # 개발 환경 변수
├── .env.production            # 프로덕션 환경 변수
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
└── README.md
```

---

## 🔐 인증 아키텍처

### 1. 네이티브 로그인 플로우

```
사용자
  │
  ├─> 로그인 화면 (네이티브)
  │     ├─> 카카오 로그인
  │     ├─> 네이버 로그인
  │     ├─> 구글 로그인
  │     └─> 이메일 로그인
  │
  ├─> 백엔드 API (/api/auth/kakao, /api/auth/naver 등)
  │     └─> JWT 토큰 발급
  │
  ├─> AsyncStorage에 토큰 저장
  │
  ├─> Redux Store 업데이트
  │
  └─> 메인 화면으로 이동
```

### 2. WebView 토큰 주입

```typescript
// src/components/webview/WebViewBridge.tsx
import React from 'react';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface WebViewBridgeProps {
  url: string;
}

export const WebViewBridge: React.FC<WebViewBridgeProps> = ({ url }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.userId);

  // 토큰 자동 주입
  const injectedJavaScript = `
    (function() {
      // 로컬 스토리지에 토큰 저장
      localStorage.setItem('auth_token', '${token}');
      localStorage.setItem('user_id', '${userId}');
      
      // 웹앱에 메시지 전송
      window.postMessage({
        type: 'NATIVE_AUTH',
        token: '${token}',
        userId: '${userId}'
      }, '*');
    })();
  `;

  // 웹→네이티브 메시지 수신
  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    
    switch (data.type) {
      case 'REQUEST_CAMERA':
        // 카메라 권한 요청
        handleCameraRequest();
        break;
      case 'REQUEST_NOTIFICATION':
        // 알림 권한 요청
        handleNotificationRequest();
        break;
      case 'LOGOUT':
        // 로그아웃 처리
        handleLogout();
        break;
    }
  };

  return (
    <WebView
      source={{ uri: url }}
      injectedJavaScript={injectedJavaScript}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={() => <LoadingSpinner />}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error: ', nativeEvent);
      }}
    />
  );
};
```

---

## 🌐 WebView 통합 전략

### 1. WebView 매핑

| 네이티브 화면 | WebView URL | 설명 |
|-------------|------------|------|
| AI 면접 연습 | `https://albi.kr/chat` | 실전 면접 시뮬레이션 |
| 문서 교정 | `https://albi.kr/proofread.html` | AI 문서 교정 |
| 포트폴리오 | `https://albi.kr/portfolio.html` | 포트폴리오 관리 |
| 과제 제출 | `https://albi.kr/assignments.html` | 과제 제출 & 피드백 |
| 결제 | `https://albi.kr/payment.html` | 구독 결제 |
| 결제 내역 | `https://albi.kr/payment-history.html` | 결제 이력 조회 |

### 2. JavaScript Bridge 프로토콜

#### 네이티브 → 웹
```javascript
// 네이티브에서 웹으로 메시지 전송
{
  type: 'NATIVE_AUTH',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  userId: 'user_123',
  timestamp: 1678901234567
}
```

#### 웹 → 네이티브
```javascript
// 웹에서 네이티브로 메시지 전송
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'REQUEST_CAMERA',
  data: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8
  }
}));
```

### 3. 지원 메시지 타입

| 타입 | 방향 | 설명 |
|-----|------|------|
| `NATIVE_AUTH` | Native → Web | 토큰 및 사용자 정보 전달 |
| `REQUEST_CAMERA` | Web → Native | 카메라 촬영 요청 |
| `CAMERA_RESULT` | Native → Web | 촬영된 이미지 전달 |
| `REQUEST_NOTIFICATION` | Web → Native | 푸시 알림 권한 요청 |
| `NOTIFICATION_GRANTED` | Native → Web | 알림 권한 승인 결과 |
| `LOGOUT` | Web → Native | 로그아웃 요청 |
| `PAYMENT_SUCCESS` | Web → Native | 결제 성공 알림 |
| `DEEP_LINK` | Web → Native | 특정 화면 이동 요청 |

---

## 🔔 푸시 알림 아키텍처

### 1. Firebase Cloud Messaging (FCM) 설정

```typescript
// src/services/firebase/messaging.ts
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export class PushNotificationService {
  // FCM 토큰 가져오기
  static async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // 서버에 토큰 등록
  static async registerToken(userId: string, token: string): Promise<void> {
    try {
      await apiClient.post('/api/push/register', {
        userId,
        token,
        platform: Platform.OS
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  // 포그라운드 알림 핸들러
  static async setupForegroundHandler(): Promise<void> {
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage);
      
      // 로컬 알림 표시
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'albi-default',
          smallIcon: 'ic_notification',
          color: '#6366F1'
        }
      });
    });
  }

  // 백그라운드 알림 핸들러
  static setupBackgroundHandler(): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification:', remoteMessage);
      // 백그라운드 처리 로직
    });
  }

  // 알림 클릭 핸들러
  static setupNotificationOpenedHandler(navigation: any): void {
    // 앱이 종료된 상태에서 알림 클릭
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          handleNotificationNavigation(remoteMessage, navigation);
        }
      });

    // 앱이 백그라운드에서 알림 클릭
    messaging().onNotificationOpenedApp((remoteMessage) => {
      handleNotificationNavigation(remoteMessage, navigation);
    });
  }
}

// 알림 클릭 시 화면 이동
function handleNotificationNavigation(remoteMessage: any, navigation: any) {
  const { screen, params } = remoteMessage.data;
  
  switch (screen) {
    case 'mentor-chat':
      navigation.navigate('MentorChat');
      break;
    case 'interview':
      navigation.navigate('InterviewWebView');
      break;
    case 'payment':
      navigation.navigate('PaymentWebView');
      break;
  }
}
```

### 2. 알림 타입

| 타입 | 제목 | 내용 | 딥링크 |
|-----|------|------|--------|
| 구독 갱신 알림 | "구독 갱신 안내" | "3일 후 자동 갱신됩니다" | `mypage` |
| 구독 만료 | "구독이 만료되었습니다" | "재구독하고 AI 멘토를 이용하세요" | `payment` |
| AI 멘토 답변 | "AI 멘토가 답변했습니다" | "새로운 답변을 확인하세요" | `mentor-chat` |
| 과제 피드백 | "과제 피드백이 도착했습니다" | "AI가 과제를 평가했습니다" | `assignments` |
| 포트폴리오 리뷰 | "AI 리뷰 완료" | "포트폴리오 점수를 확인하세요" | `portfolio` |

---

## 🔒 생체 인증 아키텍처

```typescript
// src/utils/biometrics.ts
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BiometricsService {
  private static rnBiometrics = new ReactNativeBiometrics();

  // 생체 인증 가능 여부 확인
  static async isBiometricsAvailable(): Promise<boolean> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      if (available && biometryType) {
        console.log('Biometry type:', biometryType);
        // biometryType: 'FaceID', 'TouchID', 'Biometrics'
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometrics check error:', error);
      return false;
    }
  }

  // 생체 인증 실행
  static async authenticate(reason: string = '로그인하려면 인증이 필요합니다'): Promise<boolean> {
    try {
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: reason
      });
      
      return success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  // 생체 인증 키 생성 (선택적)
  static async createKeys(): Promise<boolean> {
    try {
      const { publicKey } = await this.rnBiometrics.createKeys();
      await AsyncStorage.setItem('biometric_public_key', publicKey);
      return true;
    } catch (error) {
      console.error('Biometric key creation error:', error);
      return false;
    }
  }

  // 생체 인증 설정 저장
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem('biometric_enabled', String(enabled));
  }

  // 생체 인증 설정 조회
  static async isBiometricEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem('biometric_enabled');
    return enabled === 'true';
  }
}
```

---

## 📷 카메라 & 이미지 아키텍처

```typescript
// src/utils/imagePickerService.ts
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { Platform, PermissionsAndroid } from 'react-native';

export class ImagePickerService {
  // Android 카메라 권한 요청
  static async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS는 Info.plist에서 설정
  }

  // 카메라 촬영
  static async takePhoto(): Promise<string | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      return null;
    }

    return new Promise((resolve) => {
      launchCamera({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        cameraType: 'back'
      }, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve(null);
        } else if (response.errorCode) {
          console.error('Camera error:', response.errorMessage);
          resolve(null);
        } else if (response.assets && response.assets[0]) {
          resolve(response.assets[0].uri || null);
        }
      });
    });
  }

  // 갤러리에서 이미지 선택
  static async pickImage(): Promise<string | null> {
    return new Promise((resolve) => {
      launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      }, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve(null);
        } else if (response.errorCode) {
          console.error('Image picker error:', response.errorMessage);
          resolve(null);
        } else if (response.assets && response.assets[0]) {
          resolve(response.assets[0].uri || null);
        }
      });
    });
  }

  // 이미지 업로드 (Base64 또는 FormData)
  static async uploadImage(uri: string, endpoint: string): Promise<string | null> {
    try {
      // Base64 변환 (옵션 1)
      const base64 = await RNFS.readFile(uri, 'base64');
      
      // API 요청
      const response = await apiClient.post(endpoint, {
        image: `data:image/jpeg;base64,${base64}`,
        userId: 'user_123'
      });

      return response.data.url; // 업로드된 이미지 URL
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  }
}
```

---

## 🔗 딥링크 아키텍처

### 1. 딥링크 URL 스킴

```
albi://screen/param
```

**예시**:
- `albi://mentor-chat` → AI 멘토 채팅 화면
- `albi://interview?id=123` → AI 면접 상세 (WebView)
- `albi://payment?plan=premium` → 결제 페이지 (WebView)
- `albi://profile` → 마이페이지

### 2. 딥링크 설정

#### Android (AndroidManifest.xml)
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data
    android:scheme="albi"
    android:host="screen" />
</intent-filter>
```

#### iOS (Info.plist)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>albi</string>
    </array>
  </dict>
</array>
```

### 3. 딥링크 핸들러

```typescript
// src/utils/deepLink.ts
import { Linking } from 'react-native';

export class DeepLinkService {
  static setupDeepLinking(navigation: any) {
    // 앱이 닫힌 상태에서 딥링크 클릭
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url, navigation);
      }
    });

    // 앱이 실행 중일 때 딥링크 클릭
    Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url, navigation);
    });
  }

  static handleDeepLink(url: string, navigation: any) {
    const route = this.parseDeepLink(url);
    
    if (route) {
      navigation.navigate(route.screen, route.params);
    }
  }

  static parseDeepLink(url: string): { screen: string; params?: any } | null {
    // albi://mentor-chat → { screen: 'MentorChat' }
    // albi://interview?id=123 → { screen: 'InterviewWebView', params: { id: '123' } }
    
    const [scheme, rest] = url.split('://');
    if (scheme !== 'albi') return null;

    const [path, queryString] = rest.split('?');
    const params = queryString ? this.parseQuery(queryString) : {};

    const screenMap: Record<string, string> = {
      'mentor-chat': 'MentorChat',
      'interview': 'InterviewWebView',
      'payment': 'PaymentWebView',
      'profile': 'Profile'
    };

    const screen = screenMap[path];
    return screen ? { screen, params } : null;
  }

  static parseQuery(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    queryString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });
    return params;
  }
}
```

---

## 🎨 UI/UX 디자인 시스템

### 1. 컬러 팔레트

```typescript
// src/config/colors.ts
export const Colors = {
  primary: '#6366F1',      // 인디고 블루 (메인 컬러)
  primaryDark: '#4F46E5',  // 진한 인디고
  primaryLight: '#818CF8', // 밝은 인디고
  
  secondary: '#10B981',    // 그린 (성공)
  warning: '#F59E0B',      // 오렌지 (경고)
  error: '#EF4444',        // 레드 (에러)
  
  background: '#FFFFFF',   // 배경 (밝은 모드)
  backgroundDark: '#1F2937', // 배경 (다크 모드)
  
  text: '#1F2937',         // 텍스트 (밝은 모드)
  textDark: '#F9FAFB',     // 텍스트 (다크 모드)
  textSecondary: '#6B7280', // 보조 텍스트
  
  border: '#E5E7EB',       // 보더
  card: '#F9FAFB',         // 카드 배경
};
```

### 2. 타이포그래피

```typescript
// src/config/typography.ts
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};
```

### 3. 스페이싱

```typescript
// src/config/spacing.ts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

---

## 🔧 빌드 설정

### 1. Android 빌드 설정

```gradle
// android/app/build.gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "kr.albi.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            storeFile file("albi-release-key.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "albi-release"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### 2. iOS 빌드 설정

```ruby
# ios/Podfile
platform :ios, '13.0'
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'AlbiApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )

  # Firebase
  pod 'Firebase', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
  
  # Toss Granite (if needed)
  # pod 'TossGranite', '~> 1.0.0'
  
  post_install do |installer|
    react_native_post_install(installer)
  end
end
```

### 3. Toss Apps-in-Toss 설정

```typescript
// toss/granite.config.ts
import { defineConfig } from '@toss/granite';

export default defineConfig({
  appName: 'Albi',
  appId: 'kr.albi.app',
  version: '1.0.0',
  
  brand: {
    name: 'Albi',
    icon: './assets/icon.png',
    color: '#6366F1',
  },
  
  permissions: [
    'camera',
    'push-notifications',
    'biometrics'
  ],
  
  deepLinks: [
    {
      scheme: 'albi',
      host: 'screen'
    }
  ],
  
  webview: {
    allowedDomains: [
      'albi.kr',
      'https://albi.kr'
    ]
  }
});
```

---

## 📊 성능 최적화 전략

### 1. 빌드 크기 최적화
- **Hermes 엔진 활성화**: JavaScript 실행 속도 향상
- **ProGuard/R8**: Android 코드 난독화 및 압축
- **App Thinning**: iOS 앱 크기 최소화
- **이미지 최적화**: WebP 포맷 사용, 압축

### 2. 렌더링 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **FlatList 가상화**: 긴 리스트 성능 향상
- **이미지 캐싱**: react-native-fast-image 사용

### 3. WebView 최적화
- **WebView 재사용**: 동일 도메인은 하나의 WebView 인스턴스 재사용
- **캐싱 전략**: localStorage, IndexedDB 활용
- **로딩 최적화**: 스켈레톤 UI, 프로그레스 바

---

## 🔍 모니터링 & 분석

### 1. Firebase Analytics
```typescript
import analytics from '@react-native-firebase/analytics';

// 화면 추적
await analytics().logScreenView({
  screen_name: 'MentorChat',
  screen_class: 'MentorChatScreen',
});

// 이벤트 추적
await analytics().logEvent('subscription_purchase', {
  plan: 'premium',
  price: 4900,
  currency: 'KRW',
});
```

### 2. Crashlytics
```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// 에러 로깅
crashlytics().recordError(new Error('Something went wrong'));

// 사용자 정보 설정
crashlytics().setUserId('user_123');
crashlytics().setAttribute('plan', 'premium');
```

---

## 🚀 배포 전략

### 1. Toss Apps-in-Toss
```bash
# 빌드
npm run build:toss

# .ait 파일 생성
npx ait build

# Toss 콘솔 업로드
# https://console-apps-in-toss.toss.im/
```

### 2. Android (Google Play)
```bash
# AAB 번들 생성
cd android
./gradlew bundleRelease

# 출력: android/app/build/outputs/bundle/release/app-release.aab
```

### 3. iOS (App Store)
```bash
# Xcode Archive
npx react-native run-ios --configuration Release

# Xcode에서:
# Product → Archive → Distribute App → App Store Connect
```

---

## 📚 참고 문서

- **React Native**: https://reactnative.dev/
- **React Navigation**: https://reactnavigation.org/
- **Firebase**: https://rnfirebase.io/
- **Toss Granite**: https://developers-apps-in-toss.toss.im/
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/

---

**작성일**: 2026-03-09  
**버전**: 1.0  
**다음 문서**: 멀티플랫폼 배포 전략 (ALBI_MOBILE_APP_DEPLOYMENT_STRATEGY.md)
