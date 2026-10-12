export function retryUntil(
  tryFn: () => boolean,
  options?: { intervalMs?: number; maxMs?: number },
): () => void {
  const intervalMs = options?.intervalMs ?? 400;
  const maxMs = options?.maxMs;
  if (tryFn()) return () => undefined;

  const started = Date.now();
  const timer = window.setInterval(() => {
    if (tryFn()) {
      window.clearInterval(timer);
      return;
    }
    if (maxMs != null && Date.now() - started >= maxMs) {
      window.clearInterval(timer);
    }
  }, intervalMs);

  return () => window.clearInterval(timer);
}
