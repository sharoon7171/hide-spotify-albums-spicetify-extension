export function openSpotifyAlbumUrl(albumId: string): string {
  return `https://open.spotify.com/album/${albumId}`;
}

export function albumIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/\/album\/([^/?#]+)/);
  return m ? m[1] : null;
}

export function albumIdFromHref(href: string): string | null {
  const spotifyUri = href.match(/spotify:album:([^:?#/]+)/i);
  if (spotifyUri) return spotifyUri[1];

  try {
    const u = new URL(href, "https://open.spotify.com");
    const fromPath = albumIdFromPathname(u.pathname);
    if (fromPath) return fromPath;
    const hashPath = albumIdFromPathname(u.hash.replace(/^#/, ""));
    if (hashPath) return hashPath;
  } catch {
    return albumIdFromPathname(href);
  }

  return albumIdFromPathname(href);
}

export function albumUrlFromAlbumId(albumId: string): string {
  return openSpotifyAlbumUrl(albumId);
}
