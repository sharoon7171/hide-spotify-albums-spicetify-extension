const POLL_MS = 100;
const MAX_WAIT_MS = 120_000;

export async function waitForSpicetify(): Promise<typeof Spicetify> {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    const sp = globalThis.Spicetify;
    if (
      typeof sp?.Platform?.History?.listen === "function" &&
      typeof sp?.PopupModal?.display === "function" &&
      sp?.LocalStorage &&
      document.querySelector("main") &&
      document.querySelector(".main-globalNav-searchContainer")
    ) {
      return sp;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error("Spicetify APIs not ready");
}
