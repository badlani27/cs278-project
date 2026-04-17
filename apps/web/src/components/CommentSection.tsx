import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CommentNode } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Props = { boardId: string };

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function CommentSection({ boardId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentNode[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topBody, setTopBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ comments: CommentNode[] }>(`/boards/${boardId}/comments`);
      setComments(data.comments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load comments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [boardId]);

  async function postTop() {
    if (!user || !topBody.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/boards/${boardId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: topBody.trim() }),
      });
      setTopBody("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  async function postReply(parentId: string) {
    const body = (replyDrafts[parentId] ?? "").trim();
    if (!user || !body) return;
    setBusy(true);
    try {
      await apiFetch(`/comments/${parentId}/replies`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setReplyDrafts((d) => ({ ...d, [parentId]: "" }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reply");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-cream/90 p-5 shadow-soft">
      <header>
        <h2 className="font-display text-xl text-ink">Conversation</h2>
        <p className="mt-1 text-sm text-muted">
          Reactions, questions, taste talk — this is part of the board.
        </p>
      </header>

      {user ? (
        <div className="space-y-2">
          <label htmlFor="new-comment" className="sr-only">
            New comment
          </label>
          <textarea
            id="new-comment"
            value={topBody}
            onChange={(e) => setTopBody(e.target.value)}
            rows={3}
            placeholder="Leave a note, ask who their favorite artist is, react to the vibe…"
            className="w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-ink shadow-lift outline-none ring-ink/10 focus:ring-2"
          />
          <button
            type="button"
            disabled={busy || !topBody.trim()}
            onClick={() => void postTop()}
            className="rounded-full bg-ink px-4 py-2 text-sm text-cream shadow-lift transition hover:bg-muted disabled:opacity-50"
          >
            Post comment
          </button>
        </div>
      ) : (
        <p className="rounded-2xl bg-mist/80 px-3 py-2 text-sm text-muted">
          <Link to="/login" className="underline-offset-2 hover:underline">
            Log in
          </Link>{" "}
          to join the thread.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-800/80" role="alert">
          {error}
        </p>
      )}

      <div className="min-h-[200px] flex-1 space-y-4 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-muted">Loading comments…</p>}
        {!loading && comments && comments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-card/60 px-4 py-6 text-center text-sm text-muted">
            No comments yet — be the first to react to this board.
          </p>
        )}
        {comments?.map((c) => (
          <article key={c.id} className="rounded-2xl bg-card/80 p-4 shadow-lift ring-1 ring-line">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                to={`/users/${c.user.id}`}
                className="text-sm font-medium text-ink underline-offset-2 hover:underline"
              >
                {c.user.displayName}
              </Link>
              <time className="text-xs text-muted" dateTime={c.createdAt}>
                {formatTime(c.createdAt)}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{c.body}</p>
            {c.replies.length > 0 && (
              <ul className="mt-3 space-y-2 border-l-2 border-blush/60 pl-3">
                {c.replies.map((r) => (
                  <li key={r.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        to={`/users/${r.user.id}`}
                        className="text-xs font-medium text-ink underline-offset-2 hover:underline"
                      >
                        {r.user.displayName}
                      </Link>
                      <time className="text-[10px] text-muted" dateTime={r.createdAt}>
                        {formatTime(r.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-ink">{r.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {user && (
              <div className="mt-3 space-y-1">
                <label className="sr-only" htmlFor={`reply-${c.id}`}>
                  Reply to {c.user.displayName}
                </label>
                <input
                  id={`reply-${c.id}`}
                  value={replyDrafts[c.id] ?? ""}
                  onChange={(e) =>
                    setReplyDrafts((d) => ({
                      ...d,
                      [c.id]: e.target.value,
                    }))
                  }
                  placeholder="Reply…"
                  className="w-full rounded-xl border border-line bg-mist/50 px-3 py-2 text-sm outline-none ring-ink/10 focus:ring-2"
                />
                <button
                  type="button"
                  disabled={busy || !(replyDrafts[c.id] ?? "").trim()}
                  onClick={() => void postReply(c.id)}
                  className="text-xs text-muted underline-offset-2 hover:underline"
                >
                  Send reply
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
