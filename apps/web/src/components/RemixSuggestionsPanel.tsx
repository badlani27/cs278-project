import type { SpotifySearchTrack } from "@soundboard/shared";

type Props = {
  suggestions: SpotifySearchTrack[];
  loading: boolean;
  error: string | null;
  onAdd: (track: SpotifySearchTrack) => void;
  onAddAll: () => void;
};

export function RemixSuggestionsPanel({
  suggestions,
  loading,
  error,
  onAdd,
  onAddAll,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-cream/60 px-4 py-3 text-sm text-muted">
        Finding tracks from your rotation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-blush/30 px-4 py-3 text-sm text-ink">
        {error}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-sky/20 p-4 shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm text-ink">From your rotation</h2>
          <p className="text-xs text-muted">
            Tracks you&apos;ve played lately that aren&apos;t on this board yet.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddAll}
          className="rounded-full bg-ink px-3 py-1 text-xs text-cream transition hover:bg-muted"
        >
          Add all ({suggestions.length})
        </button>
      </div>
      <ul className="space-y-2">
        {suggestions.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-card/90 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{t.name}</p>
              <p className="truncate text-xs text-muted">{t.artists}</p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(t)}
              className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs text-ink ring-1 ring-line hover:bg-sky/40"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
