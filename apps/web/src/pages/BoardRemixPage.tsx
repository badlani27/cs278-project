import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { BoardDetail, BoardTrackInput } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { BoardEditor } from "../components/BoardEditor";

export function BoardRemixPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function run() {
      try {
        const b = await apiFetch<BoardDetail>(`/boards/${id}`);
        if (!cancelled) setBoard(b);
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
      <div className="rounded-2xl border border-line bg-blush/40 px-6 py-8 text-center">
        <p className="text-sm text-ink">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted underline">
          Back home
        </Link>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-full bg-cream/80" />
        <div className="h-96 animate-pulse rounded-2xl bg-cream/70" />
      </div>
    );
  }

  const initialTracks: BoardTrackInput[] = board.tracks.map((t) => ({
    spotifyTrackId: t.spotifyTrackId,
    trackName: t.trackName,
    artistName: t.artistName,
    albumImageUrl: t.albumImageUrl,
    previewUrl: t.previewUrl,
    note: t.note,
    position: t.position,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ink">Remix this board</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          You’re starting from{" "}
          <Link to={`/boards/${board.id}`} className="underline-offset-2 hover:underline">
            {board.title}
          </Link>
          . Change the story, swap tracks, add your angle — remixing is participation, not
          copying.
        </p>
      </header>
      <BoardEditor
        key={board.id}
        initialTitle={`${board.title} (remix)`}
        initialDescription={board.description ?? ""}
        initialTags={board.tags}
        initialTracks={initialTracks}
        submitLabel="Publish remix"
        hint="Attribution is preserved automatically. The original board stays linked from your remix."
        remixSourceBoardId={board.id}
        onSubmit={async (payload) => {
          const created = await apiFetch<BoardDetail>(`/boards/${board.id}/remix`, {
            method: "POST",
            body: JSON.stringify({
              title: payload.title,
              description: payload.description,
              tags: payload.tags,
              tracks: payload.tracks,
              parentBoardId: board.id,
            }),
          });
          navigate(`/boards/${created.id}`);
        }}
      />
    </div>
  );
}
