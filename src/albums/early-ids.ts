const LIVE_FILTERED_IDS_KEY = "__spicetifyExtLiveFilteredAlbumIds_v1";

type LiveFilteredIdsGlobal = typeof globalThis & {
  [LIVE_FILTERED_IDS_KEY]?: Set<string>;
};

export function setLiveFilteredAlbumIds(ids: Iterable<string>): void {
  (globalThis as LiveFilteredIdsGlobal)[LIVE_FILTERED_IDS_KEY] = new Set(ids);
}

export function readFilteredAlbumIdsEarly(): Set<string> {
  return (
    (globalThis as LiveFilteredIdsGlobal)[LIVE_FILTERED_IDS_KEY] ?? new Set()
  );
}
