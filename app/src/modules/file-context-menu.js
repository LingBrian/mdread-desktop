/* Context actions for Markdown files in the sidebar. Mutating actions are
   available only for files inside a writable folder opened by the app. */

import { state, positions, savePositions } from "./state.js";
import { app, docName, MD_RE } from "./dom.js";
import { isDesktop, copyPath as copyDiskPath, listDirectory, readPath, removePath, renamePath, writePath } from "./desktop.js";
import { openDoc, updateSub } from "./document.js";
import { closeLibrary, renderTree } from "./tree.js";
import { getText } from "./editor.js";
import { idbGet, idbSet } from "./idb.js";
import { toast } from "./ui.js";
import { t } from "./i18n.js";
import { byPath } from "./util.js";

let menu = null;
let outsidePointer = null;
let menuKeydown = null;
let menuSource = null;

function pathParts(path) {
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return { parent: slash >= 0 ? path.slice(0, slash) : "", leaf: path.slice(slash + 1) };
}

function replaceLeaf(path, leaf) {
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return `${path.slice(0, slash + 1)}${leaf}`;
}

function isWithinRoot(path, root) {
  const normalize = (value) => value.replace(/\\/g, "/").replace(/\/+$/, "").toLocaleLowerCase();
  const child = normalize(path);
  const parent = normalize(root);
  return child === parent || child.startsWith(`${parent}/`);
}

function canManage(file) {
  if (isDesktop()) return !!(state.rootPath && file.desktopPath && isWithinRoot(file.desktopPath, state.rootPath));
  return !!(state.rootHandle && file.rooted === true && file.handle && file.path && !file.draft);
}

async function browserParent(file) {
  if (!state.rootHandle || !file.handle) throw new Error(t("contextUnavailable"));
  const parts = file.path.split("/");
  const leaf = parts.pop();
  let directory = state.rootHandle;
  for (const part of parts) directory = await directory.getDirectoryHandle(part);
  return { directory, leaf };
}

async function siblingNames(file) {
  if (isDesktop()) {
    const { parent } = pathParts(file.desktopPath);
    return (await listDirectory(parent)).map((entry) => entry.name);
  }
  const { directory } = await browserParent(file);
  const names = [];
  for await (const [name] of directory.entries()) names.push(name);
  return names;
}

const keyName = (name) => isDesktop() && navigator.platform.toLowerCase().includes("win") ? name.toLocaleLowerCase() : name;

function uniqueCopyName(name, names) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";
  const occupied = new Set(names.map(keyName));
  for (let index = 1; ; index++) {
    const suffix = index === 1 ? " (copy)" : ` (copy ${index})`;
    const candidate = `${base}${suffix}${extension}`;
    if (!occupied.has(keyName(candidate))) return candidate;
  }
}

function normalizeNewName(value, oldName) {
  let name = value.trim();
  if (!name || /[<>:"\x2f\\|?*\u0000-\u001f]/.test(name) || /[. ]$/.test(name) || name === "." || name === "..") {
    throw new Error(t("contextInvalidName"));
  }
  if (!MD_RE.test(name)) {
    if (/\.[^.\x2f\\]+$/.test(name)) throw new Error(t("contextMarkdownName"));
    const extension = oldName.match(/\.(md|markdown|mdown|mkd|mkdn|mdwn|mdx|txt)$/i)?.[0] || ".md";
    name += extension;
  }
  return name;
}

function relativePathWithName(file, name) {
  const slash = file.path.lastIndexOf("/");
  return `${slash >= 0 ? file.path.slice(0, slash + 1) : ""}${name}`;
}

async function ensureNoCollision(file, name) {
  const { leaf } = isDesktop() ? pathParts(file.desktopPath) : await browserParent(file);
  const occupied = new Set((await siblingNames(file)).map(keyName));
  const requested = keyName(name);
  if (requested !== keyName(leaf) && occupied.has(requested)) throw new Error(t("contextNameExists"));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {}
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error(t("contextCopyFailed"));
}

function syncEditorContent(file) {
  if (file === state.current && app.dataset.mode !== "read") file.content = getText();
}

async function renameBrowserFile(file, newName) {
  const { directory, leaf } = await browserParent(file);
  const source = await file.handle.getFile();
  const destination = await directory.getFileHandle(newName, { create: true });
  try {
    const writer = await destination.createWritable();
    await writer.write(source);
    await writer.close();
    await directory.removeEntry(leaf);
    file.lastModified = source.lastModified;
    return destination;
  } catch (error) {
    await directory.removeEntry(newName).catch(() => {});
    throw error;
  }
}

async function duplicateBrowserFile(file, newName) {
  const { directory } = await browserParent(file);
  const destination = await directory.getFileHandle(newName, { create: true });
  try {
    const writer = await destination.createWritable();
    await writer.write(file.dirty ? file.content : await file.handle.getFile());
    await writer.close();
    return destination;
  } catch (error) {
    await directory.removeEntry(newName).catch(() => {});
    throw error;
  }
}

async function updateRenamedState(file, oldIdentity, oldRelativePath, newName, newDesktopPath, newHandle) {
  const oldPosition = positions[oldIdentity] ?? positions[oldRelativePath];
  if (oldPosition != null) {
    positions[newDesktopPath || relativePathWithName(file, newName)] = oldPosition;
    delete positions[oldIdentity];
    delete positions[oldRelativePath];
    savePositions();
  }
  file.name = newName;
  file.path = relativePathWithName(file, newName);
  if (isDesktop()) file.desktopPath = newDesktopPath;
  else file.handle = newHandle;
  if (file === state.current) {
    docName.textContent = file.name.replace(MD_RE, "");
    updateSub();
  }
  const lastDoc = await idbGet("lastDoc").catch(() => null);
  if (lastDoc === oldIdentity || lastDoc === oldRelativePath) {
    await idbSet("lastDoc", file.desktopPath || file.path).catch(() => {});
  }
  renderTree();
}

async function renameFile(file) {
  if (!canManage(file)) return;
  const input = prompt(t("contextRenamePrompt", { name: file.name }), file.name);
  if (input == null) return;
  const newName = normalizeNewName(input, file.name);
  if (newName === file.name) return;
  await ensureNoCollision(file, newName);
  syncEditorContent(file);

  const oldIdentity = file.desktopPath || file.path;
  const oldRelativePath = file.path;
  if (isDesktop()) {
    const newDesktopPath = replaceLeaf(file.desktopPath, newName);
    await renamePath(file.desktopPath, newDesktopPath);
    await updateRenamedState(file, oldIdentity, oldRelativePath, newName, newDesktopPath, null);
  } else {
    const newHandle = await renameBrowserFile(file, newName);
    await updateRenamedState(file, oldIdentity, oldRelativePath, newName, null, newHandle);
  }
  toast(t("contextRenamed", { name: newName }));
}

async function duplicateFile(file) {
  if (!canManage(file)) return;
  const newName = uniqueCopyName(file.name, await siblingNames(file));
  syncEditorContent(file);
  const relativePath = relativePathWithName(file, newName);
  let newDesktopPath = null;
  let newHandle = null;

  if (isDesktop()) {
    newDesktopPath = replaceLeaf(file.desktopPath, newName);
    if (file.dirty) await writePath(newDesktopPath, file.content ?? await readPath(file.desktopPath));
    else await copyDiskPath(file.desktopPath, newDesktopPath);
  } else {
    newHandle = await duplicateBrowserFile(file, newName);
  }

  const copy = {
    ...file,
    name: newName,
    path: relativePath,
    desktopPath: newDesktopPath || undefined,
    handle: newHandle || undefined,
    file: undefined,
    dirty: false,
    draft: false,
  };
  state.files.push(copy);
  state.files.sort(byPath);
  renderTree();
  toast(t("contextDuplicated", { name: newName }));
}

async function deleteFile(file) {
  if (!canManage(file)) return;
  if (!confirm(t("contextDeleteConfirm", { name: file.name }))) return;
  const oldIdentity = file.desktopPath || file.path;
  const wasCurrent = file === state.current;
  if (isDesktop()) await removePath(file.desktopPath);
  else {
    const { directory, leaf } = await browserParent(file);
    await directory.removeEntry(leaf);
  }

  file.dirty = false;
  state.files = state.files.filter((entry) => entry !== file);

  if (wasCurrent) {
    const next = state.files[0];
    if (next) {
      await openDoc(next);
      renderTree();
    } else closeLibrary();
  } else renderTree();

  delete positions[oldIdentity];
  delete positions[file.path];
  savePositions();
  const lastDoc = await idbGet("lastDoc").catch(() => null);
  if (lastDoc === oldIdentity || lastDoc === file.path) {
    const next = state.current || state.files[0];
    await idbSet("lastDoc", next ? next.desktopPath || next.path : "").catch(() => {});
  }
  toast(t("contextDeleted", { name: file.name }));
}

function errorText(error) {
  return typeof error === "string" ? error : error?.message || error?.name || String(error);
}

function focusFileRow(source) {
  const target = source?.isConnected ? source : document.querySelector(".file.is-active");
  target?.focus();
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menu) return;
  const source = menuSource;
  menu.remove();
  menu = null;
  menuSource = null;
  source?.setAttribute("aria-expanded", "false");
  source?.removeAttribute("aria-controls");
  document.removeEventListener("pointerdown", outsidePointer, true);
  document.removeEventListener("keydown", menuKeydown, true);
  if (restoreFocus) focusFileRow(source);
}

function addItem(label, action, { disabled = false, danger = false } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `file-context-menu__item${danger ? " is-danger" : ""}`;
  button.setAttribute("role", "menuitem");
  button.textContent = t(label);
  button.disabled = disabled;
  button.addEventListener("click", async () => {
    const source = menuSource;
    closeMenu();
    try {
      await action();
    } catch (error) {
      console.warn("file context action", error);
      toast(t("contextActionFailed", { error: errorText(error) }));
    } finally {
      focusFileRow(source);
    }
  });
  menu.appendChild(button);
  return button;
}

function addSeparator() {
  const separator = document.createElement("div");
  separator.className = "file-context-menu__separator";
  separator.setAttribute("role", "separator");
  menu.appendChild(separator);
}

export function showFileContextMenu(event, file, sourceElement = event.target?.closest?.(".file")) {
  event.preventDefault();
  closeMenu();
  menuSource = sourceElement;
  const manageable = canManage(file);
  menu = document.createElement("div");
  menu.id = "fileContextMenu";
  menu.className = "file-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", t("contextMenuLabel", { name: file.name }));
  menuSource?.setAttribute("aria-expanded", "true");
  menuSource?.setAttribute("aria-controls", menu.id);
  addItem("contextOpen", () => openDoc(file));
  addItem("contextDuplicate", () => duplicateFile(file), { disabled: !manageable });
  addItem("contextCopyPath", () => copyToClipboard(file.desktopPath || file.path));
  addSeparator();
  addItem("contextRename", () => renameFile(file), { disabled: !manageable });
  addItem("contextDelete", () => deleteFile(file), { disabled: !manageable, danger: true });
  document.body.appendChild(menu);

  const rect = menuSource?.getBoundingClientRect();
  const x = event.type === "keydown" && rect ? rect.left : event.clientX;
  const y = event.type === "keydown" && rect ? rect.bottom : event.clientY;
  const left = Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8));
  const top = Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8));
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  outsidePointer = (pointerEvent) => {
    if (!menu?.contains(pointerEvent.target)) closeMenu();
  };
  menuKeydown = (keyEvent) => {
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }
    const items = [...menu.querySelectorAll("button:not(:disabled)")];
    const index = items.indexOf(document.activeElement);
    if (keyEvent.key === "ArrowDown" || keyEvent.key === "ArrowUp") {
      keyEvent.preventDefault();
      const delta = keyEvent.key === "ArrowDown" ? 1 : -1;
      items[(index + delta + items.length) % items.length]?.focus();
    }
  };
  document.addEventListener("pointerdown", outsidePointer, true);
  document.addEventListener("keydown", menuKeydown, true);
  menu.querySelector("button:not(:disabled)")?.focus();
}
