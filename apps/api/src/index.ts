import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { loadEnv, isSpotifyConfigured } from "./env";
import { prisma } from "@soundboard/db";
import { createAuthRouter } from "./routes/auth";
import { createBoardsRouter } from "./routes/boards";
import { createCommentsRootRouter } from "./routes/commentRepliesRoot";
import { createSpotifyRouter } from "./routes/spotify";
import { createStatsRouter } from "./routes/stats";
import { createUsersRouter } from "./routes/users";
import { isDatabaseError } from "./middleware/asyncHandler";

const env = loadEnv();

function sessionSameSite(): "lax" | "none" {
  try {
    // OAuth callback on CLIENT_URL (via Vercel /api proxy) → first-party cookies, SameSite=Lax
    if (
      env.SPOTIFY_REDIRECT_URI &&
      env.CLIENT_URL &&
      env.SPOTIFY_REDIRECT_URI.startsWith(env.CLIENT_URL)
    ) {
      return "lax";
    }
    const clientHost = new URL(env.CLIENT_URL).hostname;
    const apiHost = new URL(env.API_URL).hostname;
    return clientHost === apiHost ? "lax" : "none";
  } catch {
    return "lax";
  }
}

const app = express();

app.set("trust proxy", 1);

function isAllowedCorsOrigin(origin: string | undefined, clientUrl: string): boolean {
  if (!origin) return true;
  const allowed = new Set([
    clientUrl,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);
  if (allowed.has(origin)) return true;
  try {
    const clientHost = new URL(clientUrl).hostname;
    const originHost = new URL(origin).hostname;
    // Vercel production + preview deployment URLs (e.g. *-team.vercel.app)
    if (clientHost.endsWith(".vercel.app") && originHost.endsWith(".vercel.app")) {
      return true;
    }
  } catch {
    /* ignore malformed URLs */
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin, env.CLIENT_URL)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    name: "soundboard.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: env.NODE_ENV === "production" ? sessionSameSite() : "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.get("/health", async (_req, res) => {
  const env = loadEnv();
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }
  res.json({
    ok: true,
    spotifyConfigured: isSpotifyConfigured(env),
    database,
  });
});

app.use("/auth", createAuthRouter());
app.use("/boards", createBoardsRouter());
app.use("/comments", createCommentsRootRouter());
app.use("/spotify", createSpotifyRouter());
app.use("/users", createUsersRouter());
app.use("/stats", createStatsRouter());

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (isDatabaseError(err)) {
    res.status(503).json({
      error: "Database unavailable. Start PostgreSQL and run npm run db:migrate.",
    });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});

const port = env.PORT;
const host = env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
const server = app.listen(port, host, () => {
  console.log(`Soundboard API listening on ${env.API_URL} (port ${port})`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${port} is already in use. Stop other dev servers (Ctrl+C), then run:\n  npm run dev\n`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
