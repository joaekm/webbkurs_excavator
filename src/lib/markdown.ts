import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { slugify } from "./slug.ts";

// Renderar en moduls brödtext mot innehållskontraktet. Aldrig krascha på
// avvikande innehåll: logga och rendera så långt det går.
//
// Avvikelse från kravspecens ursprungliga "remark-html": vi använder
// remark→rehype-pipeline för att kunna injecta custom HTML (Bildgenomgång,
// varningsrutor, indexerade checkrutor). Dokumenterat i CLAUDE.md.

export interface Heading {
  id: string;
  text: string;
}

export interface ChecklistItem {
  index: number;
  text: string;
}

export interface RenderResult {
  html: string;
  headings: Heading[];
  checkboxCount: number;
  checklistItems: ChecklistItem[];
}

/** Modulslug-uppslag för [[wiki-länkar]]: nyckel (gemener) → slug. */
export type ModuleLookup = Map<string, string>;

// --- Textextraktion ---------------------------------------------------------

function mdastText(node: any): string {
  if (!node) return "";
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (Array.isArray(node.children)) return node.children.map(mdastText).join("");
  return "";
}

function hastText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  if (Array.isArray(node.children)) return node.children.map(hastText).join("");
  return "";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `images/foo.jpg` eller `foo.jpg` → mediarutt-URL. */
function mediaUrl(ref: string): string {
  const file = ref.replace(/^images\//, "").trim();
  return "/media/" + encodeURIComponent(file);
}

// --- Plugin: Bildgenomgång ---------------------------------------------------
// "### Bildgenomgång: <rubrik>" följt av ![[bild]] och en lista med regionrader
// "x, y, w, h | etikett | förklaring". Ersätter de tre noderna med råHTML.
function remarkBildgenomgang() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (!Array.isArray(node.children)) return;
      const kids = node.children;
      for (let i = 0; i < kids.length; i++) {
        const h = kids[i];
        if (h.type !== "heading" || h.depth !== 3) continue;
        const htext = mdastText(h).trim();
        const m = /^Bildgenomgång:\s*(.+)$/i.exec(htext);
        if (!m) continue;
        const title = m[1].trim();

        // Nästa syskon ska vara en bild-paragraf, sedan en lista.
        const imgNode = kids[i + 1];
        const listNode = kids[i + 2];
        const imgMatch = imgNode ? /!\[\[([^\]]+)\]\]/.exec(mdastText(imgNode)) : null;
        if (!imgMatch || !listNode || listNode.type !== "list") {
          console.warn(
            `[bildgenomgång] "${title}": förväntade bild + regionlista efter rubriken, hoppar över blocket.`,
          );
          continue;
        }

        const regions: { x: number; y: number; w: number; h: number; label: string; desc: string }[] =
          [];
        for (const li of listNode.children ?? []) {
          const line = mdastText(li).trim();
          const parts = line.split("|").map((p: string) => p.trim());
          const coords = (parts[0] ?? "").split(",").map((n: string) => Number(n.trim()));
          if (coords.length !== 4 || coords.some((n) => Number.isNaN(n))) {
            console.warn(`[bildgenomgång] "${title}": ogiltig regionrad "${line}", hoppas över.`);
            continue;
          }
          regions.push({
            x: coords[0],
            y: coords[1],
            w: coords[2],
            h: coords[3],
            label: parts[1] ?? "",
            desc: parts[2] ?? "",
          });
        }

        const src = mediaUrl(imgMatch[1]);
        const regionHtml = regions
          .map(
            (r, idx) =>
              `<button type="button" class="bg-region" data-region="${idx}" ` +
              `style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%" ` +
              `aria-label="${esc(r.label)}"><span class="bg-region-num">${idx + 1}</span></button>`,
          )
          .join("");
        const legendHtml = regions
          .map(
            (r, idx) =>
              `<li data-region="${idx}"><span class="bg-legend-num">${idx + 1}</span>` +
              `<strong>${esc(r.label)}</strong>` +
              (r.desc ? `<span class="bg-legend-desc">${esc(r.desc)}</span>` : "") +
              `</li>`,
          )
          .join("");

        const html =
          `<figure class="bildgenomgang" data-bildgenomgang>` +
          `<figcaption>${esc(title)}</figcaption>` +
          `<div class="bg-stage"><img src="${src}" alt="${esc(title)}" loading="lazy">${regionHtml}</div>` +
          `<ol class="bg-legend">${legendHtml}</ol>` +
          `</figure>`;

        // Ersätt heading+bild+lista med en enda html-nod.
        kids.splice(i, 3, { type: "html", value: html });
      }
    });
  };
}

// --- Plugin: VARNING-blockquotes --------------------------------------------
function remarkVarning() {
  return (tree: any) => {
    visit(tree, "blockquote", (node: any) => {
      const txt = mdastText(node).trimStart();
      if (/^VARNING:/i.test(txt)) {
        node.data = node.data || {};
        node.data.hProperties = { ...(node.data.hProperties || {}), className: ["varning"] };
      }
    });
  };
}

// --- Plugin: [[wiki-länkar]] och ![[bilder]] --------------------------------
function remarkWikiAndImages(lookup: ModuleLookup) {
  const re = /(!?)\[\[([^\]]+)\]\]/g;
  return (tree: any) => {
    visit(tree, "text", (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent) return;
      const value: string = node.value;
      if (!value.includes("[[")) return;

      const out: any[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(value))) {
        if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) });
        const isImage = m[1] === "!";
        const inner = m[2];
        if (isImage) {
          out.push({
            type: "image",
            url: mediaUrl(inner),
            alt: inner.replace(/^images\//, ""),
          });
        } else {
          const [rawTarget, rawLabel] = inner.split("|");
          const target = rawTarget.trim();
          const label = (rawLabel ?? rawTarget).trim();
          const slug = lookup.get(target.toLowerCase());
          if (slug) {
            out.push({
              type: "link",
              url: "/modul/" + slug,
              children: [{ type: "text", value: label }],
            });
          } else {
            // Olöst länk: rendera som vanlig text + varning, aldrig krascha.
            console.warn(`[wiki-länk] olöst mål "${target}" — renderas som text.`);
            out.push({ type: "text", value: label });
          }
        }
        last = m.index + m[0].length;
      }
      if (last < value.length) out.push({ type: "text", value: value.slice(last) });

      if (out.length) parent.children.splice(index, 1, ...out);
    });
  };
}

// --- Plugin (rehype): ankarnav-id på H2 -------------------------------------
function rehypeHeadingIds(collector: { headings: Heading[] }) {
  return (tree: any) => {
    const used = new Set<string>();
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "h2") return;
      const text = hastText(node).trim();
      let id = slugify(text) || "avsnitt";
      let n = 2;
      const base = id;
      while (used.has(id)) id = `${base}-${n++}`;
      used.add(id);
      node.properties = node.properties || {};
      node.properties.id = id;
      collector.headings.push({ id, text });
    });
  };
}

// --- Plugin (rehype): indexerade interaktiva checkrutor ---------------------
// remark-gfm renderar task-list-items med <input type="checkbox" disabled>.
// Vi ger varje ruta ett löpande data-index (radindex → DB) och gör dem aktiva.
function rehypeCheckboxes(
  slug: string,
  state: Map<number, boolean>,
  collector: { checkboxCount: number; checklistItems: ChecklistItem[] },
) {
  return (tree: any) => {
    let index = 0;
    visit(tree, "element", (node: any, _i: number | undefined, parent: any) => {
      if (node.tagName !== "input") return;
      const props = node.properties || {};
      if (props.type !== "checkbox") return;
      const idx = index++;
      const checked = state.get(idx) ?? false;
      node.properties = {
        type: "checkbox",
        className: ["task-checkbox"],
        "data-slug": slug,
        "data-index": idx,
        ...(checked ? { checked: true } : {}),
      };
      collector.checkboxCount++;
      // Etikettext för /checklistor: parent <li> minus input.
      const liText = parent && parent.tagName === "li" ? hastText(parent).trim() : "";
      collector.checklistItems.push({ index: idx, text: liText });
      // Markera li:t så vi kan styla avbockade rader.
      if (parent && parent.tagName === "li") {
        parent.properties = parent.properties || {};
        parent.properties.className = ["task-list-item"];
      }
    });
  };
}

export async function renderModule(
  body: string,
  slug: string,
  lookup: ModuleLookup,
  checklistState: Map<number, boolean>,
): Promise<RenderResult> {
  const collector = {
    headings: [] as Heading[],
    checkboxCount: 0,
    checklistItems: [] as ChecklistItem[],
  };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBildgenomgang)
    .use(remarkVarning)
    .use(remarkWikiAndImages, lookup)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHeadingIds, collector)
    .use(rehypeCheckboxes, slug, checklistState, collector)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(body);

  return {
    html: String(file),
    headings: collector.headings,
    checkboxCount: collector.checkboxCount,
    checklistItems: collector.checklistItems,
  };
}
