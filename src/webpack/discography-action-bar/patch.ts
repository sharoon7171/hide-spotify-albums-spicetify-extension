import {
  hideAlbum,
  isAlbumHidden,
  subscribeHiddenAlbums,
  unhideAlbum,
} from "@/albums/store";
import type { SavedAlbum } from "@/albums/saved-album";
import { albumIdFromHref, albumUrlFromAlbumId } from "@/albums/urls";
import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import {
  iconSvgEye,
  iconSvgEyeOff,
} from "@/features/album-hide-toggle/styles";
import { findModuleIdByExportBody, getWebpackRequire } from "@/webpack/require";

export const DISCOGRAPHY_ACTION_BAR_CLASS = "dbOUwNSA_yoVuTIx2hMf";

const JSX_RUNTIME_NEEDLE = "t.Fragment=a,t.jsx=c,t.jsxs=c";
const HIDE_KEY = "spicetify-ext-disc-hide";
const HIDE_PROP = "data-spicetify-ext-disc-hide";

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

export function installDiscographyActionBarJsxPatch(
  sp: typeof Spicetify,
): () => void {
  const req = getWebpackRequire();
  const webpackReact = (() => {
    if (!req) return null;
    try {
      return req("10006") as ReactLike;
    } catch {
      return null;
    }
  })();
  const spicetifyReact = (sp as typeof Spicetify & { React?: ReactLike }).React;
  const react = webpackReact ?? spicetifyReact;
  if (
    !react?.createElement ||
    !react.useSyncExternalStore ||
    !react.useRef
  ) {
    return () => undefined;
  }

  const HideButton = createHideButtonComponent(sp, react);
  const restorers: Array<() => void> = [];

  const wrap = (original: JsxFn): JsxFn => {
    const wrapped: JsxFn = (type, props, key) => {
      const nextProps = maybeInjectHide(react, HideButton, type, props);
      return original(type, nextProps, key);
    };
    return wrapped;
  };

  if (req) {
    const jsxId =
      findModuleIdByExportBody((source) => source.includes(JSX_RUNTIME_NEEDLE)) ??
      "22726";
    try {
      const mod = req(jsxId) as PatchTarget;
      restorers.push(patchJsxFns(mod, wrap));
    } catch {}
    restorers.push(patchJsxFns(react as PatchTarget, wrap));
  } else {
    restorers.push(patchJsxFns(react as PatchTarget, wrap));
  }

  return () => {
    for (const restore of restorers) restore();
  };
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

function maybeInjectHide(
  react: ReactLike,
  HideButton: unknown,
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
  if (childrenHaveHide(rec.children, albumId)) return props;
  const title = titleFromActionBarChildren(rec.children) || "Untitled album";
  const hideEl = react.createElement(HideButton, {
    key: HIDE_KEY,
    [HIDE_PROP]: albumId,
    albumId,
    title,
  });
  const children = Array.isArray(rec.children)
    ? [...rec.children, hideEl]
    : rec.children != null
      ? [rec.children, hideEl]
      : [hideEl];
  return { ...rec, children };
}

function createHideButtonComponent(sp: typeof Spicetify, react: ReactLike) {
  return function DiscographyHideButton(props: {
    albumId: string;
    title: string;
  }) {
    const { albumId, title } = props;
    const busyRef = react.useRef(false);
    const hidden = react.useSyncExternalStore(
      (onChange) => subscribeHiddenAlbums(() => onChange()),
      () => isAlbumHidden(albumId),
      () => isAlbumHidden(albumId),
    );

    const onClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (busyRef.current) return;
      busyRef.current = true;
      void (async () => {
        try {
          if (isAlbumHidden(albumId)) {
            await unhideAlbum(albumId);
            sp.showNotification("Album unhidden");
          } else {
            const entry: SavedAlbum = {
              updatedAt: Date.now(),
              url: albumUrlFromAlbumId(albumId),
              title,
            };
            await hideAlbum(entry);
            sp.showNotification("Album hidden");
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

    return react.createElement(
      "button",
      {
        type: "button",
        [HIDE_PROP]: albumId,
        "aria-label": hidden ? "Unhide this album" : "Hide this album",
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
          padding: "0 14px",
          borderRadius: "9999px",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.015em",
          lineHeight: 1,
          whiteSpace: "nowrap",
          cursor: "pointer",
          border: "1px solid hsla(0, 0%, 100%, 0.22)",
          background: hidden
            ? "hsla(142, 71%, 45%, 0.22)"
            : "hsla(0, 0%, 100%, 0.1)",
          color: hidden ? "#86efac" : "#fff",
          fontFamily:
            'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        },
      },
      react.createElement("span", {
        style: { display: "inline-flex", width: 16, height: 16 },
        dangerouslySetInnerHTML: {
          __html: hidden ? iconSvgEye : iconSvgEyeOff,
        },
      }),
      react.createElement("span", null, hidden ? "Unhide" : "Hide"),
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

function childrenHaveHide(children: unknown, albumId: string): boolean {
  let found = false;
  visitElements(children, (props) => {
    if (props[HIDE_PROP] === albumId) found = true;
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
