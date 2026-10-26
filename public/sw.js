const CACHE_NAME = "rudnaya-palata-v1"
const APP_ROOT = new URL("./", self.registration.scope).href
const APP_SHELL = [
  APP_ROOT,
  new URL("./manifest.webmanifest", self.registration.scope).href,
  new URL("./icons/favicon.svg", self.registration.scope).href,
  new URL("./icons/app-icon.svg", self.registration.scope).href,
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL)

      const response = await fetch(APP_ROOT)
      const html = await response.text()
      const assets = [...html.matchAll(/\b(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map(([, asset]) => new URL(asset, APP_ROOT).href)

      await cache.addAll(assets)
      await self.skipWaiting()
    }),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("rudnaya-palata-") &&
                cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response.ok) return response

          return caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, response.clone()).then(() => response),
          )
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          return (await cache.match(request)) || (await cache.match(APP_ROOT))
        }),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (!response.ok) return response

            return cache.put(request, response.clone()).then(() => response)
          }),
      ),
    ),
  )
})
