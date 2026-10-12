import {
  excludeAlbum,
  hideAlbum,
  includeAlbum,
  isAlbumExcluded,
  isAlbumHidden,
  subscribeAlbumLists,
  unhideAlbum,
} from "@/albums/store";
import type { AlbumEntry } from "@/albums/album-entry";
import { albumIdFromHref, albumUrlFromAlbumId } from "@/albums/urls";
import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import { albumActionTones } from "@/features/album-hide-toggle/button-colors";
import {
  iconSvgBan,
  iconSvgEye,
  iconSvgEyeOff,
} from "@/features/album-hide-toggle/styles";
import { findModuleIdByExportBody, getWebpackRequire } from "@/webpack/require";

const DISCOGRAPHY_ACTION_BAR_CLASS = "dbOUwNSA_yoVuTIx2hMf";

const JSX_RUNTIME_NEEDLE = "t.Fragment=a,t.jsx=c,t.jsxs=c";
const CONTROLS_KEY = "spicetify-ext-disc-controls";
const CONTROL_PROP = "data-spicetify-ext-disc-control";

type JsxFn = (type: unknown, props: unknown, key?: unknown) => unknown;

type ReactLike = {
  createElement: (
    type: unknown,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ) => unknown;
  useRef: <T>(value: T) => { current: T };
  useSyncExternalStore: <T>(
    subscribe: (onChange: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T,
  ) => T;
  jsx?: JsxFn;
  jsxs?: JsxFn;
};

type PatchTarget = {
  jsx?: JsxFn;
  jsxs?: JsxFn;
};

const patched = new WeakSet<object>();
const JSX_CACHE_KEY = "jsx-runtime-Fragment-jsx-jsxs";

export function tryInstallDiscographyActionBarJsxPatch(
  sp: typeof Spicetify,
): (() => void) | null {
  const react = sp.React as ReactLike | undefined;
  if (
    typeof react?.createElement !== "function" ||
    typeof react.useSyncExternalStore !== "function" ||
    typeof react.useRef !== "function"
  ) {
    return null;
  }

  const req = getWebpackRequire();
  if (!req) return null;

  const jsxId = findModuleIdByExportBody(
    (source) => source.includes(JSX_RUNTIME_NEEDLE),
    JSX_CACHE_KEY,
  );
  if (!jsxId) return null;

  const mod = req(jsxId) as PatchTarget;
  if (typeof mod.jsx !== "function" || typeof mod.jsxs !== "function") {
    return null;
  }
  if (patched.has(mod as object)) return () => undefined;

  const HideButton = createListButtonComponent(sp, react, "hidden");
  const ExcludeButton = createListButtonComponent(sp, react, "excluded");
  const wrap = (original: JsxFn): JsxFn => {
    const wrapped: JsxFn = (type, props, key) => {
      const nextProps = maybeInjectControls(
        react,
        HideButton,
        ExcludeButton,
        type,
        props,
      );
      return original(type, nextProps, key);
    };
    return wrapped;
  };

  return patchJsxFns(mod, wrap);
}

function patchJsxFns(
  target: PatchTarget,
  wrap: (original: JsxFn) => JsxFn,
): () => void {
  if (patched.has(target as object)) return () => undefined;
  patched.add(target as object);
  const prevJsx = target.jsx;
  const prevJsxs = target.jsxs;
  if (typeof prevJsx === "function") target.jsx = wrap(prevJsx);
  if (typeof prevJsxs === "function") target.jsxs = wrap(prevJsxs);
  return () => {
    if (typeof prevJsx === "function") target.jsx = prevJsx;
    if (typeof prevJsxs === "function") target.jsxs = prevJsxs;
    patched.delete(target as object);
  };
}

function maybeInjectControls(
  react: ReactLike,
  HideButton: unknown,
  ExcludeButton: unknown,
  type: unknown,
  props: unknown,
): unknown {
  if (type !== "div" || !props || typeof props !== "object") return props;
  if (!isDiscographyPath(routePathname())) return props;
  const rec = props as Record<string, unknown>;
  const className = rec.className;
  if (typeof className !== "string") return props;
  if (!className.split(/\s+/).includes(DISCOGRAPHY_ACTION_BAR_CLASS)) {
    return props;
  }
  const albumId = albumIdFromActionBarChildren(rec.children);
  if (!albumId) return props;
  if (childrenHaveControl(rec.children, albumId)) return props;
  const title = titleFromActionBarChildren(rec.children) || "Untitled album";
  const hideEl = react.createElement(HideButton, {
    key: `${CONTROLS_KEY}-hide`,
    [CONTROL_PROP]: albumId,
    albumId,
    title,
  });
  const excludeEl = react.createElement(ExcludeButton, {
    key: `${CONTROLS_KEY}-exclude`,
    [CONTROL_PROP]: albumId,
    albumId,
    title,
  });
  const children = Array.isArray(rec.children)
    ? [...rec.children, hideEl, excludeEl]
    : rec.children != null
      ? [rec.children, hideEl, excludeEl]
      : [hideEl, excludeEl];
  return { ...rec, children };
}

function createListButtonComponent(
  sp: typeof Spicetify,
  react: ReactLike,
  list: "hidden" | "excluded",
) {
  return function DiscographyListButton(props: {
    albumId: string;
    title: string;
  }) {
    const { albumId, title } = props;
    const busyRef = react.useRef(false);
    const active = react.useSyncExternalStore(
      (onChange) => subscribeAlbumLists(() => onChange()),
      () =>
        list === "hidden" ? isAlbumHidden(albumId) : isAlbumExcluded(albumId),
      () =>
        list === "hidden" ? isAlbumHidden(albumId) : isAlbumExcluded(albumId),
    );

    const onClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (busyRef.current) return;
      busyRef.current = true;
      void (async () => {
        try {
          if (list === "hidden") {
            if (isAlbumHidden(albumId)) {
              await unhideAlbum(albumId);
              sp.showNotification("Album unhidden");
            } else {
              const entry: AlbumEntry = {
                updatedAt: Date.now(),
                url: albumUrlFromAlbumId(albumId),
                title,
              };
              await hideAlbum(entry);
              sp.showNotification("Album hidden");
            }
          } else if (isAlbumExcluded(albumId)) {
            await includeAlbum(albumId);
            sp.showNotification("Album included");
          } else {
            const entry: AlbumEntry = {
              updatedAt: Date.now(),
              url: albumUrlFromAlbumId(albumId),
              title,
            };
            await excludeAlbum(entry);
            sp.showNotification("Album excluded");
          }
        } catch (e) {
          const code =
            e && typeof e === "object" && "code" in e
              ? String((e as { code?: string }).code)
              : "";
          sp.showNotification(
            code === "auth-required"
              ? "Sign in to sync with Hide Albums in Spotify"
              : "Could not update album",
            true,
          );
        } finally {
          busyRef.current = false;
        }
      })();
    };

    const label =
      list === "hidden"
        ? active
          ? "Unhide"
          : "Hide"
        : active
          ? "Include"
          : "Exclude";
    const aria =
      list === "hidden"
        ? active
          ? "Unhide this album"
          : "Hide this album"
        : active
          ? "Include this album"
          : "Exclude this album";
    const iconHtml =
      list === "hidden"
        ? active
          ? iconSvgEye
          : iconSvgEyeOff
        : iconSvgBan;
    const tone =
      list === "hidden"
        ? active
          ? albumActionTones.unhide
          : albumActionTones.hide
        : active
          ? albumActionTones.include
          : albumActionTones.exclude;

    return react.createElement(
      "button",
      {
        type: "button",
        [CONTROL_PROP]: albumId,
        "aria-label": aria,
        onClick,
        style: {
          boxSizing: "border-box",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          height: "36px",
          minHeight: "36px",
          maxHeight: "36px",
          marginInlineStart: "8px",
          padding: "0 14px",
          borderRadius: "9999px",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.015em",
          lineHeight: 1,
          whiteSpace: "nowrap",
          cursor: "pointer",
          border: `1px solid ${tone.border}`,
          background: tone.background,
          color: tone.color,
          fontFamily:
            'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        },
      },
      react.createElement("span", {
        style: { display: "inline-flex", width: 16, height: 16 },
        dangerouslySetInnerHTML: { __html: iconHtml },
      }),
      react.createElement("span", null, label),
    );
  };
}

function albumIdFromActionBarChildren(children: unknown): string | null {
  let found: string | null = null;
  visitElements(children, (props) => {
    if (found) return;
    const uri = props.uri;
    if (typeof uri === "string") {
      const id = albumIdFromHref(uri);
      if (id) found = id;
    }
  });
  return found;
}

function titleFromActionBarChildren(children: unknown): string | null {
  let found: string | null = null;
  visitElements(children, (props) => {
    if (found) return;
    const label = props.label;
    if (typeof label !== "string") return;
    const m = label.match(/^More options for\s+(.+)$/i);
    if (m?.[1]) found = m[1].trim();
  });
  return found;
}

function childrenHaveControl(children: unknown, albumId: string): boolean {
  let found = false;
  visitElements(children, (props) => {
    if (props[CONTROL_PROP] === albumId) found = true;
  });
  return found;
}

function visitElements(
  node: unknown,
  visit: (props: Record<string, unknown>) => void,
): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const child of node) visitElements(child, visit);
    return;
  }
  if (typeof node !== "object") return;
  const el = node as { props?: Record<string, unknown> };
  if (!el.props || typeof el.props !== "object") return;
  visit(el.props);
  visitElements(el.props.children, visit);
  visitElements(el.props.menu, visit);
}
