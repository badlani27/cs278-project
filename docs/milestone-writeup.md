# CS278 Milestone Writeup: Soundboard

Soundboard is a Zone 1 technical-focus prototype that turns playlists into social mood boards. At this milestone, the front end is functional and supports the core social interactions we identified in our piggyback prototype: browsing boards, reading creator context, reacting to taste through likes and comments, seeing remix attribution, and publishing new or remixed boards. The app is implemented as a React/Vite interface with TypeScript, Tailwind, and shared data types. It can connect to the Express/Postgres/Spotify backend, but it also includes an in-browser demo data layer so staff can click through the prototype without setting up Spotify OAuth or a database.

The current prototype demonstrates a ranked feed of music boards, a discovery section that intentionally surfaces boards from different creators to reduce filter-bubble effects, detailed board pages with tracklists and cover collages, threaded conversation, and a remix flow that preserves lineage back to the original board. The demo data is based on behaviors from our piggyback prototype, including qualitative taste language like "aesthetic," "not basic," and "not chopped." These features are meant to make music discovery visibly social rather than just individual listening.

Screenshots/video to include:
- `docs/screenshots/01-feed-ranked-discovery.png`: Feed view showing ranked boards and "Outside the usual scroll"
- `docs/screenshots/02-board-detail-comments.png`: Board detail showing tracks, social counts, comments, and creator attribution
- `docs/screenshots/03-remix-editor-lineage.png`: Remix editor showing copied tracks and automatic attribution
- `docs/screenshots/05-track-search-results.png`: Spotify-style search results in the board editor
- `docs/screenshots/07-published-remix-page.png`: Newly published remix page

Timeline:
- May 8: Submit milestone writeup with screenshots/video.
- May 9-12: Finish backend polish for board creation, comments, likes, remix lineage, and Spotify search edge cases.
- May 13-15: Add lightweight usage logging for active users, board creation, likes, comments, and remixes.
- May 16-18: Deploy the web app and API, remove any local-only credentials, and run a small internal test.
- May 19-25: Recruit 15-25 active users from Stanford friends/classes/dorm networks and encourage them to create or remix at least one board.
- May 26-30: Analyze usage counts and interaction patterns; identify unexpected behaviors or social norms.
- May 31-June 3: Iterate on UI copy, ranking, and moderation/attribution affordances based on observed use.
- June 4-5: Record final demo, collect screenshots, finish the final paper, and submit.
