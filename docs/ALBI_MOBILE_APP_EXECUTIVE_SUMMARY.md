# Albi 모바일 앱 프로젝트 - 실행 계획서

## 📋 프로젝트 개요

**목표**: Albi 웹 서비스를 React Native 기반 모바일 앱으로 확장하여 3개 플랫폼 동시 출시

| 항목 | 내용 |
|------|------|
| **플랫폼** | 토스 앱인토스, 구글 플레이, 애플 앱스토어 |
| **기술 스택** | React Native + TypeScript + WebView 하이브리드 |
| **개발 기간** | 6-10주 |
| **예산** | $124 (첫해), 이후 $99/년 |

---

## 🎯 핵심 전략

### 하이브리드 아키텍처

```
┌─────────────────────────────────┐
│   네이티브 화면 (React Native)   │
│  - 로그인/회원가입              │
│  - 메인 대시보드                │
│  - 알림 센터                    │
│  - 설정                        │
└─────────────────────────────────┘
              ↕
┌─────────────────────────────────┐
│     WebView (기존 웹 재사용)     │
│  - 채팅 (albi.kr/chat)         │
│  - 멘토 채팅                    │
│  - 결제                        │
│  - 기타 복잡한 기능             │
└─────────────────────────────────┘
```

**장점**:
- ✅ 기존 웹 코드 90% 재사용
- ✅ 빠른 개발 (6-10주)
- ✅ 앱스토어 심사 통과 (충분한 네이티브 기능)
- ✅ 3개 플랫폼 단일 코드베이스

---

## 📅 10주 개발 일정

| Week | Phase | 주요 작업 | 산출물 |
|------|-------|----------|--------|
| **1** | 환경 설정 | React Native 프로젝트 생성, 라이브러리 설치 | 실행 가능한 기본 앱 |
| **2-4** | 네이티브 화면 | 로그인, 메인, 프로필, 설정 화면 개발 | 네이티브 화면 완성 |
| **5-6** | WebView 통합 | WebView 설정, Native↔Web 통신 구현 | 웹 기능 통합 완료 |
| **7-8** | 네이티브 기능 | 푸시 알림, 생체 인증, 카메라 연동 | 네이티브 기능 완성 |
| **9** | 토스 앱인토스 | .ait 빌드, 콘솔 업로드, 심사 제출 | 토스 앱 출시 |
| **10** | 안드로이드/iOS | AAB/IPA 빌드, 스토어 등록 | 3개 플랫폼 출시 |

---

## 💰 비용 명세

### 개발 비용
- **인력**: 내부 개발자 1명 (10주)
- **외주 디자인**: 앱 아이콘, 스플래시 (선택)

### 플랫폼 비용

| 플랫폼 | 비용 | 주기 | 혜택 |
|--------|------|------|------|
| 토스 앱인토스 | **무료** | - | 3,000만 사용자 즉시 노출 |
| 구글 플레이 | $25 | 1회 | 안드로이드 사용자 |
| 애플 앱스토어 | $99 | 연간 | iOS 사용자 |
| **첫해 총비용** | **$124** | - | 약 17만원 |

### 연간 유지비
- 애플 개발자 계정: $99/년
- Firebase (푸시 알림): 무료
- 백엔드 (Cloudflare): 기존 비용 유지

---

## 🛠️ 기술 스택 요약

### 코어
- **React Native** 0.73+ (크로스플랫폼)
- **TypeScript** (타입 안정성)
- **React Navigation** (화면 전환)

### 네이티브 기능
- **react-native-webview**: 웹 콘텐츠 표시
- **@react-native-firebase/messaging**: 푸시 알림
- **react-native-biometrics**: 생체 인증
- **@react-native-async-storage**: 로컬 저장소

### UI/UX
- **React Native Paper**: Material Design 컴포넌트
- **react-native-vector-icons**: 아이콘

### 개발 도구
- **Flipper**: 디버깅
- **ESLint + Prettier**: 코드 품질

---

## 📱 화면 구성

### 네이티브 화면 (7개)
1. **Splash Screen** - 앱 시작 화면
2. **Login Screen** - 로그인/소셜 로그인
3. **Signup Screen** - 회원가입
4. **Home Screen** - 메인 대시보드
5. **Notifications Screen** - 알림 목록
6. **My Page Screen** - 마이페이지
7. **Settings Screen** - 설정

### WebView 화면 (5개)
1. **Chat** - `https://albi.kr/chat`
2. **Mentor Chat** - `https://albi.kr/mentor-chat`
3. **Payment** - `https://albi.kr/payment`
4. **Jobs** - `https://albi.kr/jobs`
5. **기타** - 복잡한 기능들

---

## 🔐 보안 및 성능

### 보안
- ✅ HTTPS only 통신
- ✅ 토큰 암호화 저장 (AsyncStorage)
- ✅ 생체 인증 옵션
- ✅ SSL Pinning (주요 API)

### 성능
- ✅ WebView 캐싱
- ✅ 이미지 최적화 (WebP)
- ✅ FlatList 가상화
- ✅ React.memo 활용

---

## ✅ 성공 기준

### 기술 목표
- [ ] 3개 플랫폼 동시 출시
- [ ] 앱 용량 < 50MB (Android)
- [ ] 앱 시작 시간 < 3초
- [ ] 크래시 발생률 < 1%

### 비즈니스 목표
- [ ] 토스 앱인토스 심사 통과
- [ ] 구글 플레이 심사 통과
- [ ] 애플 앱스토어 심사 통과
- [ ] 월 활성 사용자 1,000명 (3개월 내)
- [ ] 앱 평점 4.5+ 유지

---

## 🚀 즉시 시작 가능한 작업

### 1단계: 환경 설정 (1-2일)
```bash
# Node.js, Android Studio, Xcode 설치
# React Native CLI 설치
npx react-native@latest init AlbiApp --template react-native-template-typescript
```

### 2단계: 필수 라이브러리 설치 (1일)
```bash
npm install @react-navigation/native react-native-webview axios zustand
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-biometrics @react-native-async-storage/async-storage
```

### 3단계: 기본 화면 개발 (1주)
- 로그인 화면
- 메인 화면
- WebView 컴포넌트

### 4단계: 웹 연동 (3일)
- WebView로 albi.kr 로드
- 토큰 주입
- Native↔Web 통신 테스트

---

## 📚 관련 문서

1. **아키텍처 설계서**: `/home/user/webapp/docs/ALBI_MOBILE_APP_ARCHITECTURE.md`
   - 전체 시스템 구조
   - 화면 설계
   - 데이터 흐름

2. **개발 가이드**: `/home/user/webapp/docs/ALBI_MOBILE_APP_DEVELOPMENT_GUIDE.md`
   - 환경 설정 방법
   - 코드 예시
   - 빌드 및 배포

3. **기존 웹 문서**:
   - README.md
   - TOSS_APPINTOSS_SETUP.md
   - E2E_TEST_GUIDE.md

---

## 🤔 자주 묻는 질문

### Q1. WebView 앱은 앱스토어 심사를 통과할 수 있나요?
**A**: 순수 WebView만 있으면 리젝될 가능성이 높지만, 우리는 **핵심 화면을 네이티브로 개발**하고 복잡한 기능만 WebView로 처리하므로 문제없습니다.

### Q2. React Native가 처음인데 어려울까요?
**A**: React 경험이 있다면 **1-2주면 충분히 습득 가능**합니다. 문법이 거의 동일하며, 이 문서의 예시 코드를 따라하면 됩니다.

### Q3. 기존 웹 코드를 수정해야 하나요?
**A**: **거의 수정 필요 없습니다**. 네이티브 앱인지 확인하는 코드 몇 줄만 추가하면 됩니다.
```javascript
// 웹 측 (albi.kr)
if (window.ReactNativeWebView) {
  // 네이티브 앱에서 실행 중
  const token = window.appInfo.token;
}
```

### Q4. 3개 플랫폼을 모두 출시해야 하나요?
**A**: 아닙니다! **토스 앱인토스 먼저 출시**(무료)하고, 반응을 보며 구글 플레이/앱스토어를 순차적으로 출시할 수 있습니다.

### Q5. 개발 기간이 정말 6-10주면 가능한가요?
**A**: 네! 핵심 화면만 네이티브로 개발하고 나머지는 WebView를 사용하므로 **빠르게 개발 가능**합니다. 순수 네이티브 개발 대비 **50% 이상 시간 단축**됩니다.

---

## 📞 다음 단계

### 즉시 시작하려면:
1. **개발 환경 설정** - Node.js, Android Studio (또는 Xcode) 설치
2. **프로젝트 생성** - `npx react-native init AlbiApp`
3. **문서 참고** - `ALBI_MOBILE_APP_DEVELOPMENT_GUIDE.md` 따라하기

### 추가 질문이 있다면:
- 아키텍처 상세 설계 검토
- 특정 기능 구현 방법
- 플랫폼별 배포 가이드
- 예산 및 일정 조정

---

**준비되었습니다! 언제든지 시작할 수 있습니다.** 🚀
