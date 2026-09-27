const CACHE_NAME = 'typing-tutor-v2';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Page loads: try the network first (so you always get the latest
  // version when online), but NEVER fail when offline — always fall
  // back to the cached app shell, no matter what exact URL was asked for.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html').then((res) => res || caches.match('./')))
    );
    return;
  }

  // Everything else (manifest, icon, etc.): cache first, network fallback.
  e.respondWith(
    caches.match(req).then((res) => res || fetch(req).catch(() => caches.match('./index.html')))
  );
});
