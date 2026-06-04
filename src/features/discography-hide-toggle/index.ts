import { bindPageSync } from "@/core/page-sync";
import { subscribeHiddenAlbums } from "@/albums/store";
import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import {
  queryDiscographyReleases,
  readDiscographySectionTitle,
  type DiscographyRelease,
} from "@/ui/discography-section";
import {
  createHideAlbumToggleHost,
  paintHideAlbumToggle,
  type HideAlbumToggleHost,
} from "@/ui/hide-album-toggle";

const HOST_CLASS = "spicetify-ext-disc-hide-host";

export function initDiscographyHideToggle(sp: typeof Spicetify): () => void {
  const offStore = subscribeHiddenAlbums(() => refreshDiscographyToggleStates());
  const offSync = bindPageSync(sp, () => syncDiscographyHideToggles(sp));

  return () => {
    offStore();
    offSync();
    removeAllDiscographyToggleHosts();
  };
}

function discographyScope(): ParentNode {
  return document.querySelector("main") ?? document.body;
}

function removeAllDiscographyToggleHosts(): void {
  for (const host of document.querySelectorAll(`.${HOST_CLASS}`)) {
    host.remove();
  }
}

function syncDiscographyHideToggles(sp: typeof Spicetify): void {
  const path = routePathname();
  if (!isDiscographyPath(path)) {
    removeAllDiscographyToggleHosts();
    return;
  }
  const root = discographyScope();
  const activeIds = new Set<string>();
  for (const release of queryDiscographyReleases(root)) {
    activeIds.add(release.albumId);
    ensureReleaseToggle(sp, release);
  }
  for (const host of document.querySelectorAll(`.${HOST_CLASS}`)) {
    if (!(host instanceof HTMLDivElement)) continue;
    const id = (host as HideAlbumToggleHost).__extAlbumId;
    if (id && !activeIds.has(id)) host.remove();
  }
  refreshDiscographyToggleStates();
}

function queryBarToggleHost(bar: HTMLElement): HideAlbumToggleHost | null {
  const host = bar.querySelector(`.${HOST_CLASS}`);
  return host instanceof HTMLDivElement ? (host as HideAlbumToggleHost) : null;
}

function ensureReleaseToggle(
  sp: typeof Spicetify,
  release: DiscographyRelease,
): void {
  const { bar, insertAfter } = release.anchor;
  let host = queryBarToggleHost(bar);
  if (host && host.__extAlbumId !== release.albumId) {
    host.remove();
    host = null;
  }
  if (!host) {
    host = createHideAlbumToggleHost({
      sp,
      readTitle: () => readDiscographySectionTitle(release.root),
    });
    host.className = HOST_CLASS;
    insertAfter.insertAdjacentElement("afterend", host);
  } else if (insertAfter.nextElementSibling !== host) {
    insertAfter.insertAdjacentElement("afterend", host);
  }
  paintHideAlbumToggle(host, release.albumId);
}

function refreshDiscographyToggleStates(): void {
  if (!isDiscographyPath(routePathname())) return;
  for (const host of document.querySelectorAll(`.${HOST_CLASS}`)) {
    if (!(host instanceof HTMLDivElement)) continue;
    const albumId = (host as HideAlbumToggleHost).__extAlbumId;
    if (!albumId) continue;
    paintHideAlbumToggle(host as HideAlbumToggleHost, albumId);
  }
}
