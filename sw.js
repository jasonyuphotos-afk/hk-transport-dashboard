const CACHE_NAME = 'traffic-dashboard-v1';

// 離線緩存嘅檔案路徑
const urlsToCache = [
  '/',
  '/dashboard.html',
  '/css/style.css',
  '/js/api.js',
  '/js/app.js',
  '/manifest.json',
  '/assets/favicon.ico',
  '/assets/apple-touch-icon.png',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png'
];

// 安裝 Service Worker 並緩存檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網絡請求，如果有緩存就俾緩存，冇就經網絡拎
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果搵到緩存就 return 緩存
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 更新 Service Worker 時清除舊緩存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
