// Minimal service worker: exists to satisfy PWA installability (Android
// requires a registered fetch handler for the "Install app" prompt).
// Intentionally does not cache JS bundles or API/live-data requests — this
// app's data (aircraft, ships, cameras, etc.) must always be fresh.
const SHELL_CACHE = 'gev-shell-v1';
const SHELL_ASSETS = ['/', '/manifest.webmanifest', '/logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !SHELL_ASSETS.includes(new URL(request.url).pathname)) {
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
