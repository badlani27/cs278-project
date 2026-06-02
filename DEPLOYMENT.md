# Deploying Soundboard

This guide deploys **Vercel (web)** + **Render (API)** + **Supabase (Postgres)**. That stack is free-tier friendly and matches how the app is built today.

**Spotify reality check:** Development-mode Spotify apps only allow **~5 allowlisted users** for real login. For a class or public URL, deploy with **demo mode on** so anyone can use the product without being added in the Spotify Dashboard. Real Spotify login is optional for your team only.

---

## Overview

| Step | What | Time |
|------|------|------|
| 1 | Supabase production DB | ~10 min |
| 2 | Spotify app redirect URIs | ~5 min |
| 3 | Deploy API (Render) | ~15 min |
| 4 | Run migrations against production DB | ~5 min |
| 5 | Deploy web (Vercel) | ~10 min |
| 6 | Smoke test | ~10 min |

**URLs you will end up with (example):**

- Web: `https://soundboard-xxxx.vercel.app`
- API: `https://soundboard-api.onrender.com`

---

## Step 1 — Supabase (database)

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) → your project (or create one).
2. If the project is **paused**, click **Restore**.
3. Go to **Connect** → copy the **Session pooler** URI (port **5432**, not the direct `db.*.supabase.co` host).
4. Save it somewhere safe; you will paste it as `DATABASE_URL` on Render.

Format should look like:

```text
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

5. Generate a strong `SESSION_SECRET` (32+ random characters):

   ```bash
   openssl rand -hex 32
   ```

---

## Step 2 — Spotify Developer Dashboard

1. Open [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → your app.
2. **Settings → Redirect URIs** — add **both** (keep local dev URI if you still develop locally):

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/auth/spotify/callback
   http://127.0.0.1:4000/auth/spotify/callback
   ```

   Replace `YOUR-RENDER-SERVICE` after you create Render in Step 3, then update if the hostname changes.

3. Copy **Client ID** and **Client secret** for Render env vars.
4. **User Management** (optional): add up to **5** Spotify emails for teammates who need real login (playlist import, weekly seed, etc.). **Do not** add every classmate — use demo mode for them.

---

## Step 3 — Deploy the API on Render

1. Push your repo to GitHub (if not already).
2. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service** → connect the repo.
3. Settings:

   | Field | Value |
   |-------|--------|
   | **Name** | `soundboard-api` (or similar) |
   | **Region** | Same region as Supabase if possible |
   | **Branch** | `main` |
   | **Root Directory** | *(leave empty — repo root)* |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build -w @soundboard/db && npm run build -w @soundboard/shared && npm run build -w @soundboard/api` |
   | **Start Command** | `node apps/api/dist/index.js` |
   | **Instance type** | Free (or paid for always-on) |

4. **Environment** → add variables:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | Session pooler URI from Step 1 |
   | `SESSION_SECRET` | From Step 1 |
   | `CLIENT_URL` | `https://YOUR-APP.vercel.app` *(update after Step 5 if needed)* |
   | `API_URL` | `https://soundboard-api.onrender.com` *(your Render URL)* |
   | `SPOTIFY_CLIENT_ID` | From Spotify Dashboard |
   | `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard |
   | `SPOTIFY_REDIRECT_URI` | `https://soundboard-api.onrender.com/auth/spotify/callback` |

5. **Create Web Service** and wait for the first deploy to finish.
6. Note the public URL, e.g. `https://soundboard-api.onrender.com`.
7. Update Spotify **Redirect URI** if you used a placeholder in Step 2.

**Health check:**

```bash
curl -s https://soundboard-api.onrender.com/health
```

Expect `"database": true` after Step 4. Before migrations, database may be `false`.

---

## Step 4 — Apply schema to production database

From your **local machine** (repo root), pointing at production Supabase:

1. Temporarily set production `DATABASE_URL` in root `.env`, **or** run with inline env:

   ```bash
   DATABASE_URL="postgresql://postgres....pooler.supabase.com:5432/postgres?sslmode=require" \
     npm run db:push
   ```

2. Verify:

   ```bash
   DATABASE_URL="..." npm run db:check
   ```

   Should print `Database: connected`.

3. (Optional) Seed sample boards:

   ```bash
   DATABASE_URL="..." npm run db:seed
   ```

---

## Step 5 — Deploy the web app on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo.
2. Settings:

   | Field | Value |
   |-------|--------|
   | **Framework Preset** | Vite |
   | **Root Directory** | *(leave empty — repo root)* |
   | **Build / Output** | Uses repo root `vercel.json` (`apps/web/dist`) |

   If you prefer configuring in the UI instead: Root Directory `apps/web`, Build `cd ../.. && npm install && npm run build -w @soundboard/shared && npm run build -w @soundboard/web`, Output `dist`.

3. **Environment Variables** (Production):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://soundboard-api.onrender.com` *(no trailing slash)* |
   | `VITE_DEMO_MODE` | `true` |

   Leave `VITE_DEMO_MODE` as `true` for class/public access without Spotify allowlist. Set to `false` only if you have Extended Quota Mode on Spotify.

4. Deploy → copy the production URL, e.g. `https://soundboard-xxxx.vercel.app`.

5. **Update Render** `CLIENT_URL` to that Vercel URL → **Manual Deploy** on Render so CORS and OAuth redirects match.

6. Redeploy Vercel if you changed any env vars.

---

## Step 6 — Smoke test

Run through this checklist in order:

| # | Test | Expected |
|---|------|----------|
| 1 | Open Vercel URL | Feed loads (demo or real data) |
| 2 | Login → **Continue in demo mode** | Feed works; can create boards, like, comment |
| 3 | `curl https://YOUR-API/health` | `"ok": true`, `"database": true` |
| 4 | Spotify login (team member on allowlist only) | Redirects back to feed, profile shows your name |
| 5 | Create board (logged in) | Appears on feed after refresh |
| 6 | Open board → like / comment | Counts update |

**If login works but API calls fail with 401:** web and API are on different domains — the API sets `SameSite=None` cookies automatically when `CLIENT_URL` and `API_URL` hosts differ. Both must be **HTTPS**.

**If free Render sleeps:** first request after idle can take 30–60s (cold start).

---

## Environment variable reference (production)

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Render | Supabase session pooler |
| `SESSION_SECRET` | Render | Cookie signing |
| `NODE_ENV` | Render | `production` |
| `PORT` | Render | `4000` |
| `CLIENT_URL` | Render | Vercel site URL (CORS + OAuth return) |
| `API_URL` | Render | Render service URL |
| `SPOTIFY_*` | Render | OAuth + search |
| `VITE_API_URL` | Vercel | Browser → API |
| `VITE_DEMO_MODE` | Vercel | `true` = no Spotify allowlist needed |

---

## What to submit / share (CS278)

- **Public link:** Vercel URL  
- **Note for graders:** “Click **Continue in demo mode**” (no Spotify signup required)  
- **Optional:** Real Spotify works for team accounts listed in Spotify User Management (max 5)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Prisma P1001 on deploy | Use **session pooler** `DATABASE_URL`, not `db.*.supabase.co` |
| CORS error in browser | `CLIENT_URL` on Render must exactly match Vercel URL (scheme + host, no trailing slash) |
| Spotify `redirect_uri` mismatch | `SPOTIFY_REDIRECT_URI` must match Dashboard redirect URI character-for-character |
| Login succeeds then session lost | Ensure `CLIENT_URL` / `API_URL` updated; both HTTPS; redeploy API after env change |
| Spotify login forbidden for friend | Expected in dev mode — they should use demo mode |
| Empty feed (no demo) | Set `VITE_DEMO_MODE=true` or run `db:seed` on production DB |

---

## Optional upgrades later

- **Custom domain** on Vercel + CNAME for API subdomain (cookies can use `SameSite=lax` if you proxy API under same site).
- **Render paid** tier to avoid cold starts.
- **Spotify Extended Quota** only if you are shipping a real product that meets Spotify’s business criteria (~250k MAU, etc.).
