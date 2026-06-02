import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@soundboard/db";
import { isSpotifyConfigured, loadEnv } from "../env";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import {
  exchangeCodeForToken,
  fetchSpotifyProfile,
  spotifyAuthorizeUrl,
} from "../services/spotify";
import { clearUserSpotifyTokenCache } from "../services/spotifyUser";
import { logUsageEvent, UsageEventType } from "../services/usageLog";

const preferencesSchema = z.object({
  weeklySeedOptIn: z.boolean(),
});

function toSessionUser(u: {
  id: string;
  displayName: string;
  imageUrl: string | null;
  spotifyRefreshToken: string | null;
  weeklySeedOptIn: boolean;
}) {
  return {
    id: u.id,
    displayName: u.displayName,
    imageUrl: u.imageUrl,
    spotifyLibraryLinked: Boolean(u.spotifyRefreshToken),
    weeklySeedOptIn: u.weeklySeedOptIn,
  };
}

export function createAuthRouter() {
  const r = Router();

  r.get("/spotify/login", (req, res) => {
    const env = loadEnv();
    if (!isSpotifyConfigured(env)) {
      res.redirect(`${env.CLIENT_URL}/login?error=spotify_not_configured`);
      return;
    }
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const url = spotifyAuthorizeUrl(
      env.SPOTIFY_CLIENT_ID,
      env.SPOTIFY_REDIRECT_URI,
      state,
    );
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save failed before Spotify redirect:", saveErr);
        res.redirect(`${env.CLIENT_URL}/login?error=session_failed`);
        return;
      }
      res.redirect(url);
    });
  });

  r.get(
    "/spotify/callback",
    asyncHandler(async (req, res) => {
      const env = loadEnv();
      if (!isSpotifyConfigured(env)) {
        res.redirect(`${env.CLIENT_URL}/login?error=spotify_not_configured`);
        return;
      }
      const code = typeof req.query.code === "string" ? req.query.code : null;
      const state = typeof req.query.state === "string" ? req.query.state : null;
      const err = typeof req.query.error === "string" ? req.query.error : null;
      if (err) {
        res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(err)}`);
        return;
      }
      if (!code || !state || state !== req.session.oauthState) {
        console.error("OAuth callback rejected", {
          hasCode: Boolean(code),
          hasState: Boolean(state),
          sessionState: req.session.oauthState ?? null,
          stateMatch: state === req.session.oauthState,
        });
        res.redirect(`${env.CLIENT_URL}/login?error=invalid_oauth`);
        return;
      }
      delete req.session.oauthState;

      try {
        const token = await exchangeCodeForToken(
          code,
          env.SPOTIFY_CLIENT_ID,
          env.SPOTIFY_CLIENT_SECRET,
          env.SPOTIFY_REDIRECT_URI,
        );
        const profile = await fetchSpotifyProfile(token.access_token);
        const displayName = profile.display_name?.trim() || "Spotify listener";
        const user = await prisma.user.upsert({
          where: { spotifyId: profile.id },
          create: {
            spotifyId: profile.id,
            displayName,
            email: profile.email ?? null,
            imageUrl: profile.images?.[0]?.url ?? null,
            spotifyRefreshToken: token.refresh_token ?? null,
          },
          update: {
            displayName,
            email: profile.email ?? undefined,
            imageUrl: profile.images?.[0]?.url ?? undefined,
            ...(token.refresh_token ? { spotifyRefreshToken: token.refresh_token } : {}),
          },
        });
        req.session.userId = user.id;
        await logUsageEvent(UsageEventType.LOGIN, user.id);
        res.redirect(`${env.CLIENT_URL}/`);
      } catch (e) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        if (
          message.includes("Can't reach database") ||
          message.includes("database server") ||
          message.includes("PrismaClientInitializationError")
        ) {
          res.redirect(`${env.CLIENT_URL}/login?error=database_unavailable`);
          return;
        }
        res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`);
      }
    }),
  );

  r.get(
    "/me",
    asyncHandler(async (req, res) => {
      const userId = req.session.userId;
      if (!userId) {
        res.json({ user: null });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          displayName: true,
          imageUrl: true,
          spotifyRefreshToken: true,
          weeklySeedOptIn: true,
        },
      });
      res.json({ user: user ? toSessionUser(user) : null });
    }),
  );

  r.patch(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = preferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid body" });
        return;
      }
      const user = await prisma.user.update({
        where: { id: req.session.userId! },
        data: { weeklySeedOptIn: parsed.data.weeklySeedOptIn },
        select: {
          id: true,
          displayName: true,
          imageUrl: true,
          spotifyRefreshToken: true,
          weeklySeedOptIn: true,
        },
      });
      res.json({ user: toSessionUser(user) });
    }),
  );

  r.post("/logout", (req, res) => {
    const userId = req.session.userId;
    if (userId) clearUserSpotifyTokenCache(userId);
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Could not log out" });
        return;
      }
      res.clearCookie("soundboard.sid");
      res.json({ ok: true });
    });
  });

  return r;
}
