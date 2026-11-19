# Plán: škola doprovodu

Stav: návrh (2026-11-19), nic se zatím neimplementuje.

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
