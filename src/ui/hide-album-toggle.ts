import {
  excludeAlbum,
  hideAlbum,
  includeAlbum,
  isAlbumExcluded,
  isAlbumHidden,
  unhideAlbum,
} from "@/albums/store";
import type { AlbumEntry } from "@/albums/album-entry";
import { albumUrlFromAlbumId } from "@/albums/urls";
import {
  hideButtonShadowCss,
  iconSvgBan,
  iconSvgEye,
  iconSvgEyeOff,
} from "@/features/album-hide-toggle/styles";

export type HideAlbumToggleHost = HTMLDivElement & {
  __extAlbumId?: string;
};

type HideAlbumToggleOptions = {
  sp: typeof Spicetify;
  readTitle: (albumId: string) => string;
  onDidHide?: (albumId: string) => void;
};

function buildButton(role: "hidden" | "excluded"): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.role = `${role}-button`;
  const icon = document.createElement("span");
  icon.className = "ext-btn__icon";
  icon.dataset.role = `${role}-icon`;
  const label = document.createElement("span");
  label.className = "ext-btn__label";
  label.dataset.role = `${role}-label`;
  btn.append(icon, label);
  return btn;
}

function paintButton(
  btn: HTMLButtonElement,
  icon: HTMLElement,
  label: HTMLElement,
  role: "hidden" | "excluded",
  active: boolean,
): void {
  btn.classList.remove(
    "ext-btn--hide",
    "ext-btn--unhide",
    "ext-btn--exclude",
    "ext-btn--include",
  );
  if (role === "hidden") {
    label.textContent = active ? "Unhide" : "Hide";
    icon.innerHTML = active ? iconSvgEye : iconSvgEyeOff;
    btn.setAttribute(
      "aria-label",
      active ? "Unhide this album" : "Hide this album",
    );
    btn.classList.add("ext-btn", active ? "ext-btn--unhide" : "ext-btn--hide");
    return;
  }
  label.textContent = active ? "Include" : "Exclude";
  icon.innerHTML = iconSvgBan;
  btn.setAttribute(
    "aria-label",
    active ? "Include this album" : "Exclude this album",
  );
  btn.classList.add(
    "ext-btn",
    active ? "ext-btn--include" : "ext-btn--exclude",
  );
}

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
  const hideBtn = buildButton("hidden");
  const excludeBtn = buildButton("excluded");
  wrap.append(hideBtn, excludeBtn);
  shadow.append(wrap);

  let busy = false;

  const run = async (
    kind: "hidden" | "excluded",
  ): Promise<void> => {
    const albumId = host.__extAlbumId;
    if (!albumId || busy) return;
    busy = true;
    hideBtn.disabled = true;
    excludeBtn.disabled = true;
    try {
      if (kind === "hidden") {
        if (isAlbumHidden(albumId)) {
          const done = unhideAlbum(albumId);
          delete host.dataset.extToggleSig;
          paintHideAlbumToggle(host, albumId);
          await done;
          opts.sp.showNotification("Album unhidden");
        } else {
          const entry: AlbumEntry = {
            updatedAt: Date.now(),
            url: albumUrlFromAlbumId(albumId),
            title: opts.readTitle(albumId),
          };
          const done = hideAlbum(entry);
          delete host.dataset.extToggleSig;
          paintHideAlbumToggle(host, albumId);
          await done;
          opts.sp.showNotification("Album hidden");
          opts.onDidHide?.(albumId);
        }
      } else if (isAlbumExcluded(albumId)) {
        const done = includeAlbum(albumId);
        delete host.dataset.extToggleSig;
        paintHideAlbumToggle(host, albumId);
        await done;
        opts.sp.showNotification("Album included");
      } else {
        const entry: AlbumEntry = {
          updatedAt: Date.now(),
          url: albumUrlFromAlbumId(albumId),
          title: opts.readTitle(albumId),
        };
        const done = excludeAlbum(entry);
        delete host.dataset.extToggleSig;
        paintHideAlbumToggle(host, albumId);
        await done;
        opts.sp.showNotification("Album excluded");
        opts.onDidHide?.(albumId);
      }
    } catch (e) {
      delete host.dataset.extToggleSig;
      paintHideAlbumToggle(host, albumId);
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      opts.sp.showNotification(
        code === "auth-required"
          ? "Sign in to sync with Hide Albums in Spotify"
          : "Could not update album",
        true,
      );
    } finally {
      busy = false;
      hideBtn.disabled = false;
      excludeBtn.disabled = false;
    }
  };

  hideBtn.addEventListener("click", () => void run("hidden"));
  excludeBtn.addEventListener("click", () => void run("excluded"));

  return host;
}

export function paintHideAlbumToggle(
  host: HideAlbumToggleHost,
  albumId: string,
): void {
  host.__extAlbumId = albumId;
  const hidden = isAlbumHidden(albumId);
  const excluded = isAlbumExcluded(albumId);
  const sig = `${albumId}:${hidden ? "1" : "0"}:${excluded ? "1" : "0"}`;
  if (host.dataset.extToggleSig === sig) return;
  host.dataset.extToggleSig = sig;

  for (const role of ["hidden", "excluded"] as const) {
    const btn = host.shadowRoot?.querySelector(
      `[data-role="${role}-button"]`,
    ) as HTMLButtonElement | null;
    const icon = host.shadowRoot?.querySelector(
      `[data-role="${role}-icon"]`,
    ) as HTMLElement | null;
    const label = host.shadowRoot?.querySelector(
      `[data-role="${role}-label"]`,
    ) as HTMLElement | null;
    if (!btn || !icon || !label) continue;
    paintButton(
      btn,
      icon,
      label,
      role,
      role === "hidden" ? hidden : excluded,
    );
  }
}
