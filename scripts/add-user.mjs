#!/usr/bin/env node
// Lägger till en kursanvändare (bara id + namn, ingen inloggning).
// Användning:  npm run add-user -- <id> <namn>
//   npm run add-user -- anna Anna
//   npm run add-user -- kalle "Kalle Svensson"
// id används i URL/cookie och som nyckel för progress — välj kort och stabilt.

import Database from "better-sqlite3";
import { resolve } from "node:path";

const [, , id, ...nameParts] = process.argv;
const name = nameParts.join(" ").trim();

if (!id || !name) {
  console.error("Användning: npm run add-user -- <id> <namn>");
  console.error('Exempel:    npm run add-user -- anna Anna');
  process.exit(1);
}
if (!/^[a-z0-9_-]+$/.test(id)) {
  console.error(`Ogiltigt id "${id}". Använd bara gemener, siffror, - och _.`);
  process.exit(1);
}

const dbPath = resolve(process.env.DATABASE_PATH ?? "./data/course.db");
const db = new Database(dbPath);
db.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL);");

const existing = db.prepare("SELECT name FROM users WHERE id = ?").get(id);
if (existing) {
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id);
  console.log(`Uppdaterade användare "${id}" → namn "${name}".`);
} else {
  db.prepare("INSERT INTO users (id, name) VALUES (?, ?)").run(id, name);
  console.log(`La till användare "${id}" (${name}).`);
}
console.log("Starta om servern så syns ändringen i användarväljaren.");
