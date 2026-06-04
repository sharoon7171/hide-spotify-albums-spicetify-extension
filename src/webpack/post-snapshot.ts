import { readHiddenAlbumIdsEarly } from "@/albums/store";
import { createVirtualListPatch } from "@/webpack/virtual-list/patch";
import {
  cacheWebpackRequire,
  hookWebpackModulesAssignment,
  obtainWebpackRequire,
} from "@/webpack/expose";

(function () {
  const ALBUM_URI = /^spotify:album:([0-9A-Za-z]+)$/;
  const virtualListPatch = createVirtualListPatch({
    hiddenIds: readHiddenAlbumIdsEarly,
    albumUriRe: ALBUM_URI,
  });

  hookWebpackModulesAssignment((modules) => {
    virtualListPatch.patchFactoryMap(modules);
  });

  const modules = (globalThis as typeof globalThis & {
    __webpack_modules__?: Record<string, unknown>;
  }).__webpack_modules__;
  if (modules) virtualListPatch.patchFactoryMap(modules);

  const req = obtainWebpackRequire();
  if (req) cacheWebpackRequire(req);

  (globalThis as typeof globalThis & { __spicetifyExtPostSnapshot?: boolean })
    .__spicetifyExtPostSnapshot = true;
})();
