// 🥚 琵琶调音器 - Service Worker
const CACHE = 'pipa-tuner-v1';
const FILES = [
  '/apps/pipa-tuner/',
  '/apps/pipa-tuner/index.html',
  '/apps/pipa-tuner/manifest.json',
  '/apps/pipa-tuner/icon.svg',
  '/apps/pipa-tuner/sw.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
