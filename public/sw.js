// Garden Planner Service Worker
// Provides offline support and caching for better performance

const CACHE_NAME = "garden-planner-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/favicon.svg",
];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip API requests - always fetch from network
  if (event.request.url.includes("/api/")) {
    return;
  }

  // Skip auth-related requests
  if (event.request.url.includes("/login") ||
      event.request.url.includes("/signup") ||
      event.request.url.includes("/auth/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // Fetch updated version in background
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {
            // Network failed, but we have cache - that's fine
          })
        );
        return cachedResponse;
      }

      // No cache - fetch from network
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses for static assets
          if (response.ok && shouldCache(event.request)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed and no cache - show offline page for navigation
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Determine if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url);

  // Cache static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    return true;
  }

  // Cache HTML pages (but not dynamic API routes)
  if (request.destination === "document" && !url.pathname.startsWith("/api/")) {
    return true;
  }

  return false;
}
