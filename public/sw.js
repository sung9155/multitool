// Multitool 서비스워커 — 오프라인 캐시 (런타임 캐싱)
const CACHE = "multitool-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      // 구버전 캐시 정리
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) {
        // 백그라운드 갱신 (stale-while-revalidate)
        fetch(req)
          .then((r) => {
            if (r && r.ok) cache.put(req, r.clone());
          })
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        // 오프라인 + 미캐시 네비게이션 → index.html 폴백 (SPA)
        if (req.mode === "navigate") {
          const idx = (await cache.match("/index.html")) || (await cache.match("/"));
          if (idx) return idx;
        }
        return Response.error();
      }
    })(),
  );
});
