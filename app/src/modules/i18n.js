/* Runtime localization for the reader, dialogs, and desktop-facing controls. */
import { prefs, savePrefs, state } from "./state.js";

const messages = {
  en: {
    openFolderTitle: "Open Markdown folder", markdownFileType: "Markdown", saveTitle: "Save Markdown file",
    loadedFolder: "Loaded “{name}” — {count} files", openFolderFailed: "Could not open folder ({error})",
    openFileFailed: "Could not open file ({error})", saveFailed: "Could not save file ({error})",
    contextMenuLabel: "Actions for {name}", contextOpen: "Open", contextDuplicate: "Create copy", contextCopyPath: "Copy path", contextRename: "Rename…", contextDelete: "Delete…",
    contextRenamePrompt: "Rename “{name}” to:", contextDeleteConfirm: "Delete “{name}” from disk? This cannot be undone.", contextActionFailed: "Could not complete the file action ({error})",
    contextRenamed: "Renamed to “{name}” ✓", contextDuplicated: "Created “{name}” ✓", contextDeleted: "Deleted “{name}”",
    contextInvalidName: "Enter a valid file name.", contextMarkdownName: "Use a Markdown extension such as .md or .txt.", contextNameExists: "A file with that name already exists.",
    contextUnavailable: "This file is no longer available", contextCopyFailed: "Could not copy to the clipboard",
    treeNoFileNameMatch: "No file names match.", treeSearchInside: "Search inside files for “{query}”",
    saved: "Saved to disk ✓", downloaded: "Downloaded", removedRecent: "Removed “{name}” from recents",
    reopenFailed: "Could not reopen this folder — it may have moved", permissionNeeded: "Permission needed to open that folder",
    recentUnavailable: "Couldn’t open — the folder may have moved or been removed", removeRecentLabel: "Remove {name} from recents", removeRecentTitle: "Remove", readFailed: "Could not read file ({error})",
    diskChanged: "Reloaded — file changed on disk", leaveUnsaved: "“{name}” has unsaved edits. Leave it open in the library?", diskReloadConfirm: "“{name}” changed on disk. Reload and discard your unsaved edits?", closeLibraryConfirm: "You have unsaved changes. Discard them and start fresh?", imageFolderRequired: "To paste images, open the document's folder with the Folder button", imageWriteRequired: "Images need write access to the folder", imageSaveFailed: "Couldn't save the image ({error})", downloaded: "Downloaded", readOnlyOpened: "Opened in read-only mode — edits will download as new files.", browserReadOnlyHint: "Your browser can't save to disk directly — files open read-only and edits download. (Chrome/Edge support live editing.)", focusHint: "press f or esc to exit", noDoc: "No document", untitled: "Untitled", words: "words", minute: "min", oneFile: "1 file", manyFiles: "{count} files", document: "Document", draft: "draft", readOnly: "read-only", unsaved: "unsaved", editorPlaceholder: "# Start writing…"
  },
  zh: {
    openFolderTitle: "打开 Markdown 文件夹", markdownFileType: "Markdown 文件", saveTitle: "保存 Markdown 文件",
    loadedFolder: "已加载“{name}” — {count} 个文件", openFolderFailed: "无法打开文件夹（{error}）",
    openFileFailed: "无法打开文件（{error}）", saveFailed: "无法保存文件（{error}）",
    contextMenuLabel: "“{name}”的文件操作菜单", contextOpen: "打开", contextDuplicate: "创建副本", contextCopyPath: "复制路径", contextRename: "重命名…", contextDelete: "删除…",
    contextRenamePrompt: "将“{name}”重命名为：", contextDeleteConfirm: "确定从磁盘删除“{name}”吗？此操作无法撤销。", contextActionFailed: "文件操作失败（{error}）",
    contextRenamed: "已重命名为“{name}” ✓", contextDuplicated: "已创建“{name}”副本 ✓", contextDeleted: "已删除“{name}”",
    contextInvalidName: "请输入有效的文件名。", contextMarkdownName: "请使用 Markdown 扩展名，例如 .md 或 .txt。", contextNameExists: "同名文件已存在。",
    contextUnavailable: "此文件已不可用", contextCopyFailed: "无法复制到剪贴板",
    treeNoFileNameMatch: "没有匹配的文件名。", treeSearchInside: "在文件内容中搜索“{query}”",
    saved: "已保存到磁盘 ✓", downloaded: "已下载", removedRecent: "已从最近记录中移除“{name}”",
    reopenFailed: "无法重新打开此文件夹，文件夹可能已移动", permissionNeeded: "需要授权才能打开此文件夹",
    recentUnavailable: "无法打开，文件夹可能已移动或删除", removeRecentLabel: "从最近记录中移除 {name}", removeRecentTitle: "移除", readFailed: "无法读取文件（{error}）",
    diskChanged: "已重新加载 — 文件在磁盘上发生了更改", leaveUnsaved: "“{name}”还有未保存的修改。仍要将它留在当前文件库中吗？", diskReloadConfirm: "“{name}”已在磁盘上更改。要重新加载并放弃未保存的修改吗？", closeLibraryConfirm: "有未保存的修改。要放弃并重新开始吗？", imageFolderRequired: "要粘贴图片，请先使用“文件夹”按钮打开文档所在文件夹", imageWriteRequired: "需要文件夹的写入权限才能保存图片", imageSaveFailed: "无法保存图片（{error}）", downloaded: "已下载", readOnlyOpened: "已以只读方式打开 — 编辑内容将下载为新文件。", browserReadOnlyHint: "当前浏览器不支持直接保存到磁盘，文件将以只读方式打开，编辑后可下载。（Chrome/Edge 支持直接编辑。）", focusHint: "按 f 或 esc 退出", noDoc: "未打开文档", untitled: "未命名", words: "词", minute: "分钟", oneFile: "1 个文件", manyFiles: "{count} 个文件", document: "文档", draft: "草稿", readOnly: "只读", unsaved: "未保存", editorPlaceholder: "# 开始写作…"
  }
};

const runtimeMessages = {
  en: {
    shareOpenDocument: "Open a document first",
    shareTooMuchText: "That's too much to share at once (over 2 MB of text)",
    shareNothing: "Nothing to share",
    shareInlineTooLong: "Too long for a self-contained link — use an encrypted link instead",
    shareTooMuchEncrypted: "That's too much to share at once (over 1 MB encrypted)",
    shareFailed: "Share failed ({status})",
    shareMissingKey: "This link is missing its key — it may have been truncated when it was copied",
    shareExpired: "This share has expired or been revoked",
    shareLoadFailed: "Could not load this share ({status})",
    shareCouldNotOpen: "This share could not be opened",
    shareNewerVersion: "This link was made by a newer version of mdread",
    shareLinkDamaged: "This link is damaged — it was probably cut short or altered when it was copied",
    shareKeyIncomplete: "This link's key is incomplete — copy the whole link and try again",
    sharePayloadTruncated: "Share payload is truncated",
    shareUnsupportedFormat: "Unsupported share format (v{version})",
    shareDecryptFailed: "Could not decrypt — the link's key is wrong or incomplete",
    shareFileCount: "{count} file{plural}", shareSharedDocument: "shared document",
    shareCreateLink: "Create link", shareStartCoedit: "Start co-editing", shareCopyLink: "Copy link", shareRevoke: "Revoke",
    shareLinkRevoked: "Link revoked", shareLinkRemoved: "Expired share removed", shareLinkCopied: "Link copied ✓", shareCopyFailed: "Copy failed — select the link and copy manually",
    shareOpeningRoom: "Opening room…", shareEncrypting: "Encrypting…", shareCreateFailed: "Could not create the link",
    shareImageIncluded: "{count} image{plural} included, encrypted along with the text.",
    shareImagePrefix: "{count} image{plural} included; ",
    shareImagesSkipped: "{included}{count} left out — a link carries up to {maxKb} KB of images.",
    shareOneFile: "1 file", shareExpiryMeta: "{files} · expires in {days}d", shareExpiredMeta: "{files} · expired", shareExpiryUnknown: "{files} · expiry unknown", shareRemoveLink: "Remove",
    collabEditing: "{count} editing", collabLive: "Live · just you", collabReconnecting: "Reconnecting…", collabSyncError: "Sync error", collabConnecting: "Connecting…"
  },
  zh: {
    shareOpenDocument: "请先打开一篇文档。",
    shareTooMuchText: "分享内容过大（文本超过 2 MB）。",
    shareNothing: "没有可分享的内容。",
    shareInlineTooLong: "自包含链接过长，请改用加密链接。",
    shareTooMuchEncrypted: "分享内容过大（加密后超过 1 MB）。",
    shareFailed: "分享失败（HTTP {status}）。",
    shareMissingKey: "链接缺少密钥，可能在复制时被截断。",
    shareExpired: "此分享链接已过期或被撤销。",
    shareLoadFailed: "无法加载此分享链接（HTTP {status}）。",
    shareCouldNotOpen: "无法打开此分享链接。",
    shareNewerVersion: "此链接由较新版本的 mdread 创建。",
    shareLinkDamaged: "链接已损坏，可能在复制时被截断或修改。",
    shareKeyIncomplete: "链接密钥不完整，请复制完整链接后重试。",
    sharePayloadTruncated: "分享数据不完整。",
    shareUnsupportedFormat: "不支持此分享格式（v{version}）。",
    shareDecryptFailed: "无法解密，链接密钥错误或不完整。",
    shareFileCount: "{count} 个文件", shareSharedDocument: "共享文档",
    shareCreateLink: "创建链接", shareStartCoedit: "开始协同编辑", shareCopyLink: "复制链接", shareRevoke: "撤销",
    shareLinkRevoked: "链接已撤销", shareLinkRemoved: "已移除此过期链接", shareLinkCopied: "链接已复制 ✓", shareCopyFailed: "复制失败，请选择链接并手动复制。",
    shareOpeningRoom: "正在打开协作空间…", shareEncrypting: "正在加密…", shareCreateFailed: "无法创建链接。",
    shareImageIncluded: "已包含 {count} 张图片，并与正文一起加密。", shareImagePrefix: "已包含 {count} 张图片；",
    shareImagesSkipped: "{included}有 {count} 张图片未包含；单个链接最多可携带 {maxKb} KB 图片。",
    shareOneFile: "1 个文件", shareExpiryMeta: "{files} · {days} 天后过期", shareExpiredMeta: "{files} · 已过期", shareExpiryUnknown: "{files} · 有效期未知", shareRemoveLink: "移除",
    collabEditing: "{count} 人正在编辑", collabLive: "实时 · 只有你", collabReconnecting: "正在重新连接…", collabSyncError: "同步出错", collabConnecting: "正在连接…"
  }
};

export function t(key, values = {}) {
  const lang = prefs.language === "zh" ? "zh" : "en";
  const template = messages[lang][key] || runtimeMessages[lang][key] || messages.en[key] || runtimeMessages.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
}

const strings = {
  en: {
    "#newDocBtn span": "New", "#openFolderBtn span": "Folder", "#openFilesBtn span": "Files",
    "#recentsToggle span": "Recent items", "#welcomeNew": "Write something new", "#welcomeFolder": "Open a folder",
    "#welcomeFiles": "Open files", "#welcomeSample": "Read the sample →", ".welcome__title": "A quiet reading room<br/>for your markdown.",
    ".welcome__lede": "Drop a file or a whole folder anywhere on this page. It's read right here on your device — <strong>nothing is uploaded unless you choose to share.</strong>",
    ".welcome__recent-label": "Jump back into", ".wf__t": ["Private by design", "Local-first & offline", "Read, write, download", "Co-edit live"],
    ".wf__d": ["Files stay on your device. Share links are encrypted in your browser first.", "Open a folder once and it's remembered. Read offline, with no connection.", "Typography tuned for hours of reading. Edit in place, save to disk, or export Markdown.", "Share a link and write the same document together in real time, with end-to-end encryption."],
    ".seg [data-mode-val='read']": "Read", ".seg [data-mode-val='split']": "Split", ".seg [data-mode-val='edit']": "Edit",
    "#languageToggle": "中文", "#searchInput": { placeholder: "Filter files…" },
    "#treeControls": { ariaLabel: "Folder tree controls" }, "#treeExpandAll": "Expand all", "#treeCollapseAll": "Collapse all",
    "#searchFullBtn": { title: "Search inside files", ariaLabel: "Search inside files" },
    "#saveBtn": { title: "Save", ariaLabel: "Save" }, "#downloadBtn": { title: "Download Markdown", ariaLabel: "Download" },
    "#tocBtn": { title: "Contents", ariaLabel: "Table of contents" }, "#typeBtn": { title: "Reading settings", ariaLabel: "Reading settings" },
    "#focusBtn": { title: "Focus mode", ariaLabel: "Focus mode" }, ".theme-switch": { ariaLabel: "Theme" },
    "#shareBtn": { title: "Encrypted share", ariaLabel: "Share" },
    "#collapseBtn": { title: "Hide sidebar", ariaLabel: "Hide sidebar" }, "#expandBtn": { title: "Show sidebar", ariaLabel: "Show sidebar" },
    "#closeFolderBtn": { title: "Close — start fresh", ariaLabel: "Close folder and start fresh" },
    ".tree": { ariaLabel: "Files" },
    ".sharedbar__badge": "Decrypted in your browser", ".sharedbar .btn": "Open mdread",
    ".seg[aria-label='View mode']": { ariaLabel: "View mode" },
    "#toc .toc__head": "Contents", "#toc": { ariaLabel: "Table of contents" },
    "#sharedFail .sharedfail__title": "This link didn't open", "#sharedFail .sharedfail__hint": "Share links expire, can be revoked by their author, and stop working if the address gets cut short when it's copied.", "#sharedFail .btn": "Go to mdread",
    "#dropzone .dropzone__card span": "Drop to read", ".focus-exit": "press f or esc to exit",
    "#typePop .popover__row:nth-child(1) .popover__label": "Theme", "#typePop .popover__row:nth-child(2) .popover__label": "Typeface",
    "#typePop .popover__row:nth-child(3) .popover__label": "Text size", "#typePop .popover__row:nth-child(4) .popover__label": "Line width", "#typePop .popover__row:nth-child(5) .popover__label": "Drop cap",
    "#shareTitle": "Share this document", "#shareDlg > .dlg__lede": "Encrypted in your browser before it leaves. The key travels in the link itself, never to the server — we can't read what you share.",
    ".share__group:nth-of-type(1) .share__legend": "What to share", "#shareScopeFile + .share__opt-t": "Just this file", "#shareScopeFolder + .share__opt-t": "Everything open",
    "#shareScopeFolder ~ .share__opt-d": "Recipients get the same browsable file tree you see.",
    "#shareLinkTypeGroup .share__legend": "Link type", "#shareStored + .share__opt-t": "Encrypted link", "#shareInline + .share__opt-t": "Self-contained link",
    "#shareStored + .share__opt-t + .share__opt-d": "Ciphertext is stored on the server and expires on its own. You can revoke it any time.",
    "#shareInline + .share__opt-t + .share__opt-d": "Nothing is uploaded — the whole document rides inside the URL. Small files only, and it can't be revoked.",
    "#shareCoeditLegend": { html: "Live co-editing <em class=\"share__beta\">beta</em>" },
    "#shareCoedit + .share__opt-t": "Everyone edits the same document, live", "#shareCoedit + .share__opt-t + .share__opt-d": "Still end-to-end encrypted — edits are sealed in your browser before they reach the relay. Anyone with the link can edit.",
    "#shareExpiryRow label": "Expires", "#shareExpiry option[value='7']": "in 7 days", "#shareExpiry option[value='30']": "in 30 days", "#shareExpiry option[value='365']": "in a year", "#shareCreate": "Create link", "#shareCopy": "Copy", "#shareLiveNote": "You're in the room now. Anyone who opens this link joins the same document and can edit it. The room disappears after 30 days of silence.", "#shareLinkNote": "Anyone with this link can read the document. Treat it like a password — and copy it whole, it stops working if it gets cut short.",
    ".share__list-head": "Links you've created", ".share__local-note": "Your link history stays on this device and is not synced.",
    "#shareBtn": { title: "Share — end-to-end encrypted", ariaLabel: "Share" },
    "#searchDlgTitle": "Search in files", "#fsInput": { placeholder: "Search the text of every open file…" },
    "#fsClose": { ariaLabel: "Close" }, "#shareClose": { ariaLabel: "Close" }
  },
  zh: {
    "#newDocBtn span": "新建", "#openFolderBtn span": "文件夹", "#openFilesBtn span": "打开文件",
    "#recentsToggle span": "最近打开", "#welcomeNew": "新建文档", "#welcomeFolder": "打开文件夹",
    "#welcomeFiles": "打开文件", "#welcomeSample": "阅读示例 →", ".welcome__title": "安静地阅读<br/>你的 Markdown。",
    ".welcome__lede": "将文件或整个文件夹拖到此处，即可在本机阅读。<strong>除非你主动分享，否则文件不会上传。</strong>",
    ".welcome__recent-label": "继续阅读", ".wf__t": ["隐私优先", "本地优先 · 离线可用", "阅读、编辑与导出", "实时协同编辑"],
    ".wf__d": ["文件保留在你的设备上。分享链接会先在浏览器中加密。", "打开过的文件夹会被记住。无需联网也能阅读。", "为长时间阅读优化的排版。可直接编辑、保存到磁盘或导出 Markdown。", "通过链接实时共同编辑同一篇文档，并保持端到端加密。"],
    ".seg [data-mode-val='read']": "阅读", ".seg [data-mode-val='split']": "分栏", ".seg [data-mode-val='edit']": "编辑",
    "#languageToggle": "English", "#searchInput": { placeholder: "筛选文件…" },
    "#treeControls": { ariaLabel: "文件夹树操作" }, "#treeExpandAll": "全部展开", "#treeCollapseAll": "全部收起",
    "#searchFullBtn": { title: "搜索文件内容", ariaLabel: "搜索文件内容" },
    "#saveBtn": { title: "保存", ariaLabel: "保存" }, "#downloadBtn": { title: "下载 Markdown", ariaLabel: "下载" },
    "#tocBtn": { title: "目录", ariaLabel: "目录" }, "#typeBtn": { title: "阅读设置", ariaLabel: "阅读设置" },
    "#focusBtn": { title: "专注模式", ariaLabel: "专注模式" }, ".theme-switch": { ariaLabel: "主题" },
    "#shareBtn": { title: "加密分享", ariaLabel: "分享" },
    "#collapseBtn": { title: "隐藏侧栏", ariaLabel: "隐藏侧栏" }, "#expandBtn": { title: "显示侧栏", ariaLabel: "显示侧栏" },
    "#closeFolderBtn": { title: "关闭并重新开始", ariaLabel: "关闭文件夹并重新开始" },
    ".tree": { ariaLabel: "文件" },
    ".sharedbar__badge": "已在浏览器中解密", ".sharedbar .btn": "打开 mdread",
    ".seg[aria-label='View mode']": { ariaLabel: "视图模式" },
    "#toc .toc__head": "目录", "#toc": { ariaLabel: "目录" },
    "#sharedFail .sharedfail__title": "无法打开此链接", "#sharedFail .sharedfail__hint": "分享链接会过期，也可由创建者撤销；如果复制时链接地址不完整，链接也将无法使用。", "#sharedFail .btn": "返回 mdread",
    "#dropzone .dropzone__card span": "拖放文件以阅读", ".focus-exit": "按 f 或 esc 退出专注模式",
    "#typePop .popover__row:nth-child(1) .popover__label": "主题", "#typePop .popover__row:nth-child(2) .popover__label": "字体",
    "#typePop .popover__row:nth-child(3) .popover__label": "字号", "#typePop .popover__row:nth-child(4) .popover__label": "行宽", "#typePop .popover__row:nth-child(5) .popover__label": "首字下沉",
    "#shareTitle": "分享此文档", "#shareDlg > .dlg__lede": "内容会先在浏览器中加密，再通过链接传递密钥，密钥不会发送到服务器——我们无法读取你分享的内容。",
    ".share__group:nth-of-type(1) .share__legend": "分享范围", "#shareScopeFile + .share__opt-t": "仅此文件", "#shareScopeFolder + .share__opt-t": "当前打开的全部文件",
    "#shareScopeFolder ~ .share__opt-d": "接收者将看到与你相同的可浏览文件树。",
    ".share__group:nth-of-type(2) .share__legend": "链接类型", "#shareStored + .share__opt-t": "加密链接", "#shareInline + .share__opt-t": "自包含链接",
    "#shareStored + .share__opt-t + .share__opt-d": "密文会暂存在服务器上并自动过期，你也可以随时撤销链接。",
    "#shareInline + .share__opt-t + .share__opt-d": "不会上传任何内容，整个文档都包含在 URL 中。仅适用于小文件，且无法撤销。",
    "#shareCoeditLegend": { html: "实时协同编辑 <em class=\"share__beta\">测试版</em>" },
    "#shareCoedit + .share__opt-t": "所有人实时编辑同一文档", "#shareCoedit + .share__opt-t + .share__opt-d": "仍采用端到端加密——编辑内容会在浏览器中加密后才发送。任何拥有链接的人都可以编辑。",
    "#shareExpiryRow label": "有效期", "#shareExpiry option[value='7']": "7 天后", "#shareExpiry option[value='30']": "30 天后", "#shareExpiry option[value='365']": "1 年后", "#shareCreate": "创建链接", "#shareCopy": "复制", "#shareLiveNote": "你已进入协作空间。打开此链接的人将加入并可编辑同一文档。空间在 30 天无活动后消失。", "#shareLinkNote": "任何拥有此链接的人都可以阅读这篇文档。请像密码一样妥善保管，并完整复制；链接被截断后将无法使用。",
    ".share__list-head": "你创建的链接", ".share__local-note": "链接历史仅保存在此设备，不会同步。",
    "#searchDlgTitle": "搜索文件内容", "#fsInput": { placeholder: "搜索所有已打开文件的内容…" },
    "#fsClose": { ariaLabel: "关闭" }, "#shareClose": { ariaLabel: "关闭" }
  }
};

const localizedErrorKeys = {
  "That's too much to share at once (over 2 MB of text)": "shareTooMuchText",
  "Nothing to share": "shareNothing",
  "Too long for a self-contained link — use an encrypted link instead": "shareInlineTooLong",
  "That's too much to share at once (over 1 MB encrypted)": "shareTooMuchEncrypted",
  "Open a document first": "shareOpenDocument",
  "This link is missing its key — it may have been truncated when it was copied": "shareMissingKey",
  "This share has expired or been revoked": "shareExpired",
  "This share could not be opened": "shareCouldNotOpen",
  "This link was made by a newer version of mdread": "shareNewerVersion",
  "This link is damaged — it was probably cut short or altered when it was copied": "shareLinkDamaged",
  "This link's key is incomplete — copy the whole link and try again": "shareKeyIncomplete",
  "This link looks truncated": "shareLinkDamaged",
  "Share payload is truncated": "sharePayloadTruncated",
  "Could not decrypt — the link's key is wrong or incomplete": "shareDecryptFailed",
  "Could not create the link": "shareCreateFailed",
};

export function localizeMessage(message) {
  if (prefs.language !== "zh" || !message) return message;
  const key = Object.hasOwn(localizedErrorKeys, message) ? localizedErrorKeys[message] : null;
  if (key) return t(key);
  const patterns = [
    [/^Share failed \((\d+)\)$/, "shareFailed", "status"],
    [/^Could not load this share \((\d+)\)$/, "shareLoadFailed", "status"],
    [/^Unsupported share format \(v(\d+)\)$/, "shareUnsupportedFormat", "version"],
  ];
  for (const [pattern, messageKey, valueName] of patterns) {
    const match = message.match(pattern);
    if (match) return t(messageKey, { [valueName]: match[1] });
  }
  return message;
}

export function applyLanguage(language = prefs.language || "en") {
  const lang = language === "zh" ? "zh" : "en";
  prefs.language = lang;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  const dict = strings[lang];
  for (const [selector, value] of Object.entries(dict)) {
    const nodes = [...document.querySelectorAll(selector)];
    nodes.forEach((node, index) => {
      const text = Array.isArray(value) ? value[index] : value;
      if (text == null) return;
      if (typeof text === "object") {
        if (text.html !== undefined) node.innerHTML = text.html;
        if (text.placeholder !== undefined) node.placeholder = text.placeholder;
        if (text.title !== undefined) node.title = text.title;
        if (text.ariaLabel !== undefined) node.setAttribute("aria-label", text.ariaLabel);
      } else if (selector === ".welcome__title" || selector === ".welcome__lede" || selector === "#shareDlg > .dlg__lede") node.innerHTML = text;
      else if (selector === "#shareScopeFolder + .share__opt-t") {
        const count = node.querySelector("#shareFolderCount");
        node.childNodes[0].textContent = `${text} `;
        if (count) node.appendChild(count);
      } else node.textContent = text;
    });
  }
  const name = document.getElementById("docName");
  if (!state.current && name) name.textContent = t("noDoc");
  if (state.current?.draft && state.current.name === "Untitled.md") {
    if (name) name.textContent = t("untitled");
    const activeLabel = document.querySelector(".file.is-active .file__name");
    if (activeLabel) activeLabel.textContent = t("untitled");
  }
  const cmPlaceholder = document.querySelector(".cm-placeholder");
  if (cmPlaceholder) cmPlaceholder.textContent = t("editorPlaceholder");
  document.getElementById("languageToggle")?.setAttribute("aria-label", lang === "zh" ? "切换界面语言" : "Switch interface language");
  localStorage.setItem("markread:language", lang);
  savePrefs();
  document.dispatchEvent(new CustomEvent("mdread:language", { detail: lang }));
}

export function wireLanguageToggle() {
  const button = document.getElementById("languageToggle");
  if (!button) return;
  button.addEventListener("click", () => applyLanguage(prefs.language === "zh" ? "en" : "zh"));
}
