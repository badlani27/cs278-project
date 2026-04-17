import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { BoardDetail } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BoardCover } from "../components/BoardCover";
import { CommentSection } from "../components/CommentSection";

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const b = await apiFetch<BoardDetail>(`/boards/${id}`);
        if (!cancelled) setBoard(b);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleLike() {
    if (!user || !board) return;
    try {
      if (board.likedByMe) {
        const data = await apiFetch<{ likeCount: number }>(`/boards/${board.id}/like`, {
          method: "DELETE",
        });
        setBoard({ ...board, likedByMe: false, likeCount: data.likeCount });
      } else {
        const data = await apiFetch<{ likeCount: number }>(`/boards/${board.id}/like`, {
          method: "POST",
          body: "{}",
        });
        setBoard({ ...board, likedByMe: true, likeCount: data.likeCount });
      }
    } catch {
      /* ignore */
    }
  }

  if (!id) return null;

  if (loading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-[420px] animate-pulse rounded-3xl bg-cream/80" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-cream/80" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="rounded-2xl border border-line bg-blush/40 px-6 py-10 text-center">
        <p className="font-display text-lg text-ink">This board is missing</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <Link to="/" className="mt-6 inline-block text-sm underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <BoardCover
            images={board.coverImages}
            alt={`Cover collage for ${board.title}`}
            className="shadow-soft"
          />
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl text-ink">{board.title}</h1>
                <p className="mt-2 text-sm text-muted">
                  Curated by{" "}
                  <Link
                    to={`/users/${board.creator.id}`}
                    className="font-medium text-ink underline-offset-2 hover:underline"
                  >
                    {board.creator.displayName}
                  </Link>
                </p>
              </div>
              {board.isRemix && board.parentBoard && (
                <div className="rounded-2xl bg-sky/40 px-3 py-2 text-xs text-ink shadow-lift ring-1 ring-line">
                  <span className="font-medium uppercase tracking-wide">Remix</span>
                  <p className="mt-1">
                    from{" "}
                    <Link
                      to={`/boards/${board.parentBoard.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {board.parentBoard.title}
                    </Link>
                  </p>
                </div>
              )}
            </div>
            {board.description && (
              <p className="text-sm leading-relaxed text-ink/90">{board.description}</p>
            )}
            {board.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {board.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-mist px-3 py-1 text-xs text-muted ring-1 ring-line"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted">
              <span>{board.likeCount} likes</span>
              <span>{board.commentCount} comments</span>
              <span>{board.remixCount} remixes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => void toggleLike()}
                    className={`rounded-full px-4 py-2 text-sm shadow-lift transition ${
                      board.likedByMe
                        ? "bg-blush/70 text-ink"
                        : "bg-card text-ink ring-1 ring-line hover:bg-mist"
                    }`}
                  >
                    {board.likedByMe ? "Liked" : "Like"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/boards/${board.id}/remix`)}
                    className="rounded-full bg-ink px-4 py-2 text-sm text-cream shadow-lift transition hover:bg-muted"
                  >
                    Remix board
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full bg-ink px-4 py-2 text-sm text-cream shadow-lift"
                >
                  Log in to react
                </Link>
              )}
            </div>
          </div>

          <section className="rounded-2xl border border-line bg-card/80 p-5 shadow-soft">
            <h2 className="font-display text-lg text-ink">Tracks</h2>
            <ul className="mt-4 space-y-3">
              {board.tracks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl bg-mist/40 px-3 py-2 ring-1 ring-line"
                >
                  {t.albumImageUrl && (
                    <img src={t.albumImageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.trackName}</p>
                    <p className="truncate text-xs text-muted">{t.artistName}</p>
                    {t.previewUrl && (
                      <audio controls className="mt-2 h-8 w-full max-w-xs" src={t.previewUrl} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:sticky lg:top-6">
          <CommentSection boardId={board.id} />
        </div>
      </div>
    </div>
  );
}
