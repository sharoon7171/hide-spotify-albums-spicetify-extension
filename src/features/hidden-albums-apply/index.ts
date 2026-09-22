import { hiddenAlbumIdSet, subscribeHiddenAlbums } from "@/albums/store";
import {
  applyHideAlbumDom,
  disarmDomObserver,
  initHideAlbumDom,
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
  hiddenIds: hiddenAlbumIdSet,
  albumUriRe: ALBUM_URI,
};

function hiddenSignature(): string {
  return [...hiddenAlbumIdSet()].sort().join("\0");
}

export function initHiddenAlbumsApply(sp: typeof Spicetify): () => void {
  let prevSig = hiddenSignature();
  const pathname = routePathname;
  const offDom = initHideAlbumDom();

  const scope = () => document.querySelector("main") ?? document.body;

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
    applySearchAlbumDomHide(hiddenAlbumIdSet());
    armSearchDomObserver(hiddenAlbumIdSet);
  };

  const applyDom = () => {
    if (isSearchActive() || !usesDomHiding()) {
      disarmDomObserver();
      restoreAllDomHiding();
      return;
    }
    applyHideAlbumDom(scope(), pathname(), hiddenAlbumIdSet());
  };

  const sync = () => {
    patchDiscographyList();
    applySearchHide();
    applyDom();
  };

  sync();

  const offStore = subscribeHiddenAlbums(() => {
    const next = hiddenSignature();
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
