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
  docIdForSavedAlbum,
  type SavedAlbum,
} from "@/albums/saved-album";
import { firestoreDb } from "./app";

const ALBUMS = "savedAlbums";
const BATCH = 450;

function albumsCol(uid: string) {
  return collection(firestoreDb(), "users", uid, ALBUMS);
}

function albumRef(uid: string, id: string) {
  return doc(firestoreDb(), "users", uid, ALBUMS, id);
}

function albumFromData(data: DocumentData): SavedAlbum {
  const album: SavedAlbum = {
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
  };
  if (typeof data.url === "string" && data.url.length > 0) album.url = data.url;
  if (typeof data.title === "string" && data.title.length > 0) {
    album.title = data.title;
  }
  return album;
}

function albumsFromSnap(snap: QuerySnapshot): Record<string, SavedAlbum> {
  const albums: Record<string, SavedAlbum> = {};
  for (const d of snap.docs) albums[d.id] = albumFromData(d.data());
  return albums;
}

export async function loadAlbumsFromCache(
  uid: string,
): Promise<Record<string, SavedAlbum> | null> {
  try {
    return albumsFromSnap(await getDocsFromCache(albumsCol(uid)));
  } catch {
    return null;
  }
}

export function subscribeAlbums(
  uid: string,
  next: (albums: Record<string, SavedAlbum>) => void,
  error?: (e: Error) => void,
): () => void {
  return onSnapshot(albumsCol(uid), (snap) => next(albumsFromSnap(snap)), error);
}

export function upsertAlbum(uid: string, entry: SavedAlbum): Promise<void> {
  const id = docIdForSavedAlbum(entry);
  const data: Record<string, unknown> = {
    updatedAt: entry.updatedAt || Date.now(),
  };
  if (entry.url) data.url = entry.url;
  if (entry.title) data.title = entry.title;
  return setDoc(albumRef(uid, id), data);
}

export function removeAlbum(uid: string, docId: string): Promise<void> {
  return deleteDoc(albumRef(uid, docId));
}

export async function clearAllAlbums(
  uid: string,
  knownIds?: string[],
): Promise<void> {
  let ids = knownIds ?? [];
  if (ids.length === 0) {
    try {
      ids = (await getDocsFromCache(albumsCol(uid))).docs.map((d) => d.id);
    } catch {
      return;
    }
  }
  const db = firestoreDb();
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + BATCH)) {
      batch.delete(albumRef(uid, id));
    }
    await batch.commit();
  }
}
