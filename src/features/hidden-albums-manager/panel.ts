import {
  clearAllHiddenAlbums,
  listHiddenAlbumEntries,
  removeByDocId,
  subscribeHiddenAlbums,
  type HiddenAlbumEntry,
} from "@/albums/store";
import { filterHiddenAlbumEntries } from "@/features/hidden-albums-manager/search";
import { managerPanelCss } from "@/features/hidden-albums-manager/styles";

type PanelHandles = {
  countEl: HTMLElement;
  searchHintEl: HTMLElement;
  searchInput: HTMLInputElement;
  listEl: HTMLElement;
  clearBtn: HTMLButtonElement;
  confirmBox: HTMLElement;
  confirmText: HTMLElement;
  confirmDeleteBtn: HTMLButtonElement;
};

const SEARCH_ICON =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2.5a4.5 4.5 0 104.533 7.918l3.366 3.366-.707.707-3.366-3.366A4.5 4.5 0 107 2.5zM3.5 7a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"/></svg>';

export function createManagerPanel(sp: typeof Spicetify): HTMLElement {
  const host = document.createElement("div");
  host.className = "spicetify-ext-hidden-manager-host";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = managerPanelCss;
  shadow.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "panel";

  const header = document.createElement("header");
  header.className = "header";

  const headerCopy = document.createElement("div");
  headerCopy.className = "header__copy";

  const meta = document.createElement("p");
  meta.className = "header__meta";
  meta.textContent =
    "Albums you hide on album pages appear here, newest first.";

  const countEl = document.createElement("p");
  countEl.className = "header__count";
  countEl.dataset.role = "count";

  headerCopy.append(meta, countEl);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const deleteSlot = document.createElement("div");
  deleteSlot.className = "toolbar__delete";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "btn btn--danger";
  clearBtn.textContent = "Delete all";
  clearBtn.dataset.role = "clear-all";
  clearBtn.setAttribute("aria-haspopup", "dialog");
  clearBtn.setAttribute("aria-expanded", "false");

  const confirmBox = document.createElement("div");
  confirmBox.className = "confirm";
  confirmBox.dataset.role = "confirm";
  confirmBox.setAttribute("role", "alertdialog");
  confirmBox.setAttribute("aria-labelledby", "spicetify-ext-confirm-delete-label");

  const confirmText = document.createElement("p");
  confirmText.className = "confirm__text";
  confirmText.id = "spicetify-ext-confirm-delete-label";
  confirmText.dataset.role = "confirm-text";

  const confirmActions = document.createElement("div");
  confirmActions.className = "confirm__actions";

  const confirmCancelBtn = document.createElement("button");
  confirmCancelBtn.type = "button";
  confirmCancelBtn.className = "btn btn--ghost";
  confirmCancelBtn.textContent = "Cancel";

  const confirmDeleteBtn = document.createElement("button");
  confirmDeleteBtn.type = "button";
  confirmDeleteBtn.className = "btn btn--danger";
  confirmDeleteBtn.textContent = "Delete all";
  confirmDeleteBtn.dataset.role = "confirm-delete";

  confirmActions.append(confirmCancelBtn, confirmDeleteBtn);
  confirmBox.append(confirmText, confirmActions);
  deleteSlot.append(clearBtn, confirmBox);
  toolbar.appendChild(deleteSlot);
  header.append(headerCopy, toolbar);

  const search = document.createElement("div");
  search.className = "search";

  const searchLabel = document.createElement("label");
  searchLabel.className = "search__label";
  searchLabel.htmlFor = "spicetify-ext-hidden-albums-search";
  searchLabel.textContent = "Search";

  const searchWrap = document.createElement("div");
  searchWrap.className = "search__wrap";

  const searchIcon = document.createElement("span");
  searchIcon.className = "search__icon";
  searchIcon.innerHTML = SEARCH_ICON;

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.id = "spicetify-ext-hidden-albums-search";
  searchInput.className = "search__field";
  searchInput.placeholder = "Album name or Spotify album ID";
  searchInput.autocomplete = "off";
  searchInput.spellcheck = false;
  searchInput.dataset.role = "search";

  const searchHint = document.createElement("p");
  searchHint.className = "search__hint";
  searchHint.dataset.role = "search-hint";

  searchWrap.append(searchIcon, searchInput);
  search.append(searchLabel, searchWrap, searchHint);

  const listWrap = document.createElement("div");
  listWrap.className = "list-wrap";

  const listEl = document.createElement("div");
  listEl.className = "list";
  listEl.dataset.role = "list";
  listWrap.appendChild(listEl);

  panel.append(header, search, listWrap);
  shadow.appendChild(panel);

  const handles: PanelHandles = {
    countEl,
    searchHintEl: searchHint,
    searchInput,
    listEl,
    clearBtn,
    confirmBox,
    confirmText,
    confirmDeleteBtn,
  };

  const setConfirm = (open: boolean) => {
    confirmBox.dataset.visible = open ? "true" : "false";
    clearBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  clearBtn.addEventListener("click", () => {
    const n = listHiddenAlbumEntries().length;
    if (n === 0) return;
    confirmText.textContent = `Remove all ${n} hidden album${n === 1 ? "" : "s"}? This cannot be undone.`;
    setConfirm(true);
  });

  confirmCancelBtn.addEventListener("click", () => setConfirm(false));

  confirmDeleteBtn.addEventListener("click", async () => {
    confirmDeleteBtn.disabled = true;
    clearBtn.disabled = true;
    try {
      const n = await clearAllHiddenAlbums();
      setConfirm(false);
      searchInput.value = "";
      sp.showNotification(
        n === 0 ? "No hidden albums" : `Removed ${n} hidden album${n === 1 ? "" : "s"}`,
      );
      paint(handles, sp);
    } catch {
      sp.showNotification("Could not clear hidden albums", true);
    } finally {
      confirmDeleteBtn.disabled = false;
      clearBtn.disabled = false;
    }
  });

  searchInput.addEventListener("input", () => paint(handles, sp));

  const offStore = subscribeHiddenAlbums(() => {
    if (host.isConnected) paint(handles, sp);
  });

  host.addEventListener("spicetify-ext-manager-dispose", () => {
    offStore();
  });

  paint(handles, sp);
  queueMicrotask(() => searchInput.focus());
  return host;
}

function paint(handles: PanelHandles, sp: typeof Spicetify): void {
  const all = listHiddenAlbumEntries();
  const query = handles.searchInput.value;
  const visible = filterHiddenAlbumEntries(all, query);
  const total = all.length;
  const shown = visible.length;
  const searching = query.trim().length > 0;

  if (total === 0) {
    handles.countEl.textContent = "0 albums hidden";
    handles.searchHintEl.textContent = "";
    handles.searchInput.disabled = true;
  } else if (!searching) {
    handles.countEl.textContent = `${total} album${total === 1 ? "" : "s"} hidden`;
    handles.searchHintEl.textContent = "Sorted by most recently hidden";
    handles.searchInput.disabled = false;
  } else {
    handles.countEl.textContent = `${shown} of ${total} album${total === 1 ? "" : "s"}`;
    handles.searchHintEl.textContent =
      shown === 0
        ? "No match for this search"
        : `Showing ${shown} match${shown === 1 ? "" : "es"}`;
    handles.searchInput.disabled = false;
  }

  handles.clearBtn.disabled = total === 0;
  handles.confirmDeleteBtn.disabled = total === 0;

  handles.listEl.replaceChildren();

  if (total === 0) {
    handles.listEl.appendChild(buildEmptyState(false));
    return;
  }

  if (shown === 0) {
    handles.listEl.appendChild(buildEmptyState(true));
    return;
  }

  for (const row of visible) {
    handles.listEl.appendChild(buildRow(row, sp));
  }
}

function buildEmptyState(noSearchMatch: boolean): HTMLElement {
  const empty = document.createElement("div");
  empty.className = "empty";
  const emptyTitle = document.createElement("p");
  emptyTitle.className = "empty__title";
  emptyTitle.textContent = noSearchMatch
    ? "No matching albums"
    : "No hidden albums";
  const emptyHint = document.createElement("p");
  emptyHint.className = "empty__hint";
  emptyHint.textContent = noSearchMatch
    ? "Try another name or paste the album ID from the album URL."
    : "Use Hide on an album page to add albums to this list.";
  empty.append(emptyTitle, emptyHint);
  return empty;
}

function buildRow(row: HiddenAlbumEntry, sp: typeof Spicetify): HTMLElement {
  const el = document.createElement("article");
  el.className = "row";

  const main = document.createElement("div");
  main.className = "row__main";

  const title = document.createElement("p");
  title.className = "row__title";
  title.textContent = row.title;

  const idLine = document.createElement("p");
  idLine.className = "row__id";
  idLine.textContent = row.albumId ?? row.docId;

  main.append(title, idLine);

  const actions = document.createElement("div");
  actions.className = "row__actions";

  if (row.albumId) {
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn btn--ghost btn--row";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      sp.Platform.History.push(`/album/${row.albumId}`);
      sp.PopupModal.hide();
    });
    actions.appendChild(openBtn);
  }

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn--danger btn--row";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", async () => {
    removeBtn.disabled = true;
    try {
      await removeByDocId(row.docId);
      sp.showNotification("Album removed from hidden list");
    } catch {
      sp.showNotification("Could not remove album", true);
    } finally {
      removeBtn.disabled = false;
    }
  });

  actions.appendChild(removeBtn);
  el.append(main, actions);
  return el;
}

export function disposeManagerPanel(host: HTMLElement): void {
  host.dispatchEvent(new Event("spicetify-ext-manager-dispose"));
}
