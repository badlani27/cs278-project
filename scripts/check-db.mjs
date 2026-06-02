#!/usr/bin/env node
/**
 * Diagnose DATABASE_URL connectivity (Supabase direct vs pooler, IPv4/IPv6).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { lookup, resolve4, resolve6 } from "node:dns/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

if (!existsSync(envPath)) {
  console.error("Missing .env at repo root. Copy .env.example to .env first.");
  process.exit(1);
}

config({ path: envPath });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error("DATABASE_URL is not a valid URL");
  process.exit(1);
}

const host = parsed.hostname;
const port = parsed.port || "5432";

console.log(`Host: ${host}:${port}`);
console.log(`User: ${parsed.username || "(none)"}`);

const isDirectSupabase = /^db\.[a-z0-9]+\.supabase\.co$/i.test(host);

if (isDirectSupabase) {
  let v4 = [];
  let v6 = [];
  try {
    v4 = await resolve4(host);
  } catch {
    /* no A record */
  }
  try {
    v6 = await resolve6(host);
  } catch {
    /* no AAAA record */
  }
  console.log(`DNS A (IPv4): ${v4.length ? v4.join(", ") : "none"}`);
  console.log(`DNS AAAA (IPv6): ${v6.length ? v6.join(", ") : "none"}`);

  if (!v4.length && v6.length) {
    console.log("");
    console.log(
      "This is Supabase's direct connection host. It is IPv6-only on the free tier.",
    );
    console.log(
      "Most home/campus Wi‑Fi cannot reach it, which causes Prisma P1001 / 'Can't reach database server'.",
    );
    console.log("");
    console.log("Fix: In Supabase Dashboard → your project → Connect → ORMs / URI:");
    console.log(
      "  Use the **Session pooler** connection string (IPv4) and set it as DATABASE_URL in .env",
    );
    console.log("  Format: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require");
    console.log("");
    console.log("Also confirm the project is not paused (Dashboard → Restore if needed).");
  }
}

try {
  await lookup(host, { all: true });
  console.log("getaddrinfo (Node default): OK");
} catch (e) {
  console.log(`getaddrinfo (Node default): ${e.code} — connections may fail even if dig shows IPv6`);
}

console.log("\nTesting Prisma query…");

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database: connected");
  process.exit(0);
} catch (e) {
  const msg = String(e.message || e);
  console.log("Database: failed");
  if (msg.includes("Can't reach database server")) {
    console.log("→ Network cannot reach the host (often IPv6-only direct URL on IPv4 Wi‑Fi).");
  } else if (msg.includes("Tenant or user not found")) {
    console.log("→ Wrong pooler region or project ref in the connection string. Copy the URI from Supabase Connect.");
  } else if (msg.includes("password authentication failed")) {
    console.log("→ Wrong database password. Reset it in Supabase → Settings → Database.");
  } else {
    console.log(msg.split("\n").slice(-3).join("\n"));
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
