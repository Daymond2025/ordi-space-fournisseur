import { apiFetch } from "@/lib/api";

/** Le navigateur supporte-t-il les notifications push ? (iPhone : seulement l'app installée sur l'écran d'accueil.) */
export function verifierSupportPush(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function permissionNotifications(): NotificationPermission | "non-supporte" {
  return verifierSupportPush() ? Notification.permission : "non-supporte";
}

// Clé VAPID transmise en base64 URL-safe, attendue en Uint8Array par l'API Push.
function urlBase64VersUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Normalise = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const brut = window.atob(base64Normalise);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

/**
 * Abonne ce navigateur aux notifications push pour l'utilisateur connecté.
 * `demander` : affiche la demande d'autorisation du navigateur (uniquement
 * après un geste de l'utilisateur) ; sinon, n'abonne que si l'autorisation
 * est déjà accordée. Échec silencieux : jamais bloquant pour l'app.
 */
export async function sAbonnerAuxPush(token: string, demander = false): Promise<NotificationPermission | "non-supporte"> {
  if (!verifierSupportPush()) return "non-supporte";

  try {
    const permission = demander ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") return permission;

    const registration = await navigator.serviceWorker.ready;
    const { cle_publique } = await apiFetch<{ cle_publique: string }>("/push/cle-publique", { token });
    if (!cle_publique) return permission;

    let abonnement = await registration.pushManager.getSubscription();
    if (!abonnement) {
      abonnement = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64VersUint8Array(cle_publique) as BufferSource,
      });
    }

    const donnees = abonnement.toJSON();
    await apiFetch("/moi/push-subscriptions", {
      method: "POST",
      token,
      body: { endpoint: donnees.endpoint, keys: donnees.keys },
    });
    return permission;
  } catch {
    return permissionNotifications();
  }
}
