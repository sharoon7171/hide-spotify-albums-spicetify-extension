import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import { VIRTUAL_LIST_MODULE } from "@/hiding/virtual-list";
import type { WebpackRequire } from "@/webpack/require";

export const VIRTUAL_LIST_NEEDLE = "itemIsValidPredicate:u=()=>!0";

type VirtualListHook = (props: {
  itemIsValidPredicate?: (value: unknown) => boolean;
  initialItems?: unknown;
}) => unknown;

type WebpackFactory = (
  module: unknown,
  exports: Record<string, unknown>,
  require: unknown,
) => void;

type TaggedFactory = WebpackFactory & {
  __spicetifyExtWrapped?: boolean;
  __spicetifyExtVirtualList?: boolean;
};

export type VirtualListPatchContext = {
  hiddenIds: () => Set<string>;
  albumUriRe: RegExp;
};

function isVirtualListFactory(
  factory: unknown,
  needle = VIRTUAL_LIST_NEEDLE,
): factory is WebpackFactory {
  if (typeof factory !== "function") return false;
  const tagged = factory as TaggedFactory;
  return (
    tagged.__spicetifyExtVirtualList === true ||
    factory.toString().includes(needle)
  );
}

function shouldFilterAlbumsAtPath(path: string): boolean {
  return isDiscographyPath(path);
}

export function createVirtualListPatch(ctx: VirtualListPatchContext) {
  function wrapHook(original: VirtualListHook): VirtualListHook {
    const wrapped: VirtualListHook = (props) => {
      if (Object.prototype.hasOwnProperty.call(props, "initialItems")) {
        return original(props);
      }
      const path = routePathname();
      if (!shouldFilterAlbumsAtPath(path)) {
        return original(props);
      }
      const userPred = props.itemIsValidPredicate ?? (() => true);
      const hidden = ctx.hiddenIds();
      return original({
        ...props,
        itemIsValidPredicate: (value: unknown) => {
          if (!userPred(value)) return false;
          const uri =
            value && typeof value === "object"
              ? (value as { uri?: string }).uri
              : undefined;
          if (typeof uri !== "string") return true;
          const m = ctx.albumUriRe.exec(uri);
          if (!m) return true;
          return !hidden.has(m[1]);
        },
      });
    };
    (wrapped as { __spicetifyExtDisc?: boolean }).__spicetifyExtDisc = true;
    return wrapped;
  }

  function isVirtualListExportHook(
    hook: unknown,
  ): hook is VirtualListHook & { __spicetifyExtDisc?: boolean } {
    return (
      typeof hook === "function" &&
      (hook as { __spicetifyExtDisc?: boolean }).__spicetifyExtDisc === true
    );
  }

  function wrapFactory(original: WebpackFactory): WebpackFactory {
    const tagged = original as TaggedFactory;
    if (tagged.__spicetifyExtWrapped) return original;
    const wrapped: WebpackFactory = function (module, exports, require) {
      original(module, exports, require);
    };
    Object.defineProperty(wrapped, "__spicetifyExtWrapped", { value: true });
    Object.defineProperty(wrapped, "__spicetifyExtVirtualList", { value: true });
    return wrapped;
  }

  function patchFactoryMap(modules: Record<string, unknown>): boolean {
    let touched = false;
    for (const id of Object.keys(modules)) {
      const factory = modules[id];
      if (!isVirtualListFactory(factory)) continue;
      const tagged = factory as TaggedFactory;
      if (tagged.__spicetifyExtWrapped) continue;
      modules[id] = wrapFactory(factory);
      touched = true;
    }
    return touched;
  }

  function assignExportE(mod: Record<string, unknown>, hook: VirtualListHook): void {
    try {
      Object.defineProperty(mod, "E", {
        value: hook,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      mod.E = hook;
    }
  }

  function patchModuleExport(
    req: WebpackRequire,
    moduleId: string = VIRTUAL_LIST_MODULE,
  ): boolean {
    if (!isDiscographyPath(routePathname())) return false;
    try {
      const mod = req(moduleId);
      const hook = mod.E;
      if (typeof hook !== "function") return false;
      if (isVirtualListExportHook(hook)) return true;
      if (!hook.toString().includes(VIRTUAL_LIST_NEEDLE)) return false;
      assignExportE(mod, wrapHook(hook as VirtualListHook));
      return isVirtualListExportHook(mod.E);
    } catch {
      return false;
    }
  }

  return {
    patchFactoryMap,
    patchModuleExport,
    isVirtualListExportHook,
    wrapHook,
  };
}
