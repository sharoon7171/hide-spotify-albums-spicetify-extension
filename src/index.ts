import { startAlbumSync } from "@/albums/store";
import { waitForSpicetify } from "@/core/wait-spicetify";
import { registerFeatures } from "@/features/registry";

void (async () => {
  const sp = await waitForSpicetify();
  await startAlbumSync();
  registerFeatures(sp);
})();
