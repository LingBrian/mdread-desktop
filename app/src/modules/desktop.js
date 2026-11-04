/* Native file system adapter. Web mode continues using the browser APIs. */
import { isTauri } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { copyFile as fsCopyFile, readDir, readTextFile, remove as fsRemove, rename as fsRename, writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { t } from "./i18n.js";

export const isDesktop = () => isTauri();
const extensions = ["md", "markdown", "mdown", "mkd", "mkdn", "mdwn", "mdx", "txt"];

export async function chooseDirectory() {
  const selected = await open({ directory: true, multiple: false, recursive: true, title: t("openFolderTitle") });
  return typeof selected === "string" ? selected : null;
}
export async function chooseMarkdownFiles() {
  const selected = await open({ multiple: true, filters: [{ name: t("markdownFileType"), extensions }] });
  return selected ? (Array.isArray(selected) ? selected : [selected]) : [];
}
export async function chooseSavePath(name) {
  return await save({ title: t("saveTitle"), defaultPath: name, filters: [{ name: t("markdownFileType"), extensions }] });
}
export async function readPath(path) { return await readTextFile(path); }
export async function writePath(path, content) { return await writeTextFile(path, content); }
export async function listDirectory(path) { return await readDir(path); }
export async function copyPath(source, destination) { return await fsCopyFile(source, destination); }
export async function removePath(path) { return await fsRemove(path); }
export async function renamePath(source, destination) { return await fsRename(source, destination); }

export async function walkMarkdown(directory, relative = "") {
  const entries = await readDir(directory);
  const result = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const childPath = await join(directory, entry.name);
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory) result.push(...await walkMarkdown(childPath, rel));
    else if (entry.isFile && /\.(md|markdown|mdown|mkd|mkdn|mdwn|mdx|txt)$/i.test(entry.name)) {
      result.push({ name: entry.name, path: rel, desktopPath: childPath });
    }
  }
  return result;
}
