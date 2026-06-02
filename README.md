# Soundboard

Soundboard is a full-stack MVP that treats playlists as **social mood boards**: Spotify-backed tracks, a ranked discovery feed, likes, threaded comments, remix lineage, and soft pastel UI centered on conversation—not just playback.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (`apps/web`)
- **Backend:** Node.js, Express, TypeScript (`apps/api`)
- **Database:** PostgreSQL + Prisma (`packages/db`)
- **Auth:** Spotify OAuth + cookie sessions

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or Docker)
- A [Spotify Developer](https://developer.spotify.com/dashboard) app

## Quick start

### 1. Clone and install

```bash
cd cs278-project
npm install
```

### Milestone demo mode

The web app includes an in-browser demo data fallback for the CS278 milestone. If the API is not
running, the React app still loads sample boards, search results, comments, likes, and remixes from
local browser storage, so graders can click through the prototype without Spotify or Postgres setup.

```bash
npm run dev -w @soundboard/web
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). To force real API-only behavior, set
`VITE_DEMO_MODE=false`.

### 2. Environment

Copy the example env file and edit values:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLIENT_URL` | Vite app origin (default `http://127.0.0.1:5173`) — used for CORS + OAuth redirect |
| `API_URL` | API public base URL (`http://127.0.0.1:4000`) |
| `VITE_API_URL` | Same origin the browser uses to call the API (must match `API_URL` in local dev) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard |
| `SPOTIFY_REDIRECT_URI` | **Must be** `http://127.0.0.1:4000/auth/spotify/callback` for local dev |
| `SESSION_SECRET` | Long random string for signing cookies |

**Spotify Dashboard settings**

- Redirect URI: `http://127.0.0.1:4000/auth/spotify/callback`
- Login requests scopes for profile, recently played tracks, top tracks, and private playlists. If you logged in before a scope was added, **log out and sign in again** so Spotify grants the new permissions.
- Track search uses the **Client Credentials** grant (no user scopes). Personal library endpoints use the stored refresh token from login.

If Spotify env vars are omitted, the API still boots; login and search return friendly errors until you add credentials.

### 3. Database

Soundboard needs **PostgreSQL** running before Spotify login can finish (your user is saved to the DB after OAuth).

**Option A — Docker** (matches `.env` defaults `postgres` / `postgres`):

```bash
docker compose up -d
npm run db:migrate
```

**Option B — Homebrew** (macOS):

```bash
brew install postgresql@16
brew services start postgresql@16
createdb soundboard
npm run db:migrate
```

If Homebrew Postgres uses your Mac username instead of `postgres`, update `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/soundboard?schema=public"
```

**Option C — [Postgres.app](https://postgresapp.com/)** — install, start the app, create a `soundboard` database, then `npm run db:migrate`.

**Option D — Supabase (hosted Postgres)**

1. Create a project at [supabase.com](https://supabase.com) and note the project ref (in the dashboard URL).
2. Open **Connect** → copy the **Session pooler** URI (port `5432`). Set it as `DATABASE_URL` in the repo root `.env`.
3. Do **not** use the direct `db.<ref>.supabase.co` URL on most networks — it is IPv6-only and Prisma will report `Can't reach database server`.
4. Run `npm run db:push` (or `npm run db:migrate`), then `npm run db:check` to verify.

Verify the database is reachable:

```bash
curl http://127.0.0.1:4000/health
# should include "database": true
```

Optional seed data:

```bash
npm run db:seed
```

Migrations live in `packages/db/prisma/migrations`.

### 4. Run locally

From the repo root:

```bash
npm run dev
```

- Web: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: [http://127.0.0.1:4000](http://127.0.0.1:4000) (`GET /health`)

The `dev` script builds `@soundboard/shared` and `@soundboard/db` once so workspace imports resolve; after changing Prisma schema, run `npm run db:generate` (or `npm run build -w @soundboard/db`).

## Project layout

```
soundboard/
  README.md
  package.json
  .env.example
  apps/
    web/          # Vite + React client
    api/          # Express API
  packages/
    db/           # Prisma schema + client export
    shared/       # Shared TypeScript types
```

## Feed ranking

Boards are scored in code (transparent, easy to tweak):

`score = likes × 2 + comments × 3 + remixes × 4 + recencyBoost`

`recencyBoost` gently favors newer boards so they are not buried immediately.

The home feed also returns a small **`discover`** array: recent boards from **different creators** to reduce filter-bubble effects in the MVP.

## API (selected)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/auth/spotify/login` | Redirect to Spotify |
| GET | `/auth/spotify/callback` | OAuth callback |
| GET | `/auth/me` | Current session user |
| POST | `/auth/logout` | Clear session |
| GET | `/boards` | `{ feed, discover }` |
| POST | `/boards` | Create board (auth) |
| GET | `/boards/:id` | Board detail |
| POST | `/boards/:id/remix` | Remix with lineage (auth) |
| POST/DELETE | `/boards/:id/like` | Toggle like (auth) |
| GET/POST | `/boards/:id/comments` | List / create comments |
| POST | `/comments/:id/replies` | One-level reply (auth) |
| GET | `/spotify/search?q=` | Track search (Client Credentials) |
| GET | `/spotify/recent` | Recently played tracks (auth, Spotify linked) |
| GET | `/spotify/top-tracks?range=` | Top tracks: `short_term`, `medium_term`, `long_term` |
| GET | `/spotify/playlists` | User's Spotify playlists (auth) |
| GET | `/spotify/playlists/:id/tracks` | Playlist tracks for import (auth, paginated up to 80) |
| GET | `/spotify/board-seed` | Opt-in weekly draft suggestion (auth) |
| GET | `/boards/:id/overlap` | Taste overlap with viewer (auth) |
| GET | `/boards/:id/remix-suggestions` | Remix track suggestions from viewer's rotation (auth) |
| PATCH | `/auth/me` | Update preferences (`weeklySeedOptIn`) |
| GET | `/stats` | Aggregated usage counts (last 30 days) |
| GET | `/users/:id` | Profile + boards + remixes |

## Product notes

- **Comments** are first-class on the board detail layout (sticky beside tracks on large screens).
- **Remixes** always store `parentBoardId` and show attribution on the board.
- **Vibe tags** are free-form strings on each board—meant to mirror real evaluative language from curation culture.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Build shared + db packages, run API + web |
| `npm run build` | Production build (all packages/apps) |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` (prototyping) |
| `npm run db:seed` | Optional seed board |

## Deployment

Step-by-step production deploy (Vercel + Render + Supabase, demo mode for public access): **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## License

Course / project use — adjust for your team’s needs.
