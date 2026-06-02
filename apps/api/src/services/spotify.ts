import type { SpotifySearchTrack, SpotifyPlaylistSummary } from "@soundboard/shared";

type TokenCache = { token: string; expiresAt: number };

let clientCredentialsCache: TokenCache | null = null;

/** Spotify search rejects limits above 10 (returns 400 Invalid limit). */
const SPOTIFY_SEARCH_MAX = 10;

function clampLimit(limit: number, max: number): number {
  return Math.min(Math.max(1, Math.floor(limit)), max);
}

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-read-recently-played",
  "user-top-read",
  "playlist-read-private",
].join(" ");

export type TopTracksRange = "short_term" | "medium_term" | "long_term";

type SpotifyApiTrack = {
  id: string;
  name: string;
  preview_url: string | null;
  artists: { name: string }[];
  album: { images: { url: string }[] };
};

export function mapSpotifyTrack(t: SpotifyApiTrack): SpotifySearchTrack {
  return {
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name).join(", "),
    albumImageUrl: t.album.images[0]?.url ?? null,
    previewUrl: t.preview_url,
  };
}

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

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    throw new Error(`Spotify refresh failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

export async function searchTracks(
  q: string,
  clientId: string,
  clientSecret: string,
  limit = SPOTIFY_SEARCH_MAX,
): Promise<SpotifySearchTrack[]> {
  const token = await getClientCredentialsToken(clientId, clientSecret);
  const params = new URLSearchParams({
    q,
    type: "track",
    limit: String(clampLimit(limit, SPOTIFY_SEARCH_MAX)),
  });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify search error: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    tracks?: { items?: SpotifyApiTrack[] };
  };
  return (json.tracks?.items ?? []).map(mapSpotifyTrack);
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
    scope: SPOTIFY_SCOPES,
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

export async function fetchRecentlyPlayed(
  accessToken: string,
  limit = 20,
): Promise<SpotifySearchTrack[]> {
  const params = new URLSearchParams({ limit: String(clampLimit(limit, 50)) });
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify recently played error: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    items?: { track?: SpotifyApiTrack }[];
  };
  const seen = new Set<string>();
  const tracks: SpotifySearchTrack[] = [];
  for (const item of json.items ?? []) {
    const track = item.track;
    if (!track?.id || seen.has(track.id)) continue;
    seen.add(track.id);
    tracks.push(mapSpotifyTrack(track));
  }
  return tracks;
}

export async function fetchUserPlaylists(
  accessToken: string,
  limit = 30,
): Promise<SpotifyPlaylistSummary[]> {
  const params = new URLSearchParams({ limit: String(clampLimit(limit, 50)) });
  const res = await fetch(`https://api.spotify.com/v1/me/playlists?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify playlists error: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      name: string;
      tracks?: { total: number };
      images: { url: string }[];
    } | null>;
  };
  return (json.items ?? [])
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      trackCount: p.tracks?.total ?? 0,
      imageUrl: p.images[0]?.url ?? null,
    }));
}

export async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string,
  maxTracks = 80,
): Promise<SpotifySearchTrack[]> {
  const seen = new Set<string>();
  const tracks: SpotifySearchTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks?limit=50`;

  while (url && tracks.length < maxTracks) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Spotify playlist tracks error: ${res.status} ${text}`);
    }
    const json = (await res.json()) as {
      items?: Array<{ track: SpotifyApiTrack | null }>;
      next?: string | null;
    };
    for (const item of json.items ?? []) {
      const track = item.track;
      if (!track?.id || seen.has(track.id)) continue;
      seen.add(track.id);
      tracks.push(mapSpotifyTrack(track));
      if (tracks.length >= maxTracks) break;
    }
    url = json.next ?? null;
  }

  return tracks;
}

export async function fetchTopTracks(
  accessToken: string,
  timeRange: TopTracksRange = "short_term",
  limit = 10,
): Promise<SpotifySearchTrack[]> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(clampLimit(limit, 50)),
  });
  const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify top tracks error: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { items?: SpotifyApiTrack[] };
  return (json.items ?? []).map(mapSpotifyTrack);
}
