import { readHiddenAlbumIdsEarly } from "@/albums/early-ids";
import { watchWebpackChunk, type WebpackChunk } from "@/webpack/chunk";
import {
  createVirtualListPatch,
  matchesVirtualListNeedle,
} from "@/webpack/virtual-list/patch";

(function () {
  const ALBUM_URI = /^spotify:album:([0-9A-Za-z]+)$/;
  const patchCtx = {
    hiddenIds: readHiddenAlbumIdsEarly,
    albumUriRe: ALBUM_URI,
  };
  const virtualListPatch = createVirtualListPatch(patchCtx);

  function hookVirtualListOdp(): void {
    const tagged = globalThis as typeof globalThis & {
      __spicetifyExtOdpHook?: boolean;
    };
    if (tagged.__spicetifyExtOdpHook) return;
    const checked = new WeakSet<object>();
    const orig = Object.defineProperty;
    Object.defineProperty = function <T>(
      obj: T,
      prop: PropertyKey,
      desc: PropertyDescriptor & ThisType<unknown>,
    ): T {
      if (
        prop !== "E" ||
        !desc ||
        typeof desc.get !== "function" ||
        !obj ||
        typeof obj !== "object"
      ) {
        return orig(obj, prop, desc);
      }
      const origGet = desc.get;
      const nextDesc = { ...desc };
      nextDesc.get = () => {
        const val = origGet();
        if (virtualListPatch.isVirtualListExportHook(val)) return val;
        if (typeof val === "function") {
          if (checked.has(val)) return val;
          if (matchesVirtualListNeedle(val.toString())) {
            return virtualListPatch.wrapHook(val);
          }
          checked.add(val);
        }
        return val;
      };
      return orig(obj, prop, nextDesc);
    } as typeof Object.defineProperty;
    tagged.__spicetifyExtOdpHook = true;
  }

  hookVirtualListOdp();

  function hookChunkPush(chunk: WebpackChunk): void {
    const tagged = chunk as WebpackChunk & { __spicetifyExtChunkHook?: boolean };
    if (tagged.__spicetifyExtChunkHook) return;
    const original = chunk.push.bind(chunk);
    chunk.push = (entry: unknown) => {
      const tuple = entry as [
        unknown,
        Record<string, unknown> | undefined,
        unknown,
      ];
      const modules = tuple[1];
      if (modules) virtualListPatch.patchFactoryMap(modules);
      return original(entry);
    };
    tagged.__spicetifyExtChunkHook = true;
  }

  watchWebpackChunk(hookChunkPush);

  (globalThis as typeof globalThis & { __spicetifyExtBootstrap?: boolean })
    .__spicetifyExtBootstrap = true;
})();
