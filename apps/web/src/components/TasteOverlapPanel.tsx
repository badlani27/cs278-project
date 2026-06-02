import type { BoardTasteOverlap } from "@soundboard/shared";

type Props = {
  overlap: BoardTasteOverlap | null;
  loading: boolean;
  error: string | null;
};

export function TasteOverlapPanel({ overlap, loading, error }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-mist/40 px-4 py-3 text-sm text-muted">
        Checking taste overlap…
      </div>
    );
  }

  if (error) return null;

  if (!overlap) return null;

  const hasTracks = overlap.sharedTracks.length > 0;
  const hasTags = overlap.sharedTags.length > 0;
  if (!hasTracks && !hasTags) return null;

  return (
    <section className="rounded-2xl border border-line bg-sky/25 px-4 py-4 shadow-lift">
      <h2 className="font-display text-sm text-ink">Your taste & this board</h2>
      <p className="mt-1 text-xs text-muted">
        Soft signals to spark conversation — not a score.
      </p>
      {hasTracks && (
        <p className="mt-3 text-sm text-ink">
          You&apos;ve listened to{" "}
          <span className="font-medium">{overlap.sharedTracks.length}</span> of these tracks
          recently:{" "}
          {overlap.sharedTracks
            .slice(0, 3)
            .map((t) => t.name)
            .join(", ")}
          {overlap.sharedTracks.length > 3 ? "…" : ""}
        </p>
      )}
      {hasTags && (
        <div className="mt-3 flex flex-wrap gap-2">
          {overlap.sharedTags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted ring-1 ring-line"
            >
              shared: {t}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
