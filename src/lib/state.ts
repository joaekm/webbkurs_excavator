import { randomUUID } from "node:crypto";
import { db } from "./db.ts";

// ---- Checkrutor ------------------------------------------------------------

export function getChecklistState(slug: string): Map<number, boolean> {
  const rows = db
    .prepare("SELECT item_index, checked FROM checklist_state WHERE module_slug = ?")
    .all(slug) as { item_index: number; checked: number }[];
  const map = new Map<number, boolean>();
  for (const r of rows) map.set(r.item_index, r.checked === 1);
  return map;
}

export function setChecklistItem(slug: string, itemIndex: number, checked: boolean): void {
  db.prepare(
    `INSERT INTO checklist_state (module_slug, item_index, checked)
     VALUES (?, ?, ?)
     ON CONFLICT(module_slug, item_index) DO UPDATE SET checked = excluded.checked`,
  ).run(slug, itemIndex, checked ? 1 : 0);
}

/** Antal avbockade av alla rutor för en modul, givet totalen från innehållet. */
export function checkedCount(slug: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM checklist_state WHERE module_slug = ? AND checked = 1")
    .get(slug) as { n: number };
  return row.n;
}

// ---- Läst-status -----------------------------------------------------------

export function isRead(slug: string): boolean {
  return !!db.prepare("SELECT 1 FROM module_reads WHERE module_slug = ?").get(slug);
}

/** Togglar läst av/på. Returnerar nya läget. */
export function toggleRead(slug: string): boolean {
  if (isRead(slug)) {
    db.prepare("DELETE FROM module_reads WHERE module_slug = ?").run(slug);
    return false;
  }
  db.prepare("INSERT INTO module_reads (module_slug, read_at) VALUES (?, ?)").run(slug, Date.now());
  return true;
}

// ---- Anteckningar ----------------------------------------------------------

export function getNote(slug: string): string {
  const row = db.prepare("SELECT body FROM notes WHERE module_slug = ?").get(slug) as
    | { body: string }
    | undefined;
  return row?.body ?? "";
}

export function setNote(slug: string, body: string): void {
  db.prepare(
    `INSERT INTO notes (module_slug, body, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(module_slug) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
  ).run(slug, body, Date.now());
}

// ---- Quiz ------------------------------------------------------------------

export function recordQuizAttempt(slug: string, passed: boolean, answersJson: string): void {
  db.prepare(
    "INSERT INTO quiz_attempts (id, module_slug, submitted_at, passed, answers_json) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), slug, Date.now(), passed ? 1 : 0, answersJson);
}

export type QuizStatus = "passed" | "failed" | "none";

/** Senaste försöket räknas (inte bästa). */
export function getQuizStatus(slug: string): QuizStatus {
  const row = db
    .prepare(
      "SELECT passed FROM quiz_attempts WHERE module_slug = ? ORDER BY submitted_at DESC LIMIT 1",
    )
    .get(slug) as { passed: number } | undefined;
  if (!row) return "none";
  return row.passed === 1 ? "passed" : "failed";
}

/** Senaste inlämnade svaren, för att förifylla quiz-formuläret. */
export function getLatestAnswers(slug: string): unknown | null {
  const row = db
    .prepare(
      "SELECT answers_json FROM quiz_attempts WHERE module_slug = ? ORDER BY submitted_at DESC LIMIT 1",
    )
    .get(slug) as { answers_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.answers_json);
  } catch {
    return null;
  }
}
