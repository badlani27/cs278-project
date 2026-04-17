import { Link } from "react-router-dom";
import type { BoardSummary } from "@soundboard/shared";
import { BoardCover } from "./BoardCover";

type Props = { board: BoardSummary };

export function BoardCard({ board }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/boards/${board.id}`} className="block">
        <BoardCover
          images={board.coverImages}
          alt={`Cover for ${board.title}`}
          className="rounded-b-none rounded-t-2xl"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/boards/${board.id}`}
              className="font-display text-lg leading-snug text-ink decoration-transparent transition group-hover:underline"
            >
              {board.title}
            </Link>
            <p className="mt-1 text-sm text-muted">
              by{" "}
              <Link to={`/users/${board.creator.id}`} className="underline-offset-2 hover:underline">
                {board.creator.displayName}
              </Link>
            </p>
          </div>
          {board.isRemix && (
            <span className="shrink-0 rounded-full bg-sky/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink">
              Remix
            </span>
          )}
        </div>
        {board.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{board.description}</p>
        )}
        {board.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {board.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-full bg-mist px-2 py-0.5 text-xs text-muted ring-1 ring-line"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted">
          <span>{board.likeCount} likes</span>
          <span>{board.commentCount} comments</span>
          <span>{board.remixCount} remixes</span>
        </div>
      </div>
    </article>
  );
}
