import {
  collection,
  deleteDoc,
  doc,
  getDocsFromCache,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import {
  docIdForAlbumEntry,
  type AlbumEntry,
  type AlbumListKind,
} from "@/albums/album-entry";
import { firestoreDb } from "./app";

const COLLECTIONS: Record<AlbumListKind, string> = {
  hidden: "hiddenAlbums",
  excluded: "excludedAlbums",
};
const BATCH = 450;

function albumsCol(uid: string, list: AlbumListKind) {
  return collection(firestoreDb(), "users", uid, COLLECTIONS[list]);
}

function albumRef(uid: string, list: AlbumListKind, id: string) {
  return doc(firestoreDb(), "users", uid, COLLECTIONS[list], id);
}

function albumFromData(data: DocumentData): AlbumEntry {
  const album: AlbumEntry = {
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
  };
  if (typeof data.url === "string" && data.url.length > 0) album.url = data.url;
  if (typeof data.title === "string" && data.title.length > 0) {
    album.title = data.title;
  }
  return album;
}

function albumsFromSnap(snap: QuerySnapshot): Record<string, AlbumEntry> {
  const albums: Record<string, AlbumEntry> = {};
  for (const d of snap.docs) albums[d.id] = albumFromData(d.data());
  return albums;
}

export async function loadAlbumsFromCache(
  uid: string,
  list: AlbumListKind,
): Promise<Record<string, AlbumEntry> | null> {
  try {
    return albumsFromSnap(await getDocsFromCache(albumsCol(uid, list)));
  } catch {
    return null;
  }
}

export function subscribeAlbums(
  uid: string,
  list: AlbumListKind,
  next: (albums: Record<string, AlbumEntry>) => void,
  error?: (e: Error) => void,
): () => void {
  return onSnapshot(
    albumsCol(uid, list),
    (snap) => next(albumsFromSnap(snap)),
    error,
  );
}

export function upsertAlbum(
  uid: string,
  list: AlbumListKind,
  entry: AlbumEntry,
): Promise<void> {
  const id = docIdForAlbumEntry(entry);
  const data: Record<string, unknown> = {
    updatedAt: entry.updatedAt || Date.now(),
  };
  if (entry.url) data.url = entry.url;
  if (entry.title) data.title = entry.title;
  return setDoc(albumRef(uid, list, id), data);
}

export function removeAlbum(
  uid: string,
  list: AlbumListKind,
  docId: string,
): Promise<void> {
  return deleteDoc(albumRef(uid, list, docId));
}

export async function clearAllAlbums(
  uid: string,
  list: AlbumListKind,
  knownIds?: string[],
): Promise<void> {
  let ids = knownIds ?? [];
  if (ids.length === 0) {
    try {
      ids = (await getDocsFromCache(albumsCol(uid, list))).docs.map((d) => d.id);
    } catch {
      return;
    }
  }
  const db = firestoreDb();
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + BATCH)) {
      batch.delete(albumRef(uid, list, id));
    }
    await batch.commit();
  }
}
