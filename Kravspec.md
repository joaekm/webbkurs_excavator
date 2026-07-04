# Kravspec — webbkurs bevattningsdamm

Slutgiltig spec efter dialog 2026-07-03. Ersätter de delar av [[CLAUDE agentinstruktion]] som gäller webbskalet — [[Innehållskontrakt]] gäller fortfarande för hur modul-markdown skrivs, med tillägget för quiz-filer nedan.

## Syfte och avgränsning

Personlig webbkurs för att förbereda mig själv (Joakim) för att bygga en bevattningsdamm med grävmaskin. Enda planerade användaren är jag. Läses hemma i soffan, inte i hytten. **Körs lokalt på min egen dator** — ingen server ute på nätet, ingen inloggning.

Icke-mål: **inloggning/konton**, **fjärrdeploy**, offline-läge, multi-user, admin-UI, sökfunktion, cookie-samtycke, mörkt läge, animationer, analytics, e-post-utskick, mobilinstallation som PWA.

> Revidering 2026-07-04 (efter auth): Kursen körs lokalt utan inloggning. Lucia, `users`- och `sessions`-tabellerna, sidorna `/logga-in` och `/skapa-konto`, samt Hetzner/Caddy-deploy utgår helt. Framstegsdata knyts inte längre till en användare — det finns en enda underförstådd användare (jag) och all state ligger i en lokal SQLite-fil. Astro SSR + `better-sqlite3` behålls.

## Innehåll utanför appen

Modulerna skrivs i Obsidian, `Bevattningsdamm/Kurs/`. När sajten ska uppdateras kopierar jag markdown-filerna manuellt till repots `content/`. Ingen sync-script, ingen CI-koppling till valvet.

### Modulfil

Enligt [[Innehållskontrakt]]. Kort sammanfattning:

- Filnamn `NN Modulnamn.md`, NN tvåsiffrigt 00–10.
- Frontmatter (alla obligatoriska): `ordning` int, `titel` str, `status` `utkast|verifierad`, `kritisk` bool, `tid_min` int, `taggar` str-lista.
- H2 = avsnitt, genererar ankarnav. H3 renderas utan navfunktion.
- `- [ ]` = interaktiv checkruta. State per user + modul + radindex i databasen.
- `⧗ VÄNTAR: text` på egen rad = gul platshållare, aggregeras till `/luckor`.
- Blockquote som börjar med `VARNING:` = röd/orange varningsruta.
- `[[Länk]]` = intern länk (matchar annan moduls filnamn utan `.md` eller dess titel).
- `![[fil]]` = bild från `content/Assets/`.

### Quiz-fil (nytt tillägg)

Frivillig fil per modul: `NN Modulnamn.quiz.md`.

Frontmatter (obligatorisk):

```yaml
---
modul: 4
---
```

Fältet `modul` matchar den relaterade modulens `ordning`. Om filen finns men modulen saknas → byggvarning, filen ignoreras.

Brödtexten består av en sekvens frågeblock. Format:

**Radio och checkbox** — samma syntax, typen härleds från antal `[x]`:

```markdown
### Fråga: Vilken jordart är mest problematisk vid schakt?
- [ ] Morän
- [x] Organogen jord (torv, gyttja)
- [ ] Sand
- [ ] Grovlera
```

Exakt ett `[x]` → radio (ett rätt svar). Två eller fler `[x]` → checkbox (flera rätta). Noll `[x]` → byggvarning, frågan hoppas över.

**Bildfråga (hotspot):** — syntax spikad 2026-07-04 vid första riktiga quizen (01, 03). Bildfrågan återanvänder Bildgenomgångens regionrads-format: bild följt av en regionrad som anger rätt område.

```markdown
### Bildfråga: Peka på delen som sveper i en dödzon bakåt när du svänger.

![[images/big_197156_2211209.jpg]]
- 78, 48, 20, 22 | Motvikten | Rätt. Sticker ut ca 3 m bakom banden och sveper runt vid sväng.
```

Regionraden: `x, y, w, h | etikett | förklaring`, koordinater i procent av bildens bredd/höjd (0–100), övre vänstra hörn först — exakt som Bildgenomgång. Klick inom rektangeln räknas som rätt. Etikett och förklaring visas som feedback efter inlämning. Ett hotspot per bildfråga i första versionen; behövs flera utökas syntaxen då.

Fenced `​```hotspot`-block med `x:/y:/w:/h:` (tidig utkastsyntax) accepteras fortfarande av parsern som fallback, men regionraden är den kanoniska formen.

**Regler:**

- Frågeordning = filordning. Ingen randomisering.
- Godkänd = alla frågor rätt. Se [Sidor](#Sidor).
- Ingen fritext-frågetyp.
- Bilder till bildfrågor läggs i `content/images/` (samma som modulbilder).



### Bildgenomgång (tillägg 2026-07-04)

Ny innehållstyp utöver modul- och quizfiler: annoterade bilder enligt syntax i [[Innehållskontrakt]] (`### Bildgenomgång:` + bild + regionrader `x, y, w, h | etikett | förklaring`, procentkoordinater). Funktion: instruktionsläge där bildregioner visas interaktivt på modulsidan med etikett och förklaring, samt återanvändning av samma regiondata i quizens bildfrågor. Bilder i content/images/. Källbilder inledningsvis från Klaravik-annonser (privat bruk bakom inloggning, ej för öppen publicering), ersätts med egna foton från maskinleveransen; regiondata skrivs om vid fotobyte.

## Användarupplevelse

### Flera användare, ingen inloggning

Kursen körs lokalt utan konton eller lösenord. Flera användare kan dela installationen — varje användare har bara ett **namn** och sin egen kursprogress. Användare skapas manuellt i databasen (`users`-tabellen; `npm run add-user -- <id> <namn>` eller ren SQL). Ingen registrering i UI, ingen auth, inga sessioner, inga inloggningssidor.

Aktiv användare väljs via en namn-dropdown i sidhuvudet och sparas i en cookie (`course_user`). All framstegsdata nycklas per `user_id`. Utan cookie faller valet tillbaka på standardanvändaren (`joakim`).

### Sidor

**`/` — startsida**
Lista över alla moduler i `ordning`. Per modul:
- Titel + `ordning`-nummer
- Statusmärke: grå för `utkast`, grön för `verifierad`. Utkast är läsbara.
- `Kritisk`-flagga för moduler markerade så (4, 5, 7)
- Lästid (`tid_min`)
- Tre separata progressindikatorer:
  1. Checkrutor: `avbockade / totala`
  2. Läst-status: bock om `markera som läst` är klickad
  3. Quiz-status: `godkänd` (grön), `försökt men ej godkänd` (röd), `ej försökt` (grå), eller `saknar quiz` (dolt)

**`/modul/<slug>` — modulsida**
- Renderat markdown-innehåll.
- Sticky ankarnav från H2-rubrikerna.
- Interaktiva checkrutor, state sparas lokalt.
- `VARNING:`-block som röda varningsrutor.
- Bildgenomgångar (annoterade bilder, se [[Innehållskontrakt]]) i interaktivt instruktionsläge.
- Bilder från `content/images/` visas inline.
- Föregående/nästa-knapp i botten.
- "Markera som läst"-knapp i botten (togglar av/på).
- Textfält för egna anteckningar per modul. Autospar lokalt.
- Om modulen har en quiz-fil: länk längst ner till `/modul/<slug>/quiz`.

**`/modul/<slug>/quiz` — kunskapskontroll**
- Visa alla frågor på en sida.
- Svara på alla, klicka "lämna in".
- Efter inlämning: visa vilka som var rätt/fel, visa rätta svar för de missade.
- Godkännande-tröskel: **100% rätt**. Alla frågor måste vara rätt för `godkänd`.
- Obegränsat antal försök. Endast senaste försöket sparas.
- Godkänd/ej godkänd-status påverkar bara märket på startsidan. Ingen modul låses.

**`/checklistor`**
Alla checklistor från alla moduler samlade. Samma state som modulsidorna.

## Datamodell (SQLite)

`users` håller bara id + namn (ingen lösenordshash, inga sessioner). All progress nycklas per `user_id` + `module_slug`.

```
users(id TEXT PRIMARY KEY, name TEXT)
module_reads(user_id TEXT, module_slug TEXT, read_at INTEGER, PRIMARY KEY(user_id, module_slug))
checklist_state(user_id TEXT, module_slug TEXT, item_index INTEGER, checked INTEGER, PRIMARY KEY(user_id, module_slug, item_index))
notes(user_id TEXT, module_slug TEXT, body TEXT, updated_at INTEGER, PRIMARY KEY(user_id, module_slug))
quiz_attempts(id TEXT PRIMARY KEY, user_id TEXT, module_slug TEXT, submitted_at INTEGER, passed INTEGER, answers_json TEXT)
```

Ett `quiz_attempts`-rad per försök. Godkänt-status per modul = senaste försöket:
`SELECT passed FROM quiz_attempts WHERE user_id = ? AND module_slug = ? ORDER BY submitted_at DESC LIMIT 1`.

## Teknik

- **Framework:** Astro med SSR-adapter (`@astrojs/node` i `standalone` mode).
- **DB:** SQLite via `better-sqlite3`. Filen `./data/course.db` (lokalt).
- **Auth:** ingen. Flera användare (bara `id` + `namn`) i `users`-tabellen, skapas manuellt. Aktiv användare via cookie, väljs i en dropdown i sidhuvudet.
- **Markdown-parsning:** `gray-matter` för frontmatter, `remark`/`rehype`-pipeline för brödtext (`remark-parse` + `remark-gfm` → custom mdast-plugins → `remark-rehype` + `rehype-raw` → `rehype-stringify`). Custom plugins för `VARNING:`, `[[wiki-länkar]]`, `![[bilder]]`, `### Bildgenomgång`-block och indexerade interaktiva checkrutor. (Avvikelse från tidigare `remark-html`: custom-blocken kräver hast-nivå-kontroll som `remark-html` inte ger rent.)
- **Rendering:** SSR per request (för att injecta min progression). Innehållet läses från disk vid varje request eller cachas i minnet vid uppstart — bestäms i implementationen.
- **Fonter:** systemfonter.
- **Ingen** klient-side JS-framework. Vanilla-JS för checkrutor/quiz-interaktion. Islands endast där det behövs.

## Körning (lokalt)

Ingen deploy. Kursen körs på min egen dator:

- Utveckling: `npm run dev` (Astro dev-server).
- "Skarpt" lokalt: `npm run build` följt av `npm start` (Node standalone-server på localhost).

SQLite-filen ligger i `./data/course.db` och skapas automatiskt vid första start. Content läses från `./content/`. Content-uppdatering: kopiera in nya markdown-filer i `content/` och starta om servern (innehållet cachas vid uppstart).

Repo på GitHub för backup/versionshantering. Ingen CI, ingen fjärrdeploy. (Docker/Caddy/Hetzner utgår — kan återinföras senare om kursen ska ligga ute på nätet, men är inte i kravbilden nu.)

## Exempel-innehåll (fixture)

Repot innehåller en fake-modul `99 Exempel.md` som använder alla features (checkrutor, `⧗ VÄNTAR`, `VARNING:`, wiki-länk, bild) och en `99 Exempel.quiz.md` som demonstrerar alla frågeformat. Används som testfixtur under utveckling. Tas bort (eller flaggas i frontmatter) när riktiga moduler kopierats in.

## Öppna punkter före bygg

Alla punkter stängda 2026-07-03. Utestående för framtiden:

- **Riktiga moduler** kopieras från Obsidian till `content/` när de är skrivna.
- **Eventuell fjärrdeploy** (Docker/VPS/domän) — utanför nuvarande kravbild, återinförs bara om kursen ska ut på nätet.

## Historik

- 2026-07-03: initial spec skriven efter dialog om obsidianinnehåll och stackval.
- 2026-07-03: quiz-syntax spikad (radio/checkbox via checkboxes, hotspot via fenced code-block). Öppna punkter stängda. Repo skapat på GitHub.

- 2026-07-04: flera användare återinförda i minimal form — `users`-tabell med bara id + namn (ingen lösenordshash, inga sessioner). Skapas manuellt i databasen; aktiv användare väljs i en dropdown och sparas i cookie. All progress nycklas per user_id. Fortfarande ingen inloggning.
- 2026-07-04: inloggning/auth (Lucia), users/sessions-tabellerna, sidorna /logga-in och /skapa-konto samt Hetzner/Caddy/Docker-deploy utgår. Kursen körs lokalt utan konton, en underförstådd användare, state i lokal SQLite-fil. Markdown-pipelinen förtydligad (remark→rehype i stället för remark-html).

2026-07-04: ⧗ VÄNTAR-mekanismen och sidan /luckor utgår ur kravbilden. Innehåll skrivs komplett mot referensmaskinen (Klaravik HX260L, se projektkortet); maskinspecifika osäkerheter hanteras som kontrollpunkter i innehållet, inte som platshållare i appen. Bildgenomgång tillkommer som innehållstyp (se tillägg ovan och [[Innehållskontrakt]]).
