let liveHiddenIds = new Set<string>();

export function setLiveHiddenAlbumIds(ids: Iterable<string>): void {
  liveHiddenIds = new Set(ids);
}

export function readHiddenAlbumIdsEarly(): Set<string> {
  return liveHiddenIds;
}
