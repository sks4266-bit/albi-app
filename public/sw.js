/**
 * Albi PWA Service Worker
 * 오프라인 지원 및 캐싱
 */

const CACHE_NAME = 'albi-pwa-v7.5-20260301';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 리소스 (CDN 제외 - CSP 문제)
const STATIC_ASSETS = [
    '/offline.html',
    '/static/loading-skeleton.js',
    '/static/theme-manager.js',
    '/static/touch-handler.js',
    '/static/pwa-manager.js',
    '/static/performance-monitor.js',
    '/static/seo-manager.js',
    '/static/analytics.js',
    '/static/feedback-manager.js',
    '/static/styles.css'
];

// 설치
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing v7.5...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { 
                    cache: 'reload' 
                })));
            })
            .catch((error) => {
                console.error('[Service Worker] Cache installation failed:', error);
            })
    );

    // 즉시 활성화
    self.skipWaiting();
});

// 활성화
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating v7.5...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // 즉시 제어권 획득
    self.clients.claim();
});

// Fetch 전략
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // chrome-extension 및 외부 CDN은 무시 (CSP 처리)
    if (url.protocol === 'chrome-extension:' || 
        url.origin !== self.location.origin && 
        !url.pathname.startsWith('/api/')) {
        return;
    }

    // POST/PUT/DELETE 등 변경 요청은 네트워크만 (캐시 불가)
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // API 요청은 네트워크만 (캐시하지 않음)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // HTML 페이지는 네트워크 우선 (항상 최신 버전 로드)
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 정적 리소스(JS, CSS)는 캐시 우선
    event.respondWith(cacheFirst(request));
});

/**
 * 캐시 우선 전략 (정적 리소스)
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        // 백그라운드에서 업데이트 확인
        fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
        }).catch(() => {});
        
        return cached;
    }

    try {
        const response = await fetch(request);
        
        // 성공적인 응답만 캐시
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        throw error;
    }
}

/**
 * 네트워크 우선 전략 (HTML 페이지 - 항상 최신 버전)
 */
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        // 항상 네트워크에서 최신 버전 가져오기
        const response = await fetch(request);
        
        // 200 OK 응답만 캐시 (오프라인 폴백용)
        if (response.ok && request.method === 'GET') {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[Service Worker] Network request failed:', error);
        
        // 오프라인 시 캐시된 응답 반환
        if (request.method === 'GET') {
            const cached = await cache.match(request);
            if (cached) {
                console.log('[Service Worker] Serving cached version (offline)');
                return cached;
            }
        }
        
        // HTML 요청은 오프라인 페이지 반환
        if (request.headers.get('accept').includes('text/html')) {
            const offlinePage = await cache.match(OFFLINE_URL);
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        throw error;
    }
}

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // 오프라인 시 저장된 데이터를 서버와 동기화
    console.log('[Service Worker] Syncing data...');
}

// 푸시 알림 (선택사항)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || '새로운 알림이 있습니다',
        icon: '/static/icon-192.png',
        badge: '/static/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: data.key || 1
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Albi AI', options)
    );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});
