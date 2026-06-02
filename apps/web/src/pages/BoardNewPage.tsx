import { useLocation, useNavigate } from "react-router-dom";
import type { BoardDetail, BoardSeedDraft, BoardTrackInput } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { BoardEditor } from "../components/BoardEditor";

type LocationState = {
  seed?: BoardSeedDraft;
};

function seedToTracks(seed: BoardSeedDraft): BoardTrackInput[] {
  return seed.tracks.map((t, i) => ({
    spotifyTrackId: t.id,
    trackName: t.name,
    artistName: t.artists,
    albumImageUrl: t.albumImageUrl,
    previewUrl: t.previewUrl,
    note: null,
    position: i,
  }));
}

export function BoardNewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const seed = (location.state as LocationState | null)?.seed;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ink">New board</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Build a small world of songs. Tags and notes help others understand your taste — not just
          your algorithm.
        </p>
        {seed && (
          <p className="mt-3 rounded-2xl border border-line bg-sky/25 px-4 py-3 text-sm text-ink">
            Started from your weekly seed — edit the title, trim tracks, and write your description
            before publishing.
          </p>
        )}
      </header>
      <BoardEditor
        key={seed ? "seed" : "blank"}
        initialTitle={seed?.suggestedTitle ?? ""}
        initialDescription=""
        initialTags={seed?.suggestedTags ?? []}
        initialTracks={seed ? seedToTracks(seed) : ([] as BoardTrackInput[])}
        submitLabel="Publish board"
        hint={seed?.descriptionHint}
        onSubmit={async (payload) => {
          const board = await apiFetch<BoardDetail>("/boards", {
            method: "POST",
            body: JSON.stringify({
              title: payload.title,
              description: payload.description,
              tags: payload.tags,
              tracks: payload.tracks,
            }),
          });
          navigate(`/boards/${board.id}`);
        }}
      />
    </div>
  );
}
