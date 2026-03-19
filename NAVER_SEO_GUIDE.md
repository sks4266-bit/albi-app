# 네이버 서치어드바이저 등록 가이드

## ✅ 완료된 SEO 최적화 작업

### 1. robots.txt 생성
- **위치**: https://albi.kr/robots.txt
- **내용**:
  - 네이버 검색로봇(Yeti) 허용
  - 구글 검색로봇(Googlebot) 허용
  - 크롤링 허용 페이지 명시 (index, jobs, contact, about 등)
  - 개인정보 페이지 제외 (mypage, admin)
  - 사이트맵 위치 명시

### 2. sitemap.xml 생성
- **위치**: https://albi.kr/sitemap.xml
- **포함 페이지**:
  - 메인 페이지 (priority: 1.0, changefreq: daily)
  - 일자리 목록 (priority: 0.9, changefreq: hourly)
  - 회원가입/로그인 (priority: 0.8)
  - 서비스 소개, 고객센터, 커뮤니티 등

### 3. SEO 메타태그 추가
**적용된 페이지**: index.html, jobs.html, contact.html, about.html

**포함된 태그**:
- `<title>` - 페이지별 최적화된 제목
- `<meta name="description">` - 검색결과 요약
- `<meta name="keywords">` - 검색 키워드
- `<meta name="robots">` - 크롤링 허용 설정
- Open Graph (og:*) - 소셜 미디어 공유
- Twitter Card - 트위터 공유
- Canonical URL - 중복 방지
- 구조화된 데이터 (JSON-LD) - 검색 노출 향상

### 4. 구조화된 데이터 (Structured Data)
- **WebSite Schema** (index.html)
  - 사이트 이름, URL, 설명
  - 검색 기능 연동
  
- **Organization Schema** (index.html)
  - 회사명, 로고, 연락처
  - 카카오톡 채널 링크

- **FAQPage Schema** (contact.html)
  - 21개 FAQ 중 주요 항목 구조화
  - 검색결과 리치 스니펫 노출

---

## 📌 네이버 서치어드바이저 등록 절차

### Step 1: 서치어드바이저 접속
1. https://searchadvisor.naver.com/ 접속
2. 네이버 계정으로 로그인

### Step 2: 사이트 등록
1. "웹마스터 도구" 클릭
2. "사이트 추가" 버튼 클릭
3. URL 입력: `https://albi.kr`
4. 사이트 소유 확인 방법 선택

### Step 3: 사이트 소유권 확인
**방법 1: HTML 파일 업로드 (권장)**
1. 네이버가 제공하는 HTML 파일 다운로드 (예: `naver1234567890.html`)
2. 파일을 `/home/user/webapp/public/` 폴더에 업로드
3. 배포 후 `https://albi.kr/navercb5d3cf557bbc11e0c789472046851d6.html` 접근 가능 확인
4. 네이버에서 "소유 확인" 버튼 클릭

**방법 2: 메타태그 추가**
1. 네이버가 제공하는 메타태그 복사 (예: `<meta name="naver-site-verification" content="xxxxx">`)
2. `index.html`의 `<head>` 섹션에 추가
3. 현재 코드에 이미 빈 태그가 준비되어 있음:
   ```html
   <meta name="naver-site-verification" content="여기에_코드_입력">
   ```
4. 배포 후 네이버에서 "소유 확인" 버튼 클릭

### Step 4: 사이트맵 제출
1. 서치어드바이저 > "요청" > "사이트맵 제출" 클릭
2. 사이트맵 URL 입력: `https://albi.kr/sitemap.xml`
3. "확인" 버튼 클릭

### Step 5: RSS 제출 (선택사항)
- 블로그나 뉴스가 있다면 RSS 피드 제출
- 알비는 현재 해당 없음

### Step 6: 수집 요청
1. "요청" > "URL 수집 요청" 클릭
2. 중요 페이지 URL 제출:
   - https://albi.kr/
   - https://albi.kr/jobs.html
   - https://albi.kr/contact.html
   - https://albi.kr/about.html

---

## 🔍 검증 및 모니터링

### 1. robots.txt 테스트
- 네이버 서치어드바이저 > "검증" > "robots.txt 검증"
- 구문 오류 확인
- 차단 규칙 테스트

### 2. 사이트맵 상태 확인
- "보고서" > "사이트맵" 메뉴에서 제출 상태 확인
- 수집된 URL 수 확인

### 3. 검색 노출 확인
- 등록 후 약 1~2주 소요
- 네이버에서 "site:albi.kr" 검색
- 색인된 페이지 확인

### 4. 검색 성과 분석
- "검색 성과" > "검색어" 메뉴
- 클릭수, 노출수, CTR 확인
- 인기 검색어 파악

---

## 📈 SEO 개선 권장사항

### 1. 콘텐츠 최적화
- [ ] 블로그/뉴스 섹션 추가 (알바 꿀팁, 면접 노하우)
- [ ] 각 지역별 알바 정보 페이지 생성
- [ ] 업종별 알바 가이드 작성

### 2. 키워드 최적화
**현재 타겟 키워드**:
- 알바, 아르바이트, 단기알바, 일용직
- 1시간 체험, 체험 알바
- 바로채용, 즉시채용
- 노쇼 방지, 신뢰 채용
- 내 주변 알바, 지도 알바

**추가 권장 키워드**:
- [지역명] + 알바 (예: 강남 알바, 홍대 알바)
- [업종] + 알바 (예: 편의점 알바, 카페 알바)
- [시급] + 알바 (예: 고시급 알바, 알바 시급)

### 3. 링크 빌딩
- [ ] 관련 커뮤니티에 서비스 소개
- [ ] 구인구직 포털과 제휴
- [ ] 소셜 미디어 활성화

### 4. 모바일 최적화
- [x] 반응형 디자인 적용 완료
- [x] 모바일 속도 최적화
- [ ] AMP(Accelerated Mobile Pages) 적용 검토

### 5. 기술적 SEO
- [x] HTTPS 적용 (Cloudflare Pages)
- [x] 구조화된 데이터 추가
- [x] Canonical URL 설정
- [ ] 이미지 alt 태그 최적화
- [ ] 페이지 로딩 속도 개선 (Lazy Loading)

---

## 🎯 주요 검색어별 랜딩 페이지

| 검색어 | 랜딩 페이지 | 현재 상태 |
|--------|-------------|-----------|
| 알바 | index.html | ✅ 최적화 완료 |
| 알바 찾기 | jobs.html | ✅ 최적화 완료 |
| 알바 후기 | board.html | ⚠️ 메타태그 추가 필요 |
| 알바 수수료 | calculator.html | ⚠️ 메타태그 추가 필요 |
| 기프티콘 | store.html | ⚠️ 메타태그 추가 필요 |

---

## 📞 문제 해결

### Q1. robots.txt가 404 에러
- Cloudflare Pages 배포 확인
- `public/` 폴더에 파일 존재 여부 확인
- 캐시 삭제 후 재배포

### Q2. 사이트맵이 수집되지 않음
- XML 문법 오류 확인: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- 사이트맵 URL 정확성 확인
- robots.txt에 Sitemap 경로 명시 여부 확인

### Q3. 검색 노출이 안됨
- 소유권 확인 완료 여부
- 최소 1~2주 대기 필요
- robots.txt에서 차단하지 않았는지 확인
- 중복 콘텐츠 문제 확인

---

## 📚 참고 자료

### 네이버 공식 문서
- 로봇 접근 가능성: https://searchadvisor.naver.com/guide/seo-basic-robots
- JavaScript SEO: https://searchadvisor.naver.com/guide/seo-advanced-javascript
- 검색 최적화 가이드: https://searchadvisor.naver.com/guide/seo-basic-intro

### 도구
- 네이버 서치어드바이저: https://searchadvisor.naver.com/
- 구글 서치 콘솔: https://search.google.com/search-console
- XML Sitemap 검증: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- 구조화된 데이터 테스트: https://search.google.com/test/rich-results

---

## ✅ 체크리스트

### 즉시 실행 항목
- [ ] 네이버 서치어드바이저 계정 생성
- [ ] 사이트 소유권 확인 (HTML 파일 or 메타태그)
- [ ] 사이트맵 제출
- [ ] 주요 URL 수집 요청 (4개)

### 단기 목표 (1주일)
- [ ] 검색 노출 확인
- [ ] 나머지 HTML 페이지에 SEO 메타태그 추가
- [ ] 이미지 alt 태그 최적화

### 중기 목표 (1개월)
- [ ] 블로그/뉴스 섹션 추가
- [ ] 지역별/업종별 콘텐츠 확장
- [ ] 검색 성과 분석 및 키워드 최적화

### 장기 목표 (3개월)
- [ ] 검색 순위 모니터링
- [ ] 백링크 확보
- [ ] 콘텐츠 마케팅 전략 수립

---

**마지막 업데이트**: 2026-02-20
**담당자**: 개발팀
**상태**: ✅ 기본 SEO 설정 완료, 네이버 등록 대기
