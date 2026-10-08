import { getWebpackChunk } from "@/webpack/chunk";
import {
  cacheWebpackRequire,
  cachedWebpackRequire,
} from "@/webpack/expose";

export type WebpackRequire = {
  (id: string | number): Record<string, unknown>;
  m: Record<string, unknown>;
};

const moduleIdCache = new Map<string, string | null>();

export function getWebpackRequire(): WebpackRequire | null {
  const cached = cachedWebpackRequire();
  if (cached) return cached;
  const chunk = getWebpackChunk();
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
  cacheKey?: string,
): string | null {
  const key =
    cacheKey ?? (typeof match === "string" ? match : match.toString());
  if (moduleIdCache.has(key)) return moduleIdCache.get(key) ?? null;

  const req = getWebpackRequire();
  if (!req) {
    moduleIdCache.set(key, null);
    return null;
  }
  const test =
    typeof match === "function"
      ? match
      : (source: string) => source.includes(match);
  for (const id of Object.keys(req.m)) {
    const factory = req.m[id];
    if (typeof factory === "function" && test(factory.toString())) {
      moduleIdCache.set(key, id);
      return id;
    }
  }
  moduleIdCache.set(key, null);
  return null;
}
