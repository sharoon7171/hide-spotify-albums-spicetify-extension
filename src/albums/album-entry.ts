import { albumIdFromHref } from "@/albums/urls";

export type AlbumListKind = "hidden" | "excluded";

export type AlbumEntry = {
  updatedAt: number;
  url?: string;
  title?: string;
};

export function albumIdFromEntry(a: AlbumEntry): string | null {
  if (!a.url) return null;
  return albumIdFromHref(a.url);
}

export function docIdForAlbumEntry(a: AlbumEntry): string {
  const id = albumIdFromEntry(a);
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
