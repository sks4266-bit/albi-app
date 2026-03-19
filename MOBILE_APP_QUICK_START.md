# 📱 Albi 모바일 앱 배포 - 빠른 시작 가이드

## 🎯 가장 빠른 방법: PWA (1-2시간)

### ✅ 장점
- 기존 코드 100% 재사용
- 비용 ₩0
- 앱스토어 수수료 없음
- 자동 업데이트
- 오프라인 지원

### ⚠️ 단점
- 앱스토어/구글플레이 등록 불가
- 네이티브 기능 제한적

---

## 🚀 3단계로 끝내는 PWA 구현

### 1️⃣ 파일 생성 (5분)

```bash
cd /home/user/webapp

# manifest.json 생성
cat > public/manifest.json << 'JSON'
{
  "name": "Albi - AI 취업 멘토",
  "short_name": "Albi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#6366F1",
  "theme_color": "#6366F1",
  "icons": [
    {
      "src": "/static/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/static/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
JSON

# Service Worker 생성
cat > public/service-worker.js << 'JS'
const CACHE_NAME = 'albi-v1';
const URLS = ['/', '/chat', '/mentor-chat.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(URLS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
JS
```

### 2️⃣ 아이콘 생성 (10분)

**온라인 도구 사용**:
1. https://www.pwabuilder.com/imageGenerator 접속
2. Albi 로고 업로드 (512x512 PNG)
3. 다운로드
4. `public/static/icons/` 에 복사

**또는 수동 생성**:
```bash
mkdir -p public/static/icons
# ImageMagick 사용
convert logo.png -resize 192x192 public/static/icons/icon-192x192.png
convert logo.png -resize 512x512 public/static/icons/icon-512x512.png
```

### 3️⃣ HTML 메타 태그 추가 (30분)

**모든 HTML 파일의 `<head>`에 추가**:
```html
<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#6366F1">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/static/icons/icon-192x192.png">

<!-- Service Worker -->
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
</script>
```

**주요 파일**:
- `public/index.html`
- `public/chat.html`
- `public/mentor-chat.html`
- `public/payment.html`

### 4️⃣ 배포 (5분)

```bash
npm run build
npx wrangler pages deploy dist --project-name albi-app
```

### 5️⃣ 테스트 (10분)

**Android (Chrome)**:
1. https://albi.kr 접속
2. 주소창 옆 "설치" 아이콘 클릭
3. 홈 화면에 Albi 앱 생성됨 ✅

**iOS (Safari)**:
1. https://albi.kr 접속
2. 공유 버튼 클릭
3. "홈 화면에 추가" 선택
4. 홈 화면에 Albi 앱 생성됨 ✅

---

## 📊 예상 타임라인

| 단계 | 작업 | 소요 시간 |
|------|------|----------|
| 1 | manifest.json 생성 | 5분 |
| 2 | Service Worker 생성 | 5분 |
| 3 | 아이콘 생성 | 10분 |
| 4 | HTML 메타 태그 추가 | 30분 |
| 5 | 배포 | 5분 |
| 6 | 테스트 | 10분 |
| **합계** | | **1시간 5분** |

---

## 🎯 PWA vs Capacitor vs React Native

| 항목 | PWA | Capacitor | React Native |
|------|-----|-----------|--------------|
| 작업 시간 | **1-2시간** | 1-2일 | 2-3개월 |
| 비용 | **무료** | ₩170,000 | ₩10,000,000+ |
| 앱스토어 | ❌ | ✅ | ✅ |
| 기존 코드 | 100% | 95% | 10% |

**결론**: PWA로 시작 → 필요시 Capacitor로 전환 🎯

---

## 💡 PWA 구현하면 바로 사용 가능

사용자가 브라우저에서:
```
https://albi.kr 접속
→ "앱 설치" 알림 표시
→ 설치 클릭
→ 홈 화면에 Albi 아이콘 추가 ✅
→ 앱처럼 전체 화면으로 실행 ✅
```

**앱스토어 없이도 모바일 앱처럼 사용 가능!** 🎉

---

**작성일**: 2026-03-04  
**추천 방법**: PWA (1-2시간)  
**비용**: 무료  
**즉시 실행 가능**: ✅
