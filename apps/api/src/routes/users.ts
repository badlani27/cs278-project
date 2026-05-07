import { Router } from "express";
import { prisma } from "@soundboard/db";
import { toBoardSummary } from "../services/boardMapper";

const userBoardInclude = {
  user: { select: { id: true, displayName: true, imageUrl: true } },
  tracks: {
    orderBy: { position: "asc" as const },
    select: { albumImageUrl: true },
    take: 4,
  },
  parentBoard: { select: { id: true, title: true } },
  _count: { select: { likes: true, comments: true, remixes: true } },
};

export function createUsersRouter() {
  const r = Router();

  r.get("/:id", async (req, res) => {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, displayName: true, imageUrl: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const createdBoards = await prisma.board.findMany({
      where: { userId: id, parentBoardId: null },
      include: userBoardInclude,
      orderBy: { createdAt: "desc" },
    });
    const remixBoards = await prisma.board.findMany({
      where: { userId: id, parentBoardId: { not: null } },
      include: userBoardInclude,
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        imageUrl: user.imageUrl,
        memberSince: user.createdAt.toISOString(),
      },
      boards: createdBoards.map((b) => toBoardSummary(b)),
      remixes: remixBoards.map((b) => toBoardSummary(b)),
    });
  });

  return r;
}
