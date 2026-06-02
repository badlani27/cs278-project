import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getUsageStats } from "../services/usageLog";

export function createStatsRouter() {
  const r = Router();

  r.get(
    "/",
    asyncHandler(async (_req, res) => {
      const stats = await getUsageStats();
      res.json(stats);
    }),
  );

  return r;
}
