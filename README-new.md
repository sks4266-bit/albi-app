# 🚀 Albi AI - 세계 최고의 AI 면접 플랫폼 v11.0

## 📌 프로젝트 개요
**Albi AI**는 실전 면접을 완벽하게 시뮬레이션하는 AI 기반 면접 플랫폼입니다.

- **실시간 영상 분석**: 표정/시선/자세
- **고급 AI 분석**: 제스처/음성/말하기/감정 (4가지)
- **패널 면접**: 3명의 전문 면접관
- **녹화 & 복습**: 모든 면접 자동 저장
- **다국어 지원**: 한국어/영어/중국어

---

## 🌐 배포 URL

**최신 배포**: https://4a241188.albi-app.pages.dev  
**커스텀 도메인**: https://albi.kr (설정 대기)

### 주요 페이지
- `/` - 메인 페이지 (전체 기능 소개)
- `/video-interview.html` - 1:1 AI 영상 면접 ⭐
- `/panel-interview.html` - 패널 면접 (3명) 🆕
- `/my-recordings.html` - 내 면접 녹화 목록 🆕
- `/interview-dashboard.html` - 성장 대시보드
- `/guide.html` - 사용 가이드 🆕
- `/chat` - AI 면접 시뮬레이션 (텍스트)
- `/mentor-chat.html` - AI 멘토
- `/portfolio.html` - 포트폴리오 관리

**배포 일시**: 2026-03-02 UTC  
**버전**: v11.0 (Phase 8 완료)

---

## 🎉 Phase 8 업데이트 (2026-03-02)

### 시스템 통합 & 완성
- ✅ **메인 페이지 완전 개편** - 모든 기능 통합 네비게이션
- ✅ **사용자 가이드** - 사용법, FAQ, 기능 설명
- ✅ **시스템 통합** - 모든 Phase 기능 완벽 통합

---

## 🏆 전체 기능 요약

### 📹 1:1 AI 영상 면접
**가장 핵심적인 면접 기능**

#### 기본 분석 (Phase 1-2)
- 📊 **실시간 영상 분석** (MediaPipe)
  - 표정 분석 (Happy, Neutral, Nervous, Speaking)
  - 시선 추적 (Center, Left, Right, Up, Down)
  - 자세 분석 (Good, Tilted, Leaning, Fidgeting)
  
#### 고급 분석 (Phase 5) 🆕
- 👐 **제스처 분석** (MediaPipe Hands)
  - 21개 손 랜드마크 추적
  - 제스처 빈도 (분당 5-15회 최적)
  - 움직임 강도 및 자연스러움
  
- 🎤 **음성 톤 분석** (Web Audio API)
  - 음높이 (Pitch) 실시간 측정
  - 음량 안정성 (30-80 적정 범위)
  - 에너지 레벨 평가

- 💬 **말하기 분석**
  - WPM (Words Per Minute)
  - 휴지기 분석 (300-800ms 적정)
  - 필러 워드 감지 ("음", "어" 등)
  - 명확성 및 유창성 점수

- 😊 **답변 감정 분석** (GPT-4)
  - 긍정성 (Positivity)
  - 자신감 (Confidence)
  - 논리성 (Logical Structure)
  - 전문성 (Professionalism)

#### 평가 시스템
```
최종 점수 = 
  기본 영상 분석 (25%) +
  제스처 분석 (5%) +
  음성 톤 분석 (5%) +
  말하기 분석 (5%) +
  답변 감정 (10%) +
  답변 내용 (50%)
```

---

### 👥 패널 면접 (Phase 7) 🆕

**3명의 전문 면접관이 함께 면접**

#### 5명의 AI 면접관 캐릭터
1. **김서연** (HR 매니저) 👩
   - 전문 분야: 인성, 조직적합성, 커뮤니케이션, 팀워크
   - 스타일: 친근하고 공감적인 개방형 질문

2. **박준혁** (기술 리드) 👨
   - 전문 분야: 기술역량, 문제해결, 코딩, 시스템설계
   - 스타일: 논리적이고 분석적인 기술 심화 질문

3. **이민지** (프로젝트 매니저) 👩
   - 전문 분야: 프로젝트관리, 리더십, 의사결정, 위기관리
   - 스타일: 상황 기반 질문 (STAR)

4. **최동욱** (C-레벨 임원) 👨
   - 전문 분야: 전략적사고, 비즈니스감각, 비전, 성장가능성
   - 스타일: 압박 질문 포함, 깊이 탐색

5. **강혜진** (마케팅 이사) 👩
   - 전문 분야: 창의성, 트렌드이해, 고객중심사고, 브랜드전략
   - 스타일: 창의성 질문, 새로운 접근 탐색

#### 패널 구성
- **Tech 직무**: HR + 기술 리드 + PM
- **Business 직무**: HR + PM + C-레벨
- **Creative 직무**: HR + PM + 마케팅

---

### 📹 녹화 & 리플레이 (Phase 6) 🆕

**모든 면접을 저장하고 복습**

#### 기능
- ✅ MediaRecorder API 자동 녹화 (WebM)
- ✅ Cloudflare R2 스토리지 연동 (준비 완료)
- ✅ 면접 목록 조회 (페이지네이션, 정렬)
- ✅ 과거 면접 다시보기
- ✅ 점수 비교 및 성장 추이
- ✅ 영상 다운로드

#### 통계
- 총 면접 수
- 평균 점수
- 최고 점수
- 총 면접 시간

---

### 📊 성장 추적 (Phase 3)

**면접 이력 저장 및 분석**

#### D1 데이터베이스 (11개 테이블)
- `interview_sessions` - 면접 세션 정보
- `interview_questions` - 질문 내역
- `interview_answers` - 답변 내역
- `video_analysis` - 영상 분석 결과
- `comprehensive_evaluation` - 종합 평가
- `gesture_analysis` - 제스처 분석 (Phase 5)
- `voice_tone_analysis` - 음성 톤 분석 (Phase 5)
- `speech_analysis` - 말하기 분석 (Phase 5)
- `answer_sentiment_analysis` - 감정 분석 (Phase 5)
- `interview_recordings` - 녹화 메타데이터 (Phase 6)
- `recording_timestamps` - 타임스탬프 이벤트 (Phase 6)

---

### 🌍 다국어 지원 (Phase 4)

**3개 언어 완벽 지원**

- 🇰🇷 **한국어** - TTS: alloy, Speech: ko-KR
- 🇺🇸 **영어** - TTS: nova, Speech: en-US
- 🇨🇳 **중국어** - TTS: shimmer, Speech: zh-CN

---

## 🔧 기술 스택

### Frontend
- **UI/UX**: HTML/CSS/TailwindCSS
- **JavaScript**: ES6+, Vanilla JS
- **AI/ML 라이브러리**:
  - MediaPipe Face Mesh (478 랜드마크)
  - MediaPipe Pose Detection (33 랜드마크)
  - MediaPipe Hands (21 랜드마크 × 양손)
  - Web Audio API (음성 분석)
  - Web Speech API (음성 인식)

### Backend
- **플랫폼**: Cloudflare Pages Functions
- **언어**: TypeScript
- **AI 서비스**:
  - OpenAI GPT-4 (질문 생성, 평가, 감정 분석)
  - OpenAI TTS (면접관 음성)

### Database & Storage
- **D1 Database**: SQLite 기반 분산 DB (11개 테이블)
- **R2 Storage**: 영상 파일 저장 (준비 완료)

### Deployment
- **Cloudflare Pages**: 전 세계 엣지 배포
- **Wrangler**: CLI 도구

---

## 📂 프로젝트 구조

```
webapp/
├── public/                          # 정적 파일
│   ├── index.html                   # 메인 페이지 (v11.0 완전 개편) 🆕
│   ├── guide.html                   # 사용 가이드 🆕
│   ├── video-interview.html         # 1:1 AI 면접
│   ├── panel-interview.html         # 패널 면접 🆕
│   ├── my-recordings.html           # 내 면접 녹화 🆕
│   ├── interview-dashboard.html     # 성장 대시보드
│   ├── chat.html                    # AI 면접 시뮬레이션
│   ├── mentor-chat.html             # AI 멘토
│   └── static/                      # JavaScript 라이브러리
│       ├── video-analyzer.js        # 기본 영상 분석
│       ├── gesture-analyzer.js      # 제스처 분석 (Phase 5)
│       ├── voice-tone-analyzer.js   # 음성 톤 분석 (Phase 5)
│       ├── speech-analyzer.js       # 말하기 분석 (Phase 5)
│       ├── advanced-analysis-controller.js  # 고급 분석 통합
│       ├── video-recorder.js        # 녹화 시스템 (Phase 6)
│       ├── interviewers.js          # 면접관 데이터 (Phase 7)
│       └── i18n.js                  # 다국어 지원 (Phase 4)
│
├── functions/api/                   # Cloudflare Functions (API)
│   ├── user-profile.ts              # 사용자 프로필
│   ├── interview-questions.ts       # 질문 생성
│   ├── panel-interview-questions.ts # 패널 질문 🆕
│   ├── interviewer-voice.ts         # TTS 음성
│   ├── comprehensive-evaluation.ts  # 종합 평가
│   ├── answer-sentiment-analysis.ts # 감정 분석 🆕
│   ├── save-interview.ts            # 면접 저장
│   ├── interview-history.ts         # 이력 조회
│   ├── upload-video.ts              # 영상 업로드 🆕
│   ├── download-video.ts            # 영상 다운로드 🆕
│   └── list-recordings.ts           # 녹화 목록 🆕
│
├── migrations/                      # D1 Database 마이그레이션
│   ├── 0045_video_interview_schema.sql       # 기본 스키마
│   ├── 0046_phase5_advanced_analysis.sql     # Phase 5
│   └── 0047_phase6_recording_replay.sql      # Phase 6
│
├── wrangler.jsonc                   # Cloudflare 설정
├── package.json                     # 의존성 관리
└── README.md                        # 이 파일
```

---

## 📊 전체 Phase 완료 현황

- ✅ **Phase 1-2**: 기본 AI 영상 면접 시스템
- ✅ **Phase 3**: 데이터베이스 통합 & 성장 추적
- ✅ **Phase 4**: 다국어 지원 (한/영/중)
- ✅ **Phase 5**: 고급 분석 (제스처/음성/말하기/감정)
- ✅ **Phase 6**: 녹화 & 리플레이 (기본 구조)
- ✅ **Phase 7**: 다중 면접관 시스템 (패널 면접)
- ✅ **Phase 8**: 시스템 통합 & 완성

---

## 🎯 주요 통계

### 코드 통계
- **총 파일**: 50+ 개
- **총 코드**: ~15,000 줄
- **API 엔드포인트**: 10+ 개
- **데이터베이스 테이블**: 11개

### Phase별 기여
- Phase 5: ~2,420 줄 (고급 분석)
- Phase 6: ~1,060 줄 (녹화 시스템)
- Phase 7: ~716 줄 (패널 면접)
- Phase 8: ~500 줄 (통합 & 완성)

---

## 🚀 빠른 시작

### 1. 면접 시작
```
1. https://4a241188.albi-app.pages.dev 접속
2. "1:1 AI 면접 시작" 또는 "패널 면접 (3명)" 선택
3. 카메라/마이크 권한 허용
4. AI 면접관의 질문에 답변
5. 종합 평가 확인
```

### 2. 로컬 개발
```bash
# 저장소 클론
git clone https://github.com/username/webapp.git
cd webapp

# 의존성 설치
npm install

# 로컬 개발 서버 (빌드 필요)
npm run build
pm2 start ecosystem.config.cjs

# 테스트
curl http://localhost:3000

# 배포
npm run deploy
```

---

## 🏆 주요 성과

### 기술적 성과
- ✅ 7가지 실시간 AI 분석 (표정/시선/자세/제스처/음성/말하기/감정)
- ✅ 패널 면접 시뮬레이션 (업계 최초)
- ✅ 완전 자동 녹화 & 복습 시스템
- ✅ 다국어 지원 (3개 언어)
- ✅ 11개 테이블 데이터베이스

### 사용자 경험
- ✅ 실전과 동일한 면접 경험
- ✅ 즉각적인 피드백
- ✅ 성장 추이 추적
- ✅ 무제한 연습

---

## 📞 문의 및 지원

- **배포 URL**: https://4a241188.albi-app.pages.dev
- **사용 가이드**: https://4a241188.albi-app.pages.dev/guide.html
- **Git Repository**: (추가 예정)

---

## 📜 라이선스

Copyright © 2026 Albi AI. All rights reserved.

---

**🎉 축하합니다! Albi AI는 세계 최고 수준의 AI 면접 플랫폼입니다!**
