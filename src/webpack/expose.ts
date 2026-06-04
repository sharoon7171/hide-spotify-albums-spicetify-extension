import type { WebpackRequire } from "@/webpack/require";

const EXPOSE_KEY = "__spicetifyExtWebpackRequire" as const;

export function cacheWebpackRequire(req: WebpackRequire): boolean {
  (globalThis as typeof globalThis & { [EXPOSE_KEY]?: WebpackRequire })[
    EXPOSE_KEY
  ] = req;
  return true;
}

export function cachedWebpackRequire(): WebpackRequire | null {
  return (
    (globalThis as typeof globalThis & { [EXPOSE_KEY]?: WebpackRequire })[
      EXPOSE_KEY
    ] ?? null
  );
}

export function obtainWebpackRequire(): WebpackRequire | null {
  const chunk = (globalThis as typeof globalThis & {
    webpackChunkclient_web?: unknown;
  }).webpackChunkclient_web as
    | { push: (args: unknown[]) => WebpackRequire }
    | undefined;
  if (!chunk) return null;
  try {
    const req = chunk.push([
      [Symbol.for("spicetify-ext-expose")],
      {},
      (r: unknown) => r,
    ]) as WebpackRequire;
    return req?.m ? req : null;
  } catch {
    return null;
  }
}

export function hookWebpackModulesAssignment(
  onModules: (modules: Record<string, unknown>) => void,
): boolean {
  const tagged = globalThis as typeof globalThis & {
    __spicetifyExtModulesHook?: boolean;
  };
  if (tagged.__spicetifyExtModulesHook) return true;

  const patchIfPresent = (): boolean => {
    const modules = (
      globalThis as typeof globalThis & {
        __webpack_modules__?: Record<string, unknown>;
      }
    ).__webpack_modules__;
    if (modules && typeof modules === "object") {
      onModules(modules);
      return true;
    }
    return false;
  };

  const existing = Object.getOwnPropertyDescriptor(
    globalThis,
    "__webpack_modules__",
  );
  if (existing && !existing.configurable) {
    patchIfPresent();
    tagged.__spicetifyExtModulesHook = true;
    return false;
  }

  let stored: Record<string, unknown> | undefined;

  try {
    Object.defineProperty(globalThis, "__webpack_modules__", {
      configurable: true,
      enumerable: true,
      get() {
        return stored;
      },
      set(value) {
        if (value && typeof value === "object") {
          onModules(value as Record<string, unknown>);
        }
        stored = value as Record<string, unknown>;
        Object.defineProperty(globalThis, "__webpack_modules__", {
          value: stored,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      },
    });
  } catch {
    patchIfPresent();
    tagged.__spicetifyExtModulesHook = true;
    return false;
  }

  tagged.__spicetifyExtModulesHook = true;
  return true;
}
