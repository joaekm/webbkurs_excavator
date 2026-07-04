import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { slugify } from "./slug.ts";
import { parseQuiz, type Question } from "./quiz.ts";
import type { ModuleLookup } from "./markdown.ts";

const CONTENT_DIR = resolve(process.env.CONTENT_DIR ?? "./content");

export interface CourseModule {
  slug: string;
  filename: string;
  filenameNoExt: string;
  ordning: number;
  titel: string;
  status: "utkast" | "verifierad";
  kritisk: boolean;
  tid_min: number;
  taggar: string[];
  body: string;
  hasQuiz: boolean;
}

interface ContentStore {
  modules: CourseModule[];
  bySlug: Map<string, CourseModule>;
  lookup: ModuleLookup;
  quizzes: Map<number, Question[]>; // nyckel = modulens ordning
}

let store: ContentStore | null = null;

function coerceFrontmatter(data: any, filename: string): Omit<CourseModule, "slug" | "filename" | "filenameNoExt" | "body" | "hasQuiz"> | null {
  const warn = (msg: string) => console.warn(`[content] ${filename}: ${msg}`);
  const required = ["ordning", "titel", "status", "kritisk", "tid_min", "taggar"];
  for (const key of required) {
    if (!(key in data)) warn(`saknar obligatoriskt frontmatter-fält "${key}".`);
  }

  const ordning = Number(data.ordning);
  if (Number.isNaN(ordning)) {
    warn(`"ordning" är inte ett tal — kan inte placera modulen, hoppas över.`);
    return null;
  }
  const status = data.status === "verifierad" ? "verifierad" : "utkast";
  if (data.status !== "utkast" && data.status !== "verifierad") {
    warn(`okänd status "${data.status}", behandlas som utkast.`);
  }
  const taggar = Array.isArray(data.taggar) ? data.taggar.map(String) : [];

  return {
    ordning,
    titel: String(data.titel ?? filename),
    status,
    kritisk: data.kritisk === true,
    tid_min: Number.isNaN(Number(data.tid_min)) ? 0 : Number(data.tid_min),
    taggar,
  };
}

function load(): ContentStore {
  const modules: CourseModule[] = [];
  const quizFiles: { ordning: number; questions: Question[] }[] = [];

  let entries: string[] = [];
  try {
    entries = readdirSync(CONTENT_DIR);
  } catch {
    console.warn(`[content] kunde inte läsa ${CONTENT_DIR} — tomt innehåll.`);
  }

  const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();

  // Först: quizfiler (kräver frontmatter modul: NN).
  const rawQuizzes: { file: string; modul: number; body: string }[] = [];

  for (const file of mdFiles) {
    const full = resolve(CONTENT_DIR, file);
    let raw: string;
    try {
      raw = readFileSync(full, "utf8");
    } catch {
      console.warn(`[content] kunde inte läsa ${file}, hoppas över.`);
      continue;
    }
    const { data, content } = matter(raw);

    if (file.endsWith(".quiz.md")) {
      const modul = Number(data.modul);
      if (Number.isNaN(modul)) {
        console.warn(`[content] ${file}: saknar/ogiltigt "modul" i frontmatter, ignoreras.`);
        continue;
      }
      rawQuizzes.push({ file, modul, body: content });
      continue;
    }

    const fm = coerceFrontmatter(data, file);
    if (!fm) continue;
    const filenameNoExt = file.replace(/\.md$/, "");
    modules.push({
      slug: slugify(fm.titel),
      filename: file,
      filenameNoExt,
      body: content,
      hasQuiz: false,
      ...fm,
    });
  }

  modules.sort((a, b) => a.ordning - b.ordning);

  // Slug-krockar: gör dem unika deterministiskt.
  const seen = new Set<string>();
  for (const m of modules) {
    let s = m.slug || "modul";
    let i = 2;
    const base = s;
    while (seen.has(s)) s = `${base}-${i++}`;
    seen.add(s);
    m.slug = s;
  }

  const quizzes = new Map<number, Question[]>();
  const ordningSet = new Set(modules.map((m) => m.ordning));
  for (const q of rawQuizzes) {
    if (!ordningSet.has(q.modul)) {
      console.warn(`[content] ${q.file}: ingen modul med ordning ${q.modul}, quizet ignoreras.`);
      continue;
    }
    quizzes.set(q.modul, parseQuiz(q.body, q.modul));
  }
  for (const m of modules) m.hasQuiz = quizzes.has(m.ordning) && (quizzes.get(m.ordning)!.length > 0);

  // Uppslag för [[wiki-länkar]]: filnamn utan ändelse + titel (gemener).
  const lookup: ModuleLookup = new Map();
  const bySlug = new Map<string, CourseModule>();
  for (const m of modules) {
    lookup.set(m.filenameNoExt.toLowerCase(), m.slug);
    lookup.set(m.titel.toLowerCase(), m.slug);
    bySlug.set(m.slug, m);
  }

  console.log(
    `[content] laddade ${modules.length} moduler, ${quizzes.size} quiz från ${CONTENT_DIR}.`,
  );
  return { modules, bySlug, lookup, quizzes };
}

/** Cachas vid första anropet (SSR läser state per request separat). */
export function getContent(): ContentStore {
  if (!store) store = load();
  return store;
}

export function getModules(): CourseModule[] {
  return getContent().modules;
}

export function getModuleBySlug(slug: string): CourseModule | undefined {
  return getContent().bySlug.get(slug);
}

export function getQuizForModule(ordning: number): Question[] | undefined {
  return getContent().quizzes.get(ordning);
}

export function getLookup(): ModuleLookup {
  return getContent().lookup;
}

/** Föregående/nästa i ordning. */
export function neighbours(slug: string): { prev?: CourseModule; next?: CourseModule } {
  const mods = getModules();
  const i = mods.findIndex((m) => m.slug === slug);
  if (i === -1) return {};
  return { prev: mods[i - 1], next: mods[i + 1] };
}
