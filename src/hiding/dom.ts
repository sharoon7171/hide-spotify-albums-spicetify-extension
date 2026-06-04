import { hiddenAlbumIdSet } from "@/albums/store";
import { XpuiDom, XpuiRoute } from "@/hiding/re";
import {
  domHideSelector,
  isSearchActive,
  routePathname,
} from "@/hiding/routes";
import { usesDomHiding } from "@/hiding/surfaces";

let domObserver: MutationObserver | null = null;
let domScheduled = false;

const HIDDEN_ATTR = "data-spicetify-ext-album-hidden";

const LIBRARY_ANCESTORS = [
  XpuiDom.legacyLeftSidebar,
  XpuiDom.legacyNavBar,
  XpuiDom.leftLibraryNav,
  XpuiDom.yourLibraryX,
  XpuiDom.yourLibraryXEntry,
  XpuiDom.libraryRoot,
  XpuiDom.libraryPage,
];

function domScope(): ParentNode {
  return document.querySelector("main") ?? document.body;
}

export function albumIdFromEncoreElement(el: Element): string | null {
  const labelled = el.getAttribute("aria-labelledby");
  if (labelled) {
    const m = labelled.match(/spotify:album:([0-9A-Za-z]+)/);
    if (m) return m[1];
  }
  const title = el.querySelector('[id*="spotify:album:"]');
  if (title?.id) {
    const m = title.id.match(/spotify:album:([0-9A-Za-z]+)/);
    if (m) return m[1];
  }
  const link = el.querySelector('a[href*="/album/"]');
  if (link) {
    const m = link.getAttribute("href")?.match(/\/album\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

export function isSearchDomContext(el: Element): boolean {
  if (el.closest(XpuiDom.searchResults)) return true;
  if (el.closest(XpuiDom.searchInputSection)) return true;
  return false;
}

export function isLibraryDomContext(el: Element, pathname: string): boolean {
  for (const sel of LIBRARY_ANCESTORS) {
    if (el.closest(sel)) return true;
  }
  if (XpuiRoute.collection.test(pathname)) return true;
  if (XpuiRoute.library.test(pathname)) return true;
  return false;
}

export function restoreAllDomHiding(): void {
  restoreDomHiding(document);
}

export function restoreDomHiding(root: ParentNode): void {
  for (const el of root.querySelectorAll(`[${HIDDEN_ATTR}="1"]`)) {
    if (!(el instanceof HTMLElement)) continue;
    el.removeAttribute(HIDDEN_ATTR);
    el.style.display = "";
  }
}

function armDomObserver(): void {
  if (domObserver) return;
  domObserver = new MutationObserver(() => {
    if (domScheduled || !usesDomHiding() || isSearchActive()) return;
    domScheduled = true;
    requestAnimationFrame(() => {
      domScheduled = false;
      if (!usesDomHiding()) return;
      applyHideAlbumDom(domScope(), routePathname(), hiddenAlbumIdSet());
    });
  });
  domObserver.observe(domScope(), { childList: true, subtree: true });
}

export function disarmDomObserver(): void {
  domObserver?.disconnect();
  domObserver = null;
  domScheduled = false;
}

export function applyHideAlbumDom(
  root: ParentNode,
  pathname: string,
  hidden: Set<string>,
): void {
  if (!usesDomHiding() || isSearchActive()) return;
  armDomObserver();
  const selector = domHideSelector();
  for (const el of root.querySelectorAll(selector)) {
    if (!(el instanceof HTMLElement)) continue;
    if (isSearchDomContext(el)) continue;
    if (isLibraryDomContext(el, pathname)) continue;
    const id = albumIdFromEncoreElement(el);
    if (!id) continue;
    if (!hidden.has(id)) {
      if (el.getAttribute(HIDDEN_ATTR) === "1") {
        el.removeAttribute(HIDDEN_ATTR);
        el.style.display = "";
      }
      continue;
    }
    if (el.getAttribute(HIDDEN_ATTR) === "1") continue;
    el.setAttribute(HIDDEN_ATTR, "1");
    el.style.display = "none";
  }
}

export function initHideAlbumDom(): () => void {
  return () => {
    disarmDomObserver();
    restoreAllDomHiding();
  };
}
