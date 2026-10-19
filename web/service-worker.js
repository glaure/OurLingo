// Service worker for the web version (GitHub Pages). It keeps a copy of the
// whole app, so it works offline once it has been opened. The build replaces
// the two placeholders with the build's file list and a version made from it.
const files = self.__PRECACHE_FILES__
const cacheName = `ourlingo-${self.__PRECACHE_VERSION__}`
const scope = new URL(self.registration.scope)
const indexUrl = new URL('index.html', scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(files.map((file) => new URL(file, scope).href)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('ourlingo-') && name !== cacheName)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(scope.href)) return
  // Pages open the cached app; everything else comes from the cache first.
  const lookup = request.mode === 'navigate' ? indexUrl : request
  event.respondWith(
    caches
      .match(lookup, { ignoreSearch: true, ignoreVary: true })
      .then((cached) => cached ?? fetch(request)),
  )
})
