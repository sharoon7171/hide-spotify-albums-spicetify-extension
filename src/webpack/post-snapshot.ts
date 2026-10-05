import { readHiddenAlbumIdsEarly } from "@/albums/early-ids";
import { createAlbumTrackTitleHidePatch } from "@/webpack/album-track-title-hide/patch";
import {
  cacheWebpackRequire,
  hookWebpackModulesAssignment,
  obtainWebpackRequire,
} from "@/webpack/expose";
import { createVirtualListPatch } from "@/webpack/virtual-list/patch";

(function () {
  const ALBUM_URI = /^spotify:album:([0-9A-Za-z]+)$/;
  const virtualListPatch = createVirtualListPatch({
    hiddenIds: readHiddenAlbumIdsEarly,
    albumUriRe: ALBUM_URI,
  });
  const titleHidePatch = createAlbumTrackTitleHidePatch();

  hookWebpackModulesAssignment((modules) => {
    virtualListPatch.patchFactoryMap(modules);
    titleHidePatch.patchFactoryMap(modules);
  });

  const modules = (globalThis as typeof globalThis & {
    __webpack_modules__?: Record<string, unknown>;
  }).__webpack_modules__;
  if (modules) {
    virtualListPatch.patchFactoryMap(modules);
    titleHidePatch.patchFactoryMap(modules);
  }

  const req = obtainWebpackRequire();
  if (req) {
    cacheWebpackRequire(req);
    titleHidePatch.patchLiveExports(req);
  }

  (globalThis as typeof globalThis & { __spicetifyExtPostSnapshot?: boolean })
    .__spicetifyExtPostSnapshot = true;
})();
