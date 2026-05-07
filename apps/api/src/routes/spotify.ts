import { Router } from "express";
import type { Env } from "../env";
import { isSpotifyConfigured } from "../env";
import { searchTracks } from "../services/spotify";

export function createSpotifyRouter(env: Env) {
  const r = Router();

  r.get("/search", async (req, res) => {
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
      res.status(502).json({ error: "Spotify search failed" });
    }
  });

  return r;
}
