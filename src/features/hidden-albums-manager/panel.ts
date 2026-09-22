import {
  clearAllHiddenAlbums,
  getHideTilesEnabled,
  listHiddenAlbumEntries,
  removeByDocId,
  setHideAlbumTiles,
  signIn,
  signOut,
  subscribeAuth,
  subscribeHiddenAlbums,
  subscribeHideTilesSetting,
  type HiddenAlbumEntry,
} from "@/albums/store";
import type { FirebaseUserView } from "@/lib/firebase/auth";
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
  authStatusEl: HTMLElement;
  authBtn: HTMLButtonElement;
  hideTilesSwitch: HTMLButtonElement;
  settingsEl: HTMLElement;
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
    "Hide albums from Home, Artist, Search, and carousels. Unhide from any album page.";

  const countEl = document.createElement("p");
  countEl.className = "header__count";
  countEl.dataset.role = "count";

  headerCopy.append(meta, countEl);

  const prefs = document.createElement("section");
  prefs.className = "prefs";

  const auth = document.createElement("div");
  auth.className = "prefs__card account";
  auth.dataset.state = "loading";

  const authSession = document.createElement("div");
  authSession.className = "account__session";

  const authStatusEl = document.createElement("div");
  authStatusEl.className = "account__status";
  authStatusEl.dataset.role = "auth-status";

  const authStatusEmail = document.createElement("p");
  authStatusEmail.className = "account__email";
  authStatusEmail.textContent = "Checking sign-in…";

  const authStatusHint = document.createElement("p");
  authStatusHint.className = "account__hint";
  authStatusHint.textContent = "Signed in · syncs with Hide Albums in Spotify";

  authStatusEl.append(authStatusEmail, authStatusHint);

  const authBtn = document.createElement("button");
  authBtn.type = "button";
  authBtn.className = "btn btn--ghost btn--compact";
  authBtn.dataset.role = "auth-btn";
  authBtn.textContent = "Sign Out";
  authBtn.disabled = true;

  authSession.append(authStatusEl, authBtn);

  const authForm = document.createElement("form");
  authForm.className = "account__form";
  authForm.dataset.role = "auth-form";

  const formTitle = document.createElement("p");
  formTitle.className = "account__title";
  formTitle.textContent = "Sign In";

  const formHint = document.createElement("p");
  formHint.className = "account__hint";
  formHint.textContent =
    "Sign in to sync with Hide Albums in Spotify on open.spotify.com.";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.className = "account__input";
  emailInput.placeholder = "Email";
  emailInput.autocomplete = "email";
  emailInput.required = true;
  emailInput.dataset.role = "auth-email";

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.className = "account__input";
  passwordInput.placeholder = "Password";
  passwordInput.autocomplete = "current-password";
  passwordInput.required = true;
  passwordInput.minLength = 6;
  passwordInput.dataset.role = "auth-password";

  const authActions = document.createElement("div");
  authActions.className = "account__actions";

  const signInBtn = document.createElement("button");
  signInBtn.type = "submit";
  signInBtn.className = "btn btn--primary";
  signInBtn.textContent = "Sign In";
  signInBtn.dataset.role = "auth-signin";

  authActions.append(signInBtn);
  authForm.append(formTitle, formHint, emailInput, passwordInput, authActions);
  auth.append(authSession, authForm);

  const settingsEl = document.createElement("div");
  settingsEl.className = "prefs__card settings";
  settingsEl.dataset.role = "settings";
  settingsEl.hidden = true;

  const settingsCopy = document.createElement("div");
  settingsCopy.className = "settings__copy";

  const settingsTitle = document.createElement("p");
  settingsTitle.className = "settings__title";
  settingsTitle.textContent = "Hide in Grids";

  const settingsHint = document.createElement("p");
  settingsHint.className = "settings__hint";
  settingsHint.textContent =
    "When on, hidden albums stay off Home, Artist, and Search. Album pages stay open.";

  settingsCopy.append(settingsTitle, settingsHint);

  const hideTilesSwitch = document.createElement("button");
  hideTilesSwitch.type = "button";
  hideTilesSwitch.className = "switch";
  hideTilesSwitch.dataset.role = "hide-tiles-switch";
  hideTilesSwitch.setAttribute("role", "switch");
  hideTilesSwitch.setAttribute("aria-checked", "true");
  hideTilesSwitch.setAttribute("aria-label", "Hide albums in grids");

  const switchThumb = document.createElement("span");
  switchThumb.className = "switch__thumb";
  hideTilesSwitch.append(switchThumb);

  const settingsControl = document.createElement("div");
  settingsControl.className = "settings__control";
  settingsControl.append(hideTilesSwitch);
  settingsEl.append(settingsCopy, settingsControl);
  prefs.append(auth, settingsEl);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const deleteSlot = document.createElement("div");
  deleteSlot.className = "toolbar__delete";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "btn btn--danger";
  clearBtn.textContent = "Clear All";
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
  confirmDeleteBtn.textContent = "Clear All";
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
  searchInput.placeholder = "Album name or ID";
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

  const library = document.createElement("section");
  library.className = "library";
  library.append(header, search, listWrap);

  panel.append(prefs, library);
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
    authStatusEl: authStatusEmail,
    authBtn,
    hideTilesSwitch,
    settingsEl,
  };

  let user: FirebaseUserView | null = null;

  const paintHideTiles = (enabled: boolean) => {
    handles.hideTilesSwitch.setAttribute(
      "aria-checked",
      enabled ? "true" : "false",
    );
    handles.hideTilesSwitch.dataset.on = enabled ? "true" : "false";
  };

  const paintAuth = () => {
    handles.settingsEl.hidden = !user;
    if (user) {
      auth.dataset.state = "signed-in";
      authStatusEmail.textContent = user.email ?? user.displayName ?? user.uid;
      authBtn.disabled = false;
      paintHideTiles(getHideTilesEnabled());
      return;
    }
    auth.dataset.state = "signed-out";
    authStatusEmail.textContent = "Not signed in";
    authBtn.disabled = true;
    signInBtn.disabled = false;
  };

  const runSignIn = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      sp.showNotification("Enter email and password", true);
      return;
    }
    auth.dataset.state = "loading";
    signInBtn.disabled = true;
    try {
      await signIn(email, password);
      passwordInput.value = "";
      sp.showNotification("Signed in");
    } catch {
      sp.showNotification("Sign in failed", true);
    } finally {
      paintAuth();
    }
  };

  authForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void runSignIn();
  });

  authBtn.addEventListener("click", async () => {
    authBtn.disabled = true;
    try {
      await signOut();
      sp.showNotification("Signed out");
    } catch {
      sp.showNotification("Sign out failed", true);
    } finally {
      paintAuth();
    }
  });

  hideTilesSwitch.addEventListener("click", () => {
    if (!user) return;
    const next = !getHideTilesEnabled();
    void setHideAlbumTiles(next);
    sp.showNotification(next ? "Grid hide is on" : "Grid hide is off");
  });

  const setConfirm = (open: boolean) => {
    confirmBox.dataset.visible = open ? "true" : "false";
    clearBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  clearBtn.addEventListener("click", () => {
    const n = listHiddenAlbumEntries().length;
    if (n === 0) return;
    confirmText.textContent = `Clear all ${n} hidden album${n === 1 ? "" : "s"}? This updates every signed-in device.`;
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
        n === 0
          ? "Nothing to clear"
          : `Cleared ${n} album${n === 1 ? "" : "s"}`,
      );
      paint(handles, sp);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      sp.showNotification(
        code === "auth-required"
          ? "Sign in to continue"
          : "Could not clear hidden albums",
        true,
      );
    } finally {
      confirmDeleteBtn.disabled = false;
      clearBtn.disabled = false;
    }
  });

  searchInput.addEventListener("input", () => paint(handles, sp));

  const offStore = subscribeHiddenAlbums(() => {
    if (host.isConnected) paint(handles, sp);
  });

  const offHideTiles = subscribeHideTilesSetting((enabled) => {
    if (host.isConnected) paintHideTiles(enabled);
  });

  const offAuth = subscribeAuth((next) => {
    user = next;
    if (host.isConnected) {
      paintAuth();
      paint(handles, sp);
    }
  });

  host.addEventListener("spicetify-ext-manager-dispose", () => {
    offStore();
    offHideTiles();
    offAuth();
  });

  paintAuth();
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
    handles.countEl.textContent = "No hidden albums";
    handles.searchHintEl.textContent = "";
    handles.searchInput.disabled = true;
  } else if (!searching) {
    handles.countEl.textContent = `${total} hidden album${total === 1 ? "" : "s"}`;
    handles.searchHintEl.textContent = "Newest first · synced when signed in";
    handles.searchInput.disabled = false;
  } else {
    handles.countEl.textContent = `${shown} of ${total}`;
    handles.searchHintEl.textContent =
      shown === 0
        ? "No matches"
        : `${shown} match${shown === 1 ? "" : "es"}`;
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
    ? "Try another title or album ID."
    : "Open an album and choose Hide.";
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
      sp.showNotification("Album unhidden");
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      sp.showNotification(
        code === "auth-required"
          ? "Sign in to continue"
          : "Could not remove album",
        true,
      );
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
