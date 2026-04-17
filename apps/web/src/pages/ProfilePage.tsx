import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { BoardSummary, PublicUser } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { BoardCard } from "../components/BoardCard";

type ProfilePayload = {
  user: PublicUser & { memberSince: string };
  boards: BoardSummary[];
  remixes: BoardSummary[];
};

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function run() {
      try {
        const p = await apiFetch<ProfilePayload>(`/users/${id}`);
        if (!cancelled) setData(p);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Not found");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-blush/40 px-6 py-8 text-center text-sm text-ink">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-cream/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-cream/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-cream/90 p-6 shadow-soft">
        {data.user.imageUrl ? (
          <img
            src={data.user.imageUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-2 ring-line"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mist font-display text-2xl text-muted ring-2 ring-line">
            {data.user.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl text-ink">{data.user.displayName}</h1>
          <p className="text-sm text-muted">
            Here since {new Date(data.user.memberSince).toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Original boards</h2>
        {data.boards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card/60 px-4 py-8 text-center text-sm text-muted">
            No original boards yet.
          </p>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2">
            {data.boards.map((b) => (
              <div key={b.id} className="mb-6 break-inside-avoid">
                <BoardCard board={b} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Remixes</h2>
        {data.remixes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card/60 px-4 py-8 text-center text-sm text-muted">
            No public remixes yet.
          </p>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2">
            {data.remixes.map((b) => (
              <div key={b.id} className="mb-6 break-inside-avoid">
                <BoardCard board={b} />
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted">
        <Link to="/" className="underline-offset-2 hover:underline">
          Back to feed
        </Link>
      </p>
    </div>
  );
}
