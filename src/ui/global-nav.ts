import { isSearchActive } from "@/hiding/routes";
import {
  HIDDEN_ALBUMS_ICON_PATHS,
  hiddenAlbumsIconViewBox,
} from "@/ui/hidden-albums-icon";

const GlobalNavClass = {
  searchContainer: "main-globalNav-searchContainer",
  navLink: "main-globalNav-navLink",
  linkIcon: "main-globalNav-link-icon",
} as const;

const GlobalNavAttr = {
  homeButton: "home-button",
} as const;

const SVG_ATTRS_FROM_HOME = [
  "class",
  "role",
  "aria-hidden",
  "aria-label",
  "focusable",
] as const;

const NAV_SLOT_ID = "spicetify-ext-hidden-albums-nav";
const NAV_BUTTON_ROLE = "hidden-albums-nav";

type HiddenAlbumsNavMount = {
  sync: () => void;
  remove: () => void;
};

function hiddenAlbumsIconPaths(): string {
  return HIDDEN_ALBUMS_ICON_PATHS;
}

function queryHomeButton(): HTMLButtonElement | null {
  const root = document.querySelector<HTMLElement>(
    `.${GlobalNavClass.searchContainer}`,
  );
  if (!root) return null;
  const byAttr = root.querySelector<HTMLButtonElement>(
    `button[${GlobalNavAttr.homeButton}]`,
  );
  if (byAttr) return byAttr;
  return root.querySelector<HTMLButtonElement>(
    `button.${GlobalNavClass.linkIcon}.${GlobalNavClass.navLink}`,
  );
}

function querySearchContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `.${GlobalNavClass.searchContainer}`,
  );
}

function queryNavIconSvg(button: HTMLElement): SVGSVGElement | null {
  const host = button.querySelector<HTMLElement>('[role="img"]');
  const svg = host?.querySelector("svg") ?? button.querySelector("svg");
  return svg instanceof SVGSVGElement ? svg : null;
}

function graftHiddenAlbumsIcon(
  targetButton: HTMLElement,
  homeButton: HTMLElement,
): boolean {
  const templateSvg = queryNavIconSvg(homeButton);
  const targetSvg = queryNavIconSvg(targetButton);
  if (!templateSvg || !targetSvg) return false;
  for (const name of SVG_ATTRS_FROM_HOME) {
    const value = templateSvg.getAttribute(name);
    if (value == null) targetSvg.removeAttribute(name);
    else targetSvg.setAttribute(name, value);
  }
  targetSvg.setAttribute("viewBox", hiddenAlbumsIconViewBox());
  targetSvg.removeAttribute("transform");
  targetSvg.removeAttribute("width");
  targetSvg.removeAttribute("height");
  targetSvg.removeAttribute("style");
  targetSvg.innerHTML = hiddenAlbumsIconPaths();
  return true;
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t !== undefined) clearTimeout(t);
    t = setTimeout(() => {
      t = undefined;
      fn();
    }, ms);
  };
}

function wireButton(
  btn: HTMLButtonElement,
  sp: typeof Spicetify,
  onClick: () => void,
): void {
  btn.setAttribute("aria-label", "Hide Albums in Spicetify");
  btn.type = "button";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  const spx = sp as typeof Spicetify & {
    Tippy?: (
      el: HTMLElement,
      opts: Record<string, unknown>,
    ) => { destroy?: () => void };
    TippyProps?: Record<string, unknown>;
  };
  if (typeof spx.Tippy === "function") {
    spx.Tippy(btn, {
      content: "Hide Albums in Spicetify",
      ...(spx.TippyProps ?? {}),
    });
  }
}

function prepareClonedHomeButton(
  clone: HTMLButtonElement,
  homeButton: HTMLButtonElement,
  sp: typeof Spicetify,
  onClick: () => void,
): boolean {
  clone.removeAttribute(GlobalNavAttr.homeButton);
  clone.removeAttribute("aria-current");
  clone.classList.remove("main-globalNav-navLinkActive");
  if (!graftHiddenAlbumsIcon(clone, homeButton)) return false;
  wireButton(clone, sp, onClick);
  return true;
}

export function mountHiddenAlbumsNavButton(
  sp: typeof Spicetify,
  onClick: () => void,
): HiddenAlbumsNavMount {
  let slot: HTMLButtonElement | null = null;
  let observer: MutationObserver | null = null;
  let missCount = 0;

  const remove = () => {
    observer?.disconnect();
    observer = null;
    slot?.remove();
    slot = null;
    missCount = 0;
  };

  const sync = () => {
    if (isSearchActive()) return;
    const homeButton = queryHomeButton();
    const searchContainer = querySearchContainer();
    if (!homeButton || !queryNavIconSvg(homeButton) || !searchContainer) {
      missCount += 1;
      if (missCount > 12) remove();
      return;
    }
    missCount = 0;
    if (!slot || !document.contains(slot)) {
      remove();
      const clone = homeButton.cloneNode(true) as HTMLButtonElement;
      clone.id = NAV_SLOT_ID;
      clone.dataset.role = NAV_BUTTON_ROLE;
      if (!prepareClonedHomeButton(clone, homeButton, sp, onClick)) return;
      slot = clone;
      searchContainer.insertBefore(slot, homeButton);
      return;
    }
    if (
      slot.parentElement !== searchContainer ||
      slot.nextElementSibling !== homeButton
    ) {
      searchContainer.insertBefore(slot, homeButton);
    }
    if (slot.dataset.extIconReady === "1" && queryNavIconSvg(slot)) return;
    if (graftHiddenAlbumsIcon(slot, homeButton)) slot.dataset.extIconReady = "1";
  };

  const scheduleSync = debounce(() => {
    if (isSearchActive()) return;
    sync();
  }, 120);
  const watchRoot = querySearchContainer();
  if (watchRoot) {
    observer = new MutationObserver(() => scheduleSync());
    observer.observe(watchRoot, { childList: true, subtree: false });
  }
  sync();
  return { sync, remove };
}
