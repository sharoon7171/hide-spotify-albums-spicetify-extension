import {
  cacheWebpackRequire,
  cachedWebpackRequire,
} from "@/webpack/expose";

export type WebpackRequire = {
  (id: string | number): Record<string, unknown>;
  m: Record<string, unknown>;
};

export function getWebpackRequire(): WebpackRequire | null {
  const cached = cachedWebpackRequire();
  if (cached) return cached;
  const chunk = (globalThis as typeof globalThis & {
    webpackChunkclient_web?: unknown;
  }).webpackChunkclient_web as
    | { push: (args: unknown[]) => WebpackRequire }
    | undefined;
  if (!chunk) return null;
  try {
    const req = chunk.push([
      [Symbol.for("spicetify-ext")],
      {},
      (r: unknown) => r,
    ]) as WebpackRequire;
    if (!req?.m) return null;
    cacheWebpackRequire(req);
    return req;
  } catch {
    return null;
  }
}

export function findModuleIdByExportBody(
  match: string | ((source: string) => boolean),
): string | null {
  const req = getWebpackRequire();
  if (!req) return null;
  const test =
    typeof match === "function"
      ? match
      : (source: string) => source.includes(match);
  for (const id of Object.keys(req.m)) {
    const factory = req.m[id];
    if (typeof factory === "function" && test(factory.toString())) {
      return id;
    }
  }
  return null;
}
