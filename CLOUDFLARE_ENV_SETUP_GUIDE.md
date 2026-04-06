# Cloudflare Pages 환경변수 설정 가이드

## 즉시 설정해야 할 환경변수

### 1. KCP 정기결제 환경변수 (필수)

**설정 위치**: Cloudflare Dashboard → Pages → `albi-app` → Settings → Environment variables

**Production 환경에 추가할 변수**:

```bash
# KCP 테스트 환경 (제공받은 정보)
KCP_SITE_CD=A52Q7
KCP_SITE_KEY=your_site_key_here  # KCP에서 제공받은 실제 키로 교체 필요
KCP_SITE_NAME=알비
KCP_CHANNEL_KEY=channel-key-e6e1d9a4-8f9a-435c-a0fc-4ea301e79c66
```

**Preview 환경에도 동일하게 추가** (Production + Preview 모두 체크)

---

### 2. Google OAuth Client ID 수정 (긴급)

**현재 문제**: 잘못된 Client ID가 설정되어 있음
- ❌ **현재 (잘못됨)**: `851913480828-jmjakc448nekunr07hsi60if6gp9q49j.apps.googleusercontent.com`
- ✅ **올바른 값**: `171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com`

**설정 방법**:
1. Cloudflare Dashboard → Pages → `albi-app` → Settings → Environment variables
2. `GOOGLE_CLIENT_ID` 찾기
3. **Edit** 클릭
4. 값을 `171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com`으로 변경
5. **Save** (Production + Preview 모두)

---

## 설정 후 재배포 (필수)

환경변수 변경 후에는 **반드시 재배포** 필요:

### 방법 1: Cloudflare Dashboard에서 Retry Deployment
1. Cloudflare Dashboard → Pages → `albi-app` → Deployments
2. 최신 배포 옆 **⋯** 메뉴 → "Retry deployment"
3. 2-3분 대기

### 방법 2: Git Push로 자동 배포
```bash
# 더미 커밋으로 재배포 트리거
git commit --allow-empty -m "chore: Trigger redeployment for env vars"
git push origin main
```

---

## 설정 확인 방법

### 1. KCP API 엔드포인트 테스트
```bash
curl -X POST https://albi.kr/api/kcp/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_kcp_user",
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
    "PayUrl": "https://..."
  }
}
```

### 2. Google OAuth Redirect URI 확인
```bash
curl -I https://albi.kr/api/auth/google 2>&1 | grep client_id
```

**예상 결과**:
```
client_id=171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com
```

---

## 체크리스트

### KCP 환경변수
- [ ] `KCP_SITE_CD` = `A52Q7`
- [ ] `KCP_SITE_KEY` = (실제 키 입력)
- [ ] `KCP_SITE_NAME` = `알비`
- [ ] `KCP_CHANNEL_KEY` = `channel-key-e6e1d9a4-8f9a-435c-a0fc-4ea301e79c66`
- [ ] Production 환경 적용
- [ ] Preview 환경 적용

### Google OAuth 환경변수
- [ ] `GOOGLE_CLIENT_ID` = `171235009067-4ams3ckjs9n3mbg19rth8b7rnsvjm10g.apps.googleusercontent.com`
- [ ] Production 환경 적용
- [ ] Preview 환경 적용

### 재배포
- [ ] Cloudflare Pages 재배포 완료
- [ ] 2-3분 대기 완료

### 테스트
- [ ] KCP 결제 등록 API 테스트 성공
- [ ] Google OAuth redirect URI 확인 성공
- [ ] 프로덕션 결제 페이지 접속 (https://albi.kr/payment)
- [ ] 프로덕션 로그인 페이지 Google 로그인 테스트 (https://albi.kr/login)

---

## 중요 참고사항

### KCP_SITE_KEY는 어디서?
- KCP 계약 시 제공받은 **site_key** 값을 입력
- 테스트 환경에서는 KCP에서 제공한 테스트 키 사용
- **보안 주의**: 절대 GitHub에 커밋하지 말 것

### Google Cloud Console 설정 확인
Google OAuth가 작동하려면 다음 Redirect URI가 등록되어 있어야 함:
- `https://albi.kr/api/auth/google/callback` (필수)
- `https://albi-app.pages.dev/api/auth/google/callback` (권장)
- `http://localhost:3000/api/auth/google/callback` (로컬 개발용)

설정 URL: https://console.cloud.google.com/apis/credentials

---

## 예상 소요 시간

| 작업 | 예상 시간 |
|------|-----------|
| Cloudflare 환경변수 설정 | 3분 |
| 재배포 대기 | 3분 |
| API 테스트 | 2분 |
| **총계** | **약 8분** |

---

## 문제 발생 시

### KCP 결제 오류
1. `.dev.vars` 파일의 `KCP_SITE_KEY` 확인
2. Cloudflare 환경변수가 올바른지 확인
3. 재배포 후 5분 대기

### Google 로그인 오류
1. Client ID가 정확히 복사되었는지 확인 (공백 없이)
2. Google Cloud Console의 Redirect URI 등록 확인
3. 브라우저 캐시 삭제 후 시크릿 모드에서 테스트

---

## 다음 단계

1. ✅ 환경변수 설정 완료
2. ✅ 재배포 완료
3. 🔄 KCP 테스트 결제 실행
4. 🔄 Google 로그인 테스트
5. 📊 결과 확인 및 피드백
