# 카카오 공유 설정 가이드

## 📋 개요
직무적성 테스트 결과를 카카오톡으로 공유하기 위한 설정 가이드입니다.

## 🔑 현재 설정

### JavaScript 키
```javascript
// public/static/config.js
KAKAO_JAVASCRIPT_KEY: 'b69e30d2c21d6db82408ee9a2091d293'
```

**참고**: 이 키는 현재 카카오 맵 API와 동일한 키를 사용하고 있습니다.

## ⚙️ 카카오 개발자 콘솔 설정

### 1. 카카오 개발자 콘솔 접속
```
https://developers.kakao.com
```

### 2. 애플리케이션 선택
- 내 애플리케이션 → 기존 앱 선택
- 또는 새로운 앱 생성

### 3. 플랫폼 설정
**앱 설정 → 플랫폼 → Web 플랫폼 등록**

**필수 등록 도메인**:
```
https://albi.kr
https://www.albi.kr
https://albi-app.pages.dev
https://985116ee.albi-app.pages.dev
http://localhost:3000 (개발용)
```

### 4. JavaScript 키 확인
**앱 설정 → 앱 키 → JavaScript 키**

현재 설정된 키: `b69e30d2c21d6db82408ee9a2091d293`

### 5. 카카오톡 공유 설정
**제품 설정 → 카카오 로그인 → 활성화 설정 → ON**

**Redirect URI 등록** (필요시):
```
https://albi.kr/auth-callback.html
https://albi-app.pages.dev/auth-callback.html
```

### 6. 도메인 등록 확인
**앱 설정 → 플랫폼 → Web**

등록된 도메인:
- ✅ `https://albi.kr`
- ✅ `https://albi-app.pages.dev`

## 🧪 테스트 방법

### 1. 브라우저 콘솔 확인
```javascript
// F12 → Console
Kakao.isInitialized()  // true여야 함

// 초기화 로그 확인
'✅ 카카오 SDK 초기화 완료: b69e30d2c2...'
```

### 2. 공유 버튼 클릭
```
결과 페이지 → "카카오톡 공유" 버튼 클릭
→ 카카오톡 공유 팝업 표시
→ 친구 선택 → 전송
```

### 3. 에러 발생 시
```javascript
// 브라우저 콘솔 에러 확인
'❌ 카카오 SDK 초기화 실패: ...'
'⚠️ Kakao SDK 또는 ALBI_CONFIG를 찾을 수 없습니다.'
```

## 🔧 문제 해결

### ⚠️ 현재 상태 (2026-02-24)
**카카오톡 공유 기능이 작동하지 않습니다.**

**원인**: Kakao Developers 콘솔에서 다음 설정이 완료되지 않았습니다:
1. ❌ 앱 JavaScript 키 활성화
2. ❌ Web 플랫폼 도메인 등록
3. ❌ 카카오톡 공유 기능 활성화

**임시 해결책**: 
- **"링크 복사" 버튼**을 사용해주세요!
- 복사된 링크를 카카오톡 채팅방에 직접 붙여넣기하면 됩니다.

### 문제 1: SDK 초기화 실패
**증상**: `Kakao.isInitialized()` → `false`

**원인**:
- JavaScript 키가 등록되지 않음
- 또는 잘못된 키 사용

**해결**:
1. **Kakao Developers 콘솔 접속**: https://developers.kakao.com
2. **내 애플리케이션** 선택 (또는 새로 만들기)
3. **앱 설정 → 앱 키 → JavaScript 키** 복사
4. `public/static/config.js` 수정:
```javascript
KAKAO_JAVASCRIPT_KEY: '복사한_JavaScript_키'
```
5. 저장 후 재배포

**확인 방법**:
```javascript
// 브라우저 콘솔 (F12)
console.log(Kakao.isInitialized()); // true 나와야 함
```

### 문제 2: 도메인 등록 에러
**증상**: `Platform validation failed` 또는 `domain not registered`

**원인**:
- 현재 도메인이 Kakao 앱에 등록되지 않음

**해결**:
1. **Kakao Developers 콘솔** → 앱 설정 → **플랫폼**
2. **Web 플랫폼 등록** 클릭
3. **다음 도메인 모두 추가**:
```
https://albi.kr
https://www.albi.kr
https://albi-app.pages.dev
http://localhost:3000
```
4. 저장 후 5~10분 대기 (반영 시간 필요)

**확인 방법**:
- 플랫폼 설정에서 등록된 도메인 목록 확인
- 브라우저에서 공유 버튼 클릭해보기

### 문제 3: 이미지가 표시되지 않음
**증상**: 공유 시 이미지 없음 또는 깨짐

**원인**:
- SVG 이미지는 일부 플랫폼에서 지원 안 됨
- 또는 이미지 URL 접근 불가

**해결**:
1. **PNG 이미지 사용** (권장):
```javascript
// config.js
DEFAULT_OG_IMAGE: 'https://albi.kr/static/images/job-test-og.png'
```

2. **이미지 크기 확인**:
- 권장 크기: 1200x630 (Open Graph 표준)
- 최대 크기: 5MB

3. **이미지 접근 테스트**:
```bash
curl -I https://albi.kr/static/images/job-test-og.png
# HTTP/1.1 200 OK 나와야 함
```

### 문제 4: "카카오톡 공유 기능을 사용할 수 없습니다" 에러
**증상**: 버튼 클릭 시 alert 메시지

**원인**:
- Kakao SDK가 로드되지 않음
- 네트워크 문제 또는 CDN 차단

**해결**:
1. 브라우저 콘솔 확인:
```javascript
typeof Kakao !== 'undefined'  // true여야 함
```

2. HTML에서 SDK 로드 확인:
```html
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"></script>
```

3. 네트워크 탭에서 kakao.min.js 로드 실패 확인

### 문제 5: 디버깅 로그가 안 보임
**원인**: 콘솔 로그가 숨겨짐

**해결**:
```javascript
// 브라우저 콘솔 (F12)
// 1. 모든 로그 보기
localStorage.setItem('debug', 'true');

// 2. Kakao 초기화 상태 확인
console.log('Kakao:', typeof Kakao !== 'undefined' ? '로드됨' : '로드 안 됨');
console.log('초기화:', Kakao.isInitialized());
console.log('ALBI_CONFIG:', ALBI_CONFIG);

// 3. testData 확인
console.log('testData:', testData);
console.log('testResult:', testResult);
```

## 📱 공유 콘텐츠 구성

### 기본 정보
```javascript
{
    title: '나는 전략형! 🎯',
    description: '큰 그림을 보고 장기적 계획을 수립하는 전략가',
    imageUrl: 'https://albi.kr/static/images/job-test-og.svg',
    link: {
        mobileWebUrl: 'https://albi.kr/job-test.html',
        webUrl: 'https://albi.kr/job-test.html'
    }
}
```

### 버튼
```javascript
buttons: [
    {
        title: '나도 테스트하기',
        link: {
            mobileWebUrl: 'https://albi.kr/job-test.html',
            webUrl: 'https://albi.kr/job-test.html'
        }
    }
]
```

## 🎨 OG 이미지

### 현재 이미지
- **경로**: `/public/static/images/job-test-og.svg`
- **크기**: 1200x630 (Open Graph 표준)
- **형식**: SVG (PNG 변환 권장)

### PNG 변환 방법

#### 온라인 변환:
1. https://cloudconvert.com/svg-to-png
2. job-test-og.svg 업로드
3. 크기: 1200x630 유지
4. 다운로드 → `job-test-og.png`로 저장
5. `/public/static/images/` 경로에 업로드

#### 명령줄 변환 (ImageMagick):
```bash
convert public/static/images/job-test-og.svg \
  -resize 1200x630 \
  public/static/images/job-test-og.png
```

## 📝 설정 파일 구조

```
webapp/
├── public/
│   ├── static/
│   │   ├── config.js              # 앱 설정 (카카오 키 포함)
│   │   ├── job-test-result.js     # 공유 로직
│   │   └── images/
│   │       ├── job-test-og.svg    # OG 이미지 (SVG)
│   │       └── job-test-og.png    # OG 이미지 (PNG, 권장)
│   └── job-test-result.html       # 결과 페이지
└── KAKAO_SETUP.md                 # 이 파일
```

## 🔒 보안 주의사항

### JavaScript 키 공개
- JavaScript 키는 **프론트엔드에 노출**되어도 안전합니다
- REST API 키와 달리 브라우저에서 사용하도록 설계됨
- 도메인 제한으로 보안 유지

### 민감한 키 관리
- **Admin 키**, **REST API 키**는 절대 프론트엔드에 노출하지 말 것
- 서버 환경 변수로 관리
- `.gitignore`에 추가

## 📞 문의

### 카카오 개발자 지원
- 공식 문서: https://developers.kakao.com/docs
- 이메일: devtalk@kakao.com

### 알비 지원
- 이메일: albi260128@gmail.com
- 전화: 010-4459-4226

## ✅ 체크리스트

배포 전 확인사항:

- [ ] 카카오 개발자 콘솔에서 앱 생성
- [ ] JavaScript 키 발급 및 복사
- [ ] `config.js`에 키 설정
- [ ] Web 플랫폼에 도메인 등록
- [ ] 카카오톡 공유 활성화
- [ ] OG 이미지 PNG 변환 및 업로드
- [ ] 브라우저에서 공유 테스트
- [ ] 모바일에서 공유 테스트

## 🚀 배포 URL

- **Production**: https://albi.kr
- **Latest**: https://985116ee.albi-app.pages.dev
- **Test Page**: https://albi.kr/job-test.html
- **Result Page**: https://albi.kr/job-test-result.html
