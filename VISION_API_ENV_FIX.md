# 🔧 Vision API 환경 변수 문제 해결

## ❌ 발생한 문제

**증상**: 
- Console 로그: "⚠️ GOOGLE_VISION_API_KEY가 설정되지 않았습니다. Mock 데이터를 사용합니다."
- Vision API가 호출되지 않고 Mock 데이터 사용
- 회원가입 페이지와 마이페이지 모두 동일한 문제

**원인**:
- Cloudflare Pages 환경 변수가 Functions에 제대로 바인딩되지 않음
- 배포 후 환경 변수 적용 지연

---

## ✅ 해결 조치

### **1. 환경 변수 재등록**
```bash
# 기존 시크릿 삭제
npx wrangler pages secret delete GOOGLE_VISION_API_KEY --project-name albi-app

# 새로 등록
npx wrangler pages secret put GOOGLE_VISION_API_KEY --project-name albi-app
# 입력: AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU
```

### **2. 디버깅 로그 추가**
OCR API에 환경 변수 확인 로그 추가:
```javascript
console.log('GOOGLE_VISION_API_KEY exists:', !!env.GOOGLE_VISION_API_KEY);
console.log('GOOGLE_VISION_API_KEY length:', env.GOOGLE_VISION_API_KEY?.length || 0);
console.log('GOOGLE_VISION_API_KEY first 20 chars:', env.GOOGLE_VISION_API_KEY?.substring(0, 20) || 'N/A');
```

### **3. 재배포 완료**
- 최신 배포: https://0eb4ac16.albi-app.pages.dev
- 메인 도메인: https://albi-app.pages.dev

---

## 🧪 재테스트 방법

### **Step 1: 브라우저 캐시 완전 삭제 (중요!)**

```
1. Ctrl+Shift+Delete (Chrome)
2. 시간 범위: "전체 기간" 선택
3. 체크 항목:
   ✅ 쿠키 및 기타 사이트 데이터
   ✅ 캐시된 이미지 및 파일
4. "데이터 삭제" 클릭
5. 브라우저 완전 종료 후 재시작
```

### **Step 2: 시크릿 모드로 테스트**

```
1. Ctrl+Shift+N (시크릿 창)
2. https://albi-app.pages.dev/mypage.html 접속
3. F12 → Console 탭
4. 구인자 인증 탭 → 파일 업로드
```

### **Step 3: 새로운 로그 확인**

**예상 로그 (성공 시):**
```javascript
========================================
🔍 [OCR API] 환경 변수 체크
========================================
GOOGLE_VISION_API_KEY exists: true      ⬅️ 이게 true여야 함!
GOOGLE_VISION_API_KEY length: 39
GOOGLE_VISION_API_KEY first 20 chars: AIzaSyAGuTVdueQRdc_
========================================

🔍 Google Cloud Vision API 호출 시작...
🔑 API Key exists: true
📡 Vision API response status: 200
✅ Google Vision OCR 성공
```

**예상 로그 (여전히 실패 시):**
```javascript
========================================
🔍 [OCR API] 환경 변수 체크
========================================
GOOGLE_VISION_API_KEY exists: false     ⬅️ 여전히 false
GOOGLE_VISION_API_KEY length: 0
GOOGLE_VISION_API_KEY first 20 chars: N/A
========================================

⚠️ GOOGLE_VISION_API_KEY가 설정되지 않았습니다.
```

---

## 🔍 실시간 로그 확인 방법

### **방법 1: Cloudflare Dashboard**
```
1. https://dash.cloudflare.com 접속
2. Pages → albi-app 선택
3. Analytics → Functions Logs
4. 실시간 로그 확인
```

### **방법 2: Wrangler CLI (터미널에서)**
```bash
# 실시간 로그 스트리밍
npx wrangler pages deployment tail --project-name albi-app

# 또는 특정 배포의 로그
npx wrangler pages deployment tail --project-name albi-app --deployment-id 0eb4ac16
```

---

## ⏱️ 환경 변수 적용 시간

**Cloudflare Pages에서 환경 변수 변경 후:**
- 새 배포: **즉시 적용**
- 기존 배포: **최대 5분** (CDN 캐시 때문)

**따라서:**
1. 배포 완료 후 **5분 대기**
2. 브라우저 캐시 완전 삭제
3. 시크릿 모드로 재테스트

---

## 🎯 체크리스트

### **환경 변수 확인**
- [x] `wrangler pages secret list` 확인 ✅
- [x] GOOGLE_VISION_API_KEY 재등록 ✅
- [x] 재배포 완료 ✅
- [ ] 5분 대기 ⬅️ **지금**
- [ ] 브라우저 캐시 삭제
- [ ] 시크릿 모드 재테스트

### **로그 확인**
- [ ] Console에서 "🔍 [OCR API] 환경 변수 체크" 확인
- [ ] "GOOGLE_VISION_API_KEY exists: true" 확인
- [ ] "📡 Vision API response status: 200" 확인
- [ ] "✅ Google Vision OCR 성공" 확인

---

## 🚨 여전히 실패하는 경우

### **대안 1: Cloudflare Dashboard에서 직접 설정**

```
1. https://dash.cloudflare.com 접속
2. Pages → albi-app
3. Settings → Environment variables
4. Production 탭 선택
5. "Add variable" 클릭:
   - Variable name: GOOGLE_VISION_API_KEY
   - Value: AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU
   - Type: Encrypted
6. "Save" 클릭
7. 재배포 (또는 자동 재배포 대기)
```

### **대안 2: 환경 변수를 vars에 추가 (비권장 - 보안상 문제)**

**주의**: API 키가 코드에 노출됨. 테스트 목적으로만 사용!

```toml
# wrangler.toml
[vars]
ENVIRONMENT = "production"
GOOGLE_VISION_API_KEY = "AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU"  # ⚠️ 테스트만!
```

테스트 후 반드시 제거하고 다시 secrets로 관리!

---

## 📊 디버깅 정보

### **현재 배포 정보**
- 배포 URL: https://0eb4ac16.albi-app.pages.dev
- 메인 도메인: https://albi-app.pages.dev
- 배포 시간: 2026-02-11 14:05 UTC
- 배포 ID: 0eb4ac16

### **환경 변수 상태**
```bash
npx wrangler pages secret list --project-name albi-app

출력:
✅ GOOGLE_CLIENT_ID: Value Encrypted
✅ GOOGLE_CLIENT_SECRET: Value Encrypted
✅ GOOGLE_VISION_API_KEY: Value Encrypted  ⬅️ 재등록 완료
```

### **API 키 정보**
- 키: AIzaSyAGuTVdueQRdc_gIBxvwlMp7kVl8NU3CSU
- 길이: 39자
- 형식: AIzaSy로 시작 (정상)
- 상태: 활성

---

## 🕐 지금 해야 할 일

1. **5분 대기** ⏰
   - 환경 변수가 CDN에 완전히 적용되도록 대기

2. **브라우저 캐시 완전 삭제**
   - Ctrl+Shift+Delete
   - 전체 기간
   - 모든 데이터 삭제

3. **시크릿 모드로 재테스트**
   ```
   https://albi-app.pages.dev/mypage.html
   ```

4. **Console 로그 확인**
   ```javascript
   // 이 로그가 보여야 함:
   GOOGLE_VISION_API_KEY exists: true
   GOOGLE_VISION_API_KEY length: 39
   ```

5. **결과 공유**
   - Console 전체 스크린샷
   - 특히 "환경 변수 체크" 섹션

---

## 🎯 예상 결과

### **성공 시 (5분 후)**
```javascript
✅ GOOGLE_VISION_API_KEY exists: true
✅ GOOGLE_VISION_API_KEY length: 39
✅ Vision API response status: 200
✅ Google Vision OCR 성공
```

### **여전히 실패 시**
```javascript
❌ GOOGLE_VISION_API_KEY exists: false
❌ GOOGLE_VISION_API_KEY length: 0

→ Cloudflare Dashboard에서 직접 설정 (대안 1)
```

---

**🕐 5분 후 재테스트를 진행해주세요!**

시간 경과 후 테스트 결과를 알려주시면, 추가 조치를 진행하겠습니다.
