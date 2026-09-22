const LIVE_HIDDEN_IDS_KEY = "__spicetifyExtLiveHiddenAlbumIds_v1";

type LiveHiddenIdsGlobal = typeof globalThis & {
  [LIVE_HIDDEN_IDS_KEY]?: Set<string>;
};

export function setLiveHiddenAlbumIds(ids: Iterable<string>): void {
  (globalThis as LiveHiddenIdsGlobal)[LIVE_HIDDEN_IDS_KEY] = new Set(ids);
}

export function readHiddenAlbumIdsEarly(): Set<string> {
  return (
    (globalThis as LiveHiddenIdsGlobal)[LIVE_HIDDEN_IDS_KEY] ?? new Set()
  );
}
