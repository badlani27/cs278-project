import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "@soundboard/db";
import type { Env } from "../env";
import { isSpotifyConfigured } from "../env";
import {
  exchangeCodeForToken,
  fetchSpotifyProfile,
  spotifyAuthorizeUrl,
} from "../services/spotify";

export function createAuthRouter(env: Env) {
  const r = Router();

  r.get("/spotify/login", (req, res) => {
    if (!isSpotifyConfigured(env)) {
      res.status(503).json({
        error: "Spotify is not configured. Add SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI to .env.",
      });
      return;
    }
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const url = spotifyAuthorizeUrl(
      env.SPOTIFY_CLIENT_ID,
      env.SPOTIFY_REDIRECT_URI,
      state,
    );
    res.redirect(url);
  });

  r.get("/spotify/callback", async (req, res) => {
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
        },
        update: {
          displayName,
          email: profile.email ?? undefined,
          imageUrl: profile.images?.[0]?.url ?? undefined,
        },
      });
      req.session.userId = user.id;
      res.redirect(`${env.CLIENT_URL}/`);
    } catch (e) {
      console.error(e);
      res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`);
    }
  });

  r.get("/me", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      res.json({ user: null });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, imageUrl: true },
    });
    res.json({ user: user ?? null });
  });

  r.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Could not log out" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });

  return r;
}
