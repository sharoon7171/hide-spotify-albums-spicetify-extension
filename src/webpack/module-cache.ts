type ModuleCacheEntry = {
  exports?: Record<string, unknown>;
};

export function findWebpackModuleCache(
  root: unknown,
  moduleId: string,
): Record<string, ModuleCacheEntry> | null {
  const seen = new Set<object>();
  const queue: unknown[] = [root];
  let steps = 0;
  while (queue.length > 0 && steps < 5000) {
    steps += 1;
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current)) continue;
    seen.add(current);
    const record = current as Record<string, ModuleCacheEntry>;
    const hit = record[moduleId] ?? record[Number(moduleId)];
    if (hit && typeof hit === "object" && "exports" in hit) return record;
    for (const key of Object.getOwnPropertyNames(current)) {
      let child: unknown;
      try {
        child = (current as Record<string, unknown>)[key];
      } catch {
        continue;
      }
      if (child && typeof child === "object") queue.push(child);
    }
  }
  return null;
}

export function evictWebpackModule(
  cache: Record<string, ModuleCacheEntry>,
  moduleId: string,
): void {
  delete cache[moduleId];
  delete cache[Number(moduleId)];
}
