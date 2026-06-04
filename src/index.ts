import { waitForSpicetify } from "@/core/wait-spicetify";
import { registerFeatures } from "@/features/registry";

void (async () => {
  const sp = await waitForSpicetify();
  registerFeatures(sp);
})();
