const CACHE_NAME = "piczzle-app-v16";
const APP_SHELL = [
  "/Piczzle/",
  "/Piczzle/index.html",
  "/Piczzle/css/styles.css?v=20260601-complete-menu",
  "/Piczzle/css/pwa-safe-area.css?v=20260520",
  "/Piczzle/js/native.js?v=20260520",
  "/Piczzle/js/share-config.js?v=20260527",
  "/Piczzle/js/share-cloud.js?v=20260527-cloud2",
  "/Piczzle/js/app.js?v=20260601-random-splash",
  "/Piczzle/js/completion-actions.js?v=20260601-complete3",
  "/Piczzle/js/share-feedback.js?v=20260528-feedback1",
  "/Piczzle/js/save-image.js?v=20260601-ios-share",
  "/Piczzle/js/celebration.js?v=20260528-fireworks1",
  "/Piczzle/js/pwa.js?v=20260527-cache",
  "/Piczzle/assets/app-icon.svg",
  "/Piczzle/assets/app-icon-premium.png",
  "/Piczzle/assets/app-icon-maskable.png",
  "/Piczzle/assets/demo-pet.png",
  "/Piczzle/assets/demo-landscape.png",
  "/Piczzle/assets/demo-challenge.png",
  "/Piczzle/assets/demo-splash.png",
  "/Piczzle/assets/demo-splash2.png",
  "/Piczzle/assets/demo-splash3.png",
  "/Piczzle/manifest.webmanifest",
  "/Piczzle/piczzle-preview.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/Piczzle/index.html").then(cached => cached || caches.match("/Piczzle/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});
