import { isSearchRoute, XpuiRoute } from "@/hiding/re";

export function isDiscographyPath(pathname: string): boolean {
  if (isSearchRoute(pathname)) return false;
  return XpuiRoute.discography.test(pathname);
}
