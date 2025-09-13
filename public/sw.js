const CACHE_NAME = "water-map-data-v1";
const DATA_CACHE_NAME = "water-map-data-cache-v1";

// Cache strategies for different types of resources
const DATA_FILES_PATTERN = /\/data\/.*\.json$/;
const STATIC_ASSETS_PATTERN = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/;

// Install event - pre-cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache essential static assets if needed
      return cache.addAll(["/droplet.png", "/toilet.png", "/favicon.png"]);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle data files with Cache First strategy (long-term caching)
  if (DATA_FILES_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Return cached version
            return response;
          }

          // Fetch and cache for future use
          return fetch(request)
            .then((fetchResponse) => {
              // Check if we received a valid response
              if (
                !fetchResponse ||
                fetchResponse.status !== 200 ||
                fetchResponse.type !== "basic"
              ) {
                return fetchResponse;
              }

              // Clone the response since it can only be consumed once
              const responseToCache = fetchResponse.clone();
              cache.put(request, responseToCache);
              return fetchResponse;
            })
            .catch(() => {
              // Return a fallback or empty response if network fails
              return new Response("{}", {
                status: 200,
                statusText: "OK",
                headers: { "Content-Type": "application/json" },
              });
            });
        });
      }),
    );
  }

  // Handle static assets with Cache First strategy
  else if (STATIC_ASSETS_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((fetchResponse) => {
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }

          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return fetchResponse;
        });
      }),
    );
  }

  // For all other requests, use Network First strategy
  else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If network request is successful, optionally cache it
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(request);
        }),
    );
  }
});

// Handle cache updates and cleanup
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_DATA_CACHE") {
    event.waitUntil(
      caches.delete(DATA_CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      }),
    );
  }
});
