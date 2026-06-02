import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE, checkApiHealth, isDemoMode, spotifyLoginUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const [params] = useSearchParams();
  const urlError = params.get("error");
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [apiStatus, setApiStatus] = useState<{
    ok: boolean;
    spotifyConfigured: boolean;
    database: boolean;
  } | null>(null);
  const loginUrl = spotifyLoginUrl();
  const demoMode = isDemoMode();
  const isLocalDev =
    API_BASE.includes("127.0.0.1") || API_BASE.includes("localhost");

  useEffect(() => {
    let cancelled = false;
    void checkApiHealth().then((status) => {
      if (!cancelled) setApiStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function continueDemo() {
    await refresh();
    navigate("/");
  }

  const showSpotifyNotConfigured =
    urlError === "spotify_not_configured" && apiStatus?.spotifyConfigured === false;

  const showOtherError = urlError && urlError !== "spotify_not_configured";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-line bg-cream/90 p-10 text-center shadow-soft">
        <h1 className="font-display text-3xl text-ink">Welcome in</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Soundboard uses Spotify to know who you are — then you can curate boards, join
          conversations, and remix what moves you. Sign-in also lets you pull from your recent listens
          and playlists when building a board.
        </p>

        {apiStatus?.ok === false && (
          <div
            className="mt-4 rounded-2xl border border-line bg-mist/80 px-4 py-3 text-left text-sm text-ink"
            role="status"
          >
            <p className="font-medium">API not reachable</p>
            {isLocalDev ? (
              <>
                <p className="mt-1 text-muted">
                  The backend on port 4000 isn&apos;t running. Stop old terminals (Ctrl+C), then
                  from the project root run:
                </p>
                <code className="mt-2 block rounded-lg bg-card px-2 py-1 text-xs">npm run dev</code>
                <p className="mt-2 text-xs text-muted">
                  Then open{" "}
                  <a href="http://127.0.0.1:5173" className="font-medium text-ink underline">
                    http://127.0.0.1:5173
                  </a>{" "}
                  — not <code className="text-ink">localhost:5173</code> or port 5174.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-muted">
                  The browser couldn&apos;t reach the API at{" "}
                  <code className="text-ink">{API_BASE}</code>.
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
                  <li>
                    Free Render may be waking up — open{" "}
                    <a
                      href={`${API_BASE}/health`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink underline"
                    >
                      {API_BASE}/health
                    </a>{" "}
                    in a new tab, wait for JSON, then refresh.
                  </li>
                  <li>
                    Use the production URL{" "}
                    <strong>https://soundboard-orpin-one.vercel.app</strong> (not a preview
                    deployment link).
                  </li>
                  <li>
                    On Render, <code className="text-ink">CLIENT_URL</code> must match this site
                    exactly.
                  </li>
                </ul>
                {demoMode && (
                  <p className="mt-2 text-xs text-muted">
                    You can still use <strong>Continue in demo mode</strong> below.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {apiStatus?.ok && !apiStatus.database && (
          <div
            className="mt-4 rounded-2xl border border-line bg-blush/40 px-4 py-3 text-left text-sm text-ink"
            role="alert"
          >
            <p className="font-medium">Database not running</p>
            <p className="mt-1 text-muted">
              Spotify sign-in worked, but PostgreSQL isn&apos;t available. Install Postgres, then
              run migrations:
            </p>
            <code className="mt-2 block whitespace-pre-wrap rounded-lg bg-card px-2 py-2 text-xs">
              {`brew install postgresql@16
brew services start postgresql@16
createdb soundboard
npm run db:migrate`}
            </code>
            <p className="mt-2 text-xs text-muted">
              Or with Docker: <code className="text-ink">docker compose up -d</code> then{" "}
              <code className="text-ink">npm run db:migrate</code>
            </p>
          </div>
        )}

        {urlError === "database_unavailable" && (
          <p className="mt-4 rounded-2xl bg-blush/50 px-3 py-2 text-sm text-ink" role="alert">
            Spotify connected, but the database is offline. Start PostgreSQL, run{" "}
            <code className="text-ink">npm run db:migrate</code>, then try again.
          </p>
        )}

        {apiStatus?.ok && !apiStatus.spotifyConfigured && (
          <p className="mt-4 rounded-2xl bg-blush/50 px-3 py-2 text-sm text-ink" role="alert">
            Spotify isn’t configured on the running API. Add credentials to{" "}
            <code className="text-ink">.env</code>, then restart with{" "}
            <code className="text-ink">npm run dev</code>.
          </p>
        )}

        {showSpotifyNotConfigured && (
          <p className="mt-4 rounded-2xl bg-blush/50 px-3 py-2 text-sm text-ink" role="alert">
            Spotify wasn’t configured when you last tried. If you just updated{" "}
            <code className="text-ink">.env</code>, restart the server and try again.
          </p>
        )}

        {urlError === "spotify_not_configured" && apiStatus?.spotifyConfigured && (
          <p className="mt-4 rounded-2xl bg-mist/80 px-3 py-2 text-sm text-muted" role="status">
            Spotify is configured now — click below to continue.
          </p>
        )}

        {urlError === "invalid_oauth" && apiStatus?.ok && (
          <p className="mt-4 rounded-2xl bg-blush/50 px-3 py-2 text-sm text-ink" role="alert">
            Login session expired or didn&apos;t match. Use{" "}
            <strong>http://127.0.0.1:5173</strong> (not localhost), click{" "}
            <Link to="/login" className="underline">
              Clear errors
            </Link>
            , then try Spotify again.
          </p>
        )}

        {showOtherError && urlError !== "invalid_oauth" && urlError !== "database_unavailable" && (
          <p className="mt-4 rounded-2xl bg-blush/50 px-3 py-2 text-sm text-ink" role="alert">
            Something went wrong ({urlError}). Try again.
          </p>
        )}

        {apiStatus?.ok !== false ? (
          <a
            href={loginUrl}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#1DB954] px-6 py-3 font-display text-sm text-white shadow-soft transition hover:brightness-95"
          >
            Continue with Spotify
          </a>
        ) : demoMode ? (
          <button
            type="button"
            onClick={() => void continueDemo()}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-ink px-6 py-3 font-display text-sm text-cream shadow-soft transition hover:bg-muted"
          >
            Continue in demo mode
          </button>
        ) : (
          <p className="mt-8 text-sm text-muted">Start the API, then refresh this page.</p>
        )}

        <p className="mt-6 text-xs text-muted">
          <Link to="/login" className="underline-offset-2 hover:underline">
            Clear errors
          </Link>
          {" · "}
          <Link to="/" className="underline-offset-2 hover:underline">
            Back to feed
          </Link>
        </p>
      </div>
    </div>
  );
}
