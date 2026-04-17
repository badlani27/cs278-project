import type { SpotifySearchTrack } from "@soundboard/shared";

type TokenCache = { token: string; expiresAt: number };

let clientCredentialsCache: TokenCache | null = null;

export async function getClientCredentialsToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const now = Date.now();
  if (clientCredentialsCache && clientCredentialsCache.expiresAt > now + 5000) {
    return clientCredentialsCache.token;
  }
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  clientCredentialsCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function searchTracks(
  q: string,
  clientId: string,
  clientSecret: string,
  limit = 12,
): Promise<SpotifySearchTrack[]> {
  const token = await getClientCredentialsToken(clientId, clientSecret);
  const params = new URLSearchParams({
    q,
    type: "track",
    limit: String(limit),
  });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify search error: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    tracks?: {
      items?: Array<{
        id: string;
        name: string;
        preview_url: string | null;
        artists: { name: string }[];
        album: { images: { url: string }[] };
      }>;
    };
  };
  const items = json.tracks?.items ?? [];
  return items.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name).join(", "),
    albumImageUrl: t.album.images[0]?.url ?? null,
    previewUrl: t.preview_url,
  }));
}

export function spotifyAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-read-email user-read-private",
    state,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token?: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify code exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token?: string }>;
}

export async function fetchSpotifyProfile(accessToken: string): Promise<{
  id: string;
  display_name: string | null;
  email?: string;
  images?: { url: string }[];
}> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify profile error: ${res.status} ${text}`);
  }
  return res.json() as Promise<{
    id: string;
    display_name: string | null;
    email?: string;
    images?: { url: string }[];
  }>;
}
