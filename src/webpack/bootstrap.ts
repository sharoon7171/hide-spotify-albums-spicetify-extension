import { readHiddenAlbumIdsEarly } from "@/albums/early-ids";
import {
  createVirtualListPatch,
  VIRTUAL_LIST_NEEDLE,
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
        if (
          typeof val === "function" &&
          val.toString().includes(VIRTUAL_LIST_NEEDLE)
        ) {
          return virtualListPatch.wrapHook(val);
        }
        return val;
      };
      return orig(obj, prop, nextDesc);
    } as typeof Object.defineProperty;
    tagged.__spicetifyExtOdpHook = true;
  }

  hookVirtualListOdp();

  function hookChunkPush(chunk: { push: (entry: unknown) => unknown }): boolean {
    const tagged = chunk as { __spicetifyExtChunkHook?: boolean };
    if (tagged.__spicetifyExtChunkHook) return true;
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
    return true;
  }

  function installChunkHook(): boolean {
    const chunk = (globalThis as typeof globalThis & {
      webpackChunkclient_web?: unknown;
    }).webpackChunkclient_web as { push: (entry: unknown) => unknown } | undefined;
    if (!chunk) return false;
    return hookChunkPush(chunk);
  }

  if (!installChunkHook()) {
    let chunkValue: unknown;
    Object.defineProperty(globalThis, "webpackChunkclient_web", {
      configurable: true,
      enumerable: true,
      get() {
        return chunkValue;
      },
      set(value) {
        chunkValue = value;
        Object.defineProperty(globalThis, "webpackChunkclient_web", {
          value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
        if (value && typeof (value as { push?: unknown }).push === "function") {
          hookChunkPush(value as { push: (entry: unknown) => unknown });
        }
      },
    });
  }

  (globalThis as typeof globalThis & { __spicetifyExtBootstrap?: boolean })
    .__spicetifyExtBootstrap = true;
})();
