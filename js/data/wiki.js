// Wiki ke kolečkům: co si číst, zatímco groove hraje. Stránku přidáš novou položkou podle id kolečka.
//
//   feel        jednou dvěma větami, o čem kolečko je
//   approaches  pořadí přístupů na učení (id z approaches.js); první je výchozí
//   notes       poznámka k přístupu právě pro toto kolečko
//   try         cvičení „zkus“ k přístupu právě pro toto kolečko
//
// V textech fungují tokeny: {I} {vi} {V7} = akordy v aktuální tónině, {ii.r} = jen kořen,
// {lane:T} = zdroj pruhu T vybraného přístupu, {ex:third} = příklady „od tercie“ z kolečka.

export const PROGRESSION_WIKI = {
  gypsyMinor: {
    feel: 'Romantická „cikánská“ moll: {V7b9} má v sobě malou nonu – zmenšený septakord nad kořenem. Ideální vstup do symetrických stupnic.',
    approaches: ['hmV', 'tdPent', 'dimDom', 'odTercie', 'keyScale', 'chordTones'],
    notes: {
      hmV: 'Přes {V7b9} je harmonická moll od {i.r} přesně ta stupnice, ze které akord vznikl.',
      dimDom: 'Zmenšená od kořene {V7b9}: tóny 1 ♭9 ♯9 3 ♯11 5 13 ♭7. Bez kořene je to zmenšený septakord od {V7b9.3} – posouvej ho o 3 pražce.',
      odTercie: 'Od tercie nad {V7b9} je zmenšený septakord od {V7b9.3} – tvůj „od tercie“ tě sám dovede k diminished.',
    },
    try: {
      dimDom: ['Přes {V7b9} zahraj lick „Zmenšený běh“, pak s +3 a +6 pražci; na {i} dopadni na {i.3}.'],
      hmV: ['Přes {V7b9} hraj ♭6 – 7 – 1 a drž {i.r} s vibratem.'],
    },
  },
  folk1645: {
    feel: 'Táborák, lidovka, pop padesátek. Čtyři akordy, dvě „místa“ na hmatníku a jeden půltón mezi nimi.',
    approaches: ['odTercie', 'tdPent', 'triadPair', 'keyPent', 'chordTones', 'tsdPent', 'keyScale'],
    notes: {
      triadPair: 'Přes {I} a {vi} kvintakordy {V} a {vi}, přes {IV} a {V7} kvintakordy {IV} a {V}. Hraješ jen akordy kolečka, ale nad {I} zní 6 a 9. Na {V7} → {I} sjede {IV.r} o půltón na {iii.r}.',
      odTercie: 'Linka z tercií akordů se sama zazpívá: {I.3} → {vi.3} → {IV.3} → {V7.3} a zpátky na {I.3}. Zkus ji jako melodii.',
      tdPent: '{I} a {vi} jsou tónika (jeden pruh), {IV} a {V7} napětí (druhý pruh). Na {V7} → {I} sjede {IV.r} o půltón na {iii.r}.',
      keyPent: 'Durová pentatonika z {I.r}: sedí všude, jen přes {V7} chybí jeho septima – zkus ji tam přidat.',
    },
    try: {
      odTercie: ['Přes každý akord jen tři tóny od tercie, jeden takt nahoru, další dolů.', 'Poslední tón každého taktu drž s vibratem.'],
      tdPent: ['Takt {I}: začni na {iii.r}, takt {IV}: začni na {ii.r} – ruka zůstává na místě.', 'Hledej půltón mezi pruhy a hraj ho přes změnu {V7} → {I}.'],
    },
  },
  trampMinor: {
    feel: 'Trampská moll: {i}, {iv} a dominanta {V7}. Melodie v moll, ale přes {V7} zazní zvýšená sedmička (vodicí tón) – to je ta „slza“.',
    approaches: ['odTercie', 'tdPent', 'triadPair', 'keyScale', 'keyPent', 'chordTones'],
    notes: {
      odTercie: 'Nad {i} je to {bIII}, nad {iv} {bVI}, nad {V7} zmenšený od {V7.3} – ten zvýšený tón táhne zpátky domů.',
      tdPent: 'Tři pruhy: {lane:T} přes {i}, {lane:N} přes {iv}, a přes {V7} zmenšený septakord {lane:V}. Ten je symetrický: stejný tvar posunutý o 3 pražce zní pořád stejně.',
      keyScale: 'Přirozená moll přes {i} a {iv}; přes {V7} si zvyš sedmý stupeň (vodicí tón {V7.3}).',
      triadPair: 'Přes {i} kvintakordy {bVII} a {i}, přes {iv} {bVI} a {bVII}, přes {V7} jeho vlastní kvintakord a ten o půltón výš ({bVI}) – malá nona a ♭13, cikánský a španělský zvuk. Vodicí tón {V7.3} pak stoupne do {i.r}.',
    },
    try: {
      tdPent: ['Přes {V7} hraj jen čtyři tóny zmenšeného akordu a dopadni na tón {i.r} nebo {bIII.r} na „jedna“.', 'Zmenšený tvar posuň o 3 pražce nahoru a zahraj totéž – zní to stejně.'],
      odTercie: ['Melodie z tercií: {i.3} – {iv.3} – {V7.3} – {i.3}. Zpívej ji a hraj zároveň.'],
    },
  },
  blues12: {
    feel: 'Dvanáctitaktové blues: každý akord je dominantní septakord, ale {I7} je pořád domov. Mollová pentatonika přes všechno, durová barva přes {I7}.',
    approaches: ['keyPent', 'bluesMix', 'chordTones', 'odTercie'],
    notes: {
      keyPent: 'Mollová pentatonika z {I.r} přes celé kolečko. Malá tercie přes {I7} „tře“ o velkou – to je blues.',
      bluesMix: 'Přes {I7} durová pentatonika (velká tercie {I7.3}), přes {IV7} a {V7} zpátky do mollové – malá tercie tóniny je septima {IV7}.',
      odTercie: 'Tři akordy = tři pruhy: nad {I7} {ex:third}. Zmenšené akordy od tercie = bluesové napětí.',
    },
    try: {
      keyPent: ['Celé kolečko jen v 1. poloze, fráze 2 takty + 2 takty pauza.', 'Na změnu {I7} → {IV7} dopadni na {IV7.3}.'],
      bluesMix: ['Přes {I7} končí každá fráze na {I7.3}, přes {IV7} na tónu o půltón níž.'],
    },
  },
  minorCircle: {
    feel: 'Romantický kvintový kruh v moll: akordy jdou po kvartách, každý další je kousek od předchozího. Ideální pro arpeggia.',
    approaches: ['odTercie', 'tdPent', 'chordTones', 'keyScale', 'keyPent'],
    notes: {
      odTercie: 'Arpeggio od tercie se posouvá vždy jen o krok – {ex:third}…',
      tdPent: 'Tónika ({i}, {bIII}) v jednom pruhu, subdominanta a {bVII} v druhém, {V7} zmenšený.',
    },
    try: {
      odTercie: ['Přes každý akord jen jeho 3-5-7, ale vždy začni tónem nejblíž tomu, kde jsi skončil.'],
    },
  },
  romanticMinor: {
    feel: 'Mollová balada, ve které všechny čtyři akordy leží v přirozené moll: žádný vodicí tón, žádný tlak domů, jen kolébání. Jedna stupnice přes všechno, melodie může volně plout.',
    approaches: ['odTercie', 'colors69', 'triadPair', 'tdPent', 'keyScale', 'pentFifth', 'keyPent', 'chordTones', 'secondVoice'],
    notes: {
      triadPair: 'Kolečko je samo ze dvou dvojic: přes {i} a {bIII} hraješ kvintakordy {bVII} a {i}, přes {bVI} a {bVII} právě tyhle dva akordy. Sóluješ tím, co máš pod prsty z doprovodu.',
      odTercie: 'Nad {i} vyjde od tercie {bIII}, nad {bVI} zase {i} – arpeggio se mezi akordy skoro nehne, jen sklouzne o krok. Celé kolečko: {ex:third}.',
      colors69: 'Nona {ii.r} nad {i} je nejměkčí barva kolečka. Nad {bIII} je sextou přímo kořen tóniny {i.r} – proto ten akord zní tak „domácky“.',
      tdPent: 'Přes {i} a {bIII} tónikový pruh {lane:T}, přes {bVI} a {bVII} pruh napětí {lane:N}. Bez dominanty s vodicím tónem zmenšený pruh nepotřebuješ.',
    },
    try: {
      odTercie: ['Melodie z tercií {i.3} – {bVI.3} – {bIII.3} – {bVII.3}: nejdřív dlouhé tóny s vibratem, pak mezi ně vlož po jednom průchodu.'],
      colors69: ['Přes {i} rozklad {i.r} – {i.3} – kvinta – {ii.r}; nonu nahoře nech doznít až do {bVI}.'],
    },
  },
  waltzMajor: {
    feel: 'Valčík: tři doby, tři akordy, tři tóny arpeggia na takt. Těžká jednička a dvě lehké doby – melodie dýchá po dvou taktech.',
    approaches: ['odTercie', 'chordTones', 'secondVoice', 'tsdPent', 'keyScale', 'enclosure', 'keyPent', 'dimDom'],
    notes: {
      odTercie: 'Ve 3/4 se 3-5-7 vejde přesně do taktu, jeden tón na dobu: {ex:third}.',
      chordTones: '{I}, {IV} a {V7} dohromady pokryjí všech sedm tónů tóniny. Na změně {V7} → {I} veď {V7.3} o půltón nahoru na {I.r} a septimu {IV.r} o půltón dolů na {I.3}.',
      secondVoice: 'Valčík si říká o dvojhlas: melodie po stupnici tóniny a o tercii níž její kopie. Tercie jsou nejpohodlnější na sousedních strunách G a H.',
      tsdPent: 'Tři akordy = přesně tři funkce: pentatonika od {iii.r} přes {I}, od {vi.r} přes {IV}, od {ii.r} přes {V7}.',
    },
    try: {
      odTercie: ['Jeden rozklad od tercie na takt (doby 1-2-3); ve druhém taktu stejného akordu ho otoč dolů.'],
      chordTones: ['Na „jedna“ každého taktu jen tón akordu, doby 2 a 3 nech na průchod nebo pauzu.'],
      secondVoice: ['Stupnici tóniny zahraj v terciích nahoru a dolů v jednom okně, pak z ní poskládej melodii na tři doby.'],
    },
  },
  waltzMinor: {
    feel: 'Mollový valčík – romance, kolotoč, harmonika. {V7} nese zvýšený sedmý stupeň {V7.3}, který melodii vrací domů na {i}.',
    approaches: ['odTercie', 'hmV', 'chordTones', 'colors69', 'tdPent', 'keyScale', 'dimDom', 'secondVoice'],
    notes: {
      odTercie: 'Nad {i} zní od tercie {bIII.r} dur, nad {iv} {bVI.r} dur, nad {V7} zmenšený akord od {V7.3}. Tři tóny – tři doby.',
      hmV: 'Přes {V7} harmonická moll od {i.r}: zvýšená sedmička {V7.3} je tercie akordu a jde o půltón nahoru na {i.r}.',
      colors69: 'Nad {i} je nona {ii.r}, nad {iv} je tentýž tón jeho sextou. Jeden tón, dvě barvy – drž ho přes změnu akordu.',
    },
    try: {
      hmV: ['V druhém taktu {V7} zahraj na doby 2 a 3 {bVI.r} a {V7.3}, na „jedna“ dalšího taktu dopadni na {i.r}.'],
      colors69: ['Na těžkou dobu {i} hraj nonu {ii.r}, nech ji znít přes {iv} a teprve na {V7} se pohni.'],
    },
  },
  polka: {
    feel: 'Polka: dva akordy, rychlá dvoudoba, krátké veselé fráze. Celé umění je v přechodu {I} ↔ {V7} a v druhém hlasu.',
    approaches: ['chordTones', 'secondVoice', 'enclosure', 'odTercie', 'keyScale', 'keyPent', 'dimDom'],
    notes: {
      chordTones: '{I} a {V7} mají společný jen jeden tón ({V7.r}). Na změně jdi z {I.r} o půltón dolů na {V7.3}, zpátky zase o půltón nahoru.',
      secondVoice: 'Polka bez druhého hlasu není polka. Melodii zdvoj o tercii níž, vždy po stupnici tóniny; přes {V7} skonči dvojhmatem {V7.3} + {ii.r}.',
      enclosure: 'Krátké fráze stojí na obalech: tón nad, tón pod, pak cíl. Na {I} obal tercii {I.3} tóny {IV.r} a {ii.r}.',
    },
    try: {
      chordTones: ['Takt {I}: {I.r} – {I.3} – kvinta – {I.3}; takt {V7}: {V7.r} – {V7.3} – {ii.r} – {IV.r}. Osminy, krátce a ostře.'],
      secondVoice: ['Stupnice tóniny v terciích na strunách G a H, nahoru a dolů v osminách.'],
      enclosure: ['Před každou „jedna“ v taktu {I} zahraj {IV.r} – {ii.r} – {I.3}.'],
    },
  },
  secDominants: {
    feel: 'Lidovka s vedlejší dominantou: {VI7} je „půjčená“ dominanta k {ii} a přinese tón mimo tóninu – {VI7.3}, zvýšený kořen tóniny. Ten půltón nahoru na {ii.r} je celý ten lidový zlom.',
    approaches: ['chordTones', 'guideLine', 'odTercie', 'dimDom', 'enclosure', 'keyScale', 'keyPent', 'modes'],
    notes: {
      chordTones: 'Na každém akordu zdůrazni tercii: {I.3} – {VI7.3} – {ii.3} – {V7.3}. {VI7.3} je mimo tóninu – právě ten musí zaznít.',
      guideLine: 'Vodicí tóny: {VI7.3} jde o půltón nahoru na {ii.r}, tercie {ii.3} zůstane ležet jako septima {V7} a nakonec s {V7.3} se rozvedou na {I.3} a {I.r}.',
      dimDom: 'Dvě dominanty = dvakrát zmenšená, přes {VI7} od jeho kořene, přes {V7} od jeho. Bez kořene je to zmenšený septakord od {VI7.3}, resp. {V7.3} – posouvej ho o 3 pražce.',
    },
    try: {
      chordTones: ['V taktu {VI7} skonči na {VI7.3} a na „jedna“ taktu {ii} jdi o půltón nahoru na {ii.r}.'],
      guideLine: ['Jen dva tóny na akord, dlouze. Hledej linku, ve které se každý hlas pohne nejvýš o půltón nebo zůstane stát.'],
    },
  },
  bluesQuick: {
    feel: 'Blues s rychlou čtyřkou: {IV7} přijde hned ve 2. taktu, takže se od začátku střídá domov a subdominanta. Stejná stavba jako 12taktové blues, jen víc pohybu.',
    approaches: ['keyPent', 'bluesMix', 'chordTones', 'guideLine', 'modes', 'odTercie', 'pentChord', 'dimDom'],
    notes: {
      keyPent: 'Mollová pentatonika z {I.r} přes všechno. Její malá tercie je septima {IV7} – proto ve 2. taktu zní tak doma.',
      bluesMix: 'Ve 2. taktu přepni z durové do mollové a ve 3. zpátky – rychlá čtyřka tě to naučí nejrychleji. Přes {I7} cíl {I7.3}, přes {IV7} tón o půltón níž (septima {IV7}).',
      guideLine: 'Mezi {I7} a {IV7} se tercie a septima jen prohodí o půltón: {I7.3} sjede na septimu {IV7}, septima {I7} sjede na {IV7.3}.',
    },
    try: {
      bluesMix: ['Takt 1 končí na {I7.3}, takt 2 na tónu o půltón níž, takt 3 zase na {I7.3}.'],
      guideLine: ['Prvních 8 taktů jen dva tóny na akord v půlových notách; pak mezi ně přidej jeden průchod.'],
    },
  },
  minorBlues: {
    feel: 'Pomalé mollové blues: noc, vibrato, dlouhé tóny. Zlom přijde v 9. taktu – {bVI7} sklouzne o půltón na {V7} a ten táhne zpátky na {i7}.',
    approaches: ['keyPent', 'chordTones', 'odTercie', 'dimDom', 'guideLine', 'modes', 'pentFifth'],
    notes: {
      keyPent: 'Mollová pentatonika z {i.r} sedí všude kromě jednoho místa: přes {V7} zní její septima proti tercii {V7.3}. Tam ji obejdi nebo jen krátce průchodem.',
      chordTones: 'Každý tón {bVI7} sjede o půltón dolů na tón {V7} – arpeggio posunuté o pražec níž. Tak snadno se blues „veze“ k dominantě.',
      odTercie: 'Nad {i7} zní od tercie {bIII.r} maj7, nad {iv7} {bVI.r} maj7 – bluesová moll najednou zní měkce, skoro romanticky.',
      dimDom: 'Přes {V7} zmenšená od jeho kořene: obsahuje {V7.3} i malou nonu {bVI.r} – spojí oba zlomové akordy.',
    },
    try: {
      chordTones: ['V 9. taktu hraj arpeggio {bVI7}, v 10. přesně totéž o pražec níž – a máš {V7}.'],
      keyPent: ['Každou frázi ukonči dlouhým tónem s vibratem a pak napočítej dvě doby ticha.'],
    },
  },
  pop1564: {
    feel: 'Nejhranější kolečko popu. Žádná septima, žádné ostré napětí – akordy se jen přelévají a melodie stojí na tom, kam dopadneš.',
    approaches: ['keyPent', 'tsdPent', 'odTercie', 'colors69', 'pentChord', 'chordTones', 'keyScale', 'tdPent'],
    notes: {
      keyPent: 'Durová pentatonika z {I.r}; přes {vi} ji slyš jako mollovou od {vi.r}. Stejné tóny, jiný domov.',
      tsdPent: 'Přes {I} a {vi} pentatonika od {iii.r}, přes {IV} od {vi.r}, přes {V} od {ii.r}. Nad {I} a {IV} zazní 6 a 9, nad {V} sus barva.',
      colors69: 'Nad {I} nona {ii.r} a sexta {vi.r}, nad {IV} nona {V.r} a sexta {ii.r}. Tón {ii.r} tak hraje dvě různé barvy.',
    },
    try: {
      keyPent: ['Každou frázi ukonči na tercii právě hraného akordu: {I.3}, {V.3}, {vi.3}, {IV.3}.'],
      colors69: ['Přes {I} a {IV} hraj jen sextu a nonu akordu, dlouze – uslyšíš, jak kolečko zjemní.'],
    },
  },
  fifties: {
    feel: 'Doo-wop balada: pomalé tempo, dlouhé zpívané tóny. Proti lidovce chybí septima na {V}, ale vodicí tón {V.3} táhne domů stejně.',
    approaches: ['odTercie', 'chordTones', 'colors69', 'tsdPent', 'keyPent', 'keyScale', 'secondVoice', 'enclosure'],
    notes: {
      odTercie: 'Linka tercií {I.3} – {vi.3} – {IV.3} – {V.3} je hotová melodie: dvakrát o tercii dolů, pak krok nahoru na vodicí tón a půltón domů na {I.r}.',
      chordTones: 'Na konci kola zahraj {V.3} a nech ho vystoupat o půltón na {I.r}. To je celý „slaďák“ padesátek.',
      colors69: 'Nad {I} sexta {vi.r} – nejtypičtější barva padesátek. Nad {IV} nona {V.r}.',
    },
    try: {
      odTercie: ['Celé kolečko jen tercie akordů v půlových notách, pak každou obal tónem nad a pod.'],
      chordTones: ['Ve 4. taktu stoupej {V.r} – {V.3} a na „jedna“ dalšího kola dopadni na {I.r}.'],
    },
  },
  iiVI: {
    feel: 'Základní buňka jazzu: příprava {ii7}, napětí {V7}, rozvod {Imaj7}. Kdo ji uhraje po vodicích tónech, uhraje půlku standardů.',
    approaches: ['guideLine', 'chordTones', 'odTercie', 'modes', 'enclosure', 'dimDom', 'keyScale', 'pentFifth'],
    notes: {
      guideLine: 'Septima {ii7} sjede o půltón na {V7.3}, tercie {ii7.3} zůstane jako septima {V7} a pak sjede na {Imaj7.3}. {V7.3} zůstane ležet jako septima {Imaj7}.',
      modes: 'Dórská od {ii.r}, mixolydická od {V.r}, jónská od {I.r} – pořád tytéž tóny. Smysl je slyšet, který tón je právě tercie a který septima.',
      enclosure: 'Bebopový trik: na konci {V7} obal {Imaj7.3} tóny nad a pod, aby cíl přišel přesně na „jedna“ taktu {Imaj7}.',
      dimDom: 'Přes {V7} zmenšená od kořene přinese ♭9 a ♯9 – napětí, které se na {Imaj7} rozpustí.',
    },
    try: {
      guideLine: ['Jen celé noty po vodicích tónech {ii7} → {V7} → {Imaj7}, jednou od tercie, jednou od septimy.', 'Pak mezi ně vlož po dvou osminách.'],
      enclosure: ['Poslední doby {V7}: {IV.r} – {ii.r} – a na „jedna“ {Imaj7.3}.'],
    },
  },
  iiVIlong: {
    feel: 'Totéž ii–V–I, ale pomalu: dva takty {ii7}, dva takty {V7} a čtyři takty {Imaj7}. Na každý akord je čas, takže se dá cvičit dopad na změnu i to, co hrát, když harmonie stojí.',
    approaches: ['guideLine', 'martino', 'triadPair', 'chordTones', 'odTercie', 'enclosure', 'modes', 'dimDom', 'colors69', 'keyScale'],
    notes: {
      martino: 'Linka začíná na sextě akordu: přes {ii7} od {V7.3}, přes {V7} od {iii.r}, přes {Imaj7} od {vi.r}. Každá linka končí na noně, která je sextou dalšího akordu – celé ii–V–I je jedna melodie.',
      guideLine: 'Septima {ii7} sjede o půltón na {V7.3}, septima {V7} sjede na {Imaj7.3}. Mezi změnami máš dva takty – vodicí tón drž a teprve před změnou se pohni.',
      triadPair: 'Přes {ii7} a {V7} kvintakordy {IV} a {V}, přes {Imaj7} kvintakordy {V} a {vi}: nad {Imaj7} zní 5-7-9 a 6-1-3. Klasická jazzová dvojice.',
      colors69: 'Čtyři takty {Imaj7} jsou místo pro barvy: nona {ii.r} a sexta {vi.r}. Na tónice se neboj zůstat.',
      dimDom: 'Přes dva takty {V7} zmenšená od kořene: první takt jeden tvar, druhý o 3 pražce výš, a na {Imaj7} rozvod.',
    },
    try: {
      guideLine: ['Celé noty: {ii7.3} – {ii7.3} – {V7.3}… a hledej, kde se vodicí tón posune o půltón.'],
      triadPair: ['Přes {V7} lick „Kaskáda do tóniky“, pak čtyři takty {Imaj7} jen kvintakordy {V} a {vi} střídavě.'],
    },
  },
  minor145: {
    feel: 'Rocková moll bez vodicího tónu: {v} je mollová, takže nic netáhne domů a kolečko se jen točí. Temné, modální, jako stvořené pro pentatoniku.',
    approaches: ['keyPent', 'tdPent', 'pentChord', 'odTercie', 'keyScale', 'chordTones', 'colors69'],
    notes: {
      keyPent: 'Mollová pentatonika z {i.r} obsahuje kořen všech tří akordů – nikde nic nedrhne.',
      tdPent: 'Přes {i} pruh {lane:T}, přes {iv} a {v} pruh {lane:N}. Mollová {v} nemá vodicí tón, takže zmenšený pruh tu není.',
      pentChord: 'Mollová pentatonika od kořene každého akordu: tři stejné tvary, jen posunuté. Ruka se stěhuje, prsty hrají pořád totéž.',
      chordTones: 'Všechny tři akordy jsou mollové – sleduj, jak putuje malá tercie: {i.3}, {iv.3}, {v.3}.',
    },
    try: {
      keyPent: ['Přes {v} bend z {iv.r} na {v.r}, na {i} ho pomalu povol zpátky.'],
      pentChord: ['Jeden lick zahraj přes každý akord od jeho kořene – posuneš ho o 5 a o 7 pražců.'],
    },
  },
  harmonicMinor: {
    feel: 'Klasická moll s dominantou: {V7} si vypůjčí vodicí tón {V7.3}, půltón pod {i.r}. Zní to vážně, klasicky až neoklasicky.',
    approaches: ['hmV', 'odTercie', 'tdPent', 'chordTones', 'dimDom', 'keyScale', 'enclosure', 'colors69'],
    notes: {
      hmV: 'Přes {i} a {iv} přirozená moll, přes {V7} harmonická – změní se jediný tón: malá septima tóniny se zvedne na {V7.3}.',
      tdPent: 'Přes {V7} pruh {lane:V}: zmenšený septakord od vodicího tónu. Nad {V7} zní jako 7♭9 a každý jeho tón se rozvede krokem na tón {i}.',
      odTercie: 'Nad {V7} je od tercie zmenšený akord od {V7.3} – stejný tvar jako pruh dominanty v „Tónika ↔ napětí“.',
    },
    try: {
      hmV: ['Přes {V7} zahraj {bVI.r} – {V7.3} – {i.r}: zvětšená sekunda a půltón, typický „orientální“ obrat.'],
      tdPent: ['Na {V7} zahraj zmenšený tvar a posuň ho o 3 pražce – ať jsi kdekoli, do {i} to máš o půltón.'],
    },
  },
  andalusian: {
    feel: 'Andaluská kadence: bas schází {i.r} – {bVII.r} – {bVI.r} – {V7.r}, flamenco a španělská romance. Na {V7} se zvedne vodicí tón a kolo začne znovu.',
    approaches: ['hmV', 'chordTones', 'odTercie', 'tdPent', 'dimDom', 'keyScale', 'keyPent', 'colors69'],
    notes: {
      hmV: 'Přes {i}, {bVII} a {bVI} přirozená moll, přes {V7} harmonická – zvýšená sedmička {V7.3} je tercie akordu. Malá nona {bVI.r} nad {V7} dělá frygický, flamencový zvuk.',
      chordTones: 'Tercie jdou paralelně s basem dolů: {i.3} – {bVII.3} – {bVI.3} – {V7.3}. Každý akord je o krok níž.',
      tdPent: 'Přes {i} tónikový pruh {lane:T}, přes {bVII} a {bVI} pruh napětí {lane:N}, přes {V7} zmenšený {lane:V}.',
    },
    try: {
      chordTones: ['Melodie z tercií {i.3} – {bVII.3} – {bVI.3} – {V7.3}, pak o půltón nahoru na {i.r}.'],
      hmV: ['Přes {V7} trylek mezi {V7.r} a {bVI.r} – malá nona je srdce flamenca.'],
    },
  },
  mixoVamp: {
    feel: 'Rockový mixolydický vamp: {bVII} přinese malou septimu tóniny a durovému zvuku dá drsnost. Nic se nerozvádí – vamp se točí a ty si hraješ.',
    approaches: ['modes', 'keyPent', 'pentChord', 'chordTones', 'odTercie', 'pentFifth', 'colors69'],
    notes: {
      modes: 'Mixolydická od {I.r} = durová s malou septimou, a ta septima je {bVII.r}, kořen akordu {bVII}. Jedna stupnice přes celý vamp.',
      keyPent: 'Durová pentatonika z {I.r} sedí, jen nemá {bVII.r}. Přes {bVII} proto dopadej na jeho tercii {bVII.3}, ta v pentatonice je.',
      pentChord: 'Durová pentatonika od kořene každého akordu: tři stejné tvary, {bVII} o dva pražce pod {I}, {IV} o pět nad ním.',
    },
    try: {
      modes: ['Přes {bVII} drž {bVII.r}, a když přijde {I}, pusť ho o půltón dolů na {vi.r} – sextu tóniny.'],
      keyPent: ['Přes {I} bendni malou tercii na velkou {I.3} – mollový nádech v durovém vampu.'],
    },
  },
  dorianVamp: {
    feel: 'Dórský funk: mollový {i7} a durový {IV7}. Klíčový tón je velká sexta tóniny {vi.r} – tercie {IV7}, která dává moll funky světlo.',
    approaches: ['modes', 'keyPent', 'guideLine', 'chordTones', 'pentChord', 'odTercie', 'colors69', 'pentFifth'],
    notes: {
      modes: 'Dórská od {i.r} = přirozená moll s velkou sextou {vi.r}. Ten jediný tón ji odlišuje od moll a v {IV7} je to jeho tercie.',
      keyPent: 'Mollová pentatonika z {i.r} funguje přes oba akordy. Přidej {vi.r} a pentatonika zní dórsky.',
      guideLine: 'Mezi {i7} a {IV7} se pohne jediný tón: tercie {i7.3} zůstane jako septima {IV7}, septima {i7} sjede o půltón na {IV7.3}.',
      colors69: 'Nad {i7} sedí dórská sexta {vi.r} i nona {ii.r} – m6 a m9 jsou funková klasika.',
    },
    try: {
      guideLine: ['Jen dva tóny na akord, rytmicky v šestnáctinách – jako druhá kytara.'],
      modes: ['Fráze přes {i7} ukonči na {vi.r}, přes {IV7} na {i7.3}.'],
    },
  },
};
