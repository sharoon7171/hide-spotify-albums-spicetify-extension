import {
  albumIdFromSearchElement,
  searchAlbumCardSelector,
  searchAlbumHideTarget,
  searchApplyRoot,
  searchResultsRoot,
} from "@/hiding/search";
import { isSearchActive } from "@/hiding/routes";

const HIDDEN_ATTR = "data-spicetify-ext-search-album-hidden";

export function restoreSearchDomHiding(): void {
  const root = searchApplyRoot();
  if (!root) return;
  for (const el of root.querySelectorAll(`[${HIDDEN_ATTR}="1"]`)) {
    if (!(el instanceof HTMLElement)) continue;
    el.removeAttribute(HIDDEN_ATTR);
    el.style.display = "";
  }
}

export function applySearchAlbumDomHide(hidden: Set<string>): void {
  if (!isSearchActive()) return;
  const root = searchApplyRoot();
  if (!root) return;
  const inResults = searchResultsRoot();
  const selector = searchAlbumCardSelector();
  for (const el of root.querySelectorAll(selector)) {
    if (inResults && !inResults.contains(el)) continue;
    const target = searchAlbumHideTarget(el);
    if (!target) continue;
    const id = albumIdFromSearchElement(el);
    if (!id) continue;
    if (!hidden.has(id)) {
      if (target.getAttribute(HIDDEN_ATTR) === "1") {
        target.removeAttribute(HIDDEN_ATTR);
        target.style.display = "";
      }
      continue;
    }
    if (target.getAttribute(HIDDEN_ATTR) === "1") continue;
    target.setAttribute(HIDDEN_ATTR, "1");
    target.style.display = "none";
  }
}

let searchObserver: MutationObserver | null = null;
let searchScheduled = false;

export function disarmSearchDomObserver(): void {
  searchObserver?.disconnect();
  searchObserver = null;
  searchScheduled = false;
}

export function armSearchDomObserver(hidden: () => Set<string>): void {
  disarmSearchDomObserver();
  const root = document.querySelector("main");
  if (!root) return;
  searchObserver = new MutationObserver(() => {
    if (searchScheduled || !isSearchActive()) return;
    searchScheduled = true;
    requestAnimationFrame(() => {
      searchScheduled = false;
      if (!isSearchActive()) return;
      applySearchAlbumDomHide(hidden());
    });
  });
  searchObserver.observe(root, { childList: true, subtree: true });
}
