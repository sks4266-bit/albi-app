const CACHE_NAME = 'albi-v3-portone';
const urlsToCache = [
  '/index.html',
  '/mentor-chat.html',
  '/about.html',
  '/contact.html',
  '/static/app.js',
  '/static/styles.css',
  '/footer.js',
  '/static/icons/icon-192x192.png'
  // payment.html은 제외 (항상 최신 버전 사용)
  // 외부 CDN은 제외 (CORS 문제 방지)
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch 이벤트 - Network First, Cache Fallback 전략
self.addEventListener('fetch', (event) => {
  // API 요청은 항상 네트워크 사용
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // payment.html은 항상 최신 버전 사용 (캐시하지 않음)
  if (event.request.url.includes('payment.html')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 나머지는 Network First 전략
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시 업데이트
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});
