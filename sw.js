const CACHE_NAME = 'typing-tutor-v2'; // বাড়ান (v3, v4...) যখনই বড় কোনো আপডেট দেন

self.addEventListener('install', (e) => {
  self.skipWaiting(); // পুরনো ট্যাব বন্ধ হওয়ার অপেক্ষা না করে নতুন ভার্সন সাথে সাথে চালু করুন
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['./index.html', './manifest.json', './icon-512.png']);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim()) // খোলা ট্যাবগুলোতেও সাথে সাথে নতুন ভার্সন কার্যকর করুন
  );
});

// Network-first: ইন্টারনেট থাকলে সবসময় সর্বশেষ ফাইল আনবে (তাই GitHub-এ এডিট করলেই সাথে সাথে দেখা যাবে),
// ইন্টারনেট না থাকলে ক্যাশ থেকে সার্ভ করবে (অফলাইন কাজ করার জন্য)।
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
