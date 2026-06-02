import { Router } from "express";
import { z } from "zod";
import { prisma } from "@soundboard/db";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../middleware/asyncHandler";
import { createBoardCommentsRouter } from "./comments";
import { createLikesRouter } from "./likes";
import { toBoardDetail, toBoardSummary } from "../services/boardMapper";
import { computeBoardOverlap, getRemixSuggestions } from "../services/boardSocial";
import { logUsageEvent, UsageEventType } from "../services/usageLog";
import { SpotifyPersonalError } from "../services/spotifyUser";

const trackSchema = z.object({
  spotifyTrackId: z.string().min(1),
  trackName: z.string().min(1),
  artistName: z.string().min(1),
  albumImageUrl: z.string().max(2048).nullable().optional(),
  previewUrl: z.string().max(2048).nullable().optional(),
  note: z.string().max(200).nullable().optional(),
  position: z.number().int().min(0),
});

const createBoardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  tracks: z.array(trackSchema).min(1).max(80),
  parentBoardId: z.string().min(1).nullable().optional(),
});

const baseInclude = {
  user: { select: { id: true, displayName: true, imageUrl: true } },
  tracks: {
    orderBy: { position: "asc" as const },
    select: { albumImageUrl: true },
    take: 4,
  },
  parentBoard: { select: { id: true, title: true } },
  _count: { select: { likes: true, comments: true, remixes: true } },
};

export function createBoardsRouter() {
  const r = Router();

  r.get(
    "/",
    asyncHandler(async (_req, res) => {
      const rows = await prisma.board.findMany({
        include: {
          ...baseInclude,
        },
        orderBy: { createdAt: "desc" },
        take: 300,
      });

      const summaries = rows.map((b) => toBoardSummary(b));
      const feed = [...summaries].sort((a, b) => b.rankingScore - a.rankingScore);

      const seen = new Set<string>();
      const discover: typeof feed = [];
      const chronological = [...summaries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      for (const s of chronological) {
        if (seen.has(s.creator.id)) continue;
        seen.add(s.creator.id);
        discover.push(s);
        if (discover.length >= 6) break;
      }

      res.json({ feed, discover });
    }),
  );

  r.post(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = createBoardSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
      }
      const body = parsed.data;
      const userId = req.session.userId!;

      if (body.parentBoardId) {
        const parent = await prisma.board.findUnique({ where: { id: body.parentBoardId } });
        if (!parent) {
          res.status(400).json({ error: "Parent board not found" });
          return;
        }
      }

      const board = await prisma.board.create({
        data: {
          userId,
          title: body.title.trim(),
          description: body.description.trim(),
          tags: body.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
          parentBoardId: body.parentBoardId ?? null,
          tracks: {
            create: body.tracks.map((t) => ({
              spotifyTrackId: t.spotifyTrackId,
              trackName: t.trackName,
              artistName: t.artistName,
              albumImageUrl: t.albumImageUrl ?? null,
              previewUrl: t.previewUrl ?? null,
              note: t.note?.trim() || null,
              position: t.position,
            })),
          },
        },
        include: {
          user: { select: { id: true, displayName: true, imageUrl: true } },
          tracks: { orderBy: { position: "asc" } },
          parentBoard: { select: { id: true, title: true } },
          _count: { select: { likes: true, comments: true, remixes: true } },
        },
      });

      await logUsageEvent(UsageEventType.BOARD_CREATE, userId, board.id);

      const like = await prisma.like.findUnique({
        where: { userId_boardId: { userId, boardId: board.id } },
      });
      res.status(201).json(toBoardDetail(board, Boolean(like)));
    }),
  );

  r.use("/:id/comments", createBoardCommentsRouter());
  r.use("/:id/like", createLikesRouter());

  r.get(
    "/:id/overlap",
    requireAuth,
    asyncHandler(async (req, res) => {
      const boardId = req.params.id;
      if (!boardId) {
        res.status(400).json({ error: "Missing board id" });
        return;
      }
      try {
        const overlap = await computeBoardOverlap(req.session.userId!, boardId);
        res.json(overlap);
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          res.status(403).json({
            error: e.message,
            code: e.code,
            sharedTracks: [],
            sharedTags: [],
          });
          return;
        }
        throw e;
      }
    }),
  );

  r.get(
    "/:id/remix-suggestions",
    requireAuth,
    asyncHandler(async (req, res) => {
      const boardId = req.params.id;
      if (!boardId) {
        res.status(400).json({ error: "Missing board id", suggestions: [] });
        return;
      }
      try {
        const data = await getRemixSuggestions(req.session.userId!, boardId);
        res.json(data);
      } catch (e) {
        if (e instanceof SpotifyPersonalError) {
          res.status(403).json({ error: e.message, code: e.code, suggestions: [] });
          return;
        }
        throw e;
      }
    }),
  );

  r.post(
    "/:id/remix",
    requireAuth,
    asyncHandler(async (req, res) => {
      const parentId = req.params.id;
      const parent = await prisma.board.findUnique({
        where: { id: parentId },
        include: { tracks: { orderBy: { position: "asc" } } },
      });
      if (!parent) {
        res.status(404).json({ error: "Board not found" });
        return;
      }
      const parsed = createBoardSchema.safeParse({
        ...req.body,
        parentBoardId: parentId,
      });
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
      }
      const body = parsed.data;
      if (body.parentBoardId !== parentId) {
        res.status(400).json({ error: "parentBoardId must match remix source" });
        return;
      }
      const userId = req.session.userId!;

      const board = await prisma.board.create({
        data: {
          userId,
          title: body.title.trim(),
          description: body.description.trim(),
          tags: body.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
          parentBoardId: parentId,
          tracks: {
            create: body.tracks.map((t) => ({
              spotifyTrackId: t.spotifyTrackId,
              trackName: t.trackName,
              artistName: t.artistName,
              albumImageUrl: t.albumImageUrl ?? null,
              previewUrl: t.previewUrl ?? null,
              note: t.note?.trim() || null,
              position: t.position,
            })),
          },
        },
        include: {
          user: { select: { id: true, displayName: true, imageUrl: true } },
          tracks: { orderBy: { position: "asc" } },
          parentBoard: { select: { id: true, title: true } },
          _count: { select: { likes: true, comments: true, remixes: true } },
        },
      });

      await logUsageEvent(UsageEventType.BOARD_REMIX, userId, board.id);

      const like = await prisma.like.findUnique({
        where: { userId_boardId: { userId, boardId: board.id } },
      });
      res.status(201).json(toBoardDetail(board, Boolean(like)));
    }),
  );

  r.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const board = await prisma.board.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, displayName: true, imageUrl: true } },
          tracks: { orderBy: { position: "asc" } },
          parentBoard: { select: { id: true, title: true } },
          _count: { select: { likes: true, comments: true, remixes: true } },
        },
      });
      if (!board) {
        res.status(404).json({ error: "Board not found" });
        return;
      }
      let likedByMe = false;
      if (req.session.userId) {
        const like = await prisma.like.findUnique({
          where: {
            userId_boardId: { userId: req.session.userId, boardId: id },
          },
        });
        likedByMe = Boolean(like);
      }
      const detail = toBoardDetail(board, likedByMe);
      res.json(detail);
    }),
  );

  return r;
}
