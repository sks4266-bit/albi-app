# 구글 서치 콘솔(Google Search Console) 등록 가이드

## ✅ 완료된 구글 SEO 최적화 작업

### 1. robots.txt 설정
- **위치**: https://albi.kr/robots.txt
- Googlebot 허용 설정 완료
- 사이트맵 위치 명시

### 2. sitemap.xml 생성
- **위치**: https://albi.kr/sitemap.xml
- 22개 페이지 포함
- 구글 표준 형식 준수

### 3. 메타태그 최적화
- `robots` 메타태그 (max-image-preview, max-snippet)
- `googlebot` 전용 메타태그
- 언어 및 지역 태그 (ko, KR)
- Open Graph & Twitter Card

### 4. 구조화된 데이터 (Schema.org)
- **WebSite** - 사이트 정보 및 검색 기능
- **Organization** - 회사 정보, 연락처, 로고, 평점
- **WebApplication** - 웹앱 정보, 가격 정보

### 5. 성능 최적화
- HTTP/2 지원 (Cloudflare Pages)
- HTTPS 보안 연결
- 모바일 반응형 디자인
- 이미지 최적화 권장

---

## 📌 구글 서치 콘솔 등록 절차

### Step 1: 구글 서치 콘솔 접속
1. https://search.google.com/search-console 접속
2. 구글 계정으로 로그인

### Step 2: 속성 추가
1. 좌측 상단 "속성 추가" 클릭
2. **도메인** 또는 **URL 접두어** 선택

#### Option A: 도메인 (권장)
- 입력: `albi.kr`
- 모든 서브도메인, HTTP/HTTPS 자동 포함
- DNS 인증 필요 (TXT 레코드 추가)

#### Option B: URL 접두어 (간단)
- 입력: `https://albi.kr`
- HTTPS만 추적
- HTML 태그 인증 가능

### Step 3: 소유권 확인

#### 방법 1: HTML 태그 (권장 - 이미 준비됨)
1. 구글이 제공하는 메타태그 복사
   ```html
   <meta name="google-site-verification" content="여기에_코드">
   ```
2. `index.html`의 `<head>` 섹션에 추가 (이미 빈 태그 준비됨)
3. 배포 후 구글에서 "확인" 버튼 클릭

#### 방법 2: HTML 파일 업로드
1. 구글이 제공하는 HTML 파일 다운로드
2. `/home/user/webapp/public/` 폴더에 업로드
3. 배포 후 확인

#### 방법 3: DNS TXT 레코드 (도메인 속성용)
1. Cloudflare DNS 관리 페이지 접속
2. TXT 레코드 추가
   - 이름: `@`
   - 값: 구글이 제공한 코드
3. 구글에서 확인

### Step 4: 사이트맵 제출
1. 서치 콘솔 > **색인 생성** > **Sitemaps** 메뉴
2. 사이트맵 URL 입력: `https://albi.kr/sitemap.xml`
3. "제출" 버튼 클릭

### Step 5: URL 검사 (선택사항)
중요한 페이지를 개별 검사:
1. 상단 검색창에 URL 입력
   - `https://albi.kr/`
   - `https://albi.kr/jobs.html`
2. "URL 검사" 실행
3. "색인 생성 요청" 클릭

---

## 🔍 구글 vs 네이버 차이점

| 항목 | 구글 | 네이버 |
|------|------|--------|
| 크롤링 속도 | 빠름 (1~3일) | 보통 (1~2주) |
| 구조화 데이터 | Schema.org 중시 | 덜 중시 |
| 모바일 우선 | 매우 중요 | 중요 |
| 페이지 속도 | 랭킹 요소 | 덜 중요 |
| 백링크 | 매우 중요 | 덜 중요 |
| 콘텐츠 품질 | AI 분석 | 키워드 중심 |

---

## 📊 구글 최적화 체크리스트

### ✅ 기술적 SEO
- [x] robots.txt 설정
- [x] sitemap.xml 제출
- [x] HTTPS 적용
- [x] 모바일 반응형
- [x] 구조화된 데이터
- [ ] Core Web Vitals 최적화
- [ ] AMP 적용 (선택)

### ✅ 콘텐츠 SEO
- [x] 페이지별 고유 title
- [x] 페이지별 고유 description
- [x] 적절한 heading 구조 (H1, H2, H3)
- [ ] 이미지 alt 태그
- [ ] 내부 링크 구조
- [ ] 콘텐츠 길이 (최소 300단어)

### ✅ 로컬 SEO (한국)
- [x] 언어 태그 (ko)
- [x] 지역 태그 (KR)
- [ ] Google My Business 등록
- [ ] 지역 키워드 최적화

---

## 🎯 구글 검색 노출 전략

### 1. 키워드 전략
**주요 키워드**:
- 알바, 아르바이트 (검색량: 매우 높음)
- 단기알바, 일용직 (검색량: 높음)
- 1시간 체험 알바 (경쟁: 낮음, 차별화)
- 바로채용 (검색량: 중간)
- 알바 노쇼 (롱테일 키워드)

**롱테일 키워드**:
- "[지역] + 알바" (예: 강남 알바, 홍대 알바)
- "[업종] + 알바" (예: 편의점 알바, 카페 알바)
- "체험 가능한 알바"
- "노쇼 없는 알바 플랫폼"

### 2. 콘텐츠 제작
- [ ] 블로그 섹션 추가
- [ ] 알바 꿀팁 가이드
- [ ] 면접 준비 방법
- [ ] 이력서 작성법
- [ ] 업종별 알바 가이드

### 3. 백링크 확보
- [ ] 관련 커뮤니티 참여
- [ ] 구인구직 사이트 연동
- [ ] 보도자료 배포
- [ ] SNS 마케팅

---

## 📈 성과 측정 도구

### 1. 구글 서치 콘솔
- 검색어 통계
- 클릭률(CTR)
- 노출수
- 평균 게재 순위

### 2. 구글 애널리틱스 (GA4)
설치 권장:
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. PageSpeed Insights
- URL: https://pagespeed.web.dev/
- 성능 점수 확인
- 개선 제안 확인

### 4. Mobile-Friendly Test
- URL: https://search.google.com/test/mobile-friendly
- 모바일 최적화 확인

---

## 🚀 빠른 색인 요청 방법

### 방법 1: URL 검사 도구
1. 서치 콘솔 상단 검색창
2. URL 입력 후 검사
3. "색인 생성 요청"

### 방법 2: Indexing API (개발자용)
- 대량 URL 색인 요청
- API 키 필요
- 프로그래밍 지식 필요

---

## 📝 정기 점검 사항

### 매주
- [ ] 서치 콘솔 실적 확인
- [ ] 크롤링 오류 확인
- [ ] 새 페이지 색인 상태 확인

### 매월
- [ ] 키워드 순위 모니터링
- [ ] 경쟁사 분석
- [ ] 콘텐츠 업데이트

### 분기별
- [ ] SEO 전략 재검토
- [ ] 기술적 SEO 감사
- [ ] 백링크 분석

---

## 🔧 자주 발생하는 문제

### Q1. 색인이 안됨
**원인**:
- robots.txt 차단
- noindex 메타태그
- 서버 오류 (500)
- 중복 콘텐츠

**해결**:
- robots.txt 검증
- 메타태그 확인
- URL 검사 도구 사용

### Q2. 순위가 낮음
**원인**:
- 콘텐츠 품질
- 페이지 속도
- 모바일 최적화 부족
- 백링크 부족

**해결**:
- 콘텐츠 개선
- Core Web Vitals 최적화
- 모바일 UX 개선
- 링크 빌딩

### Q3. 클릭률(CTR)이 낮음
**원인**:
- 제목이 매력적이지 않음
- 설명이 불충분
- 리치 스니펫 부족

**해결**:
- title, description 최적화
- 구조화된 데이터 추가
- FAQ, 평점 등 리치 스니펫

---

## 📚 참고 자료

### 구글 공식 문서
- Search Console 도움말: https://support.google.com/webmasters
- SEO 가이드: https://developers.google.com/search/docs
- Schema.org: https://schema.org/

### 도구
- 구글 서치 콘솔: https://search.google.com/search-console
- PageSpeed Insights: https://pagespeed.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- Rich Results Test: https://search.google.com/test/rich-results

---

## ✅ 다음 단계

### 즉시 실행
1. [ ] 구글 서치 콘솔 계정 생성
2. [ ] 속성 추가 (albi.kr)
3. [ ] 소유권 확인 (HTML 태그)
4. [ ] 사이트맵 제출

### 1주일 내
1. [ ] 구글 애널리틱스 설치
2. [ ] PageSpeed 점수 확인 및 개선
3. [ ] 이미지 alt 태그 추가

### 1개월 내
1. [ ] 블로그 콘텐츠 작성 시작
2. [ ] 백링크 확보 전략 수립
3. [ ] 검색 성과 분석

---

**마지막 업데이트**: 2026-02-20  
**담당자**: 개발팀  
**상태**: ✅ 기본 최적화 완료, 구글 서치 콘솔 등록 대기
