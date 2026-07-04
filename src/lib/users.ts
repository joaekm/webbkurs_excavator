import { db, DEFAULT_USER_ID } from "./db.ts";

export interface User {
  id: string;
  name: string;
}

/** Alla användare, i namnordning. Skapas manuellt i databasen. */
export function getUsers(): User[] {
  return db.prepare("SELECT id, name FROM users ORDER BY name COLLATE NOCASE").all() as User[];
}

export function getUser(id: string): User | undefined {
  return db.prepare("SELECT id, name FROM users WHERE id = ?").get(id) as User | undefined;
}

/** Löser aktiv användare: cookie-värdet om det matchar en användare, annars
 * standardanvändaren (joakim) om den finns, annars första användaren, annars
 * null (tom users-tabell). */
export function resolveUser(cookieId: string | undefined): User | null {
  const users = getUsers();
  if (users.length === 0) return null;
  if (cookieId) {
    const match = users.find((u) => u.id === cookieId);
    if (match) return match;
  }
  return users.find((u) => u.id === DEFAULT_USER_ID) ?? users[0];
}
