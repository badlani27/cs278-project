import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-cream/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight text-ink transition group-hover:text-muted">
              Soundboard
            </span>
            <span className="hidden text-sm text-muted sm:inline">mood boards for music</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  "rounded-full px-3 py-1.5 transition",
                  isActive
                    ? "bg-mist text-ink shadow-lift"
                    : "text-muted hover:bg-card hover:text-ink",
                ].join(" ")
              }
            >
              Feed
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to="/boards/new"
                  className={({ isActive }) =>
                    [
                      "rounded-full px-3 py-1.5 transition",
                      isActive
                        ? "bg-blush/50 text-ink shadow-lift"
                        : "text-muted hover:bg-card hover:text-ink",
                    ].join(" ")
                  }
                >
                  New board
                </NavLink>
                <NavLink
                  to={`/users/${user.id}`}
                  className="rounded-full px-3 py-1.5 text-muted transition hover:bg-card hover:text-ink"
                >
                  Profile
                </NavLink>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-full px-3 py-1.5 text-muted transition hover:bg-sky/40 hover:text-ink"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-ink px-4 py-1.5 text-cream shadow-lift transition hover:bg-muted"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-cream/40 py-8 text-center text-xs text-muted">
        Soundboard — playlists as social objects. Curate gently.
      </footer>
    </div>
  );
}
