# CS278 Milestone Writeup: Soundboard

Soundboard is a Zone 1 technical-focus prototype that turns playlists into social mood boards. The current milestone version has a functional React/Vite front end where users can browse a ranked feed, inspect boards, read creator context, view track collages, like boards, comment in a threaded conversation area, search for tracks, create boards, and remix existing boards while preserving attribution to the original. These flows directly implement the social behaviors we observed in our piggyback prototype: people did not just share songs, but used playlists to perform taste, ask questions, make jokes, validate each other's aesthetics, and build informal norms around what counted as a good board.

Technically, the app is implemented with TypeScript, Tailwind, shared data types, and a workspace structure that separates the web app, Express API, Prisma/Postgres data layer, and shared package. The front end can connect to the real backend and Spotify API, but for this milestone we also added an in-browser demo data layer so staff can click through without configuring Spotify OAuth or a database. This lets the prototype demonstrate interaction design and social mechanics reliably: demo boards persist locally, likes and comments update, search returns Spotify-style track results, and new boards/remixes appear immediately.

The prototype also begins to address the risks from our proposal. The feed includes both engagement ranking and an "Outside the usual scroll" section that surfaces boards from different creators, which is our first step toward avoiding a narrow filter bubble. Remix pages automatically link back to the parent board, making credit and lineage visible rather than letting remixing become uncredited copying. Finally, we intentionally emphasize tags, descriptions, comments, and attribution alongside likes, so the interface foregrounds interpretation and self-expression instead of only vanity metrics. Overall, the milestone demonstrates that the core social object of Soundboard is functional: a playlist can be browsed, discussed, evaluated, and transformed by others.

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
