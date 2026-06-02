import { Router } from "express";
import { isSpotifyConfigured, loadEnv } from "../env";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../middleware/asyncHandler";
import { generateBoardSeed } from "../services/boardSocial";
import {
  fetchPlaylistTracks,
  fetchRecentlyPlayed,
  fetchTopTracks,
  fetchUserPlaylists,
  searchTracks,
  type TopTracksRange,
} from "../services/spotify";
import {
  getUserSpotifyAccessToken,
  SpotifyPersonalError,
} from "../services/spotifyUser";
import { logUsageEvent, UsageEventType } from "../services/usageLog";

function personalErrorResponse(res: import("express").Response, err: SpotifyPersonalError) {
  const status = err.code === "spotify_error" ? 502 : 403;
  res.status(status).json({ error: err.message, code: err.code, tracks: [], playlists: [] });
}

const TOP_RANGES = new Set<TopTracksRange>(["short_term", "medium_term", "long_term"]);

export function createSpotifyRouter() {
  const r = Router();

  r.get(
    "/search",
    asyncHandler(async (req, res) => {
      const env = loadEnv();
      if (!isSpotifyConfigured(env)) {
        res.status(503).json({
          error: "Spotify search unavailable. Configure Spotify app credentials in .env.",
          tracks: [],
        });
        return;
      }
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (q.length < 2) {
        res.json({ tracks: [] });
        return;
      }
      try {
        const tracks = await searchTracks(q, env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
        res.json({ tracks });
      } catch (e) {
        console.error(e);
        res.status(502).json({ error: "Spotify search failed", tracks: [] });
      }
    }),
  );

  r.get(
    "/recent",
    requireAuth,
    asyncHandler(async (req, res) => {
      const env = loadEnv();
      if (!isSpotifyConfigured(env)) {
        res.status(503).json({ error: "Spotify not configured", tracks: [] });
        return;
      }
      try {
        const token = await getUserSpotifyAccessToken(
          req.session.userId!,
          env.SPOTIFY_CLIENT_ID,
          env.SPOTIFY_CLIENT_SECRET,
        );
        const tracks = await fetchRecentlyPlayed(token, 20);
        res.json({ tracks });
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          personalErrorResponse(res, e);
          return;
        }
        console.error(e);
        res.status(502).json({ error: "Could not load recently played tracks", tracks: [] });
      }
    }),
  );

  r.get(
    "/top-tracks",
    requireAuth,
    asyncHandler(async (req, res) => {
      const env = loadEnv();
      if (!isSpotifyConfigured(env)) {
        res.status(503).json({ error: "Spotify not configured", tracks: [] });
        return;
      }
      const rawRange = typeof req.query.range === "string" ? req.query.range : "short_term";
      const range: TopTracksRange = TOP_RANGES.has(rawRange as TopTracksRange)
        ? (rawRange as TopTracksRange)
        : "short_term";
      try {
        const token = await getUserSpotifyAccessToken(
          req.session.userId!,
          env.SPOTIFY_CLIENT_ID,
          env.SPOTIFY_CLIENT_SECRET,
        );
        const tracks = await fetchTopTracks(token, range, 10);
        res.json({ tracks, range });
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          personalErrorResponse(res, e);
          return;
        }
        console.error(e);
        res.status(502).json({ error: "Could not load top tracks", tracks: [] });
      }
    }),
  );

  r.get(
    "/board-seed",
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const result = await generateBoardSeed(req.session.userId!);
        if (result.available) {
          await logUsageEvent(UsageEventType.BOARD_SEED_VIEW, req.session.userId!);
        }
        res.json(result);
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          res.status(403).json({
            available: false,
            reason: "spotify_not_linked",
            error: e.message,
          });
          return;
        }
        throw e;
      }
    }),
  );

  r.get(
    "/playlists",
    requireAuth,
    asyncHandler(async (req, res) => {
      const env = loadEnv();
      if (!isSpotifyConfigured(env)) {
        res.status(503).json({ error: "Spotify not configured", playlists: [] });
        return;
      }
      try {
        const token = await getUserSpotifyAccessToken(
          req.session.userId!,
          env.SPOTIFY_CLIENT_ID,
          env.SPOTIFY_CLIENT_SECRET,
        );
        const playlists = await fetchUserPlaylists(token, 30);
        res.json({ playlists });
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          personalErrorResponse(res, e);
          return;
        }
        console.error(e);
        res.status(502).json({ error: "Could not load playlists", playlists: [] });
      }
    }),
  );

  r.get(
    "/playlists/:id/tracks",
    requireAuth,
    asyncHandler(async (req, res) => {
      const env = loadEnv();
      if (!isSpotifyConfigured(env)) {
        res.status(503).json({ error: "Spotify not configured", tracks: [] });
        return;
      }
      const playlistId = req.params.id;
      if (!playlistId) {
        res.status(400).json({ error: "Missing playlist id", tracks: [] });
        return;
      }
      try {
        const token = await getUserSpotifyAccessToken(
          req.session.userId!,
          env.SPOTIFY_CLIENT_ID,
          env.SPOTIFY_CLIENT_SECRET,
        );
        const tracks = await fetchPlaylistTracks(token, playlistId, 80);
        res.json({ tracks });
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          personalErrorResponse(res, e);
          return;
        }
        console.error(e);
        res.status(502).json({ error: "Could not load playlist tracks", tracks: [] });
      }
    }),
  );

  return r;
}
