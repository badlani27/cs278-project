import { demoFetch } from "./demoData";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

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
