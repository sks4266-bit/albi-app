# 🚨 Google OAuth 에러 해결 가이드

## ❌ 발생한 문제

**에러 메시지**: "액세스 차단: 알림은(는) 조직 내에서만 사용할 수 있습니다"

**원인**: Google OAuth 동의 화면이 **"내부"** 사용자 유형으로 설정되어 있음

**영향**: Google Workspace 조직 내부 사용자만 로그인 가능

---

## ✅ 해결 방법

### **방법 1: OAuth 동의 화면을 "외부"로 변경 (권장)**

#### **Step 1: Google Cloud Console 접속**
1. https://console.cloud.google.com 접속
2. 올바른 프로젝트 선택 (알비 프로젝트)

#### **Step 2: OAuth 동의 화면 설정**
1. 좌측 메뉴 → **"API 및 서비스"** → **"OAuth 동의 화면"**
2. 현재 설정 확인:
   - **사용자 유형**: "내부" 또는 "외부"
   - 현재는 "내부"로 설정되어 있음

#### **Step 3: 사용자 유형 변경**

**⚠️ 중요**: "내부"에서 "외부"로 변경할 수 없는 경우, OAuth 클라이언트를 다시 만들어야 합니다.

##### **Option A: 사용자 유형 변경 가능한 경우**
1. "사용자 유형 수정" 또는 "편집" 버튼 클릭
2. **"외부"** 선택
3. "저장" 클릭

##### **Option B: 사용자 유형 변경 불가능한 경우 (새 프로젝트 생성)**

**1단계: 새 프로젝트 생성**
```
1. Google Cloud Console 상단 → 프로젝트 선택 드롭다운
2. "새 프로젝트" 클릭
3. 프로젝트 이름: "albi-app-public" (또는 원하는 이름)
4. "만들기" 클릭
```

**2단계: Cloud Vision API 활성화**
```
1. 좌측 메뉴 → "API 및 서비스" → "라이브러리"
2. "Cloud Vision API" 검색
3. "사용 설정" 클릭
```

**3단계: OAuth 동의 화면 설정 (외부)**
```
1. 좌측 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
2. 사용자 유형: "외부" 선택
3. "만들기" 클릭

앱 정보 입력:
- 앱 이름: 알비 (Albi)
- 사용자 지원 이메일: [your-email@gmail.com]
- 앱 로고: (선택 사항)
- 앱 도메인:
  - 앱 홈페이지: https://albi-app.pages.dev
  - 개인정보처리방침: https://albi-app.pages.dev/privacy
  - 서비스 약관: https://albi-app.pages.dev/terms
- 승인된 도메인: albi-app.pages.dev
- 개발자 연락처 이메일: [your-email@gmail.com]

"저장 후 계속" 클릭

범위 설정:
- "범위 추가 또는 삭제" 클릭
- 다음 범위 선택:
  - .../auth/userinfo.email
  - .../auth/userinfo.profile
  - openid
- "업데이트" 클릭
- "저장 후 계속" 클릭

테스트 사용자: (선택 사항)
- 테스트 모드에서는 테스트 사용자만 로그인 가능
- 프로덕션 모드로 전환하려면 "앱 게시" 필요
- "저장 후 계속" 클릭

요약:
- 설정 확인 후 "대시보드로 돌아가기" 클릭
```

**4단계: OAuth 2.0 클라이언트 ID 생성**
```
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: "albi-web-client"

승인된 JavaScript 원본:
- https://albi-app.pages.dev
- https://3000-is6fz7wmwyawlr7nfbeuf-5c13a017.sandbox.novita.ai

승인된 리디렉션 URI:
- https://albi-app.pages.dev/api/auth/google/callback
- https://3000-is6fz7wmwyawlr7nfbeuf-5c13a017.sandbox.novita.ai/api/auth/google/callback

"만들기" 클릭

클라이언트 ID와 클라이언트 보안 비밀번호 복사
```

**5단계: Vision API 키 생성**
```
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "API 키"
3. API 키 복사
4. "키 제한" 클릭:
   - API 제한사항: "키 제한"
   - "Cloud Vision API" 선택
   - "저장"
```

**6단계: Cloudflare Pages에 새 자격 증명 등록**
```bash
# 새 OAuth 클라이언트 ID 등록
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name albi-app
# [새 클라이언트 ID 입력]

# 새 OAuth 시크릿 등록
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name albi-app
# [새 클라이언트 시크릿 입력]

# 새 Vision API 키 등록
npx wrangler pages secret put GOOGLE_VISION_API_KEY --project-name albi-app
# [새 API 키 입력]
```

**7단계: 재배포**
```bash
cd /home/user/webapp
npx wrangler pages deploy public --project-name albi-app
```

---

### **방법 2: 테스트 사용자 추가 (임시 해결)**

현재 "내부" 설정을 유지하면서 특정 사용자만 테스트하는 방법:

#### **Step 1: OAuth 동의 화면 → 테스트 사용자**
```
1. Google Cloud Console → OAuth 동의 화면
2. "테스트 사용자" 섹션 → "+ ADD USERS"
3. 테스트할 Google 계정 이메일 추가
4. "저장" 클릭
```

**제한사항**:
- 최대 100명의 테스트 사용자만 추가 가능
- 일반 사용자는 로그인 불가
- 프로덕션 환경에는 적합하지 않음

---

### **방법 3: OAuth 동의 화면 "게시" (외부 모드 후)**

외부 모드로 변경한 후, 모든 사용자가 로그인할 수 있도록 앱을 게시:

#### **Step 1: 게시 상태 확인**
```
1. Google Cloud Console → OAuth 동의 화면
2. 게시 상태:
   - "테스트 중" → 테스트 사용자만 로그인 가능
   - "프로덕션" → 모든 사용자 로그인 가능
```

#### **Step 2: 앱 게시**
```
1. "앱 게시" 버튼 클릭
2. 확인 메시지 읽고 "확인" 클릭
```

**⚠️ 주의**:
- 민감한 범위(예: Gmail, Drive)를 사용하는 경우 Google 검토 필요
- 기본 범위(email, profile)만 사용하면 즉시 게시 가능
- 검토는 수 일 ~ 수 주 소요

---

## 📋 권장 설정

### **최종 OAuth 동의 화면 설정**

```
사용자 유형: 외부
게시 상태: 프로덕션 (또는 테스트)

앱 정보:
- 앱 이름: 알비 (Albi)
- 사용자 지원 이메일: [your-email]
- 승인된 도메인: albi-app.pages.dev
- 개발자 연락처: [your-email]

범위:
- .../auth/userinfo.email
- .../auth/userinfo.profile
- openid

테스트 사용자: (프로덕션 모드 시 불필요)
```

---

## 🧪 테스트 방법

### **Step 1: 설정 변경 후 테스트**
```
1. 브라우저 시크릿 모드 (Ctrl+Shift+N)
2. https://albi-app.pages.dev/login.html 접속
3. "Google로 계속하기" 클릭
4. 결과 확인:
   - ✅ 성공: Google 계정 선택 화면
   - ❌ 실패: 여전히 "액세스 차단" 에러
```

### **Step 2: 다른 Google 계정으로 테스트**
```
1. 조직 계정이 아닌 개인 Gmail 계정 사용
2. 동일한 절차 반복
```

---

## 🎯 빠른 체크리스트

### **현재 상황 확인**
- [ ] Google Cloud Console 접속
- [ ] OAuth 동의 화면 → 사용자 유형 확인
- [ ] "내부" 또는 "외부" 확인

### **해결 방법 선택**
- [ ] **방법 1**: 사용자 유형을 "외부"로 변경 (권장)
- [ ] **방법 2**: 테스트 사용자 추가 (임시)
- [ ] **방법 3**: 새 프로젝트 생성 후 "외부" 설정

### **설정 후 확인**
- [ ] 시크릿 모드에서 로그인 테스트
- [ ] 개인 Gmail 계정으로 테스트
- [ ] 에러 메시지 사라짐 확인

---

## 💡 추가 팁

### **Google Workspace 조직 계정인 경우**
- 조직 관리자만 "내부"를 "외부"로 변경 가능
- 권한이 없다면 새 개인 프로젝트 생성 권장

### **테스트 vs 프로덕션**
- **테스트 모드**: 최대 100명, 테스트 사용자만 로그인
- **프로덕션 모드**: 무제한, 모든 사용자 로그인

### **검토 필요 여부**
- 기본 범위 (email, profile, openid): 검토 불필요, 즉시 게시
- 민감한 범위 (Gmail, Drive, Calendar): Google 검토 필요

---

## 🚀 다음 단계

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com

2. **OAuth 동의 화면 확인**
   - API 및 서비스 → OAuth 동의 화면
   - 사용자 유형: "내부" → "외부"로 변경

3. **설정 변경 후 알려주세요**
   - 새 클라이언트 ID와 시크릿을 받으면 등록 도와드리겠습니다

4. **테스트**
   - 시크릿 모드로 다시 테스트

---

**🎯 핵심**: OAuth 동의 화면을 "외부" 모드로 설정해야 합니다!

설정을 변경하신 후 새 클라이언트 ID를 알려주시면, Cloudflare Pages에 등록하고 재배포하겠습니다.
