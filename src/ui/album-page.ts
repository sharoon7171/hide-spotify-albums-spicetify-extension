export const XpuiTestId = {
  albumPage: "album-page",
  actionBarRow: "action-bar-row",
  playButton: "play-button",
  pauseButton: "pause-button",
  moreButton: "more-button",
  playlistTracklist: "playlist-tracklist",
} as const;

export const XpuiAria = {
  moreOptionsPrefix: "More options for",
} as const;

const PLAY_TEST_IDS = [XpuiTestId.playButton, XpuiTestId.pauseButton] as const;
const ROW_DISPLAY = new Set([
  "flex",
  "inline-flex",
  "inline-grid",
  "grid",
]);
const HEADER_ROW_MAX_DY_PX = 96;

export type AlbumActionAnchor = {
  bar: HTMLElement;
  insertAfter: HTMLElement;
  strategy: "action-bar-row" | "play-row" | "main-fallback";
};

export function currentPathname(sp: typeof Spicetify): string {
  return sp.Platform.History.location.pathname || location.pathname;
}

export function isAlbumPath(pathname: string): boolean {
  return /\/album\/[^/?#]+/.test(pathname);
}

export function albumPageRoot(): HTMLElement | null {
  const scoped = document.querySelector<HTMLElement>(
    `section[data-testid="${XpuiTestId.albumPage}"]`,
  );
  if (scoped) return scoped;
  if (!isAlbumPath(location.pathname)) return null;
  return document.querySelector("main");
}

export function resolveAlbumActionAnchor(): AlbumActionAnchor | null {
  const root = albumPageRoot();
  if (!root) return null;

  const byRow = anchorFromActionBarRow(root);
  if (byRow) return byRow;

  const byPlay = anchorFromPlayControl(root);
  if (byPlay) return byPlay;

  return anchorFromMainFallback(root);
}

function anchorFromActionBarRow(root: HTMLElement): AlbumActionAnchor | null {
  const bar = root.querySelector<HTMLElement>(
    `[data-testid="${XpuiTestId.actionBarRow}"]`,
  );
  if (!bar) return null;
  const more = pickHeaderMoreButton(bar, findPlayControl(root));
  if (!more) return null;
  return { bar, insertAfter: more, strategy: "action-bar-row" };
}

function anchorFromPlayControl(root: HTMLElement): AlbumActionAnchor | null {
  const play = findPlayControl(root);
  if (!play) return null;
  const row = findActionRowFromPlay(play);
  if (!row) return null;
  const more = pickHeaderMoreButton(row, play);
  if (!more) return null;
  return { bar: row, insertAfter: more, strategy: "play-row" };
}

function anchorFromMainFallback(root: HTMLElement): AlbumActionAnchor | null {
  const play = findPlayControl(root);
  const more = pickHeaderMoreButton(root, play);
  if (!more) return null;
  const bar =
    (play && findActionRowFromPlay(play)) ||
    (more.parentElement as HTMLElement | null) ||
    root;
  return { bar, insertAfter: more, strategy: "main-fallback" };
}

function findPlayControl(root: ParentNode): HTMLElement | null {
  const nodes = queryPlayControls(root);
  if (nodes.length === 0) return null;
  nodes.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  return nodes[0] ?? null;
}

function queryPlayControls(root: ParentNode): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const id of PLAY_TEST_IDS) {
    root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`).forEach((el) => {
      if (isVisible(el)) out.push(el);
    });
  }
  return out;
}

function findActionRowFromPlay(play: HTMLElement): HTMLElement | null {
  let cur: HTMLElement | null = play;
  const playTop = play.getBoundingClientRect().top;
  while (cur && cur !== document.body) {
    if (rowHasPlayAndMore(cur, play, playTop)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function rowHasPlayAndMore(
  row: HTMLElement,
  play: HTMLElement,
  playTop: number,
): boolean {
  const style = getComputedStyle(row);
  if (!ROW_DISPLAY.has(style.display)) return false;
  const more = pickHeaderMoreButton(row, play);
  if (!more) return false;
  const dy = Math.abs(more.getBoundingClientRect().top - playTop);
  return dy <= HEADER_ROW_MAX_DY_PX;
}

function pickHeaderMoreButton(
  scope: ParentNode,
  play: HTMLElement | null,
): HTMLElement | null {
  const playTop = play?.getBoundingClientRect().top;
  const candidates = queryMoreButtons(scope);
  if (candidates.length === 0) return null;
  if (playTop === undefined) {
    candidates.sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );
    return candidates[0] ?? null;
  }
  let best: HTMLElement | null = null;
  let bestDy = Infinity;
  for (const btn of candidates) {
    const dy = Math.abs(btn.getBoundingClientRect().top - playTop);
    if (dy > HEADER_ROW_MAX_DY_PX) continue;
    if (dy < bestDy) {
      bestDy = dy;
      best = btn;
    }
  }
  return best;
}

function queryMoreButtons(scope: ParentNode): HTMLElement[] {
  const out: HTMLElement[] = [];
  scope
    .querySelectorAll<HTMLElement>(`[data-testid="${XpuiTestId.moreButton}"]`)
    .forEach((el) => {
      if (isVisible(el)) out.push(el);
    });
  scope.querySelectorAll<HTMLElement>("button[aria-label]").forEach((el) => {
    const label = el.getAttribute("aria-label") ?? "";
    if (!label.startsWith(XpuiAria.moreOptionsPrefix)) return;
    if (isVisible(el)) out.push(el);
  });
  return dedupeElements(out);
}

function dedupeElements(nodes: HTMLElement[]): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const out: HTMLElement[] = [];
  for (const n of nodes) {
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function isVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function readAlbumTitle(): string {
  const root = albumPageRoot();
  const h =
    root?.querySelector("h1")?.textContent?.trim() ||
    document.querySelector("main h1")?.textContent?.trim();
  if (h) return h;
  const t = document.title;
  const i = t.indexOf(" - ");
  const head = i > 0 ? t.slice(0, i) : t;
  return head.replace(/\s*\|\s*Spotify\s*$/i, "").trim();
}
