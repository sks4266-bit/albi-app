# Cloudflare Pages D1 Database 바인딩 설정 가이드

## 🎯 목적
Cloudflare Pages의 프로덕션 환경에서 D1 데이터베이스를 사용하기 위해 바인딩 설정이 필요합니다.

## 📋 현재 상태
- **wrangler.jsonc**: D1 설정 완료 ✅
- **로컬 환경**: 정상 작동 ✅
- **프로덕션 환경**: 바인딩 미설정 ⚠️

## 🔧 설정 방법

### Step 1: Cloudflare Dashboard 접속
1. https://dash.cloudflare.com 로그인
2. 왼쪽 메뉴에서 **Workers & Pages** 클릭
3. **albi-app** 프로젝트 선택

### Step 2: Settings 페이지 이동
1. 상단 탭에서 **Settings** 클릭
2. 왼쪽 사이드바에서 **Functions** 선택

### Step 3: D1 Database Binding 추가
1. **D1 database bindings** 섹션 찾기
2. **Add binding** 버튼 클릭
3. 다음 정보 입력:
   ```
   Variable name: DB
   D1 database: albi-production
   ```
4. **Save** 버튼 클릭

### Step 4: 환경 변수 (Production) 설정 확인
1. 같은 Settings 페이지에서 **Environment variables** 섹션 확인
2. Production 환경에 다음 변수들이 있는지 확인:
   - `DB` → D1 database binding (위에서 설정)

### Step 5: 재배포 (중요!)
바인딩 설정 후 **반드시 재배포**해야 적용됩니다:

```bash
cd /home/user/webapp
npx wrangler pages deploy public --project-name albi-app
```

또는 Cloudflare Dashboard에서:
1. **Deployments** 탭
2. 최신 배포 우측의 **︙** (3점 메뉴)
3. **Retry deployment** 클릭

## ✅ 설정 확인 방법

### 1. API 테스트
```bash
curl https://your-deployment.albi-app.pages.dev/api/company-info
```

**성공 응답 예시:**
```json
{
  "success": true,
  "data": {
    "company_name": "곱대전",
    "business_registration_number": "834-10-01809",
    "representative": "박지훈",
    "address": "경상남도 양산시 동면 사송로 155, 807동 1405호",
    "email": "sks4266@gmail.com",
    "phone": "010-4459-4226",
    "business_type": "온라인 알바 플랫폼",
    "mail_order_registration": "제2026-경남양산-00526호"
  }
}
```

### 2. 고객센터 페이지 확인
1. https://your-deployment.albi-app.pages.dev/support.html 접속
2. 하단 **회사 정보** 섹션에서 실제 데이터가 로딩되는지 확인
3. 로딩 스피너가 사라지고 회사 정보가 표시되어야 함

### 3. 메인 페이지 푸터 확인
1. https://your-deployment.albi-app.pages.dev/ 접속
2. 하단 푸터에서 회사 정보가 표시되는지 확인

## 🔍 트러블슈팅

### 문제 1: "error code: 1101"
**원인**: D1 바인딩이 설정되지 않음

**해결책**:
1. Cloudflare Dashboard > Settings > Functions > D1 database bindings 확인
2. `DB` 바인딩이 `albi-production` 데이터베이스와 연결되었는지 확인
3. 재배포 실행

### 문제 2: 기본 정보만 표시됨
**원인**: DB 조회는 실패했지만 Fallback 로직이 작동 중

**해결책**:
1. D1 데이터베이스에 실제 데이터가 있는지 확인:
   ```bash
   npx wrangler d1 execute albi-production --remote --command="SELECT * FROM users WHERE user_type='employer' LIMIT 1"
   ```
2. 데이터가 없다면 seed 스크립트 실행:
   ```bash
   npx wrangler d1 execute albi-production --remote --file=./seed_test_data_simple.sql
   ```

### 문제 3: 바인딩 설정했는데도 작동 안 함
**체크리스트**:
- [ ] D1 database name이 정확한가? (albi-production)
- [ ] Variable name이 "DB"인가? (대문자 확인)
- [ ] 재배포를 했는가?
- [ ] 브라우저 캐시를 지웠는가? (Ctrl + Shift + R)
- [ ] Production 환경 설정인가? (Preview 환경과 구분)

## 📊 설정 전후 비교

### ❌ 설정 전
```bash
curl https://72beb57c.albi-app.pages.dev/api/company-info
# 결과: error code: 1101
```

### ✅ 설정 후
```bash
curl https://72beb57c.albi-app.pages.dev/api/company-info
# 결과: {"success":true,"data":{...실제 DB 데이터...}}
```

## 🎓 추가 정보

### D1 Database ID 확인
```bash
npx wrangler d1 list
```

출력:
```
┌──────────────────────────────────────┬─────────────────┬─────────┬──────────┐
│ uuid                                 │ name            │ version │ ...      │
├──────────────────────────────────────┼─────────────────┼─────────┼──────────┤
│ cd20f633-d756-4249-87b8-2577775afef5 │ albi-production │ beta    │ ...      │
└──────────────────────────────────────┴─────────────────┴─────────┴──────────┘
```

### wrangler.jsonc 설정 확인
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",  // ← 이 이름이 Dashboard에서 설정할 Variable name
      "database_name": "albi-production",  // ← Dashboard에서 선택할 D1 database
      "database_id": "cd20f633-d756-4249-87b8-2577775afef5"
    }
  ]
}
```

## 🚨 중요 주의사항

1. **Production과 Preview 환경 구분**
   - Production: 실제 서비스 환경 (main 브랜치)
   - Preview: 테스트 환경 (다른 브랜치)
   - 각각 별도로 바인딩 설정 필요!

2. **재배포 필수**
   - 바인딩 설정 변경 후 반드시 재배포
   - 설정만 변경하고 재배포 안 하면 적용 안 됨

3. **캐시 주의**
   - 브라우저 캐시, Cloudflare 엣지 캐시 등
   - 변경사항이 즉시 반영되지 않을 수 있음
   - 1-2분 대기 또는 강제 새로고침

## 📞 도움이 필요하신가요?

Cloudflare 공식 문서:
- D1 Bindings: https://developers.cloudflare.com/pages/platform/functions/bindings/#d1-databases
- Pages Functions: https://developers.cloudflare.com/pages/platform/functions/

문제가 계속되면:
1. Cloudflare Dashboard의 Logs 확인
2. wrangler tail 명령어로 실시간 로그 확인
3. GitHub Issues에 문의

---

**이 가이드대로 설정하시면 회사 정보 API가 정상 작동합니다!** ✅
