# 📱 Albi 모바일 앱 배포 가이드

## 🎯 개요

현재 Albi는 **Cloudflare Pages 기반 웹 애플리케이션**입니다. 모바일 앱으로 배포하는 방법은 크게 3가지가 있습니다:

1. **PWA (Progressive Web App)** - 가장 빠르고 간단 ⚡
2. **Capacitor (Ionic)** - 웹 → 네이티브 앱 변환 🔄
3. **React Native / Flutter** - 완전한 네이티브 앱 재작성 🏗️

---

## 방법 1: PWA (Progressive Web App) ⚡ **추천!**

### 📋 특징
- **장점**:
  - ✅ 가장 빠르고 간단한 방법 (1-2시간)
  - ✅ 기존 코드 거의 그대로 사용
  - ✅ 설치 불필요 (홈 화면에 추가)
  - ✅ 자동 업데이트
  - ✅ 오프라인 지원 가능
  - ✅ 푸시 알림 지원
  - ✅ 앱스토어 수수료 없음

- **단점**:
  - ❌ 앱스토어/구글 플레이 등록 불가
  - ❌ 네이티브 기능 제한적 (카메라, GPS 등)
  - ❌ iOS Safari 일부 기능 제한

### 🚀 구현 단계

#### 1단계: manifest.json 생성

**public/manifest.json**:
```json
{
  "name": "Albi - AI 취업 멘토",
  "short_name": "Albi",
  "description": "AI 기반 취업 준비 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#6366F1",
  "theme_color": "#6366F1",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/static/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/static/screenshots/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png"
    },
    {
      "src": "/static/screenshots/screenshot2.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "categories": ["business", "productivity", "education"],
  "shortcuts": [
    {
      "name": "AI 면접 연습",
      "short_name": "면접",
      "description": "AI와 함께 면접 연습하기",
      "url": "/chat",
      "icons": [{ "src": "/static/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "AI 멘토",
      "short_name": "멘토",
      "description": "AI 멘토와 상담하기",
      "url": "/mentor-chat.html",
      "icons": [{ "src": "/static/icons/icon-192x192.png", "sizes": "192x192" }]
    }
  ]
}
```

#### 2단계: Service Worker 생성

**public/service-worker.js**:
```javascript
const CACHE_NAME = 'albi-v1.0.0';
const URLS_TO_CACHE = [
  '/',
  '/chat',
  '/mentor-chat.html',
  '/payment.html',
  '/static/app.js',
  '/static/styles.css'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

// Fetch 이벤트 (네트워크 우선 전략)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// 활성화 이벤트 (구 캐시 삭제)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

#### 3단계: HTML에 메타 태그 추가

모든 HTML 파일의 `<head>` 섹션에 추가:

```html
<!-- PWA 설정 -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#6366F1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Albi">
<link rel="apple-touch-icon" href="/static/icons/icon-192x192.png">

<!-- Service Worker 등록 -->
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('✅ Service Worker registered'))
      .catch(err => console.error('❌ SW registration failed:', err));
  });
}
</script>
```

#### 4단계: 아이콘 생성

**필요한 아이콘 크기**:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**자동 생성 도구**:
```bash
# PWA Asset Generator 사용
npx @vite-pwa/assets-generator --preset minimal public/logo.png
```

또는 온라인 도구:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

#### 5단계: 설치 프롬프트 추가

**public/static/pwa-install.js**:
```javascript
let deferredPrompt;

// 설치 프롬프트 이벤트 캡처
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // 설치 버튼 표시
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
    
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
      }
    });
  }
});

// 설치 완료 이벤트
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA가 설치되었습니다!');
  deferredPrompt = null;
});
```

#### 6단계: 배포
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name albi-app
```

### 📱 사용자 설치 방법

#### Android (Chrome)
1. https://albi.kr 접속
2. 주소창 옆 "앱 설치" 아이콘 클릭
3. 홈 화면에 추가

#### iOS (Safari)
1. https://albi.kr 접속
2. 공유 버튼 (사각형 화살표) 클릭
3. "홈 화면에 추가" 선택

---

## 방법 2: Capacitor (Ionic) 🔄

### 📋 특징
- **장점**:
  - ✅ 기존 웹 코드 재사용 (90%+)
  - ✅ **앱스토어/구글플레이 등록 가능** 🎯
  - ✅ 네이티브 플러그인 사용 가능
  - ✅ 푸시 알림, 카메라, GPS 등 완전 지원
  - ✅ TypeScript 지원

- **단점**:
  - ⚠️ 앱스토어 개발자 계정 필요 ($99/년 - iOS, $25/평생 - Android)
  - ⚠️ 앱스토어 심사 필요 (1-3일)
  - ⚠️ Xcode(Mac) / Android Studio 필요

### 🚀 구현 단계

#### 1단계: Capacitor 설치
```bash
cd /home/user/webapp

# Capacitor 설치
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Capacitor 초기화
npx cap init
# App name: Albi
# App ID: kr.albi.app
# Web asset directory: dist
```

#### 2단계: capacitor.config.json 설정
```json
{
  "appId": "kr.albi.app",
  "appName": "Albi",
  "webDir": "dist",
  "server": {
    "url": "https://albi.kr",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#6366F1",
      "showSpinner": true,
      "androidSpinnerStyle": "large",
      "spinnerColor": "#FFFFFF"
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

#### 3단계: 플랫폼 추가
```bash
# Android 추가
npx cap add android

# iOS 추가 (Mac에서만 가능)
npx cap add ios
```

#### 4단계: 빌드 및 동기화
```bash
# 웹 앱 빌드
npm run build

# Capacitor 동기화
npx cap sync

# Android Studio로 열기
npx cap open android

# Xcode로 열기 (Mac)
npx cap open ios
```

#### 5단계: 네이티브 플러그인 추가 (선택)

```bash
# 푸시 알림
npm install @capacitor/push-notifications

# 카메라
npm install @capacitor/camera

# 파일 시스템
npm install @capacitor/filesystem

# 위치 정보
npm install @capacitor/geolocation

# 공유 기능
npm install @capacitor/share

# 앱 업데이트
npm install @capawesome/capacitor-live-update
```

#### 6단계: Android 빌드

**Android Studio에서**:
1. `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 또는 서명된 번들 생성: `Build` → `Generate Signed Bundle / APK`

**커맨드 라인**:
```bash
cd android
./gradlew assembleDebug  # 개발용 APK
./gradlew bundleRelease  # 출시용 AAB (Google Play)
```

#### 7단계: iOS 빌드

**Xcode에서**:
1. Product → Archive
2. Distribute App → App Store Connect
3. App Store Connect에서 심사 제출

**필수 요구사항**:
- Apple Developer Program 가입 ($99/년)
- Mac 컴퓨터 (Xcode는 Mac 전용)

---

## 방법 3: React Native / Flutter 🏗️

### 📋 특징
- **장점**:
  - ✅ 완전한 네이티브 성능
  - ✅ 모든 네이티브 API 접근
  - ✅ 최고의 사용자 경험

- **단점**:
  - ❌ **완전 재작성 필요** (2-3개월 소요)
  - ❌ 개발 비용 높음
  - ❌ 유지보수 복잡성 증가

**권장하지 않음** - 현재 웹 앱이 잘 작동하므로 불필요합니다.

---

## 🎯 Albi에 최적화된 방법: PWA → Capacitor 단계적 접근

### Phase 1: PWA 구현 (1-2시간) ⚡
**즉시 시작 가능**:
1. `manifest.json` 생성
2. Service Worker 추가
3. 아이콘 생성
4. 메타 태그 추가
5. 배포

**결과**: 사용자가 홈 화면에 추가하여 앱처럼 사용 가능

### Phase 2: Capacitor 전환 (1-2일) 🔄
**앱스토어 등록이 필요할 때**:
1. Capacitor 설치
2. 플랫폼 추가 (Android/iOS)
3. 네이티브 플러그인 통합
4. 앱스토어 제출

**결과**: Google Play / App Store에서 다운로드 가능

---

## 📦 PWA 구현 상세 가이드

### 1. 프로젝트 구조
```
webapp/
├── public/
│   ├── manifest.json          # PWA 설정 파일
│   ├── service-worker.js      # 오프라인 지원
│   ├── static/
│   │   ├── icons/             # 앱 아이콘 (여러 크기)
│   │   │   ├── icon-72x72.png
│   │   │   ├── icon-96x96.png
│   │   │   ├── icon-128x128.png
│   │   │   ├── icon-144x144.png
│   │   │   ├── icon-152x152.png
│   │   │   ├── icon-192x192.png
│   │   │   ├── icon-384x384.png
│   │   │   └── icon-512x512.png
│   │   ├── screenshots/       # 스토어용 스크린샷
│   │   └── pwa-install.js     # 설치 프롬프트
│   ├── index.html             # PWA 메타 태그 추가
│   └── ...
```

### 2. 모든 HTML 파일에 추가할 코드

**`<head>` 섹션에 추가**:
```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="#6366F1">

<!-- iOS 설정 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Albi">
<link rel="apple-touch-icon" href="/static/icons/icon-192x192.png">

<!-- Android 설정 -->
<meta name="mobile-web-app-capable" content="yes">

<!-- Splash Screen (선택) -->
<link rel="apple-touch-startup-image" href="/static/splash/splash-640x1136.png">
```

**`</body>` 전에 추가**:
```html
<!-- Service Worker 등록 -->
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}
</script>

<!-- PWA 설치 프롬프트 -->
<script src="/static/pwa-install.js"></script>
```

### 3. 설치 버튼 추가

**index.html의 헤더에 추가**:
```html
<button id="pwa-install-btn" style="display: none;" 
        class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
    <i class="fas fa-download mr-2"></i>앱 설치
</button>
```

### 4. 아이콘 생성 스크립트

**generate-icons.sh**:
```bash
#!/bin/bash

# 원본 로고 (512x512 이상 권장)
LOGO="public/logo.png"

# 출력 디렉토리
ICON_DIR="public/static/icons"
mkdir -p "$ICON_DIR"

# 다양한 크기로 리사이즈
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  convert "$LOGO" -resize ${size}x${size} "$ICON_DIR/icon-${size}x${size}.png"
  echo "✅ Created icon-${size}x${size}.png"
done

echo "🎉 All icons generated!"
```

**ImageMagick 없을 경우 온라인 도구 사용**:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

### 5. 배포 및 테스트

```bash
# PWA 파일 추가
cd /home/user/webapp
git add public/manifest.json public/service-worker.js public/static/icons/
git commit -m "feat: Add PWA support with manifest and service worker"

# 빌드 및 배포
npm run build
npx wrangler pages deploy dist --project-name albi-app
```

**테스트**:
1. Chrome DevTools → Application → Manifest 확인
2. Lighthouse 점수 확인 (PWA 100점 목표)
3. 모바일에서 "홈 화면에 추가" 테스트

---

## 📱 앱스토어 등록 가이드 (Capacitor 사용)

### Google Play Store 등록

#### 1단계: 개발자 계정 생성
- **비용**: $25 (평생)
- **URL**: https://play.google.com/console/signup

#### 2단계: 앱 번들 생성
```bash
cd android
./gradlew bundleRelease

# 출력: android/app/build/outputs/bundle/release/app-release.aab
```

#### 3단계: 서명 키 생성
```bash
keytool -genkey -v -keystore albi-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias albi-release
```

#### 4단계: 앱 정보 입력
- **앱 이름**: Albi - AI 취업 멘토
- **카테고리**: 비즈니스 / 교육
- **설명**: 500자 이내로 작성
- **스크린샷**: 최소 2개 (540x720 이상)
- **아이콘**: 512x512 PNG

#### 5단계: 심사 제출
- 보통 **1-3일** 소요
- 첫 심사가 가장 오래 걸림

### Apple App Store 등록

#### 1단계: Apple Developer Program 가입
- **비용**: $99/년
- **URL**: https://developer.apple.com/programs/

#### 2단계: App Store Connect 설정
1. https://appstoreconnect.apple.com 접속
2. "나의 앱" → "+" → "새로운 앱"
3. 앱 정보 입력

#### 3단계: Xcode에서 빌드
```bash
# Capacitor 동기화
npx cap sync ios

# Xcode 열기
npx cap open ios
```

**Xcode에서**:
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload

#### 4단계: App Store Connect에서 제출
- 스크린샷 업로드 (필수)
- 앱 설명 작성
- 개인정보 처리방침 URL 제공
- 심사 제출

#### 5단계: 심사 대기
- 보통 **1-3일** 소요
- iOS 심사가 더 까다로움

---

## 📊 방법별 비교

| 항목 | PWA | Capacitor | React Native |
|------|-----|-----------|--------------|
| **개발 시간** | 1-2시간 | 1-2일 | 2-3개월 |
| **비용** | 무료 | $124 (iOS $99 + Android $25) | $124 + 개발 비용 |
| **기존 코드 재사용** | 100% | 95% | 10-20% |
| **앱스토어 등록** | ❌ | ✅ | ✅ |
| **네이티브 기능** | 제한적 | 풍부 | 완전 |
| **성능** | 좋음 | 좋음 | 최고 |
| **업데이트** | 즉시 | 심사 필요 | 심사 필요 |
| **푸시 알림** | 제한적 | 완전 지원 | 완전 지원 |
| **오프라인** | 가능 | 가능 | 가능 |

---

## 🎯 Albi 프로젝트 추천 방법

### 즉시 시작: PWA ⚡ **강력 추천!**

**이유**:
1. ✅ **1-2시간만에 구현 가능**
2. ✅ 기존 코드 그대로 사용
3. ✅ 비용 없음
4. ✅ 즉시 배포 가능
5. ✅ 대부분의 모바일 사용자에게 충분

**PWA로 시작 → 사용자 반응 보고 → 필요시 Capacitor로 전환**

### 향후 계획: Capacitor 전환 (선택)

**다음과 같은 경우에만 고려**:
- [ ] 앱스토어 등록이 필수일 때
- [ ] 푸시 알림이 핵심 기능일 때
- [ ] 네이티브 카메라/GPS 기능이 필요할 때
- [ ] 오프라인 사용이 중요할 때
- [ ] 브랜드 인지도를 위해 앱스토어 노출 필요

---

## 🚀 PWA 구현 체크리스트

### 필수 파일 생성
- [ ] `public/manifest.json` - PWA 설정
- [ ] `public/service-worker.js` - 오프라인 지원
- [ ] `public/static/icons/` - 앱 아이콘 (8개 크기)
- [ ] `public/static/pwa-install.js` - 설치 프롬프트

### HTML 파일 수정
- [ ] `index.html` - PWA 메타 태그 추가
- [ ] `chat.html` - PWA 메타 태그 추가
- [ ] `mentor-chat.html` - PWA 메타 태그 추가
- [ ] `payment.html` - PWA 메타 태그 추가

### 아이콘 생성
- [ ] 원본 로고 준비 (512x512 PNG)
- [ ] 8개 크기 아이콘 생성
- [ ] Apple Touch Icon 생성

### 배포 및 테스트
- [ ] 빌드 (`npm run build`)
- [ ] Cloudflare Pages 배포
- [ ] Lighthouse PWA 점수 확인 (목표: 90+)
- [ ] Android Chrome에서 설치 테스트
- [ ] iOS Safari에서 "홈 화면에 추가" 테스트

---

## 🔧 PWA 구현 자동화 스크립트

### setup-pwa.sh
```bash
#!/bin/bash

echo "🚀 Setting up PWA for Albi..."

# 1. 디렉토리 생성
mkdir -p public/static/icons
mkdir -p public/static/screenshots

# 2. manifest.json 생성
cat > public/manifest.json << 'EOF'
{
  "name": "Albi - AI 취업 멘토",
  "short_name": "Albi",
  "description": "AI 기반 취업 준비 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#6366F1",
  "theme_color": "#6366F1",
  "icons": [
    { "src": "/static/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/static/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
EOF

# 3. Service Worker 생성
cat > public/service-worker.js << 'EOF'
const CACHE_NAME = 'albi-v1.0.0';
const URLS_TO_CACHE = ['/', '/chat', '/mentor-chat.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
EOF

# 4. PWA 설치 스크립트 생성
cat > public/static/pwa-install.js << 'EOF'
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'block';
});
EOF

echo "✅ PWA setup complete!"
echo "📝 Next steps:"
echo "   1. 아이콘 생성 (public/static/icons/)"
echo "   2. HTML 파일에 메타 태그 추가"
echo "   3. npm run build && deploy"
```

### 실행 방법
```bash
cd /home/user/webapp
chmod +x setup-pwa.sh
./setup-pwa.sh
```

---

## 🧪 PWA 테스트 도구

### Chrome DevTools
```
F12 → Application 탭
├── Manifest - manifest.json 확인
├── Service Workers - 등록 상태 확인
└── Storage - 캐시 확인
```

### Lighthouse 점수
```
F12 → Lighthouse 탭 → Generate report
목표: PWA 점수 90+ / 100
```

### 온라인 PWA 테스트
- https://www.pwabuilder.com/ (PWA 점수 + 개선사항)
- https://web.dev/measure/ (성능 + PWA 분석)

---

## 💰 비용 비교

### PWA
- **개발 비용**: 무료 (1-2시간 작업)
- **호스팅**: 무료 (Cloudflare Pages)
- **유지보수**: 무료
- **앱스토어 수수료**: 없음
- **총 비용**: **₩0**

### Capacitor + 앱스토어
- **개발 비용**: ₩500,000 ~ ₩2,000,000 (외주 시)
- **iOS 개발자 계정**: $99/년 (₩135,000)
- **Android 개발자 계정**: $25 (평생) (₩34,000)
- **Mac 필요** (iOS 빌드): ₩1,500,000+
- **앱스토어 수수료**: 매출의 15-30%
- **총 비용**: **₩2,000,000 ~ ₩5,000,000**

### React Native (완전 재작성)
- **개발 비용**: ₩10,000,000 ~ ₩30,000,000
- **개발 기간**: 2-3개월
- **앱스토어 등록**: 위와 동일
- **총 비용**: **₩10,000,000+**

---

## 🎯 실행 계획

### 즉시 실행: PWA 구현 (오늘)

```bash
# 1. PWA 파일 생성
cd /home/user/webapp
./setup-pwa.sh

# 2. 아이콘 생성
# 온라인 도구 사용: https://www.pwabuilder.com/imageGenerator
# 로고 업로드 → 다운로드 → public/static/icons/ 에 복사

# 3. HTML 파일 업데이트
# index.html, chat.html, mentor-chat.html 등에 PWA 메타 태그 추가

# 4. 빌드 및 배포
npm run build
npx wrangler pages deploy dist --project-name albi-app

# 5. 테스트
# - Chrome DevTools → Application → Manifest 확인
# - Lighthouse 점수 확인
# - 모바일에서 "홈 화면에 추가" 테스트
```

### 향후 고려: Capacitor 전환 (필요 시)

**조건**:
- 사용자가 앱스토어에서 찾기를 원할 때
- 푸시 알림이 필수 기능이 될 때
- 예산 확보됐을 때 (최소 ₩200만원)

---

## 📚 참고 자료

### PWA
- https://web.dev/progressive-web-apps/
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

### Capacitor
- https://capacitorjs.com/docs
- https://capacitorjs.com/docs/getting-started

### 앱스토어 가이드
- **Google Play**: https://support.google.com/googleplay/android-developer/
- **App Store**: https://developer.apple.com/app-store/review/guidelines/

---

## ✅ 추천 실행 순서

1. **Phase 1 (오늘)**: PWA 구현 ⚡
   - manifest.json 생성
   - Service Worker 추가
   - 아이콘 생성
   - 배포 및 테스트

2. **Phase 2 (사용자 반응 확인 후)**: 앱스토어 등록 고려
   - 사용자 피드백 수집
   - 앱스토어 필요성 판단
   - 예산 확보
   - Capacitor 전환

3. **Phase 3 (장기)**: 네이티브 기능 추가
   - 푸시 알림
   - 카메라 통합
   - GPS 기반 공고 추천

---

**작성일**: 2026-03-04  
**버전**: 1.0  
**현재 상태**: 웹 앱 (Cloudflare Pages)  
**다음 단계**: PWA 구현 권장  
**예상 작업 시간**: 1-2시간  
**비용**: 무료
