// Sazby doprovodu: jakými hmaty se kolečko zahraje (k tomu rytmus z rhythms.js).
// Engine (js/comp/voicing-engine.js) najde ke každému akordu hmaty podle sazby a přes celé kolečko
// (cyklicky) vybere ty, při kterých se ruka a hlasy hýbou nejmíň.
//
//   build    jak se hmat staví:
//            'open'      tabulka OPEN (táborákové tvary), co v ní není → barré (grips sazby barre)
//            'grips'     tvary `grips` posouvané po hmatníku
//            'close'     obraty tónů `tones` na sadách strun `sets`; drop: 2 = druhý hlas shora o oktávu níž
//            'colors'    akord se nahradí barevným z COLOR_TYPES podle `choose`
//            'bassChord' hmat jako 'open' + kořen a střídavý bas
//            'power'     dvojhmat 1-5 + kroky 6 a ♭7 (boogie)
//   grips    tvar jako řetězec struna 6 → 1: 'x 1 5 7 3 x'
//            číslo = tón akordu (3 = velká i malá tercie, 7 = jakákoli septima, 9 = nona …), x = tlumená,
//            '7|6|1' = když akord septimu nemá, sexta (jen z `extras`), jinak oktáva
//            types: jen pro tyto druhy akordu ('', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', '7b9' …), bez types = ostatní
//   noOpen   bez prázdných strun (barré se cvičí i tam, kde by šel otevřený tvar)
//   extras   tóny, které sazba smí přidat (jen když patří do tóniny): '6' = sexta ke kvintakordu
//   move     váhy výběru: hand = posun ruky (pražce), voice = pohyb hlasů (půltóny), center = oblíbená poloha,
//            pos = jak silně ji držet, setChange = přechod na jinou sadu strun
//   applies  meters: počty dob v taktu, kde se sazba nabízí (bez = všude)
//   why, try jako u přístupů; tokeny {I.r}, {V.r}, {ii} … viz fillTokens v js/teaching/approach.js

export const SAZBY = {
  open: {
    name: 'Otevřené akordy',
    level: 1,
    build: 'open',
    move: { hand: 1, voice: 0.05, center: 1 },
    why: 'Táborákové hmaty u nultého pražce: prázdné struny zní dlouho a plně, basový tón je kořen. Kde otevřený tvar není, nastoupí barré. V tóninách C, G, D, A, E a jejich mollových paralelách je skoro všechno otevřené; v jiných pomůže kapodastr.',
    try: ['Přehoď mezi dvěma akordy, aniž by pravá ruka přestala hrát – levá ruka přechází na poslední dobu.', 'Najdi prst, který při změně zůstává na místě (v C → Am ukazovák na C), a nech ho tam.'],
  },
  barre: {
    name: 'Barré E/A tvar',
    level: 1,
    build: 'grips',
    noOpen: true,
    move: { hand: 1.2, voice: 0.05, center: 5 },
    grips: [
      { label: 'E-tvar', shape: '1 5 1 3 5 1', types: ['', 'm', 'sus4'] },
      { label: 'A-tvar', shape: 'x 1 5 1 3 5', types: ['', 'm', 'sus4', 'sus2'] },
      { label: 'E-tvar', shape: '1 5 7 3 5 1', types: ['7', 'm7', 'maj7', '7sus4'] },
      { label: 'A-tvar', shape: 'x 1 5 7 3 5', types: ['7', 'm7', 'maj7', '7sus4'] },
      { label: 'E-tvar', shape: '1 x 6 3 5 x', types: ['6', 'm6'] },
      { label: 'A-tvar', shape: 'x 1 5 1 3 6', types: ['6', 'm6'] },
      { label: 'E-tvar', shape: '1 x 7 3 5 x', types: ['m7b5', 'dim7'] },
      { label: 'A-tvar', shape: 'x 1 5 7 3 x', types: ['m7b5', 'dim7'] },
      { label: 'E-tvar', shape: '1 3 7 9 x x', types: ['7b9', '7#9'] },
      { label: 'A-tvar', shape: 'x 1 3 7 9 x', types: ['7b9', '7#9', 'm9'] },
      { label: 'A-tvar', shape: 'x 1 3 7 9 5', types: ['9'] },
      { label: 'E-tvar', shape: '1 5 1 3 x x', types: ['dim'] },
      { label: 'A-tvar', shape: 'x 1 5 1 3 x', types: ['dim'] },
      { label: 'A-tvar', shape: 'x 1 3 5 1 x', types: ['aug'] },
    ],
    why: 'Dva tvary, které se posouvají po hmatníku: E-tvar má kořen na 6. struně, A-tvar na 5. Každý akord jde zahrát jedním nebo druhým, takže se ruka nemusí stěhovat – {I.r} a {IV.r} leží na stejném pražci (jeden E-tvar, druhý A-tvar), {V.r} o dva pražce výš.',
    try: ['Zahraj kolečko tak, aby ukazovák nikdy neposkočil o víc než dva pražce.', 'Po úhozu povol tlak levé ruky – akord se utne (to je základ funky a rockového „chop“).'],
  },
  shell: {
    name: 'Shell chords',
    level: 2,
    build: 'grips',
    extras: ['6'],
    move: { hand: 0.4, voice: 1, center: 5 },
    grips: [
      { label: 'shell', shape: '1 x 7|6|1 3 x x' },
      { label: 'shell', shape: 'x 1 3 7|6|5 x x' },
      { label: 'shell', shape: '1 x 7 3 5 x', types: ['m7b5', 'dim7'] },
      { label: 'shell', shape: 'x 1 5 7 3 x', types: ['m7b5', 'dim7'] },
      { label: 'shell', shape: '1 3 7 9 x x', types: ['7b9', '7#9'] },
      { label: 'shell', shape: 'x 1 3 7 9 x', types: ['7b9', '7#9'] },
      { label: 'shell', shape: '1 5 1 3 x x', types: ['dim'] },
      { label: 'shell', shape: 'x 1 5 1 3 x', types: ['dim'] },
    ],
    why: 'Jen tři tóny: kořen v basu, tercie a septima (1-7-3 s kořenem na 6. struně, 1-3-7 na 5.). Tercie a septima rozhodují, jaký akord zní – kvinta je zbytečná. Mezi akordy se tvary střídají a hlasy se hýbou o půltón nebo stojí: septima druhého stupně sjede na tercii {V.r}, septima {V.r} na tercii {I.r}. Kvintakord bez septimy dostane sextu (C6), pokud patří do tóniny, jinak oktávu. Je to přesně „linka vodicích tónů“ ze Sólování, jen ve hmatu.',
    try: ['Hraj po čtvrtích krátce a tiše (Freddie Green) – kořen se slyší jako basa.', 'Sleduj horní tón hmatu: zazpívej ho přes celé kolečko, je to linka vodicích tónů.'],
  },
  triads: {
    name: 'Trojzvuky nahoře',
    level: 2,
    build: 'close',
    tones: { '*': [['1', '3', '5'], ['3', '5', '7']] },
    sets: [[3, 2, 1], [4, 3, 2]],
    setPenalty: 1.5,
    move: { hand: 0.3, voice: 1, center: 7, setChange: 1 },
    why: 'Tři horní struny, kvintakord v obratu, který je nejblíž předchozímu – prsty se posunou o půltón nebo celý tón a zbytek stojí. Kořen v basu chybí, nechává místo basové kytaře nebo první kytaře s otevřenými akordy. Nad septakordem jde vzít i trojzvuk od tercie (3-5-7): nad G7 zmenšený, nad Cmaj7 Em.',
    try: ['Zahraj kolečko jen na strunách 1–3 a hlídej horní tón – má tvořit melodii.', 'Totéž na strunách 2–4, pak přepínej mezi sadami po taktech.'],
  },
  colors: {
    name: 'Barvy 6 a 9',
    level: 2,
    build: 'colors',
    move: { hand: 0.8, voice: 0.1, center: 4, pos: 0.4 },
    choose: {
      '': { T: ['6/9', 'maj9', '6'], S: ['6/9', 'maj9', '6'], D: ['13', '9', '7b9', '6/9'], '*': ['6/9', '6'] },
      m: { T: ['m9', 'm6', 'm7'], S: ['m6', 'm9', 'm7'], '*': ['m9', 'm7'] },
      7: { D: ['13', '9', '7b9', '7'], '*': ['9', '13', '7'] },
      maj7: { '*': ['maj9', '6/9', 'maj7'] },
      m7: { '*': ['m9', 'm7'] },
      6: { '*': ['6/9', '6'] },
      m6: { '*': ['m6'] },
      9: { '*': ['9', '13'] },
      m9: { '*': ['m9'] },
      '7b9': { '*': ['7b9'] },
      m7b5: { '*': ['m7b5'] },
      dim: { '*': ['m7b5', 'dim7'] },
      dim7: { '*': ['dim7'] },
    },
    why: 'Místo holého akordu barevný: tónika {I.r}6/9 nebo maj9, mollový akord s nonou (m9) nebo sextou (m6 – na subdominantě romantická klasika), dominanta s tercdecimou (13) nebo nonou, v moll s malou nonou (7♭9). Přidané tóny jsou vždy z tóniny, takže nic nedrhne – jen to zní měkčeji. Hmaty na 4–5 strunách, kořen v basu.',
    try: ['Zahraj kolečko nejdřív holými akordy, pak barvami – poslouchej, který tón dělá rozdíl.', 'Na konci fráze nech doznít 6/9: nezní uzavřeně, ale ani nedrhne.'],
  },
  bassChord: {
    name: 'Bas + akord',
    level: 2,
    build: 'bassChord',
    move: { hand: 1, voice: 0.05, center: 1 },
    why: 'Palec střídá kořen a kvintu na basových strunách, prsty brnknou akord na horních strunách: bum–čin, bum–čin (Carter style, polka, valčík). Basa tak sama chodí po kořenech a kvintách – {I.r} a {V.r} se střídají i uvnitř jednoho akordu.',
    try: ['Nejdřív jen palec: kořen na 1, kvinta na 3 (ve valčíku kořen na 1, akord na 2 a 3).', 'Před změnou akordu zahraj místo kvinty basový přechod k dalšímu kořeni.'],
  },
  boogie: {
    name: 'Dvojhmaty a shuffle',
    level: 1,
    build: 'power',
    move: { hand: 1, voice: 0.05, center: 2 },
    grips: [
      { label: 'power', shape: '1 5 x x x x' },
      { label: 'power', shape: 'x 1 5 x x x' },
      { label: 'power', shape: 'x x 1 5 x x', pen: 1 },
    ],
    walk: ['5', '6', 'b7'],
    applies: { meters: [4] },
    why: 'Kořen a kvinta na dvou basových strunách, horní tón chodí 5 → 6 → ♭7 → 6: bluesový boogie (Chuck Berry, Status Quo). Tercie chybí, takže sedí na dur i moll. {I.r} na 6. struně, {IV.r} na 5. na stejném pražci – ruka se nehýbe, jen přeskočí o strunu.',
    try: ['Po osminách v shuffle: 5-5-6-6-♭7-♭7-6-6, kořen drží ukazovák.', 'Tlum dlaní pravé ruky u kobylky (palm mute) – zní to tvrdě a krátce.'],
  },
  drop2: {
    name: 'Drop 2',
    level: 3,
    build: 'close',
    drop: 2,
    extras: ['6'],
    tones: {
      '*': [['1', '3', '5', '7|6|1']],
      6: [['1', '3', '5', '6']],
      m6: [['1', '3', '5', '6']],
      9: [['3', '5', '7', '9'], ['1', '3', '5', '7']],
      m9: [['3', '5', '7', '9'], ['1', '3', '5', '7']],
      '7b9': [['3', '5', '7', '9']],
      '7#9': [['3', '5', '7', '9']],
      add9: [['1', '9', '3', '5']],
      madd9: [['1', '9', '3', '5']],
    },
    sets: [[4, 3, 2, 1], [5, 4, 3, 2]],
    setPenalty: 1,
    move: { hand: 0.3, voice: 1, center: 7, setChange: 1 },
    why: 'Čtyřhlasý septakord na čtyřech sousedních strunách: z akordu v sevřené poloze se druhý hlas shora spustí o oktávu – vznikne hratelný hmat. Každý akord má čtyři obraty, mezi akordy se volí ten nejbližší, takže hlasy jdou po krocích jako v klavírní sazbě. Nad {V.r}7♭9 se kořen vynechá a hraje se 3-5-7-♭9 (zmenšený septakord).',
    try: ['Zahraj Cmaj7 ve všech čtyřech obratech na strunách 1–4 nahoru po hmatníku.', 'Kolečko tak, aby horní hlas klesal po krocích.'],
  },
};

// Výchozí pořadí sazeb podle stylu kolečka (první = výchozí).
export const COMP_ORDER = {
  folk: ['open', 'bassChord', 'colors', 'triads', 'barre', 'shell', 'drop2', 'boogie'],
  pop: ['open', 'barre', 'triads', 'colors', 'bassChord', 'shell', 'drop2', 'boogie'],
  rock: ['barre', 'boogie', 'open', 'triads', 'colors', 'shell', 'bassChord', 'drop2'],
  funk: ['triads', 'shell', 'drop2', 'colors', 'barre', 'open', 'boogie', 'bassChord'],
  blues: ['boogie', 'shell', 'open', 'barre', 'colors', 'triads', 'drop2', 'bassChord'],
  jazz: ['shell', 'drop2', 'colors', 'triads', 'barre', 'open', 'bassChord', 'boogie'],
};

// Styl kolečka podle výchozího grooveu (když kolečko nemá `style`).
export const GROOVE_STYLE = {
  jazzSwing: 'jazz', shuffle: 'blues', slowBlues: 'blues', rock8: 'rock', rockHalf: 'rock', funk16: 'funk', pop: 'pop',
  ballad: 'folk', folk44: 'folk', waltz: 'folk', polka: 'folk', countryTrain: 'folk',
};

// Otevřené tvary: akord → hmaty (struna 6 → 1, x = tlumená). Basový tón je vždy kořen.
export const OPEN = {
  C: ['x32010'], A: ['x02220'], G: ['320003', '320033'], E: ['022100'], D: ['xx0232'], F: ['133211', 'xx3211'],
  Am: ['x02210'], Em: ['022000'], Dm: ['xx0231'],
  C7: ['x32310'], A7: ['x02020', 'x02223'], G7: ['320001'], E7: ['020100', '022130'], D7: ['xx0212'], B7: ['x21202'],
  Cmaj7: ['x32000'], Amaj7: ['x02120'], Gmaj7: ['320002'], Emaj7: ['021100'], Dmaj7: ['xx0222'], Fmaj7: ['xx3210'],
  Am7: ['x02010'], Em7: ['022030', '020000'], Dm7: ['xx0211'], Bm7: ['x20202'],
  C6: ['x32210'], A6: ['x02222'], G6: ['320000'], E6: ['022120'], D6: ['xx0202'],
  Am6: ['x02212'], Em6: ['022020'], Dm6: ['xx0201'],
  Asus4: ['x02230'], Asus2: ['x02200'], Dsus4: ['xx0233'], Dsus2: ['xx0230'], Esus4: ['022200'],
  E7b9: ['020101'], A7b9: ['x02323'], B7b9: ['x21212'],
  Bm7b5: ['x2323x'], Dm7b5: ['xx0111'], Am7b5: ['x0101x'],
  Ddim7: ['xx0101'],
};

// Barevné akordy pro sazbu „Barvy 6 a 9“: intervaly, přípona a hmaty (role jako v grips).
export const COLOR_TYPES = {
  '6/9': { suffix: '6/9', iv: ['1', '3', '5', '6', '9'], grips: ['x 1 3 6 9 5', '1 3 6 9 x x', 'x x 1 3 6 9'] },
  6: { suffix: '6', iv: ['1', '3', '5', '6'], grips: ['x 1 3 6 1 x', '1 x 6 3 5 x'] },
  maj9: { suffix: 'maj9', iv: ['1', '3', '5', '7', '9'], grips: ['x 1 3 7 9 x', '1 3 7 9 x x'] },
  maj7: { suffix: 'maj7', iv: ['1', '3', '5', '7'], grips: ['x 1 5 7 3 x', '1 x 7 3 5 x'] },
  m9: { suffix: 'm9', iv: ['1', 'b3', '5', 'b7', '9'], grips: ['x 1 3 7 9 x', '1 x 7 3 5 9'] },
  m6: { suffix: 'm6', iv: ['1', 'b3', '5', '6'], grips: ['x 1 3 6 1 x', '1 x 6 3 5 x'] },
  m7: { suffix: 'm7', iv: ['1', 'b3', '5', 'b7'], grips: ['x 1 5 7 3 x', '1 x 7 3 5 x'] },
  9: { suffix: '9', iv: ['1', '3', '5', 'b7', '9'], grips: ['x 1 3 7 9 5', '1 3 7 9 x x'] },
  13: { suffix: '13', iv: ['1', '3', '5', 'b7', '13'], grips: ['1 x 7 3 13 x', 'x 1 x 7 3 13'] },
  '7b9': { suffix: '7♭9', iv: ['1', '3', '5', 'b7', 'b9'], grips: ['x 1 3 7 9 x', '1 3 7 9 x x'] },
  7: { suffix: '7', iv: ['1', '3', '5', 'b7'], grips: ['x 1 5 7 3 x', '1 x 7 3 5 x'] },
  m7b5: { suffix: 'm7♭5', iv: ['1', 'b3', 'b5', 'b7'], grips: ['x 1 5 7 3 x', '1 x 7 3 5 x'] },
  dim7: { suffix: '°7', iv: ['1', 'b3', 'b5', 'bb7'], grips: ['x 1 5 7 3 x', '1 x 7 3 5 x'] },
};
