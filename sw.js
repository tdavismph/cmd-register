// Service worker: keeps the app available with no connection.
// Change VERSION whenever index.html changes, so tablets fetch the new files.
const VERSION = "cmd-register-0.23.0";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "img/m_forget.jpg", "img/m_well.jpg", "img/m_side.jpg", "img/m_out.jpg", "img/m_herbs.jpg", "img/m_other.jpg", "img/m_routine.jpg", "img/c_review.jpg", "img/c_between.jpg", "img/r_raised.jpg", "img/n_bp.jpg", "img/n_card.jpg", "img/d_signs.jpg", "img/d_test.jpg", "img/d_feet.jpg", "img/d_low.jpg", "img/k_salt.jpg", "img/k_drinks.jpg", "img/k_plate.jpg", "img/w_weight.jpg", "img/a_move.jpg", "img/t_tobacco.jpg", "img/s_stress.jpg", "img/e_plan.jpg", "img/f_helpers.jpg", "img/f_family.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const page = req.mode === "navigate" || req.url.endsWith("index.html");
  if (page) {
    // Pages: try the network first so updates arrive, fall back to the stored copy when offline.
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return res; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Everything else (icons, fonts): stored copy first, then network, storing what arrives.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
