const CACHE_NAME = 'namanna-20260406-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 서비스 워커 설치: 자산 캐싱
self.addEventListener('install', (event) => {
  // self.skipWaiting(); // 사용자에게 알림을 주기 위해 즉시 활성화를 주석 처리하거나 제거합니다.
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

// 페치 이벤트: 네트워크 우선 전략 (Network First)
// 특히 index.html 같은 탐색 요청에 대해 항상 최신 버전을 시도합니다.
self.addEventListener('fetch', (event) => {
  // 탐색 요청(페이지 이동/새로고침)의 경우 네트워크 우선
  if (event.request.mode === 'navigate') {
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
