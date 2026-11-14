const CACHE="kidswise-v4-3d";
const FILES=["./","./index.html","./style.css","./app.js","./manifest.json","./assets/kidswise-logo.jpg"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)))});
self.addEventListener("activate",event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim()})()));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith((async()=>{try{const fresh=await fetch(event.request,{cache:"no-store"});if(fresh.ok&&new URL(event.request.url).origin===location.origin){const cache=await caches.open(CACHE);cache.put(event.request,fresh.clone())}return fresh}catch(error){const cached=await caches.match(event.request);if(cached)return cached;return caches.match("./index.html")}})())});
