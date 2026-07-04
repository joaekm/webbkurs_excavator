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

## Innehåll

Kursmoduler ligger i `content/` som markdown enligt
[`Innehållskontrakt.md`](Innehållskontrakt.md):

- `content/NN Modulnamn.md` — modul (obligatorisk frontmatter).
- `content/NN Modulnamn.quiz.md` — frivilligt quiz (`modul: NN`).
- `content/images/` — bilder (`![[images/fil]]`).

Innehållet skrivs i Obsidian och kopieras hit manuellt. Efter en ändring:
starta om servern (innehållet cachas vid uppstart).

`99 Exempel.md` + `99 Exempel.quiz.md` är en testfixtur som använder alla
funktioner. Ta bort den när riktiga moduler finns.

## Bildrättigheter

Klaravik-underlagsfoton är tredjepartsbilder och får inte publiceras öppet.
`content/images/` är gitignorad (utom fixturens placeholder). Lägg riktiga
bilder lokalt; de committas aldrig.

## Struktur

```
src/lib/       db, state, content, markdown (remark→rehype), quiz, slug
src/pages/     sidor, api/ (checklist|note|read), media/[...file]
public/js/     module.js, bildgenomgang.js, quiz.js
public/styles.css
content/        kursinnehåll (markdown + images)
data/           SQLite (skapas vid körning, gitignorad)
```
