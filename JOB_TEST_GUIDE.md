# 직무적성 심리테스트 사용 가이드

## 📋 개요
알비의 직무적성 심리테스트는 16문항, 4차원 분석을 통해 사용자의 업무 DNA를 파악하고, 맞춤형 커리어 로드맵과 채용 공고를 추천하는 시스템입니다.

## 🎯 주요 기능

### 1. 16문항 4차원 분석
- **Part 1 (Q1-Q4)**: 업무 행동 패턴 (Behavior)
- **Part 2 (Q5-Q8)**: 사고 및 문제해결 (Thinking)
- **Part 3 (Q9-Q12)**: 가치관 및 동기 (Values)
- **Part 4 (Q13-Q16)**: 환경 적응성 (Environment)
  - Q16은 역문항으로 일관성 검증에 활용

### 2. 4가지 성향 타입
- 🎯 **전략형 (Strategic Thinker)**: 큰 그림을 보고 장기 계획 수립
- 📊 **분석형 (Analytical Mind)**: 데이터 기반 의사결정
- 💬 **소통형 (Communicator)**: 팀워크와 관계 구축
- ⚡ **실행형 (Executor)**: 신속한 실행과 결과 도출

### 3. 복합형 지원 (6가지)
- 전략-분석형, 전략-소통형, 전략-실행형
- 분석-소통형, 분석-실행형, 소통-실행형

### 4. 신뢰도 판정
- **매우 높음 (95%)**: 점수 차이 ≥ 4점
- **높음 (85%)**: 점수 차이 = 3점
- **중간 (75%)**: 점수 차이 = 2점
- **복합형 (65%)**: 점수 차이 ≤ 1점

## 🚀 사용 방법

### 비로그인 사용자
1. https://albi.kr/job-test.html 접속
2. 16문항 테스트 완료 (약 5분 소요)
3. 결과 페이지에서 기본 정보 확인
4. **블러 처리된 상세 결과**가 2초 후 표시됨
5. 로그인 프롬프트 확인
6. 로그인하면 전체 결과 확인 가능

### 로그인 사용자
1. https://albi.kr/job-test.html 접속
2. 16문항 테스트 완료
3. **자동으로 마이페이지에 저장**
4. 전체 결과 즉시 확인:
   - 4차원 레이더 차트
   - 강점과 성장 포인트
   - 이상적인 업무 환경
   - 비슷한 현대인
   - 5년 커리어 로드맵
   - 3대 추천 포지션
   - 알비 맞춤 공고 3선

### 마이페이지에서 확인
1. https://albi.kr/mypage.html 접속
2. "적성 테스트" 탭 클릭
3. 저장된 테스트 결과 목록 확인
   - 최대 10개 결과 보관
   - 날짜별 정렬
   - 신뢰도 표시
   - 4차원 점수 요약
4. 결과 카드 클릭 시 상세 페이지로 이동

## 📊 결과 페이지 구성

### 헤더 카드
- 성향 이모지
- 신뢰도 표시
- 성향 타입 이름
- 간단한 설명
- 공유 버튼 (카카오톡, 링크 복사, 이미지 저장)

### 4차원 점수 차트
- Chart.js 레이더 차트
- 4가지 성향별 점수 시각화
- 점수 상세 정보

### 상세 분석 (로그인 후 전체 공개)
1. **강점**: 성향별 주요 강점 4가지
2. **성장 포인트**: 개선 가능한 영역 3가지
3. **이상적인 업무 환경**: 성향에 맞는 직무 환경
4. **비슷한 현대인**: 유사 성향 직업인 사례
5. **5년 커리어 로드맵**:
   - 1-3년차: 주니어 (3,500만~5,000만 원)
   - 4-7년차: 시니어 (5,500만~8,500만 원)
   - 8년+: 리더 (9,000만~1억 5천만 원+)
6. **3대 추천 포지션**: 스타트업/중견/대기업 추천 직무
7. **알비 맞춤 공고**: 성향 맞춤 알바 공고 3선

## 💾 데이터 저장

### localStorage 구조
```javascript
// 현재 테스트 결과 (1개)
testResult: {
  answers: [...],
  scores: { strategic: 4, analytical: 4, ... },
  resultType: { primary: "strategic", isHybrid: true, ... },
  confidence: { level: "중간", percentage: 75, ... },
  consistency: { contradictions: 0, warning: false },
  timestamp: "2026-02-24T16:30:00.000Z"
}

// 마이페이지 결과 히스토리 (최대 10개)
myTestResults: [
  { ...testResult, date: "2026-02-24" },
  { ...testResult, date: "2026-02-20" },
  ...
]

// 진행 중인 답변 (중간 저장)
testAnswers: [
  { questionId: 1, choice: "A", type: "strategic" },
  ...
]
```

## 🎨 UX 최적화

### 진행률 표시
- 실시간 진행 상태 (1/16 ~ 16/16)
- 차원 전환 알림
- 프로그레스 바

### 모바일 최적화
- 터치 스와이프 이동
- 자동 다음 (0.5초 후)
- 뒤로 가기 버튼으로 수정

### 키보드 단축키
- A, B, C, D: 선택지 선택
- ← →: 이전/다음 문항
- Enter: 다음 문항

### 중간 저장
- 답변 자동 저장
- 페이지 새로고침해도 이어하기 가능

## 📤 공유 기능

### 카카오톡 공유
```javascript
Kakao.Share.sendDefault({
  objectType: 'feed',
  content: {
    title: '나는 전략형!',
    description: '큰 그림을 보고 장기적 계획을 수립하는 전략가',
    imageUrl: 'https://albi.kr/static/images/job-test-og.png',
    link: {
      mobileWebUrl: 'https://albi.kr/job-test.html',
      webUrl: 'https://albi.kr/job-test.html'
    }
  },
  buttons: [
    {
      title: '나도 테스트하기',
      link: {
        mobileWebUrl: 'https://albi.kr/job-test.html',
        webUrl: 'https://albi.kr/job-test.html'
      }
    }
  ]
});
```

### 링크 복사
- 원클릭으로 테스트 링크 복사
- 클립보드 자동 복사
- 성공 알림

### 이미지 저장 (예정)
- html2canvas로 결과 카드 캡처
- PNG 다운로드

## 🔒 로그인 연동

### 비로그인 상태
1. 테스트 완료
2. 기본 결과 표시 (성향, 신뢰도, 차트)
3. 상세 내용 블러 처리
4. 2초 후 로그인 프롬프트 표시
5. "로그인하고 결과 보기" 버튼 클릭
6. 로그인 후 `/job-test-result.html`로 리다이렉트

### 로그인 상태
1. 테스트 완료
2. 마이페이지에 자동 저장
3. 전체 결과 즉시 확인
4. 이력 관리 가능

## 📁 파일 구조
```
webapp/
├── public/
│   ├── job-test.html              # 테스트 페이지
│   ├── job-test-result.html       # 결과 페이지
│   └── static/
│       ├── job-test.js            # 테스트 로직
│       ├── job-test-result.js     # 결과 표시 로직
│       └── job-test-data.json     # 문항 및 결과 데이터
└── mypage.html                    # 마이페이지 (결과 히스토리)
```

## 🛠️ 개발자 가이드

### 로컬 개발
```bash
# 프로젝트 디렉토리로 이동
cd /home/user/webapp

# PM2로 개발 서버 시작
pm2 start ecosystem.config.cjs

# 테스트 페이지 확인
curl http://localhost:3000/job-test.html

# 결과 페이지 확인
curl http://localhost:3000/job-test-result.html
```

### 배포
```bash
# Cloudflare Pages 배포
npx wrangler pages deploy public --project-name albi-app
```

### 데이터 수정
- 문항 수정: `public/static/job-test-data.json`의 `questions` 배열
- 성향 정보 수정: `public/static/job-test-data.json`의 `types` 객체
- 복합형 정보 수정: `public/static/job-test-data.json`의 `hybridTypes` 객체

## 🔮 향후 계획
- [ ] 친구와 궁합 비교 기능
- [ ] Instagram 스토리 공유
- [ ] 이미지 저장 기능 (html2canvas)
- [ ] API 서버 연동 (백엔드 저장)
- [ ] 포인트/보상 시스템 연동
- [ ] 기업별 맞춤 공고 연동
- [ ] 테스트 재응시 추천 (3개월 후)
- [ ] 성향 변화 추적 그래프

## 📞 문의
- 이메일: albi260128@gmail.com
- 전화: 010-4459-4226
- 웹사이트: https://albi.kr
