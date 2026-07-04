// Stabil slug från modultitel. Svenska tecken → ascii. Används i URL:er och
// som DB-nyckel (module_slug) — måste vara deterministisk över omstarter.
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
