import {
  albumIdFromSavedAlbum,
  docIdForSavedAlbum,
  type SavedAlbum,
} from "@/albums/saved-album";
import {
  clearPersistedHiddenAlbumIds,
  persistHiddenAlbumIds,
  seedLiveHiddenAlbumIdsFromStorage,
  setLiveHiddenAlbumIds,
  readHiddenAlbumIdsEarly,
} from "@/albums/early-ids";
import {
  clearAllAlbums,
  loadAlbumsFromCache,
  removeAlbum,
  subscribeAlbums,
  upsertAlbum,
} from "@/lib/firebase/firestore-data";
import {
  currentUserReady,
  signInWithEmail,
  signOutCurrent,
  userView,
  watchAuth,
  type FirebaseUserView,
} from "@/lib/firebase/auth";
import { firebaseAuthReady } from "@/lib/firebase/app";

type AlbumListener = (albums: Record<string, SavedAlbum>) => void;
type AuthListener = (user: FirebaseUserView | null) => void;
type HideTilesListener = (enabled: boolean) => void;

const HIDE_TILES_KEY = "hide-albums-hide-tiles";

let albums: Record<string, SavedAlbum> = {};
let hiddenIdCache: Set<string> | null = null;
let hideTilesEnabled = readLocalHideTiles();
let uid: string | null = null;
let started = false;
let syncEpoch = 0;

const albumListeners = new Set<AlbumListener>();
const authListeners = new Set<AuthListener>();
const hideTilesListeners = new Set<HideTilesListener>();

let unsubAlbums: (() => void) | null = null;
let unsubAuth: (() => void) | null = null;

function readLocalHideTiles(): boolean {
  try {
    const v = localStorage.getItem(HIDE_TILES_KEY);
    if (v === null) return true;
    return v !== "0";
  } catch {
    return true;
  }
}

function writeLocalHideTiles(value: boolean): void {
  try {
    localStorage.setItem(HIDE_TILES_KEY, value ? "1" : "0");
  } catch {
    void 0;
  }
}

function rebuildHiddenIdCache(): Set<string> {
  if (!hideTilesEnabled) {
    const out = new Set<string>();
    hiddenIdCache = out;
    setLiveHiddenAlbumIds(out);
    return out;
  }
  if (!uid) {
    seedLiveHiddenAlbumIdsFromStorage();
    hiddenIdCache = new Set(readHiddenAlbumIdsEarly());
    return hiddenIdCache;
  }
  const out = new Set<string>();
  for (const row of Object.values(albums)) {
    const id = albumIdFromSavedAlbum(row);
    if (id) out.add(id);
  }
  hiddenIdCache = out;
  persistHiddenAlbumIds(out);
  return out;
}

function emitAlbums(): void {
  hiddenIdCache = null;
  rebuildHiddenIdCache();
  const snap = { ...albums };
  for (const fn of albumListeners) fn(snap);
}

function emitAuth(user: FirebaseUserView | null): void {
  for (const fn of authListeners) fn(user);
}

function emitHideTiles(): void {
  for (const fn of hideTilesListeners) fn(hideTilesEnabled);
  emitAlbums();
}

function applyAlbums(next: Record<string, SavedAlbum>): void {
  albums = next;
  emitAlbums();
}

function detachAlbumListeners(): void {
  unsubAlbums?.();
  unsubAlbums = null;
}

function attachAlbumListeners(userId: string): void {
  detachAlbumListeners();
  const epoch = ++syncEpoch;
  void hydrateFromCache(userId, epoch);
  unsubAlbums = subscribeAlbums(
    userId,
    (next) => {
      if (epoch !== syncEpoch || uid !== userId) return;
      applyAlbums(next);
    },
    () => undefined,
  );
}

async function hydrateFromCache(userId: string, epoch: number): Promise<void> {
  const cached = await loadAlbumsFromCache(userId);
  if (epoch !== syncEpoch || uid !== userId || !cached) return;
  applyAlbums(cached);
}

export function hiddenAlbumIdSet(): Set<string> {
  if (hiddenIdCache) return hiddenIdCache;
  return rebuildHiddenIdCache();
}

export function subscribeHiddenAlbums(fn: AlbumListener): () => void {
  albumListeners.add(fn);
  fn({ ...albums });
  return () => albumListeners.delete(fn);
}

export function subscribeAuth(fn: AuthListener): () => void {
  authListeners.add(fn);
  void currentUserReady().then((u) => fn(userView(u)));
  return () => authListeners.delete(fn);
}

export function subscribeHideTilesSetting(fn: HideTilesListener): () => void {
  hideTilesListeners.add(fn);
  fn(hideTilesEnabled);
  return () => hideTilesListeners.delete(fn);
}

export function getHideTilesEnabled(): boolean {
  return hideTilesEnabled;
}

export function isAlbumHidden(albumId: string): boolean {
  return findDocIdForAlbumId(albumId) !== null;
}

function findDocIdForAlbumId(albumId: string): string | null {
  for (const [docId, a] of Object.entries(albums)) {
    if (albumIdFromSavedAlbum(a) === albumId) return docId;
  }
  return null;
}

function requireUid(): string {
  if (!uid) {
    throw Object.assign(new Error("Sign in to sync"), {
      code: "auth-required",
    });
  }
  return uid;
}

export async function hideAlbum(entry: SavedAlbum): Promise<void> {
  const userId = requireUid();
  const id = docIdForSavedAlbum(entry);
  const now = Date.now();
  const row: SavedAlbum = {
    ...entry,
    updatedAt: now,
  };
  const prev = albums[id];
  applyAlbums({ ...albums, [id]: row });
  try {
    await upsertAlbum(userId, row);
  } catch (e) {
    if (prev) applyAlbums({ ...albums, [id]: prev });
    else {
      const next = { ...albums };
      delete next[id];
      applyAlbums(next);
    }
    throw e;
  }
}

export async function unhideAlbum(albumId: string): Promise<void> {
  const docId = findDocIdForAlbumId(albumId);
  if (!docId) return;
  await removeByDocId(docId);
}

export async function removeByDocId(docId: string): Promise<void> {
  const userId = requireUid();
  const prev = albums[docId];
  if (!prev) return;
  const next = { ...albums };
  delete next[docId];
  applyAlbums(next);
  try {
    await removeAlbum(userId, docId);
  } catch (e) {
    applyAlbums({ ...albums, [docId]: prev });
    throw e;
  }
}

export async function clearAllHiddenAlbums(): Promise<number> {
  const userId = requireUid();
  const prevAlbums = albums;
  const ids = Object.keys(prevAlbums);
  const count = ids.length;
  if (count === 0) return 0;
  applyAlbums({});
  try {
    await clearAllAlbums(userId, ids);
  } catch (e) {
    applyAlbums(prevAlbums);
    throw e;
  }
  return count;
}

export async function setHideAlbumTiles(value: boolean): Promise<void> {
  hideTilesEnabled = value;
  writeLocalHideTiles(value);
  emitHideTiles();
}

export async function signIn(
  email: string,
  password: string,
): Promise<FirebaseUserView | null> {
  return signInWithEmail(email, password);
}

export async function signOut(): Promise<void> {
  await signOutCurrent();
}

export type HiddenAlbumEntry = {
  docId: string;
  albumId: string | null;
  title: string;
  url: string | null;
  updatedAt: number;
};

export function listHiddenAlbumEntries(): HiddenAlbumEntry[] {
  const rows: HiddenAlbumEntry[] = [];
  for (const [docId, album] of Object.entries(albums)) {
    rows.push({
      docId,
      albumId: albumIdFromSavedAlbum(album),
      title: (album.title ?? "").trim() || "Untitled album",
      url: album.url ?? null,
      updatedAt: album.updatedAt,
    });
  }
  rows.sort((a, b) => b.updatedAt - a.updatedAt);
  return rows;
}

export async function startAlbumSync(): Promise<() => void> {
  if (started) return () => undefined;
  started = true;
  hideTilesEnabled = readLocalHideTiles();
  seedLiveHiddenAlbumIdsFromStorage();
  hiddenIdCache = null;
  await firebaseAuthReady();
  unsubAuth = watchAuth((user) => {
    const view = userView(user);
    const nextUid = view?.uid ?? null;
    const prevUid = uid;
    uid = nextUid;
    emitAuth(view);
    if (!view) {
      syncEpoch += 1;
      detachAlbumListeners();
      clearPersistedHiddenAlbumIds();
      albums = {};
      hiddenIdCache = null;
      emitAlbums();
      return;
    }
    if (prevUid && prevUid !== nextUid) {
      albums = {};
      hiddenIdCache = null;
      clearPersistedHiddenAlbumIds();
    } else if (prevUid !== nextUid) {
      albums = {};
      hiddenIdCache = null;
    }
    attachAlbumListeners(view.uid);
  });
  return () => {
    syncEpoch += 1;
    unsubAuth?.();
    unsubAuth = null;
    detachAlbumListeners();
    started = false;
  };
}
