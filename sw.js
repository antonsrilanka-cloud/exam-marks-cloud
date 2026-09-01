// Minimal service worker — its only job is to exist, so Chrome/Android/
// desktop treat this site as "installable." It doesn't cache anything
// (marks data must always come fresh from the server), it just passes
// every request straight through.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
