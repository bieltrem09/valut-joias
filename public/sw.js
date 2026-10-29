/*
 * Aplicativo Basik7: deixa o painel abrir como app e responder sem internet.
 * - Páginas: sempre da internet (dados atualizados); sem conexão, mostra a tela "sem internet".
 * - Arquivos do sistema (/_next/static, ícones): guardados no aparelho, abrem na hora.
 * Nada de dados do painel fica guardado aqui.
 */
const VERSAO = "basik7-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSAO)
      .then((c) => c.addAll([OFFLINE, "/app/icone-192.png", "/app/icone-512.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Arquivos com nome único por versão: pode guardar para sempre.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/app/")) {
    e.respondWith(
      caches.match(req).then(
        (salvo) =>
          salvo ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(VERSAO).then((c) => c.put(req, copia));
            }
            return res;
          }),
      ),
    );
  }
});
