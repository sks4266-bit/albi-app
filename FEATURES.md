# 알비(ALBI) 전체 기능 목록

## 🎯 핵심 기능 (Core Features)

### 1. 회원 인증 시스템
- ✅ 이메일/비밀번호 회원가입
- ✅ SMS 휴대폰 인증 (CoolSMS 연동 준비)
- ✅ 소셜 로그인 준비 (카카오, 네이버, 구글)
- ✅ JWT 세션 관리
- ✅ 비밀번호/이메일 찾기
- ✅ 로그인 유지 (Remember Me)

### 2. AI 면접 시스템
- ✅ 직무별 맞춤 질문 (5개 업종)
- ✅ 50개 예외 시나리오 처리
- ✅ 실시간 점수 계산 (신뢰도, 직무 적합도, 서비스 마인드, 근무조건)
- ✅ 등급 평가 (S, A, B, C, F)
- ✅ 한 줄 평가 자동 생성

### 3. AI 공고 추천
- ✅ 면접 결과 기반 매칭
- ✅ 점수 계산 (직무 +30, 등급 보너스, 시급 보너스, 지역 +10)
- ✅ 매칭 점수 표시 (90+ 최고, 75-89 우수, 60-74 좋음)
- ✅ 실시간 정렬 (매칭도, 시급, 최신순)
- ✅ 바로 체험 신청

### 4. 1시간 시각체험
- ✅ 10 포인트 차감 신청
- ✅ 날짜/시간 선택
- ✅ 구인자 승인/거절 시스템
- ✅ 체험 관리 페이지 (구직자/구인자)
- ✅ 실시간 알림

### 5. 알비포인트 시스템
- ✅ 회원가입: 50P
- ✅ AI 면접 완료: 30P
- ✅ 체험 완료: 최대 50P
- ✅ 포인트 거래 내역
- ✅ 자동 차감/적립

### 6. 포인트 스토어
- ✅ 12종 기프티콘 구매
- ✅ 잔액 조회
- ✅ 자동 차감
- ✅ 코드 발급
- ✅ 구매 내역 저장

**상품 목록:**
- 스타벅스 (50P-100P)
- GS25/CU (100P)
- CGV (200P)
- BBQ/도미노 (300P)
- 올리브영 등

### 7. 공고 관리
- ✅ 공고 등록 (구인자)
- ✅ 공고 검색/필터
- ✅ 카테고리별 분류
- ✅ 지역별 검색
- ✅ 시급순 정렬
- ✅ 긴급 채용 표시

### 8. 알림 시스템
- ✅ 실시간 알림
- ✅ 읽음/안읽음 상태
- ✅ 알림 카테고리 (체험, 포인트, 시스템)
- ✅ 브라우저 알림 (선택)

## 🎨 UX/UI 기능 (최근 추가)

### 9. 통일된 푸터 시스템 ✨NEW
- ✅ 회사 정보 API 연동
- ✅ 12개 주요 페이지 자동 적용
- ✅ 동적 로딩
- ✅ 반응형 디자인

### 10. 에러 페이지 ✨NEW
- ✅ 404 페이지 (페이지 없음)
  - 검색 기능
  - 빠른 이동 버튼
  - 애니메이션
- ✅ 500 페이지 (서버 오류)
  - 자동 재시도
  - 문제 해결 가이드
  - 카운트다운

### 11. 로딩 애니메이션 시스템 ✨NEW
- ✅ 전역 로딩 오버레이
- ✅ 3가지 스타일 (circle, dots, pulse)
- ✅ 스켈레톤 로딩
- ✅ 버튼 로딩 상태
- ✅ API 자동 로딩
- ✅ 프로그레스 바

### 12. 실시간 AI 챗봇 ✨NEW
- ✅ 키워드 기반 자동 응답
- ✅ 빠른 답변 버튼
- ✅ 타이핑 애니메이션
- ✅ 모바일 최적화
- ✅ 읽지 않은 메시지 뱃지

**챗봇 응답 카테고리:**
- 포인트 적립 방법
- 체험 신청 안내
- 기프티콘 교환
- 고객센터 연결

### 13. 고객센터 페이지 리뉴얼 ✨
- ✅ 3가지 상담 채널 (이메일, 전화, 카카오톡)
- ✅ 카테고리별 FAQ 12개
  - 포인트 (2개)
  - 체험 (3개)
  - 결제 (2개)
  - 계정 (3개)
- ✅ FAQ 필터 기능
- ✅ 회사 정보 동적 표시
- ✅ 운영 시간 안내

### 14. 회사 정보 API ✨
- ✅ DB 연동
- ✅ Fallback 로직
- ✅ CORS 지원
- ✅ 실시간 업데이트

## 🗄️ 데이터베이스

### 주요 테이블 (18개)
1. `users` - 사용자 정보
2. `sessions` - 세션 관리
3. `jobs` - 공고 정보
4. `experiences` - 체험 예약
5. `interview_results` - AI 면접 결과
6. `point_transactions` - 포인트 거래
7. `store_purchases` - 스토어 구매
8. `notifications` - 알림
9. `sms_verifications` - SMS 인증
10. `password_reset_tokens` - 비밀번호 재설정
11. 기타 8개 테이블...

## 📊 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 내 정보
- `POST /api/auth/verify-phone` - 휴대폰 인증

### 공고 (Jobs)
- `GET /api/jobs` - 공고 목록
- `GET /api/jobs/:id` - 공고 상세
- `POST /api/jobs` - 공고 등록
- `GET /api/jobs/recommended` - 추천 공고 ✨

### 체험 (Experiences)
- `POST /api/experiences` - 체험 신청
- `GET /api/experiences/my` - 내 체험
- `PATCH /api/experiences/:id` - 체험 승인/거절

### 포인트 (Points)
- `GET /api/points/balance` - 잔액 조회
- `GET /api/points/transactions` - 거래 내역
- `POST /api/points/earn` - 포인트 적립

### 스토어 (Store)
- `GET /api/store/products` - 상품 목록
- `POST /api/store/purchase` - 구매
- `GET /api/store/purchases` - 구매 내역

### 기타
- `GET /api/company-info` - 회사 정보 ✨NEW
- `GET /api/notifications` - 알림 목록
- `POST /api/interview/submit` - 면접 제출

## 🎯 통계

### 코드
- **Frontend**: ~20k 라인
- **Backend**: ~6k 라인
- **SQL**: ~1.5k 라인
- **총합**: ~27.5k 라인

### 파일
- **HTML 페이지**: 39개
- **API 엔드포인트**: 40+개
- **CSS 파일**: 5개 (공통 스타일)
- **JS 파일**: 6개 (공통 유틸리티)

### 기능
- **핵심 기능**: 8개
- **UX/UI 기능**: 6개 ✨NEW
- **API**: 40+개
- **테이블**: 18개

## 🚀 배포 정보

- **플랫폼**: Cloudflare Pages
- **데이터베이스**: Cloudflare D1 (SQLite)
- **인증**: JWT
- **스토리지**: 준비 완료 (R2)
- **최신 배포**: https://ba4e7b47.albi-app.pages.dev

## 📦 의존성

### Frontend
- Tailwind CSS (CDN)
- Font Awesome (CDN)
- Axios (CDN)

### Backend
- Hono
- Cloudflare Workers
- D1 Database

## 🎓 문서

- `README.md` - 프로젝트 개요 및 사용법
- `CLOUDFLARE_SETUP.md` - D1 바인딩 설정 가이드 ✨NEW
- `FEATURES.md` - 전체 기능 목록 (이 파일) ✨NEW

---

**모든 핵심 기능 + UX 개선이 완료되었습니다!** 🎉
