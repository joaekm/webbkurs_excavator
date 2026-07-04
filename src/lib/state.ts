import { randomUUID } from "node:crypto";
import { db } from "./db.ts";

// All progress nycklas per user_id + module_slug. userId kommer från aktiv
// användare (cookie → middleware → Astro.locals / API-context.locals).

// ---- Checkrutor ------------------------------------------------------------

export function getChecklistState(userId: string, slug: string): Map<number, boolean> {
  const rows = db
    .prepare("SELECT item_index, checked FROM checklist_state WHERE user_id = ? AND module_slug = ?")
    .all(userId, slug) as { item_index: number; checked: number }[];
  const map = new Map<number, boolean>();
  for (const r of rows) map.set(r.item_index, r.checked === 1);
  return map;
}

export function setChecklistItem(
  userId: string,
  slug: string,
  itemIndex: number,
  checked: boolean,
): void {
  db.prepare(
    `INSERT INTO checklist_state (user_id, module_slug, item_index, checked)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, module_slug, item_index) DO UPDATE SET checked = excluded.checked`,
  ).run(userId, slug, itemIndex, checked ? 1 : 0);
}

/** Antal avbockade rutor för en modul. */
export function checkedCount(userId: string, slug: string): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS n FROM checklist_state WHERE user_id = ? AND module_slug = ? AND checked = 1",
    )
    .get(userId, slug) as { n: number };
  return row.n;
}

// ---- Läst-status -----------------------------------------------------------

export function isRead(userId: string, slug: string): boolean {
  return !!db
    .prepare("SELECT 1 FROM module_reads WHERE user_id = ? AND module_slug = ?")
    .get(userId, slug);
}

/** Togglar läst av/på. Returnerar nya läget. */
export function toggleRead(userId: string, slug: string): boolean {
  if (isRead(userId, slug)) {
    db.prepare("DELETE FROM module_reads WHERE user_id = ? AND module_slug = ?").run(userId, slug);
    return false;
  }
  db.prepare("INSERT INTO module_reads (user_id, module_slug, read_at) VALUES (?, ?, ?)").run(
    userId,
    slug,
    Date.now(),
  );
  return true;
}

// ---- Anteckningar ----------------------------------------------------------

export function getNote(userId: string, slug: string): string {
  const row = db
    .prepare("SELECT body FROM notes WHERE user_id = ? AND module_slug = ?")
    .get(userId, slug) as { body: string } | undefined;
  return row?.body ?? "";
}

export function setNote(userId: string, slug: string, body: string): void {
  db.prepare(
    `INSERT INTO notes (user_id, module_slug, body, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, module_slug) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
  ).run(userId, slug, body, Date.now());
}

// ---- Quiz ------------------------------------------------------------------

export function recordQuizAttempt(
  userId: string,
  slug: string,
  passed: boolean,
  answersJson: string,
): void {
  db.prepare(
    "INSERT INTO quiz_attempts (id, user_id, module_slug, submitted_at, passed, answers_json) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(randomUUID(), userId, slug, Date.now(), passed ? 1 : 0, answersJson);
}

export type QuizStatus = "passed" | "failed" | "none";

/** Senaste försöket räknas (inte bästa). */
export function getQuizStatus(userId: string, slug: string): QuizStatus {
  const row = db
    .prepare(
      "SELECT passed FROM quiz_attempts WHERE user_id = ? AND module_slug = ? ORDER BY submitted_at DESC LIMIT 1",
    )
    .get(userId, slug) as { passed: number } | undefined;
  if (!row) return "none";
  return row.passed === 1 ? "passed" : "failed";
}
