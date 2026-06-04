import { bindPageSync } from "@/core/page-sync";
import { subscribeHiddenAlbums } from "@/albums/store";
import { albumIdFromPathname } from "@/albums/urls";
import {
  currentPathname,
  isAlbumPath,
  readAlbumTitle,
  resolveAlbumActionAnchor,
} from "@/ui/album-page";
import {
  createHideAlbumToggleHost,
  paintHideAlbumToggle,
  type HideAlbumToggleHost,
} from "@/ui/hide-album-toggle";

const HOST_ID = "spicetify-ext-album-hide-host";

export function initAlbumHideToggle(sp: typeof Spicetify): () => void {
  const offStore = subscribeHiddenAlbums(() => {
    const host = document.getElementById(HOST_ID) as HideAlbumToggleHost | null;
    if (host) delete host.dataset.extToggleSig;
    refreshHideToggle(sp);
  });

  const offSync = bindPageSync(sp, () => syncAlbumHideUi(sp));

  return () => {
    offStore();
    offSync();
    document.getElementById(HOST_ID)?.remove();
  };
}

function syncAlbumHideUi(sp: typeof Spicetify): void {
  const pathname = currentPathname(sp);
  if (!isAlbumPath(pathname)) {
    document.getElementById(HOST_ID)?.remove();
    return;
  }
  const albumId = albumIdFromPathname(pathname);
  if (!albumId) {
    document.getElementById(HOST_ID)?.remove();
    return;
  }
  ensureHideToggle(sp, albumId);
}

function ensureHideToggle(sp: typeof Spicetify, albumId: string): void {
  let host = document.getElementById(HOST_ID) as HideAlbumToggleHost | null;
  if (!host) {
    host = createHideAlbumToggleHost({
      sp,
      readTitle: () => readAlbumTitle(),
    });
    host.id = HOST_ID;
  }

  const anchor = resolveAlbumActionAnchor();
  if (!anchor) {
    if (!document.documentElement.contains(host)) host.remove();
    return;
  }

  if (anchor.insertAfter.nextElementSibling !== host) {
    anchor.insertAfter.insertAdjacentElement("afterend", host);
  }
  paintHideAlbumToggle(host, albumId);
}

function refreshHideToggle(sp: typeof Spicetify): void {
  const pathname = currentPathname(sp);
  const albumId = albumIdFromPathname(pathname);
  const host = document.getElementById(HOST_ID) as HideAlbumToggleHost | null;
  if (!albumId || !host) return;
  paintHideAlbumToggle(host, albumId);
}
