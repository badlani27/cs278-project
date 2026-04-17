import { Router } from "express";
import { z } from "zod";
import { prisma } from "@soundboard/db";
import { requireAuth } from "../middleware/requireAuth";
import type { CommentNode, PublicUser } from "@soundboard/shared";

type IdParams = { id: string };

const bodySchema = z.object({
  body: z.string().min(1).max(4000),
});

function toPublicUser(u: { id: string; displayName: string; imageUrl: string | null }): PublicUser {
  return { id: u.id, displayName: u.displayName, imageUrl: u.imageUrl };
}

export function createBoardCommentsRouter() {
  const r = Router({ mergeParams: true });

  r.get("/", async (req, res) => {
    const boardId = (req.params as IdParams).id;
    const exists = await prisma.board.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!exists) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const comments = await fetchCommentTree(boardId);
    res.json({ comments });
  });

  r.post("/", requireAuth, async (req, res) => {
    const boardId = (req.params as IdParams).id;
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const comment = await prisma.comment.create({
      data: {
        boardId,
        userId: req.session.userId!,
        body: parsed.data.body.trim(),
      },
      include: { user: { select: { id: true, displayName: true, imageUrl: true } } },
    });
    res.status(201).json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      user: toPublicUser(comment.user),
      replies: [],
    });
  });

  return r;
}

export function createCommentRepliesRouter() {
  const r = Router({ mergeParams: true });

  r.post("/", requireAuth, async (req, res) => {
    const parentId = (req.params as IdParams).id;
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    if (parent.parentCommentId) {
      res.status(400).json({ error: "Only one level of replies is supported" });
      return;
    }
    const comment = await prisma.comment.create({
      data: {
        boardId: parent.boardId,
        userId: req.session.userId!,
        parentCommentId: parentId,
        body: parsed.data.body.trim(),
      },
      include: { user: { select: { id: true, displayName: true, imageUrl: true } } },
    });
    res.status(201).json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      user: toPublicUser(comment.user),
    });
  });

  return r;
}

export async function fetchCommentTree(boardId: string): Promise<CommentNode[]> {
  const all = await prisma.comment.findMany({
    where: { boardId },
    include: { user: { select: { id: true, displayName: true, imageUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  const top = all.filter((c) => !c.parentCommentId);
  const byParent = new Map<string, typeof all>();
  for (const c of all) {
    if (c.parentCommentId) {
      const list = byParent.get(c.parentCommentId) ?? [];
      list.push(c);
      byParent.set(c.parentCommentId, list);
    }
  }
  return top.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    user: toPublicUser(c.user),
    replies: (byParent.get(c.id) ?? []).map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      user: toPublicUser(r.user),
    })),
  }));
}
