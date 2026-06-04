import {
  hideAlbum,
  isAlbumHidden,
  unhideAlbum,
} from "@/albums/store";
import type { SavedAlbum } from "@/albums/saved-album";
import { albumUrlFromAlbumId } from "@/albums/urls";
import {
  hideButtonShadowCss,
  iconSvgEye,
  iconSvgEyeOff,
} from "@/features/album-hide-toggle/styles";

export type HideAlbumToggleHost = HTMLDivElement & {
  __extAlbumId?: string;
};

export type HideAlbumToggleOptions = {
  sp: typeof Spicetify;
  readTitle: (albumId: string) => string;
  onDidHide?: (albumId: string) => void;
};

export function createHideAlbumToggleHost(
  opts: HideAlbumToggleOptions,
): HideAlbumToggleHost {
  const host = document.createElement("div") as HideAlbumToggleHost;
  host.dataset.role = "hide-album-toggle-host";

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = hideButtonShadowCss;
  shadow.append(style);

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
  wrap.append(btn);
  shadow.append(wrap);

  let busy = false;
  btn.addEventListener("click", async () => {
    const albumId = host.__extAlbumId;
    if (!albumId || busy) return;
    busy = true;
    btn.disabled = true;
    try {
      if (isAlbumHidden(albumId)) {
        await unhideAlbum(albumId);
        opts.sp.showNotification("Album unhidden");
      } else {
        const entry: SavedAlbum = {
          savedAt: Date.now(),
          url: albumUrlFromAlbumId(albumId),
          title: opts.readTitle(albumId),
        };
        await hideAlbum(entry);
        opts.sp.showNotification("Album hidden");
        opts.onDidHide?.(albumId);
      }
      delete host.dataset.extToggleSig;
      paintHideAlbumToggle(host, albumId);
    } catch {
      opts.sp.showNotification("Hide toggle failed", true);
    } finally {
      busy = false;
      btn.disabled = false;
    }
  });

  return host;
}

export function paintHideAlbumToggle(
  host: HideAlbumToggleHost,
  albumId: string,
): void {
  host.__extAlbumId = albumId;
  const hidden = isAlbumHidden(albumId);
  const sig = `${albumId}:${hidden ? "1" : "0"}`;
  if (host.dataset.extToggleSig === sig) return;
  host.dataset.extToggleSig = sig;

  const btn = host.shadowRoot?.querySelector(
    '[data-role="hide-list-button"]',
  ) as HTMLButtonElement | null;
  const icon = host.shadowRoot?.querySelector(
    '[data-role="hide-list-icon"]',
  ) as HTMLElement | null;
  const label = host.shadowRoot?.querySelector(
    '[data-role="hide-list-label"]',
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
