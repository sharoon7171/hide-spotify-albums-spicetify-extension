import { isDiscographyPath } from "@/hiding/discography";
import { isSearchActive, routePathname } from "@/hiding/routes";

export function usesDiscographyVirtualList(): boolean {
  return isDiscographyPath(routePathname());
}

export function usesDomHiding(): boolean {
  return !usesDiscographyVirtualList() && !isSearchActive();
}
