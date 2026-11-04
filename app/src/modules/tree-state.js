/* Pure state for folder expansion in the sidebar tree. */

export function folderAncestors(filePath) {
  const parts = String(filePath || "").replace(/\\/g, "/").split("/").filter(Boolean);
  parts.pop(); // a file's leaf name is not a folder
  const ancestors = [];
  let path = "";
  for (const part of parts) {
    path = path ? `${path}/${part}` : part;
    ancestors.push(path);
  }
  return ancestors;
}

export function createTreeExpansionState() {
  let expanded = new Set();
  let searchSnapshot = null;
  let searching = false;
  let activeIdentity = null;

  return {
    reset() {
      expanded = new Set();
      searchSnapshot = null;
      searching = false;
      activeIdentity = null;
    },

    beginSearch(nextSearching) {
      const next = Boolean(nextSearching);
      if (next && !searching) searchSnapshot = new Set(expanded);
      else if (!next && searching) {
        expanded = new Set(searchSnapshot || []);
        searchSnapshot = null;
      }
      searching = next;
    },

    isSearching() {
      return searching;
    },

    isExpanded(path) {
      return expanded.has(path);
    },

    setExpanded(path, open) {
      if (searching) return;
      if (open) expanded.add(path);
      else expanded.delete(path);
    },

    setAll(paths, open) {
      if (searching) return;
      expanded = open ? new Set(paths) : new Set();
    },

    revealCurrent(filePath, identity) {
      if (identity === activeIdentity) return [];
      activeIdentity = identity;
      const paths = folderAncestors(filePath);
      for (const path of paths) {
        expanded.add(path);
        // Preserve the newly active document's path when a transient filter ends.
        if (searching && searchSnapshot) searchSnapshot.add(path);
      }
      return paths;
    },
  };
}
