const CACHE_NAME = 'coil-rechner-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

// Installieren: Basis-Dateien in den Cache laden.
// addAll bricht ab, wenn EINE Datei fehlschlägt (z.B. CDN offline beim ersten Aufruf).
// Deshalb einzeln puffern und Fehler tolerieren.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS_TO_CACHE.map(url =>
        cache.add(url).catch(err => console.warn('Cache übersprungen:', url, err))
      ))
    )
  );
  self.skipWaiting();
});

// Aktivieren: alten Cache löschen bei Updates
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

// Stale-While-Revalidate: sofort aus Cache, im Hintergrund aktualisieren.
// Puffert die Tesseract-Sprachpakete automatisch beim ersten Online-Scan.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
