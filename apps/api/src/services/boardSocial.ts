import { prisma } from "@soundboard/db";
import type { BoardSeedDraft, BoardTasteOverlap, SpotifySearchTrack } from "@soundboard/shared";
import { loadEnv } from "../env";
import {
  fetchRecentlyPlayed,
  fetchTopTracks,
  type TopTracksRange,
} from "./spotify";
import { getUserSpotifyAccessToken, SpotifyPersonalError } from "./spotifyUser";

function dedupeTracks(tracks: SpotifySearchTrack[], max: number): SpotifySearchTrack[] {
  const seen = new Set<string>();
  const out: SpotifySearchTrack[] = [];
  for (const t of tracks) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

export async function computeBoardOverlap(
  userId: string,
  boardId: string,
): Promise<BoardTasteOverlap> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { tags: true, tracks: { select: { spotifyTrackId: true } } },
  });
  if (!board) {
    return { sharedTracks: [], sharedTags: [] };
  }

  const boardTrackIds = new Set(board.tracks.map((t) => t.spotifyTrackId));

  const userBoards = await prisma.board.findMany({
    where: { userId },
    select: { tags: true },
  });
  const userTagSet = new Set(
    userBoards.flatMap((b) => b.tags.map((t) => t.toLowerCase())),
  );
  const sharedTags = board.tags.filter((t) => userTagSet.has(t.toLowerCase()));

  const env = loadEnv();
  let sharedTracks: SpotifySearchTrack[] = [];
  try {
    const token = await getUserSpotifyAccessToken(
      userId,
      env.SPOTIFY_CLIENT_ID,
      env.SPOTIFY_CLIENT_SECRET,
    );
    const recent = await fetchRecentlyPlayed(token, 50);
    sharedTracks = recent.filter((t) => boardTrackIds.has(t.id));
  } catch (e) {
    if (!(e instanceof SpotifyPersonalError)) throw e;
  }

  return { sharedTracks, sharedTags };
}

export async function getRemixSuggestions(
  userId: string,
  boardId: string,
): Promise<{ suggestions: SpotifySearchTrack[] }> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { tracks: { select: { spotifyTrackId: true } } },
  });
  if (!board) {
    return { suggestions: [] };
  }

  const boardTrackIds = new Set(board.tracks.map((t) => t.spotifyTrackId));
  const env = loadEnv();
  const token = await getUserSpotifyAccessToken(
    userId,
    env.SPOTIFY_CLIENT_ID,
    env.SPOTIFY_CLIENT_SECRET,
  );
  const recent = await fetchRecentlyPlayed(token, 50);
  const suggestions = recent.filter((t) => !boardTrackIds.has(t.id)).slice(0, 8);
  return { suggestions };
}

export async function generateBoardSeed(userId: string): Promise<{
  available: boolean;
  reason?: string;
  draft?: BoardSeedDraft;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weeklySeedOptIn: true, lastBoardSeedAt: true },
  });
  if (!user?.weeklySeedOptIn) {
    return { available: false, reason: "opt_out" };
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (user.lastBoardSeedAt && user.lastBoardSeedAt.getTime() > weekAgo) {
    return { available: false, reason: "recently_shown" };
  }

  const env = loadEnv();
  const token = await getUserSpotifyAccessToken(
    userId,
    env.SPOTIFY_CLIENT_ID,
    env.SPOTIFY_CLIENT_SECRET,
  );

  const [recent, top] = await Promise.all([
    fetchRecentlyPlayed(token, 20),
    fetchTopTracks(token, "short_term", 10),
  ]);

  const tracks = dedupeTracks([...recent, ...top], 8);
  if (tracks.length === 0) {
    return { available: false, reason: "no_tracks" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastBoardSeedAt: new Date() },
  });

  const draft: BoardSeedDraft = {
    tracks,
    suggestedTitle: "This week's rotation",
    suggestedTags: ["recent", "on repeat"],
    descriptionHint:
      "What were you going through when these songs kept showing up? Share the mood, not just the playlist.",
  };

  return { available: true, draft };
}

export type { TopTracksRange };
