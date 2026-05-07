import { Router } from "express";
import { createCommentRepliesRouter } from "./comments";

/** POST /comments/:id/replies */
export function createCommentsRootRouter() {
  const r = Router();
  r.use("/:id/replies", createCommentRepliesRouter());
  return r;
}
