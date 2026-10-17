// オフラインでも遊べるように、アプリのファイルを保存しておく
// ※アプリを更新したら VERSION の数字を上げる
const VERSION = "puni-v19";
const FILES = ["./", "index.html", "style.css", "data.js", "world.js", "c_kanji.js", "c_kotoba.js", "c_math.js", "c_sci.js", "c_soc.js", "cloud.js", "pets.js", "music.js", "gear.js", "extra.js", "app.js", "manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// ネットにつながるときは最新を取得し、つながらないときは保存したものを使う
self.addEventListener("fetch", (e) => {
  // クラウドセーブなど、ほかのサイトへの通信は保存しない
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // 版の 確認は いつも ネットから（保存しない）
  if (u.pathname.endsWith("version.json")) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
