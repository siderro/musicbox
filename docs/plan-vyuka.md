# Plán: výuková vrstva (sólování během grooveu)

Stav: návrh ke schválení. Navrhl ho tým: lektor, folkový muzikant, teoretik, UX designér, oponent a programátor.

## Cíl
Během hraní grooveu aktivně a názorně radit, co hrát, a měnit radu podle harmonie. Všechny režimy se dají přepínat v aplikaci. Výchozí profil je lidovka, moll a romantika: arpeggio od tercie a barevné tóny 6 a 9.

## Rozvržení panelu Sólování při hraní

```
Režim nápadů: [Od tercie●][Od kvinty][Od kořene][Dvojhlas][Licky][Otázka–odpověď][Vyp]  ⚙
┌ TEĎ: Am · C E G ──┬ DALŠÍ: Dm  [2] ──┬ POTOM: E7 ─┐   časová osa
Teď: arpeggio od tercie — C dur      → Dopadni na F (3 v Dm)               jeden řádek pokynu
╔═════════════ HMATNÍK (okno 5 pražců kolem ruky) ═════════════╗
▸ Podklad a licky (při hraní sbalené): stupnice, připnuté položky z Katalogu
```

Hmatník střídá vrstvy v čase, aby nebyl přeplácaný:
- **Většinu času** svítí tóny nápadu (např. E G B nad C). Barevné tóny 6 a 9 jsou fialové kroužky a stupnice je tlumené pozadí. Při zapnuté „Ukázce v rytmu“ bliká vždy jeden tón v rytmu jako ukázka prstů.
- **Poslední 2 doby před změnou** (ve 3/4 a 2/4 jedna doba): nápad zeslábne a rozsvítí se cílové tóny dalšího akordu se šipkami (G → F♯). V buňce DALŠÍ běží odpočet 2 → 1 a pokyn zní např. „Dopadni na F♯“.
- Najednou svítí nejvýš 3 výrazné druhy teček a 1 věta pokynu.
- **Vyp** vrátí dnešní panel beze změny.

Nastavení pod ⚙:
- **Typ změnových tónů:** vodicí 3/7 (výchozí), společné, chromatický nájezd, kořen, vypnuto.
- **Vrstvy:** časová osa, cílové tóny, ukázka v rytmu, barvy 6/9, stupnice v pozadí.
- **Zvuk ukázky:** výchozí vypnuto, protože hraješ ty.
- **Přechodové licky.**
- **Doprovod při odpovědi:** celá kapela, nebo jen bicí.
- **Profil:** folk, blues, country, jazz.

## Pravidla teorie
- **Arpeggio od tercie** = tóny 3-5-7 skutečně hraného akordu. Když akord nemá septimu, doplní se ze stupnice tóniny (v moll z přirozené moll). Příklady:

  | Tónina | Akord | Arpeggio |
  |---|---|---|
  | C dur | C | Em |
  | C dur | F | Am |
  | C dur | G7 | B° |
  | A dur | A7 | C♯° |
  | a moll | Am | C |
  | a moll | E | G♯° |
  | C dur | D (vedlejší dominanta) | F♯ A C |

- **Od kvinty** = 5-7-9. **Od kořene** = 1-3-5-7. **Dvojhlas** = paralelní tercie nebo sexty po stupnici (druhý hlas).
- **Poloha ruky:** okno 5 pražců se drží na místě (←/→ ho posouvá). Každá ukázka začne na tónu nejbližším tam, kde skončila ta předchozí.

## Licky
Nová nepovinná pole: `rel: 'chord'` (posouvá se s kořenem akordu), `fits` (dur/moll/dom…), `role: 'transition'` s `motion` (pohyb basu) a `pickup` (počet dob před změnou), `meter`, `style`.

Režim **Licky**:
- Jeden takt lick, jeden takt nádech.
- Přechodové licky na posledních dobách dopadnou přesně na první dobu dalšího akordu.

Režim **Otázka–odpověď**:
- 2 takty aplikace hraje, 2 takty hraješ ty.
- Noty zůstanou na hmatníku jako „duchové“, aby bylo vidět, co opakovat.

## Katalog (nová záložka, klávesa 4)
- **Výběr:** libovolná stupnice nebo arpeggio (nově i 6, m6, add9, madd9, dim7) v libovolné tónině a poloze.
- **Vzorce:** po terciích, trioly 1-2-3, čtveřice, diatonické kvintakordy, dvojhmaty v terciích a sextách, obaly a přírazy.
- **Podklad:** dron, jeden akord, nebo jen bicí.
- **Ovládání:** tlačítka „Předveď vzor“ a „Hraj se mnou“.
- **Připnutí:** „Připnout do Sólování“ přidá položku k libovolnému kolečku.

## Lidovkový obsah (v1)
- **Groovy:** valčík 3/4, polka 2/4, trampský „boom-chick“ 4/4, dron.
- **Kolečka:**

  | Kolečko | Takty |
  |---|---|
  | Trampská moll | i i iv i V7 V7 i i |
  | Romantická moll | i ♭VI ♭III ♭VII |
  | Kvintový kruh v moll | Am Dm G C F Bø E7 Am |
  | Valčík dur | I I IV IV V7 V7 I I |
  | Valčík moll | i i iv iv V7 V7 i i |
  | Polka | I–V7 |
  | Lidovka s vedlejšími dominantami | C A7 Dm G7 |

- **Licky:** sestup od tercie s obalem, romantický „vzdech“ ♭6→5, držená nona, přechody I→IV a V→I přes vodicí tóny, druhý hlas v terciích a sextách.

## Fáze
0. **Příprava:** úpravy transportu, hmatníku a lick-playeru. Aplikace se zatím chová stejně.
1. **Engine nápadů a teorie:** čisté funkce s testy v node.
2. **3/4 a 2/4 a lidovkový obsah.**
3. **Živé navádění v Sólování:** přepínač, časová osa, pokyny, odpočet, cílové tóny, ukázka v rytmu.
4. **Licky:** podle akordu, přechodové a otázka–odpověď.
5. **Katalog a připínání.**
6. **Profily, README a připravené místo pro zpětnou vazbu z mikrofonu.**

Podrobná technická verze (funkce, datové struktury, testy, rizika) je v historii sezení. Implementuje se podle ní.
