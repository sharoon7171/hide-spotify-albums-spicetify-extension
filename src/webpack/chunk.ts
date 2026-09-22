export type WebpackChunk = {
  push: (entry: unknown) => unknown;
};

const CHUNK_KEYS = [
  "rspackChunk",
  "rspackChunkclient_web",
  "webpackChunkclient_web",
] as const;

type ChunkGlobal = typeof globalThis & Record<(typeof CHUNK_KEYS)[number], unknown>;

export function getWebpackChunk(): WebpackChunk | null {
  const g = globalThis as ChunkGlobal;
  for (const key of CHUNK_KEYS) {
    const chunk = g[key];
    if (chunk && typeof (chunk as WebpackChunk).push === "function") {
      return chunk as WebpackChunk;
    }
  }
  return null;
}

export function watchWebpackChunk(
  onChunk: (chunk: WebpackChunk) => void,
): void {
  const existing = getWebpackChunk();
  if (existing) {
    onChunk(existing);
    return;
  }
  for (const key of CHUNK_KEYS) {
    if (Object.getOwnPropertyDescriptor(globalThis, key)) continue;
    let stored: unknown;
    Object.defineProperty(globalThis, key, {
      configurable: true,
      enumerable: true,
      get() {
        return stored;
      },
      set(value) {
        stored = value;
        Object.defineProperty(globalThis, key, {
          value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
        if (value && typeof (value as WebpackChunk).push === "function") {
          onChunk(value as WebpackChunk);
        }
      },
    });
  }
}
