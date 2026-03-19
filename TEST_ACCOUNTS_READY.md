# ✅ 테스트 계정 준비 완료!

## 🎯 질문에 대한 답변

### Q1: 테스트계정이 새로고침할때마다 새롭게 생성되고 있어. 이게 맞는거야?

**A: 아닙니다!** 수정했습니다. 이제 **3개의 고정 테스트 계정**을 사용합니다.
- ✅ 새로고침해도 계정 정보가 유지됩니다
- ✅ localStorage에 저장되어 항상 같은 계정 표시
- ✅ "다른 테스트 계정으로 전환" 버튼으로 3개 계정 순환

### Q2: 로그인이 안되니깐 한번 확인해줘!

**A: 수정 완료!** 비밀번호 검증 로직이 8자만 허용했는데, 11자 비밀번호를 사용해서 문제였습니다.
- ✅ 비밀번호 길이 제한을 8-20자로 변경
- ✅ 패턴: `Test`로 시작 + `123`으로 끝
- ✅ 모든 3개 계정 로그인 테스트 성공

### Q3: 로그인 가능한 테스트 계정 알려줘!

**A: 여기 있습니다!** 👇

---

## 🔐 로그인 가능한 테스트 계정 (3개)

### 1️⃣ **데모 계정**
```
이메일: test_demo@albi-test.com
비밀번호: TestDemo123
```

### 2️⃣ **사용자 계정**
```
이메일: test_user@albi-test.com
비밀번호: TestUser123
```

### 3️⃣ **알비 계정**
```
이메일: test_albi@albi-test.com
비밀번호: TestAlbi123
```

---

## 🧪 테스트 방법

### 웹 페이지에서 테스트

#### 1단계: 테스트 계정 페이지 접속
```
프로덕션: https://albi.kr/test-account
샌드박스: https://3000-is6fz7wmwyawlr7nfbeuf-5c13a017.sandbox.novita.ai/test-account.html
```

#### 2단계: 계정 정보 확인
- 페이지 열면 자동으로 첫 번째 계정 표시됨
- 필요하면 "다른 테스트 계정으로 전환" 버튼 클릭

#### 3단계: 로그인 페이지로 이동
- "로그인 페이지로 이동" 버튼 클릭

#### 4단계: 로그인
- 이메일/비밀번호 복사 & 붙여넣기
- "로그인" 버튼 클릭

#### 5단계: 성공 확인
```
✅ "🧪 테스트 계정으로 로그인했습니다!" 알림
✅ 자동으로 /chat.html (면접 페이지)로 이동
✅ 상단에 이름 표시: "테스트 사용자 (test_demo)"
```

---

## 📋 API 직접 테스트

### cURL 테스트

```bash
# 1️⃣ 데모 계정
curl -X POST https://albi.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_demo@albi-test.com",
    "password": "TestDemo123",
    "remember": false
  }'

# 성공 응답:
{
  "success": true,
  "message": "테스트 계정 로그인 성공",
  "data": {
    "userId": "test_demo",
    "name": "테스트 사용자 (test_demo)",
    "email": "test_demo@albi-test.com",
    "sessionToken": "test_session_...",
    "isTestAccount": true,
    "points": 1000
  }
}
```

```bash
# 2️⃣ 사용자 계정
curl -X POST https://albi.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user@albi-test.com",
    "password": "TestUser123",
    "remember": false
  }'
```

```bash
# 3️⃣ 알비 계정
curl -X POST https://albi.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_albi@albi-test.com",
    "password": "TestAlbi123",
    "remember": false
  }'
```

---

## 🔧 기술 세부사항

### 고정 계정 작동 방식

1. **페이지 로드**
   - 3개의 고정 계정 배열 정의
   - localStorage에서 저장된 계정 확인
   - 저장된 계정이 없으면 첫 번째 계정 표시

2. **계정 전환**
   - "다른 테스트 계정으로 전환" 버튼 클릭
   - 다음 계정으로 순환 (0 → 1 → 2 → 0...)
   - localStorage에 새 계정 저장

3. **로그인 API**
   - `@albi-test.com` 도메인 자동 감지
   - 비밀번호 패턴 검증: `Test*123` (8-20자)
   - DB 저장 없이 24시간 세션 생성
   - `isTestAccount: true` 플래그 반환

### 비밀번호 패턴 규칙

```typescript
// 검증 로직
const isValidTestPassword = 
  password.startsWith('Test') && 
  password.endsWith('123') && 
  password.length >= 8 && 
  password.length <= 20
```

**유효한 예시:**
- ✅ `TestDemo123` (11자)
- ✅ `TestUser123` (11자)
- ✅ `TestAlbi123` (11자)
- ✅ `TestA123` (8자)
- ✅ `TestABCDEFGHIJKLMN123` (20자)

**무효한 예시:**
- ❌ `Test123` (7자 - 너무 짧음)
- ❌ `Demo123` (Test로 시작 안 함)
- ❌ `TestDemo456` (123으로 끝나지 않음)
- ❌ `TestABCDEFGHIJKLMNOP123` (21자 - 너무 김)

---

## 📊 테스트 결과

### 로컬 샌드박스 테스트 (2026-03-19)

```bash
✅ test_demo@albi-test.com → 로그인 성공
✅ test_user@albi-test.com → 로그인 성공
✅ test_albi@albi-test.com → 로그인 성공
```

**응답 예시:**
```json
{
  "success": true,
  "message": "테스트 계정 로그인 성공",
  "data": {
    "userId": "test_demo",
    "name": "테스트 사용자 (test_demo)",
    "email": "test_demo@albi-test.com",
    "phone": null,
    "userType": "jobseeker",
    "points": 1000,
    "isVerified": 1,
    "sessionToken": "test_session_1773902751114_m0qx3r",
    "isTestAccount": true
  }
}
```

---

## 🌐 배포 상태

### GitHub
```
✅ Repository: https://github.com/sks4266-bit/albi-app
✅ Branch: main
✅ Latest Commit: e6b0625
✅ Status: Pushed successfully
```

### Cloudflare Pages
```
⏳ Auto-deployment in progress...
⏳ ETA: 3-5 minutes
🎯 Production URL: https://albi.kr/test-account
```

---

## 📁 수정된 파일

### 1. `/public/test-account.html`
- 랜덤 계정 생성 → 3개 고정 계정 순환
- 페이지 로드 시 localStorage 확인
- "새 계정 생성" → "다른 테스트 계정으로 전환"
- 녹색 안내 박스 추가

### 2. `/functions/api/auth/[[path]].ts`
- 비밀번호 길이 검증: `=== 8` → `>= 8 && <= 20`
- 패턴 유지: `Test*123`

### 3. `/dist/test-account.html`
- public 폴더와 동일하게 업데이트

---

## 🎯 사용 시나리오

### 시나리오 1: 간단 테스트
```
1. https://albi.kr/test-account 접속
2. "로그인 페이지로 이동" 클릭
3. 표시된 이메일/비밀번호로 로그인
4. 서비스 테스트
```

### 시나리오 2: 여러 계정 테스트
```
1. https://albi.kr/test-account 접속
2. 첫 번째 계정으로 로그인 & 테스트
3. 로그아웃
4. 테스트 계정 페이지로 돌아가기
5. "다른 테스트 계정으로 전환" 클릭
6. 두 번째 계정으로 로그인 & 테스트
```

### 시나리오 3: 결제 테스트
```
1. 테스트 계정으로 로그인
2. "결제 페이지로 이동" 클릭
3. 플랜 선택
4. 아임포트 테스트 카드로 결제
5. 구독 관리 페이지에서 확인
```

---

## 🔐 보안 특징

### 테스트 계정 제한
- ✅ 도메인: `@albi-test.com`만 허용
- ✅ 비밀번호 패턴: `Test*123` 고정
- ✅ DB 저장: 없음 (메모리만)
- ✅ 세션: 24시간 자동 만료
- ✅ 포인트: 고정 1000 (실제 충전/차감 없음)
- ✅ 권한: jobseeker (구직자)만

### 일반 계정과의 차이

| 항목 | 일반 사용자 | 테스트 계정 |
|------|-------------|-------------|
| 이메일 | 자유 | `@albi-test.com` |
| 비밀번호 | 자유 | `Test*123` 패턴 |
| DB 저장 | ✅ 저장 | ❌ 저장 안 됨 |
| 세션 기간 | 7일/30일 | **24시간** |
| 포인트 | 실제 충전 | 고정 1000 |
| 사용 목적 | 실제 서비스 | 테스트/데모 |

---

## 📝 참고 사항

### localStorage 저장 내용
```javascript
{
  test_user_id: "test_demo_001",
  test_email: "test_demo@albi-test.com",
  test_password: "TestDemo123"
}
```

### 새로고침 동작
1. 페이지 새로고침
2. localStorage에서 저장된 이메일 확인
3. 3개 고정 계정 중 일치하는 계정 찾기
4. 일치하면 해당 계정 표시
5. 없으면 첫 번째 계정 표시

### 계정 전환 동작
1. "다른 테스트 계정으로 전환" 버튼 클릭
2. currentAccountIndex 증가 (0→1→2→0...)
3. 새 계정 정보 표시
4. localStorage 업데이트
5. 알림 표시: "테스트 계정이 변경되었습니다!"

---

## ✅ 체크리스트

### 기능 검증
- ✅ 3개 고정 계정 정의
- ✅ 페이지 로드 시 localStorage 확인
- ✅ 계정 전환 버튼 작동
- ✅ 새로고침 시 계정 유지
- ✅ 로그인 API 성공
- ✅ 모든 3개 계정 로그인 테스트 통과

### 보안 검증
- ✅ 도메인 제한 (`@albi-test.com`)
- ✅ 비밀번호 패턴 검증
- ✅ DB 저장 안 함 확인
- ✅ 세션 24시간 제한

### UI/UX 검증
- ✅ 녹색 안내 박스 표시
- ✅ 버튼 텍스트 명확화
- ✅ 복사 버튼 작동
- ✅ 알림 메시지 표시

---

## 🚀 다음 단계

### 프로덕션 배포 대기 중...
1. ⏳ Cloudflare Pages 자동 빌드 & 배포
2. ⏳ 배포 완료까지 약 3-5분
3. 🎯 배포 후 https://albi.kr/test-account 에서 테스트

### 배포 완료 후 테스트
```bash
# 프로덕션 API 테스트
curl -X POST https://albi.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_demo@albi-test.com",
    "password": "TestDemo123",
    "remember": false
  }'
```

---

**작성 시간**: 2026-03-19  
**버전**: v1.3.0 (고정 테스트 계정)  
**GitHub**: https://github.com/sks4266-bit/albi-app  
**최신 커밋**: e6b0625

**프로덕션 URL**: https://albi.kr/test-account  
**샌드박스 URL**: https://3000-is6fz7wmwyawlr7nfbeuf-5c13a017.sandbox.novita.ai/test-account.html

---

**모든 질문에 대한 답변 완료!** ✅
- 새로고침 문제 해결 ✅
- 로그인 오류 수정 ✅
- 테스트 계정 3개 제공 ✅
