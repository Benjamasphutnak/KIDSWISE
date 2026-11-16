// KIDWISE service worker – ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
var CACHE = 'kidwise-v14-story01-dedicated-scenes';
var SHELL = ["./", "activities.html", "development.html", "growth.html", "health.html", "index.html", "knowledge.html", "storybook.html", "login.html", "menu.html", "notes.html", "nutrition.html", "profile.html", "css/app.css", "js/data.js", "js/app.js", "js/stories.js", "js/storybook.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "assets/a_book.png", "assets/a_puzzle.png", "assets/a_veg.png", "assets/avatar_boy.png", "assets/avatar_girl.png", "assets/baby.png", "assets/bell.png", "assets/bulb.png", "assets/heart.png", "assets/hero.png", "assets/kids.png", "assets/leaf.png", "assets/m_book.png", "assets/m_bowl.png", "assets/m_chart.png", "assets/m_puzzle.png", "assets/m_scale.png", "assets/m_shield.png", "assets/n_book.png", "assets/n_chart.png", "assets/n_home.png", "assets/n_prof.png", "assets/n_puzzle.png", "assets/r_ball.png", "assets/r_rings.png", "assets/r_sand.png", "assets/toddler.png", "assets/wave.png", "rabbit-squirrel.jpg", "story-01-page-2.webp", "story-01-page-3.webp", "story-01-page-4.webp", "cloud-sprout.jpg", "duck-family.jpg", "bear-ball.jpg", "turtle-rainbow.jpg", "friends-bridge.jpg"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
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
