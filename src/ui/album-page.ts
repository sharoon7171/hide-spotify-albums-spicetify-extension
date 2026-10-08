const XpuiTestId = {
  albumPage: "album-page",
  actionBarRow: "action-bar-row",
} as const;

type AlbumActionAnchor = {
  bar: HTMLElement;
  insertAfter: HTMLElement;
};

export function currentPathname(sp: typeof Spicetify): string {
  return sp.Platform.History.location.pathname || location.pathname;
}

export function isAlbumPath(pathname: string): boolean {
  return /\/album\/[^/?#]+/.test(pathname);
}

function albumPageRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `section[data-testid="${XpuiTestId.albumPage}"]`,
  );
}

export function resolveAlbumActionAnchor(): AlbumActionAnchor | null {
  const root = albumPageRoot();
  if (!root) return null;
  const bar = root.querySelector<HTMLElement>(
    `[data-testid="${XpuiTestId.actionBarRow}"]`,
  );
  if (!bar) return null;
  const more = bar.querySelector<HTMLElement>('button[aria-haspopup="menu"]');
  if (!more || !isVisible(more)) return null;
  return { bar, insertAfter: more };
}

function isVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function readAlbumTitle(): string {
  const root = albumPageRoot();
  const h = root?.querySelector("h1")?.textContent?.trim();
  if (h) return h;
  const t = document.title;
  const i = t.indexOf(" - ");
  const head = i > 0 ? t.slice(0, i) : t;
  return head.replace(/\s*\|\s*Spotify\s*$/i, "").trim();
}
