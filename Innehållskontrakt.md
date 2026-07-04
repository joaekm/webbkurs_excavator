# Innehållskontrakt — kursmoduler

Styr hur modulfiler i `Kurs/` skrivs. Kodagenten som bygger webbskalet parsar mot detta kontrakt och behöver aldrig tolka innehållet. Ändringar i kontraktet ska speglas i [[CLAUDE agentinstruktion]].

## Filnamn

`NN Modulnamn.md` där NN är tvåsiffrigt ordningsnummer (00–10).

## Frontmatter

```yaml
---
ordning: 4
titel: "Mark och bärighet"
status: utkast        # utkast | verifierad
kritisk: true         # true för moduler som avgör projektet (4, 5, 7)
tid_min: 25           # uppskattad lästid i minuter
taggar: [mark, bärighet]
---
```

Alla sex fält är obligatoriska.

## Brödtextkonventioner

1. H2 är kursens avsnittsnivå. Skalet genererar ankarnavigation per modul från H2-rubrikerna. H3 används fritt utan navigeringsfunktion.
2. Checklistor skrivs som standard markdown-taskrutor (`- [ ]`). Skalet gör dem interaktiva med tillstånd per användare.
3. Uppgifter som bara kan verifieras vid den levererade maskinen skrivs som kontrollpunkter i löptext eller checklista ("kontrollera vid mottagningen att..."), aldrig som platshållare. Innehållet ska vara komplett och användbart som det står. Referensmaskinen (se projektkortet) skrivs som kursens fakta.
4. Varningar skrivs som blockquote med inledande `VARNING:`. Skalet ger dem avvikande formatering.
5. Interna länkar `[[...]]` pekar bara mellan kursmoduler, aldrig ut i övriga valvet. Länkmål är modulens titel eller filnamn utan ändelse.
6. Bilder refereras med `![[images/<fil>]]` och ligger i `Kurs/images/`.

Tidigare ⧗ VÄNTAR-mekanism och /luckor-aggregering är avskaffade (2026-07-04). Förekomster av `⧗ VÄNTAR:` i äldre innehåll ska skrivas om till kontrollpunkter eller strykas.

## Quizfiler (tillägg 2026-07-03, se [[Kravspec]])

Frivillig fil per modul: `NN Modulnamn.quiz.md` med frontmatter `modul: NN` (matchar modulens `ordning`).

Frågesyntax (utkast, spikas vid första riktiga quizet):

1. `### Fråga: <frågetext>` följt av markdown-lista där rätta alternativ prefixas `[x]` och fel `[ ]`. En rätt ger radiofråga, flera rätta ger checkboxfråga.
2. `### Bildfråga: <frågetext>` följt av `![[bild]]` och hotspot-regioner som rektanglar i procent av bildens bredd/höjd (`x, y, w, h`).

Ingen fritextfrågetyp. Frågeordning enligt filordning, ingen randomisering. Godkänt kräver 100 % rätt, obegränsade försök, senaste försöket räknas.



## Bildgenomgång (tillägg 2026-07-04)

Bilder ligger i `Kurs/images/` (Klaravik-underlag av referensmaskinen, ersätts successivt med egna foton). Koordinater och komponentidentifiering hämtas ur `Kurs/images/INDEX.md`. Referens i brödtext: `![[images/<fil>]]`.

Annoterad bild skrivs som:

```
### Bildgenomgång: Hyttens högra spak
![[images/big_197156_2211167.jpg]]
- 30, 0, 62, 78 | Höger joystick | Bom fram/bak = bom ned/upp. Sida = skopa kryp/töm.
- 62, 4, 30, 35 | Tryckknappar | Fyra kupolknappar, funktion enligt Rototilt-styrningen.
```

Regionrad: `x, y, w, h | etikett | förklaring`, koordinater i procent av bildens bredd/höjd, rektangelns övre vänstra hörn först. Skalet renderar instruktionsläge: bild med markerade områden, tryck/hover visar etikett och förklaring. Samma regiondata får återanvändas av quizens Bildfråga (testläge: "peka på X").

Bildkälla och rättigheter: Klaravik-bilderna är tredjepartsfoton, godtagbara i privat kurs bakom inloggning, får inte följa med vid öppen publicering. Egna foton ersätter dem löpande; vid fotobyte skrivs regiondata om.

## Modulplan

```
00 Kursöversikt          — mål, upplägg, lässordning, projektkoppling
01 Maskinen              — 23-tonnare, skillnad mot minigrävare, tillsyn, uppstart/parkering
02 Rototilt och skopor   — styrning, skopbyte, låskontroll, skopval per moment
03 Grundkörning          — övningsprogression, skopföring, sväng, arbeta mot utsättning
04 Mark och bärighet     — organogen jord, körvägar, känna igen svikt, fastkörning   [kritisk]
05 Schakt och länshållning — arbetsordning, länsgrop, pumpen, proppade diken         [kritisk]
06 Slänter och nivåer    — 1:2–1:3, avvägning med pinnar och vattenpass
07 Vallbygge             — skiktad utläggning, lagervis packning med padda, rörzon   [kritisk]
08 Lyft och rörläggning  — lyfttabell, stenblock, munk, rör med fall
09 Bränsle och tankning  — förbrukning, logistik, förvaring, spillskydd, skatteåterbäring
10 Säkerhet              — riskzon, schaktkant, vältrisk, ensamarbete
```

## Källberoenden

Moduler skrivs mot projektkortet [[Bevattningsdamm]], byggteknikrapporten och researchrapporterna 04–08 (levereras separat, se `Research/Prompt 04`–`08`). Sakuppgift utan källa i utkastläge markeras med ⧗ VÄNTAR eller behålls med status utkast tills verifierad.
