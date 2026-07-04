import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Lokal SQLite-fil. Ingen auth, en underförstådd användare — nyckel = module_slug.
const DB_PATH = resolve(process.env.DATABASE_PATH ?? "./data/course.db");

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS module_reads (
    module_slug TEXT PRIMARY KEY,
    read_at     INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checklist_state (
    module_slug TEXT NOT NULL,
    item_index  INTEGER NOT NULL,
    checked     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (module_slug, item_index)
  );

  CREATE TABLE IF NOT EXISTS notes (
    module_slug TEXT PRIMARY KEY,
    body        TEXT NOT NULL DEFAULT '',
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id           TEXT PRIMARY KEY,
    module_slug  TEXT NOT NULL,
    submitted_at INTEGER NOT NULL,
    passed       INTEGER NOT NULL,
    answers_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_module
    ON quiz_attempts (module_slug, submitted_at DESC);
`);
