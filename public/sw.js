// Service worker minimal — présent uniquement pour satisfaire le critère
// d'installabilité PWA de Chrome/Android. Aucun cache, aucune donnée hors
// ligne : pas de fetch handler, chaque requête (API incluse) part directement
// au réseau, exactement comme sans service worker.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
