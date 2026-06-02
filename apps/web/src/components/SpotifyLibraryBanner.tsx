import { spotifyLoginUrl } from "../api/client";

type Props = {
  message?: string;
  className?: string;
};

export function SpotifyLibraryBanner({ message, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-line bg-sky/30 px-4 py-3 text-sm text-ink ${className}`}
      role="status"
    >
      <p>
        {message ??
          "Reconnect Spotify to import your listening history, top tracks, and playlists."}
      </p>
      <a
        href={spotifyLoginUrl()}
        className="mt-2 inline-block font-medium underline-offset-2 hover:underline"
      >
        Sign in again with Spotify
      </a>
    </div>
  );
}
