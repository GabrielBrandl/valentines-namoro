/* Service worker mínimo — demo PWA / notificações */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /* passa direto — sem cache agressivo nesta demo */
});
