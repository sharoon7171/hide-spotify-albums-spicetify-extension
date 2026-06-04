import { albumIdFromHref } from "@/albums/urls";
import { albumIdFromEncoreElement } from "@/hiding/dom";
import { XpuiAria } from "@/ui/album-page";

export type DiscographyRelease = {
  root: HTMLElement;
  albumId: string;
  anchor: { bar: HTMLElement; insertAfter: HTMLElement };
};

export function queryDiscographyReleases(scope: ParentNode): DiscographyRelease[] {
  const seen = new Set<string>();
  const out: DiscographyRelease[] = [];
  for (const more of collectAlbumHeaderMoreButtons(scope)) {
    const bar = more.parentElement;
    if (!bar) continue;
    const ctx = albumContextFromMore(more, scope);
    if (!ctx || seen.has(ctx.albumId)) continue;
    seen.add(ctx.albumId);
    out.push({
      root: ctx.root,
      albumId: ctx.albumId,
      anchor: { bar, insertAfter: more },
    });
  }
  return out;
}

export function readDiscographySectionTitle(root: HTMLElement): string {
  const link = root.querySelector<HTMLAnchorElement>('a[href*="/album/"]');
  const fromLink = link?.textContent?.trim();
  if (fromLink) return fromLink;
  const heading = root.querySelector("h2, h3, h4");
  const fromHeading = heading?.textContent?.trim();
  if (fromHeading) return fromHeading;
  const more = collectAlbumHeaderMoreButtons(root)[0];
  const label = more?.getAttribute("aria-label") ?? "";
  if (label.startsWith(XpuiAria.moreOptionsPrefix)) {
    const stripped = label.replace(/^More options for\s+/i, "").trim();
    if (stripped) return stripped;
  }
  return "Untitled album";
}

function collectAlbumHeaderMoreButtons(scope: ParentNode): HTMLElement[] {
  const out: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();
  scope.querySelectorAll<HTMLElement>("button[aria-label]").forEach((btn) => {
    const label = btn.getAttribute("aria-label") ?? "";
    if (!label.startsWith(XpuiAria.moreOptionsPrefix)) return;
    if (isTrackRowMoreLabel(label)) return;
    const bar = btn.parentElement;
    if (!bar || !barContainsHeaderPlay(bar)) return;
    if (seen.has(btn)) return;
    seen.add(btn);
    out.push(btn);
  });
  return out;
}

function isTrackRowMoreLabel(label: string): boolean {
  const rest = label.slice(XpuiAria.moreOptionsPrefix.length).trim();
  return /\sby\s/i.test(rest) && !/\(feat\./i.test(rest);
}

function barContainsHeaderPlay(bar: ParentNode): boolean {
  for (const btn of bar.querySelectorAll<HTMLButtonElement>("button")) {
    const label = btn.getAttribute("aria-label") ?? "";
    if (label === "Play" || label === "Pause") return true;
  }
  return false;
}

function albumContextFromMore(
  more: HTMLElement,
  scope: ParentNode,
): { root: HTMLElement; albumId: string } | null {
  const bar = more.parentElement;
  if (!bar || !scope.contains(bar) || !barContainsHeaderPlay(bar)) return null;

  let link: HTMLAnchorElement | null = null;
  let linkHost: HTMLElement | null = null;
  let cur: HTMLElement | null = bar;
  while (cur && scope.contains(cur)) {
    link = cur.querySelector<HTMLAnchorElement>('a[href*="/album/"]');
    if (link) {
      linkHost = cur;
      break;
    }
    cur = cur.parentElement;
  }
  if (!link || !linkHost) {
    const id = albumIdFromEncoreElement(bar) ?? albumIdFromEncoreElement(bar.parentElement ?? bar);
    if (!id) return null;
    return { root: bar, albumId: id };
  }
  const href = link.getAttribute("href");
  const albumId = href ? albumIdFromHref(href) : null;
  if (!albumId) return null;
  const root = smallestAlbumRoot(linkHost, scope) ?? linkHost;
  return { root, albumId };
}

function smallestAlbumRoot(start: HTMLElement, scope: ParentNode): HTMLElement | null {
  let best: HTMLElement | null = null;
  let cur: HTMLElement | null = start;
  while (cur && scope.contains(cur)) {
    const ids = albumIdsIn(cur);
    if (ids.size === 1) best = cur;
    if (ids.size > 1) break;
    cur = cur.parentElement;
  }
  return best;
}

function albumIdsIn(el: HTMLElement): Set<string> {
  const ids = new Set<string>();
  for (const a of el.querySelectorAll<HTMLAnchorElement>('a[href*="/album/"]')) {
    const href = a.getAttribute("href");
    if (!href) continue;
    const id = albumIdFromHref(href);
    if (id) ids.add(id);
  }
  const fromEncore = albumIdFromEncoreElement(el);
  if (fromEncore) ids.add(fromEncore);
  return ids;
}
