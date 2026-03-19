# Cloudflare R2 스토리지 설정 가이드

## Phase 8.5: R2 스토리지 완전 연동

Albi AI 면접 시스템에서 영상 녹화 파일을 저장하기 위해 Cloudflare R2를 설정합니다.

---

## 📋 사전 준비

1. **Cloudflare 계정** - Pages와 동일한 계정 사용
2. **R2 활성화** - Cloudflare 대시보드에서 R2 서비스 활성화
3. **Wrangler CLI** - 이미 설치됨

---

## 🚀 R2 버킷 생성

### 1. 터미널에서 R2 버킷 생성

```bash
cd /home/user/webapp

# R2 버킷 생성
npx wrangler r2 bucket create albi-interview-recordings

# 버킷 목록 확인
npx wrangler r2 bucket list
```

### 2. wrangler.jsonc 업데이트

`wrangler.jsonc` 파일의 R2 설정 주석을 해제하고 버킷 이름을 확인:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "albi-app",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],

  // D1 Database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "albi-production",
      "database_id": "cd20f633-d756-4249-87b8-2577775afef5"
    }
  ],

  // R2 Storage (영상 녹화 저장)
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "albi-interview-recordings"
    }
  ]
}
```

### 3. 재배포

```bash
# 빌드 및 배포
npm run build
npx wrangler pages deploy dist --project-name albi-app
```

---

## ✅ R2 연동 확인

### 1. 업로드 테스트

```bash
# 테스트 파일 업로드
echo "test" > test.txt
npx wrangler r2 object put albi-interview-recordings/test.txt --file=test.txt

# 업로드된 파일 확인
npx wrangler r2 object get albi-interview-recordings/test.txt
```

### 2. API 테스트

면접을 진행하고 녹화하면 자동으로 R2에 저장됩니다:

- **업로드 API**: `/api/upload-video`
- **다운로드 API**: `/api/download-video`
- **목록 API**: `/api/list-recordings`

---

## 📊 R2 스토리지 구조

```
albi-interview-recordings/
├── videos/
│   ├── {session_id}/
│   │   ├── recording.webm
│   │   └── thumbnail.jpg
│   └── ...
└── temp/
    └── uploads/
```

---

## 💰 비용 안내

Cloudflare R2 가격 (2024년 기준):

- **저장**: $0.015/GB/월
- **업로드 (Class A)**: $4.50/백만 요청
- **다운로드 (Class B)**: $0.36/백만 요청
- **무료 한도**: 
  - 저장: 10 GB/월
  - 업로드: 1백만 요청/월
  - 다운로드: 10백만 요청/월

→ **대부분의 개인/소규모 프로젝트는 무료 한도 내에서 사용 가능**

---

## 🔧 트러블슈팅

### 버킷을 찾을 수 없음

```bash
# 버킷 목록 확인
npx wrangler r2 bucket list

# 버킷이 없으면 다시 생성
npx wrangler r2 bucket create albi-interview-recordings
```

### 권한 오류

Cloudflare 대시보드에서 R2 서비스가 활성화되어 있는지 확인하세요.

### 배포 실패

wrangler.jsonc의 바인딩 이름이 코드와 일치하는지 확인:
- 바인딩: `R2`
- 버킷: `albi-interview-recordings`

---

## 📚 추가 정보

- [Cloudflare R2 공식 문서](https://developers.cloudflare.com/r2/)
- [Wrangler R2 명령어](https://developers.cloudflare.com/workers/wrangler/commands/#r2)
- [R2 가격 정보](https://developers.cloudflare.com/r2/pricing/)

---

## ✅ 완료 체크리스트

- [ ] R2 버킷 생성 완료
- [ ] wrangler.jsonc 업데이트
- [ ] 재배포 완료
- [ ] 업로드/다운로드 테스트 성공
- [ ] 면접 녹화 저장 확인

---

**참고**: R2 버킷 생성 후 변경사항을 적용하려면 반드시 재배포가 필요합니다.
