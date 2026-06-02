export type BoardTrackInput = {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumImageUrl?: string | null;
  previewUrl?: string | null;
  note?: string | null;
  position: number;
};

export type CreateBoardBody = {
  title: string;
  description?: string | null;
  tags?: string[];
  tracks: BoardTrackInput[];
  parentBoardId?: string | null;
};

export type SpotifySearchTrack = {
  id: string;
  name: string;
  artists: string;
  albumImageUrl: string | null;
  previewUrl: string | null;
};

export type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  trackCount: number;
  imageUrl: string | null;
};

export type PublicUser = {
  id: string;
  displayName: string;
  imageUrl: string | null;
};

export type SessionUser = PublicUser & {
  spotifyLibraryLinked: boolean;
  weeklySeedOptIn: boolean;
};

export type BoardTasteOverlap = {
  sharedTracks: SpotifySearchTrack[];
  sharedTags: string[];
};

export type BoardSeedDraft = {
  tracks: SpotifySearchTrack[];
  suggestedTitle: string;
  suggestedTags: string[];
  descriptionHint: string;
};

export type BoardSeedResponse = {
  available: boolean;
  reason?: string;
  draft?: BoardSeedDraft;
};

export type UsageStats = {
  activeUsers: number;
  totals: {
    logins: number;
    boardCreates: number;
    remixes: number;
    likes: number;
    comments: number;
    replies: number;
    boardSeedViews: number;
  };
  since: string;
};

export type BoardSummary = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  remixCount: number;
  rankingScore: number;
  creator: PublicUser;
  coverImages: string[];
  parentBoard: { id: string; title: string } | null;
  isRemix: boolean;
};

export type BoardDetail = BoardSummary & {
  tracks: {
    id: string;
    spotifyTrackId: string;
    trackName: string;
    artistName: string;
    albumImageUrl: string | null;
    previewUrl: string | null;
    note: string | null;
    position: number;
  }[];
  likedByMe: boolean;
};

export type CommentNode = {
  id: string;
  body: string;
  createdAt: string;
  user: PublicUser;
  replies: {
    id: string;
    body: string;
    createdAt: string;
    user: PublicUser;
  }[];
};

export type MeResponse = {
  user: SessionUser | null;
};
