import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

const rootEnv = path.resolve(__dirname, "../../../.env");
config({ path: rootEnv });
config({ path: path.resolve(__dirname, "../.env") });
config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  CLIENT_URL: z.string().url(),
  API_URL: z.string().url(),
  SPOTIFY_CLIENT_ID: z.string().optional().default(""),
  SPOTIFY_CLIENT_SECRET: z.string().optional().default(""),
  SPOTIFY_REDIRECT_URI: z.string().optional().default(""),
  SESSION_SECRET: z.string().min(8),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(
      `Invalid environment: ${JSON.stringify(msg)}. Copy .env.example to .env and fill values.`,
    );
  }
  cached = parsed.data;
  return cached;
}

export function isSpotifyConfigured(env: Env): boolean {
  return Boolean(
    env.SPOTIFY_CLIENT_ID &&
      env.SPOTIFY_CLIENT_SECRET &&
      env.SPOTIFY_REDIRECT_URI &&
      env.SPOTIFY_REDIRECT_URI.startsWith("http"),
  );
}
