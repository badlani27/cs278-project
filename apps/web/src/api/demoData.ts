import type {
  BoardDetail,
  BoardTrackInput,
  BoardSummary,
  CommentNode,
  PublicUser,
  SpotifySearchTrack,
} from "@soundboard/shared";

type DemoState = {
  boards: BoardDetail[];
  comments: Record<string, CommentNode[]>;
};

const DEMO_STORAGE_KEY = "soundboard-demo-state-v1";

export const demoUser: PublicUser = {
  id: "demo-aditya",
  displayName: "Aditya",
  imageUrl: null,
};

let demoWeeklySeedOptIn = false;

export const demoSessionUser = {
  ...demoUser,
  spotifyLibraryLinked: true,
  get weeklySeedOptIn() {
    return demoWeeklySeedOptIn;
  },
};

const users: Record<string, PublicUser> = {
  "demo-aditya": demoUser,
  "demo-akshay": {
    id: "demo-akshay",
    displayName: "Akshay",
    imageUrl: null,
  },
  "demo-gio": {
    id: "demo-gio",
    displayName: "Gio",
    imageUrl: null,
  },
  "demo-maya": {
    id: "demo-maya",
    displayName: "Maya",
    imageUrl: null,
  },
};

const demoTracks: SpotifySearchTrack[] = [
  {
    id: "espresso",
    name: "Espresso",
    artists: "Sabrina Carpenter",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273cc04ff3e70e146ba9abacf40",
    previewUrl: null,
  },
  {
    id: "pink-pony-club",
    name: "Pink Pony Club",
    artists: "Chappell Roan",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b27391b4bc7c88d91a42e0f3a8b7",
    previewUrl: null,
  },
  {
    id: "good-luck-babe",
    name: "Good Luck, Babe!",
    artists: "Chappell Roan",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b27391b4bc7c88d91a42e0f3a8b7",
    previewUrl: null,
  },
  {
    id: "supercut",
    name: "Supercut",
    artists: "Lorde",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f8553e18a11209d4becd0336",
    previewUrl: null,
  },
  {
    id: "bags",
    name: "Bags",
    artists: "Clairo",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273e4aef8b77b46cfccf2d4b8db",
    previewUrl: null,
  },
  {
    id: "nights",
    name: "Nights",
    artists: "Frank Ocean",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273a0b780c23fc3c19bd412c234",
    previewUrl: null,
  },
  {
    id: "dreams",
    name: "Dreams",
    artists: "Fleetwood Mac",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273b1d5716f930cb5f4d9364b59",
    previewUrl: null,
  },
  {
    id: "ivy",
    name: "Ivy",
    artists: "Frank Ocean",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273a0b780c23fc3c19bd412c234",
    previewUrl: null,
  },
  {
    id: "anything",
    name: "Anything",
    artists: "Adrianne Lenker",
    albumImageUrl: "https://i.scdn.co/image/ab67616d0000b27335c8f06228b49823c8df0a94",
    previewUrl: null,
  },
];

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function detailFrom(
  seed: Omit<BoardDetail, "coverImages" | "commentCount" | "rankingScore" | "likedByMe">,
  likedByMe = false,
): BoardDetail {
  const coverImages = seed.tracks
    .map((t) => t.albumImageUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 4);
  return {
    ...seed,
    coverImages,
    commentCount: 0,
    rankingScore: seed.likeCount * 2 + seed.remixCount * 4,
    likedByMe,
  };
}

const initialBoards: BoardDetail[] = [
  detailFrom(
    {
      id: "board-aesthetic-crush",
      title: "Not basic, still obsessed",
      description:
        "Songs that are polished enough for the group chat but still feel like a real confession.",
      tags: ["aesthetic", "not basic", "pop gloss", "main character"],
      createdAt: daysAgo(1),
      likeCount: 14,
      remixCount: 3,
      creator: users["demo-maya"]!,
      parentBoard: null,
      isRemix: false,
      tracks: [demoTracks[0]!, demoTracks[1]!, demoTracks[2]!, demoTracks[3]!].map(trackToBoardTrack),
    },
    true,
  ),
  detailFrom({
    id: "board-rainy-window",
    title: "Rainy window, warm tea",
    description:
      "Quiet tracks for when everyone is studying but the playlist is secretly doing emotional labor.",
    tags: ["cozy", "study", "soft", "not chopped"],
    createdAt: daysAgo(3),
    likeCount: 9,
    remixCount: 1,
    creator: users["demo-akshay"]!,
    parentBoard: null,
    isRemix: false,
    tracks: [demoTracks[4]!, demoTracks[8]!, demoTracks[6]!].map(trackToBoardTrack),
  }),
  detailFrom({
    id: "board-after-hours-remix",
    title: "Rainy window, but make it late night",
    description:
      "A remix that keeps the soft edges but swaps in a little more neon and restlessness.",
    tags: ["remix", "late night", "soft chaos"],
    createdAt: daysAgo(0),
    likeCount: 7,
    remixCount: 0,
    creator: users["demo-gio"]!,
    parentBoard: { id: "board-rainy-window", title: "Rainy window, warm tea" },
    isRemix: true,
    tracks: [demoTracks[7]!, demoTracks[5]!, demoTracks[3]!].map(trackToBoardTrack),
  }),
];

const initialComments: Record<string, CommentNode[]> = {
  "board-aesthetic-crush": [
    {
      id: "comment-1",
      body: "This moodboard is sooo aesthetic. Sabrina is doing a lot of the social glue here.",
      createdAt: daysAgo(1),
      user: users["demo-akshay"]!,
      replies: [
        {
          id: "reply-1",
          body: "Exactly. It feels popular but not anonymous.",
          createdAt: daysAgo(1),
          user: users["demo-gio"]!,
        },
      ],
    },
    {
      id: "comment-2",
      body: "Super mature and not basic. Who's your favorite artist right now?",
      createdAt: daysAgo(0),
      user: users["demo-aditya"]!,
      replies: [],
    },
  ],
  "board-rainy-window": [
    {
      id: "comment-3",
      body: "This is the one I would actually put on before section.",
      createdAt: daysAgo(2),
      user: users["demo-maya"]!,
      replies: [],
    },
  ],
};

function trackToBoardTrack(t: SpotifySearchTrack, position: number): BoardDetail["tracks"][number] {
  return {
    id: `${t.id}-${position}`,
    spotifyTrackId: t.id,
    trackName: t.name,
    artistName: t.artists,
    albumImageUrl: t.albumImageUrl,
    previewUrl: t.previewUrl,
    note: null,
    position,
  };
}

function summarize(board: BoardDetail): BoardSummary {
  const { tracks: _tracks, likedByMe: _likedByMe, ...summary } = board;
  return summary;
}

function loadState(): DemoState {
  const fallback = { boards: initialBoards, comments: initialComments };
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.boards) || typeof parsed.comments !== "object") return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveState(state: DemoState) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

function withCommentCounts(boards: BoardDetail[], comments: Record<string, CommentNode[]>) {
  return boards.map((board) => ({
    ...board,
    commentCount: comments[board.id]?.reduce((sum, c) => sum + 1 + c.replies.length, 0) ?? 0,
    rankingScore:
      board.likeCount * 2 +
      (comments[board.id]?.length ?? 0) * 3 +
      board.remixCount * 4 +
      Math.max(0, 10 - Math.floor((Date.now() - new Date(board.createdAt).getTime()) / 86400000)),
  }));
}

function createBoardFromPayload(payload: {
  title: string;
  description: string | null;
  tags: string[];
  tracks: BoardTrackInput[];
  parentBoard?: { id: string; title: string } | null;
}): BoardDetail {
  const id = `board-${Date.now().toString(36)}`;
  const tracks = payload.tracks.map((t, i) => ({
    id: `${id}-track-${i}`,
    spotifyTrackId: t.spotifyTrackId,
    trackName: t.trackName,
    artistName: t.artistName,
    albumImageUrl: t.albumImageUrl ?? null,
    previewUrl: t.previewUrl ?? null,
    note: t.note?.trim() || null,
    position: i,
  }));

  return detailFrom({
    id,
    title: payload.title,
    description: payload.description,
    tags: payload.tags,
    createdAt: new Date().toISOString(),
    likeCount: 1,
    remixCount: 0,
    creator: demoUser,
    parentBoard: payload.parentBoard ?? null,
    isRemix: Boolean(payload.parentBoard),
    tracks,
  });
}

export async function demoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 160));
  const state = loadState();
  const boards = withCommentCounts(state.boards, state.comments);
  const method = init?.method?.toUpperCase() ?? "GET";

  if (path === "/auth/me") {
    if (method === "PATCH") {
      const payload = JSON.parse(String(init?.body ?? "{}")) as { weeklySeedOptIn?: boolean };
      if (typeof payload.weeklySeedOptIn === "boolean") {
        demoWeeklySeedOptIn = payload.weeklySeedOptIn;
      }
      return { user: { ...demoSessionUser, weeklySeedOptIn: demoWeeklySeedOptIn } } as T;
    }
    return { user: { ...demoSessionUser, weeklySeedOptIn: demoWeeklySeedOptIn } } as T;
  }
  if (path === "/auth/logout") return undefined as T;

  if (path === "/stats") {
    return {
      activeUsers: 4,
      totals: {
        logins: 12,
        boardCreates: 6,
        remixes: 2,
        likes: 18,
        comments: 9,
        replies: 3,
        boardSeedViews: 2,
      },
      since: new Date(Date.now() - 30 * 86400000).toISOString(),
    } as T;
  }

  if (path.startsWith("/spotify/search")) {
    const url = new URL(path, window.location.origin);
    const q = url.searchParams.get("q")?.toLowerCase().trim() ?? "";
    const tracks = demoTracks.filter(
      (t) => t.name.toLowerCase().includes(q) || t.artists.toLowerCase().includes(q),
    );
    return { tracks: tracks.length ? tracks : demoTracks.slice(0, 5) } as T;
  }

  if (path === "/spotify/recent") {
    return { tracks: demoTracks.slice(0, 8) } as T;
  }

  if (path === "/spotify/playlists") {
    return {
      playlists: [
        { id: "demo-late-night", name: "late night drives", trackCount: 12, imageUrl: null },
        { id: "demo-study", name: "study without words", trackCount: 24, imageUrl: null },
      ],
    } as T;
  }

  if (path.startsWith("/spotify/playlists/") && path.endsWith("/tracks")) {
    return { tracks: demoTracks.slice(2, 10) } as T;
  }

  if (path.startsWith("/spotify/top-tracks")) {
    return { tracks: demoTracks.slice(1, 9), range: "short_term" } as T;
  }

  if (path === "/spotify/board-seed") {
    if (!demoWeeklySeedOptIn) {
      return { available: false, reason: "opt_out" } as T;
    }
    return {
      available: true,
      draft: {
        tracks: demoTracks.slice(0, 6),
        suggestedTitle: "This week's rotation",
        suggestedTags: ["recent", "on repeat"],
        descriptionHint:
          "What were you going through when these songs kept showing up? Share the mood, not just the playlist.",
      },
    } as T;
  }

  const overlapMatch = path.match(/^\/boards\/([^/]+)\/overlap$/);
  if (overlapMatch && method === "GET") {
    const board = boards.find((b) => b.id === overlapMatch[1]);
    const sharedTracks = board
      ? demoTracks.filter((t) => board.tracks.some((bt) => bt.spotifyTrackId === t.id)).slice(0, 2)
      : [];
    const sharedTags = board?.tags.filter((t) => t === "cozy" || t === "aesthetic") ?? [];
    return { sharedTracks, sharedTags } as T;
  }

  const remixSuggestionsMatch = path.match(/^\/boards\/([^/]+)\/remix-suggestions$/);
  if (remixSuggestionsMatch && method === "GET") {
    const board = boards.find((b) => b.id === remixSuggestionsMatch[1]);
    const onBoard = new Set(board?.tracks.map((t) => t.spotifyTrackId));
    const suggestions = demoTracks.filter((t) => !onBoard.has(t.id)).slice(0, 4);
    return { suggestions } as T;
  }

  if (path === "/boards" && method === "GET") {
    const feed = [...boards].sort((a, b) => b.rankingScore - a.rankingScore).map(summarize);
    const discover = [...boards]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .filter((b, index, arr) => arr.findIndex((x) => x.creator.id === b.creator.id) === index)
      .slice(0, 3)
      .map(summarize);
    return { feed, discover } as T;
  }

  if (path === "/boards" && method === "POST") {
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      title: string;
      description: string | null;
      tags: string[];
      tracks: BoardTrackInput[];
    };
    const board = createBoardFromPayload(payload);
    const next = { ...state, boards: [board, ...state.boards], comments: { ...state.comments, [board.id]: [] } };
    saveState(next);
    return board as T;
  }

  const boardMatch = path.match(/^\/boards\/([^/]+)$/);
  if (boardMatch && method === "GET") {
    const board = boards.find((b) => b.id === boardMatch[1]);
    if (!board) throw new Error("Board not found");
    return board as T;
  }

  const likeMatch = path.match(/^\/boards\/([^/]+)\/like$/);
  if (likeMatch && (method === "POST" || method === "DELETE")) {
    const nextBoards = state.boards.map((b) =>
      b.id === likeMatch[1]
        ? {
            ...b,
            likedByMe: method === "POST",
            likeCount: Math.max(0, b.likeCount + (method === "POST" ? 1 : -1)),
          }
        : b,
    );
    const next = { ...state, boards: nextBoards };
    saveState(next);
    const board = nextBoards.find((b) => b.id === likeMatch[1])!;
    return { likeCount: board.likeCount } as T;
  }

  const remixMatch = path.match(/^\/boards\/([^/]+)\/remix$/);
  if (remixMatch && method === "POST") {
    const parent = state.boards.find((b) => b.id === remixMatch[1]);
    if (!parent) throw new Error("Original board not found");
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      title: string;
      description: string | null;
      tags: string[];
      tracks: BoardTrackInput[];
    };
    const board = createBoardFromPayload({
      ...payload,
      parentBoard: { id: parent.id, title: parent.title },
    });
    const nextBoards = state.boards.map((b) =>
      b.id === parent.id ? { ...b, remixCount: b.remixCount + 1 } : b,
    );
    const next = {
      ...state,
      boards: [board, ...nextBoards],
      comments: { ...state.comments, [board.id]: [] },
    };
    saveState(next);
    return board as T;
  }

  const commentsMatch = path.match(/^\/boards\/([^/]+)\/comments$/);
  if (commentsMatch && method === "GET") {
    return { comments: state.comments[commentsMatch[1]] ?? [] } as T;
  }

  if (commentsMatch && method === "POST") {
    const payload = JSON.parse(String(init?.body ?? "{}")) as { body: string };
    const comment: CommentNode = {
      id: `comment-${Date.now().toString(36)}`,
      body: payload.body,
      createdAt: new Date().toISOString(),
      user: demoUser,
      replies: [],
    };
    const boardComments = state.comments[commentsMatch[1]] ?? [];
    const next = {
      ...state,
      comments: { ...state.comments, [commentsMatch[1]]: [comment, ...boardComments] },
    };
    saveState(next);
    return comment as T;
  }

  const replyMatch = path.match(/^\/comments\/([^/]+)\/replies$/);
  if (replyMatch && method === "POST") {
    const payload = JSON.parse(String(init?.body ?? "{}")) as { body: string };
    const reply = {
      id: `reply-${Date.now().toString(36)}`,
      body: payload.body,
      createdAt: new Date().toISOString(),
      user: demoUser,
    };
    const nextComments = Object.fromEntries(
      Object.entries(state.comments).map(([boardId, comments]) => [
        boardId,
        comments.map((c) =>
          c.id === replyMatch[1] ? { ...c, replies: [...c.replies, reply] } : c,
        ),
      ]),
    );
    const next = { ...state, comments: nextComments };
    saveState(next);
    return reply as T;
  }

  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === "GET") {
    const user = users[userMatch[1]] ?? (userMatch[1] === demoUser.id ? demoUser : null);
    if (!user) throw new Error("User not found");
    return {
      user: { ...user, memberSince: daysAgo(user.id === demoUser.id ? 0 : 14) },
      boards: boards.filter((b) => b.creator.id === user.id && !b.isRemix).map(summarize),
      remixes: boards.filter((b) => b.creator.id === user.id && b.isRemix).map(summarize),
    } as T;
  }

  throw new Error(`Demo route not implemented: ${method} ${path}`);
}
