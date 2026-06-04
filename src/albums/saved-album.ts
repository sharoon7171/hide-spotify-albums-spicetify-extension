import { albumIdFromHref } from "@/albums/urls";

export type SavedAlbum = {
  savedAt: number;
  url?: string;
  title?: string;
};

export function albumIdFromSavedAlbum(a: SavedAlbum): string | null {
  if (!a.url) return null;
  return albumIdFromHref(a.url);
}

export function docIdForSavedAlbum(a: SavedAlbum): string {
  const id = albumIdFromSavedAlbum(a);
  if (id) return id;
  const title = (a.title ?? "").trim();
  return `t-${encodeBase36(title)}`;
}

function encodeBase36(input: string): string {
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 131n + BigInt(input.charCodeAt(i))) & 0xffffffffffffffffn;
  }
  const hex = hash.toString(36);
  return hex || "0";
}
