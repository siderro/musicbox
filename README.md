# Musicbox

Webová stránka na cvičení kytary:

- **Groovebox**: bicí groove, harmonické kolečko v libovolné tónině a basa.
- **Sólování**: přístupy k improvizaci, hmatníky pod sebou podle funkce akordu, wiki ke každému kolečku.
- **Ladička**: přes mikrofon.
- **Metronom**: klik, woodblock nebo bicí.

Celé je to čistý HTML/CSS/JS bez buildu a bez závislostí. Zvuk se syntetizuje přímo v prohlížeči (Web Audio API).

## Spuštění

```sh
python3 serve.py          # http://localhost:8000
```

Proč ne `python3 -m http.server`: ten má frontu spojení jen 5. Při načítání desítek JS modulů najednou občas spojení odmítne a stránka zůstane prázdná. Na GitHub Pages tenhle problém není.

Mikrofon (ladička) funguje jen na `localhost` nebo přes HTTPS.

## Sólování: přístupy, pruhy a wiki

- **Přístup** je způsob, jak do kolečka sólovat. Příklady:
  - „Od tercie“;
  - „Em ↔ Dm“ (přes tóniku jiná pentatonika než přes subdominantu a dominantu);
  - jedna pentatonika;
  - tóny akordu;
  - zmenšená přes dominantu;
  - harmonická moll přes V7.

  Vybírá se na liště nahoře nebo klávesou **A**. Aplikace si volbu pamatuje pro každé kolečko.
- **Pruhy** jsou hmatníky pod sebou. Každý ukazuje jednu oblast, například Em pentatoniku. Svítí ten, který sedí na právě hraný akord. Před změnou pruhu se rozbliká další a odpočítá „za 2 → za 1“. Pod pruhy je pak spojka, třeba „F → E (3 v C)“.
- **Popisky teček:** intervaly vůči hranému akordu, takže Em pentatonika nad C ukazuje 3 5 6 7 9. Klávesou **L** se přepínají na názvy tónů nebo intervaly vůči zdroji.
- **Mapa kolečka** ukazuje, který pruh hraje v kterém taktu, a funkci akordu (tónika, subdominanta, dominanta).
- **Licky a linky patří k pruhům.** U každého pruhu jsou tlačítka s licky právě pro jeho zdroj. Lick se zahraje přes nejbližší akord toho pruhu a kotví se k jeho zdroji, takže Dm lick zazní přes F nebo G7, ne přes C.
  - Licky „přes změnu“ začnou tak, aby za taktovou čárou dopadly na tón dalšího akordu. Příklad v C: přes G7 se točíš kolem F a na C sjedeš na E.
  - Tlačítka „Celé kolo“ zahrají linku přes všechny akordy od příštího taktu, například melodii z tercií nebo linku vodicích tónů.
  - Pod pruhy je tabulatura s akordy nad sebou. Při hraní blikají tóny v pruhu, přes jehož akord zrovna zní.
  - Klávesa **P** lick přehraje nebo zastaví.
- **Wiki** je vpravo (klávesa **W**). Obsahuje:
  - rozbor kolečka;
  - přístupy s vysvětlením a cvičeními;
  - tlačítko **Vyzkoušet**;
  - licky každého přístupu po pruzích. Symetrické licky jde posouvat tlačítky +3/+6/+9;
  - katalog všech stupnic od tóniky s tím, kdy kterou použít.

## Ovládání

| Klávesa | Akce |
|---|---|
| Mezerník | přehrát / zastavit (groovebox, na záložce Metronom metronom) |
| Esc | zastavit vše |
| A / Shift+A | další / předchozí přístup |
| P | přehrát / zastavit lick |
| W | wiki ke kolečku |
| ← → | posunout okno ruky (ve všech pruzích) |
| L | popisky: intervaly k akordu / tóny / intervaly ke zdroji |
| ↑ ↓ | tempo ±1 (se Shiftem ±5) |
| [ ] | tónina o půltón dolů / nahoru |
| F | držet aktuální akord (cvičení nad jedním akordem) |
| T | tap tempo |
| 1 2 3 | záložky Sólování / Ladička / Metronom |

## Přidávání obsahu

Veškerý obsah je v `js/data/`. Popis formátu je vždy v komentáři na začátku souboru.

- `progressions.js`: kolečka.
  - Akordy se zapisují ve stupních (`I7`, `ii7`, `bVII`, `V7b9`, `vii°`, `I+`…) a transponují se do zvolené tóniny.
  - `style: 'blues'` označí blues, kde je každý akord dominantní septakord.
- `approaches.js`: přístupy.
  - Každý má 1–3 pruhy. Pruh je buď pevný zdroj (`'scale:minorPentatonic@iii'` = mollová pentatonika od 3. stupně tóniny), nebo zdroj podle akordu (`follow: 'third'` = od tercie, `'halfWhole'` = zmenšená od kořene).
  - Pruh platí přes akordy dané funkce (`fn: ['T']` tónika, `'S'` subdominanta, `'D'` dominanta).
  - `licks: { T: [...], N: [...], '*': [...], cycle: [...] }` určuje, které licky patří ke kterému pruhu. `'*'` platí pro každý pruh, `cycle` pro linku přes celé kolečko.
- `wiki.js`: wiki ke kolečkům. Obsahuje pocit, pořadí přístupů, poznámky a cvičení.
  - V textech fungují tokeny `{iii}`, `{ii.r}`, `{V7.3}`, `{lane:T}` a `{ex:third}`. Přizpůsobí se tónině.
- `scales.js`, `arpeggios.js`: intervaly od kořene. Symetrické stupnice mají `symmetric: 3` (o kolik pražců se dají posouvat).
- `licks.js`: licky dvou druhů.
  - **Tabulatura** (`notes`) relativně ke kořeni pruhu.
    - `symmetric: 3` = lick jde posouvat o malé tercie.
    - `when: ['minor', 'blues']` = jen v těchto kolečkách.
  - **Linka** (`line`) zapsaná vůči zdroji pruhu, třeba `'1:.5 3:.5 2:1 | L:2~'`.
    - Číslo je n-tý tón zdroje.
    - `t` je cílový tón hraného akordu, `L` cílový tón dalšího akordu.
    - `c9`, `c6` jsou barvy akordu.
    - `> <` je krok po zdroji, `s+ x-` obal, `w` chůze k dalšímu tónu.
    - `&3`, `&6` přidá druhý hlas.
    - `|` označuje změnu akordu.

    Úplný popis je v `js/teaching/line.js`. `each: true` = buňka se hraje přes každý akord, `change: true` = lick dopadá za změnou.
- `grooves.js`: bicí, rytmus akordů a basová linka jako řetězce kroků.

Po úpravě obnov stránku. Chyby v datech se vypíšou do konzole prohlížeče a kontrolu dat spouští i testy.

## Testy

```sh
node --test tests/*.test.js
```

Testy pokrývají:

- hudební teorii: pravopis akordů ve všech tóninách, voicing;
- výpočet poloh na hmatníku a ukotvení licků;
- detekci výšky tónu pro ladičku (±1 cent);
- kontrolu obsahu.

## Nasazení na GitHub Pages

1. Nahraj složku do repozitáře.
2. V nastavení repozitáře otevři Pages a vyber Deploy from branch, větev `main`, složku `/ (root)`.

Cesty jsou relativní a soubor `.nojekyll` je přiložený.
