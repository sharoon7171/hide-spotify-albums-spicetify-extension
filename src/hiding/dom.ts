import { hiddenAlbumIdSet } from "@/albums/store";
import { XpuiDom, XpuiRoute } from "@/hiding/re";
import {
  domHideSelector,
  isSearchActive,
  routePathname,
} from "@/hiding/routes";
import { usesDomHiding } from "@/hiding/surfaces";

let domObserver: MutationObserver | null = null;
let mainWaitObserver: MutationObserver | null = null;
let domScheduled = false;
let observedRoot: ParentNode | null = null;

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

export function mainDomRoot(): HTMLElement | null {
  const main = document.querySelector("main");
  return main instanceof HTMLElement ? main : null;
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
  const selfHref =
    el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;
  if (selfHref) {
    const m = selfHref.match(/\/album\/([^/?#]+)/);
    if (m) return m[1];
  }
  const link = el.querySelector('a[href*="/album/"]');
  if (link) {
    const m = link.getAttribute("href")?.match(/\/album\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

function isSearchDomContext(el: Element): boolean {
  if (el.closest(XpuiDom.searchResults)) return true;
  if (el.closest(XpuiDom.searchInputSection)) return true;
  return false;
}

function isLibraryDomContext(el: Element, pathname: string): boolean {
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

function restoreDomHiding(root: ParentNode): void {
  for (const el of root.querySelectorAll(`[${HIDDEN_ATTR}="1"]`)) {
    if (!(el instanceof HTMLElement)) continue;
    el.removeAttribute(HIDDEN_ATTR);
    el.style.display = "";
  }
}

function disarmMainWaitObserver(): void {
  mainWaitObserver?.disconnect();
  mainWaitObserver = null;
}

function scheduleDomPass(): void {
  if (domScheduled || !usesDomHiding() || isSearchActive()) return;
  domScheduled = true;
  requestAnimationFrame(() => {
    domScheduled = false;
    if (!usesDomHiding()) return;
    applyHideAlbumDom(mainDomRoot(), routePathname(), hiddenAlbumIdSet());
  });
}

function armDomObserver(): void {
  const root = mainDomRoot();
  if (!root) {
    if (mainWaitObserver) return;
    mainWaitObserver = new MutationObserver(() => {
      if (!mainDomRoot()) return;
      disarmMainWaitObserver();
      armDomObserver();
      scheduleDomPass();
    });
    mainWaitObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    return;
  }
  disarmMainWaitObserver();
  if (domObserver && observedRoot === root) return;
  domObserver?.disconnect();
  observedRoot = root;
  domObserver = new MutationObserver(() => scheduleDomPass());
  domObserver.observe(root, { childList: true, subtree: true });
}

export function disarmDomObserver(): void {
  domObserver?.disconnect();
  domObserver = null;
  observedRoot = null;
  domScheduled = false;
  disarmMainWaitObserver();
}

export function applyHideAlbumDom(
  root: ParentNode | null,
  pathname: string,
  hidden: Set<string>,
): void {
  if (!usesDomHiding() || isSearchActive()) return;
  armDomObserver();
  const main =
    root instanceof HTMLElement && root.tagName === "MAIN"
      ? root
      : mainDomRoot();
  if (!main) return;
  const selector = domHideSelector();
  for (const el of main.querySelectorAll(selector)) {
    if (!(el instanceof HTMLElement)) continue;
    if (!el.closest("main")) continue;
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
