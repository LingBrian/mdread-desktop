/* File sources: the folder/file pickers, recursive folder walking, drag & drop,
   and the read-only <input> fallbacks for browsers without File System Access. */

import { state } from "./state.js";
import { $, isMarkdown, supportsFSA } from "./dom.js";
import { isImage, resetAssets } from "./assets.js";
import { byPath } from "./util.js";
import { idbGet } from "./idb.js";
import { addRecent, addDesktopRecent, addDesktopFileRecent } from "./recents.js";
import { renderTree, resetTreeExpansion } from "./tree.js";
import { openDoc } from "./document.js";
import { toast, hint } from "./ui.js";
import { isDesktop, chooseDirectory, chooseMarkdownFiles, walkMarkdown } from "./desktop.js";
import { t } from "./i18n.js";

export async function openFolder() {
  if (isDesktop()) {
    try {
      const directory = await chooseDirectory();
      if (!directory) return;
      const files = await walkMarkdown(directory);
      files.sort(byPath);
      const last = await idbGet("lastDoc").catch(() => null);
      const target = files.find((f) => f.desktopPath === last || f.path === last) || files[0];
      if (target) {
        await openDoc(target);
        if (state.current !== target) return; // user kept the previous document open
      }
      resetAssets();
      state.rootHandle = null;
      state.rootPath = directory;
      state.rootName = directory.split(/[\\/]/).filter(Boolean).at(-1) || directory;
      addFiles(files, true);
      await addDesktopRecent(directory, state.rootName);
      toast(t("loadedFolder", { name: state.rootName, count: files.length }));
    } catch (e) {
      console.warn(e);
      const error = typeof e === "string" ? e : e?.message || e?.name || String(e);
      toast(t("openFolderFailed", { error }));
    }
    return;
  }
  if (!supportsFSA) {
    $("#dirFallback").click();
    return;
  }
  try {
    const handle = await showDirectoryPicker({ mode: "readwrite" });
    await setRoot(handle);
  } catch (e) {
    if (e.name !== "AbortError") console.warn(e);
  }
}

export async function openFiles() {
  if (isDesktop()) {
    try {
      const paths = await chooseMarkdownFiles();
      const added = paths.map((desktopPath) => ({ name: desktopPath.split(/[\\/]/).at(-1), path: desktopPath.split(/[\\/]/).at(-1), desktopPath }));
      if (!added.length) return;
      addFiles(added, !state.files.length);
      await openDoc(added[0]);
      if (state.current === added[0]) {
        for (const file of added) await addDesktopFileRecent(file.desktopPath, file.name);
      }
    } catch (e) { console.warn(e); toast(t("openFileFailed", { error: e.name || "error" })); }
    return;
  }
  if (!supportsFSA) {
    $("#fileFallback").click();
    return;
  }
  try {
    const handles = await showOpenFilePicker({ multiple: true });
    const added = [];
    for (const h of handles) {
      const f = { name: h.name, path: h.name, handle: h };
      added.push(f);
    }
    addFiles(added, /*replace*/ !state.files.length);
    if (added[0]) await openDoc(added[0]);
  } catch (e) {
    if (e.name !== "AbortError") console.warn(e);
  }
}

export async function setRoot(dirHandle) {
  const files = [];
  for await (const f of walk(dirHandle)) files.push(f);
  files.sort(byPath);
  // Let openDoc's unsaved-edit guard run before replacing the current library.
  const last = await idbGet("lastDoc").catch(() => null);
  const target = files.find((f) => f.path === last) || files[0];
  if (target) {
    await openDoc(target);
    if (state.current !== target) return;
  }
  resetAssets();
  state.rootHandle = dirHandle;
  state.rootPath = null;
  state.rootName = dirHandle.name;
  await addRecent(dirHandle);
  addFiles(files, /*replace*/ true);
  toast(t("loadedFolder", { name: dirHandle.name, count: files.length }));
}

async function* walk(dir, path = "") {
  for await (const [name, handle] of dir.entries()) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = path ? `${path}/${name}` : name;
    if (handle.kind === "file") {
      if (isMarkdown(name)) yield { name, path: p, handle, rooted: true };
    } else if (handle.kind === "directory") {
      yield* walk(handle, p);
    }
  }
}

export function addFiles(list, replace) {
  if (replace) {
    resetTreeExpansion();
    state.files = [];
  }
  // Desktop file picks can include same-named files from different directories.
  const key = (f) => f.desktopPath || f.path;
  const seen = new Set(state.files.map(key));
  for (const f of list) {
    const identity = key(f);
    if (!seen.has(identity)) {
      state.files.push(f);
      seen.add(identity);
    }
  }
  state.files.sort(byPath);
  renderTree();
}

/* drag + drop */
export async function handleDrop(dt) {
  const items = [...(dt.items || [])].filter((i) => i.kind === "file");

  // best: real File System handles (writable)
  if (items.length && items[0].getAsFileSystemHandle) {
    const handles = await Promise.all(items.map((i) => i.getAsFileSystemHandle().catch(() => null)));
    const valid = handles.filter(Boolean);
    const dir = valid.find((h) => h.kind === "directory");
    if (dir) {
      await setRoot(dir);
      return;
    }
    const fileHandles = valid.filter((h) => h.kind === "file" && isMarkdown(h.name));
    if (fileHandles.length) {
      const added = fileHandles.map((h) => ({ name: h.name, path: h.name, handle: h }));
      addFiles(added, !state.files.length);
      await openDoc(added[0]);
      return;
    }
  }

  // fallback: directory entries (read-only)
  if (items.length && items[0].webkitGetAsEntry) {
    const entries = items.map((i) => i.webkitGetAsEntry()).filter(Boolean);
    // A dropped folder replaces the one open; loose files join it.
    if (entries.some((e) => e.isDirectory)) {
      resetAssets();
      state.rootHandle = null;
    }
    const collected = [];
    for (const e of entries) await readEntry(e, "", collected);
    if (collected.length) {
      state.rootName = entries[0]?.isDirectory ? entries[0].name : "";
      collected.sort(byPath);
      addFiles(collected, !state.files.length);
      await openDoc(collected[0]);
      hint(t("readOnlyOpened"));
      return;
    }
  }

  // last resort: plain files
  const files = [...(dt.files || [])].filter((f) => isMarkdown(f.name));
  if (files.length) {
    const added = files.map((f) => ({ name: f.name, path: f.webkitRelativePath || f.name, file: f }));
    addFiles(added, !state.files.length);
    await openDoc(added[0]);
  }
}

function readEntry(entry, path, out) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      const p = path ? `${path}/${entry.name}` : entry.name;
      if (isImage(entry.name)) {
        entry.file((file) => {
          state.assets.set(p, file);
          resolve();
        }, resolve);
        return;
      }
      if (!isMarkdown(entry.name)) return resolve();
      entry.file((file) => {
        out.push({ name: entry.name, path: p, file });
        resolve();
      }, resolve);
    } else if (entry.isDirectory) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") return resolve();
      const reader = entry.createReader();
      const all = [];
      const readBatch = () =>
        reader.readEntries(async (batch) => {
          if (!batch.length) {
            for (const e of all) await readEntry(e, path ? `${path}/${entry.name}` : entry.name, out);
            return resolve();
          }
          all.push(...batch);
          readBatch();
        }, resolve);
      readBatch();
    } else resolve();
  });
}

/* fallback inputs (browsers without the File System Access API). Wired from main. */
export function wireFallbackInputs() {
  $("#dirFallback").addEventListener("change", (e) => {
    const files = [...e.target.files].filter((f) => isMarkdown(f.name));
    if (!files.length) return;
    resetAssets();
    state.rootHandle = null;
    for (const f of e.target.files) if (isImage(f.name)) state.assets.set(f.webkitRelativePath || f.name, f);
    const added = files.map((f) => ({ name: f.name, path: f.webkitRelativePath || f.name, file: f }));
    state.rootName = files[0].webkitRelativePath?.split("/")[0] || "";
    addFiles(added, true);
    openDoc(added[0]);
    hint(t("readOnlyOpened"));
  });
  $("#fileFallback").addEventListener("change", (e) => {
    const files = [...e.target.files].filter((f) => isMarkdown(f.name));
    if (!files.length) return;
    const added = files.map((f) => ({ name: f.name, path: f.name, file: f }));
    addFiles(added, !state.files.length);
    openDoc(added[0]);
  });
}
