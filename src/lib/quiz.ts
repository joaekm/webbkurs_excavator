// Parsar quizfiler enligt innehållskontraktet och rättar inlämningar.
// Rätta svar hålls server-side; klienten ser aldrig facit förrän efter inlämning.

export interface MCQuestion {
  id: string;
  kind: "radio" | "checkbox";
  text: string;
  options: { text: string; correct: boolean }[];
}

export interface HotspotQuestion {
  id: string;
  kind: "hotspot";
  text: string;
  src: string;
  hotspot: { x: number; y: number; w: number; h: number };
  label?: string; // etikett för rätt region (regionrads-syntax), visas som feedback
  desc?: string; // förklaring för rätt region
}

export type Question = MCQuestion | HotspotQuestion;

function mediaUrl(ref: string): string {
  const file = ref.replace(/^images\//, "").trim();
  return "/media/" + encodeURIComponent(file);
}

/** Parsar quiz-brödtexten (utan frontmatter) till frågor. Avvikande block
 * hoppas över med byggvarning, aldrig krasch. */
export function parseQuiz(body: string, moduleOrdning: number): Question[] {
  const blocks = body.split(/^###\s+/m).slice(1);
  const questions: Question[] = [];
  let n = 0;

  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0].trim();

    const mc = /^Fråga:\s*(.+)$/i.exec(header);
    const img = /^Bildfråga:\s*(.+)$/i.exec(header);

    if (mc) {
      const text = mc[1].trim();
      const options: { text: string; correct: boolean }[] = [];
      for (const line of lines.slice(1)) {
        const om = /^\s*-\s*\[([ xX])\]\s*(.+)$/.exec(line);
        if (om) options.push({ text: om[2].trim(), correct: om[1].toLowerCase() === "x" });
      }
      const correctCount = options.filter((o) => o.correct).length;
      if (options.length === 0) {
        console.warn(`[quiz modul ${moduleOrdning}] fråga "${text}" saknar alternativ, hoppas över.`);
        continue;
      }
      if (correctCount === 0) {
        console.warn(`[quiz modul ${moduleOrdning}] fråga "${text}" saknar rätt svar, hoppas över.`);
        continue;
      }
      questions.push({
        id: "q" + n++,
        kind: correctCount === 1 ? "radio" : "checkbox",
        text,
        options,
      });
    } else if (img) {
      const text = img[1].trim();
      const imgMatch = /!\[\[([^\]]+)\]\]/.exec(block);
      if (!imgMatch) {
        console.warn(`[quiz modul ${moduleOrdning}] bildfråga "${text}" saknar bild, hoppas över.`);
        continue;
      }

      let hotspot: { x: number; y: number; w: number; h: number } | null = null;
      let label: string | undefined;
      let desc: string | undefined;

      // Primär syntax: regionrad som Bildgenomgång — "- x, y, w, h | etikett | förklaring".
      // Första giltiga regionen är rätt hotspot-mål.
      const regionRe =
        /^\s*-\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:\|\s*([^|]*?)\s*)?(?:\|\s*(.*?)\s*)?$/;
      for (const line of lines.slice(1)) {
        const rm = regionRe.exec(line);
        if (rm) {
          hotspot = { x: Number(rm[1]), y: Number(rm[2]), w: Number(rm[3]), h: Number(rm[4]) };
          label = rm[5]?.trim() || undefined;
          desc = rm[6]?.trim() || undefined;
          break;
        }
      }

      // Fallback: fenced ```hotspot-block (Kravspecens ursprungliga utkastsyntax).
      if (!hotspot) {
        const hs = /```hotspot([\s\S]*?)```/.exec(block);
        if (hs) {
          const coord = (key: string): number => {
            const m = new RegExp(`^\\s*${key}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, "m").exec(hs[1]);
            return m ? Number(m[1]) : NaN;
          };
          hotspot = { x: coord("x"), y: coord("y"), w: coord("w"), h: coord("h") };
        }
      }

      if (!hotspot || Object.values(hotspot).some((v) => Number.isNaN(v))) {
        console.warn(
          `[quiz modul ${moduleOrdning}] bildfråga "${text}" saknar giltig hotspot (regionrad eller hotspot-block), hoppas över.`,
        );
        continue;
      }
      questions.push({
        id: "q" + n++,
        kind: "hotspot",
        text,
        src: mediaUrl(imgMatch[1]),
        hotspot,
        label,
        desc,
      });
    } else {
      console.warn(`[quiz modul ${moduleOrdning}] okänt frågeblock "${header}", hoppas över.`);
    }
  }

  return questions;
}

// Svarsformat i answers_json: radio → number; checkbox → number[]; hotspot → {x,y}.
export type Answer = number | number[] | { x: number; y: number };
export type AnswerMap = Record<string, Answer | undefined>;

export interface GradedQuestion {
  id: string;
  correct: boolean;
  answered: boolean;
}

export interface GradeResult {
  passed: boolean;
  perQuestion: GradedQuestion[];
}

export function gradeQuiz(questions: Question[], answers: AnswerMap): GradeResult {
  const perQuestion: GradedQuestion[] = questions.map((q) => {
    const a = answers[q.id];
    const answered = a !== undefined && a !== null;
    let correct = false;

    if (q.kind === "radio") {
      const sel = typeof a === "number" ? a : -1;
      correct = q.options[sel]?.correct === true;
    } else if (q.kind === "checkbox") {
      const sel = new Set(Array.isArray(a) ? a : []);
      const wanted = new Set(q.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0));
      correct =
        sel.size === wanted.size && [...wanted].every((i) => sel.has(i)) && [...sel].every((i) => wanted.has(i));
    } else {
      // hotspot
      if (a && typeof a === "object" && "x" in a && "y" in a) {
        const { x, y } = a as { x: number; y: number };
        const h = q.hotspot;
        correct = x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h;
      }
    }

    return { id: q.id, correct, answered };
  });

  const passed = perQuestion.length > 0 && perQuestion.every((p) => p.correct);
  return { passed, perQuestion };
}
