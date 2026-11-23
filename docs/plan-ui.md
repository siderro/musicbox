# Plán: generační změna UI

Konec skeuomorfismu. Musicbox přestane vypadat jako sbírka přístrojů (deck ORIKAWA, ladička HAYASE, metronom KOHAKU) a bude to stránka jako dobře vysázená učebnice: bílý papír, černý text, šedé odstíny, modré odkazy (navštívené fialové).

Stará podoba zůstává na památku:

- screenshoty v [`docs/legacy-ui/`](legacy-ui/);
- git tag `v1-skeuo`, ze kterého jde starou verzi kdykoli spustit.

## Zásady

1. **Výuka je vidět, servis je malý.** Hmatníky, hmaty, tabulatura, rytmus a text wiki jsou velké a hned na očích. Přehrávání, tempo, tónina, zvuk, mix a klávesové zkratky jsou malé, textové a v jednom řádku nahoře.
2. **Maximální informační hustota.** Žádné karty, stíny, zaoblené dlaždice ani velké mezery. Tabulky, seznamy a odstavce. Co se vejde na jednu obrazovku, má být na jedné obrazovce.
3. **Žádné fejky.** Pryč jsou VU-metry, LED diody, kazeta, displeje, šroubky, „PULSE LOCK“, falešné značky a výrobní štítky. Ukazuje se jen to, co nese informaci.
4. **Stav se ukazuje typografií.** Vybraná položka je tučně (případně černé pozadí, bílý text). Právě hraný takt nebo akord je podtržený nebo invertovaný. Nic nebliká kvůli efektu.
5. **Barvy:** černá, bílá a šedé, modrá pro odkazy, plus barvy pruhů (viz níže). Ovládací volby (přístup, sazba, rytmus, kolečko) jsou odkazy, ne tlačítka.
6. **Písmo:** systémové (`system-ui`, Helvetica) a monospace na tabulaturu, hmaty a čísla. Žádné Google Fonts (dnes se jich načítá 9 rodin).

## Rozvržení

Jedna stránka na celou šířku, bez levého panelu.

```
Musicbox   Sólování · Doprovod · Ladička · Metronom          ▶ přehrát  ■  takt 3/8 · A dur · 132 bpm · zvuk · mix · ?
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Kolečko: Valčík I–IV–V7 ‹ › · Tónina A dur ‹ › · Groove Valčík 3/4 ‹ ›

V čem sólovat                                                    │  Wiki (sloupec vpravo, na úzkém displeji pod tím)
Přístup: Od tercie · Tóny akordu · Druhý hlas · C♯m·F♯m·Bm · …  │  Toto kolečko …
                                                                 │  Rozbor (tabulka) …
| A    | A    | D    | D    | E7   | E7   | A    | A    |        │  Přístupy …
| I T  | I T  | IV S | IV S | V D  | V D  | I T  | I T  |        │
| C♯m  | C♯m  | F♯m  | F♯m  | G♯°  | G♯°  | C♯m  | C♯m  |        │
                                                                 │
C♯m · od tercie A   (hmatník)       licky: ▸ lick 1 ▸ lick 2    │
F♯m · od tercie D   (hmatník)                                    │
G♯° · od tercie E7  (hmatník)                                    │
Tabulatura …                                                     │
```

- **Horní řádek (servis):** záložky, přehrát/stop, takt, tónina, tempo, zvuk, mix, nápověda ke klávesám (`?`). Malé písmo, jeden řádek.
- **Druhý řádek:** kolečko, tónina, groove. Malé, ale čitelné, protože určují, co se učím.
- **Mix** (bicí, akordy, basa, lick): čtyři malé posuvníky v rozbalovacím `mix`. Tempo jako číslo s ‹ › a tap.
- **Wiki** je sloupec vpravo, normální text. Žádný panel s rámečkem, žádné tlačítko „Wiki“ navíc. Klávesa W ho skryje nebo ukáže.

## Záložky

**Sólování**

- Přístupy jsou řádek odkazů, vybraný tučně.
- Mapa kolečka je tabulka: akord, stupeň a funkce, pruh. Hraný takt je invertovaný.
- Pruhy jsou černobílé hmatníky pod sebou. Aktivní pruh má plný kontrast, ostatní jsou šedé. Odpočet „za 2 → za 1“ zůstává jako text, protože je výukový.
- Licky jsou odkazy u pruhu.

**Doprovod**

- Sazba a rytmus jsou dva řádky odkazů. Režim (ukázka / hraju sám / střídání) je malý přepínač.
- Diagramy hmatů jsou v řadě. Hraný je invertovaný a další má odpočet.
- Pod nimi velký diagram + hmatník, mřížka rytmu a tabulatura. Tabulatura je černá na bílé, jak už teď je.

**Ladička**

- Velký název tónu, odchylka v centech číslem a jednoduchá stupnice −50…+50 s jednou čárou: skutečné měření, žádná ručka VU-metru.
- Struny E A D G B e jsou odkazy pro referenční tón. Mikrofon zap/vyp, kalibrace A4 a režim kytara/chromaticky jsou malé.

**Metronom**

- Velké číslo BPM a řada dob (přízvuk tučně, hraná doba invertovaná).
- Takt, dělení, zvuk a přízvuk jsou malé odkazy. Tap, start a stop.
- Tempo metronomu zatím zůstává samostatné (jiný rozsah 30–260); sloučení s grooveboxem je samostatná změna chování.

## Barvy funkcí

Barvy pruhů zůstávají, je to jediná barva na stránce mimo odkazy, a proto má být výrazná a názorná. Na bílém pozadí půjde o sytou zelenou, oranžovou a červenou, ne fialovou (ta patří odkazům). Funkci akordu navíc nese značka T / S / D.

**Hmatníky a značky musí být dobře vidět** (dřív byly málo vidět):

- větší tečky a tučnější popisky;
- tečky aktivního pruhu plné v barvě pruhu, kořen jako čtvereček, tón hraného akordu se silným černým kroužkem;
- neaktivní pruhy a tečky mimo okno ruky ztlumené jen mírně, aby zůstaly čitelné;
- světlý krk, tmavé struny a pražce, čísla pražců čitelná.

## Technický postup

Funkce, klávesy, data a zvuk se nemění. Mění se jen vrstva `css/` a `js/ui/`.

1. **Nový základ.** Nový `css/base.css` s tokeny (bílá, černá, 3–4 šedé, modrá, fialová, jedno písmo, monospace). Odstranit Google Fonts a staré `tokens.css`, `deck.css`, `tuner.css`, `metronome.css`.
2. **Horní lišta místo decku.** `js/ui/deck.js` → `js/ui/bar.js`: stejný stav a akce (přehrát, stop, odpočet, na začátek, držet akord, kolečko, tónina, groove, zvuk, tempo, mix), jen jako text a malé ovládací prvky.
3. **Sólování a Doprovod.** Přestylovat `solo-panel.js` a `comp-panel.js`: čipy → odkazy, karty → tabulky, wiki jako sloupec. Hmatníky, diagramy a tabulatura přebarvené přes CSS na černobílé (SVG už používá CSS třídy).
4. **Ladička a metronom.** Přepsat `tuner-view.js` a `metronome-view.js` na prostý layout. Logika ladění (`js/tuner/`) a metronomu (`programs/`) zůstává.
5. **Kontrola.** Šířky 1280, 1440 a mobil, testy (`npm test`), proklikat všechny záložky a klávesy na GitHub Pages.

Každý krok bude zvlášť commitnutý a pushnutý, takže je vidět na https://siderro.github.io/musicbox/.
