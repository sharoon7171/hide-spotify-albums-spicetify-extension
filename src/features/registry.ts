import { initAlbumHideToggle } from "@/features/album-hide-toggle";
import { initAlbumTrackTitleHide } from "@/features/album-track-title-hide";
import { initDiscographyHideToggle } from "@/features/discography-hide-toggle";
import { initHiddenAlbumsApply } from "@/features/hidden-albums-apply";
import { initHiddenAlbumsManager } from "@/features/hidden-albums-manager";

type FeatureTeardown = () => void;

export function registerFeatures(sp: typeof Spicetify): FeatureTeardown {
  const teardowns: FeatureTeardown[] = [
    initAlbumHideToggle(sp),
    initAlbumTrackTitleHide(sp),
    initDiscographyHideToggle(sp),
    initHiddenAlbumsManager(sp),
    initHiddenAlbumsApply(sp),
  ];

  return () => {
    for (const off of teardowns) off();
  };
}
