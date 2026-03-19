# 전자계약서 페이지 업데이트

## ✅ 완료된 개선사항

### 1. 전자서명 기능 구현
- **Canvas 기반 서명 패드**
  - 근로자 서명 캔버스
  - 사업주 서명 캔버스
  - 실시간 그리기 기능

- **마우스 & 터치 지원**
  - 데스크톱: 마우스 드래그로 서명
  - 모바일: 터치로 서명
  - 반응형 캔버스 크기

- **서명 관리 기능**
  - "다시 그리기" 버튼으로 서명 초기화
  - 서명 완료 시 테두리 색상 변경 (회색 → 초록색)
  - 서명 상태 추적 (workerSigned, employerSigned)

### 2. 제출 버튼 활성화 로직
**초기 상태 (비활성화)**
```
[🔒 서명 후 제출 가능]
- 회색 배경
- 클릭 불가 (disabled)
```

**양쪽 서명 완료 후 (활성화)**
```
[✓ 계약서 제출]
- 주황색 배경
- 클릭 가능
- 호버 효과
```

### 3. 통일된 푸터 적용
**기존 푸터**
```html
<footer class="bg-gray-800 text-gray-400 py-8 mt-12">
  <p>© 2025 ALBI. All rights reserved.</p>
</footer>
```

**새 푸터 (index.html과 동일)**
```html
<footer class="footer">
  <div class="footer-links">
    - 이용약관
    - 개인정보처리방침
    - 전자계약서
    - 회사소개
    - 고객센터
  </div>
  <div class="footer-info">
    - 회사명, 대표자명
    - 사업자등록번호
    - 주소, 연락처
    - 저작권 정보
  </div>
</footer>
```

**푸터 특징**
- 그라데이션 배경 (다크 블루)
- 링크 호버 효과 (오렌지색)
- API에서 회사 정보 동적 로드
- 반응형 레이아웃

## 🎨 UI/UX 개선사항

### 서명 캔버스
```
초기 상태:
┌─────────────────┐
│                 │  ← 점선 테두리 (회색)
│   (빈 캔버스)   │  ← cursor: crosshair
│                 │
└─────────────────┘
[다시 그리기]

서명 후:
┌═════════════════┐
│  ┌─┐            │  ← 실선 테두리 (초록색)
│  │ │ ㅈㅓ명      │  ← 서명 그려짐
│  └─┘            │
└═════════════════┘
[다시 그리기]
```

### 버튼 상태 전환
```
1. 초기: 양쪽 서명 없음
   → [🔒 서명 후 제출 가능] (비활성, 회색)

2. 한쪽만 서명
   → [🔒 서명 후 제출 가능] (비활성, 회색)

3. 양쪽 모두 서명
   → [✓ 계약서 제출] (활성, 주황색)
```

## 🔧 기술 구현

### Canvas API 사용
```javascript
// 캔버스 초기화
const canvas = document.getElementById('workerSignature');
const ctx = canvas.getContext('2d');
ctx.strokeStyle = '#000';
ctx.lineWidth = 2;
ctx.lineCap = 'round';

// 그리기
ctx.beginPath();
ctx.moveTo(x, y);
ctx.lineTo(x, y);
ctx.stroke();

// 서명 데이터 추출
const signatureData = canvas.toDataURL(); // Base64
```

### 이벤트 처리
- `mousedown` / `touchstart` → 그리기 시작
- `mousemove` / `touchmove` → 선 그리기
- `mouseup` / `touchend` → 그리기 종료
- `mouseleave` → 캔버스 벗어남 처리

### 상태 관리
```javascript
let workerSigned = false;
let employerSigned = false;

function checkSignatures() {
  if (workerSigned && employerSigned) {
    // 제출 버튼 활성화
  }
}
```

## 📱 모바일 최적화
- `touch-action: none` → 스크롤 방지
- 터치 좌표 계산 (`e.touches[0]`)
- 반응형 캔버스 크기
- 모바일 친화적 버튼 크기

## 🌐 배포 정보
- **URL**: https://6740bd21.albi-app.pages.dev/contract
- **테스트 항목**:
  1. 데스크톱 서명 (마우스)
  2. 모바일 서명 (터치)
  3. 서명 초기화 버튼
  4. 제출 버튼 활성화
  5. 푸터 링크 동작
  6. 푸터 회사 정보 로드

## 🎯 다음 단계 (TODO)
- [ ] 서명 데이터 서버 저장 API 연동
- [ ] 계약서 PDF 생성 및 다운로드
- [ ] 계약서 이력 조회 (마이페이지)
- [ ] 이메일 알림 (계약서 체결 완료)
