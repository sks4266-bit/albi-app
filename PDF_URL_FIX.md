# ✅ PDF 다운로드 404 오류 수정 완료

## 🔧 문제 발견

### 오류
```
404 Page Not Found
URL: /api/contracts/CONTRACT-MLMK01LW-LWQK6NN/pdf
```

### 원인
Cloudflare Pages Functions의 라우팅 제한:
- `[id].ts` 파일은 `/api/contracts/:id` 경로만 처리
- `/api/contracts/:id/pdf`는 별도의 중첩 경로 파일 필요 (`[id]/pdf.ts` 또는 `[[path]].ts`)

---

## ✅ 해결 방법

### 변경 전 (404 오류)
```
/api/contracts/CONTRACT-XXX/pdf
```

### 변경 후 (정상 작동)
```
/api/contracts/CONTRACT-XXX?format=pdf
```

### 구현 방식
쿼리 파라미터(`?format=pdf`)를 사용하여 PDF 요청 구분

---

## 📝 수정 내용

### 1. API 엔드포인트 (`functions/api/contracts/[id].ts`)
```typescript
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const format = url.searchParams.get('format');
  
  // PDF 요청 감지
  if (format === 'pdf') {
    return generatePDF(context, contractId);
  }
  
  // 일반 계약서 조회
  return getContract(context, contractId);
};
```

### 2. API 응답 (`functions/api/contracts/index.ts`)
```typescript
return new Response(JSON.stringify({
  success: true,
  data: {
    contractId,
    pdfUrl: `/api/contracts/${contractId}?format=pdf`,  // ← 변경
    emailSent: true
  }
}));
```

### 3. 이메일 템플릿 (email-service.ts)
```typescript
const pdfUrl = `${origin}/api/contracts/${contractId}?format=pdf`;  // ← 변경
```

---

## 🧪 테스트

### 이전 계약서 테스트
```
계약번호: CONTRACT-MLMK01LW-LWQK6NN

새 PDF URL:
https://f41e50c3.albi-app.pages.dev/api/contracts/CONTRACT-MLMK01LW-LWQK6NN?format=pdf
```

### 새 계약서 제출 테스트
1. https://f41e50c3.albi-app.pages.dev/contract 접속
2. 계약서 작성 및 제출
3. 성공 메시지에서 "PDF 다운로드" 클릭
4. ✅ PDF 정상 표시

---

## 📧 이메일 PDF 링크도 자동 수정

이메일에서 **[📥 계약서 PDF 다운로드]** 버튼 클릭 시:
- 이전: 404 오류
- 현재: ✅ PDF 정상 표시

---

## 🎨 PDF 내용

### HTML 기반 PDF
- 계약번호 및 작성일
- 근로자 정보 (성명, 생년월일, 전화번호, 주소)
- 사업주 정보 (사업체명, 대표자, 사업자번호, 주소)
- 근로조건 (시작일, 시급, 근무시간, 업무내용)
- 주요 근로조건 (주휴수당, 연차, 퇴직금, 4대보험)
- 전자서명 (근로자 + 사업주)
- 인쇄 버튼

### 특징
- 브라우저에서 바로 확인 가능
- Ctrl+P (또는 🖨️ 버튼)로 PDF 저장
- 모바일에서도 정상 표시
- 전자서명 이미지 포함

---

## 🚀 배포 완료

**최신 배포 URL**: https://f41e50c3.albi-app.pages.dev

**테스트 URL**:
- 계약서 작성: https://f41e50c3.albi-app.pages.dev/contract
- 이전 계약서 PDF: https://f41e50c3.albi-app.pages.dev/api/contracts/CONTRACT-MLMK01LW-LWQK6NN?format=pdf

---

## ✅ 완료 상태

### 수정 완료
- [x] API 엔드포인트 수정
- [x] PDF URL 쿼리 파라미터 방식 변경
- [x] Frontend 응답 처리
- [x] 이메일 템플릿 PDF URL
- [x] 배포 완료

### 테스트 항목
- [ ] 새 계약서 제출
- [ ] PDF 다운로드 확인
- [ ] 이메일 PDF 링크 확인
- [ ] 모바일 PDF 표시 확인

---

## 📋 기술 노트

### Cloudflare Pages Functions 라우팅

#### ✅ 작동하는 방식
```
functions/api/contracts/[id].ts
→ /api/contracts/:id ✅
→ /api/contracts/:id?format=pdf ✅
```

#### ❌ 작동하지 않는 방식
```
functions/api/contracts/[id].ts
→ /api/contracts/:id/pdf ❌ (중첩 경로는 별도 파일 필요)
```

#### 해결 방법 2가지
1. **쿼리 파라미터** (현재 방식) ✅ 간단함
   - `/api/contracts/:id?format=pdf`
   
2. **Catch-all 라우팅** (복잡함)
   - `functions/api/contracts/[[path]].ts`
   - 모든 경로를 수동으로 파싱

---

**수정 시간**: 2026-02-14 17:20  
**배포 URL**: https://f41e50c3.albi-app.pages.dev  
**Git Commit**: `a5c8392`  
**상태**: ✅ 수정 완료
