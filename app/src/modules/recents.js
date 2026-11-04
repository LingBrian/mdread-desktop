/* Recently-opened folders: stored as live FS handles in IndexedDB and surfaced
   both in the sidebar list and as pills on the welcome screen. */

import { idbGet, idbSet } from "./idb.js";
import { state } from "./state.js";
import { escapeHtml, relTime } from "./util.js";
import { FOLDER_SVG, recentsWrap, recentsList, welcomeRecent, welcomeRecentList } from "./dom.js";
import { setRoot, addFiles } from "./files.js";
import { openDoc } from "./document.js";
import { closeLibrary } from "./tree.js";
import { setSidebar } from "./view.js";
import { toast } from "./ui.js";
import { isDesktop, walkMarkdown } from "./desktop.js";
import { t } from "./i18n.js";

const FILE_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

export const getRecents = () =>
  idbGet("recents")
    .then((v) => v || [])
    .catch(() => []);

export async function addDesktopRecent(path, name) {
  const list = await getRecents();
  const kept = list.filter((r) => r.path !== path);
  kept.unshift({ name, path, desktop: true, ts: Date.now() });
  await idbSet("recents", kept.slice(0, 10)).catch(() => {});
  await renderRecents();
}

export async function addDesktopFileRecent(path, name) {
  const list = await getRecents();
  const kept = list.filter((r) => !(r.desktopFile && r.path === path));
  kept.unshift({ name, path, desktop: true, desktopFile: true, ts: Date.now() });
  await idbSet("recents", kept.slice(0, 10)).catch(() => {});
  await renderRecents();
}

export async function addRecent(handle) {
  const list = await getRecents();
  const kept = list.filter((r) => r.name !== handle.name); // newest wins, dedupe by name
  kept.unshift({ name: handle.name, kind: handle.kind || "directory", handle, ts: Date.now() });
  await idbSet("recents", kept.slice(0, 10)).catch(() => {});
  await renderRecents();
}

export async function removeRecent(entry) {
  const name = typeof entry === "string" ? entry : entry.name;
  const entryPath = typeof entry === "string" ? null : entry.path;
  const wasActive = entryPath ? entryPath === state.rootPath : name === state.rootName;
  if (wasActive) {
    closeLibrary(); // can be cancelled when the library contains unsaved edits
    if (entryPath ? state.rootPath === entryPath : state.rootName === name) return;
  }
  const list = await getRecents();
  await idbSet(
    "recents",
    list.filter((r) => entryPath ? r.path !== entryPath : r.name !== name)
  ).catch(() => {});
  await renderRecents();
  toast(t("removedRecent", { name }));
}

export async function openRecent(entry) {
  if (isDesktop() && entry.desktopFile && entry.path) {
    try {
      const file = { name: entry.name, path: entry.name, desktopPath: entry.path };
      await openDoc(file);
      if (state.current !== file) return;
      state.rootHandle = null;
      state.rootPath = null;
      state.rootName = "";
      addFiles([file], true);
    } catch (e) {
      console.warn(e);
      toast(t("recentUnavailable"));
    }
    return;
  }
  if (isDesktop() && entry.desktop && entry.path) {
    try {
      const files = await walkMarkdown(entry.path);
      files.sort((a, b) => a.path.localeCompare(b.path));
      const last = await idbGet("lastDoc").catch(() => null);
      const target = files.find((f) => f.desktopPath === last) || files[0];
      if (target) {
        await openDoc(target);
        if (state.current !== target) return;
      }
      state.rootPath = entry.path;
      state.rootName = entry.name;
      addFiles(files, true);
    } catch (e) { console.warn(e); toast(t("reopenFailed")); }
    return;
  }
  const h = entry.handle;
  if (!h) return;
  try {
    let perm = await h.queryPermission({ mode: "readwrite" });
    if (perm !== "granted") perm = await h.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      toast(t("permissionNeeded"));
      return;
    }
    await setRoot(h);
    if (innerWidth <= 820) setSidebar(false);
  } catch (e) {
    console.warn(e);
    toast(t("recentUnavailable"));
  }
}

export async function renderRecents() {
  const list = await getRecents();

  recentsWrap.hidden = !list.length;
  if (list.length) {
    recentsList.innerHTML = "";
    for (const entry of list) {
      const b = document.createElement("button");
      b.className = "recent-item" + ((entry.path && state.rootPath === entry.path) || (!entry.path && entry.name === state.rootName) ? " is-active" : "");
      b.title = entry.name;
      b.innerHTML = `${entry.desktopFile ? FILE_SVG : FOLDER_SVG}<span class="recent-item__name">${escapeHtml(entry.name)}</span><span class="recent-item__time">${relTime(entry.ts)}</span><span class="recent-item__rm" role="button" aria-label="${escapeHtml(t("removeRecentLabel", { name: entry.name }))}" title="${escapeHtml(t("removeRecentTitle"))}">×</span>`;
      b.addEventListener("click", () => openRecent(entry));
      b.querySelector(".recent-item__rm").addEventListener("click", (e) => {
        e.stopPropagation();
        removeRecent(entry);
      });
      recentsList.appendChild(b);
    }
  }

  welcomeRecent.hidden = !list.length;
  if (list.length) {
    welcomeRecentList.innerHTML = "";
    for (const entry of list.slice(0, 6)) {
      const b = document.createElement("button");
      b.className = "recent-pill";
      b.title = entry.name;
      b.innerHTML = `${entry.desktopFile ? FILE_SVG : FOLDER_SVG}<span>${escapeHtml(entry.name)}</span><span class="recent-pill__rm" role="button" aria-label="${escapeHtml(t("removeRecentLabel", { name: entry.name }))}" title="${escapeHtml(t("removeRecentTitle"))}">×</span>`;
      b.addEventListener("click", () => openRecent(entry));
      b.querySelector(".recent-pill__rm").addEventListener("click", (e) => {
        e.stopPropagation();
        removeRecent(entry);
      });
      welcomeRecentList.appendChild(b);
    }
  }
}
