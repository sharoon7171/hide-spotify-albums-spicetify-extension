import { bindPageSync } from "@/core/page-sync";
import {
  hideAlbum,
  isAlbumHidden,
  subscribeHiddenAlbums,
  unhideAlbum,
} from "@/albums/store";
import {
  albumIdFromPathname,
  albumUrlFromAlbumId,
} from "@/albums/urls";
import type { SavedAlbum } from "@/albums/saved-album";
import {
  currentPathname,
  isAlbumPath,
  readAlbumTitle,
  resolveAlbumActionAnchor,
} from "@/ui/album-page";
import {
  hideButtonShadowCss,
  iconSvgEye,
  iconSvgEyeOff,
} from "@/features/album-hide-toggle/styles";

const HOST_ID = "spicetify-ext-album-hide-host";

export function initAlbumHideToggle(sp: typeof Spicetify): () => void {
  const offStore = subscribeHiddenAlbums(() => {
    const host = document.getElementById(HOST_ID) as HTMLDivElement | null;
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
  let host = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!host) host = buildHostShell(sp);
  host.dataset.albumId = albumId;

  const anchor = resolveAlbumActionAnchor();
  if (!anchor) {
    if (!document.documentElement.contains(host)) host.remove();
    return;
  }

  if (anchor.insertAfter.nextElementSibling !== host) {
    anchor.insertAfter.insertAdjacentElement("afterend", host);
  }
  refreshHideToggle(sp);
}

function refreshHideToggle(sp: typeof Spicetify): void {
  const pathname = currentPathname(sp);
  const albumId = albumIdFromPathname(pathname);
  const host = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!albumId || !host?.shadowRoot) return;

  const hidden = isAlbumHidden(albumId);
  const sig = `${albumId}:${hidden ? "1" : "0"}`;
  if (host.dataset.extToggleSig === sig) return;
  host.dataset.extToggleSig = sig;

  const btn = host.shadowRoot.querySelector(
    "[data-role=\"hide-list-button\"]",
  ) as HTMLButtonElement | null;
  const icon = host.shadowRoot.querySelector(
    "[data-role=\"hide-list-icon\"]",
  ) as HTMLElement | null;
  const label = host.shadowRoot.querySelector(
    "[data-role=\"hide-list-label\"]",
  ) as HTMLElement | null;
  if (!btn || !icon || !label) return;

  label.textContent = hidden ? "Unhide" : "Hide";
  icon.innerHTML = hidden ? iconSvgEye : iconSvgEyeOff;
  btn.classList.remove("ext-btn--hide", "ext-btn--unhide");
  btn.classList.add("ext-btn", hidden ? "ext-btn--unhide" : "ext-btn--hide");
  btn.setAttribute(
    "aria-label",
    hidden
      ? "Show this album on Spotify again"
      : "Hide this album in your hidden list",
  );
}

function buildHostShell(sp: typeof Spicetify): HTMLDivElement {
  const host = document.createElement("div");
  host.id = HOST_ID;

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = hideButtonShadowCss;
  shadow.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "ext-wrap";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.role = "hide-list-button";

  const icon = document.createElement("span");
  icon.className = "ext-btn__icon";
  icon.dataset.role = "hide-list-icon";

  const label = document.createElement("span");
  label.className = "ext-btn__label";
  label.dataset.role = "hide-list-label";

  btn.append(icon, label);
  wrap.appendChild(btn);
  shadow.appendChild(wrap);

  let busy = false;
  btn.addEventListener("click", async () => {
    if (busy) return;
    const pathname = currentPathname(sp);
    const albumId = albumIdFromPathname(pathname);
    if (!albumId) return;

    busy = true;
    btn.disabled = true;
    try {
      if (isAlbumHidden(albumId)) {
        await unhideAlbum(albumId);
        sp.showNotification("Album unhidden");
      } else {
        const entry: SavedAlbum = {
          savedAt: Date.now(),
          url: albumUrlFromAlbumId(albumId),
          title: readAlbumTitle(),
        };
        await hideAlbum(entry);
        sp.showNotification("Album hidden");
      }
      delete host.dataset.extToggleSig;
      refreshHideToggle(sp);
    } catch {
      sp.showNotification("Hide toggle failed", true);
    } finally {
      busy = false;
      btn.disabled = false;
    }
  });

  return host;
}
