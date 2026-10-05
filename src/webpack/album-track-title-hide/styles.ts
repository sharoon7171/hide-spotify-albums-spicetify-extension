import { isAlbumPath } from "@/ui/album-page";

const STYLE_ATTR = "data-spicetify-ext-album-track-hide";
const PAGE_CLASS = "spicetify-ext-album-page";
const TITLE_WRAP = "spicetify-ext-album-track-title";
const BAN_BTN = "BTM879cHESDCr5BwUts1";

const HIDE_COLOR = "#e91429";
const SHOW_COLOR = "#1ed760";
const HIT = 36;
const ICON = 24;

const CSS = `
.${PAGE_CLASS} .${TITLE_WRAP} {
  grid-area: title;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}
.${PAGE_CLASS} .${TITLE_WRAP} .main-trackList-rowTitle {
  grid-area: auto;
  min-width: 0;
  flex: 0 1 auto;
  max-width: calc(100% - ${HIT + 8}px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${PAGE_CLASS} .${TITLE_WRAP} .${BAN_BTN} {
  opacity: 1;
  flex: 0 0 auto;
  align-self: center;
  width: ${HIT}px;
  height: ${HIT}px;
  min-width: ${HIT}px;
  min-height: ${HIT}px;
  margin: 0;
  padding: 0;
}
.${PAGE_CLASS} .${TITLE_WRAP} .${BAN_BTN}:not([aria-checked="true"]) {
  color: ${HIDE_COLOR};
}
.${PAGE_CLASS} .${TITLE_WRAP} .${BAN_BTN}[aria-checked="true"] {
  color: ${SHOW_COLOR};
}
.${PAGE_CLASS} .${TITLE_WRAP} .${BAN_BTN} svg {
  width: ${ICON}px;
  height: ${ICON}px;
  opacity: 1;
}
`;

function currentPath(): string {
  return (
    globalThis.Spicetify?.Platform?.History?.location?.pathname ||
    globalThis.location?.pathname ||
    ""
  );
}

export function installAlbumTrackHideStyles(): () => void {
  let style = document.head.querySelector(
    `style[${STYLE_ATTR}]`,
  ) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.setAttribute(STYLE_ATTR, "");
    document.head.appendChild(style);
  }
  style.textContent = CSS;

  const sync = () => {
    document.documentElement.classList.toggle(
      PAGE_CLASS,
      isAlbumPath(currentPath()),
    );
  };
  sync();

  const history = globalThis.Spicetify?.Platform?.History;
  const unlisten =
    history && typeof history.listen === "function"
      ? history.listen(() => sync())
      : null;

  return () => {
    unlisten?.();
    document.documentElement.classList.remove(PAGE_CLASS);
    document.head.querySelector(`style[${STYLE_ATTR}]`)?.remove();
  };
}
