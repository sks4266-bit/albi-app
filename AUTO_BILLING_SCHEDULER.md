# 정기결제 자동 갱신 스케줄러 설정 가이드

## 개요
매일 자동으로 구독 갱신 결제를 처리하는 시스템입니다.

## 작동 방식

### 1. GitHub Actions Cron
```yaml
Schedule: 매일 UTC 00:00 (한국시간 09:00)
Trigger: .github/workflows/auto-billing.yml
Action: POST https://albi.kr/api/subscription/auto-billing
```

### 2. API 처리 흐름
```
1. 오늘 결제해야 하는 구독 조회
   (next_payment_date = today, status = 'active')
   
2. 각 구독별로:
   a. 빌링키 조회
   b. PortOne API로 빌링키 결제 요청
   c. 결제 성공/실패 처리
   d. next_payment_date +30일 업데이트
   
3. 결과 반환:
   - 성공: X건
   - 실패: Y건
   - 상세 내역
```

## 설정 방법

### 1단계: CRON_SECRET 생성
```bash
# 랜덤 시크릿 생성 (32자)
openssl rand -base64 32

# 예시 출력:
# Xk7mP9vQ2wR5tY8uZ3nA6bC1dE4fG7hJ0iK=
```

### 2단계: Cloudflare Pages 환경 변수 설정
```
Dashboard: https://dash.cloudflare.com/pages/albi-app/settings/environment-variables

Variable: CRON_SECRET
Value: <생성된 시크릿>
Environment: Production, Preview
```

### 3단계: GitHub Repository Secret 설정
```
Repository: https://github.com/<your-repo>/settings/secrets/actions

Secret name: CRON_SECRET
Secret value: <동일한 시크릿>
```

### 4단계: GitHub Actions 활성화 확인
```
Repository → Actions 탭
→ "Auto Billing Scheduler" 워크플로우 확인
→ "Enable" 버튼 클릭 (비활성화된 경우)
```

## 테스트

### 수동 실행 (GitHub Actions)
```
1. Repository → Actions 탭
2. "Auto Billing Scheduler" 선택
3. "Run workflow" 버튼 클릭
4. 실행 결과 확인
```

### API 직접 테스트
```bash
curl -X POST https://albi.kr/api/subscription/auto-billing \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json"

# 예상 응답:
# {
#   "success": true,
#   "message": "자동 결제 완료",
#   "processed": 5,
#   "success": 4,
#   "failed": 1,
#   "results": [...]
# }
```

### 로컬 테스트 (개발 환경)
```bash
# .dev.vars에 CRON_SECRET 추가
echo 'CRON_SECRET=test-secret-123' >> .dev.vars

# 로컬 서버에서 테스트
curl -X POST http://localhost:3000/api/subscription/auto-billing \
  -H "Authorization: Bearer test-secret-123" \
  -H "Content-Type: application/json"
```

## 모니터링

### GitHub Actions 로그
```
Repository → Actions → Auto Billing Scheduler
→ 최근 실행 결과 확인
→ 실패 시 이메일 알림 (GitHub 설정)
```

### Cloudflare Pages 로그
```bash
npx wrangler pages deployment tail --project-name albi-app

# 또는 대시보드:
# https://dash.cloudflare.com/pages/albi-app/functions
```

### 데이터베이스 로그
```sql
-- 최근 자동 결제 로그 조회
SELECT * FROM scheduled_payment_logs
ORDER BY created_at DESC
LIMIT 10;

-- 실패한 결제만 조회
SELECT * FROM scheduled_payment_logs
WHERE execution_status = 'failed'
ORDER BY created_at DESC;
```

## 재시도 로직

### 실패 시 처리
```
1회 실패: 3시간 후 재시도 (수동 트리거)
2회 실패: 이메일 알림 발송
3회 실패: 구독 일시정지 (status = 'suspended')
```

### 수동 재시도
```bash
# 특정 구독 수동 결제
curl -X POST https://albi.kr/api/subscription/retry-payment \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"subscription_id": "sub_xxx"}'
```

## 알림 설정

### GitHub Actions 실패 알림
```
Repository → Settings → Notifications
→ "Actions" 섹션
→ "Send notifications for failed workflows" 체크
```

### 이메일 알림 (선택)
```typescript
// auto-billing.ts에 추가
if (failCount > 0) {
  await sendEmail({
    to: 'admin@albi.kr',
    subject: `[알비] 자동 결제 실패 ${failCount}건`,
    body: JSON.stringify(failedResults, null, 2)
  });
}
```

## 보안 고려사항

### ✅ 권장 사항
1. **CRON_SECRET 정기 갱신**: 3-6개월마다
2. **IP 화이트리스트**: GitHub Actions IP 대역만 허용 (선택)
3. **Rate Limiting**: 동일 IP에서 과도한 요청 차단
4. **로그 모니터링**: 비정상 요청 탐지

### ⚠️ 주의사항
1. CRON_SECRET을 Git에 커밋하지 않기
2. 환경 변수와 GitHub Secret이 동일한지 확인
3. 자동 결제 실패 시 즉시 확인

## 스케줄 변경

### 실행 시간 조정
```yaml
# .github/workflows/auto-billing.yml

# 매일 오전 9시 (한국시간)
- cron: '0 0 * * *'

# 매일 오후 3시 (한국시간)
- cron: '0 6 * * *'

# 매주 월요일 오전 9시
- cron: '0 0 * * 1'

# 매월 1일 오전 9시
- cron: '0 0 1 * *'
```

## 문제 해결

### Q: GitHub Actions가 실행되지 않음
```
A: 
1. Repository → Actions 탭 확인
2. Workflow가 활성화되어 있는지 확인
3. Repository가 Public인지 확인 (Private는 유료)
4. YAML 문법 오류 확인
```

### Q: 401 Unauthorized 에러
```
A:
1. GitHub Secret CRON_SECRET 확인
2. Cloudflare 환경 변수 CRON_SECRET 확인
3. 두 값이 동일한지 확인
4. curl 명령어로 직접 테스트
```

### Q: 결제가 실행되지 않음
```
A:
1. 오늘 날짜에 next_payment_date가 있는지 확인
2. 구독 status가 'active'인지 확인
3. 빌링키가 유효한지 확인
4. PortOne API 응답 로그 확인
```

## 대안 방법

### Uptime Robot (무료)
```
1. https://uptimerobot.com/ 가입
2. New Monitor → HTTP(s)
3. URL: https://albi.kr/api/subscription/auto-billing
4. Method: POST
5. Custom HTTP Headers:
   Authorization: Bearer <CRON_SECRET>
6. Interval: Every 24 hours
```

### cron-job.org (무료)
```
1. https://cron-job.org/ 가입
2. Create Cronjob
3. URL: https://albi.kr/api/subscription/auto-billing
4. Method: POST
5. Headers: Authorization: Bearer <CRON_SECRET>
6. Schedule: Daily at 00:00 UTC
```

## 체크리스트

### 설정 완료
- [ ] CRON_SECRET 생성
- [ ] Cloudflare 환경 변수 추가
- [ ] GitHub Repository Secret 추가
- [ ] GitHub Actions 활성화
- [ ] 수동 테스트 성공

### 모니터링
- [ ] GitHub Actions 로그 확인
- [ ] Cloudflare 로그 확인
- [ ] 데이터베이스 로그 테이블 확인
- [ ] 이메일 알림 설정 (선택)

---

**작성일**: 2026-03-05  
**상태**: ✅ 구현 완료, 설정 대기 중  
**다음 단계**: CRON_SECRET 생성 및 설정
