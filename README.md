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

### 2. Environment

Copy the example env file and edit values:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLIENT_URL` | Vite app origin (default `http://localhost:5173`) — used for CORS + OAuth redirect |
| `API_URL` | API public base URL (`http://localhost:4000`) |
| `VITE_API_URL` | Same origin the browser uses to call the API (must match `API_URL` in local dev) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard |
| `SPOTIFY_REDIRECT_URI` | **Must be** `http://localhost:4000/auth/spotify/callback` for local dev |
| `SESSION_SECRET` | Long random string for signing cookies |

**Spotify Dashboard settings**

- Redirect URI: `http://localhost:4000/auth/spotify/callback`
- The API uses the **Client Credentials** grant for track search (no extra scopes) and **Authorization Code** for login.

If Spotify env vars are omitted, the API still boots; login and search return friendly errors until you add credentials.

### 3. Database

Create a database (example name `soundboard`), then:

```bash
npm run db:generate
npm run db:migrate
# optional sample row for empty UI testing
npm run db:seed
```

Migrations live in `packages/db/prisma/migrations`.

### 4. Run locally

From the repo root:

```bash
npm run dev
```

- Web: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:4000](http://localhost:4000) (`GET /health`)

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

## License

Course / project use — adjust for your team’s needs.
