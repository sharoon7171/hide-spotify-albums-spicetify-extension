const IDS_KEY = "hide-albums-ids-v1";
const TILES_KEY = "hide-albums-hide-tiles";

function tilesEnabled(): boolean {
  try {
    const v = localStorage.getItem(TILES_KEY);
    if (v === null) return true;
    return v !== "0";
  } catch {
    return true;
  }
}

function readPersistedIds(): string[] {
  try {
    const raw = localStorage.getItem(IDS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writePersistedIds(ids: string[]): void {
  try {
    localStorage.setItem(IDS_KEY, JSON.stringify(ids));
  } catch {
    void 0;
  }
}

let liveHiddenIds = new Set<string>(tilesEnabled() ? readPersistedIds() : []);

export function readHiddenAlbumIdsEarly(): Set<string> {
  return liveHiddenIds;
}

export function setLiveHiddenAlbumIds(ids: Iterable<string>): void {
  liveHiddenIds = new Set(ids);
}

export function persistHiddenAlbumIds(ids: Iterable<string>): void {
  const list = [...new Set(ids)];
  writePersistedIds(list);
  liveHiddenIds = new Set(tilesEnabled() ? list : []);
}

export function clearPersistedHiddenAlbumIds(): void {
  try {
    localStorage.removeItem(IDS_KEY);
  } catch {
    void 0;
  }
  liveHiddenIds = new Set();
}

export function seedLiveHiddenAlbumIdsFromStorage(): void {
  liveHiddenIds = new Set(tilesEnabled() ? readPersistedIds() : []);
}
