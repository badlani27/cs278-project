import { prisma } from "@soundboard/db";

export const UsageEventType = {
  LOGIN: "LOGIN",
  BOARD_CREATE: "BOARD_CREATE",
  BOARD_REMIX: "BOARD_REMIX",
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  REPLY: "REPLY",
  BOARD_SEED_VIEW: "BOARD_SEED_VIEW",
} as const;

export type UsageEventTypeName = (typeof UsageEventType)[keyof typeof UsageEventType];

export async function logUsageEvent(
  eventType: UsageEventTypeName,
  userId?: string | null,
  boardId?: string | null,
): Promise<void> {
  try {
    await prisma.usageEvent.create({
      data: {
        eventType,
        userId: userId ?? null,
        boardId: boardId ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to log usage event:", eventType, err);
  }
}

export async function getUsageStats(since?: Date) {
  const sinceDate = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.usageEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: sinceDate } },
    _count: { _all: true },
  });
  const activeUsers = await prisma.usageEvent.findMany({
    where: { createdAt: { gte: sinceDate }, userId: { not: null } },
    distinct: ["userId"],
    select: { userId: true },
  });

  const totals = {
    logins: 0,
    boardCreates: 0,
    remixes: 0,
    likes: 0,
    comments: 0,
    replies: 0,
    boardSeedViews: 0,
  };

  for (const row of events) {
    const count = row._count._all;
    switch (row.eventType) {
      case UsageEventType.LOGIN:
        totals.logins = count;
        break;
      case UsageEventType.BOARD_CREATE:
        totals.boardCreates = count;
        break;
      case UsageEventType.BOARD_REMIX:
        totals.remixes = count;
        break;
      case UsageEventType.LIKE:
        totals.likes = count;
        break;
      case UsageEventType.COMMENT:
        totals.comments = count;
        break;
      case UsageEventType.REPLY:
        totals.replies = count;
        break;
      case UsageEventType.BOARD_SEED_VIEW:
        totals.boardSeedViews = count;
        break;
      default:
        break;
    }
  }

  return {
    activeUsers: activeUsers.length,
    totals,
    since: sinceDate.toISOString(),
  };
}
