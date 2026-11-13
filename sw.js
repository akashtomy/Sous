// Sous service worker: makes the installed web app open without a connection.
// - Pages: network first, so a new deploy shows up on the next launch; the cached shell is
//   only used offline.
// - Fingerprinted bundles (/_expo/static/…) and icons: cache first (their names change when
//   their content does).
// Kitchen data never passes through here; it lives in IndexedDB and syncs with Supabase.
const CACHE = 'sous-v1';
// The site may live under a sub-path (GitHub Pages: /Sous/), so every path is relative to the
// service worker's scope.
const BASE = new URL(self.registration.scope).pathname; // e.g. "/" or "/Sous/"
const SHELL = BASE;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([SHELL, BASE + 'manifest.json', BASE + 'icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Anthropic, YouTube: untouched
  if (!url.pathname.startsWith(BASE)) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Every route serves the same index.html, so any good page refreshes the shell.
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(SHELL, copy));
          }
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  const path = url.pathname.slice(BASE.length - 1); // "/_expo/static/…" whatever the base
  if (path.startsWith('/_expo/static/') || path.startsWith('/icons/') || path.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
