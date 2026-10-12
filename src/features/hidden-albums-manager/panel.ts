import {
  clearAlbumList,
  getGridFilters,
  listAlbumEntries,
  removeByDocId,
  setGridFilter,
  signIn,
  signOut,
  subscribeAuth,
  subscribeAlbumLists,
  subscribeGridFilters,
  type AlbumListEntry,
} from "@/albums/store";
import type { AlbumListKind } from "@/albums/album-entry";
import type { FirebaseUserView } from "@/lib/firebase/auth";
import { filterAlbumListEntries } from "@/features/hidden-albums-manager/search";
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
  filterHiddenSwitch: HTMLButtonElement;
  filterExcludedSwitch: HTMLButtonElement;
  settingsEl: HTMLElement;
  tabHidden: HTMLButtonElement;
  tabExcluded: HTMLButtonElement;
};

const SEARCH_ICON =
  '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2.5a4.5 4.5 0 104.533 7.918l3.366 3.366-.707.707-3.366-3.366A4.5 4.5 0 107 2.5zM3.5 7a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"/></svg>';

const LIST_LABEL: Record<AlbumListKind, { singular: string; plural: string; empty: string; hint: string }> = {
  hidden: {
    singular: "hidden album",
    plural: "hidden albums",
    empty: "No hidden albums",
    hint: "Open an album and choose Hide.",
  },
  excluded: {
    singular: "excluded album",
    plural: "excluded albums",
    empty: "No excluded albums",
    hint: "Open an album and choose Exclude.",
  },
};

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
    "Hide or exclude albums from Home, Artist, Search, and carousels. Manage each list below.";

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
  settingsEl.className = "prefs__card settings-stack";
  settingsEl.dataset.role = "settings";
  settingsEl.hidden = true;

  const buildFilterRow = (
    list: AlbumListKind,
    title: string,
    hint: string,
    ariaLabel: string,
  ) => {
    const row = document.createElement("div");
    row.className = "settings";

    const copy = document.createElement("div");
    copy.className = "settings__copy";

    const titleEl = document.createElement("p");
    titleEl.className = "settings__title";
    titleEl.textContent = title;

    const hintEl = document.createElement("p");
    hintEl.className = "settings__hint";
    hintEl.textContent = hint;

    copy.append(titleEl, hintEl);

    const sw = document.createElement("button");
    sw.type = "button";
    sw.className = "switch";
    sw.dataset.role = `filter-${list}-switch`;
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", "true");
    sw.setAttribute("aria-label", ariaLabel);

    const thumb = document.createElement("span");
    thumb.className = "switch__thumb";
    sw.append(thumb);

    const control = document.createElement("div");
    control.className = "settings__control";
    control.append(sw);
    row.append(copy, control);
    return { row, sw };
  };

  const hiddenFilter = buildFilterRow(
    "hidden",
    "Hidden in Grids",
    "When on, albums on the Hidden list stay off Home, Artist, and Search.",
    "Filter hidden albums in grids",
  );
  const excludedFilter = buildFilterRow(
    "excluded",
    "Excluded in Grids",
    "When on, albums on the Excluded list stay off Home, Artist, and Search.",
    "Filter excluded albums in grids",
  );
  settingsEl.append(hiddenFilter.row, excludedFilter.row);
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

  const tabs = document.createElement("div");
  tabs.className = "tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Album lists");

  const tabHidden = document.createElement("button");
  tabHidden.type = "button";
  tabHidden.className = "tabs__btn";
  tabHidden.setAttribute("role", "tab");
  tabHidden.dataset.role = "tab-hidden";
  tabHidden.dataset.active = "true";
  tabHidden.textContent = "Hidden";

  const tabExcluded = document.createElement("button");
  tabExcluded.type = "button";
  tabExcluded.className = "tabs__btn";
  tabExcluded.setAttribute("role", "tab");
  tabExcluded.dataset.role = "tab-excluded";
  tabExcluded.dataset.active = "false";
  tabExcluded.textContent = "Excluded";

  tabs.append(tabHidden, tabExcluded);

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
  library.hidden = true;
  library.append(header, tabs, search, listWrap);

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
    filterHiddenSwitch: hiddenFilter.sw,
    filterExcludedSwitch: excludedFilter.sw,
    settingsEl,
    tabHidden,
    tabExcluded,
  };

  let user: FirebaseUserView | null = null;
  let authSettled = false;
  let activeList: AlbumListKind = "hidden";

  const setActiveList = (list: AlbumListKind) => {
    activeList = list;
    handles.tabHidden.dataset.active = list === "hidden" ? "true" : "false";
    handles.tabExcluded.dataset.active =
      list === "excluded" ? "true" : "false";
    setConfirm(false);
    paint(handles, sp, activeList);
  };

  const paintGridFilters = (filters: { hidden: boolean; excluded: boolean }) => {
    handles.filterHiddenSwitch.setAttribute(
      "aria-checked",
      filters.hidden ? "true" : "false",
    );
    handles.filterHiddenSwitch.dataset.on = filters.hidden ? "true" : "false";
    handles.filterExcludedSwitch.setAttribute(
      "aria-checked",
      filters.excluded ? "true" : "false",
    );
    handles.filterExcludedSwitch.dataset.on = filters.excluded
      ? "true"
      : "false";
  };

  const paintAuth = () => {
    if (!authSettled) {
      auth.dataset.state = "loading";
      handles.settingsEl.hidden = true;
      library.hidden = true;
      authBtn.disabled = true;
      signInBtn.disabled = true;
      return;
    }
    handles.settingsEl.hidden = !user;
    library.hidden = !user;
    if (user) {
      auth.dataset.state = "signed-in";
      authStatusEmail.textContent = user.email ?? user.displayName ?? user.uid;
      authBtn.disabled = false;
      paintGridFilters(getGridFilters());
      paint(handles, sp, activeList);
      return;
    }
    auth.dataset.state = "signed-out";
    authStatusEmail.textContent = "Not signed in";
    authBtn.disabled = true;
    signInBtn.disabled = false;
    handles.listEl.replaceChildren();
    handles.countEl.textContent = "";
    handles.searchHintEl.textContent = "";
    handles.searchInput.value = "";
    handles.searchInput.disabled = true;
    handles.clearBtn.disabled = true;
    setConfirm(false);
  };

  const runSignIn = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      sp.showNotification("Enter email and password", true);
      return;
    }
    auth.dataset.state = "loading";
    handles.settingsEl.hidden = true;
    library.hidden = true;
    signInBtn.disabled = true;
    try {
      await signIn(email, password);
      passwordInput.value = "";
      sp.showNotification("Signed in");
    } catch {
      sp.showNotification("Sign in failed", true);
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

  const onFilterToggle = (list: AlbumListKind) => {
    if (!user) return;
    const current = getGridFilters();
    const next = !current[list];
    void setGridFilter(list, next);
    sp.showNotification(
      list === "hidden"
        ? next
          ? "Hidden list filtering is on"
          : "Hidden list filtering is off"
        : next
          ? "Excluded list filtering is on"
          : "Excluded list filtering is off",
    );
  };

  hiddenFilter.sw.addEventListener("click", () => onFilterToggle("hidden"));
  excludedFilter.sw.addEventListener("click", () => onFilterToggle("excluded"));

  tabHidden.addEventListener("click", () => setActiveList("hidden"));
  tabExcluded.addEventListener("click", () => setActiveList("excluded"));

  const setConfirm = (open: boolean) => {
    confirmBox.dataset.visible = open ? "true" : "false";
    clearBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  clearBtn.addEventListener("click", () => {
    const n = listAlbumEntries(activeList).length;
    if (n === 0) return;
    const label = LIST_LABEL[activeList];
    confirmText.textContent = `Clear all ${n} ${n === 1 ? label.singular : label.plural}? This updates every signed-in device.`;
    setConfirm(true);
  });

  confirmCancelBtn.addEventListener("click", () => setConfirm(false));

  confirmDeleteBtn.addEventListener("click", async () => {
    confirmDeleteBtn.disabled = true;
    clearBtn.disabled = true;
    try {
      const n = await clearAlbumList(activeList);
      setConfirm(false);
      searchInput.value = "";
      sp.showNotification(
        n === 0
          ? "Nothing to clear"
          : `Cleared ${n} album${n === 1 ? "" : "s"}`,
      );
      paint(handles, sp, activeList);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      sp.showNotification(
        code === "auth-required"
          ? "Sign in to continue"
          : "Could not clear albums",
        true,
      );
    } finally {
      confirmDeleteBtn.disabled = false;
      clearBtn.disabled = false;
    }
  });

  searchInput.addEventListener("input", () =>
    paint(handles, sp, activeList),
  );

  const offStore = subscribeAlbumLists(() => {
    if (!host.isConnected || !user) return;
    paint(handles, sp, activeList);
  });

  const offGridFilters = subscribeGridFilters((filters) => {
    if (!host.isConnected || !user) return;
    paintGridFilters(filters);
  });

  const offAuth = subscribeAuth((next) => {
    user = next;
    authSettled = true;
    if (!host.isConnected) return;
    paintAuth();
    if (user) queueMicrotask(() => searchInput.focus());
  });

  host.addEventListener("spicetify-ext-manager-dispose", () => {
    offStore();
    offGridFilters();
    offAuth();
  });

  paintAuth();
  return host;
}

function paint(
  handles: PanelHandles,
  sp: typeof Spicetify,
  list: AlbumListKind,
): void {
  const labels = LIST_LABEL[list];
  const all = listAlbumEntries(list);
  const query = handles.searchInput.value;
  const visible = filterAlbumListEntries(all, query);
  const total = all.length;
  const shown = visible.length;
  const searching = query.trim().length > 0;

  if (total === 0) {
    handles.countEl.textContent = labels.empty;
    handles.searchHintEl.textContent = "";
    handles.searchInput.disabled = true;
  } else if (!searching) {
    handles.countEl.textContent = `${total} ${total === 1 ? labels.singular : labels.plural}`;
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
    handles.listEl.appendChild(buildEmptyState(false, labels));
    return;
  }

  if (shown === 0) {
    handles.listEl.appendChild(buildEmptyState(true, labels));
    return;
  }

  for (const row of visible) {
    handles.listEl.appendChild(buildRow(row, list, sp));
  }
}

function buildEmptyState(
  noSearchMatch: boolean,
  labels: (typeof LIST_LABEL)[AlbumListKind],
): HTMLElement {
  const empty = document.createElement("div");
  empty.className = "empty";
  const emptyTitle = document.createElement("p");
  emptyTitle.className = "empty__title";
  emptyTitle.textContent = noSearchMatch
    ? "No matching albums"
    : labels.empty;
  const emptyHint = document.createElement("p");
  emptyHint.className = "empty__hint";
  emptyHint.textContent = noSearchMatch
    ? "Try another title or album ID."
    : labels.hint;
  empty.append(emptyTitle, emptyHint);
  return empty;
}

function buildRow(
  row: AlbumListEntry,
  list: AlbumListKind,
  sp: typeof Spicetify,
): HTMLElement {
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
      await removeByDocId(list, row.docId);
      sp.showNotification(
        list === "hidden" ? "Album unhidden" : "Album included",
      );
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
