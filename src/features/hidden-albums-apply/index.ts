import { filteredAlbumIdSet, subscribeAlbumLists } from "@/albums/store";
import {
  applyHideAlbumDom,
  disarmDomObserver,
  initHideAlbumDom,
  mainDomRoot,
  restoreAllDomHiding,
} from "@/hiding/dom";
import { isSearchActive, routePathname } from "@/hiding/routes";
import {
  applySearchAlbumDomHide,
  armSearchDomObserver,
  disarmSearchDomObserver,
  restoreSearchDomHiding,
} from "@/hiding/search-dom";
import {
  usesDiscographyVirtualList,
  usesDomHiding,
} from "@/hiding/surfaces";
import { getWebpackRequire } from "@/webpack/require";
import { applyVirtualListAlbumPatch } from "@/webpack/virtual-list/reload";

const ALBUM_URI = /^spotify:album:([0-9A-Za-z]+)$/;

const patchCtx = {
  hiddenIds: filteredAlbumIdSet,
  albumUriRe: ALBUM_URI,
};

function filteredSignature(): string {
  return [...filteredAlbumIdSet()].sort().join("\0");
}

export function initHiddenAlbumsApply(sp: typeof Spicetify): () => void {
  let prevSig = filteredSignature();
  const pathname = routePathname;
  const offDom = initHideAlbumDom();

  const patchDiscographyList = () => {
    if (!usesDiscographyVirtualList()) return;
    const req = getWebpackRequire();
    if (!req) return;
    applyVirtualListAlbumPatch(req, patchCtx);
  };

  const bumpDiscographyRender = () => {
    if (!usesDiscographyVirtualList()) return;
    const history = sp.Platform?.History;
    const loc = history?.location;
    if (!history?.replace || !loc) return;
    const prev = loc.state;
    const state =
      prev && typeof prev === "object"
        ? { ...prev, __haVl: Date.now() }
        : { __haVl: Date.now() };
    history.replace({
      pathname: loc.pathname,
      search: loc.search ?? "",
      hash: loc.hash ?? "",
      state,
    });
  };

  const applySearchHide = () => {
    restoreSearchDomHiding();
    if (!isSearchActive()) {
      disarmSearchDomObserver();
      return;
    }
    applySearchAlbumDomHide(filteredAlbumIdSet());
    armSearchDomObserver(filteredAlbumIdSet);
  };

  const applyDom = () => {
    if (isSearchActive() || !usesDomHiding()) {
      disarmDomObserver();
      restoreAllDomHiding();
      return;
    }
    applyHideAlbumDom(mainDomRoot(), pathname(), filteredAlbumIdSet());
  };

  const sync = () => {
    patchDiscographyList();
    applySearchHide();
    applyDom();
  };

  sync();

  const offStore = subscribeAlbumLists(() => {
    const next = filteredSignature();
    if (next === prevSig) return;
    prevSig = next;
    sync();
    bumpDiscographyRender();
  });

  const offNav = sp.Platform.History.listen(sync);

  return () => {
    offStore();
    offNav();
    offDom();
    disarmSearchDomObserver();
    restoreSearchDomHiding();
    restoreAllDomHiding();
  };
}
