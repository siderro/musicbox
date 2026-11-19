# Plán: přístupy, hmatníky pod sebou a wiki ke kolečku

Stav: fáze 0–4 hotové (dvojice kvintakordů 2026-11-19). Připravil ho tým: kytarový lektor, jazzový teoretik, folk/blues lektor, UX designér a oponent.

## Proč dnešní Sólování není použitelné
- O jeden hmatník se perou dva systémy, čipy a „nápady“. Není jasné, co tečky řídí.
- Panel má asi 39 ovládacích prvků a za hraní se nedá použít žádný.
- Hmatník se každou dobu překresluje. Nic nestojí na místě, takže se tvar nedá naučit.
- Chybí mapa celého kolečka.
- Aplikace nezná funkci akordu (tónika, subdominanta, dominanta), takže nedokáže říct „přes tóniku Em“.
- Vysvětlivky jsou rozházené po tooltipech, banneru a pokynech a nepřizpůsobí se tónině.

## Hlavní pojem: přístup
Přístup je pojmenovaný způsob sólování přes kolečko. Každý akord pošle do určitého **pruhu** (hmatníku) podle své funkce:
- **T** = tónika,
- **S** = subdominanta,
- **D** = dominanta.

Příklad „Tónika ↔ napětí“ v C dur:

| Akord | Funkce | Pruh | Co to nad akordem zní |
|---|---|---|---|
| C | T | Em pentatonika | 3 5 6 7 9 (Cmaj9 + sexta) |
| Am | T | Em pentatonika | 5 ♭7 1 9 11 (Am11) |
| F | S | Dm pentatonika | 6 1 2 3 5 (F6) |
| G7 | D | Dm pentatonika | 5 ♭7 1 9 11 (G9sus) |

- **Spojka mezi pruhy:** u G7→C sjede F z Dm o půltón na E z Em. To je rozvod ♭7→3.
- **Moll (a moll):** stejné Em a Dm. Přes E7 se přidá třetí pruh **G♯°7** (= E7♭9), který vede přímo k diminished.
- **Akordy, které do žádného pruhu nesedí** (třeba A7 v C), dostanou automatický pruh „od tercie“ (C♯–E–G).

### Katalog přístupů

**v1:**
- Jedna pentatonika
- Celá stupnice tóniny
- Tóny akordu
- **Od tercie**
- **Tónika ↔ napětí (Em/Dm)**
- Tři pentatoniky T·S·D (Em/Am/Dm)
- Blues: dur nad I7, moll nad IV7

**Fáze 3, symetrické:**
- Zmenšená přes dominantu: půltón–celý tón; dim7 od 3, 5, ♭7, ♭9 je jeden akord, proto licky posouváš o 3 pražce.
- Harmonická moll přes V7
- Celotónová

**Fáze 4:**
- Pentatonika od kvinty akordu
- Mixolydická od každého akordu
- Módy
- Linka vodicích tónů
- Obal / chromatický nájezd
- Druhý hlas
- Barvy 6 a 9
- Dvojice kvintakordů

## Obrazovka při hraní
```
Přístup: [C dur pentatonika] [Od tercie] [■ Em ↔ Dm] [Tóny akordu] [Em·Am·Dm] ▾    (klávesa A)
┌── C ───┬── Am ──┬── F ───┬── G7 ──┐   mapa celého kolečka: který pruh v kterém taktu
│ Em  ▲  │ Em     │ Dm     │ Dm     │
└tónika──┴tónika──┴napětí──┴napětí──┘
▌T  TÓNIKA · Em pentatonika · nad C = 3 5 6 7 9        ← svítí (aktivní)
▌ ║ … tečky pentatoniky, kroužky = tóny C …║
░N  NAPĚTÍ · Dm pentatonika · za 2 →                   ← tlumeně, před změnou odpočet
░ ║ … tečky Dm pentatoniky …                ║
Spojka: E → F
                                                        │ WIKI (klávesa W) vpravo:
                                                        │ rozbor kolečka, přístupy, „Zkus“,
                                                        │ licky, [Vyzkoušet]
```
- **Pruhy:** 1 až 3 pod sebou. Tečky v nich stojí, mění se jen to, který pruh svítí.
- **Odpočet** je jen tehdy, když se mění pruh.
- **Šipky ←/→** posouvají okno ruky ve všech pruzích naráz.
- **Popisky** jsou intervaly vůči hranému akordu a klávesou L se přepnou.
- **Nevejde se na obrazovku?** Je navržené tak, aby se při výšce okna kolem 870 px nic nerolovalo.

## Wiki ke kolečku
- **Kde:** pravý sloupec, klávesa W.
- **Co obsahuje:**
  - rozbor (akord – funkce – pruh – co zní), generovaný automaticky;
  - přístupy seřazené na učení, s vysvětlením **proč**, cvičeními **zkus** a minidiagramy;
  - licky;
  - tlačítko **Vyzkoušet**, které přístup rovnou zapne.
- **Texty se přizpůsobí tónině:** `{iii}` = Em v C, Bm v G.
- **Stránky a licky** si můžeš dopisovat sám do `js/data/wiki/`.

## Co zmizí, aby to bylo jednodušší
- Časová osa, řádek pokynu, START/CÍL fráze, kostka, otázka–odpověď a zvuk ukázky. Engine frází zůstane v kódu, později ho možná nabídne wiki.
- Řádky Nápad, Při změně a Vrstvy.
- Čipy a banner.

Ovládacích prvků bude místo asi 39 zhruba 11.

## Fáze
0. **Příprava rendereru:** víc hmatníků, oddělení pevné vrstvy a překryvu, ořez na okno ruky.
1. **Teorie:** funkce akordů, přístupy v1 a testy.
2. **Nové Sólování:** lišta přístupů, mapa, pruhy, wiki pro 3 kolečka (C–Am–F–G7, trampská moll, blues).
3. **Zmenšená a symetrické:** stupnice, licky posouvané o 3 pražce, nové typy akordů (7♭9, +, 7♯5).
4. **Další přístupy** a obecný katalog ve wiki. Hotovo:
   - pentatonika za akordem, pentatonika od kvinty, módy podle akordu (v blues mixolydická), linka vodicích tónů, barvy 6 a 9, obal, druhý hlas;
   - katalog stupnic;
   - wiki pro všechna kolečka;
   - licky a linky ke každému pruhu (`js/teaching/line.js`, `lick-plan.js`). Hrají se přes akord svého pruhu a dopadají za změnou;
   - dvojice kvintakordů: v dur V + vi přes tóniku a IV + V přes napětí, v moll ♭VII + i, ♭VI + ♭VII a přes dominantu s vodicím tónem V + ♭VI.
