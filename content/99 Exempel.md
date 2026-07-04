---
ordning: 99
titel: "Exempel (fixtur)"
status: utkast
kritisk: true
tid_min: 5
taggar: [fixtur, demo]
---

## Vad den här filen är

Det här är en **testfixtur** som använder alla funktioner webbskalet stöder.
Den finns för att appen ska ha något att rendera under utveckling. Ta bort
filen (och `99 Exempel.quiz.md`) när riktiga moduler kopierats in i `content/`.

Den här modulen länkar till [[Exempel (fixtur)]] (sig själv) och till en modul
som inte finns än, [[04 Mark och bärighet]] — den senare ska renderas som vanlig
text med en konsolvarning, aldrig krascha.

### Underrubrik utan navfunktion

H3 renderas men hamnar inte i ankarnavigeringen. Bara H2 blir navpunkter.

## Checklistor

Kryssrutorna nedan är interaktiva och sparas lokalt per modul och radindex:

- [ ] Första punkten att bocka av
- [ ] Andra punkten
- [ ] Tredje punkten

## Varningar

> VARNING: Blockquotes som börjar med VARNING: renderas som röd varningsruta.
> Använd dem för säkerhetskritiska punkter.

## Bilder och bildgenomgång

En vanlig inline-bild refereras med wiki-bildsyntax:

![[images/exempel-maskin.svg]]

En bildgenomgång visar samma bild med klickbara regioner:

### Bildgenomgång: Maskinens huvuddelar
![[images/exempel-maskin.svg]]
- 24, 34, 40, 25 | Bom | Den yttre armen som lyfter aggregatet upp och ut.
- 22, 34, 15, 24 | Sticka | Länken mellan bom och skopa som når in och ut.
- 22, 52, 14, 18 | Skopa | Verktyget som gräver; byts efter arbetsmoment.
- 42, 52, 20, 22 | Hytt | Förarplatsen med reglage och monitor.
- 58, 56, 15, 18 | Motvikt | Balanserar aggregatets tyngd; svänger ut bakåt.

## Avslutning

Nästa/föregående-knappar och "markera som läst" finns i sidfoten. Har modulen
en quizfil dyker en quizlänk upp längst ned.
