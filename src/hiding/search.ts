import { albumIdFromEncoreElement } from "@/hiding/dom";
import { XpuiDom } from "@/hiding/re";

export const XpuiSearchDom = {
  categoryCard: '[data-testid^="search-category-card"]',
  encoreCard: '[data-encore-id="card"]',
  encoreListRow: '[data-encore-id="listRow"]',
  carouselItem: '[data-carousel-gridlist-item="true"]',
  gridCell: '[role="gridcell"]',
} as const;

export function searchResultsRoot(): Element | null {
  return document.querySelector(XpuiDom.searchResults);
}

export function searchAlbumCardSelector(): string {
  return [
    XpuiSearchDom.categoryCard,
    XpuiSearchDom.encoreCard,
    XpuiSearchDom.encoreListRow,
    XpuiSearchDom.carouselItem,
  ].join(",");
}

export function albumIdFromSearchElement(el: Element): string | null {
  const fromEncore = albumIdFromEncoreElement(el);
  if (fromEncore) return fromEncore;
  const card = el.closest(XpuiSearchDom.categoryCard);
  if (!card) return null;
  const inner = card.querySelector('[id*="spotify:album:"]');
  if (inner?.id) {
    const m = inner.id.match(/spotify:album:([0-9A-Za-z]+)/);
    if (m) return m[1];
  }
  const cardLink = card.querySelector('a[href*="/album/"]');
  if (cardLink) {
    const m = cardLink.getAttribute("href")?.match(/\/album\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

export function searchApplyRoot(): ParentNode | null {
  return searchResultsRoot() ?? document.querySelector("main");
}

export function searchAlbumHideTarget(el: Element): HTMLElement | null {
  const category = el.closest(XpuiSearchDom.categoryCard);
  if (category?.parentElement instanceof HTMLElement) return category.parentElement;
  const carousel = el.closest(XpuiSearchDom.carouselItem);
  if (carousel instanceof HTMLElement) return carousel;
  const gridCell = el.closest(XpuiSearchDom.gridCell);
  if (gridCell instanceof HTMLElement) return gridCell;
  if (el instanceof HTMLElement) return el;
  return null;
}
