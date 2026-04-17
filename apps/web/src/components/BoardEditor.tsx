import { useEffect, useMemo, useState } from "react";
import type { BoardTrackInput, SpotifySearchTrack } from "@soundboard/shared";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiFetch } from "../api/client";

type Props = {
  initialTitle: string;
  initialDescription: string;
  initialTags: string[];
  initialTracks: BoardTrackInput[];
  submitLabel: string;
  onSubmit: (payload: {
    title: string;
    description: string | null;
    tags: string[];
    tracks: BoardTrackInput[];
  }) => Promise<void>;
  hint?: string;
};

export function BoardEditor({
  initialTitle,
  initialDescription,
  initialTags,
  initialTracks,
  submitLabel,
  onSubmit,
  hint,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tagsRaw, setTagsRaw] = useState(initialTags.join(", "));
  const [tracks, setTracks] = useState<BoardTrackInput[]>(initialTracks);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (debounced.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      setSearchError(null);
      try {
        const data = await apiFetch<{ tracks: SpotifySearchTrack[]; error?: string }>(
          `/spotify/search?q=${encodeURIComponent(debounced)}`,
        );
        if (!cancelled) {
          if (data.error) setSearchError(data.error);
          setResults(data.tracks ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setSearchError(e instanceof Error ? e.message : "Search failed");
          setResults([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const tags = useMemo(
    () =>
      tagsRaw
        .split(/[,#]/g)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    [tagsRaw],
  );

  function addTrack(t: SpotifySearchTrack) {
    setTracks((prev) => {
      if (prev.some((p) => p.spotifyTrackId === t.id)) return prev;
      const next: BoardTrackInput = {
        spotifyTrackId: t.id,
        trackName: t.name,
        artistName: t.artists,
        albumImageUrl: t.albumImageUrl,
        previewUrl: t.previewUrl,
        position: prev.length,
      };
      return [...prev, next].map((tr, i) => ({ ...tr, position: i }));
    });
  }

  function removeAt(index: number) {
    setTracks((prev) => prev.filter((_, i) => i !== index).map((tr, i) => ({ ...tr, position: i })));
  }

  function move(index: number, dir: -1 | 1) {
    setTracks((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[index]!;
      copy[index] = copy[j]!;
      copy[j] = tmp;
      return copy.map((tr, i) => ({ ...tr, position: i }));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Give your board a title.");
      return;
    }
    if (tracks.length === 0) {
      setFormError("Add at least one track.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        tags,
        tracks,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-3xl space-y-10">
      {hint && (
        <p className="rounded-2xl border border-line bg-cream/80 px-4 py-3 text-sm leading-relaxed text-muted shadow-lift">
          {hint}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className="font-display text-sm text-ink">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-ink shadow-lift outline-none ring-ink/10 transition focus:ring-2"
            placeholder="e.g. Rainy window, warm tea"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="tags" className="font-display text-sm text-ink">
            Vibe tags
          </label>
          <input
            id="tags"
            name="tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-ink shadow-lift outline-none ring-ink/10 transition focus:ring-2"
            placeholder="cozy, golden hour, not basic"
          />
          <p className="text-xs text-muted">Comma-separated. Qualitative words welcome.</p>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="font-display text-sm text-ink">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-ink shadow-lift outline-none ring-ink/10 transition focus:ring-2"
          placeholder="What were you reaching for with this board? What’s the mood?"
        />
      </div>

      <section className="space-y-4 rounded-2xl border border-line bg-mist/50 p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-ink">Add tracks</h2>
            <p className="text-sm text-muted">Search Spotify and build your collage.</p>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="search" className="sr-only">
            Search tracks
          </label>
          <input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs or artists…"
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-ink shadow-lift outline-none ring-ink/10 transition focus:ring-2"
          />
          {searching && <p className="text-xs text-muted">Searching…</p>}
          {searchError && <p className="text-sm text-red-800/80">{searchError}</p>}
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {results.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-card/90 px-3 py-2 shadow-lift"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{t.name}</p>
                <p className="truncate text-xs text-muted">{t.artists}</p>
              </div>
              <button
                type="button"
                onClick={() => addTrack(t)}
                className="shrink-0 rounded-full bg-ink px-3 py-1 text-xs text-cream transition hover:bg-muted"
              >
                Add
              </button>
            </li>
          ))}
          {!searching && debounced.length >= 2 && results.length === 0 && !searchError && (
            <li className="text-sm text-muted">No tracks found.</li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Your tracklist</h2>
        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-cream/60 px-4 py-10 text-center text-sm text-muted">
            No tracks yet — search above and add a few favorites.
          </div>
        ) : (
          <ul className="space-y-2">
            {tracks.map((t, i) => (
              <li
                key={`${t.spotifyTrackId}-${i}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2 shadow-lift"
              >
                <span className="w-6 text-center text-xs text-muted">{i + 1}</span>
                {t.albumImageUrl && (
                  <img
                    src={t.albumImageUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{t.trackName}</p>
                  <p className="truncate text-xs text-muted">{t.artistName}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded-full bg-mist px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => move(i, 1)}
                    disabled={i === tracks.length - 1}
                    className="rounded-full bg-mist px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded-full bg-blush/50 px-2 py-1 text-xs text-ink"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formError && (
        <p className="rounded-2xl bg-blush/40 px-4 py-3 text-sm text-ink" role="alert">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-2xl bg-ink py-3 font-display text-cream shadow-soft transition hover:bg-muted disabled:opacity-60"
      >
        {saving ? "Publishing…" : submitLabel}
      </button>
    </form>
  );
}
