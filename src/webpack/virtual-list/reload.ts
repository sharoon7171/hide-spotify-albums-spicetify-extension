import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import { VIRTUAL_LIST_NEEDLE } from "@/hiding/virtual-list";
import {
  createVirtualListPatch,
  type VirtualListPatchContext,
} from "@/webpack/virtual-list/patch";
import { findModuleIdByExportBody } from "@/webpack/require";
import type { WebpackRequire } from "@/webpack/require";

const NEEDLE_CACHE_KEY = "virtual-list-itemIsValidPredicate";

let virtualListExportPatched = false;

function resolveVirtualListModuleId(): string | null {
  return findModuleIdByExportBody(
    (source) => VIRTUAL_LIST_NEEDLE.test(source),
    NEEDLE_CACHE_KEY,
  );
}

export function applyVirtualListAlbumPatch(
  req: WebpackRequire,
  patchCtx: VirtualListPatchContext,
): boolean {
  if (!isDiscographyPath(routePathname())) return virtualListExportPatched;
  if (virtualListExportPatched) return true;

  const moduleId = resolveVirtualListModuleId();
  if (!moduleId) return false;

  const patch = createVirtualListPatch(patchCtx);
  patch.patchFactoryMap(req.m);
  if (!patch.patchModuleExport(req, moduleId)) return false;
  virtualListExportPatched = true;
  return true;
}
