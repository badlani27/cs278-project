import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: path.resolve(__dirname, "../../../.env") });
config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { spotifyId: "seed-user-spotify" },
    update: {},
    create: {
      spotifyId: "seed-user-spotify",
      displayName: "Seed Curator",
      email: "seed@example.com",
      imageUrl: null,
    },
  });

  const existing = await prisma.board.findFirst({
    where: { title: "Sunday afternoon haze", userId: user.id },
  });
  if (existing) {
    console.log("Seed data already present, skipping.");
    return;
  }

  await prisma.board.create({
    data: {
      userId: user.id,
      title: "Sunday afternoon haze",
      description: "Soft indie and bedroom pop for slow days.",
      tags: ["cozy", "golden hour", "aesthetic"],
      tracks: {
        create: [
          {
            spotifyTrackId: "seed-track-1",
            trackName: "Placeholder Track One",
            artistName: "Indie Artist",
            albumImageUrl: null,
            previewUrl: null,
            position: 0,
          },
          {
            spotifyTrackId: "seed-track-2",
            trackName: "Placeholder Track Two",
            artistName: "Dream Pop Band",
            albumImageUrl: null,
            previewUrl: null,
            position: 1,
          },
        ],
      },
    },
  });

  console.log("Seed board created for user", user.displayName);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
