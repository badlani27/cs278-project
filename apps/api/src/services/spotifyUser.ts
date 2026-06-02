import { prisma } from "@soundboard/db";
import { refreshAccessToken } from "./spotify";

type UserTokenCache = {
  accessToken: string;
  expiresAt: number;
};

const tokenCache = new Map<string, UserTokenCache>();

export class SpotifyPersonalError extends Error {
  constructor(
    message: string,
    readonly code: "not_linked" | "scope_missing" | "spotify_error",
  ) {
    super(message);
    this.name = "SpotifyPersonalError";
  }
}

export async function getUserSpotifyAccessToken(
  userId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cached = tokenCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 5000) {
    return cached.accessToken;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { spotifyRefreshToken: true },
  });

  if (!user?.spotifyRefreshToken) {
    throw new SpotifyPersonalError(
      "Reconnect Spotify to import your listening history and playlists.",
      "not_linked",
    );
  }

  try {
    const refreshed = await refreshAccessToken(
      user.spotifyRefreshToken,
      clientId,
      clientSecret,
    );

    if (refreshed.refresh_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { spotifyRefreshToken: refreshed.refresh_token },
      });
    }

    tokenCache.set(userId, {
      accessToken: refreshed.access_token,
      expiresAt: now + refreshed.expires_in * 1000,
    });

    return refreshed.access_token;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("403") || message.includes("scope")) {
      throw new SpotifyPersonalError(
        "Log out and sign in again to grant playlist and listening access.",
        "scope_missing",
      );
    }
    throw new SpotifyPersonalError(
      "Could not reach Spotify. Try again in a moment.",
      "spotify_error",
    );
  }
}

export function clearUserSpotifyTokenCache(userId: string): void {
  tokenCache.delete(userId);
}
