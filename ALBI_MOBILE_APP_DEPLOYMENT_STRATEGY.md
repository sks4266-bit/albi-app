# 🚀 Albi 모바일 앱 - 멀티플랫폼 배포 전략

## 📋 문서 개요

**프로젝트**: Albi 모바일 앱 (React Native)  
**작성일**: 2026-03-09  
**버전**: 1.0  
**대상 플랫폼**: Toss Apps-in-Toss, Google Play Store, Apple App Store

---

## 🎯 배포 전략 개요

### 3단계 순차 배포 전략

```
Phase 1 (1주차)              Phase 2 (2주차)           Phase 3 (3주차)
┌──────────────────┐         ┌──────────────┐         ┌──────────────┐
│  Toss 앱인토스      │   →    │ Google Play  │   →    │  App Store   │
│  (무료, 최우선)     │         │  ($25)       │         │  ($99/년)    │
└──────────────────┘         └──────────────┘         └──────────────┘
      ↓                             ↓                       ↓
  사용자 피드백 수집            Android 사용자 확보       iOS 사용자 확보
  빠른 버그 수정               결제 전환 테스트          프리미엄 사용자 확보
```

**왜 순차 배포인가?**
1. **리스크 분산**: 한 번에 3개 플랫폼 동시 출시 시 버그 대응 어려움
2. **빠른 피드백**: Toss에서 사용자 반응 확인 후 개선
3. **비용 절감**: Toss 먼저 출시하고 반응 보고 유료 플랫폼 진출
4. **품질 보장**: 각 플랫폼별 최적화 시간 확보

---

## 📱 플랫폼별 배포 가이드

## 1️⃣ Toss Apps-in-Toss 배포

### 1.1 사전 준비

#### 필수 계정 및 도구
- [ ] Toss 개발자 계정 (https://console-apps-in-toss.toss.im/)
- [ ] Workspace 생성 (무료)
- [ ] AIT CLI 설치: `npm install -g @ait/cli`

#### 필수 파일
- [ ] `granite.config.ts` - Granite SDK 설정
- [ ] 앱 아이콘 (600x600 PNG)
- [ ] 스크린샷 (최소 2개)

### 1.2 Granite 설정

```typescript
// toss/granite.config.ts
import { defineConfig } from '@toss/granite';

export default defineConfig({
  // 앱 기본 정보
  appName: 'Albi',
  appId: 'kr.albi.app',
  version: '1.0.0',
  description: 'AI 기반 취업 준비 All-in-One 플랫폼',
  
  // 브랜드 정보
  brand: {
    name: 'Albi',
    icon: './assets/icon-600x600.png',
    color: '#6366F1', // 인디고 블루
  },
  
  // 권한 요청
  permissions: [
    'camera',              // 카메라 접근
    'push-notifications',  // 푸시 알림
    'biometrics',          // 생체 인증
  ],
  
  // 딥링크 설정
  deepLinks: [
    {
      scheme: 'albi',
      host: 'screen',
      paths: [
        '/mentor-chat',
        '/interview',
        '/payment',
        '/profile'
      ]
    }
  ],
  
  // WebView 허용 도메인
  webview: {
    allowedDomains: [
      'https://albi.kr',
      'https://*.albi.kr'
    ]
  },
  
  // 토스 로그인 연동 (선택)
  tossLogin: {
    enabled: true,
    scopes: ['USER_NAME', 'USER_EMAIL', 'USER_PHONE']
  }
});
```

### 1.3 빌드 프로세스

```bash
# 1. 의존성 설치
npm install

# 2. Toss용 빌드 (네이티브 코드 컴파일)
npm run build:toss

# 3. .ait 번들 생성
npx ait build

# 출력: dist/albi-1.0.0.ait (약 10-30 MB)
```

**빌드 스크립트 (package.json)**:
```json
{
  "scripts": {
    "build:toss": "react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res && npx ait build"
  }
}
```

### 1.4 Toss 콘솔 업로드

#### 방법 1: 콘솔 UI 업로드 (추천)
1. https://console-apps-in-toss.toss.im/ 접속
2. **Workspace** → **앱 만들기**
3. **앱 정보 입력**:
   - 앱 이름: Albi
   - 카테고리: 비즈니스 / 교육
   - 설명: AI 기반 취업 준비 All-in-One 플랫폼
   - 앱 아이콘: 600x600 PNG 업로드
4. **버전 등록**:
   - 버전: 1.0.0
   - 파일: `albi-1.0.0.ait` 업로드
   - 변경사항: 최초 출시
5. **스크린샷 업로드** (최소 2개, 540x720 이상)
6. **테스트 계정 제공** (선택)
7. **심사 제출**

#### 방법 2: CLI 업로드 (CI/CD용)
```bash
# API 키 설정
npx ait token add <workspace-name> <API-KEY>

# 앱 배포
npx ait deploy

# 또는 API 키 직접 사용
npx ait deploy --api-key <API-KEY>
```

### 1.5 테스트 및 QR 코드

- **테스트 URL**: `intoss-private://appsintoss?_deploymentId=<deployment-id>`
- **QR 코드**: Toss 콘솔에서 자동 생성
- **테스트 요구사항**:
  - Toss 앱 설치 (최신 버전)
  - Workspace 멤버로 추가
  - 만 19세 이상

### 1.6 심사 및 출시

- **심사 기간**: 1-3일
- **심사 기준**:
  - 앱 아이콘 및 브랜드 정보 명확
  - 권한 요청 이유 명시
  - WebView 도메인 화이트리스트 확인
  - 테스트 가능 여부
- **출시 후**: Toss 앱 내 검색 노출

---

## 2️⃣ Google Play Store 배포

### 2.1 사전 준비

#### 필수 계정 및 비용
- [ ] Google Play Console 계정 (https://play.google.com/console/)
- [ ] 개발자 등록 비용: **$25 (₩34,000, 평생)**
- [ ] 본인 인증: 신분증, 주소지 확인

#### 필수 파일
- [ ] 앱 서명 키 (`.jks` 파일)
- [ ] AAB 번들 (Android App Bundle)
- [ ] 스크린샷 (최소 2개, 최대 8개)
- [ ] 앱 아이콘 512x512 PNG
- [ ] 개인정보 처리방침 URL

### 2.2 서명 키 생성

```bash
# 1. JDK 설치 확인
java -version

# 2. 서명 키 생성
keytool -genkey -v -keystore albi-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias albi-release

# 입력 정보:
# - 키스토어 비밀번호 (저장 필수!)
# - 이름, 조직, 도시, 국가 등

# 3. 키 정보 확인
keytool -list -v -keystore albi-release-key.jks
```

**⚠️ 중요**: 키스토어 파일과 비밀번호는 절대 잃어버리면 안 됨! (업데이트 불가)

### 2.3 Gradle 서명 설정

```gradle
// android/app/build.gradle
android {
    ...
    
    signingConfigs {
        release {
            if (project.hasProperty('ALBI_RELEASE_STORE_FILE')) {
                storeFile file(ALBI_RELEASE_STORE_FILE)
                storePassword ALBI_RELEASE_STORE_PASSWORD
                keyAlias ALBI_RELEASE_KEY_ALIAS
                keyPassword ALBI_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**gradle.properties**:
```properties
ALBI_RELEASE_STORE_FILE=albi-release-key.jks
ALBI_RELEASE_KEY_ALIAS=albi-release
ALBI_RELEASE_STORE_PASSWORD=your_keystore_password
ALBI_RELEASE_KEY_PASSWORD=your_key_password
```

### 2.4 AAB 번들 생성

```bash
# 1. Android 디렉토리로 이동
cd android

# 2. 번들 생성
./gradlew bundleRelease

# 출력 경로:
# android/app/build/outputs/bundle/release/app-release.aab

# 3. 번들 크기 확인
ls -lh app/build/outputs/bundle/release/app-release.aab
# 목표: < 50 MB
```

### 2.5 Google Play Console 설정

#### Step 1: 앱 생성
1. https://play.google.com/console/ 접속
2. **모든 앱** → **앱 만들기**
3. 앱 정보 입력:
   - 앱 이름: Albi - AI 취업 준비
   - 기본 언어: 한국어
   - 앱 또는 게임: 앱
   - 무료 또는 유료: 무료
   - 개발자 프로그램 정책 동의

#### Step 2: 앱 정보 설정

**대시보드 → 앱 콘텐츠**

1. **개인정보 처리방침**:
   - URL: `https://albi.kr/privacy.html`
   - (웹사이트에 개인정보 처리방침 페이지 생성 필요)

2. **앱 액세스 권한**:
   - 모든 기능 액세스 가능: 예
   - 또는 테스트 계정 제공

3. **광고**:
   - 앱에 광고 포함 여부: 아니요

4. **콘텐츠 등급**:
   - 설문 작성 (교육 앱으로 설정)

5. **타겟층 및 콘텐츠**:
   - 타겟 연령: 18세 이상
   - 앱 카테고리: 비즈니스 / 교육

#### Step 3: 스토어 등록정보

1. **앱 세부정보**:
   - 짧은 설명 (80자 이하):
     ```
     AI 멘토와 함께하는 취업 준비! 면접 연습부터 포트폴리오까지 All-in-One
     ```
   
   - 전체 설명 (4,000자 이하):
     ```
     🎯 Albi - AI 기반 취업 준비 플랫폼

     ✨ 주요 기능
     • AI 면접 연습: 실전처럼 연습하고 즉시 피드백
     • 24시간 AI 멘토: 취업 고민 상담 및 코칭
     • 문서 교정: 이력서, 자기소개서 AI 첨삭
     • 포트폴리오 관리: 체계적인 경력 관리
     • 성장 트래킹: 데이터 기반 진도 확인

     💰 요금제
     • 월 ₩4,900 (하루 ₩163)
     • 무제한 AI 멘토 채팅
     • 무제한 면접 연습
     • 7일 무료 체험

     📞 문의: albi260128@gmail.com
     🌐 웹사이트: https://albi.kr
     ```

2. **앱 아이콘**:
   - 512x512 PNG (32비트, 투명 배경 금지)

3. **스크린샷**:
   - 최소 2개, 최대 8개
   - 권장 크기: 1080x1920 (세로) 또는 1920x1080 (가로)
   - 스마트폰 및 태블릿용 각각 업로드

4. **그래픽 이미지** (선택):
   - 기능 그래픽: 1024x500 PNG

#### Step 4: 프로덕션 출시 설정

1. **대시보드** → **프로덕션** → **새 버전 만들기**
2. **App Bundle 업로드**:
   - `app-release.aab` 파일 업로드
3. **버전 정보**:
   - 버전 이름: 1.0.0
   - 버전 코드: 1
   - 변경사항:
     ```
     • 최초 출시
     • AI 면접 연습 기능
     • 24시간 AI 멘토
     • 문서 교정
     • 포트폴리오 관리
     ```
4. **출시 노트** 작성 (각 언어별)

#### Step 5: 심사 제출

1. **검토 요약** 확인
2. **프로덕션으로 출시** 버튼 클릭
3. 심사 대기 (보통 1-3일)

### 2.6 심사 및 출시

- **심사 기간**: 1-3일 (첫 심사는 최대 1주일)
- **심사 기준**:
  - 앱 설명과 실제 기능 일치
  - 개인정보 처리방침 명시
  - 스크린샷 품질
  - 앱 안정성 (크래시 없음)
- **출시 후**: Google Play에서 즉시 다운로드 가능
- **업데이트**: AAB 업로드만 하면 됨 (재심사 불필요, 자동 배포)

---

## 3️⃣ Apple App Store 배포

### 3.1 사전 준비

#### 필수 계정 및 비용
- [ ] Apple Developer Program 가입 ($99/년, ₩135,000)
- [ ] Mac 컴퓨터 (Xcode는 Mac 전용)
- [ ] App Store Connect 계정

#### 필수 도구
- [ ] Xcode 15+ (Mac App Store에서 무료 다운로드)
- [ ] CocoaPods 설치: `sudo gem install cocoapods`

#### 필수 파일
- [ ] 앱 아이콘 (1024x1024 PNG)
- [ ] 스크린샷 (필수, 다양한 디바이스)
- [ ] 개인정보 처리방침 URL
- [ ] 지원 URL (고객센터)

### 3.2 Apple Developer Program 가입

1. https://developer.apple.com/programs/ 접속
2. **Enroll** 클릭
3. Apple ID로 로그인
4. 결제 정보 입력 ($99/년)
5. 승인 대기 (보통 1-2일)

### 3.3 App ID 생성

1. https://developer.apple.com/account/ 접속
2. **Certificates, IDs & Profiles**
3. **Identifiers** → **+** 버튼
4. App ID 등록:
   - Description: Albi
   - Bundle ID: `kr.albi.app` (Explicit)
   - Capabilities 선택:
     - Push Notifications
     - Associated Domains (딥링크)
     - Sign in with Apple (선택)

### 3.4 Xcode 프로젝트 설정

```bash
# 1. CocoaPods 설치 (필수 의존성)
cd ios
pod install

# 2. Xcode 열기
open AlbiApp.xcworkspace
```

**Xcode 설정**:
1. **General** 탭:
   - Display Name: Albi
   - Bundle Identifier: kr.albi.app
   - Version: 1.0.0
   - Build: 1
   
2. **Signing & Capabilities** 탭:
   - Team: (Apple Developer Team 선택)
   - Automatically manage signing: ✅
   - Push Notifications 추가
   - Associated Domains 추가 (딥링크용)

3. **Info** 탭:
   - 권한 설명 추가:
     ```xml
     <key>NSCameraUsageDescription</key>
     <string>프로필 사진 촬영을 위해 카메라 접근이 필요합니다</string>
     
     <key>NSPhotoLibraryUsageDescription</key>
     <string>프로필 사진 선택을 위해 갤러리 접근이 필요합니다</string>
     
     <key>NSUserTrackingUsageDescription</key>
     <string>더 나은 서비스 제공을 위해 데이터 수집에 동의해주세요</string>
     ```

### 3.5 Archive 생성 및 업로드

```bash
# 1. 스키마 선택: AlbiApp (Release)
# 2. 디바이스 선택: Any iOS Device (arm64)

# Xcode 메뉴:
# Product → Archive

# Archive 완료 후 Organizer 창 표시
# → Distribute App 클릭
# → App Store Connect 선택
# → Upload
# → Automatically manage signing
# → Upload
```

**또는 커맨드 라인으로 업로드**:
```bash
# Archive 생성
xcodebuild -workspace ios/AlbiApp.xcworkspace \
  -scheme AlbiApp \
  -configuration Release \
  -archivePath ios/build/AlbiApp.xcarchive \
  archive

# App Store 업로드
xcodebuild -exportArchive \
  -archivePath ios/build/AlbiApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ios/build
```

### 3.6 App Store Connect 설정

#### Step 1: 앱 생성
1. https://appstoreconnect.apple.com/ 접속
2. **나의 앱** → **+** → **새로운 앱**
3. 앱 정보:
   - 플랫폼: iOS
   - 이름: Albi - AI 취업 준비
   - 기본 언어: 한국어
   - 번들 ID: kr.albi.app
   - SKU: kr.albi.app.1

#### Step 2: 앱 정보

1. **카테고리**:
   - 주 카테고리: 비즈니스
   - 보조 카테고리: 교육

2. **개인정보 보호**:
   - 개인정보 처리방침 URL: `https://albi.kr/privacy.html`

3. **연령 등급**:
   - 설문 작성 (교육 앱, 17세 이상 권장)

#### Step 3: 스크린샷

**필수 디바이스**:
- iPhone 6.7" (iPhone 15 Pro Max): 1290x2796
- iPhone 6.5" (iPhone 14 Pro Max): 1284x2778
- iPad Pro 12.9": 2048x2732

**스크린샷 생성 도구**:
```bash
# Simulator에서 스크린샷 촬영
# Cmd + S (스크린샷 저장)

# 또는 온라인 도구:
# https://www.appstorescreenshots.com/
```

#### Step 4: 앱 설명

**부제목** (30자 이하):
```
AI 멘토와 함께하는 취업 준비
```

**설명** (4,000자 이하):
```
🎯 Albi - AI 기반 취업 준비 플랫폼

당신의 취업 성공을 위한 All-in-One 솔루션!

✨ 주요 기능

📝 AI 면접 연습
• 실전처럼 연습하고 즉시 피드백
• 직무별 맞춤 질문
• S/A/B/C/D 등급 자동 평가

🤖 24시간 AI 멘토
• 무제한 1:1 상담
• 텍스트 + 음성 지원
• 취업 고민 즉시 해결

📄 AI 문서 교정
• 이력서, 자기소개서 AI 첨삭
• 맞춤법, 문법 자동 교정
• 실시간 통계 및 피드백

📂 포트폴리오 관리
• 이력서, 프로젝트 체계적 관리
• AI 리뷰 시스템 (0-100점)
• 버전 관리 자동 추적

📊 성장 트래킹
• 면접 통계 및 점수 추이
• 7일간 활동 데이터
• AI 멘토 사용 통계

💰 합리적인 가격
• 월 ₩4,900 (하루 ₩163, 커피 한 잔 값)
• 7일 무료 체험
• 언제든 해지 가능

🌟 Albi만의 차별점
• 음성 멘토링 지원
• 자연스러운 AI 대화 (GPT-5 기반)
• 데이터 기반 성장 추적
• 빠른 응답 속도 (Cloudflare Edge)

📞 문의 및 지원
• 이메일: albi260128@gmail.com
• 웹사이트: https://albi.kr
• 개인정보 처리방침: https://albi.kr/privacy.html

지금 Albi와 함께 취업 성공의 첫 걸음을 시작하세요! 🚀
```

**키워드** (100자 이하, 쉼표 구분):
```
취업,면접,AI,멘토,이력서,자기소개서,포트폴리오,알바,아르바이트,취준,구직,채용,코칭
```

#### Step 5: 빌드 선택 및 제출

1. **빌드** 섹션에서 업로드한 빌드 선택
2. **테스트 정보** 입력:
   - 로그인 필요 여부: 예
   - 데모 계정: 이메일/비밀번호 제공
3. **연락처 정보** 입력
4. **심사 노트** 작성:
   ```
   • 최초 출시입니다
   • 앱 주요 기능: AI 면접 연습, AI 멘토 상담, 문서 교정, 포트폴리오 관리
   • 구독 결제 시스템 포함 (월 ₩4,900)
   • 7일 무료 체험 제공
   • 테스트 계정으로 모든 기능 확인 가능합니다
   ```
5. **심사 제출** 클릭

### 3.7 심사 및 출시

- **심사 기간**: 2-5일 (보통 48시간 이내)
- **심사 기준**:
  - 앱 설명과 실제 기능 일치
  - 개인정보 처리방침 명시
  - 스크린샷 품질 및 정확성
  - 앱 안정성 (크래시 없음)
  - UI 가이드라인 준수
  - WebView 사용 정당성 (네이티브 UI 충분히 구현)
- **거절 시 대응**:
  - 리뷰어 피드백 확인
  - 문제 수정 후 재제출
  - Resolution Center에서 항소 가능
- **승인 후**:
  - 즉시 출시 또는 예약 출시 선택
  - App Store에서 다운로드 가능

---

## 📊 배포 일정 및 마일스톤

### 전체 타임라인 (3주)

```
Week 1                    Week 2                    Week 3
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Toss 앱인토스     │      │ Google Play     │      │ App Store       │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ Day 1-2:        │      │ Day 8-9:        │      │ Day 15-16:      │
│ • Granite 설정  │      │ • 서명 키 생성   │      │ • Xcode 설정    │
│ • .ait 빌드     │      │ • AAB 번들 생성  │      │ • Archive 생성  │
│                 │      │ • 콘솔 앱 생성   │      │ • 업로드        │
│ Day 3-4:        │      │                 │      │                 │
│ • 콘솔 업로드    │      │ Day 10-11:      │      │ Day 17-18:      │
│ • 스크린샷 준비  │      │ • 스토어 등록    │      │ • 스크린샷 준비  │
│ • 심사 제출      │      │ • 스크린샷 업로드│      │ • 앱 정보 입력   │
│                 │      │ • 심사 제출      │      │ • 심사 제출      │
│ Day 5-7:        │      │                 │      │                 │
│ • 심사 대기      │      │ Day 12-14:      │      │ Day 19-21:      │
│ • 출시 준비      │      │ • 심사 대기      │      │ • 심사 대기      │
│ • 피드백 수집    │      │ • 출시          │      │ • 출시          │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 주요 마일스톤

| 마일스톤 | 날짜 | 설명 |
|---------|------|------|
| **M1: Toss 빌드 완료** | Week 1 Day 2 | .ait 파일 생성 완료 |
| **M2: Toss 심사 제출** | Week 1 Day 4 | Toss 콘솔 제출 완료 |
| **M3: Toss 출시** | Week 1 Day 7 | 첫 번째 플랫폼 출시 |
| **M4: Android 빌드 완료** | Week 2 Day 9 | AAB 번들 생성 완료 |
| **M5: Google Play 심사 제출** | Week 2 Day 11 | 콘솔 제출 완료 |
| **M6: Google Play 출시** | Week 2 Day 14 | 두 번째 플랫폼 출시 |
| **M7: iOS 빌드 완료** | Week 3 Day 16 | Archive 업로드 완료 |
| **M8: App Store 심사 제출** | Week 3 Day 18 | 콘솔 제출 완료 |
| **M9: App Store 출시** | Week 3 Day 21 | 세 번째 플랫폼 출시 ✅ |

---

## 🔍 심사 통과 전략

### 공통 체크리스트

#### 앱 품질
- [ ] 크래시 없음 (안정성 테스트)
- [ ] 로딩 시간 < 3초
- [ ] 모든 기능 정상 작동
- [ ] 네트워크 오류 핸들링
- [ ] 권한 요청 시 명확한 설명

#### 콘텐츠
- [ ] 앱 설명과 실제 기능 일치
- [ ] 스크린샷 고품질 (블러, 워터마크 금지)
- [ ] 개인정보 처리방침 링크 유효
- [ ] 저작권 위반 콘텐츠 없음

#### 디자인
- [ ] UI/UX 일관성
- [ ] 반응형 레이아웃
- [ ] 다크 모드 지원 (권장)
- [ ] 접근성 지원 (VoiceOver, TalkBack)

### Toss Apps-in-Toss 특화 체크리스트

- [ ] Granite SDK 올바르게 통합
- [ ] 허용 도메인 화이트리스트 정확
- [ ] 권한 요청 최소화
- [ ] 토스 로그인 연동 (선택)
- [ ] 딥링크 정상 작동

### Google Play 특화 체크리스트

- [ ] 타겟 API Level 33+ (Android 13)
- [ ] 64비트 아키텍처 지원
- [ ] Google Play 정책 준수 (콘텐츠, 광고 등)
- [ ] 앱 서명 키 안전하게 보관
- [ ] ProGuard 난독화 적용

### Apple App Store 특화 체크리스트

- [ ] Human Interface Guidelines 준수
- [ ] iOS 13+ 지원
- [ ] WebView 사용 최소화 (50% 미만)
- [ ] 네이티브 UI 충분히 구현
- [ ] Sign in with Apple 추가 (로그인 있는 경우 권장)
- [ ] 앱 추적 투명성 (ATT) 권한 요청

---

## 🛠️ CI/CD 자동화

### GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Multi-Platform Deploy

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy-toss:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build for Toss
        run: npm run build:toss
      
      - name: Deploy to Toss
        run: npx ait deploy --api-key ${{ secrets.TOSS_API_KEY }}

  deploy-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Build Android AAB
        run: |
          cd android
          ./gradlew bundleRelease
      
      - name: Upload to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: kr.albi.app
          releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
          track: production

  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: '15.2'
      
      - name: Install CocoaPods
        run: |
          cd ios
          pod install
      
      - name: Build iOS Archive
        run: |
          xcodebuild -workspace ios/AlbiApp.xcworkspace \
            -scheme AlbiApp \
            -configuration Release \
            -archivePath ios/build/AlbiApp.xcarchive \
            archive
      
      - name: Upload to App Store
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: ios/build/AlbiApp.ipa
          issuer-id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          api-key-id: ${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}
          api-private-key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}
```

---

## 📞 문제 해결 가이드

### Toss Apps-in-Toss

**문제**: .ait 빌드 실패
- **해결**: `npx ait doctor` 실행하여 환경 확인
- **해결**: Node.js 버전 18+ 확인

**문제**: 심사 거절 (WebView 도메인 미허용)
- **해결**: `granite.config.ts`에서 `webview.allowedDomains` 확인

### Google Play Store

**문제**: AAB 업로드 실패 (서명 오류)
- **해결**: 서명 키 경로 및 비밀번호 확인
- **해결**: `gradle.properties` 파일 확인

**문제**: 심사 거절 (타겟 API Level 낮음)
- **해결**: `android/app/build.gradle`에서 `targetSdkVersion` 33+ 설정

### Apple App Store

**문제**: Archive 업로드 실패
- **해결**: Xcode에서 Team 및 Signing 설정 확인
- **해결**: Apple Developer Program 가입 확인

**문제**: 심사 거절 (4.2 Minimum Functionality)
- **해결**: 네이티브 UI 비율 증가 (50% 이상)
- **해결**: WebView 사용 정당성 설명 (Resolution Center)

---

## 📊 배포 후 모니터링

### KPI 추적

| 지표 | 목표 | 측정 도구 |
|-----|------|----------|
| 총 다운로드 수 | 1,000+ (1개월) | 각 플랫폼 콘솔 |
| 활성 사용자 (DAU) | 100+ (1개월) | Firebase Analytics |
| 구독 전환율 | 5%+ | 백엔드 API 로그 |
| 앱 평점 | 4.5+ (5점 만점) | 플랫폼 리뷰 |
| 크래시율 | < 1% | Firebase Crashlytics |
| 평균 세션 시간 | 10분+ | Firebase Analytics |

### A/B 테스트 계획

- **Toss vs Google Play vs App Store**: 플랫폼별 전환율 비교
- **온보딩 플로우**: 3가지 버전 테스트
- **구독 가격**: ₩4,900 vs ₩6,900 vs ₩9,900

---

## 🎉 성공 체크리스트

### 최종 배포 전

- [ ] 3개 플랫폼 빌드 모두 성공
- [ ] 모든 스크린샷 준비 완료
- [ ] 개인정보 처리방침 페이지 생성
- [ ] 테스트 계정 준비
- [ ] 앱 설명 작성 완료
- [ ] 백엔드 API 프로덕션 준비

### 배포 후

- [ ] Toss 앱인토스 출시 ✅
- [ ] Google Play Store 출시 ✅
- [ ] Apple App Store 출시 ✅
- [ ] 사용자 피드백 수집 시작
- [ ] Firebase Analytics 대시보드 설정
- [ ] 푸시 알림 테스트
- [ ] 정기 업데이트 계획 수립

---

**작성일**: 2026-03-09  
**버전**: 1.0  
**다음 문서**: 개발 로드맵 (ALBI_MOBILE_APP_DEVELOPMENT_ROADMAP.md)

**🚀 3개 플랫폼 동시 출시 성공을 기원합니다!**
