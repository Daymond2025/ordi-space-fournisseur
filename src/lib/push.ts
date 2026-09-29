import { apiFetch } from "@/lib/api";

/** Le navigateur supporte-t-il les notifications push web ? (Safari iOS < 16.4, navigateurs anciens : non.) */
export function verifierSupportPush(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// L'API Push attend la clé VAPID en Uint8Array, la nôtre est transmise en
// base64 URL-safe (format standard des clés VAPID) — conversion nécessaire,
// aucune lib externe pour ça dans le projet.
function urlBase64VersUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Normalise = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const brut = window.atob(base64Normalise);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

/**
 * Demande la permission de notification puis abonne ce navigateur aux
 * notifications push — appelé au moment où l'utilisateur exprime
 * explicitement vouloir être alerté (ex. passage "disponible" côté Livreur).
 * Échec silencieux (permission refusée, navigateur non supporté...) : ce
 * n'est jamais bloquant pour le reste de l'app.
 */
export async function sAbonnerAuxPush(token: string): Promise<void> {
  if (!verifierSupportPush()) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    const { cle_publique } = await apiFetch<{ cle_publique: string }>("/push/cle-publique", { token });
    if (!cle_publique) return;

    let abonnement = await registration.pushManager.getSubscription();
    if (!abonnement) {
      abonnement = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast nécessaire : lib.dom.d.ts type applicationServerKey en
        // BufferSource<ArrayBuffer> strict, incompatible avec le
        // Uint8Array<ArrayBufferLike> renvoyé ici — sans conséquence à
        // l'exécution (l'API Push accepte bien un Uint8Array classique).
        applicationServerKey: urlBase64VersUint8Array(cle_publique) as BufferSource,
      });
    }

    const donnees = abonnement.toJSON();
    await apiFetch("/moi/push-subscriptions", {
      method: "POST",
      token,
      body: { endpoint: donnees.endpoint, keys: donnees.keys },
    });
  } catch {
    // Permission refusée, service worker indisponible, échec réseau...
    // — jamais bloquant pour l'action qui a déclenché l'abonnement.
  }
}
