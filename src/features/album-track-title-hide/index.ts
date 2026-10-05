import { createAlbumTrackTitleHidePatch } from "@/webpack/album-track-title-hide/patch";
import { installAlbumTrackHideStyles } from "@/webpack/album-track-title-hide/styles";
import { getWebpackRequire } from "@/webpack/require";

export function initAlbumTrackTitleHide(_sp: typeof Spicetify): () => void {
  const patch = createAlbumTrackTitleHidePatch();
  const removeStyles = installAlbumTrackHideStyles();
  let timer = 0;

  const apply = () => {
    const req = getWebpackRequire();
    if (!req) return false;
    patch.patchFactoryMap(req.m);
    return patch.patchLiveExports(req);
  };

  if (!apply()) {
    timer = window.setInterval(() => {
      if (apply()) window.clearInterval(timer);
    }, 400);
    window.setTimeout(() => window.clearInterval(timer), 20_000);
  }

  return () => {
    if (timer) window.clearInterval(timer);
    removeStyles();
  };
}
