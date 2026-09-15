/*
 * Bump this on every release. The activate handler below deletes every cache
 * whose name doesn't match, so the name is the only thing that triggers a
 * purge — leaving it fixed (as 'diary-cache-v1' was) means stale entries are
 * never evicted and, because this file's bytes then never change either, the
 * browser never even notices there is a new worker to install.
 */
const CACHE_NAME = 'diary-cache-v2';

/*
 * Derived from this script's own URL rather than hardcoded, so the base path
 * lives in exactly one place (vite.config.ts) — the worker is served from
 * <base>/service-worker.js, so './' resolves to the base itself.
 */
const BASE = new URL('./', self.location.href).pathname;
const SHELL_URL = BASE + 'index.html';

// Only what is knowable at author time. The JS/CSS bundles carry content
// hashes in their filenames, so they can't be listed here — they're picked up
// by the runtime cache below the first time they're fetched.
const PRECACHE = [BASE, SHELL_URL, BASE + 'manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Store only real, same-origin successes — never an opaque or error response. */
async function put(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

/*
 * Network-first, for HTML only.
 *
 * This is the half that matters. index.html names the content-hashed bundles
 * for its release, so serving a cached copy after a deploy hands the browser
 * a document pointing at asset filenames that no longer exist — the app then
 * fails to boot rather than merely looking out of date. Going to the network
 * first means an online visitor always lands on the current release; the
 * cache is written on the way past purely so there is something to fall back
 * to when offline.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    // Kept under the canonical shell URL, not the request URL, so query
    // strings (?splash=force) can't each spawn their own entry.
    await put(new Request(SHELL_URL), response);
    return response;
  } catch {
    // Offline. ignoreSearch so a URL carrying a query still resolves to the
    // one stored shell.
    const cached =
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match(SHELL_URL));
    if (cached) return cached;
    throw new Error('offline and no cached shell');
  }
}

/*
 * Cache-first, for everything else — safe precisely because it is everything
 * else: the bundles are content-hashed, so a given URL's bytes never change,
 * and a new release simply requests new filenames. Fetching and storing on a
 * miss is what makes the app work offline at all; the previous worker cached
 * only index.html and never the bundles it depends on, so an offline load got
 * the document and then failed on the first script.
 */
async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  return put(request, response);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Leave POSTs and cross-origin traffic entirely alone.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    request.mode === 'navigate' ? handleNavigation(request) : handleAsset(request)
  );
});
