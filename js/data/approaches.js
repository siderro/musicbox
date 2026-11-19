// Přístupy k sólování: pojmenovaný způsob, jak hrát přes kolečko.
// Každý přístup má 1–3 pruhy (hmatníky pod sebou). Akord se pošle do pruhu podle své funkce
// (T tónika, S subdominanta, D dominanta); co do žádného pruhu nesedí, dostane pruh „akord“ (od tercie).
//
//   src     zdroj pruhu: 'scale:<id>@<stupeň>' nebo 'arp:<id>@<stupeň>' (stupeň od tóniky, jako v kolečkách),
//           podle tóniny: { major, minor, blues }; stupně se v moll počítají od dur stupnice tóniny
//           (a moll: 'v' = E, 'iv' = D, 'vii' = G♯)
//   follow  pruh se mění s akordem: 'chord' = tóny akordu, 'third' = od tercie (3-5-7), 'fifth' = od kvinty,
//           'martino' = 6-7-1-9 a 3-5-7 (tóny 1–4 stupnice od sexty, 5–7 arpeggio od tercie)
//   fn      funkce akordů, přes které pruh platí; '*' = všechny
//   leading pruh jen pro akordy s vodicím tónem (V, V7, vii° v moll)
//   bg      tlumená stupnice za arpeggiem
//   applies kde se přístup nabízí: modes (major/minor), blues true/false
//   why     proč to funguje; tokeny: {iii} = akord na stupni iii v tónině, {ii.r} = jen kořen,
//           {lane:T} = zdroj pruhu T („Em pentatonika“), {ex:third} = příklady z kolečka („nad Am C, nad Dm F“)
//   try     cvičení „zkus“
//   licks   licky a linky z licks.js podle pruhu: { T: [...], N: [...] }; '*' = každý pruh,
//           'cycle' = linka přes celé kolečko (každý akord ve svém pruhu)
//   bg      i u pruhu „za akordem“: tlumená stupnice tóniny za tóny akordu

export const APPROACHES = {
  keyPent: {
    name: 'Jedna pentatonika',
    level: 1,
    lanes: [{ id: 'P', name: 'pentatonika', src: { major: 'scale:majorPentatonic@I', minor: 'scale:minorPentatonic@i', blues: 'scale:minorPentatonic@I' }, fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Bezpečný základ: pentatonika tóniny sedí na všechny akordy, žádný tón nedrhne. Barvu akordu ale nesleduje – na změnách dopadej na tóny v kroužku.',
    try: ['Hraj jen v okně ruky, krátké fráze po 2 dobách a nech mezi nimi mezeru.', 'Každou frázi ukonči na tónu v kroužku (tón hraného akordu).'],
    licks: { '*': ['kpQA', 'kpRepeat', 'countrySlide', 'box1Bend'], cycle: ['ctUp'] },
  },
  keyScale: {
    name: 'Celá stupnice tóniny',
    level: 1,
    lanes: [{ id: 'S', name: 'stupnice', src: { major: 'scale:major@I', minor: 'scale:minor@i' }, fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: false },
    why: 'Všech sedm tónů tóniny. Oproti pentatonice přibudou dva „ostré“ tóny – přes tónikový akord se na nich nezastavuj, jsou to průchody.',
    try: ['Hraj po stupnici, ale na každou „jedna“ dopadni na tón v kroužku.'],
    licks: { '*': ['ksWalk', 'ksEnclose', 'hmMinor'], cycle: ['enCycle'] },
  },
  chordTones: {
    name: 'Tóny akordu',
    level: 1,
    lanes: [{ id: 'A', name: 'akord', follow: 'chord', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Jen 1-3-5(-7) akordu, který právě zní. Nejjistější cesta, jak „hrát harmonii“. Při změně akordu dopadni na tercii dalšího.',
    try: ['Přes každý akord jen jeho tóny, nahoru i dolů.', 'Zkus přes každý akord začít na jeho tercii.'],
    licks: { '*': ['ctDown', 'landHome'], cycle: ['ctUp'] },
  },
  odTercie: {
    name: 'Od tercie',
    level: 1,
    lanes: [{ id: 'A', name: 'od tercie', follow: 'third', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Nad každým akordem arpeggio postavené na jeho tercii (3-5-7): {ex:third}. Zní to jako maj7/m7 bez kořene – zpěvně a měkce. Přidej nonu a máš 3-5-7-9.',
    try: ['Přes každý akord rozklad od tercie nahoru, na posledním tónu vibrato.', 'Najdi nejbližší tón dalšího rozkladu – posun bývá jen o krok.'],
    licks: { '*': ['otArp'], cycle: ['otLine', 'otRise'] },
  },
  tdPent: {
    name: 'Tónika ↔ napětí',
    level: 2,
    lanes: [
      { id: 'T', name: 'tónika', src: { major: 'scale:minorPentatonic@iii', minor: 'scale:minorPentatonic@v' }, fn: ['T'] },
      { id: 'N', name: 'napětí', src: { major: 'scale:minorPentatonic@ii', minor: 'scale:minorPentatonic@iv' }, fn: ['S', 'D'] },
      { id: 'V', name: 'dominanta', src: { minor: 'arp:dim7@vii' }, bg: { minor: 'scale:harmonicMinor@i' }, fn: ['D'], leading: true },
    ],
    applies: { modes: ['major', 'minor'], blues: false },
    why: 'Dvě mollové pentatoniky, které se střídají podle funkce akordu. Přes tónikové akordy {lane:T} – nad tónikou zní 3-5-6-7-9 (maj9 se sextou). Přes subdominantu a dominantu {lane:N} – nad subdominantou zní sexta, nad dominantou sus (9 a 11). Na přechodu z dominanty na tóniku sjede septima o půltón na tercii. V moll přibude přes dominantu (s vodicím tónem) zmenšený septakord {lane:V} – nad ní zní jako 7♭9.',
    try: ['2 takty jen v tónikovém pruhu, při změně přepni na pruh napětí – ruka zůstává v okně.', 'Hledej tóny, které se mezi pruhy liší jen o půltón, a hraj je přes změnu.'],
    licks: { T: ['tdSix', 'landHome'], N: ['tdChange'], V: ['tdDim'], cycle: ['tdCycle'] },
  },
  tsdPent: {
    name: 'Tři pentatoniky T · S · D',
    level: 2,
    lanes: [
      { id: 'T', name: 'tónika', src: { major: 'scale:minorPentatonic@iii' }, fn: ['T'] },
      { id: 'S', name: 'subdominanta', src: { major: 'scale:minorPentatonic@vi' }, fn: ['S'] },
      { id: 'D', name: 'dominanta', src: { major: 'scale:minorPentatonic@ii' }, fn: ['D'] },
    ],
    applies: { modes: ['major'], blues: false },
    why: 'Mollová pentatonika od tercie durového akordu a od kvinty mollového či dominantního: {iii.r} přes tóniku, {vi.r} přes subdominantu, {ii.r} přes dominantu. Každý akord tak dostane vlastní barvu.',
    try: ['Přes každou funkci jeden pruh – zkus, jak zní {vi.r} pentatonika přes {IV} (sexta a nona).'],
    licks: { T: ['tdSix'], S: ['tdSix', 'tdChange'], D: ['tdChange'], cycle: ['tdCycle'] },
  },
  bluesMix: {
    name: 'Dur nad I7, moll nad IV7',
    level: 2,
    lanes: [
      { id: 'D', name: 'dur nad I7', src: { blues: 'scale:majorPentatonic@I' }, fn: ['T'] },
      { id: 'M', name: 'moll nad IV7 a V7', src: { blues: 'scale:minorPentatonic@I' }, fn: ['S', 'D'] },
    ],
    applies: { modes: ['major'], blues: true, bluesOnly: true },
    why: 'Nad {I7} durová pentatonika – sladká velká tercie (B.B. King, country). Nad {IV7} a {V7} mollová – malá tercie tóniny je septima {IV7}, takže přes něj zní přirozeně.',
    try: ['Přes {I7} dopadej na velkou tercii, při změně na {IV7} ji sjeď o půltón dolů.'],
    licks: { D: ['bmThird', 'bbBox'], M: ['bmSeventh', 'box1Bend', 'chuckBerry'], cycle: ['tdCycle'] },
  },
  dimDom: {
    name: 'Zmenšená přes dominantu',
    level: 3,
    lanes: [
      { id: 'T', name: 'domov', src: { major: 'scale:majorPentatonic@I', minor: 'scale:minorPentatonic@i', blues: 'scale:minorPentatonic@I' }, fn: ['T', 'S'] },
      { id: 'D', name: 'zmenšená', follow: 'halfWhole', fn: ['D'], domOnly: true },
    ],
    applies: { modes: ['major', 'minor'], blues: true, needs: 'dom' },
    why: 'Přes dominantní septakord stupnice půltón–celý tón od jeho kořene: obsahuje ♭9, ♯9, ♯11 a 13 – napětí, které se na tónice rozvede. Je symetrická: skládá se ze dvou zmenšených septakordů a zmenšený septakord od tercie, kvinty, septimy i ♭9 je pořád TENTÝŽ akord. Proto stejný tvar nebo lick posunutý o 3 pražce (malou tercii) zní pořád „správně“.',
    try: ['Přes dominantu hraj jen zmenšený septakord od její tercie (4 tóny) a pak ho posuň o 3 pražce nahoru.', 'Lick z wiki zahraj, pak tlačítkem +3 a +6 – zní stejně, jen výš.', 'Na tónice vždy dopadni na tón v kroužku – napětí se musí rozvést.'],
    licks: { T: ['landHome', 'kpQA'], D: ['ddCell', 'dimRun'], cycle: ['tdCycle'] },
  },
  hmV: {
    name: 'Harmonická moll přes V7',
    level: 2,
    lanes: [
      { id: 'T', name: 'moll', src: { minor: 'scale:minor@i' }, fn: ['T', 'S'] },
      { id: 'V', name: 'harmonická', src: { minor: 'scale:harmonicMinor@i' }, fn: ['D'], leading: true },
    ],
    applies: { modes: ['minor'], blues: false },
    why: 'Přes {i} a {iv} přirozená moll, přes dominantu {V7} harmonická moll – jediná změna je zvýšený sedmý stupeň ({V7.3}), tercie dominanty. Ten táhne o půltón nahoru do {i.r}. Zvětšená sekunda mezi ♭6 a 7 je ten „cikánský“ zvuk.',
    try: ['Přes {V7} hraj ♭6 → 7 → 1 (tři půltóny a půltón) a na „jedna“ dopadni na {i.r}.'],
    licks: { T: ['hmMinor', 'landHome'], V: ['hmLead'], cycle: ['tdCycle'] },
  },
  wholeTone: {
    name: 'Celotónová přes zvětšený akord',
    level: 3,
    lanes: [
      { id: 'T', name: 'domov', src: { major: 'scale:major@I', minor: 'scale:minor@i' }, fn: ['T', 'S', 'D'] },
      { id: 'W', name: 'celotónová', follow: 'wholeTone', fn: '*', augOnly: true },
    ],
    applies: { modes: ['major', 'minor'], blues: false, needs: 'aug' },
    why: 'Přes zvětšený akord (+, 7♯5) celotónová stupnice od jeho kořene: šest tónů po celých tónech, žádný půltón – zní snově a nestabilně. Je symetrická po celých tónech, takže tvar posunutý o 2 pražce zní stejně.',
    try: ['Přes zvětšený akord hraj tvar po celých tónech a posouvej ho o 2 pražce.'],
    licks: { T: ['landHome'], W: ['wtRun'] },
  },
  // ---------- fáze 4: za akordem, módy, vodicí tóny, barvy, obal, druhý hlas ----------
  pentChord: {
    name: 'Pentatonika za akordem',
    level: 2,
    lanes: [{ id: 'A', name: 'pentatonika akordu', follow: 'pent', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Přes každý akord pentatonika od jeho kořene: durová nad durovým a dominantním, mollová nad mollovým. Každý akord zní „celý“, ale musíš přepínat s ním – {ex:chord}.',
    try: ['Přes každý akord nejdřív jen kořen a tercii jeho pentatoniky, pak celý tvar.', 'Najdi, které tóny mají sousední pentatoniky společné – přes ně se přechází nejhladčeji.'],
    licks: { '*': ['pcBox'], cycle: ['pcCycle'] },
  },
  pentFifth: {
    name: 'Pentatonika od kvinty',
    level: 2,
    lanes: [{ id: 'A', name: 'od kvinty', follow: 'pentFifth', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Pentatonika postavená na kvintě akordu: nad mollovým a dominantním mollová (5-♭7-1-9-11, „sus“ zvuk), nad durovým durová (5-6-7-9-3, maj9). Tercie akordu v ní často chybí – zní to otevřeně a moderně.',
    try: ['Přes mollový akord hraj mollovou pentatoniku od jeho kvinty a poslouchej nonu a undecimu.', 'Tercii akordu si nech jen na dopad po změně.'],
    licks: { '*': ['pfSus'], cycle: ['pcCycle'] },
  },
  modes: {
    name: 'Módy podle akordu',
    level: 2,
    lanes: [{ id: 'M', name: 'mód', follow: 'mode', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Každý akord dostane stupnici, ze které vznikl: v dur je {ii} dórská, {IV} lydická, {V7} mixolydická; akord mimo tóninu dostane mód podle svého druhu (dominantní → mixolydická, V7 v moll → frygická dominantní). V blues je to mixolydická od každého akordu. Tóny jsou často stejné jako tónina – rozdíl dělá, na čem stojíš.',
    try: ['Přes každý akord najdi jeho charakteristický tón (dórská 6, lydická ♯4, mixolydická ♭7) a podrž ho.', 'V blues: mixolydická od každého akordu – přes {IV7} se změní jen jeden tón.'],
    licks: { '*': ['mdChar'], cycle: ['mdCycle'] },
  },
  guideLine: {
    name: 'Linka vodicích tónů',
    level: 1,
    lanes: [{ id: 'G', name: 'vodicí tóny', follow: 'guide', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Jen tercie a septima každého akordu – dva tóny, které určují, jaký akord zní. Mezi akordy se pohybují nejvýš o krok: septima dominanty sjede o půltón na tercii tóniky. Z téhle linky se dá postavit každé sólo.',
    try: ['Přes celé kolečko jeden tón na akord: vždy ten vodicí tón, který je nejblíž předchozímu.', 'Pak mezi ně vlož dvě tři noty – kostra zůstane slyšet.'],
    licks: { '*': ['glLand'], cycle: ['glLine', 'glChrom'] },
  },
  colors69: {
    name: 'Barvy 6 a 9',
    level: 1,
    lanes: [{ id: 'C', name: 'akord + 6 a 9', follow: 'color', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Tóny akordu (v kroužku) plus sexta a nona z tóniny. Sexta a nona změkčí každý akord – nad durovým zní lidově a sladce, nad mollovým romanticky. Kořen je nejtvrdší tón, na barvách se dá dlít.',
    try: ['Přes každý akord začni na noně a sjeď na tercii.', 'Konči fráze na sextě – nezní uzavřeně, ale ani nedrhne.'],
    licks: { '*': ['c69Lean'], cycle: ['c69Cycle'] },
  },
  enclosure: {
    name: 'Obal cílového tónu',
    level: 2,
    lanes: [{ id: 'A', name: 'cíle (tóny akordu)', follow: 'chord', bg: { major: 'scale:major@I', minor: 'scale:minor@i', blues: 'scale:mixolydian@I' }, fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: true },
    why: 'Cílový tón (tón akordu v kroužku) nehraješ rovnou, ale obalíš ho: tón tóniny nad ním a půltón pod ním, pak cíl na dobu. Tlumené tečky jsou stupnice tóniny, ze které se bere horní soused. Takhle zní jazz i bluegrass – melodie „ví“, kam jde.',
    try: ['Vyber jeden tón dalšího akordu a před změnou ho obal shora a zdola.', 'Pak obal z obou stran chromaticky (půltón nad, půltón pod).'],
    licks: { '*': ['enLand'], cycle: ['enCycle'] },
  },
  secondVoice: {
    name: 'Druhý hlas (tercie, sexty)',
    level: 2,
    lanes: [{ id: 'S', name: 'stupnice tóniny', src: { major: 'scale:major@I', minor: 'scale:minor@i' }, fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: false },
    why: 'Melodie a pod ní druhý hlas o tercii nebo o sextu níž – po stupnici tóniny, takže se interval sám mění na velký nebo malý. Tercie na sousedních strunách, sexty ob strunu. Lidovka, country, mariachi.',
    try: ['Hraj melodii z tercií akordů a přidej k ní tón o tercii níž.', 'Sexty: horní tón na struně H, spodní na struně D, prostřední tlum.'],
    licks: { cycle: ['sv3Cycle', 'sv6Cycle'] },
  },
  triadPair: {
    name: 'Dvojice kvintakordů',
    level: 2,
    lanes: [
      { id: 'T', name: 'tónika', src: { major: 'pair:V+vi', minor: 'pair:bVII+i' }, fn: ['T'] },
      { id: 'N', name: 'napětí', src: { major: 'pair:IV+V', minor: 'pair:bVI+bVII' }, fn: ['S', 'D'] },
      { id: 'V', name: 'dominanta', src: { minor: 'pair:V+bVI' }, fn: ['D'], leading: true },
    ],
    applies: { modes: ['major', 'minor'], blues: false },
    why: 'Dva kvintakordy o celý tón od sebe, dohromady šest tónů bez jediného půltónu navíc. Přes tóniku {lane:T}: nad tónikou zní 5-7-9 a 6-1-3, tedy maj9 se sextou – kořen kvarta tam není, nic nedrhne. Přes subdominantu a dominantu {lane:N}: nad dominantou 1-3-5 a ♭7-9-11, nad subdominantou lydická ♯11. Hraješ jen kvintakordy, které znáš z doprovodu, ale zní to jako barvy 6, 9 a 11. Na přechodu z napětí do tóniky sjede septima dominanty o půltón na tercii. V moll přibude přes dominantu s vodicím tónem dvojice {lane:V} – malá nona a ♭13, španělský zvuk.',
    try: ['Přes tóniku jeden kvintakord nahoru, druhý dolů – vždy tři osminy, šest tónů na dvě doby.', 'Zkus totéž v obratech: začni na tercii nebo kvintě, ať se kvintakordy proplétají a ruka zůstane v okně.', 'Při změně do tóniky hledej půltón mezi pruhy a dopadni na něj.'],
    licks: { T: ['tpAlt', 'landHome'], N: ['tpCascade'], V: ['tpSpanish'], cycle: ['tpCycle'] },
  },
  martino: {
    name: 'Zmollovatění (Martino)',
    level: 2,
    lanes: [{ id: 'M', name: 'od sexty', follow: 'martino', fn: '*' }],
    applies: { modes: ['major', 'minor'], blues: false },
    why: 'Pat Martino: durový akord nahraď mollou o malou tercii níž (nad C Am, nad F Dm, nad G7 Em). Linka přes takt: čtyři tóny stupnice od sexty akordu a pak arpeggio od tercie s nonou – nad C A H C D, E G H D, tedy 6-7-1-9 a 3-5-7-9. Začínáš na barvě, ne na kořeni. Když akordy jdou po kvartách (ii–V–I), nona jednoho akordu je sexta dalšího, takže linky na sebe navazují bez skoku.',
    try: ['Přes každý akord celá linka osminami nahoru, poslední tón (nonu) podrž.', 'V ii–V–I zahraj linky za sebou – poslouchej, že každá začíná tam, kde skončila předchozí.', 'Nad tónikou zkus místo stupnice od sexty jen arpeggio od tercie – druhá náhrada (nad C Em).'],
    licks: { '*': ['mtChange'], cycle: ['mtCycle'] },
  },
};

// Výchozí pořadí přístupů podle stylu kolečka (první = výchozí).
export const DEFAULT_ORDER = {
  folk: ['odTercie', 'tdPent', 'colors69', 'triadPair', 'keyPent', 'guideLine', 'secondVoice', 'chordTones', 'keyScale', 'tsdPent'],
  blues: ['keyPent', 'bluesMix', 'modes', 'guideLine', 'chordTones', 'odTercie'],
  default: ['keyPent', 'odTercie', 'tdPent', 'triadPair', 'guideLine', 'chordTones', 'keyScale', 'tsdPent'],
};
