/* The file tree in the sidebar: nested folders, the active/dirty markers, the
   "current folder" chip, and closing the library back to the welcome screen. */

import { state } from "./state.js";
import { $$, tree, treeControls, curFolder, curFolderName, searchInput, app, reading, tocList, docName, docSub, MD_RE } from "./dom.js";
import { escapeHtml } from "./util.js";
import { idbSet } from "./idb.js";
import { openDoc } from "./document.js";
import { setText } from "./editor.js";
import { openSearch } from "./search.js";
import { renderBacklinks } from "./links.js";
import { resetAssets } from "./assets.js";
import { renderRecents } from "./recents.js";
import { setMode, setSidebar } from "./view.js";
import { savePos } from "./scroll.js";
import { t } from "./i18n.js";
import { createTreeExpansionState } from "./tree-state.js";

const expansion = createTreeExpansionState();
document.addEventListener("mdread:language", () => renderTree());

export function resetTreeExpansion() {
  expansion.reset();
}

export function expandAllFolders() {
  const folders = $$("details[data-tree-path]", tree);
  expansion.setAll(folders.map((folder) => folder.dataset.treePath), true);
  folders.forEach((folder) => { folder.open = true; });
}

export function collapseAllFolders() {
  const folders = $$("details[data-tree-path]", tree);
  expansion.setAll(folders.map((folder) => folder.dataset.treePath), false);
  folders.forEach((folder) => { folder.open = false; });
}

function revealCurrentFolders() {
  const file = state.current;
  const identity = file ? file.desktopPath || file.path : null;
  const paths = expansion.revealCurrent(file?.path, identity);
  if (!paths.length) return;
  for (const folder of $$("details[data-tree-path]", tree)) {
    if (paths.includes(folder.dataset.treePath)) folder.open = true;
  }
}

export function updateCurrentFolder() {
  const has = state.files.length > 0 || state.current != null;
  curFolder.hidden = !has;
  if (!has) return;
  curFolderName.textContent =
    state.rootName ||
    (state.files.length
      ? state.files.length === 1 ? t("oneFile") : t("manyFiles", { count: state.files.length })
      : state.current
      ? state.current.name.replace(MD_RE, "")
      : t("document"));
}

// Clear the current library/document and return to the welcome screen.
export function closeLibrary() {
  if (state.files.some((f) => f.dirty) && !confirm(t("closeLibraryConfirm"))) return;
  if (state.current) savePos(state.current);
  resetTreeExpansion();
  state.files = [];
  state.current = null;
  state.rootHandle = null;
  state.rootPath = null;
  state.rootName = "";
  resetAssets();
  state.filter = "";
  searchInput.value = "";
  idbSet("lastDoc", "").catch(() => {});
  app.dataset.hasDoc = "false";
  reading.innerHTML = "";
  setText("");
  tocList.innerHTML = "";
  docName.textContent = t("noDoc");
  docSub.textContent = "";
  setMode("read");
  renderTree();
  renderRecents();
  renderBacklinks();
}

export function renderTree() {
  updateCurrentFolder();
  const q = state.filter.toLowerCase();
  expansion.beginSearch(!!q);
  revealCurrentFolders();
  const files = q ? state.files.filter((f) => f.path.toLowerCase().includes(q)) : state.files;
  const hasFolders = state.files.some((file) => file.path.includes("/"));
  treeControls.hidden = !hasFolders || !!q;
  tree.innerHTML = "";

  if (!files.length) {
    if (state.files.length) {
      const empty = document.createElement("p");
      empty.className = "tree-empty";
      empty.textContent = t("treeNoFileNameMatch");
      const search = document.createElement("button");
      const query = state.filter;
      search.className = "tree-empty__search";
      search.type = "button";
      search.textContent = t("treeSearchInside", { query });
      search.addEventListener("click", () => openSearch(query));
      tree.append(empty, search);
    }
    return;
  }

  // build nested structure
  const root = { dirs: new Map(), files: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const d = parts[i];
      if (!node.dirs.has(d)) node.dirs.set(d, { dirs: new Map(), files: [] });
      node = node.dirs.get(d);
    }
    node.files.push(f);
  }
  tree.appendChild(renderNode(root, "", !!q));
}

function renderNode(node, prefix, expand) {
  const frag = document.createDocumentFragment();
  for (const [name, child] of [...node.dirs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const path = prefix ? `${prefix}/${name}` : name;
    const details = document.createElement("details");
    details.dataset.treePath = path;
    details.open = expand || expansion.isExpanded(path);
    details.addEventListener("toggle", () => expansion.setExpanded(path, details.open));
    const summary = document.createElement("summary");
    summary.innerHTML = `<span class="caret"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>${escapeHtml(name)}</span>`;
    details.appendChild(summary);
    const kids = document.createElement("div");
    kids.className = "kids";
    kids.appendChild(renderNode(child, path, expand));
    details.appendChild(kids);
    frag.appendChild(details);
  }
  for (const f of node.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "file";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    if (f === state.current) btn.classList.add("is-active");
    if (f.dirty) btn.classList.add("is-dirty");
    btn.dataset.path = f.path;
    btn.dataset.desktopPath = f.desktopPath || "";
    const label = f.draft && f.name === "Untitled.md" ? t("untitled") : f.name.replace(MD_RE, "");
    btn.innerHTML = `<span class="dot">●</span><span class="file__name">${escapeHtml(label)}</span>`;
    btn.addEventListener("click", () => {
      openDoc(f);
      if (innerWidth <= 820) setSidebar(false);
    });
    frag.appendChild(btn);
  }
  return frag;
}

export function refreshTreeState() {
  revealCurrentFolders();
  for (const btn of $$(".file", tree)) {
    const key = btn.dataset.desktopPath || btn.dataset.path;
    const f = state.files.find((x) => (x.desktopPath || x.path) === key);
    btn.classList.toggle("is-active", f === state.current);
    btn.classList.toggle("is-dirty", !!f?.dirty);
  }
}
