/* Keyboard equivalents for opening the file row context menu. */
export function isFileContextMenuShortcut(event) {
  const menuKey = event.key === "ContextMenu" || event.key === "Apps" || event.code === "ContextMenu" || event.keyCode === 93;
  const shiftF10 = event.shiftKey && (event.key === "F10" || event.code === "F10" || event.keyCode === 121);
  return menuKey || shiftF10;
}
