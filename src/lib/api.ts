export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

// Sans ça, une requête dont la réponse n'arrive jamais (réseau coupé/instable)
// laisse l'écran sur "Chargement…" indéfiniment — rien ne rejette la promesse.
// Le délai fait aboutir l'appel d'une façon ou d'une autre : succès, erreur
// serveur, ou ce timeout.
const DELAI_REQUETE_MS = 20_000;

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  code: string;
  fields?: Record<string, string[]>;
  status: number;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.fields = error.fields;
    this.status = status;
  }
}

async function requete(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<{ data: unknown; meta: Record<string, unknown> }> {
  // FormData (upload de fichier) : ne pas JSON.stringify ni poser
  // Content-Type nous-mêmes — le navigateur pose la frontière multipart
  // correcte automatiquement.
  const estFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(DELAI_REQUETE_MS),
      headers: {
        ...(estFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: estFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (e) {
    // fetch() rejette avec une exception brute (jamais une réponse HTTP) sur
    // un réseau injoignable ou l'abandon ci-dessus — uniformisé en
    // ApiRequestError pour que tout appelant n'ait qu'une seule forme
    // d'erreur à gérer.
    const delaiDepasse = e instanceof DOMException && e.name === "TimeoutError";
    throw new ApiRequestError(
      {
        code: delaiDepasse ? "TIMEOUT" : "NETWORK_ERROR",
        message: delaiDepasse
          ? "La connexion a mis trop de temps à répondre. Vérifie ta connexion et réessaie."
          : "Impossible de joindre le serveur. Vérifie ta connexion et réessaie.",
      },
      0
    );
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    const error: ApiError = json?.error ?? {
      code: "SERVER_ERROR",
      message: "Une erreur est survenue, réessayez.",
    };

    throw new ApiRequestError(error, response.status);
  }

  return { data: json.data, meta: json.meta ?? {} };
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const { data } = await requete(path, options);
  return data as T;
}

export async function apiFetchAvecMeta<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const { data, meta } = await requete(path, options);
  return { data: data as T, meta };
}
