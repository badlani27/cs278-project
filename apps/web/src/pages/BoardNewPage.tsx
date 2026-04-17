import { useNavigate } from "react-router-dom";
import type { BoardDetail, BoardTrackInput } from "@soundboard/shared";
import { apiFetch } from "../api/client";
import { BoardEditor } from "../components/BoardEditor";

export function BoardNewPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ink">New board</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Build a small world of songs. Tags and notes help others understand your taste — not just
          your algorithm.
        </p>
      </header>
      <BoardEditor
        initialTitle=""
        initialDescription=""
        initialTags={[]}
        initialTracks={[] as BoardTrackInput[]}
        submitLabel="Publish board"
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
