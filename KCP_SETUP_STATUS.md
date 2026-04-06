# KCP 정기결제 전환 작업 현황

작성일: 2026-03-19
진행률: **80%** 완료

---

## ✅ 완료된 작업

### 1. 코드 구현 (100%)
- ✅ KCP API 엔드포인트 구현 (`/functions/api/kcp/[[path]].ts`)
  - `/api/kcp/register` - 거래 등록
  - `/api/kcp/batch-auth` - 배치키 발급 처리
  - `/api/kcp/execute-payment` - 정기결제 실행
- ✅ DB 마이그레이션 생성 및 적용 (`0030_create_kcp_tables.sql`)
- ✅ payment.html에서 PortOne 제거 및 KCP 정기결제로 교체
- ✅ payment-callback.html 업데이트
- ✅ GitHub 푸시 완료 (commit: `2f55d21`)

### 2. 로컬 환경 설정 (100%)
- ✅ `.dev.vars` 파일 생성
- ✅ 로컬 DB 마이그레이션 적용
- ✅ 빌드 성공 (`dist/` 디렉토리 생성)

---

## ⏳ 남은 작업

### 1. Cloudflare Pages 환경변수 설정 (⚠️ **긴급**)

**설정 위치**: [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → `albi-app` → Settings → Environment variables

#### A. KCP 정기결제 환경변수 (Production + Preview 모두)

```
KCP_SITE_CD=A52Q7
KCP_SITE_KEY=실제_사이트키_입력필요
KCP_SITE_NAME=알비
KCP_CHANNEL_KEY=channel-key-e6e1d9a4-8f9a-435c-a0fc-4ea301e79c66
```

**⚠️ 중요**: `KCP_SITE_KEY`는 **KCP 계약 시 제공받은 실제 키**를 입력해야 합니다.
- 테스트 환경: KCP에서 제공한 테스트 사이트 키
- 운영 환경: KCP 정식 계약 후 발급받은 운영 키

**KCP_SITE_KEY 확인 방법**:
1. KCP 담당자에게 문의
2. KCP 관리자 페이지 로그인 → 가맹점 정보 → site_key 확인
3. 계약 시 받은 이메일에서 site_key 검색

#### B. Google OAuth Client ID 수정 (Production + Preview 모두)

**현재 (잘못됨)**:
```
GOOGLE_CLIENT_ID=851913480828-jmjakc448nekunr07hsi60if6gp9q49j.apps.googleusercontent.com
```

**올바른 값**:
```
GOOGLE_CLIENT_ID=171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com
```

---

### 2. 재배포 (환경변수 설정 후 필수)

#### 방법 1: Cloudflare Dashboard (권장)
1. Pages → `albi-app` → Deployments
2. 최신 배포 옆 **⋯** → "Retry deployment"
3. 2-3분 대기

#### 방법 2: Git Push
```bash
git commit --allow-empty -m "chore: Trigger redeploy for env vars"
git push origin main
```

---

### 3. 테스트 (재배포 후)

#### A. KCP 결제 등록 API 테스트
```bash
curl -X POST https://albi.kr/api/kcp/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_kcp_123",
    "user_name": "테스트사용자",
    "user_email": "test@albi-test.com",
    "plan_type": "standard",
    "amount": 4900
  }'
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "tno": "2026031900001",
    "approval_key": "...",
    "PayUrl": "https://stg-spl.kcp.co.kr/..."
  }
}
```

#### B. 프로덕션 결제 페이지 테스트
1. https://albi.kr/payment 접속
2. Standard 플랜 선택
3. 이름/이메일 입력
4. "결제하기" 클릭
5. KCP 결제창 팝업 확인

#### C. Google 로그인 테스트
1. https://albi.kr/login 접속
2. "Google로 로그인" 클릭
3. 로그인 성공 확인 (redirect_uri_mismatch 오류 없어야 함)

---

## 📋 체크리스트

### 환경변수 설정
- [ ] Cloudflare Dashboard 접속
- [ ] KCP 환경변수 4개 추가 (Production)
  - [ ] `KCP_SITE_CD` = `A52Q7`
  - [ ] `KCP_SITE_KEY` = (실제 키 입력)
  - [ ] `KCP_SITE_NAME` = `알비`
  - [ ] `KCP_CHANNEL_KEY` = `channel-key-e6e1d9a4-8f9a-435c-a0fc-4ea301e79c66`
- [ ] KCP 환경변수 4개 추가 (Preview)
- [ ] `GOOGLE_CLIENT_ID` 수정 (Production)
- [ ] `GOOGLE_CLIENT_ID` 수정 (Preview)
- [ ] 환경변수 저장 완료

### 재배포
- [ ] Cloudflare Pages 재배포 실행
- [ ] 배포 완료 확인 (2-3분 대기)

### 테스트
- [ ] KCP 결제 등록 API 테스트 성공
- [ ] 결제 페이지 접속 확인
- [ ] KCP 결제창 팝업 확인
- [ ] Google 로그인 테스트 성공

---

## 🚀 예상 완료 시간

| 작업 | 소요 시간 |
|------|-----------|
| KCP_SITE_KEY 확인 | 5분 |
| Cloudflare 환경변수 설정 | 3분 |
| 재배포 | 3분 |
| 테스트 | 5분 |
| **총계** | **약 16분** |

---

## ❓ KCP_SITE_KEY를 모르는 경우

### 1. KCP 담당자에게 문의
- 계약 담당자 이메일/전화
- "테스트 환경 site_key를 알려주세요"

### 2. KCP 관리자 페이지 확인
- URL: https://admin.kcp.co.kr (또는 테스트 환경 URL)
- 로그인 → 가맹점 정보 → site_key 확인

### 3. 계약 이메일 확인
- KCP 계약 시 받은 이메일
- 제목: "KCP 가맹점 정보" 등
- 본문에서 "site_key" 또는 "사이트 키" 검색

---

## 📌 중요 참고사항

1. **KCP_SITE_KEY는 절대 GitHub에 커밋하지 마세요** (보안 위험)
2. 환경변수 설정 후 **반드시 재배포** 필요 (자동 반영 안 됨)
3. Google OAuth도 함께 수정해야 로그인 문제 해결됨
4. KCP 테스트 결제는 **실제 결제되지 않음** (테스트 카드 사용)

---

## 📞 지원

문제 발생 시:
1. `CLOUDFLARE_ENV_SETUP_GUIDE.md` 참고
2. `KCP_INTEGRATION_GUIDE.md` 참고
3. 에러 메시지와 함께 문의

