/* Moving between documents: [[wiki links]] and relative .md links open the file
   in place, and each document lists what links to it ("Linked from").

   Without this, a relative link like [next](b.md) is an ordinary link: the
   browser would navigate to /b.md on our origin, reloading the app and sending
   the user's file path to the server. Resolution rules live in refs.js. */

import { state } from "./state.js";
import { $, reading, readingScroll } from "./dom.js";
import { slug, escapeHtml } from "./util.js";
import { openDoc } from "./document.js";
import { toast } from "./ui.js";
import { resolveWiki, resolveDocLink, isDocHref, splitHeading, linkTargets } from "./refs.js";
import { allTexts } from "./corpus.js";

const paths = () => state.files.map((f) => f.path);

// { path, heading } for a link to another document, or null for any other link.
function targetOf(a) {
  const from = state.current?.path || "";
  if (a.dataset.wiki != null) {
    const [name, heading] = splitHeading(a.dataset.wiki);
    return { path: name ? resolveWiki(name, from, paths()) : from, heading, name };
  }
  const href = a.getAttribute("href");
  if (!href || !isDocHref(href)) return null;
  return { path: resolveDocLink(href, from, paths()), heading: decodeURIComponent(href.split("#")[1] || ""), name: href };
}

// Called on mounted blocks: mark links whose document isn't in the open folder.
export function markLinks(el) {
  const links = el.matches("a") ? [el] : el.querySelectorAll("a.wikilink, a[href]");
  for (const a of links) {
    const t = targetOf(a);
    if (!t) continue;
    a.classList.toggle("is-missing", !t.path);
    if (!t.path) a.title = `No “${t.name}” in the open files`;
  }
}

const headingText = (h) =>
  [...h.childNodes]
    .filter((n) => !(n.nodeType === 1 && n.classList?.contains("anchor")))
    .map((n) => n.textContent)
    .join("")
    .trim();

const normalizeHeading = (text) => text.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();

function headingTarget(fragment) {
  let name = String(fragment || "").replace(/^#/, "");
  try {
    name = decodeURIComponent(name);
  } catch {}
  if (!name) return null;

  const exact = document.getElementById(name);
  if (exact && reading.contains(exact)) return exact;

  const headings = [...reading.querySelectorAll("h1, h2, h3, h4")];
  const normalized = normalizeHeading(name);
  const byText = headings.find((h) => normalizeHeading(headingText(h)) === normalized);
  if (byText) return byText;

  // ASCII headings already use this slug; Unicode headings may have the fallback
  // id "section", so don't use that generic slug to choose between them.
  const id = slug(name);
  if (id && id !== "section") {
    const byId = document.getElementById(id);
    if (byId && reading.contains(byId)) return byId;
  }
  return null;
}

function scrollToHeading(fragment) {
  const target = headingTarget(fragment);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

async function follow(t) {
  if (!t.path) {
    toast(`No “${t.name}” in the open files`);
    return;
  }
  const f = state.files.find((x) => x.path === t.path);
  if (f !== state.current) await openDoc(f);
  if (state.current !== f) return;
  if (t.heading) requestAnimationFrame(() => scrollToHeading(t.heading));
}

/* ---------------- "Linked from" ---------------- */

let pass = 0;

/* Every other open file that links here, with the line it does it on. Runs
   after each document opens; texts come from corpus.js, so files unchanged on
   disk aren't read twice. A newer call supersedes one still in flight. */
export async function renderBacklinks() {
  const box = $("#backlinks");
  const f = state.current;
  const mine = ++pass;
  if (!f || state.files.length < 2 || !state.files.includes(f)) {
    box.hidden = true;
    return;
  }
  const all = paths();
  const hits = [];
  for (const { file, text } of await allTexts()) {
    if (file === f) continue;
    const to = linkTargets(text, file.path, all).filter((t) => t.path === f.path);
    if (to.length) hits.push({ file, text, at: to[0].at, n: to.length });
  }
  if (mine !== pass) return;

  box.hidden = !hits.length;
  if (!hits.length) return;
  hits.sort((a, b) => a.file.path.localeCompare(b.file.path));
  box.innerHTML = `<h2 class="backlinks__title">Linked from ${hits.length} document${hits.length === 1 ? "" : "s"}</h2>`;
  const list = document.createElement("ul");
  list.className = "backlinks__list";
  for (const { file, text, at } of hits) {
    const ls = text.lastIndexOf("\n", at - 1) + 1;
    const le = text.indexOf("\n", at);
    const line = text.slice(ls, le === -1 ? undefined : le).trim();
    const dir = file.path.includes("/") ? file.path.split("/").slice(0, -1).join("/") : "";
    const li = document.createElement("li");
    li.innerHTML = `<button type="button" class="backlinks__item"><span class="backlinks__name">${escapeHtml(file.name.replace(/\.\w+$/, ""))}</span>${dir ? `<span class="backlinks__dir">${escapeHtml(dir)}</span>` : ""}<span class="backlinks__line">${escapeHtml(line.length > 160 ? line.slice(0, 160) + "…" : line)}</span></button>`;
    li.firstChild.addEventListener("click", () => openDoc(file).then(() => readingScroll.scrollTo({ top: 0 })));
    list.appendChild(li);
  }
  box.appendChild(list);
}

export function wireLinks() {
  reading.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (a.dataset.wiki == null) {
      const href = a.getAttribute("href");
      if (href?.startsWith("#")) {
        const target = headingTarget(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
    }
    const t = targetOf(a);
    if (!t) return;
    e.preventDefault();
    follow(t);
  });
}
