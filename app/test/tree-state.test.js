import { describe, expect, it } from "vitest";
import { createTreeExpansionState, folderAncestors } from "../src/modules/tree-state.js";

describe("folderAncestors", () => {
  it("returns each folder prefix for a nested file", () => {
    expect(folderAncestors("guide/chapter/intro.md")).toEqual(["guide", "guide/chapter"]);
  });

  it("normalizes Windows separators and ignores a top-level file", () => {
    expect(folderAncestors("guide\\chapter\\intro.md")).toEqual(["guide", "guide/chapter"]);
    expect(folderAncestors("intro.md")).toEqual([]);
  });
});

describe("tree expansion state", () => {
  it("starts collapsed and reveals only the active file's ancestor folders", () => {
    const tree = createTreeExpansionState();
    expect(tree.isExpanded("guide")).toBe(false);
    expect(tree.revealCurrent("guide/chapter/intro.md", "guide/chapter/intro.md")).toEqual(["guide", "guide/chapter"]);
    expect(tree.isExpanded("guide")).toBe(true);
    expect(tree.isExpanded("guide/chapter")).toBe(true);
    expect(tree.isExpanded("other")).toBe(false);
    expect(tree.revealCurrent("guide/chapter/intro.md", "guide/chapter/intro.md")).toEqual([]);
  });

  it("keeps manual expansion changes across renders", () => {
    const tree = createTreeExpansionState();
    tree.setExpanded("guide", true);
    tree.setExpanded("other", true);
    expect(tree.isExpanded("guide")).toBe(true);
    expect(tree.isExpanded("other")).toBe(true);
  });

  it("temporarily searches with auto-expanded paths then restores the prior state", () => {
    const tree = createTreeExpansionState();
    tree.setExpanded("manual", true);
    tree.beginSearch(true);
    tree.setExpanded("search/result", true); // transient tree toggles never persist
    expect(tree.isSearching()).toBe(true);
    tree.beginSearch(false);
    expect(tree.isSearching()).toBe(false);
    expect(tree.isExpanded("manual")).toBe(true);
    expect(tree.isExpanded("search/result")).toBe(false);
  });

  it("keeps the newly active document path when a search is cleared", () => {
    const tree = createTreeExpansionState();
    tree.beginSearch(true);
    tree.revealCurrent("docs/new/file.md", "docs/new/file.md");
    tree.beginSearch(false);
    expect(tree.isExpanded("docs")).toBe(true);
    expect(tree.isExpanded("docs/new")).toBe(true);
  });

  it("expands/collapses all and resets when a library is replaced", () => {
    const tree = createTreeExpansionState();
    tree.setAll(["a", "a/b", "c"], true);
    expect(tree.isExpanded("a/b")).toBe(true);
    tree.setAll(["a", "a/b", "c"], false);
    expect(tree.isExpanded("a")).toBe(false);
    tree.setExpanded("manual", true);
    tree.reset();
    expect(tree.isExpanded("manual")).toBe(false);
    expect(tree.isSearching()).toBe(false);
  });
});
