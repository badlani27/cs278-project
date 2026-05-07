import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { loadEnv } from "./env";
import { createAuthRouter } from "./routes/auth";
import { createBoardsRouter } from "./routes/boards";
import { createCommentsRootRouter } from "./routes/commentRepliesRoot";
import { createSpotifyRouter } from "./routes/spotify";
import { createUsersRouter } from "./routes/users";

const env = loadEnv();

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CLIENT_URL,
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
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", createAuthRouter(env));
app.use("/boards", createBoardsRouter());
app.use("/comments", createCommentsRootRouter());
app.use("/spotify", createSpotifyRouter(env));
app.use("/users", createUsersRouter());

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = env.PORT;
app.listen(port, () => {
  console.log(`Soundboard API listening on ${env.API_URL} (port ${port})`);
});
