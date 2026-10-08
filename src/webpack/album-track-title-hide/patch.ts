import type { WebpackRequire } from "@/webpack/require";

const ALBUM_ROW_NEEDLES = [
  "hasAssociatedVideo",
  "i(68167)",
  "TITLE_AND_ARTIST",
] as const;

const TITLE_WRAP_CLASS = "spicetify-ext-album-track-title";

const DURATION_BANNED_RE =
  /en&&ea&&\(0,n\.jsx\)\(u\.A,\{itemUri:e,contextUri:q,contextName:H\?\?[a-z]\.Ru\.get\("album"\),isBanned:en\}\),/;

const TITLE_NODE =
  'eg&&W?(0,n.jsx)(o.N,{to:e,className:B.A.rowTitle,"data-testid":"internal-track-link",children:(0,n.jsx)(R.p,{titleText:t,children:t})}):(0,n.jsx)(R.p,{titleText:t,children:t})';

const scannedFactories = new WeakSet<object>();

type WebpackFactory = (
  module: unknown,
  exports: Record<string, unknown>,
  require: unknown,
) => void;

type TaggedFactory = WebpackFactory & {
  __spicetifyExtAlbumTitleHide?: boolean;
};

type MemoExport = {
  $$typeof?: symbol;
  type: ((...args: never[]) => unknown) & {
    __spicetifyExtAlbumTitleHide?: boolean;
  };
  compare?: unknown;
};

function banBesideTitle(ruVar: string): string {
  return `ea?(0,n.jsx)(u.A,{itemUri:e,contextUri:q,contextName:H??${ruVar}.Ru.get("album"),isBanned:en}):null`;
}

function titleWrap(ban: string): string {
  return `(0,n.jsxs)("div",{className:"${TITLE_WRAP_CLASS}",children:[${TITLE_NODE},${ban}]})`;
}

function isAlbumRowFactory(factory: unknown): factory is WebpackFactory {
  if (typeof factory !== "function") return false;
  if ((factory as TaggedFactory).__spicetifyExtAlbumTitleHide) return true;
  if (scannedFactories.has(factory)) return false;
  const match = ALBUM_ROW_NEEDLES.every((n) =>
    factory.toString().includes(n),
  );
  if (!match) scannedFactories.add(factory);
  return match;
}

function transformAlbumRowSource(src: string): string | null {
  if (src.includes(TITLE_WRAP_CLASS) && !DURATION_BANNED_RE.test(src)) {
    return null;
  }
  const dur = src.match(DURATION_BANNED_RE);
  if (!dur) return null;
  const ruVar = dur[0].match(/H\?\?([a-z])\.Ru\.get/)?.[1];
  if (!ruVar) return null;
  if (!src.includes(TITLE_NODE)) return null;

  const ban = banBesideTitle(ruVar);
  const wrap = titleWrap(ban);
  const next = src.replace(DURATION_BANNED_RE, "").split(TITLE_NODE).join(wrap);
  if (!next.includes(TITLE_WRAP_CLASS) || DURATION_BANNED_RE.test(next)) {
    return null;
  }
  return next;
}

function recompileFactory(src: string): WebpackFactory | null {
  const body = src.startsWith("function")
    ? src
    : src.includes("(e,t,i)")
      ? `function${src.slice(src.indexOf("("))}`
      : null;
  if (!body) return null;
  try {
    return new Function(`return (${body})`)() as WebpackFactory;
  } catch {
    return null;
  }
}

function wrapAlbumRowFactory(original: WebpackFactory): WebpackFactory {
  const transformed = transformAlbumRowSource(original.toString());
  if (!transformed) return original;
  const next = recompileFactory(transformed);
  if (!next) return original;
  Object.defineProperty(next, "__spicetifyExtAlbumTitleHide", { value: true });
  return next;
}

function findAlbumRowId(req: WebpackRequire): string | null {
  for (const id of Object.keys(req.m)) {
    if (isAlbumRowFactory(req.m[id])) return id;
  }
  return null;
}

function patchLiveMemo(req: WebpackRequire): boolean {
  const id = findAlbumRowId(req);
  if (!id) return false;
  const current = req.m[id];
  if (typeof current !== "function") return false;

  const wrapped = wrapAlbumRowFactory(current as WebpackFactory);
  if (wrapped !== current) req.m[id] = wrapped;
  const factory = req.m[id] as WebpackFactory;

  try {
    const mod = req(id) as { d?: MemoExport };
    const memo = mod.d;
    if (!memo || typeof memo.type !== "function") return false;

    const typeSrc = memo.type.toString();
    if (
      typeSrc.includes(TITLE_WRAP_CLASS) &&
      !DURATION_BANNED_RE.test(typeSrc) &&
      memo.type.__spicetifyExtAlbumTitleHide
    ) {
      return true;
    }

    const fresh: Record<string, unknown> = {};
    factory({}, fresh, req);
    const nextMemo = fresh.d as MemoExport | undefined;
    if (!nextMemo || typeof nextMemo.type !== "function") return false;
    if (!nextMemo.type.toString().includes(TITLE_WRAP_CLASS)) return false;

    memo.type = nextMemo.type;
    memo.compare = nextMemo.compare;
    Object.defineProperty(memo.type, "__spicetifyExtAlbumTitleHide", {
      value: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function createAlbumTrackTitleHidePatch() {
  function patchFactoryMap(modules: Record<string, unknown>): boolean {
    let touched = false;
    for (const id of Object.keys(modules)) {
      const factory = modules[id];
      if (!isAlbumRowFactory(factory)) continue;
      const next = wrapAlbumRowFactory(factory);
      if (next === factory) continue;
      modules[id] = next;
      touched = true;
    }
    return touched;
  }

  return { patchFactoryMap, patchLiveExports: patchLiveMemo };
}
