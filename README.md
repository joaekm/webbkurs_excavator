# Webbkurs — bevattningsdamm med grävmaskin

Personlig webbkurs som körs lokalt på egen dator. Ingen inloggning, ingen
fjärrdeploy. Astro SSR + SQLite. Se [`Kravspec.md`](Kravspec.md) och
[`CLAUDE.md`](CLAUDE.md).

## Kör

```bash
npm install          # first only
npm run dev          # utveckling på http://localhost:4321
```

Eller "skarpt" lokalt (Node standalone-server):

```bash
npm run build
npm start
```

Framstegsdata sparas i `./data/course.db` (skapas automatiskt, gitignorad).

## Användare

Flera personer kan dela installationen — ingen inloggning, bara ett namn per
användare med egen progress. Aktiv användare väljs i dropdownen i sidhuvudet
(sparas i en cookie). Standardanvändaren `joakim` skapas automatiskt.

Lägg till en användare:

```bash
npm run add-user -- anna Anna
npm run add-user -- kalle "Kalle Svensson"
```

(eller direkt i databasen: `INSERT INTO users (id, name) VALUES ('anna','Anna');`)

Starta om servern så syns den nya användaren i väljaren. Glömmer du vem som är
vem finns allt i `users`-tabellen.

## Innehåll

Kursmoduler ligger i `content/` som markdown enligt
[`Innehållskontrakt.md`](Innehållskontrakt.md):

- `content/NN Modulnamn.md` — modul (obligatorisk frontmatter).
- `content/NN Modulnamn.quiz.md` — frivilligt quiz (`modul: NN`).
- `content/images/` — bilder (`![[images/fil]]`).

Innehållet skrivs i Obsidian och kopieras hit med `npm run update-content`.
Efter en ändring: **starta om servern** (innehållet cachas vid uppstart).

## Bildrättigheter

Klaravik-underlagsfoton är tredjepartsbilder och får inte publiceras öppet.
`content/images/` är gitignorad. Lägg riktiga bilder lokalt; de committas aldrig.

## Struktur

```
src/lib/       db, state, content, markdown (remark→rehype), quiz, slug
src/pages/     sidor, api/ (checklist|note|read), media/[...file]
public/js/     module.js, bildgenomgang.js, quiz.js
public/styles.css
content/        kursinnehåll (markdown + images)
data/           SQLite (skapas vid körning, gitignorad)
```
