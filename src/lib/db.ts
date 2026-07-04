import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Lokal SQLite-fil. Flera användare (bara namn, ingen inloggning) — skapas
// manuellt i users-tabellen. All progress nycklas per user_id + module_slug.
const DB_PATH = resolve(process.env.DATABASE_PATH ?? "./data/course.db");

// Standardanvändare: befintlig progress backfillas hit, och den finns så att
// appen har minst en användare i väljaren direkt.
export const DEFAULT_USER_ID = "joakim";
export const DEFAULT_USER_NAME = "Joakim";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function tableExists(table: string): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?").get(table);
}
function hasColumn(table: string, col: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === col);
}

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);`);

// --- Migrering: lägg till user_id i äldre progresstabeller utan att tappa data.
// PK-ändrande tabeller återskapas; quiz_attempts får en ny kolumn.
db.transaction(() => {
  if (tableExists("module_reads") && !hasColumn("module_reads", "user_id")) {
    db.exec(`
      ALTER TABLE module_reads RENAME TO module_reads_old;
      CREATE TABLE module_reads (
        user_id     TEXT NOT NULL,
        module_slug TEXT NOT NULL,
        read_at     INTEGER NOT NULL,
        PRIMARY KEY (user_id, module_slug)
      );
      INSERT INTO module_reads (user_id, module_slug, read_at)
        SELECT '${DEFAULT_USER_ID}', module_slug, read_at FROM module_reads_old;
      DROP TABLE module_reads_old;
    `);
  }

  if (tableExists("checklist_state") && !hasColumn("checklist_state", "user_id")) {
    db.exec(`
      ALTER TABLE checklist_state RENAME TO checklist_state_old;
      CREATE TABLE checklist_state (
        user_id     TEXT NOT NULL,
        module_slug TEXT NOT NULL,
        item_index  INTEGER NOT NULL,
        checked     INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, module_slug, item_index)
      );
      INSERT INTO checklist_state (user_id, module_slug, item_index, checked)
        SELECT '${DEFAULT_USER_ID}', module_slug, item_index, checked FROM checklist_state_old;
      DROP TABLE checklist_state_old;
    `);
  }

  if (tableExists("notes") && !hasColumn("notes", "user_id")) {
    db.exec(`
      ALTER TABLE notes RENAME TO notes_old;
      CREATE TABLE notes (
        user_id     TEXT NOT NULL,
        module_slug TEXT NOT NULL,
        body        TEXT NOT NULL DEFAULT '',
        updated_at  INTEGER NOT NULL,
        PRIMARY KEY (user_id, module_slug)
      );
      INSERT INTO notes (user_id, module_slug, body, updated_at)
        SELECT '${DEFAULT_USER_ID}', module_slug, body, updated_at FROM notes_old;
      DROP TABLE notes_old;
    `);
  }

  if (tableExists("quiz_attempts") && !hasColumn("quiz_attempts", "user_id")) {
    db.exec(`ALTER TABLE quiz_attempts ADD COLUMN user_id TEXT;`);
    db.prepare(`UPDATE quiz_attempts SET user_id = ? WHERE user_id IS NULL`).run(DEFAULT_USER_ID);
  }
})();

// --- Skapa tabeller i ny form (no-op om de redan finns / migrerats). ---------
db.exec(`
  CREATE TABLE IF NOT EXISTS module_reads (
    user_id     TEXT NOT NULL,
    module_slug TEXT NOT NULL,
    read_at     INTEGER NOT NULL,
    PRIMARY KEY (user_id, module_slug)
  );

  CREATE TABLE IF NOT EXISTS checklist_state (
    user_id     TEXT NOT NULL,
    module_slug TEXT NOT NULL,
    item_index  INTEGER NOT NULL,
    checked     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, module_slug, item_index)
  );

  CREATE TABLE IF NOT EXISTS notes (
    user_id     TEXT NOT NULL,
    module_slug TEXT NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    updated_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, module_slug)
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    module_slug  TEXT NOT NULL,
    submitted_at INTEGER NOT NULL,
    passed       INTEGER NOT NULL,
    answers_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_module
    ON quiz_attempts (user_id, module_slug, submitted_at DESC);
`);

// Seeda standardanvändaren om tabellen är tom (färsk databas eller migrerad).
const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
if (userCount.n === 0) {
  db.prepare("INSERT INTO users (id, name) VALUES (?, ?)").run(DEFAULT_USER_ID, DEFAULT_USER_NAME);
}
