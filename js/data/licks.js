// Knihovna licků. Zápis je relativní ke kořeni tóniny, takže lick funguje v každé tónině.
//
//   anchor.string – struna, na které se hledá kořen (6 = basová E, 5 = A …)
//   notes         – { s: struna 1–6, f: posun pražce od kořene, d: délka v dobách, t: technika }
//                   { dbl: [[s, f], [s, f]], d } – dvojhmat
//                   { rest: true, d }             – pauza
//   t             – 'b' bend (bend: 1 = celý tón, 0.5 = půltón), 'r' povolení bendu,
//                   '~' vibrato; 'h' hammer-on, 'p' pull-off, '/' '\' slide – tyto
//                   čtyři platí směrem K NÁSLEDUJÍCÍ notě (jako „5h7“ v tabulatuře)
//   scale         – stupnice, která se zobrazí na hmatníku kolem licku
//   feel          – 'straight' | 'shuffle'; bez uvedení se lick přizpůsobí grooveu
//   root          – stupeň, od kterého se lick počítá (výchozí 'I'); např. 'V' = od kořene dominanty
//   symmetric     – lick ze symetrické stupnice: o kolik pražců ho jde posouvat (3 = malá tercie)
//   when          – v jakých kolečkách se nabízí: 'major' | 'minor' | 'blues' (bez uvedení všude)
//
// Licky u přístupů (approaches.js → licks) se kotví ke kořeni pruhu, přes který zní.
//
// LINKY: místo `notes` mají `line` – zápis vůči zdroji pruhu (viz js/teaching/line.js):
//   '1:.5 3:.5 2:1 | L:2~'  = 1., 3. a 2. tón pruhu, za „|“ dopad na cílový tón dalšího akordu.
//   each: true    – buňka se zahraje přes každý akord kolečka (jedno celé kolo)
//   change: true  – linka se hraje přes poslední akord pruhu a dopadá za změnou
//   short         – krátký název na tlačítko u pruhu

export const LICKS = {
  // ---------- linky vůči pruhu ----------
  landHome: {
    name: 'Dopad a výdech', short: 'dopad', level: 1,
    line: 't:2~ r:.5 >:.5 <:1',
    tip: 'Na „jedna“ cílový tón akordu s vibratem, nádech, krok nahoru a zpátky. Napětí z dominanty se tu rozvede.',
  },
  kpQA: {
    name: 'Otázka a odpověď', short: 'otázka–odpověď', level: 1, change: true,
    line: '1:.5 2:.5 3:.5 4:.5 5:1~ 4:1 | L:2~ r:2',
    tip: 'Stoupání pentatonikou je otázka, dopad na tón dalšího akordu na „jedna“ odpověď. Poslouchej, kam se fráze vrací.',
  },
  kpRepeat: {
    name: 'Opakovaný tón', short: 'opakování', level: 1, change: true,
    line: 't:.5 t:.5 >:.5 <:1 r:1.5 | L:2~ r:2',
    tip: 'Rytmus místo stupnice: jeden tón akordu, soused nad ním a pauza. Po změně dopad na tón dalšího akordu.',
  },
  ksWalk: {
    name: 'Po stupnici na cíl', short: 'chůze na cíl', level: 1, change: true,
    line: 't:1 w:3 | L:2~ r:2',
    tip: 'Začni na tónu akordu a jdi po stupnici tak, abys na změnu přesně dopadl na tón dalšího akordu. Melodie vede, ne prsty.',
  },
  ksEnclose: {
    name: 'Obal cíle', short: 'obal', level: 2, change: true,
    line: 't:2~ r:1 s+:.5 x-:.5 | L:2~ r:2',
    tip: 'Před změnou tón nad cílem a půltón pod ním – cíl je pak „obalený“ a dopad zní záměrně.',
  },
  ctUp: {
    name: 'Arpeggio přes každý akord', short: 'arpeggio', level: 1, each: true,
    line: 't:.5 >:.5 >:.5 >:.5 <:.5 <:.5 w:1',
    tip: 'Přes každý akord jeho tóny nahoru a zpátky, na konci taktu krok k tónu dalšího akordu. Celé kolo bez přerušení.',
  },
  ctDown: {
    name: 'Shora dolů a tercie dalšího', short: 'shora dolů', level: 1, change: true,
    line: '4:.5 3:.5 2:.5 1:.5 r:1 w:1 | L:2~ r:2',
    tip: 'Arpeggio od horního kořene dolů, pauza a krok na tón dalšího akordu.',
  },
  otLine: {
    name: 'Melodie z tercií', short: 'linka tercií', level: 1, each: true,
    line: 'c3:3~ w:1',
    tip: 'Přes každý akord jen tercie, dlouze s vibratem, a krok k tercii dalšího. Tohle je melodie, kterou kolečko „zpívá“.',
  },
  otRise: {
    name: 'Od tercie s nonou', short: '3-5-7-9', level: 2, each: true,
    line: '1:.5 2:.5 3:.5 c9:1~ 3:.5 w:1',
    tip: 'Přes každý akord 3-5-7 a nahoře nona s vibratem, pak zpátky a krok k dalšímu akordu.',
  },
  otArp: {
    name: 'Rozklad od tercie a dopad', short: 'od tercie', level: 1, change: true,
    line: "1:.5 2:.5 3:.5 1':1.5~ 3:.5 2:.5 | L:2~ r:2",
    tip: 'Tercie, kvinta, septima, tercie nahoře – a dolů tak, abys na změnu dopadl na tón dalšího akordu.',
  },
  tdSix: {
    name: 'Sexta, kvinta, tercie, nona', short: 'sexta a nona', level: 1,
    line: "3:1 2:.5 1:.5 5,:1.5~ r:.5",
    tip: 'Tvar z mollové pentatoniky pruhu. Nad durovým akordem zní sexta → kvinta → tercie → nona: lidová, měkká barva bez kořene.',
  },
  tdChange: {
    name: 'Půltón přes změnu', short: 'půltón přes změnu', level: 1, change: true,
    line: '1:.5 3:.5 2:1 3:.5 2:1.5 | L:2~ r:2',
    tip: 'Přes poslední akord pruhu napětí se točíš kolem jednoho tónu a po změně sjedeš o půltón na tón tónikového pruhu. Tady se pruhy potkávají.',
  },
  tdCycle: {
    name: 'Cílové tóny přes celé kolečko', short: 'cílové tóny', level: 1, each: true,
    line: 't:2~ >:.5 <:.5 w:1',
    tip: 'Přes každý akord jeden cílový tón (z pruhu, který nad ním svítí), sousední tón a krok k dalšímu cíli. Ruka zůstává v okně.',
  },
  tpAlt: {
    name: 'Nahoru jeden, dolů druhý', short: 'střídání', level: 2,
    line: "1:.5 2:.5 3:.5 6':.5 5:.5 4:.5 t:1~",
    tip: 'Dvojice kvintakordů: první nahoru, druhý shora dolů, a dopad na tón akordu. V C přes tóniku G–H–D, E–C–A a domů – nad C to zní jako 5-7-9-3-1-6.',
  },
  tpCascade: {
    name: 'Kaskáda do tóniky', short: 'kaskáda', level: 2, change: true,
    line: "3':.5 2:.5 1:.5 6:.5 5:.5 4:.5 >:.5 1:.5 | L:2~ r:2",
    tip: 'Oba kvintakordy napětí shora dolů (v C: C–A–F, D–H–G), krok nahoru a septima dominanty sjede o půltón na tercii tóniky.',
  },
  tpSpanish: {
    name: 'Španělský sestup', short: 'španělsky', level: 2, change: true, when: ['minor'],
    line: "6:.5 5:.5 4:.5 3:.5 2:.5 1:.5 2':1 | L:2~ r:2",
    tip: 'Přes dominantu v moll kvintakord o půltón výš a pak její vlastní (v a moll: C–A–F, H–G♯–E), vodicí tón stoupne do tóniky.',
  },
  tpCycle: {
    name: 'Dvojice přes celé kolečko', short: 'dvojice', level: 2, each: true,
    line: "1:.5 2:.5 3:.5 6':.5 5:.5 4:.5 w:1",
    tip: 'Přes každý akord dvojice jeho pruhu: první kvintakord nahoru, druhý dolů, a krok k dalšímu akordu.',
  },
  mtCycle: {
    name: 'Martino přes každý akord', short: 'Martino', level: 2, each: true,
    line: "1=:.5 2':.5 3':.5 4':.5 5':.5 6':.5 7':.5 4':.5",
    tip: 'Přes každý akord osm osmin nahoru: 6-7-1-9 po stupnici a 3-5-7-9 arpeggiem. V ii–V–I skončíš na noně, která je sextou dalšího akordu – další linka začne o oktávu níž na stejném tónu.',
  },
  mtChange: {
    name: 'Martino a dopad na sextu', short: 'Martino → změna', level: 2, change: true,
    line: "1=:.5 2':.5 3':.5 4':.5 5':.5 6':.5 7':1 | 1:2~ r:2",
    tip: 'Linka od sexty přes poslední takt akordu a na změně dopad na sextu dalšího akordu – barvu, ze které začíná jeho vlastní linka.',
  },
  tdDim: {
    name: 'Zmenšený akord do tóniky', short: 'zmenšený → domů', level: 2, change: true,
    line: '1:.5 2:.5 3:.5 4:.5 3:.5 2:.5 1:1 | L:2~ r:2',
    tip: 'Čtyři tóny zmenšeného septakordu nahoru a zpátky, vodicí tón pak stoupne o půltón do tóniky.',
  },
  bmThird: {
    name: 'Velká tercie domů', short: 'velká tercie', level: 1,
    line: '4:.5 3:.5 x-:.5 t:1.5~ 1:1',
    tip: 'Přes I7 sklouzni z malé tercie do velké – to je ten sladký bluesový „úsměv“.',
  },
  bmSeventh: {
    name: 'Mollová přes IV7', short: 'moll přes IV7', level: 1, change: true,
    line: '1:.5 2:.5 3:1 2:1~ r:1 | L:2~ r:2',
    tip: 'Malá tercie tóniny je septima IV7 – opírej se o ni. Po změně dopad na tón dalšího akordu.',
  },
  ddCell: {
    name: 'Buňka po malých terciích', short: 'buňka +3', level: 3, change: true,
    line: '1:.5 2:.5 3:.5 4:.5 3:.5 4:.5 5:.5 6:.5 | L:2~ r:2',
    tip: 'Buňka 1–♭9–♯9–3 a pak stejná o malou tercii výš. Symetrie stupnice = tvar se posouvá, zvuk drží. Na tónice napětí rozveď.',
  },
  hmLead: {
    name: '♭6 – 7 – 1', short: '♭6–7–1', level: 2, change: true,
    line: '5:.5 6:.5 7:1 6:.5 7:.5 6:.5 7:.5 | L:2~ r:2',
    tip: 'Kolébání mezi ♭6 a vodicím tónem (zvětšená sekunda, „cikánský“ krok) a vodicí tón stoupne do tóniky.',
  },
  hmMinor: {
    name: 'Mollová věta', short: 'mollová věta', level: 1, when: ['minor'],
    line: 't:1 >:.5 >:.5 <:1 <:1~',
    tip: 'Z tónu akordu dva kroky nahoru po přirozené moll a pomalu zpátky.',
  },
  wtRun: {
    name: 'Celotónový běh', short: 'celotónový běh', level: 3, change: true,
    line: '1:.5 2:.5 3:.5 4:.5 5:.5 6:.5 5:.5 4:.5 | L:2~ r:2',
    tip: 'Šest tónů po celých tónech – žádný nemá „domov“, proto dopad na tón dalšího akordu tolik vynikne.',
  },
  pcBox: {
    name: 'Pentatonika akordu a dopad', short: 'pentatonika akordu', level: 1, change: true,
    line: '1:.5 2:.5 3:.5 4:.5 5:1~ 4:.5 w:.5 | L:2~ r:2',
    tip: 'Pentatonika od kořene akordu nahoru, nahoře vibrato a krok na tón dalšího akordu.',
  },
  pcCycle: {
    name: 'Pentatonika za akordem', short: 'celé kolo', level: 2, each: true,
    line: 't:1 >:.5 >:.5 <:1 w:1',
    tip: 'Přes každý akord jeho pentatonika: cíl, dva kroky nahoru, zpátky a krok k dalšímu akordu.',
  },
  pfSus: {
    name: 'Sus zvuk od kvinty', short: 'od kvinty', level: 2, change: true,
    line: '1:.5 3:.5 4:1~ 3:.5 2:.5 1:1 | L:2~ r:2',
    tip: 'Pentatonika od kvinty akordu zní nad ním jako 5-♭7-1-9-11: vzdušný sus zvuk bez tercie. Tercii si nech na dopad.',
  },
  mdChar: {
    name: 'Charakteristický tón módu', short: 'barva módu', level: 2, change: true,
    line: 't:1 k:1.5~ t:.5 w:1 | L:2~ r:2',
    tip: 'Cílový tón a hned tón, kterým se mód liší (dórská 6, mixolydická ♭7, lydická ♯4…) – podrž ho, ať barvu slyšíš.',
  },
  mdCycle: {
    name: 'Mód přes každý akord', short: 'celé kolo', level: 2, each: true,
    line: 't:1 k:1~ <:.5 w:1.5',
    tip: 'Přes každý akord jeho cílový tón a charakteristický tón módu. Uslyšíš, jak se barva mění akord od akordu.',
  },
  glLine: {
    name: 'Linka vodicích tónů', short: 'linka 3 a 7', level: 1, each: true,
    line: 't:3~ w:1',
    tip: 'Přes každý akord jen tercie nebo septima – ta, která je nejblíž. Septima dominanty sjede o půltón na tercii tóniky.',
  },
  glLand: {
    name: 'Vodicí tón a dopad', short: 'dopad', level: 1, change: true,
    line: 't:2~ r:1 x-:1 | L:2~ r:2',
    tip: 'Vodicí tón akordu podrž, pauza, půltón pod vodicím tónem dalšího akordu a dopad na něj. Nejmenší možný pohyb, největší účinek.',
  },
  glChrom: {
    name: 'Vodicí tóny s chromatickým nájezdem', short: 'chromaticky', level: 2, each: true,
    line: 't:2~ r:1 x-:1',
    tip: 'Vodicí tón, pauza a půltón pod dalším vodicím tónem. Nejkratší cesta, jak „slyšet změnu dopředu“.',
  },
  c69Cycle: {
    name: 'Nona, tercie, sexta', short: '9 – 3 – 6', level: 1, each: true,
    line: 'c9:1 t:1 c6:1~ w:1',
    tip: 'Přes každý akord nona sklouzne na tercii a pak sexta s vibratem – měkká, romantická barva.',
  },
  c69Lean: {
    name: 'Sexta a nona s dopadem', short: 'sexta a nona', level: 1, change: true,
    line: 'c6:1 c5:.5 c3:.5 c9:2~ | L:2~ r:2',
    tip: 'Sexta, kvinta, tercie a dlouhá nona – a po změně dopad na tón dalšího akordu.',
  },
  enCycle: {
    name: 'Obal přes každý akord', short: 'obal', level: 2, each: true,
    line: 't:2~ r:.5 s+:.5 x-:1',
    tip: 'Cílový tón, pak tón tóniny nad dalším cílem a půltón pod ním. Další cíl je „obalený“ ze dvou stran.',
  },
  enLand: {
    name: 'Obal před změnou', short: 'obal na změnu', level: 2, change: true,
    line: '1:.5 2:.5 3:1 r:1 s+:.5 x-:.5 | L:2~ r:2',
    tip: 'Kousek akordu, pauza, a před změnou obal cílového tónu dalšího akordu.',
  },
  sv3Cycle: {
    name: 'V terciích přes kolečko', short: 'tercie', level: 2, each: true,
    line: 't&3:1 >&3:.5 >&3:.5 <&3:1 <&3:1',
    tip: 'Melodie s druhým hlasem o tercii níž (dvojhmat na sousedních strunách). Jako dva zpěváci u táboráku.',
  },
  sv6Cycle: {
    name: 'V sextách přes kolečko', short: 'sexty', level: 2, each: true,
    line: 't&6:1.5~ <&6:.5 <&6:1 >&6:1',
    tip: 'Druhý hlas o sextu níž, ob jednu strunu. Prostřední strunu tlum prstem pravé ruky nebo hraj prsty.',
  },
  dimRun: {
    name: 'Zmenšený běh po malých terciích',
    scale: 'halfWhole',
    root: 'V',
    symmetric: 3,
    anchor: { string: 6 },
    level: 3,
    notes: [
      { s: 6, f: 0, d: 0.5 },
      { s: 6, f: 1, d: 0.5 },
      { s: 6, f: 3, d: 0.5 },
      { s: 5, f: -1, d: 0.5 },
      { s: 6, f: 3, d: 0.5 },
      { s: 6, f: 4, d: 0.5 },
      { s: 6, f: 6, d: 0.5 },
      { s: 5, f: 2, d: 0.5 },
      { s: 5, f: 5, d: 1 },
      { s: 4, f: 2, d: 3, t: '~' },
    ],
    tip: 'Buňka 1–♭9–♯9–3 a pak ta samá o 3 pražce výš. Stupnice je symetrická, takže každá kopie zní „správně“ – vyzkoušej tlačítka +3 a +6. Přes dominantu, dopad na tónice.',
  },
  box1Bend: {
    name: 'Bend v 1. boxu',
    when: ['minor', 'blues'],
    scale: 'minorPentatonic',
    anchor: { string: 6 },
    level: 1,
    notes: [
      { s: 3, f: 2, d: 1, t: 'b', bend: 1 },
      { s: 2, f: 0, d: 0.5 },
      { s: 1, f: 0, d: 0.5 },
      { s: 2, f: 3, d: 0.5 },
      { s: 2, f: 0, d: 0.5 },
      { s: 3, f: 2, d: 0.5, t: 'p' },
      { s: 3, f: 0, d: 0.5 },
      { s: 4, f: 2, d: 4, t: '~' },
    ],
    tip: 'Bend ze 4. stupně na kvintu (celý tón – kontroluj sluchem, že dojedeš na tón), sestup boxem a dlouhý kořen s vibratem na struně D.',
  },
  bbBox: {
    name: '„B.B. box“',
    when: ['major', 'blues'],
    scale: 'mixolydian',
    anchor: { string: 2 },
    level: 2,
    notes: [
      { s: 1, f: 2, d: 0.5 },
      { s: 1, f: 0, d: 0.5 },
      { s: 2, f: 2, d: 1, t: 'b', bend: 1 },
      { s: 2, f: 2, d: 0.5, t: 'r', bend: 1 },
      { s: 2, f: 0, d: 1.5, t: '~' },
    ],
    tip: 'Malý box kolem kořene na struně H. Bend z nony na velkou tercii dává durovou, „sladkou“ bluesovou barvu.',
  },
  countrySlide: {
    name: 'Country slide',
    when: ['major'],
    scale: 'majorPentatonic',
    anchor: { string: 6 },
    level: 1,
    notes: [
      { s: 3, f: -3, d: 0.5, t: '/' },
      { s: 3, f: -1, d: 0.5 },
      { s: 2, f: -3, d: 0.5 },
      { s: 2, f: 0, d: 0.5 },
      { s: 2, f: -3, d: 0.5 },
      { s: 3, f: -1, d: 0.5, t: 'p' },
      { s: 3, f: -3, d: 0.5 },
      { s: 4, f: -1, d: 0.5 },
      { s: 3, f: -3, d: 4, t: '~' },
    ],
    tip: 'Durová pentatonika: slide z kořene na nonu, nahoru k tercii a kvintě a zpět dolů na kořen.',
  },
  chuckBerry: {
    name: 'Rock’n’rollové dvojhmaty',
    when: ['blues'],
    scale: 'minorPentatonic',
    anchor: { string: 6 },
    level: 1,
    notes: [
      { dbl: [[2, 0], [1, 0]], d: 0.5 },
      { dbl: [[2, 0], [1, 0]], d: 0.5 },
      { dbl: [[2, 0], [1, 0]], d: 0.5 },
      { dbl: [[2, 0], [1, 0]], d: 0.5 },
      { dbl: [[2, 3], [1, 3]], d: 0.5 },
      { dbl: [[2, 3], [1, 3]], d: 0.5 },
      { dbl: [[2, 0], [1, 0]], d: 1, t: '~' },
    ],
    tip: 'Dvojhmat kvinta + kořen na dvou nejtenčích strunách, pak ♭7 + ♭3 o tři pražce výš. Hraj krátce, rytmicky a s jistotou.',
  },
  iiVIguide: {
    name: 'Vodicí tóny ii–V–I',
    scale: 'major',
    anchor: { string: 5 },
    level: 2,
    feel: 'straight',
    notes: [
      { s: 2, f: 3, d: 2 },
      { s: 3, f: 2, d: 2 },
      { s: 3, f: 1, d: 2 },
      { s: 2, f: 3, d: 2 },
      { s: 2, f: 2, d: 4, t: '~' },
      { rest: true, d: 4 },
    ],
    tip: 'Tercie a septimy: 3 → 7 přes ii7, 3 → 7 přes V7, pak septima V7 klesne o půltón na tercii I. Tohle je kostra jazzové improvizace.',
  },
};
