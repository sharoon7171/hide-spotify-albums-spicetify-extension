export const XpuiRoute = {
  search: /^\/search(?:\/|$)/i,
  discography: /\/discography(?:\/|$)/,
  collection: /^\/collection/,
  library: /^\/library(?:\/|$)/,
} as const;

export function isSearchRoute(pathname: string): boolean {
  return XpuiRoute.search.test(pathname.trim());
}

export const XpuiDom = {
  searchResults: '[data-testid="search-results"]',
  searchInput:
    'input[data-testid="search-input"], input[type="search"]',
  searchInputSection: ".main-globalNav-searchInputSection",
  leftLibraryNav: "nav.main-navBar-mainNav",
  yourLibraryX: ".main-yourLibraryX-library",
  yourLibraryXEntry: ".main-yourLibraryX-entryPoints",
  legacyLeftSidebar: "#Desktop_LeftSidebar_Id",
  legacyNavBar: ".Root__nav-bar",
  libraryRoot: '[data-testid="library-root"]',
  libraryPage: '[data-testid="library-page"]',
} as const;
