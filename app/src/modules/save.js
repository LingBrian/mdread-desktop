/* Saving: write straight back to disk via a File System Access handle when we
   have one, fall back to a "Save As" picker for drafts, and download otherwise. */

import { state } from "./state.js";
import { app, docName, MD_RE, supportsFSA } from "./dom.js";
import { getText } from "./editor.js";
import { ensureMd } from "./util.js";
import { renderMarkdown } from "./markdown.js";
import { renderTree, refreshTreeState } from "./tree.js";
import { updateSub } from "./document.js";
import { toast } from "./ui.js";
import { isDesktop, chooseSavePath, writePath } from "./desktop.js";
import { t } from "./i18n.js";

// Record the mtime of what we just wrote, so the focus check in document.js
// doesn't mistake our own save for an outside change.
async function noteWritten(f) {
  try {
    f.lastModified = (await f.handle.getFile()).lastModified;
  } catch {}
}

async function ensureWrite(handle) {
  const opts = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
}

export async function saveDoc() {
  const f = state.current;
  if (!f) return;
  // commit editor content if in an edit view
  if (app.dataset.mode !== "read") f.content = getText();

  if (isDesktop()) {
    try {
      const targetPath = f.desktopPath || await chooseSavePath(ensureMd(f.name || "Untitled.md"));
      if (!targetPath) return;
      await writePath(targetPath, f.content);
      f.desktopPath = targetPath;
      f.draft = false;
      f.dirty = false;
      f.name = targetPath.split(/[\\/]/).at(-1);
      f.path = f.name;
      docName.textContent = f.name.replace(MD_RE, "");
      updateSub();
      renderTree();
      refreshTreeState();
      renderMarkdown(f.content);
      toast(t("saved"));
      return;
    } catch (e) {
      console.warn(e);
      toast(t("saveFailed", { error: e.name || "error" }));
      return;
    }
  }

  // No file on disk yet (new draft, or a read-only dropped file): offer "Save As".
  if (!f.handle && supportsFSA && window.showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: ensureMd(f.name || "Untitled"),
        types: [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown", ".mdown", ".txt"] } }],
      });
      const w = await handle.createWritable();
      await w.write(f.content);
      await w.close();
      f.handle = handle;
      await noteWritten(f);
      f.draft = false;
      f.name = handle.name;
      f.dirty = false;
      docName.textContent = f.name.replace(MD_RE, "");
      updateSub();
      renderTree();
      refreshTreeState();
      renderMarkdown(f.content);
      toast(t("saved"));
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
      console.warn(e);
    }
  }

  if (f.handle && f.handle.createWritable) {
    try {
      if (await ensureWrite(f.handle)) {
        const w = await f.handle.createWritable();
        await w.write(f.content);
        await w.close();
        await noteWritten(f);
        f.dirty = false;
        updateSub();
        refreshTreeState();
        renderMarkdown(f.content);
        toast(t("saved"));
        return;
      }
    } catch (e) {
      console.warn(e);
    }
  }
  downloadDoc();
  f.dirty = false;
  updateSub();
  refreshTreeState();
}

export function downloadDoc() {
  const f = state.current;
  if (!f) return;
  if (app.dataset.mode !== "read") f.content = getText();
  const blob = new Blob([f.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = f.name.endsWith(".md") || MD_RE.test(f.name) ? f.name : f.name + ".md";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(t("downloaded"));
}
