// Service Worker for Código Fibras
// Cache-first strategy so the app works offline once installed
const CACHE = 'codigo-fibras-v1';
const CORE = [
  './',
  './index.html',
  './fiber-pro.html',
  './fiber-mobile.html',
  './shared.js',
  './gallery-data.js',
  './fiber-pro.jsx',
  './fiber-mobile.jsx',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/factory-backup.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Pre-cache core files; ignore failures (some may not exist when SW is registered before files are served)
      Promise.all(CORE.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first, network-fallback. Network responses are cached for next time.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Skip cross-origin (e.g. unpkg CDN) — they're already cached by Chrome HTTP cache
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Only cache successful basic responses
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// Allow page to ask SW to refresh its cache
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
