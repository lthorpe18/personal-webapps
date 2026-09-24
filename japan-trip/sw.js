/* Static-shell cache only. Private trip data and Supabase requests are NEVER cached. */
const CACHE = "trip-planner-shell-v1";
const SHELL = ["./","./index.html","./styles.css","./app.js","./config.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  // Online-first means a fresh deployment is visible promptly; the cached shell is a fallback.
  event.respondWith(fetch(req).then(response => {
    if (response.ok && response.type === "basic" && url.pathname !== new URL("./config.js", self.registration.scope).pathname) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(req, clone));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") return caches.match("./index.html");
    return Response.error();
  }));
});
