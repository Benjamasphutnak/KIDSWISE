const CACHE="kidswise-v5-characters";
const FILES=["./","./index.html","./style.css","./app.js","./manifest.json","./assets/kidswise-logo.jpg","./assets/kidswise-children-3d.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener("activate",e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith((async()=>{try{const r=await fetch(e.request,{cache:"no-store"});if(r.ok&&new URL(e.request.url).origin===location.origin)(await caches.open(CACHE)).put(e.request,r.clone());return r}catch(err){return (await caches.match(e.request))||caches.match("./index.html")}})())});
