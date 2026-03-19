# ✅ PDF 다운로드 문제 해결 완료

## 🔧 수정 사항

### 1. Backend API 수정
**변경 전:** `/api/contracts/:id/pdf` (Cloudflare Pages Functions에서 지원하지 않는 중첩 경로)
**변경 후:** `/api/contracts/:id?format=pdf` (Query parameter 방식)

### 2. Frontend 수정
- `mypage.html`:
  - `viewContractPDF()` 함수
  - `downloadContractPDF()` 함수
- `contract.html`: 서버 응답 URL 사용 (자동 반영)

### 3. 이메일 알림
- `functions/api/contracts/index.ts`에서 생성되는 PDF URL 자동 변경

## 🧪 테스트 결과

### ✅ 정상 작동 확인
```bash
curl "https://albi-app.pages.dev/api/contracts/CONTRACT-MLMK01LW-LWQK6NN?format=pdf"
# → HTML 계약서 페이지 정상 반환 (200 OK)
```

### 📍 테스트 URL
- **프로덕션:** https://albi-app.pages.dev/mypage
- **최신 배포:** https://57d4bffa.albi-app.pages.dev/mypage

## 📋 사용 방법

### 1. 마이페이지에서 계약서 확인
1. https://albi-app.pages.dev/mypage 접속
2. "전자계약서" 탭 선택
3. 계약서 목록에서:
   - **📄 PDF 보기** 버튼: 새 탭에서 계약서 열림
   - **💾 다운로드** 버튼: HTML 파일로 다운로드
   - **🔄 상태변경** 버튼: 계약 상태 변경

### 2. 이메일 알림
- 계약서 생성 시 근로자/고용주에게 이메일 발송
- 이메일의 "계약서 PDF 다운로드" 링크 클릭 → 계약서 열림

### 3. 직접 URL 접근
```
https://albi-app.pages.dev/api/contracts/[CONTRACT_ID]?format=pdf
```

## 🎯 핵심 기술 포인트

### Cloudflare Pages Functions 라우팅
- `functions/api/contracts/[id].ts` → `/api/contracts/:id`
- Query parameter로 추가 옵션 처리 (`?format=pdf`)
- 중첩 경로(`/pdf`)는 별도 파일 필요 → Query parameter가 더 효율적

### PDF 생성 방식
- 실제 PDF 대신 HTML 페이지 반환
- `window.print()` 기능으로 인쇄/저장 가능
- 전자서명 이미지 포함 (Base64 Data URL)

## 📦 관련 커밋
```
42940db - Add: Debug logging for PDF generation
dfc4407 - Fix: Update PDF URLs in mypage.html to use query parameter format
[이전] - Fix: Change PDF URL from path to query parameter
```

## 🚀 다음 단계
1. ~~Resend API 키 설정~~ ✅ 완료
2. ~~이메일 알림 활성화~~ ✅ 완료
3. ~~PDF 다운로드 수정~~ ✅ 완료
4. 계약서 템플릿 관리 기능
5. SMS 알림 추가 (CoolSMS)
6. 관리자 대시보드

---
**배포 일시:** 2026-02-14 17:05 (KST)
**배포 URL:** https://57d4bffa.albi-app.pages.dev
**프로덕션 URL:** https://albi-app.pages.dev
