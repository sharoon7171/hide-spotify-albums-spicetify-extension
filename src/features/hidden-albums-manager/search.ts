import type { AlbumListEntry } from "@/albums/store";

function normalizeAlbumSearchQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

function haystack(entry: AlbumListEntry): string {
  const parts = [
    entry.title,
    entry.albumId ?? "",
    entry.docId,
    entry.url ?? "",
  ];
  return parts.join(" ").toLowerCase();
}

function matchesAlbumSearch(
  entry: AlbumListEntry,
  rawQuery: string,
): boolean {
  const query = normalizeAlbumSearchQuery(rawQuery);
  if (!query) return true;

  const blob = haystack(entry);
  if (blob.includes(query)) return true;

  const compactQuery = query.replace(/\s+/g, "");
  const compactBlob = blob.replace(/\s+/g, "");
  if (compactBlob.includes(compactQuery)) return true;

  const tokens = query.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length > 1 && tokens.every((t) => blob.includes(t))) return true;

  return false;
}

export function filterAlbumListEntries(
  entries: AlbumListEntry[],
  rawQuery: string,
): AlbumListEntry[] {
  const query = normalizeAlbumSearchQuery(rawQuery);
  if (!query) return entries;
  return entries.filter((entry) => matchesAlbumSearch(entry, query));
}
