# Albi 모바일 앱 개발 가이드

## 📚 목차

1. [개발 환경 설정](#1-개발-환경-설정)
2. [프로젝트 생성](#2-프로젝트-생성)
3. [핵심 기능 구현 예시](#3-핵심-기능-구현-예시)
4. [빌드 및 배포](#4-빌드-및-배포)
5. [트러블슈팅](#5-트러블슈팅)

---

## 1. 개발 환경 설정

### 1.1 필수 도구 설치

#### macOS (iOS + Android 모두 개발 가능)

```bash
# Homebrew 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 설치 (LTS 버전)
brew install node@20

# Watchman 설치 (파일 변경 감지)
brew install watchman

# CocoaPods 설치 (iOS 의존성 관리)
sudo gem install cocoapods

# Java 설치 (Android 개발용)
brew install --cask zulu@17

# Android Studio 설치
brew install --cask android-studio

# Xcode 설치 (App Store에서)
# https://apps.apple.com/app/xcode/id497799835
```

#### Windows/Linux (Android만 개발 가능)

```bash
# Node.js 설치 (공식 사이트에서 다운로드)
# https://nodejs.org/

# Java 설치
# https://www.oracle.com/java/technologies/downloads/

# Android Studio 설치
# https://developer.android.com/studio
```

### 1.2 Android SDK 설정

**Android Studio 설정**:
1. Android Studio 실행
2. More Actions → SDK Manager
3. SDK Platforms 탭: Android 13.0 (Tiramisu) 설치
4. SDK Tools 탭: Android SDK Build-Tools 33.0.0 설치

**환경 변수 설정** (macOS/Linux):
```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# 적용
source ~/.zshrc
```

### 1.3 Xcode 설정 (macOS만)

```bash
# Xcode 설치 후 Command Line Tools 설정
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# iOS Simulator 실행 확인
open -a Simulator
```

### 1.4 개발 도구 설치

```bash
# React Native CLI 설치
npm install -g react-native-cli

# TypeScript 설치
npm install -g typescript

# ESLint 설치
npm install -g eslint

# Prettier 설치
npm install -g prettier
```

---

## 2. 프로젝트 생성

### 2.1 React Native 프로젝트 생성

```bash
# 프로젝트 디렉토리로 이동
cd /home/user

# React Native 프로젝트 생성 (TypeScript 템플릿)
npx react-native@latest init AlbiApp --template react-native-template-typescript

# 프로젝트로 이동
cd AlbiApp

# iOS 의존성 설치 (macOS만)
cd ios && pod install && cd ..
```

### 2.2 필수 라이브러리 설치

```bash
# 네비게이션
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated

# WebView
npm install react-native-webview

# 상태 관리
npm install zustand

# API 통신
npm install axios

# 푸시 알림
npm install @react-native-firebase/app @react-native-firebase/messaging

# 생체 인증
npm install react-native-biometrics

# 로컬 저장소
npm install @react-native-async-storage/async-storage

# UI 라이브러리
npm install react-native-paper react-native-vector-icons

# 이미지 선택
npm install react-native-image-picker

# 환경 변수
npm install react-native-config

# DevDependencies
npm install -D @types/react @types/react-native
```

### 2.3 iOS 추가 설정 (macOS만)

```bash
cd ios
pod install
cd ..

# Info.plist에 권한 추가 필요
# - NSCameraUsageDescription (카메라)
# - NSPhotoLibraryUsageDescription (갤러리)
# - NSFaceIDUsageDescription (Face ID)
```

### 2.4 Android 추가 설정

```bash
# android/build.gradle
# minSdkVersion 23 이상 확인

# AndroidManifest.xml에 권한 추가
# <uses-permission android:name="android.permission.INTERNET" />
# <uses-permission android:name="android.permission.CAMERA" />
```

---

## 3. 핵심 기능 구현 예시

### 3.1 프로젝트 구조 생성

```bash
cd AlbiApp

# 디렉토리 구조 생성
mkdir -p src/{components,screens,navigation,services,store,hooks,types,utils,assets}
mkdir -p src/screens/{auth,main,profile,settings}
mkdir -p src/assets/{images,fonts,icons}
```

### 3.2 환경 변수 설정

**.env 파일 생성**:
```bash
# .env
API_BASE_URL=https://albi.kr/api
WEB_BASE_URL=https://albi.kr
TOSS_APP_NAME=albi-toss-app
```

**설정 파일 생성**:
```typescript
// src/utils/constants.ts
import Config from 'react-native-config';

export const API_BASE_URL = Config.API_BASE_URL || 'https://albi.kr/api';
export const WEB_BASE_URL = Config.WEB_BASE_URL || 'https://albi.kr';

export const STORAGE_KEYS = {
  SESSION_TOKEN: 'sessionToken',
  USER_INFO: 'userInfo',
  BIOMETRIC_ENABLED: 'biometricEnabled',
};

export const ROUTES = {
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  MAIN: 'Main',
  HOME: 'Home',
  CHAT: 'Chat',
  NOTIFICATIONS: 'Notifications',
  MY_PAGE: 'MyPage',
  SETTINGS: 'Settings',
  WEBVIEW: 'WebView',
};
```

### 3.3 API 서비스 구현

```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터: 토큰 자동 추가
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터: 에러 처리
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // 토큰 만료 처리
          await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
          // 로그인 화면으로 이동 (네비게이션 필요)
        }
        return Promise.reject(error);
      }
    );
  }

  // GET 요청
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  // POST 요청
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  // PUT 요청
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  // DELETE 요청
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

export default new ApiService();
```

### 3.4 인증 서비스 구현

```typescript
// src/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  sessionToken: string;
}

class AuthService {
  // 로그인
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.sessionToken) {
      // 토큰 저장
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, response.sessionToken);
      // 사용자 정보 저장
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));
    }

    return response;
  }

  // 로그아웃
  async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
  }

  // 토큰 확인
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  // 자동 로그인 확인
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // 사용자 정보 조회
  async getUserInfo() {
    const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  }
}

export default new AuthService();
```

### 3.5 로그인 화면 구현

```typescript
// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AuthService from '../../services/auth';

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.login(email, password);
      
      if (response.success) {
        // 로그인 성공 → 메인 화면으로 이동
        navigation.replace('Main');
      }
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Albi</Text>
      <Text style={styles.subtitle}>로그인</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>로그인</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Signup')}
        disabled={loading}
      >
        <Text style={styles.linkText}>회원가입</Text>
      </TouchableOpacity>

      {/* 소셜 로그인 버튼들 */}
      <View style={styles.socialContainer}>
        <Text style={styles.socialTitle}>소셜 로그인</Text>
        {/* 카카오, 네이버, 구글, 토스 버튼 */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#4F46E5',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  socialContainer: {
    marginTop: 40,
  },
  socialTitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 15,
  },
});
```

### 3.6 WebView 컴포넌트 구현

```typescript
// src/components/WebViewContainer.tsx
import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

interface Props {
  url: string;
  onMessage?: (data: any) => void;
}

export default function WebViewContainer({ url, onMessage }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // 웹으로 메시지 전송
  const sendMessageToWeb = (message: any) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  // 웹에서 메시지 수신
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Web → Native:', data);
      
      if (onMessage) {
        onMessage(data);
      }
    } catch (error) {
      console.error('WebView message parse error:', error);
    }
  };

  // 토큰 주입 스크립트
  const getInjectedJavaScript = async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    
    return `
      (function() {
        // 앱 정보 주입
        window.appInfo = {
          platform: '${Platform.OS}',
          version: '1.0.0',
          isNativeApp: true,
          token: '${token || ''}',
          user: ${userInfo || '{}'}
        };
        
        // localStorage에도 저장
        if (window.appInfo.token) {
          localStorage.setItem('app_token', window.appInfo.token);
        }
        
        // 웹에 준비 완료 알림
        window.dispatchEvent(new CustomEvent('app-ready', { 
          detail: window.appInfo 
        }));
        
        // Native 통신 헬퍼 함수
        window.sendToNative = function(type, data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type,
            data: data
          }));
        };
        
        console.log('Native app initialized:', window.appInfo);
      })();
      true;
    `;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={getInjectedJavaScript()}
        onLoad={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        // 성능 최적화
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        // 보안
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // iOS 설정
        decelerationRate="normal"
        // Android 설정
        domStorageEnabled
        javaScriptEnabled
        mixedContentMode="always"
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### 3.7 채팅 화면 (WebView)

```typescript
// src/screens/main/ChatWebViewScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import WebViewContainer from '../../components/WebViewContainer';
import { WEB_BASE_URL } from '../../utils/constants';

export default function ChatWebViewScreen() {
  const handleWebMessage = (data: any) => {
    console.log('Chat message received:', data);
    
    // 웹에서 특정 동작 요청 시 처리
    switch (data.type) {
      case 'open-camera':
        // 카메라 열기
        break;
      case 'show-notification':
        // 로컬 알림 표시
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  return (
    <View style={styles.container}>
      <WebViewContainer
        url={`${WEB_BASE_URL}/chat`}
        onMessage={handleWebMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

## 4. 빌드 및 배포

### 4.1 개발 모드 실행

```bash
# iOS (macOS만)
npm run ios
# 또는 특정 시뮬레이터
npx react-native run-ios --simulator="iPhone 15 Pro"

# Android
npm run android
# 또는 특정 에뮬레이터
npx react-native run-android
```

### 4.2 토스 앱인토스 빌드

```bash
# 1. Granite 설정
npm install @apps-in-toss/granite

# 2. granite.config.ts 생성
cat > granite.config.ts << 'EOF'
import { defineConfig } from '@apps-in-toss/granite';

export default defineConfig({
  appName: 'Albi',
  icon: './assets/icon.png',
  brand: {
    color: '#4F46E5',
    name: 'Albi',
    icon: './assets/icon.png'
  },
});
EOF

# 3. 빌드
npm run build:toss
# 결과: AlbiApp.ait 파일 생성
```

### 4.3 Android 프로덕션 빌드

```bash
# 1. 서명 키 생성
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore albi-release.keystore -alias albi-key -keyalg RSA -keysize 2048 -validity 10000

# 2. gradle.properties에 키 정보 추가
cat >> android/gradle.properties << 'EOF'
MYAPP_RELEASE_STORE_FILE=albi-release.keystore
MYAPP_RELEASE_KEY_ALIAS=albi-key
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password
EOF

# 3. AAB 빌드
cd android
./gradlew bundleRelease
# 결과: android/app/build/outputs/bundle/release/app-release.aab
```

### 4.4 iOS 프로덕션 빌드 (macOS만)

```bash
# 1. Xcode에서 빌드
cd ios
open AlbiApp.xcworkspace

# 2. Xcode 메뉴
# - Product → Archive
# - Distribute App → App Store Connect
```

---

## 5. 트러블슈팅

### 5.1 iOS 빌드 에러

**에러**: `Command PhaseScriptExecution failed`
```bash
# 해결: 캐시 정리
cd ios
pod deintegrate
pod install
cd ..
npm start -- --reset-cache
```

### 5.2 Android 빌드 에러

**에러**: `Could not resolve all files for configuration`
```bash
# 해결: Gradle 캐시 정리
cd android
./gradlew clean
cd ..
```

### 5.3 Metro Bundler 에러

```bash
# 캐시 정리 및 재시작
npm start -- --reset-cache
rm -rf /tmp/metro-*
```

---

**문서 작성 완료!**
