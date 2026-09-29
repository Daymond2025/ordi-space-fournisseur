"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker minimal (public/sw.js) — présent uniquement
 * pour que Chrome/Android considère l'app installable (PWA). Aucun cache,
 * aucune donnée hors ligne : voir le commentaire de sw.js.
 */
export function EnregistrementServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
