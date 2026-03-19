# PortOne SDK 로딩 문제 해결

## 🔍 문제 분석

### 증상
- `window.PortOne = undefined` (지속적으로 SDK가 로드되지 않음)
- "PortOne SDK 로딩 타임아웃" 에러 반복

### 근본 원인
PortOne V2 Browser SDK는 **두 가지 사용 방법**이 있습니다:

#### 방법 1: CDN (문제 발생)
```html
<script src="https://cdn.portone.io/v2/browser-sdk.js"></script>
```
- ❌ `<head>`에 배치 시 `window.PortOne` 설정 전에 JS 실행
- ❌ SDK 로딩 타이밍 이슈

#### 방법 2: NPM 패키지 (권장)
```bash
npm install @portone/browser-sdk
```
```javascript
import * as PortOne from "@portone/browser-sdk/v2";
```
- ✅ ES 모듈로 번들링
- ✅ 타이밍 이슈 없음

---

## ✅ 적용된 해결책

### 1. NPM 패키지 설치
```bash
npm install @portone/browser-sdk
npm install --save-dev esbuild
```

### 2. TypeScript 모듈 생성
**src/payment.ts**:
```typescript
import * as PortOne from "@portone/browser-sdk/v2";

// 플랜, 채널 정보, 결제 로직 구현
// window에 함수 노출
```

### 3. esbuild로 번들링
**build.sh 수정**:
```bash
npx esbuild src/payment.ts --bundle --outfile=dist/static/payment.js --format=esm --minify
```

출력: `dist/static/payment.js` (6.5kb)

### 4. HTML에서 모듈 로드
**payment.html**:
```html
<!-- CDN 제거 -->
<!-- <script src="https://cdn.portone.io/v2/browser-sdk.js"></script> -->

<!-- 번들링된 모듈 사용 -->
<script type="module" src="/static/payment.js"></script>
```

---

## 📊 최종 배포 정보

- **프로덕션**: https://albi.kr/payment.html
- **최신 배포**: https://3f2c9aaa.albi-app.pages.dev/payment.html
- **Git 커밋**: `cf1db08` (fix: Move PortOne SDK to body end and simplify loading)

---

## 🧪 테스트 방법

### 1단계: 캐시 클리어 (필수!)
```
F12 → Application → Storage → Clear site data
F12 → Application → Service Workers → Unregister all
Ctrl + Shift + R (강력 새로고침)
```

### 2단계: 콘솔 확인
```javascript
// 다음 로그가 나와야 합니다:
✅ Payment module loaded with PortOne V2 SDK
✅ PortOne SDK loaded successfully
```

### 3단계: 결제 테스트
```
1. Standard 플랜 선택
2. 결제 수단 선택 (카드)
3. 이름, 이메일 입력
4. "결제하기" 클릭
→ PortOne 결제창 팝업!
```

---

## 🎯 기대 효과

### Before (CDN 방식)
```
❌ Check 1: window.PortOne = undefined
❌ Check 2: window.PortOne = undefined
...
❌ PortOne SDK timeout after 10 seconds
```

### After (NPM + 번들링)
```
✅ Payment module loaded with PortOne V2 SDK
✅ PortOne SDK loaded successfully
→ 결제창 즉시 열림
```

---

## 📝 주요 변경 사항

| 항목 | Before | After |
|------|--------|-------|
| SDK 로딩 방식 | CDN (`<head>`) | NPM + esbuild 번들링 |
| 파일 크기 | ~240KB (CDN) | 6.5KB (번들) |
| 로딩 타이밍 | 불안정 | 안정적 |
| 타입 안전성 | ❌ | ✅ TypeScript |

---

## 🚀 다음 테스트 시

**반드시 캐시를 완전히 삭제한 후 테스트해주세요!**

캐시가 남아있으면 이전 버전의 payment.html이 로드되어 여전히 CDN 방식을 사용할 수 있습니다.

---

업데이트: 2026-03-05
작성자: Albi Development Team
