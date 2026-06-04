import {
  albumIdFromSavedAlbum,
  docIdForSavedAlbum,
  type SavedAlbum,
} from "@/albums/saved-album";

const STORAGE_KEY = "spicetify-ext:hidden-albums-v1";

type Listener = (albums: Record<string, SavedAlbum>) => void;

let cache: Record<string, SavedAlbum> | null = null;
let hiddenIdCache: Set<string> | null = null;
const listeners = new Set<Listener>();

function parseHiddenIds(raw: string | null): Set<string> {
  const out = new Set<string>();
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const row of Object.values(parsed)) {
      if (!row || typeof row !== "object") continue;
      const url = (row as { url?: string }).url ?? "";
      const m = url.match(/\/album\/([^/?#]+)/);
      if (m) out.add(m[1]);
    }
  } catch {
    return out;
  }
  return out;
}

function readRaw(): Record<string, SavedAlbum> {
  try {
    const raw = Spicetify.LocalStorage.get(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, SavedAlbum> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const row = value as SavedAlbum;
      if (typeof row.savedAt !== "number") continue;
      out[id] = row;
    }
    return out;
  } catch {
    return {};
  }
}

function writeRaw(albums: Record<string, SavedAlbum>): void {
  Spicetify.LocalStorage.set(STORAGE_KEY, JSON.stringify(albums));
}

function rebuildHiddenIdCache(): Set<string> {
  const out = new Set<string>();
  for (const row of Object.values(snapshot())) {
    const id = albumIdFromSavedAlbum(row);
    if (id) out.add(id);
  }
  hiddenIdCache = out;
  return out;
}

function emit(): void {
  hiddenIdCache = null;
  const snap = { ...snapshot() };
  for (const fn of listeners) fn(snap);
}

export function snapshot(): Record<string, SavedAlbum> {
  if (!cache) cache = readRaw();
  return cache;
}

export function hiddenAlbumIdSet(): Set<string> {
  if (hiddenIdCache) return hiddenIdCache;
  return rebuildHiddenIdCache();
}

export function readHiddenAlbumIdsEarly(): Set<string> {
  try {
    const sp = (
      globalThis as typeof globalThis & {
        Spicetify?: { LocalStorage?: { get: (k: string) => string | null } };
      }
    ).Spicetify;
    if (sp?.LocalStorage) {
      const fromSp = parseHiddenIds(sp.LocalStorage.get(STORAGE_KEY));
      if (fromSp.size > 0) return fromSp;
    }
  } catch {}
  try {
    return parseHiddenIds(localStorage.getItem(STORAGE_KEY));
  } catch {
    return new Set();
  }
}

export function subscribeHiddenAlbums(fn: Listener): () => void {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function isAlbumHidden(albumId: string): boolean {
  return hiddenAlbumIdSet().has(albumId);
}

export function findDocIdForAlbumId(albumId: string): string | null {
  for (const [docId, a] of Object.entries(snapshot())) {
    if (albumIdFromSavedAlbum(a) === albumId) return docId;
  }
  return null;
}

export async function hideAlbum(entry: SavedAlbum): Promise<void> {
  const albums = { ...snapshot() };
  albums[docIdForSavedAlbum(entry)] = entry;
  cache = albums;
  writeRaw(albums);
  emit();
}

export async function unhideAlbum(albumId: string): Promise<void> {
  const docId = findDocIdForAlbumId(albumId);
  if (!docId) return;
  await removeByDocId(docId);
}

export async function removeByDocId(docId: string): Promise<void> {
  const albums = { ...snapshot() };
  if (!(docId in albums)) return;
  delete albums[docId];
  cache = albums;
  writeRaw(albums);
  emit();
}

export async function clearAllHiddenAlbums(): Promise<number> {
  const count = Object.keys(snapshot()).length;
  if (count === 0) return 0;
  cache = {};
  writeRaw({});
  emit();
  return count;
}

export type HiddenAlbumEntry = {
  docId: string;
  albumId: string | null;
  title: string;
  url: string | null;
  savedAt: number;
};

export function listHiddenAlbumEntries(): HiddenAlbumEntry[] {
  const rows: HiddenAlbumEntry[] = [];
  for (const [docId, album] of Object.entries(snapshot())) {
    rows.push({
      docId,
      albumId: albumIdFromSavedAlbum(album),
      title: (album.title ?? "").trim() || "Untitled album",
      url: album.url ?? null,
      savedAt: album.savedAt,
    });
  }
  rows.sort((a, b) => b.savedAt - a.savedAt);
  return rows;
}
