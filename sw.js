// KIDWISE service worker – ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
var CACHE = 'kidwise-v33-thai-consonant-learning';
var SHELL = ["./","activities.html","development.html","growth.html","health.html","index.html","knowledge.html","storybook.html","login.html","menu.html","notes.html","nutrition.html","profile.html","css/app.css","js/data.js","js/app.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","assets/a_book.png","assets/a_puzzle.png","assets/a_veg.png","assets/avatar_boy.png","assets/avatar_girl.png","assets/baby.png","assets/bell.png","assets/bulb.png","assets/heart.png","assets/hero.png","assets/kids.png","assets/leaf.png","assets/m_book.png","assets/m_bowl.png","assets/m_chart.png","assets/m_puzzle.png","assets/m_scale.png","assets/m_shield.png","assets/n_book.png","assets/n_chart.png","assets/n_home.png","assets/n_prof.png","assets/n_puzzle.png","assets/r_ball.png","assets/r_rings.png","assets/r_sand.png","assets/toddler.png","assets/wave.png","story-01-page-1.jpg","rabbit-squirrel.jpg","story-01-page-2.webp","story-01-page-3.webp","story-01-page-4.webp","story-01-page-1.svg","story-01-page-2.svg","story-01-page-3.svg","story-01-page-4.svg","cloud-sprout.jpg","duck-family.jpg","bear-ball.jpg","turtle-rainbow.jpg","friends-bridge.jpg","assets/story01-p1-a.txt","assets/story01-p1-b.txt","assets/story01-p2-a.txt","assets/story01-p2-b.txt","assets/story01-p3-a.txt","assets/story01-p3-b.txt","assets/story01-p4-a.txt","assets/story01-p4-b.txt","stories.js","assets/story01-illustration-1.svg","assets/story01-illustration-2.svg","assets/story01-illustration-3.svg","assets/story01-illustration-4.svg","assets/story01-pages-sprite.webp","assets/story02-sprite-part-01a.txt","assets/story02-sprite-part-01b.txt","assets/story02-sprite-part-02.txt","assets/story02-sprite-part-03.txt","assets/story02-sprite-part-04.txt","assets/story02-sprite-part-05.txt","assets/story02-sprite-part-06.txt","assets/story02-sprite-part-07.txt","assets/story03-pages-sprite.svg","numbers.html","assets/count-123.svg","thai.html","assets/thai-letters.svg"];
self.addEventListener('install', function (e) {
  // Cache available shell files individually. A missing optional asset must not
  // abort the entire service-worker install (which would keep the old cache alive).
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(SHELL.map(function (path) {
      return fetch(path).then(function (response) {
        if (!response || !response.ok) return null;
        return cache.put(path, response);
      }).catch(function () { return null; });
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  // fonts: cache as they are used
  if (url.hostname.indexOf('fonts.') === 0) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) { c.put(e.request, res.clone()); return res; });
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // app files: network first (get updates), fall back to cache when offline
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
  }));
});
