import { Link } from "react-router-dom";
import type { BoardSeedDraft } from "@soundboard/shared";

type Props = {
  draft: BoardSeedDraft;
  onDismiss: () => void;
};

export function WeeklySeedBanner({ draft, onDismiss }: Props) {
  return (
    <section className="rounded-3xl border border-line bg-sky/30 p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Weekly seed</p>
          <h2 className="font-display text-xl text-ink">Turn your week into a board</h2>
          <p className="text-sm leading-relaxed text-muted">{draft.descriptionHint}</p>
          <p className="text-xs text-muted">
            Private draft — nothing posts until you publish with your own description.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/boards/new"
            state={{ seed: draft }}
            className="rounded-full bg-ink px-4 py-2 text-sm text-cream shadow-lift transition hover:bg-muted"
          >
            Start draft ({draft.tracks.length} tracks)
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-card px-4 py-2 text-sm text-muted ring-1 ring-line hover:text-ink"
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
