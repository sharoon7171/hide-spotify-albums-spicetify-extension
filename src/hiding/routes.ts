import { isDiscographyPath } from "@/hiding/discography";
import { isSearchRoute, XpuiDom } from "@/hiding/re";

export { isDiscographyPath, isSearchRoute };

export function routePathname(): string {
  try {
    const sp = (
      globalThis as typeof globalThis & {
        Spicetify?: { Platform?: { History?: { location?: { pathname?: string } } } };
      }
    ).Spicetify;
    const fromSp = sp?.Platform?.History?.location?.pathname;
    if (fromSp) return fromSp;
    return globalThis.location?.pathname ?? "";
  } catch {
    return "";
  }
}

export function isSearchPath(pathname: string): boolean {
  return isSearchRoute(pathname);
}

function searchInputElement(): HTMLInputElement | null {
  const el = document.querySelector(XpuiDom.searchInput);
  return el instanceof HTMLInputElement ? el : null;
}

export function isSearchActive(): boolean {
  const path = routePathname();
  if (isSearchPath(path)) return true;
  if (document.querySelector(XpuiDom.searchResults)) return true;
  const input = searchInputElement();
  if (input && document.activeElement === input) return true;
  return false;
}

export function domHideSelector(): string {
  return [
    '[data-encore-id="card"]',
    '[data-encore-id="listRow"]',
    '[data-carousel-gridlist-item="true"]',
  ].join(",");
}
