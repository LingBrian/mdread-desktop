import { describe, expect, it } from "vitest";
import { isFileContextMenuShortcut } from "../src/modules/file-context-menu-shortcut.js";

describe("file context menu keyboard shortcut", () => {
  it("accepts Shift+F10 using key or code values", () => {
    expect(isFileContextMenuShortcut({ key: "F10", code: "F10", shiftKey: true })).toBe(true);
    expect(isFileContextMenuShortcut({ key: "Unidentified", code: "F10", shiftKey: true })).toBe(true);
  });

  it("accepts the context-menu key and legacy key code", () => {
    expect(isFileContextMenuShortcut({ key: "ContextMenu" })).toBe(true);
    expect(isFileContextMenuShortcut({ key: "Unidentified", code: "ContextMenu" })).toBe(true);
    expect(isFileContextMenuShortcut({ keyCode: 93 })).toBe(true);
  });

  it("does not intercept unrelated keys or unmodified F10", () => {
    expect(isFileContextMenuShortcut({ key: "F10", code: "F10", shiftKey: false })).toBe(false);
    expect(isFileContextMenuShortcut({ key: "Enter", code: "Enter", shiftKey: false })).toBe(false);
  });
});
