type PageSyncHandler = () => void;

const handlers = new Set<PageSyncHandler>();
let installed = false;
let uninstall: (() => void) | null = null;

export function bindPageSync(
  sp: typeof Spicetify,
  handler: PageSyncHandler,
): () => void {
  handlers.add(handler);
  if (!installed) {
    installed = true;
    uninstall = installShared(sp);
  }
  queueMicrotask(handler);

  return () => {
    handlers.delete(handler);
    if (handlers.size > 0) return;
    uninstall?.();
    uninstall = null;
    installed = false;
  };
}

function runAll(): void {
  for (const fn of handlers) fn();
}

function installShared(sp: typeof Spicetify): () => void {
  const run = () => queueMicrotask(runAll);
  const debounced = debounce(runAll, 160);

  const offHistory = sp.Platform.History.listen(() => run());

  const onPop = () => run();
  window.addEventListener("popstate", onPop);

  const unpatchPush = patchHistory("pushState", run);
  const unpatchReplace = patchHistory("replaceState", run);

  const main = document.querySelector("main");
  let mo: MutationObserver | undefined;
  if (main) {
    mo = new MutationObserver(() => debounced());
    mo.observe(main, { childList: true, subtree: true });
  }

  const titleEl = document.querySelector("title");
  let moTitle: MutationObserver | undefined;
  if (titleEl) {
    moTitle = new MutationObserver(() => debounced());
    moTitle.observe(titleEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  const nav = (window as Window & { navigation?: EventTarget }).navigation;
  const onNavigate = () => run();
  if (nav && typeof nav.addEventListener === "function") {
    nav.addEventListener("navigate", onNavigate);
  }

  return () => {
    offHistory();
    window.removeEventListener("popstate", onPop);
    unpatchPush();
    unpatchReplace();
    mo?.disconnect();
    moTitle?.disconnect();
    if (nav && typeof nav.removeEventListener === "function") {
      nav.removeEventListener("navigate", onNavigate);
    }
  };
}

function patchHistory(
  fnName: "pushState" | "replaceState",
  after: () => void,
): () => void {
  const original = history[fnName];
  history[fnName] = function (
    this: History,
    ...args: Parameters<History[typeof fnName]>
  ) {
    const ret = original.apply(this, args);
    after();
    return ret;
  };
  return () => {
    history[fnName] = original;
  };
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t !== undefined) clearTimeout(t);
    t = setTimeout(() => {
      t = undefined;
      fn();
    }, ms);
  };
}
