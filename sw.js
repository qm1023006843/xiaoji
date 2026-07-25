/* 小记 v2.7.1 · 离线支持
   策略：页面走「先网络、断网用缓存」，图标等静态文件走「先缓存」。
   有网时永远拿最新版，断网时也能打开。
   v2.6.0 起分家：style.css / app.js 引用带版本 query，随 CACHE 名一起 bump，防新旧混装。 */
const CACHE = 'xiaoji-v2.7.1';
const CORE = ['./', './index.html', './style.css?v=2.6.5', './core.js?v=2.6.5', './store.js?v=2.6.5', './cloud.js?v=2.6.5', './ui.js?v=2.6.5', './tasks.js?v=2.6.5', './rewards.js?v=2.6.5', './mood.js?v=2.6.5', './notes.js?v=2.6.5', './cycle.js?v=2.6.5', './words.js?v=2.6.5', './records.js?v=2.6.5', './settings.js?v=2.6.5', './garden-engine.js?v=2.6.5', './garden-ui.js?v=2.6.5', './boot.js?v=2.6.5', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    // 页面：先网络（保证更新），失败回缓存（保证离线能开）
    e.respondWith(
      fetch(req).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => { c.put('./index.html', cp); });
        return r;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    // 静态文件：先缓存，miss 了再走网络并补进缓存
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => { c.put(req, cp); }); }
        return r;
      }))
    );
  }
});
