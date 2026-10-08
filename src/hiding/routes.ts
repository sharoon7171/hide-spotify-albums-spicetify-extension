import { isSearchRoute } from "@/hiding/re";

export function routePathname(): string {
  const sp = (
    globalThis as typeof globalThis & {
      Spicetify?: { Platform?: { History?: { location?: { pathname?: string } } } };
    }
  ).Spicetify;
  const fromSp = sp?.Platform?.History?.location?.pathname;
  if (fromSp) return fromSp;
  return globalThis.location?.pathname ?? "";
}

export function isSearchActive(): boolean {
  return isSearchRoute(routePathname());
}

export function domHideSelector(): string {
  return [
    '[data-encore-id="card"]',
    '[data-encore-id="listRow"]',
    '[data-carousel-gridlist-item="true"]',
  ].join(",");
}
