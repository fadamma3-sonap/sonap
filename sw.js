const CACHE = "sonab-v1";
const CORE = ["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.hostname.endsWith("firestore.googleapis.com") || u.hostname.endsWith("googleapis.com") && u.pathname.includes("/v1/")) return; // Firestore gère son propre cache
  const sameOrigin = u.origin === location.origin;
  const cdn = /(gstatic\.com|fonts\.googleapis\.com)$/.test(u.hostname);
  if (!sameOrigin && !cdn) return;
  if (r.mode === "navigate") { // réseau d'abord pour avoir la dernière version, cache en secours
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return res; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
});
