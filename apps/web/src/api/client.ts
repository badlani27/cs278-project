import { demoFetch } from "./demoData";

/** Production on Vercel uses /api proxy (see vercel.json) so session cookies stay first-party. */
function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.PROD) return "/api";
  return "http://127.0.0.1:4000";
}

export const API_BASE = resolveApiBase();
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

/** Spotify OAuth goes through the same origin as the web app in production (/api proxy). */
export function spotifyLoginUrl(): string {
  return `${API_BASE}/auth/spotify/login`;
}

export async function checkApiHealth(): Promise<{
  ok: boolean;
  spotifyConfigured: boolean;
  database: boolean;
}> {
  const fail = { ok: false, spotifyConfigured: false, database: false };
  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        credentials: "include",
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        return fail;
      }
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
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
    }
  }
  return fail;
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
