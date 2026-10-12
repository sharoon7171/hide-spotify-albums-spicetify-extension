import {
  albumIdFromEntry,
  docIdForAlbumEntry,
  type AlbumEntry,
  type AlbumListKind,
} from "@/albums/album-entry";
import { setLiveFilteredAlbumIds } from "@/albums/early-ids";
import {
  clearAllAlbums,
  loadAlbumsFromCache,
  removeAlbum,
  subscribeAlbums,
  upsertAlbum,
} from "@/lib/firebase/firestore-data";
import {
  signInWithEmail,
  signOutCurrent,
  userView,
  watchAuth,
  type FirebaseUserView,
} from "@/lib/firebase/auth";
import { firebaseAuth, firebaseAuthReady, firestoreDb } from "@/lib/firebase/app";
import type { User } from "firebase/auth";

type AlbumListListener = () => void;
type AuthListener = (user: FirebaseUserView | null) => void;
type GridFiltersListener = (filters: GridFilters) => void;

export type GridFilters = {
  hidden: boolean;
  excluded: boolean;
};

const FILTER_HIDDEN_KEY = "hide-albums-filter-hidden";
const FILTER_EXCLUDED_KEY = "hide-albums-filter-excluded";
const OTHER: Record<AlbumListKind, AlbumListKind> = {
  hidden: "excluded",
  excluded: "hidden",
};

let hiddenAlbums: Record<string, AlbumEntry> = {};
let excludedAlbums: Record<string, AlbumEntry> = {};
let filteredIdCache: Set<string> | null = null;
let gridFilters: GridFilters = readLocalGridFilters();
let uid: string | null = null;
let started = false;
let syncEpoch = 0;
let authUiReady = false;
let authUser: FirebaseUserView | null = null;

const albumListeners = new Set<AlbumListListener>();
const authListeners = new Set<AuthListener>();
const gridFilterListeners = new Set<GridFiltersListener>();

let unsubHidden: (() => void) | null = null;
let unsubExcluded: (() => void) | null = null;
let unsubAuth: (() => void) | null = null;

function storageKeyForList(list: AlbumListKind): string {
  return list === "hidden" ? FILTER_HIDDEN_KEY : FILTER_EXCLUDED_KEY;
}

function readLocalFlag(key: string): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return true;
    return v !== "0";
  } catch {
    return true;
  }
}

function readLocalGridFilters(): GridFilters {
  return {
    hidden: readLocalFlag(FILTER_HIDDEN_KEY),
    excluded: readLocalFlag(FILTER_EXCLUDED_KEY),
  };
}

function writeLocalGridFilter(list: AlbumListKind, value: boolean): void {
  try {
    localStorage.setItem(storageKeyForList(list), value ? "1" : "0");
  } catch {
    void 0;
  }
}

function listMap(list: AlbumListKind): Record<string, AlbumEntry> {
  return list === "hidden" ? hiddenAlbums : excludedAlbums;
}

function setListMap(
  list: AlbumListKind,
  next: Record<string, AlbumEntry>,
): void {
  if (list === "hidden") hiddenAlbums = next;
  else excludedAlbums = next;
}

function rebuildFilteredIdCache(): Set<string> {
  const out = new Set<string>();
  if (uid) {
    if (gridFilters.hidden) {
      for (const row of Object.values(hiddenAlbums)) {
        const id = albumIdFromEntry(row);
        if (id) out.add(id);
      }
    }
    if (gridFilters.excluded) {
      for (const row of Object.values(excludedAlbums)) {
        const id = albumIdFromEntry(row);
        if (id) out.add(id);
      }
    }
  }
  filteredIdCache = out;
  setLiveFilteredAlbumIds(out);
  return out;
}

function emitAlbums(): void {
  filteredIdCache = null;
  rebuildFilteredIdCache();
  for (const fn of albumListeners) fn();
}

function emitAuth(user: FirebaseUserView | null): void {
  authUiReady = true;
  authUser = user;
  for (const fn of authListeners) fn(user);
}

function emitGridFilters(): void {
  const snap = { ...gridFilters };
  for (const fn of gridFilterListeners) fn(snap);
  emitAlbums();
}

function applyList(list: AlbumListKind, next: Record<string, AlbumEntry>): void {
  setListMap(list, next);
  emitAlbums();
}

function detachAlbumListeners(): void {
  unsubHidden?.();
  unsubHidden = null;
  unsubExcluded?.();
  unsubExcluded = null;
}

async function attachAlbumListeners(
  userId: string,
  epoch: number,
): Promise<void> {
  detachAlbumListeners();
  const [cachedHidden, cachedExcluded] = await Promise.all([
    loadAlbumsFromCache(userId, "hidden"),
    loadAlbumsFromCache(userId, "excluded"),
  ]);
  if (epoch !== syncEpoch || uid !== userId) return;
  hiddenAlbums = cachedHidden ?? {};
  excludedAlbums = cachedExcluded ?? {};
  emitAlbums();
  unsubHidden = subscribeAlbums(
    userId,
    "hidden",
    (next) => {
      if (epoch !== syncEpoch || uid !== userId) return;
      applyList("hidden", next);
    },
    () => undefined,
  );
  unsubExcluded = subscribeAlbums(
    userId,
    "excluded",
    (next) => {
      if (epoch !== syncEpoch || uid !== userId) return;
      applyList("excluded", next);
    },
    () => undefined,
  );
}

function applyAuthUser(user: User | null): void {
  const epoch = ++syncEpoch;
  const view = userView(user);
  if (!view) {
    detachAlbumListeners();
    uid = null;
    hiddenAlbums = {};
    excludedAlbums = {};
    emitAlbums();
    if (epoch === syncEpoch) emitAuth(null);
    return;
  }
  uid = view.uid;
  if (epoch === syncEpoch) emitAuth(view);
  void attachAlbumListeners(view.uid, epoch);
}

export function filteredAlbumIdSet(): Set<string> {
  if (filteredIdCache) return filteredIdCache;
  return rebuildFilteredIdCache();
}

export function subscribeAlbumLists(fn: AlbumListListener): () => void {
  albumListeners.add(fn);
  fn();
  return () => albumListeners.delete(fn);
}

export function subscribeAuth(fn: AuthListener): () => void {
  authListeners.add(fn);
  if (authUiReady) fn(authUser);
  return () => authListeners.delete(fn);
}

export function subscribeGridFilters(fn: GridFiltersListener): () => void {
  gridFilterListeners.add(fn);
  fn({ ...gridFilters });
  return () => gridFilterListeners.delete(fn);
}

export function getGridFilters(): GridFilters {
  return { ...gridFilters };
}

export function isAlbumHidden(albumId: string): boolean {
  return findDocIdForAlbumId("hidden", albumId) !== null;
}

export function isAlbumExcluded(albumId: string): boolean {
  return findDocIdForAlbumId("excluded", albumId) !== null;
}

function findDocIdForAlbumId(
  list: AlbumListKind,
  albumId: string,
): string | null {
  for (const [docId, a] of Object.entries(listMap(list))) {
    if (albumIdFromEntry(a) === albumId) return docId;
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

async function upsertAlbumExclusive(
  list: AlbumListKind,
  entry: AlbumEntry,
): Promise<void> {
  const userId = requireUid();
  const id = docIdForAlbumEntry(entry);
  const now = Date.now();
  const row: AlbumEntry = { ...entry, updatedAt: now };
  const other = OTHER[list];
  const prev = listMap(list)[id];
  const prevOther = listMap(other)[id];

  setListMap(list, { ...listMap(list), [id]: row });
  if (prevOther) {
    const nextOther = { ...listMap(other) };
    delete nextOther[id];
    setListMap(other, nextOther);
  }
  emitAlbums();

  try {
    await upsertAlbum(userId, list, row);
    if (prevOther) await removeAlbum(userId, other, id);
  } catch (e) {
    const primary = { ...listMap(list) };
    if (prev) primary[id] = prev;
    else delete primary[id];
    setListMap(list, primary);
    const restoredOther = { ...listMap(other) };
    if (prevOther) restoredOther[id] = prevOther;
    else delete restoredOther[id];
    setListMap(other, restoredOther);
    emitAlbums();
    throw e;
  }
}

export async function hideAlbum(entry: AlbumEntry): Promise<void> {
  await upsertAlbumExclusive("hidden", entry);
}

export async function excludeAlbum(entry: AlbumEntry): Promise<void> {
  await upsertAlbumExclusive("excluded", entry);
}

export async function unhideAlbum(albumId: string): Promise<void> {
  const docId = findDocIdForAlbumId("hidden", albumId);
  if (!docId) return;
  await removeByDocId("hidden", docId);
}

export async function includeAlbum(albumId: string): Promise<void> {
  const docId = findDocIdForAlbumId("excluded", albumId);
  if (!docId) return;
  await removeByDocId("excluded", docId);
}

export async function removeByDocId(
  list: AlbumListKind,
  docId: string,
): Promise<void> {
  const userId = requireUid();
  const prev = listMap(list)[docId];
  if (!prev) return;
  const next = { ...listMap(list) };
  delete next[docId];
  applyList(list, next);
  try {
    await removeAlbum(userId, list, docId);
  } catch (e) {
    applyList(list, { ...listMap(list), [docId]: prev });
    throw e;
  }
}

export async function clearAlbumList(list: AlbumListKind): Promise<number> {
  const userId = requireUid();
  const prev = listMap(list);
  const ids = Object.keys(prev);
  const count = ids.length;
  if (count === 0) return 0;
  applyList(list, {});
  try {
    await clearAllAlbums(userId, list, ids);
  } catch (e) {
    applyList(list, prev);
    throw e;
  }
  return count;
}

export async function setGridFilter(
  list: AlbumListKind,
  value: boolean,
): Promise<void> {
  gridFilters = { ...gridFilters, [list]: value };
  writeLocalGridFilter(list, value);
  emitGridFilters();
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

export type AlbumListEntry = {
  docId: string;
  albumId: string | null;
  title: string;
  url: string | null;
  updatedAt: number;
};

export function listAlbumEntries(list: AlbumListKind): AlbumListEntry[] {
  const rows: AlbumListEntry[] = [];
  for (const [docId, album] of Object.entries(listMap(list))) {
    rows.push({
      docId,
      albumId: albumIdFromEntry(album),
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
  gridFilters = readLocalGridFilters();
  firestoreDb();
  await firebaseAuthReady();
  applyAuthUser(firebaseAuth().currentUser);
  unsubAuth = watchAuth((user) => {
    applyAuthUser(user);
  });
  return () => {
    syncEpoch += 1;
    unsubAuth?.();
    unsubAuth = null;
    detachAlbumListeners();
    authUiReady = false;
    authUser = null;
    started = false;
  };
}
