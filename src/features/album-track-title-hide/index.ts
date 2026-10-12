import { bindPageSync } from "@/core/page-sync";
import { retryUntil } from "@/core/retry";
import { isDiscographyPath } from "@/hiding/discography";
import { currentPathname, isAlbumPath } from "@/ui/album-page";
import { createAlbumTrackTitleHidePatch } from "@/webpack/album-track-title-hide/patch";
import { installAlbumTrackHideStyles } from "@/webpack/album-track-title-hide/styles";
import { getWebpackRequire } from "@/webpack/require";

export function initAlbumTrackTitleHide(sp: typeof Spicetify): () => void {
  const patch = createAlbumTrackTitleHidePatch();
  const removeStyles = installAlbumTrackHideStyles();

  const apply = (): boolean => {
    const req = getWebpackRequire();
    if (!req) return false;
    patch.patchFactoryMap(req.m);
    return patch.patchLiveExports(req);
  };

  apply();
  const stopRetry = retryUntil(apply, { intervalMs: 400, maxMs: 120_000 });
  const keepAlive = window.setInterval(() => {
    apply();
  }, 5000);

  const offSync = bindPageSync(sp, () => {
    const path = currentPathname(sp);
    if (!isAlbumPath(path) && !isDiscographyPath(path)) return;
    apply();
  });

  return () => {
    stopRetry();
    window.clearInterval(keepAlive);
    offSync();
    removeStyles();
  };
}
