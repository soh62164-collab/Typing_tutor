const CACHE_NAME = 'typing-tutor-v3'; // bumped to force a clean, fresh install
const APP_SHELL = ['./', './index.html', './manifest.json'];

const OFFLINE_FALLBACK_HTML = `<!doctype html><html lang="bn"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>টাইপিং শিখি</title></head>
<body style="font-family:sans-serif; padding:24px; background:#1c1f26; color:#f2f2f2;">
<h2>অ্যাপটা এখনো এই ফোনে সম্পূর্ণভাবে সংরক্ষিত হয়নি</h2>
<p>একবার ইন্টারনেট থাকা অবস্থায় পুরো পেজটা একবার খুলুন (লোড হওয়া পর্যন্ত অপেক্ষা করুন), তারপর থেকে অফলাইনেও কাজ করবে।</p>
</body></html>`;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each file separately so ONE failing request (slow network,
      // a hiccup fetching one file) can't sink the whole install the way
      // cache.addAll() would — every file that *does* succeed still gets
      // cached.
      await Promise.all(APP_SHELL.map(async (url) => {
        try{
          const res = await fetch(url, {cache:'reload'});
          if(res && res.ok) await cache.put(url, res);
        }catch(err){ /* this one file failed to cache; the others still can */ }
      }));
    })
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
  // version when online). Every single branch below ends in an actual
  // Response object — never "nothing" — so the browser can never show
  // an ERR_FAILED page again, even in the worst case.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try{
        const res = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', res.clone());
        return res;
      }catch(err){
        const cache = await caches.open(CACHE_NAME);
        const hit = (await cache.match('./index.html')) || (await cache.match('./'));
        if(hit) return hit;
        return new Response(OFFLINE_FALLBACK_HTML, {headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  // Everything else (manifest, icons, etc.): cache first, network fallback,
  // and a harmless empty response as the absolute last resort.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(req);
    if(hit) return hit;
    try{
      return await fetch(req);
    }catch(err){
      return new Response('', {status:504, statusText:'Offline'});
    }
  })());
});
