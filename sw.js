/**
 * StackReady service worker — offline-first PWA.
 * App shell is precached; guides and CDN assets are cached at runtime
 * so everything you've opened once is readable offline.
 */
const CACHE = 'stackready-v2';

// Same-origin app shell (relative to the SW scope, so basePath-safe)
const PRECACHE = [
  './',
  'index.html',
  'reader.html',
  'practice.html',
  'config.js',
  'favicon.svg',
  'site.webmanifest',
  'assets/css/styles.css',
  'assets/js/site.js',
  'assets/js/cookies.js',
  'assets/js/theme.js',
  'assets/js/topics.js',
  'assets/js/progress-map.js',
  'assets/js/content-meta.js',
  'assets/js/study-data.js',
  'assets/js/confetti.js',
  'assets/js/app.js',
  'assets/js/reader.js',
  'assets/js/practice.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // add individually so one missing file doesn't abort the whole install
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigations: network-first, fall back to cached page (offline)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true })
            .then((hit) => hit || caches.match('index.html'))
        )
    );
    return;
  }

  // Everything else (assets, guide markdown, CDN libs): stale-while-revalidate
  if (sameOrigin || url.protocol === 'https:') {
    event.respondWith(staleWhileRevalidate(req));
  }
});
