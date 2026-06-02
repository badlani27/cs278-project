import { demoFetch } from "./demoData";

export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

/** Spotify OAuth must hit the API directly so the session cookie matches the callback URL. */
export function spotifyLoginUrl(): string {
  return `${API_BASE}/auth/spotify/login`;
}

export async function checkApiHealth(): Promise<{
  ok: boolean;
  spotifyConfigured: boolean;
  database: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`, { credentials: "include" });
    if (!res.ok) return { ok: false, spotifyConfigured: false, database: false };
    const data = (await res.json()) as {
      ok?: boolean;
      spotifyConfigured?: boolean;
      database?: boolean;
    };
    return {
      ok: Boolean(data.ok),
      spotifyConfigured: Boolean(data.spotifyConfigured),
      database: Boolean(data.database),
    };
  } catch {
    return { ok: false, spotifyConfigured: false, database: false };
  }
}

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (DEMO_MODE) return demoFetch<T>(path, init);
    throw error;
  }
  if (DEMO_MODE && res.status === 404) return demoFetch<T>(path, init);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
