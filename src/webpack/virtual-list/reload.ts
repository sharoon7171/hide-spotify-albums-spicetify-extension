import {
  evictWebpackModule,
  findWebpackModuleCache,
} from "@/webpack/module-cache";
import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import { VIRTUAL_LIST_MODULE } from "@/hiding/virtual-list";
import {
  createVirtualListPatch,
  matchesVirtualListNeedle,
  type VirtualListPatchContext,
} from "@/webpack/virtual-list/patch";
import { findModuleIdByExportBody } from "@/webpack/require";
import type { WebpackRequire } from "@/webpack/require";

function resolveVirtualListModuleId(): string {
  return (
    findModuleIdByExportBody((source) => matchesVirtualListNeedle(source)) ??
    VIRTUAL_LIST_MODULE
  );
}

let virtualListExportPatched = false;
let evictAttempted = false;

function evictVirtualListFromKnownCaches(moduleId: string): void {
  const roots: unknown[] = [globalThis];
  const chunk = (globalThis as typeof globalThis & {
    webpackChunkclient_web?: unknown[];
  }).webpackChunkclient_web;
  if (Array.isArray(chunk)) {
    roots.push(chunk);
    for (const entry of chunk) {
      if (!Array.isArray(entry) || typeof entry[2] !== "function") continue;
      try {
        const req = entry[2]({});
        if (req && typeof req === "object") roots.push(req);
      } catch {}
    }
  }
  for (const root of roots) {
    const cache = findWebpackModuleCache(root, moduleId);
    if (cache) evictWebpackModule(cache, moduleId);
  }
}

export function applyVirtualListAlbumPatch(
  req: WebpackRequire,
  patchCtx: VirtualListPatchContext,
): boolean {
  if (!isDiscographyPath(routePathname())) return virtualListExportPatched;
  if (virtualListExportPatched) return true;

  const patch = createVirtualListPatch(patchCtx);
  const moduleId = resolveVirtualListModuleId();

  patch.patchFactoryMap(req.m);
  if (patch.patchModuleExport(req, moduleId)) {
    virtualListExportPatched = true;
    return true;
  }

  if (!evictAttempted) {
    evictAttempted = true;
    evictVirtualListFromKnownCaches(moduleId);
    try {
      if (patch.patchModuleExport(req, moduleId)) {
        virtualListExportPatched = true;
        return true;
      }
    } catch {}
  }
  return false;
}
