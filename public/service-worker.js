const CACHE_NAME = 'diary-cache-v1';

// App-shell files only. Entries themselves live in IndexedDB (src/lib/db.ts),
// never in this cache, so the service worker has no diary content to manage.
const APP_SHELL = ['/GateKeep/', '/GateKeep/index.html', '/GateKeep/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
