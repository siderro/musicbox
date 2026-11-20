# Plán: škola doprovodu

Stav (2026-11-20): fáze 0–4 hotové, fáze 5 částečně (drop 2 je sazba, walking bass ne). Boogie chůze, basové přechody a wiki doprovodu pro všechna kolečka hotové.

## Co je hotové
- Engine hmatů (`js/comp/voicing-engine.js`) a sazby (`js/data/voicings.js`): open, barré, shell, trojzvuky, barvy 6 a 9, bas + akord, boogie, drop 2.
- Rytmy (`js/data/rhythms.js`, `js/comp/strum.js`) a zvuk kytary (`js/audio/guitar.js`).
- Záložka **Doprovod** (`js/ui/comp-panel.js`, `css/comp.css`): konzole v duchu decku (lišty sazeb A a rytmů R, VFD, klávesy režimů), mapa kolečka s diagramy a odpočtem, velký diagram + hmatník, mřížka rytmu nad tabulaturou, wiki (W).
- Groovebox (`js/programs/groove-program.js`) hraje na záložce Doprovod (a v Sólování s přepínačem *Doprovod: kytara*) místo kláves kytaru: události segmentu se spočítají při změně akordu (`js/comp/comp-plan.js`) a v každém kroku se zahrají ty, které padnou do kroku.
- Režimy Ukázka / Hraju sám / Střídání; doporučený groove k rytmu se jen nabízí.
- Wiki doprovodu (`js/data/comp-wiki.js`) pro všechna kolečka; kontrola ve `validateAll`.
- Boogie: horní tón dvojhmatu chodí po dobách 5–6–♭7–6 (`shape.walk`) v každém rytmu (shuffle, rock s dlaní, osminy).
- Basové přechody: v sazbě bas + akord u rytmů s `walkBass` (tramp, valčík, polka) zazní na poslední osminu před změnou tón o krok od dalšího kořene (`bassApproach` v `comp-plan.js`); ne při „drž akord“, otázce–odpovědi a skoku.
- Kytara v grooveboxu plánuje události po oknech kroků v dobách segmentu (`eventsInBeats`) – změna tempa uprostřed taktu nic nezdvojí ani nevynechá.

## Zbývá
- Delší basové přechody (2–3 osminy po stupnici), walking bass.
- Prsty v diagramu (zatím intervaly nebo názvy tónů).

## Cíl
Vedle Sólování nová záložka **Doprovod**: k vybranému kolečku učí, jak ho hrát jako doprovodná kytara. Dvě nezávislé volby, které se dají libovolně kombinovat:

- **Sazba** = jakými hmaty kolečko zahraješ (otevřené akordy, shell chords, trojzvuky na horních strunách …).
- **Rytmus** = co s nimi pravou rukou děláš (úhozy, prstoklad, valčík, swing po čtvrtích …).

Kostra je stejná jako u Sólování, aby se nemusel učit nový ovladač: lišta nahoře (sazba klávesou A, rytmus klávesou R), uprostřed hmaty, dole tabulatura, vpravo wiki (W).

## Sazby (obdoba přístupů)

| Sazba | Úroveň | Co to je | Kde se hodí |
|---|---|---|---|
| Otevřené akordy | 1 | táborákové hmaty, kde to jde, jinak barré | lidovka, tramp |
| Barré E/A tvar | 1 | dva tvary posouvané po hmatníku | pop, rock |
| Shell chords | 2 | 1-3-7 / 1-7-3 na strunách 6 a 5, tři tóny | jazz, swing, ii–V–I |
| Trojzvuky nahoře | 2 | obraty na strunách 1–3 (2–4), vždy nejbližší obrat | pop, folk, druhá kytara |
| Barvy 6 a 9 | 2 | C6, C6/9, Am9, Fmaj7 … místo holých kvintakordů | romantika, bossa |
| Bas + akord | 2 | střídavý bas (kořen–kvinta) a úder, Carter style | tramp, country, polka, valčík |
| Dvojhmaty a shuffle | 1 | 5-6 bluesový boogie, power chords | blues, rock |
| Drop 2 | 3 | čtyřhlasé septakordy na 4 strunách, vedení hlasů | jazz |

Engine sazby: pro každý akord kolečka najde hmat na daných strunách, v rozpětí nejvýš 4 pražců, a vybere ten, kde se ruka a hlasy pohnou co nejmíň. Ukáže, které tóny zůstávají a který prst se posouvá.

## Rytmy

- **Úhozy:** mřížka ↓ ↑ s přízvuky, tlumením (×) a „prázdným“ úhozem.
- **Prstoklad:** Travis, arpeggio p-i-m-a, „boom-chick“.
- **Podle stylu:** valčík 3/4, polka 2/4, swing po čtvrtích (Freddie Green), charleston, bossa, reggae, funk šestnáctiny, shuffle.

Každý rytmus má takt a feel, nabízí se jen ten, který sedí do taktu kolečka.

## Přehrávání
- Groovebox hraje bicí a basu, aplikace navíc kytarový doprovod v dané sazbě a rytmu (syntéza `pluck.js`, úhoz = tóny rozprostřené o pár ms, směr dolů/nahoru).
- **Režimy:** ukázka, hraju sám (kytara ztlumená, jen bicí a basa), střídání po taktech.
- Před změnou akordu se rozbliká další hmat a odpočítá „za 2 → za 1“, jako pruhy v Sólování.

## Propojení se Sólováním
- **Vybraná sazba a rytmus můžou být doprovodem při sólování** (místo dnešních kláves v grooveboxu).
- Shell chords jsou přesně vodicí tóny 3 a 7: co hraješ v Sólování jako „linku vodicích tónů“, je v Doprovodu horní hlas hmatu. Wiki to ukáže na obou místech.

## Data
- `js/data/voicings.js`: sazby, sady strun, šablony intervalů podle druhu akordu (maj7, 7, m7, m7♭5, 6, 9 …).
- `js/data/rhythms.js`: rytmy jako řetězce kroků (`D.DU.UDU`, `p.i.p.m`), takt, feel, styl.
- `wiki.js`: u kolečka sekce `comp` (pořadí sazeb a rytmů, poznámky, cvičení).

## Fáze
0. Engine hmatů na hmatníku a testy: akord v libovolné tónině na dané sadě strun, rozpětí, vedení hlasů.
1. Záložka Doprovod: diagramy hmatů po kolečku, sazby otevřené, barré, shell a trojzvuky.
2. Rytmy úhozů: mřížka, přehrávání kytary synchronně s grooveboxem.
3. Prstoklad a bas + akord (Travis, boom-chick, valčík).
4. Wiki doprovodu ke kolečkům, propojení se Sólováním (sazba jako doprovod sóla).
5. Jazz navíc: drop 2, walking bass.
