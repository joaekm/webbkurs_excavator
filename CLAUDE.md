# Webbkurs grävmaskinshantering — byggagentens instruktion

## Uppgift
Bygg en personlig webbkurs enligt `Kravspec.md` (repots rot, kopierad från
valvet). Innehållet är markdownfiler i `content/` och ägs av en annan process
(skrivs i Obsidian och kopieras in manuellt). Du bygger appen, aldrig innehållet.

## Hårda regler
1. Rör aldrig filer i `content/`. Läs, parsa, rendera. Skriv inte.
   Undantag: fixturen `99 Exempel(.quiz).md` får skapas och ändras.
2. `Kravspec.md` är auktoritativ. Avvik inte utan att flagga det explicit i
   PR/commit-text.
3. Ingen egen tolkning av innehållet: fil som bryter mot kontraktet renderas så
   långt det går, avvikelsen loggas vid uppstart. Gissa aldrig. Olöst
   `[[wiki-länk]]` renderas som vanlig text plus konsolvarning, aldrig krasch.
4. Bygg inkrementellt körbart: appen ska starta och rendera det som finns i
   `content/` efter varje steg, även om det bara är fixturen.

## Kör lokalt — ingen auth, ingen deploy
Kursen körs på egen dator, en enda underförstådd användare, inga konton.

- Utveckling: `npm run dev`
- Standalone: `npm run build && npm start`

State (checkrutor, läst, anteckningar, quizförsök) ligger i `./data/course.db`
(SQLite, skapas automatiskt). Content läses från `./content/` och cachas vid
uppstart — starta om servern efter innehållsändring.

## Stack (låst i kravspec)
- Astro med SSR (`@astrojs/node`, standalone mode)
- SQLite via `better-sqlite3`, dbfil `./data/course.db`
- Ingen auth. Ingen `users`/`sessions`-tabell. Nyckel = `module_slug`.
- Markdown: `gray-matter` + remark→rehype-pipeline (`remark-parse`,
  `remark-gfm`, custom mdast-plugins, `remark-rehype`, `rehype-raw`,
  `rehype-stringify`) med custom plugins för `VARNING:`-blockquotes,
  `[[wiki-länkar]]`, `![[bilder]]`, `### Bildgenomgång`-block och indexerade
  interaktiva checkrutor.
  - **Flaggad avvikelse:** kravspecen nämnde ursprungligen `remark-html`. Vi
    använder remark→rehype i stället eftersom custom-blocken kräver
    hast-nivå-kontroll som `remark-html` inte ger rent. Samma familj, mer
    kapabel. Se `Kravspec.md` (Teknik).
- Ingen klient-side framework. Vanilla-JS för checkrutor, quiz och
  bildgenomgångar (`public/js/`).
- Systemfonter. Inget offline-läge, ingen PWA, ingen sökfunktion, inget
  mörkt läge, inga animationer, inga analytics.

## Innehållskontrakt (sammanfattning, detaljer i `Innehållskontrakt.md`)
Modulfiler: `content/NN Modulnamn.md`, NN = 00–10.
Frontmatter (obligatorisk): `ordning` int, `titel` str,
`status` utkast|verifierad, `kritisk` bool, `tid_min` int, `taggar` lista.
Brödtext: H2 = avsnitt med ankarnav; `- [ ]` = interaktiv checkruta (state i DB
per modul+radindex); blockquote `VARNING:` = röd varningsruta;
`![[images/fil]]` = bild från `content/images/`.
Quizfiler: `content/NN Modulnamn.quiz.md`, frontmatter `modul: NN`.
Bildgenomgång: `### Bildgenomgång: <rubrik>` följt av `![[images/fil]]` och
regionrader `x, y, w, h | etikett | förklaring` (procent av bildens bredd/höjd,
övre vänstra hörn). Renderas som bild med markerade rektanglar; tap/hover visar
etikett + förklaring. Quizens Bildfråga får referera samma bild och regioner
som hotspot-mål.

## Bildrättigheter
Klaravik-underlagsfoton är tredjepartsbilder — får bara användas i privat kurs,
aldrig committas till repot. `content/images/` är gitignorad (utom fixturens
egna placeholder-SVG). Lägg riktiga bilder lokalt.

## Sidor
- `/` — startsida: modullista med status-, kritisk- och lästidsmärken plus tre
  progressindikatorer (checkrutor, läst, quiz).
- `/modul/<slug>` — modulsida: innehåll, sticky ankarnav, checkrutor,
  bildgenomgångar, markera-som-läst, anteckningsfält med autospar, prev/nästa,
  quizlänk.
- `/modul/<slug>/quiz` — alla frågor på en sida, rätta efter inlämning,
  godkänt = 100 %, obegränsade försök, senaste räknas.
- `/checklistor` — alla checklistor samlade, samma state som modulsidorna.
- Inga inloggningssidor. Alla sidor öppna (lokal körning).

## Datamodell
`module_reads`, `checklist_state`, `notes`, `quiz_attempts` (inga
users/sessions). Nyckel = `module_slug`. Quizstatus per modul = senaste
försöket, inte bästa.

## Projektstruktur
- `src/lib/` — db, state (DB-queries), content (laddar/cachar), markdown
  (remark→rehype), quiz (parse + rättning), slug.
- `src/pages/` — sidor + `api/` (checklist, note, read) + `media/[...file]`
  (serverar bilder från content/images).
- `public/js/` — module.js, bildgenomgang.js, quiz.js.

## Definition of done
- Appen bygger och startar med enbart fixturen i `content/`.
- En riktig modulfil kan läggas in och renderas utan kodändring.
- Checkrutor, läststatus, anteckningar och quizförsök överlever omstart av
  servern (ligger i `./data`).
- Avvikelser mot innehållskontraktet loggas, kraschar aldrig appen.
