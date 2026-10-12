import { retryUntil } from "@/core/retry";
import { bindPageSync } from "@/core/page-sync";
import { isDiscographyPath } from "@/hiding/discography";
import { routePathname } from "@/hiding/routes";
import { tryInstallDiscographyActionBarJsxPatch } from "@/webpack/discography-action-bar/patch";

export function initDiscographyHideToggle(sp: typeof Spicetify): () => void {
  let restore: (() => void) | null = null;

  const tryInstall = (): boolean => {
    if (restore) return true;
    restore = tryInstallDiscographyActionBarJsxPatch(sp);
    return restore !== null;
  };

  tryInstall();
  const stopRetry = retryUntil(tryInstall, {
    intervalMs: 400,
    maxMs: 120_000,
  });
  const offSync = bindPageSync(sp, () => {
    if (!isDiscographyPath(routePathname())) return;
    tryInstall();
  });

  return () => {
    stopRetry();
    offSync();
    restore?.();
    restore = null;
  };
}
