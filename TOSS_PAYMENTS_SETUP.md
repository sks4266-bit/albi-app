# Toss Payments API 키 설정 가이드

## 🔑 API 키 발급받기

### 1. Toss Payments 개발자 센터 접속
- URL: https://developers.tosspayments.com/
- 회원가입 후 로그인

### 2. 애플리케이션 생성
1. 대시보드 → "내 애플리케이션" → "애플리케이션 추가"
2. 애플리케이션 이름: "알비(ALBI)"
3. 사업자 정보 입력

### 3. API 키 확인
**테스트 환경 (개발/테스트용)**
- 클라이언트 키: `test_ck_XXX...` (프론트엔드에서 사용)
- 시크릿 키: `test_sk_XXX...` (백엔드에서 사용)

**프로덕션 환경 (실제 결제용)**
- 클라이언트 키: `live_ck_XXX...`
- 시크릿 키: `live_sk_XXX...`

## 🔧 Cloudflare Workers 환경 변수 설정

### 로컬 개발 환경 (.dev.vars)
```bash
cd /home/user/webapp

# .dev.vars 파일 생성 (로컬 개발용)
cat > .dev.vars << 'EOF'
# Toss Payments API Keys (테스트 환경)
TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R

# 환경 구분
ENVIRONMENT=development
EOF

# .gitignore에 .dev.vars 추가 (보안)
echo ".dev.vars" >> .gitignore
```

### 프로덕션 환경 (Cloudflare Secret)
```bash
cd /home/user/webapp

# Toss Payments 시크릿 키 설정 (프로덕션)
wrangler secret put TOSS_SECRET_KEY
# 입력 프롬프트에서 실제 프로덕션 시크릿 키 입력

# Toss Payments 클라이언트 키 설정 (프로덕션)
wrangler secret put TOSS_CLIENT_KEY
# 입력 프롬프트에서 실제 프로덕션 클라이언트 키 입력

# 환경 구분
wrangler secret put ENVIRONMENT
# production 입력
```

## 📝 wrangler.jsonc 설정

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "albi-app",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./public",
  
  // D1 Database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "albi-production",
      "database_id": "your-database-id"
    }
  ],

  // 환경 변수 (비밀이 아닌 것만)
  "vars": {
    "TOSS_CLIENT_KEY_TEST": "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"
  }
}
```

## 🔒 보안 주의사항

### ❌ 절대 금지
- GitHub에 API 시크릿 키 커밋 금지
- 프론트엔드 코드에 시크릿 키 노출 금지
- .dev.vars 파일 커밋 금지

### ✅ 권장 사항
- 시크릿 키는 `wrangler secret put`으로만 설정
- 클라이언트 키는 환경변수로 전달
- .dev.vars는 .gitignore에 추가

## 🧪 API 키 테스트

### 테스트 결제 카드 정보
```
카드 번호: 4330-1234-5678-9012
유효기간: 12/28
CVC: 123
비밀번호: 앞 2자리 12
```

### 테스트 시나리오
1. 성공 케이스: 위 카드 정보 사용
2. 실패 케이스: 카드 번호 마지막 자리를 0으로 변경

## 📊 API 키 현황

### 현재 설정 상태
- [x] 테스트 클라이언트 키: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`
- [x] 테스트 시크릿 키: `test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R`
- [ ] 프로덕션 클라이언트 키: **미설정** (실제 키 필요)
- [ ] 프로덕션 시크릿 키: **미설정** (실제 키 필요)

### 다음 단계
1. ✅ 테스트 환경에서 결제 프로세스 검증
2. ⏳ Toss Payments 계약 및 프로덕션 키 발급
3. ⏳ 프로덕션 키를 Cloudflare Secret에 등록
4. ⏳ 실제 카드로 결제 테스트

## 🔗 참고 링크

- **Toss Payments 개발자 센터**: https://developers.tosspayments.com/
- **API 문서**: https://docs.tosspayments.com/
- **SDK 가이드**: https://docs.tosspayments.com/reference/widget-sdk
- **테스트 카드**: https://docs.tosspayments.com/guides/test-card

---

**작성일**: 2026-02-16  
**최종 업데이트**: 2026-02-16  
**상태**: 테스트 환경 설정 완료, 프로덕션 키 대기중
