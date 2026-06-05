import { useEffect, useMemo, useState } from "react";
import type {
  BoardTrackInput,
  SpotifyPlaylistSummary,
  SpotifySearchTrack,
} from "@soundboard/shared";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { RemixSuggestionsPanel } from "./RemixSuggestionsPanel";
import { SpotifyLibraryBanner } from "./SpotifyLibraryBanner";

type SourceTab = "search" | "recent" | "top" | "playlists";
type TopRange = "short_term" | "medium_term" | "long_term";

type Props = {
  initialTitle: string;
  initialDescription: string;
  initialTags: string[];
  initialTracks: BoardTrackInput[];
  submitLabel: string;
  onSubmit: (payload: {
    title: string;
    description: string;
    tags: string[];
    tracks: BoardTrackInput[];
  }) => Promise<void>;
  hint?: string;
  remixSourceBoardId?: string;
};

function toTrackInput(t: SpotifySearchTrack, position: number): BoardTrackInput {
  return {
    spotifyTrackId: t.id,
    trackName: t.name,
    artistName: t.artists,
    albumImageUrl: t.albumImageUrl,
    previewUrl: t.previewUrl,
    note: null,
    position,
  };
}

export function BoardEditor({
  initialTitle,
  initialDescription,
  initialTags,
  initialTracks,
  submitLabel,
  onSubmit,
  hint,
  remixSourceBoardId,
}: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tagsRaw, setTagsRaw] = useState(initialTags.join(", "));
  const [tracks, setTracks] = useState<BoardTrackInput[]>(initialTracks);
  const [sourceTab, setSourceTab] = useState<SourceTab>("search");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentTracks, setRecentTracks] = useState<SpotifySearchTrack[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSummary[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifySearchTrack[]>([]);
  const [playlistTracksLoading, setPlaylistTracksLoading] = useState(false);
  const [topRange, setTopRange] = useState<TopRange>("short_term");
  const [topTracks, setTopTracks] = useState<SpotifySearchTrack[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [remixSuggestions, setRemixSuggestions] = useState<SpotifySearchTrack[]>([]);
  const [remixSuggestionsLoading, setRemixSuggestionsLoading] = useState(false);
  const [remixSuggestionsError, setRemixSuggestionsError] = useState<string | null>(null);
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

  useEffect(() => {
    if (sourceTab !== "recent") return;
    let cancelled = false;
    async function run() {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const data = await apiFetch<{ tracks: SpotifySearchTrack[]; error?: string; code?: string }>(
          "/spotify/recent",
        );
        if (!cancelled) {
          if (data.error) setRecentError(data.error);
          setRecentTracks(data.tracks ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setRecentError(e instanceof Error ? e.message : "Could not load recent tracks");
          setRecentTracks([]);
        }
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [sourceTab]);

  useEffect(() => {
    if (sourceTab !== "top") return;
    let cancelled = false;
    async function run() {
      setTopLoading(true);
      setTopError(null);
      try {
        const data = await apiFetch<{ tracks: SpotifySearchTrack[]; error?: string }>(
          `/spotify/top-tracks?range=${topRange}`,
        );
        if (!cancelled) {
          if (data.error) setTopError(data.error);
          setTopTracks(data.tracks ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setTopError(e instanceof Error ? e.message : "Could not load top tracks");
          setTopTracks([]);
        }
      } finally {
        if (!cancelled) setTopLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [sourceTab, topRange]);

  useEffect(() => {
    if (!remixSourceBoardId) return;
    let cancelled = false;
    async function run() {
      setRemixSuggestionsLoading(true);
      setRemixSuggestionsError(null);
      try {
        const data = await apiFetch<{ suggestions: SpotifySearchTrack[]; error?: string }>(
          `/boards/${remixSourceBoardId}/remix-suggestions`,
        );
        if (!cancelled) {
          if (data.error) setRemixSuggestionsError(data.error);
          setRemixSuggestions(data.suggestions ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setRemixSuggestionsError(e instanceof Error ? e.message : "Could not load suggestions");
          setRemixSuggestions([]);
        }
      } finally {
        if (!cancelled) setRemixSuggestionsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [remixSourceBoardId]);

  useEffect(() => {
    if (sourceTab !== "playlists") return;
    let cancelled = false;
    async function run() {
      setPlaylistsLoading(true);
      setPlaylistsError(null);
      try {
        const data = await apiFetch<{ playlists: SpotifyPlaylistSummary[]; error?: string }>(
          "/spotify/playlists",
        );
        if (!cancelled) {
          if (data.error) setPlaylistsError(data.error);
          setPlaylists(data.playlists ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setPlaylistsError(e instanceof Error ? e.message : "Could not load playlists");
          setPlaylists([]);
        }
      } finally {
        if (!cancelled) setPlaylistsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [sourceTab]);

  useEffect(() => {
    if (!selectedPlaylistId) {
      setPlaylistTracks([]);
      return;
    }
    let cancelled = false;
    async function run() {
      setPlaylistTracksLoading(true);
      try {
        const data = await apiFetch<{ tracks: SpotifySearchTrack[]; error?: string }>(
          `/spotify/playlists/${encodeURIComponent(selectedPlaylistId!)}/tracks`,
        );
        if (!cancelled) {
          if (data.error) setPlaylistsError(data.error);
          setPlaylistTracks(data.tracks ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setPlaylistsError(e instanceof Error ? e.message : "Could not load playlist");
          setPlaylistTracks([]);
        }
      } finally {
        if (!cancelled) setPlaylistTracksLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedPlaylistId]);

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
      return [...prev, toTrackInput(t, prev.length)].map((tr, i) => ({ ...tr, position: i }));
    });
  }

  function addTracksBatch(list: SpotifySearchTrack[]) {
    setTracks((prev) => {
      const next = [...prev];
      for (const t of list) {
        if (next.some((p) => p.spotifyTrackId === t.id)) continue;
        next.push(toTrackInput(t, next.length));
      }
      return next.map((tr, i) => ({ ...tr, position: i }));
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

  function updateTrackNote(index: number, note: string) {
    setTracks((prev) =>
      prev.map((tr, i) => (i === index ? { ...tr, note: note.trim() || null } : tr)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Give your board a title.");
      return;
    }
    if (description.trim().length < 10) {
      setFormError(
        "Add a short description (at least 10 characters) — what mood were you going for?",
      );
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
        description: description.trim(),
        tags,
        tracks,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function renderTrackRow(t: SpotifySearchTrack, addLabel = "Add") {
    return (
      <li
        key={t.id}
        className="flex items-center justify-between gap-3 rounded-xl bg-card/90 px-3 py-2 shadow-lift"
      >
        <div className="flex min-w-0 items-center gap-2">
          {t.albumImageUrl && (
            <img src={t.albumImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{t.name}</p>
            <p className="truncate text-xs text-muted">{t.artists}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => addTrack(t)}
          className="shrink-0 rounded-full bg-ink px-3 py-1 text-xs text-cream transition hover:bg-muted"
        >
          {addLabel}
        </button>
      </li>
    );
  }

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const needsSpotifyLibrary =
    user && !user.spotifyLibraryLinked && sourceTab !== "search";

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
          Description <span className="text-muted">(required)</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          minLength={10}
          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-ink shadow-lift outline-none ring-ink/10 transition focus:ring-2"
          placeholder="What were you reaching for with this board? What’s the mood?"
        />
        <p className="text-xs text-muted">
          Boards are social mood boards — a sentence of context helps others join the conversation.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-line bg-mist/50 p-5 shadow-soft">
        <div>
          <h2 className="font-display text-lg text-ink">Add tracks</h2>
          <p className="text-sm text-muted">
            Search, pull from your recent listens, or import a Spotify playlist as a starting point.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["search", "Search"],
              ["recent", "Your week"],
              ["top", "Top tracks"],
              ["playlists", "Playlists (coming soon)"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSourceTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                sourceTab === tab
                  ? "bg-ink text-cream shadow-lift"
                  : "bg-card text-muted ring-1 ring-line hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {needsSpotifyLibrary && <SpotifyLibraryBanner className="mb-2" />}

        {sourceTab === "search" && (
          <>
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
              {results.map((t) => renderTrackRow(t))}
              {!searching && debounced.length >= 2 && results.length === 0 && !searchError && (
                <li className="text-sm text-muted">No tracks found.</li>
              )}
            </ul>
          </>
        )}

        {sourceTab === "recent" && (
          <>
            <p className="text-xs text-muted">
              Private to you until you publish — pick the songs that fit your story.
            </p>
            {recentLoading && <p className="text-xs text-muted">Loading your recent listens…</p>}
            {recentError && (
              <p className="rounded-xl bg-blush/40 px-3 py-2 text-sm text-ink">{recentError}</p>
            )}
            {!recentLoading && recentTracks.length > 0 && (
              <button
                type="button"
                onClick={() => addTracksBatch(recentTracks)}
                className="rounded-full bg-sky/50 px-3 py-1.5 text-xs text-ink ring-1 ring-line transition hover:bg-sky/70"
              >
                Add all ({recentTracks.length})
              </button>
            )}
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {recentTracks.map((t) => renderTrackRow(t))}
              {!recentLoading && !recentError && recentTracks.length === 0 && (
                <li className="text-sm text-muted">No recent tracks found.</li>
              )}
            </ul>
          </>
        )}

        {sourceTab === "top" && (
          <>
            <p className="text-xs text-muted">Your most-played on Spotify — pick what fits your story.</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["short_term", "This month"],
                  ["medium_term", "6 months"],
                  ["long_term", "All time"],
                ] as const
              ).map(([range, label]) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTopRange(range)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    topRange === range
                      ? "bg-ink text-cream"
                      : "bg-card text-muted ring-1 ring-line hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {topLoading && <p className="text-xs text-muted">Loading top tracks…</p>}
            {topError && (
              <p className="rounded-xl bg-blush/40 px-3 py-2 text-sm text-ink">{topError}</p>
            )}
            {!topLoading && topTracks.length > 0 && (
              <button
                type="button"
                onClick={() => addTracksBatch(topTracks)}
                className="rounded-full bg-sky/50 px-3 py-1.5 text-xs text-ink ring-1 ring-line transition hover:bg-sky/70"
              >
                Add all ({topTracks.length})
              </button>
            )}
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {topTracks.map((t) => renderTrackRow(t))}
              {!topLoading && !topError && topTracks.length === 0 && (
                <li className="text-sm text-muted">No top tracks found.</li>
              )}
            </ul>
          </>
        )}

        {sourceTab === "playlists" && (
          <>
            <p className="text-xs text-muted">
              Import as a draft — trim, reorder, and add your description before publishing.
            </p>
            {playlistsLoading && <p className="text-xs text-muted">Loading your playlists…</p>}
            {playlistsError && (
              <p className="rounded-xl bg-blush/40 px-3 py-2 text-sm text-ink">{playlistsError}</p>
            )}
            {!playlistsLoading && playlists.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="playlist-select" className="sr-only">
                  Choose playlist
                </label>
                <select
                  id="playlist-select"
                  value={selectedPlaylistId ?? ""}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || null)}
                  className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-lift outline-none ring-ink/10 transition focus:ring-2"
                >
                  <option value="">Choose a playlist…</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.trackCount} tracks)
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedPlaylist && playlistTracksLoading && (
              <p className="text-xs text-muted">Loading tracks from {selectedPlaylist.name}…</p>
            )}
            {selectedPlaylist && !playlistTracksLoading && playlistTracks.length > 0 && (
              <button
                type="button"
                onClick={() => addTracksBatch(playlistTracks)}
                className="rounded-full bg-sky/50 px-3 py-1.5 text-xs text-ink ring-1 ring-line transition hover:bg-sky/70"
              >
                Import all from “{selectedPlaylist.name}” ({playlistTracks.length})
              </button>
            )}
            {selectedPlaylistId && (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {playlistTracks.map((t) => renderTrackRow(t))}
                {!playlistTracksLoading && playlistTracks.length === 0 && !playlistsError && (
                  <li className="text-sm text-muted">This playlist has no tracks.</li>
                )}
              </ul>
            )}
          </>
        )}
      </section>

      {remixSourceBoardId && (
        <RemixSuggestionsPanel
          suggestions={remixSuggestions}
          loading={remixSuggestionsLoading}
          error={remixSuggestionsError}
          onAdd={addTrack}
          onAddAll={() => addTracksBatch(remixSuggestions)}
        />
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Your tracklist</h2>
        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-cream/60 px-4 py-10 text-center text-sm text-muted">
            No tracks yet — search above, pull from your week, or import a playlist.
          </div>
        ) : (
          <ul className="space-y-3">
            {tracks.map((t, i) => (
              <li
                key={`${t.spotifyTrackId}-${i}`}
                className="rounded-2xl border border-line bg-card px-3 py-3 shadow-lift"
              >
                <div className="flex flex-wrap items-center gap-3">
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
                </div>
                <input
                  type="text"
                  value={t.note ?? ""}
                  onChange={(e) => updateTrackNote(i, e.target.value)}
                  placeholder="Why this track? (optional)"
                  maxLength={200}
                  className="mt-2 w-full rounded-xl border border-line/80 bg-mist/30 px-3 py-2 text-xs text-ink outline-none ring-ink/10 transition focus:ring-2"
                />
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
