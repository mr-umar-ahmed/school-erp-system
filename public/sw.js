/* EduNexus service worker
 * - cache-first for static, non-personal assets (icons, images, fonts,
 *   _next/static)
 * - network-only for page navigations, falling back to /offline
 * - never caches anything behind the session cookie
 *
 * Dashboard HTML is per-user: caching it would leave one user's data readable
 * on a shared device after they sign out. Every page here is authenticated, so
 * navigations are not cached at all and offline support is limited to the app
 * shell plus the /offline page.
 */
const VERSION = "v3";
const STATIC_CACHE = `edunexus-static-${VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // Deleting every other cache also purges the v2 runtime cache, which may
  // still hold pages rendered for a previously signed-in user.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Sign-out asks the worker to drop everything it holds, so nothing survives
// for the next person to use the device.
self.addEventListener("message", (event) => {
  if (event.data !== "clear-caches") return;
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() =>
        caches
          .open(STATIC_CACHE)
          .then((cache) => cache.addAll(PRECACHE_URLS))
          .catch(() => {})
      )
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/screenshots/") ||
    url.pathname.startsWith("/lottie/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf|css|js)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // React Server Component payloads share URLs with HTML pages —
  // never cache them or the router would render stale trees.
  if (request.headers.get("RSC") === "1") return;

  // API responses are private (auth-scoped files, exports) — never cache.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations render personal data — go to the network every time and fall
  // back to the precached /offline page rather than a stale private page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
            return response;
          })
      )
    );
    return;
  }

  // Anything else falls through to the network uncached. Whatever reaches
  // here isn't a known-static asset, so we can't assume it is safe to persist.
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "EduNexus", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "EduNexus", {
      body: payload.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
