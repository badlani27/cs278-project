import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

function findEnvFile(): string | undefined {
  const candidates = [
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
  ];
  return candidates.find((file) => existsSync(file));
}

export function loadDatabaseEnv(): void {
  const envFile = findEnvFile();
  if (envFile) {
    config({ path: envFile, override: true });
  }
}

loadDatabaseEnv();

type PrismaGlobal = {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function createPrismaClient(): PrismaClient {
  loadDatabaseEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env at the repo root (see .env.example).",
    );
  }
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  loadDatabaseEnv();
  const dbUrl = process.env.DATABASE_URL ?? "";

  if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== dbUrl) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaUrl = dbUrl;
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

export * from "@prisma/client";
