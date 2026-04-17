import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE } from "../api/client";

export function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get("error");

  const loginUrl = useMemo(() => `${API_BASE}/auth/spotify/login`, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-line bg-cream/90 p-10 text-center shadow-soft">
        <h1 className="font-display text-3xl text-ink">Welcome in</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Soundboard uses Spotify to know who you are — then you can curate boards, join
          conversations, and remix what moves you.
        </p>
        {error && (
          <p className="mt-4 rounded-2xl bg-blush/50 px-3 py-2 text-sm text-ink" role="alert">
            {error === "spotify_not_configured"
              ? "Spotify isn’t configured on this server yet."
              : `Something went wrong (${error}). Try again.`}
          </p>
        )}
        <a
          href={loginUrl}
          className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#1DB954] px-6 py-3 font-display text-sm text-white shadow-soft transition hover:brightness-95"
        >
          Continue with Spotify
        </a>
        <p className="mt-6 text-xs text-muted">
          <Link to="/" className="underline-offset-2 hover:underline">
            Back to feed
          </Link>
        </p>
      </div>
    </div>
  );
}
