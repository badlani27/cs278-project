/**
 * Transparent feed ranking for socially-driven discovery.
 * score = likes * 2 + comments * 3 + remixCount * 4 + recencyBoost
 *
 * recencyBoost decays over ~72h so new boards are not buried immediately.
 */
export function recencyBoost(createdAt: Date, now: Date = new Date()): number {
  const hours = Math.max(0, (now.getTime() - createdAt.getTime()) / 3_600_000);
  return Math.max(0, 48 - hours * 0.75);
}

export function boardRankingScore(input: {
  likeCount: number;
  commentCount: number;
  remixCount: number;
  createdAt: Date;
}): number {
  const engagement =
    input.likeCount * 2 + input.commentCount * 3 + input.remixCount * 4;
  return engagement + recencyBoost(input.createdAt);
}
