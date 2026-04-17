import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BoardSummary } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { BoardCard } from "../components/BoardCard";

export function FeedPage() {
  const [feed, setFeed] = useState<BoardSummary[] | null>(null);
  const [discover, setDiscover] = useState<BoardSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ feed: BoardSummary[]; discover: BoardSummary[] }>("/boards");
        if (!cancelled) {
          setFeed(data.feed);
          setDiscover(data.discover);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load feed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-full bg-cream/80" />
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-6 break-inside-avoid">
              <div className="h-72 animate-pulse rounded-2xl bg-cream/70 shadow-soft" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-blush/40 px-6 py-8 text-center shadow-soft">
        <p className="font-display text-lg text-ink">The feed is quiet</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl text-ink">Boards worth lingering on</h1>
        <p className="text-sm leading-relaxed text-muted">
          Ranked gently by conversation, remixes, and love — with a boost for fresh posts so new
          voices still surface.
        </p>
        <Link
          to="/boards/new"
          className="inline-flex rounded-full bg-ink px-4 py-2 text-sm text-cream shadow-lift transition hover:bg-muted"
        >
          Start a board
        </Link>
      </header>

      {feed && feed.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-cream/70 px-6 py-16 text-center shadow-soft">
          <p className="font-display text-xl text-ink">No boards yet</p>
          <p className="mt-2 text-sm text-muted">
            Be the first to plant a mood. Create a board and invite the conversation.
          </p>
        </div>
      ) : (
        <section>
          <h2 className="sr-only">Main feed</h2>
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {feed?.map((b) => (
              <div key={b.id} className="mb-6 break-inside-avoid">
                <BoardCard board={b} />
              </div>
            ))}
          </div>
        </section>
      )}

      {discover && discover.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-line bg-mist/40 p-6 shadow-soft">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl text-ink">Outside the usual scroll</h2>
            <p className="mt-1 text-sm text-muted">
              A few fresher voices — different creators, same love of sound — to keep discovery from
              narrowing too fast.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discover.map((b) => (
              <BoardCard key={b.id} board={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
