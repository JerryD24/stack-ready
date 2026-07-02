/**
 * StackReady service worker — network-first, offline fallback only.
 * CACHE name is replaced on each GitHub Pages deploy by prepare-deploy.js.
 */
const CACHE = 'stackready-dev';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/** Always try network first; cache is only for offline reading. */
function networkFirst(request) {
  return caches.open(CACHE).then((cache) =>
    fetch(request, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      })
      .catch(() => cache.match(request))
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(req));
});
