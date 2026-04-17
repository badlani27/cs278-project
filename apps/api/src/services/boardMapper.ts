import type { BoardSummary, BoardDetail, PublicUser } from "@soundboard/shared";
import type { Board, BoardTrack, User } from "@prisma/client";
import { boardRankingScore } from "./feedRanking";

type BoardWithRelations = Board & {
  user: Pick<User, "id" | "displayName" | "imageUrl">;
  tracks: Pick<BoardTrack, "albumImageUrl">[];
  parentBoard: Pick<Board, "id" | "title"> | null;
  _count: { likes: number; comments: number; remixes: number };
};

type BoardDetailSource = Board & {
  user: Pick<User, "id" | "displayName" | "imageUrl">;
  tracks: BoardTrack[];
  parentBoard: Pick<Board, "id" | "title"> | null;
  _count: { likes: number; comments: number; remixes: number };
};

export function toPublicUser(u: Pick<User, "id" | "displayName" | "imageUrl">): PublicUser {
  return {
    id: u.id,
    displayName: u.displayName,
    imageUrl: u.imageUrl,
  };
}

export function toBoardSummary(b: BoardWithRelations): BoardSummary {
  const images = b.tracks
    .map((t) => t.albumImageUrl)
    .filter((x): x is string => Boolean(x))
    .slice(0, 4);
  const rankingScore = boardRankingScore({
    likeCount: b._count.likes,
    commentCount: b._count.comments,
    remixCount: b._count.remixes,
    createdAt: b.createdAt,
  });
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    tags: b.tags,
    createdAt: b.createdAt.toISOString(),
    likeCount: b._count.likes,
    commentCount: b._count.comments,
    remixCount: b._count.remixes,
    rankingScore,
    creator: toPublicUser(b.user),
    coverImages: images,
    parentBoard: b.parentBoard ? { id: b.parentBoard.id, title: b.parentBoard.title } : null,
    isRemix: Boolean(b.parentBoardId),
  };
}

export function toBoardDetail(b: BoardDetailSource, likedByMe: boolean): BoardDetail {
  const summary = toBoardSummary({
    ...b,
    tracks: b.tracks.map((t) => ({ albumImageUrl: t.albumImageUrl })),
  });
  return {
    ...summary,
    likedByMe,
    tracks: b.tracks.map((t) => ({
      id: t.id,
      spotifyTrackId: t.spotifyTrackId,
      trackName: t.trackName,
      artistName: t.artistName,
      albumImageUrl: t.albumImageUrl,
      previewUrl: t.previewUrl,
      position: t.position,
    })),
  };
}
