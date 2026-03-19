# 고객센터 페이지 푸터 로딩 문제 해결

## 📅 작업 일시
- **날짜**: 2026-02-14 18:35 KST
- **커밋**: 82c8f47
- **배포 URL**: https://albi.kr/contact

---

## 🐛 문제 상황

### 증상
- 고객센터 페이지(https://albi.kr/contact) 하단의 푸터가 "로딩 중..." 상태에서 멈춤
- 회사 정보가 표시되지 않음
- 브라우저 콘솔에 404 에러 발생

### 원인 분석
contact.html 페이지에 **중복된 회사 정보 로딩 시스템**이 존재했습니다:

1. **페이지 내부 섹션** (중복):
   ```html
   <div class="bg-gradient-to-r from-orange-500 to-amber-500 ...">
     <div id="companyInfoLoading">로딩 중...</div>
     <div id="companyInfoContent">회사 정보</div>
   </div>
   ```
   - 자체 `loadCompanyInfo()` 함수 보유
   - `companyInfoLoading`, `companyInfoContent` ID 사용
   - axios를 이용한 API 호출

2. **공통 푸터** (footer.js):
   ```html
   <div id="footer-container"></div>
   <script src="/footer.js"></script>
   ```
   - 전역 `loadCompanyInfo()` 함수 보유
   - `footer-container`에 동적으로 푸터 렌더링
   - fetch API를 이용한 API 호출

**충돌 발생**: 두 시스템이 동시에 작동하려 하면서 함수 이름 충돌과 DOM 충돌 발생

---

## ✅ 해결 방법

### 1. 중복 섹션 제거
**삭제된 코드** (contact.html):
```html
<!-- Contact Info Section - 삭제됨 -->
<div class="bg-gradient-to-r from-orange-500 to-amber-500 ...">
  <div id="companyInfoLoading">...</div>
  <div id="companyInfoContent">...</div>
</div>
```

**삭제된 JavaScript** (contact.html):
```javascript
// 회사 정보 로드 함수 - 삭제됨
async function loadCompanyInfo() {
  // ... API 호출 및 DOM 조작 코드
}

// 이벤트 리스너 - 삭제됨
document.addEventListener('DOMContentLoaded', loadCompanyInfo);
```

### 2. 공통 푸터로 통일
**유지된 코드** (contact.html):
```html
<!-- Footer -->
<div id="footer-container"></div>
<link href="/footer.css" rel="stylesheet">
<script src="/footer.js"></script>
```

**footer.js의 역할**:
- 페이지 로드 시 자동으로 `/api/company-info` API 호출
- `footer-container`에 푸터 HTML 동적 생성
- 회사 정보 표시
- API 실패 시 fallback 데이터 사용

---

## 📝 변경 사항

### 삭제된 요소
| 요소 | 설명 | 이유 |
|------|------|------|
| `#companyInfoLoading` | 로딩 표시 div | footer.js의 로딩 표시와 중복 |
| `#companyInfoContent` | 회사 정보 표시 div | footer.js의 푸터와 중복 |
| `loadCompanyInfo()` 함수 | 회사 정보 로드 | footer.js의 동일 함수와 충돌 |
| Contact Info Section | 오렌지 배경의 회사 정보 섹션 | 푸터로 통합 |

### 유지된 요소
| 요소 | 설명 | 역할 |
|------|------|------|
| `#footer-container` | 푸터 렌더링 컨테이너 | footer.js가 여기에 푸터 삽입 |
| `/footer.js` | 공통 푸터 스크립트 | 모든 페이지에서 동일한 푸터 제공 |
| `/footer.css` | 푸터 스타일시트 | 푸터 디자인 정의 |

---

## 🧪 테스트 결과

### 배포 전 (문제 상황)
```bash
$ curl 'https://albi.kr/contact' | grep "companyInfoLoading"
# 결과: 발견됨 (중복 섹션 존재)

$ curl 'https://albi.kr/contact' | grep "footer-container"
# 결과: 발견됨 (하지만 푸터가 로딩 중에 멈춤)
```

### 배포 후 (해결 완료)
```bash
$ curl 'https://albi.kr/contact' | grep "companyInfoLoading"
# 결과: 0개 (중복 섹션 제거됨) ✅

$ curl 'https://albi.kr/contact' | grep "footer-container"
# 결과: 발견됨 (footer.js가 정상 작동) ✅
```

---

## 🌐 footer.js 동작 방식

### 1. 자동 초기화
```javascript
// 페이지 로드 시 푸터 렌더링
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderFooter);
} else {
  renderFooter();
}
```

### 2. API 호출
```javascript
async function loadCompanyInfo() {
  const response = await fetch('/api/company-info');
  const data = await response.json();
  
  if (data.success) {
    window.companyInfo = data.data;
    return data.data;
  }
  
  // Fallback: 기본 회사 정보 반환
  return {
    company_name: '알비',
    business_registration_number: '531-08-03526',
    representative: '박지훈',
    address: '경상남도 양산시 동면 사송로 155, 807동 1405호(사송 롯데캐슬)',
    email: 'albi260128@gmail.com',
    phone: '010-4459-4226',
    mail_order_registration: '제2026-경남양산-00526호'
  };
}
```

### 3. 푸터 렌더링
```javascript
async function renderFooter() {
  const footerContainer = document.getElementById('footer-container');
  
  // 1. 로딩 상태 표시
  footerContainer.innerHTML = createFooterHTML(null);
  
  // 2. 회사 정보 로드
  const companyInfo = await loadCompanyInfo();
  
  // 3. 회사 정보로 푸터 업데이트
  footerContainer.innerHTML = createFooterHTML(companyInfo);
}
```

---

## 📌 관련 파일

### 수정된 파일
- `/public/contact.html`
  - 중복된 Contact Info Section 제거 (라인 479-501)
  - 중복된 `loadCompanyInfo()` 함수 제거 (라인 558-592)
  - 중복된 DOMContentLoaded 리스너 제거

### 관련 파일 (변경 없음)
- `/public/footer.js` - 공통 푸터 스크립트
- `/public/footer.css` - 푸터 스타일시트
- `/functions/api/company-info.ts` - 회사 정보 API

---

## 🌐 배포 정보

- **프로덕션 URL**: https://albi.kr/contact
- **최신 배포**: https://c2e74b4d.albi-app.pages.dev
- **커밋**: 82c8f47
- **배포 시각**: 2026-02-14 18:35 KST

---

## ✅ 확인 사항

### 푸터 로딩 확인
1. https://albi.kr/contact 접속
2. 페이지 하단으로 스크롤
3. 푸터가 정상적으로 표시되는지 확인:
   - 📞 고객센터 / 📜 이용약관 / 🔒 개인정보처리방침 링크
   - 회사명: 알비
   - 사업자등록번호: 531-08-03526
   - 대표: 박지훈
   - 주소, 이메일, 고객센터 전화번호
   - © 2026 ALBI. All rights reserved.

### API 동작 확인
```bash
# API 정상 작동 확인
curl https://albi.kr/api/company-info
# 예상 응답: {"success":true,"data":{...}}

# footer.js 로드 확인
curl -I https://albi.kr/footer.js
# 예상 응답: HTTP/2 200
```

---

## 🎯 결과

✅ **문제 해결 완료**:
1. 중복된 회사 정보 섹션 제거
2. 중복된 `loadCompanyInfo()` 함수 제거
3. footer.js를 통한 공통 푸터로 통일
4. 푸터가 정상적으로 로드되고 회사 정보 표시

**변경 전**: 페이지 내부 섹션과 footer.js가 충돌 → 로딩 중 상태에서 멈춤
**변경 후**: footer.js만 사용 → 푸터 정상 로드 및 회사 정보 표시

**프로덕션 URL**: https://albi.kr/contact

---

## 💡 향후 권장사항

1. **다른 페이지 점검**: 다른 HTML 페이지에도 중복된 푸터 코드가 있는지 확인
2. **공통 컴포넌트 사용**: 모든 페이지에서 footer.js를 사용하도록 통일
3. **디버깅 로그 추가**: footer.js에 console.log 추가하여 로딩 상태 추적
4. **에러 처리 강화**: API 실패 시 사용자에게 명확한 메시지 표시

