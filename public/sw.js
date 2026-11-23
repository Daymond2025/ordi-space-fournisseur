// Service worker : installabilité PWA + notifications push (voir
// App\Services\NotificationService côté backend). Aucun cache, aucune donnée
// hors ligne : pas de fetch handler, chaque requête part au réseau.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const TITRE_PAR_DEFAUT = "Ordi'Space";

self.addEventListener("push", (event) => {
  let donnees = { titre: TITRE_PAR_DEFAUT, corps: "Nouvelle notification.", donnees: {} };
  try {
    if (event.data) donnees = { ...donnees, ...event.data.json() };
  } catch {
    // Payload non-JSON : on garde le texte par défaut.
  }
  const extra = donnees.donnees || {};

  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const visible = fenetres.find((c) => c.visibilityState === "visible");

      // App ouverte à l'écran : elle sonne et affiche son propre bandeau —
      // on la prévient tout de suite au lieu de doubler avec une notif système.
      if (visible) {
        visible.postMessage({ type: "notification-push", donnees: extra });
        return;
      }

      await self.registration.showNotification(donnees.titre || TITRE_PAR_DEFAUT, {
        body: donnees.corps || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: extra.id ? `ordispace-${extra.id}` : undefined,
        // Reste affichée tant qu'on ne l'a pas touchée (ordinateur ; sur
        // téléphone elle reste dans le volet de notifications).
        requireInteraction: true,
        vibrate: extra.urgente ? [400, 150, 400, 150, 400, 150, 800] : [300, 150, 300],
        data: extra,
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const lien = (event.notification.data && event.notification.data.lien) || "/";

  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const fenetre = fenetres[0];
      if (fenetre) {
        await fenetre.focus();
        if ("navigate" in fenetre) {
          try {
            await fenetre.navigate(lien);
            return;
          } catch {
            // Fenêtre non contrôlée par ce worker : on en ouvre une nouvelle.
          }
        }
      }
      await self.clients.openWindow(lien);
    })()
  );
});
