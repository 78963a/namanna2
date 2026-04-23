const CACHE_NAME = 'danharu-20260423-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo512.png',
  './apple-touch-icon.png'
];

// 서비스 워커 설치: 자산 캐싱
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 메세지 수신: 업데이트 적용을 위한 skipWaiting 실행
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 서비스 워커 활성화: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // 즉시 제어권 획득
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
    ])
  );
});

// 페치 이벤트
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 탐색 요청(페이지 이동/새로고침) 및 메니페스트/아이콘은 네트워크 우선 전략 (Network First)
  if (event.request.mode === 'navigate' || 
      url.pathname.endsWith('manifest.json') || 
      url.pathname.endsWith('apple-touch-icon.png')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 성공하면 캐시에 저장 후 반환
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(() => {
          // 오프라인일 때만 캐시에서 반환
          return caches.match(event.request);
        })
    );
    return;
  }

  // 기타 자산은 캐시 우선 후 네트워크 (Cache-First, Fallback to Network)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
