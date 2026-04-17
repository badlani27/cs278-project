import { Router } from "express";
import { prisma } from "@soundboard/db";
import { requireAuth } from "../middleware/requireAuth";

type IdParams = { id: string };

export function createLikesRouter() {
  const r = Router({ mergeParams: true });

  r.post("/", requireAuth, async (req, res) => {
    const boardId = (req.params as IdParams).id;
    const userId = req.session.userId!;
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    await prisma.like.upsert({
      where: { userId_boardId: { userId, boardId } },
      create: { userId, boardId },
      update: {},
    });
    const count = await prisma.like.count({ where: { boardId } });
    res.json({ liked: true, likeCount: count });
  });

  r.delete("/", requireAuth, async (req, res) => {
    const boardId = (req.params as IdParams).id;
    const userId = req.session.userId!;
    await prisma.like.deleteMany({ where: { userId, boardId } });
    const count = await prisma.like.count({ where: { boardId } });
    res.json({ liked: false, likeCount: count });
  });

  return r;
}
