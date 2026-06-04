export type PageSyncHandler = () => void;

export function bindPageSync(
  sp: typeof Spicetify,
  handler: PageSyncHandler,
): () => void {
  const run = () => queueMicrotask(handler);
  const debounced = debounce(handler, 160);

  const offHistory = sp.Platform.History.listen(() => run());

  const onPop = () => run();
  window.addEventListener("popstate", onPop);

  patchHistory("pushState", run);
  patchHistory("replaceState", run);

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
  if (nav && typeof nav.addEventListener === "function") {
    nav.addEventListener("navigate", () => run());
  }

  handler();

  return () => {
    offHistory();
    window.removeEventListener("popstate", onPop);
    mo?.disconnect();
    moTitle?.disconnect();
  };
}

function patchHistory(
  fnName: "pushState" | "replaceState",
  after: () => void,
): void {
  const original = history[fnName];
  history[fnName] = function (
    this: History,
    ...args: Parameters<History[typeof fnName]>
  ) {
    const ret = original.apply(this, args);
    after();
    return ret;
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
