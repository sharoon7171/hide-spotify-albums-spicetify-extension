import { isSearchActive } from "@/hiding/routes";
import { mountHiddenAlbumsNavButton } from "@/ui/global-nav";
import {
  createManagerPanel,
  disposeManagerPanel,
} from "@/features/hidden-albums-manager/panel";

const MODAL_TITLE = "Hidden albums";

export function initHiddenAlbumsManager(sp: typeof Spicetify): () => void {
  let panelHost: HTMLElement | null = null;
  let navMount: ReturnType<typeof mountHiddenAlbumsNavButton> | null = null;

  const openManager = () => {
    if (panelHost) {
      disposeManagerPanel(panelHost);
      panelHost.remove();
    }
    panelHost = createManagerPanel(sp);
    sp.PopupModal.display({
      title: MODAL_TITLE,
      content: panelHost,
      isLarge: true,
    });
  };

  navMount = mountHiddenAlbumsNavButton(sp, openManager);
  sp.Platform.History.listen(() => {
    if (!isSearchActive()) navMount?.sync();
  });

  return () => {
    navMount?.remove();
    navMount = null;
    if (panelHost) {
      disposeManagerPanel(panelHost);
      panelHost.remove();
      panelHost = null;
    }
    sp.PopupModal.hide();
  };
}
