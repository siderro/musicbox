// Wiki doprovodu ke kolečkům (záložka Doprovod). Stránku přidáš novou položkou podle id kolečka.
//
//   feel     jednou dvěma větami, jak kolečko doprovázet
//   sazby    pořadí sazeb na učení (id z voicings.js); první je výchozí
//   rhythms  pořadí rytmů (id z rhythms.js, jen ty, které sedí do taktu kolečka); první je výchozí
//   notes    poznámka k sazbě právě pro toto kolečko   { sazbaId: '…' }
//   rhythmNotes  poznámka k rytmu                       { rhythmId: '…' }
//   try      cvičení k sazbě právě pro toto kolečko    { sazbaId: ['…'] }
//
// Tokeny jako ve wiki Sólování: {I} {vi} {V7} = akordy v aktuální tónině, {V7.r} = kořen, {V7.3} = tercie.
// Pevné hmaty („v C: x32010“) jsou vždy označené tóninou, ve které platí.

export const COMP_WIKI = {
  folk1645: {
    feel: 'Táborákové kolečko {I}–{vi}–{IV}–{V7}: každý akord celý takt, takže je čas na úhoz i na přehmat. Basa jde po kořenech dolů o tercii ({I.r} → {vi.r} → {IV.r}) a pak o krok nahoru na {V7.r}.',
    sazby: ['open', 'bassChord', 'colors', 'triads', 'shell', 'barre'],
    rhythms: ['folkPop', 'quarters', 'tramp', 'trampCU', 'travis', 'arpeggio', 'eighths'],
    notes: {
      open: 'V C to jsou čtyři základní hmaty: C x32010, Am x02210, F (barré 133211 nebo malé xx3211) a G7 320001. Z C do Am se hýbe jen prsteneček (z 5. struny na 3.) – ukazovák a prostředníček zůstávají.',
      bassChord: 'Kořen na 1, kvinta na 3: nad {I} {I.r}–{V.r}, nad {vi} {vi.r}–{iii.r}. Před každou změnou akordu zahraje basa na poslední osminu přechodový tón – před {I} je to {V7.3} (tón pod {I.r}), basa sama dojde domů.',
      colors: 'Místo {I} zahraj {I}6/9, místo {vi} {vi}9, {V7} jako 13. V C: C6/9 x32233, Am9 5x5557, F6/9 xx3233, G13 3x345x. Pořád stejné kolečko, jen „měkčí“ – sexta a nona jsou tvoje oblíbené barvy.',
      triads: 'Na strunách 1–3 se trojzvuky skoro nehýbou: v C C (3-5-1) xxx988 → Am (5-1-3) x-x-x-9-10-8 → F x-x-x-10-10-8 → G7 xxx787, horní tón tvoří melodii. Hraj to jako druhá kytara k někomu, kdo drží otevřené akordy.',
      shell: 'Durové kvintakordy dostanou sextu ({I}6, {IV}6), mollový {vi} malou septimu ({vi}7). Horní hlasy (3 a 7, u {I}6 a {IV}6 3 a 6) jsou přesně linka vodicích tónů z přístupu „Linka vodicích tónů“ v Sólování.',
    },
    rhythmNotes: {
      folkPop: 'D.DU.UDU je pro tohle kolečko „ten“ úhoz. Přehmat dělej na posledním ↑ – prázdné struny tam klidně zazní.',
      travis: 'Palec střídá kořen a střídavý bas (kvintu na vedlejší basové struně), prsty hrají mezi doby z horních strun. Na {V7} zní nejhezčí ♭7 nahoře.',
    },
    try: {
      open: ['Celé kolečko jen čtvrtěmi a nekoukej na levou ruku – přehmat musí stihnout čtvrtou dobu.', 'Najdi společné tóny: {I} a {vi} sdílí {I.r} a {I.3}, {IV} a {vi} sdílí {I.r} a {vi.r}.'],
      bassChord: ['Jen palec: kořen–kvinta přes celé kolečko, pak přidej „chick“ na 2 a 4.'],
      colors: ['Střídej po taktech holý akord a barvu: {I} – {I}6/9 – {I} – {I}6/9 a poslouchej, co dělá sexta.'],
    },
  },

  trampMinor: {
    feel: 'Trampská moll: {i}, {iv} a dominanta {V7}. Dlouho se drží {i}, napětí přijde až s {V7} a jeho zvýšeným tónem {V7.3} – ten táhne zpátky na {i.r}.',
    sazby: ['open', 'bassChord', 'colors', 'shell', 'triads', 'barre'],
    rhythms: ['tramp', 'trampCU', 'folkPop', 'quarters', 'travis', 'arpeggio'],
    notes: {
      open: 'V A moll nejjednodušší hmaty vůbec: Am x02210, Dm xx0231, E7 020100. Z Am do E7 se celý tvar posune o strunu nahoru – stejné prsty, jiné struny.',
      bassChord: 'Boom-chick je tramp sám o sobě: nad {i} bas {i.r}–{v.r}, nad {V7} {V7.r}–{ii.r}. Na konci 2. taktu {V7} zahraj v basu {V7.r} → {V7.3} → {i.r}: vodicí tón v basu dovede kolečko domů.',
      colors: 'Nad {i} nona ({i}9), nad {iv} sexta ({iv}6 – romantická klasika), nad {V7} malá nona ({V7.r}7♭9). V A moll: Am9 5x5557, Dm6 x5343x, E7♭9 x7676x. Malá nona na dominantě = cikánský zvuk.',
      shell: 'Tři tóny: {i}7, {iv}6 a {V7}. Z {V7} do {i}7 se dva horní hlasy posunou o krok dolů: tercie {V7.3} na septimu {i}7 a septima {V7} na tercii {i.3}. To je linka vodicích tónů z přístupu „Linka vodicích tónů“ v Sólování, jen ji teď držíš v hmatu.',
    },
    rhythmNotes: {
      tramp: 'Bum–čin, bum–čin: palec kořen na 1, střídavý bas na 3, „chick“ jen přes horní struny. Basovou strunu „chick“ nezasáhne.',
      trampCU: 'Boom-chicka: po „chick“ ještě lehce nahoru. Swingne to samo, když nespěcháš.',
    },
    try: {
      bassChord: ['Na posledních dvou dobách taktu před {V7} zahraj basový přechod {i.r} → {V7.r} po stupnicových krocích.'],
      open: ['Drž {i} čtyři takty a hraj jen pravou rukou – hledej přízvuk na 2 a 4 (backbeat).'],
    },
  },

  romanticMinor: {
    feel: 'Romantická moll {i}–{bVI}–{bIII}–{bVII}: žádná dominanta, kolečko plyne v kruhu. Je to doprovod k baladě – nech akordy znít a hraj spíš málo.',
    sazby: ['colors', 'open', 'triads', 'bassChord', 'barre', 'shell'],
    rhythms: ['arpeggio', 'quarters', 'folkPop', 'travis', 'bossa'],
    notes: {
      colors: 'Tady barvy zazáří nejvíc: {i}9, {bVI}6/9, {bIII}6/9, {bVII}6/9. V A moll: Am9 5x5557, F6/9 xx3233, C6/9 x32233, G6/9 xx5455. {bVII} schválně bez septimy – s ní by zněl jako cizí dominanta. Nona nad {i} je zároveň tercie {bVII} – zní, jako by melodie pokračovala dál.',
      open: 'V A moll Am x02210, F 133211, C x32010, G 320003. Mezi F a C stačí přesunout tři prsty o strunu, ukazovák drží C na 2. struně.',
      triads: 'Nahoře se trojzvuky hýbou po půltónech: horní hlas dělá pomalou melodii. Ideální druhá kytara k arpeggiu.',
    },
    rhythmNotes: {
      arpeggio: 'p-i-m-a po osminách: palec kořen, pak tři prsty nahoru. Akord nech doznít přes celý takt, nic netlum.',
    },
    try: {
      colors: ['Kolečko jen arpeggiem v barvách, pomalu (60 BPM), a zpívej nad tím nonu každého akordu.'],
      triads: ['Najdi obraty tak, aby horní tón klesal po krocích přes všechny čtyři akordy.'],
    },
  },

  waltzMajor: {
    feel: 'Valčík {I}–{IV}–{V7} ve 3/4: raz–dva–tři, těžká je jen jednička. Akord se mění po dvou taktech, takže je čas na střídavý bas.',
    sazby: ['bassChord', 'open', 'colors', 'triads', 'barre'],
    rhythms: ['waltz', 'waltzAlt', 'arpeggio34'],
    notes: {
      bassChord: 'Bas na 1, akord na 2 a 3 (um–pa–pa). V C: C x32010 s basem C–G, F 133211 s basem F–C, G7 320001 s basem G–D. Druhý takt stejného akordu začni střídavým basem.',
      open: 'Otevřené hmaty jako u lidovky, jen pravá ruka dělá trojdobé um–pa–pa. Na pa–pa hraj jen horní struny, ať je slyšet bas.',
      colors: 'Valčík snese {I}6/9 a {IV}6/9 – zní to jako starý salonní orchestr. {V7} jako 13.',
    },
    rhythmNotes: {
      waltzAlt: 'Takt 1 kořen, takt 2 kvinta: basa chodí sama a ty se soustředíš na lehké „pa–pa“.',
      arpeggio34: 'p-i-m-a-m-i po osminách: šest tónů na takt, vlnka nahoru a dolů.',
    },
    try: {
      bassChord: ['Jen basy: kořen a kvinta po taktech, pak přidej pa–pa slabě a krátce.'],
    },
  },

  polka: {
    feel: 'Polka {I}–{V7} ve 2/4: bum–čin, bum–čin, rychle a pérovaně. Dva akordy, takže všechno je v pravé ruce a v basech.',
    sazby: ['bassChord', 'open', 'colors', 'barre'],
    rhythms: ['polka'],
    notes: {
      bassChord: 'Bas na 1, „chick“ na 2, další takt střídavý bas. V C: C s basem C–G (x32010), G7 s basem G–D (320001). Z {I} na {V7} se hýbe jen pár prstů – zbytek drží.',
      open: 'Otevřené hmaty stačí; trik je v tom, aby „čin“ byl krátký – levá ruka po úhozu povolí tlak.',
    },
    rhythmNotes: {
      polka: 'Bum na 1 (kořen, pak kvinta), čin na 2 jen přes horní struny. Čin krátce utni.',
    },
    try: {
      bassChord: ['Před návratem na {I} zahraj v basu {V7.r} → {V7.3} → {I.r} (vodicí tón v basu).'],
    },
  },

  blues12: {
    feel: 'Dvanáctitaktové blues: {I7}, {IV7}, {V7} – všechno dominantní septakordy. Doprovod drží shuffle, levá ruka se skoro nehýbe.',
    sazby: ['boogie', 'shell', 'open', 'barre', 'colors'],
    rhythms: ['shuffle', 'eighths', 'rockPalm', 'freddieGreen'],
    notes: {
      boogie: 'Klasický boogie 5-6-♭7-6 na dvou basových strunách. V A: A5 na 5. struně (x02xxx), D5 o strunu výš (xx02xx), E5 na 6. struně (02xxxx) – ruka zůstává na místě.',
      shell: 'Shell chords přes blues: {I7} 1-7-3, {IV7} 1-3-7 – septima {I7} je o půltón nad tercií {IV7}. Horní hlasy jsou linka vodicích tónů (přístup „Linka vodicích tónů“ v Sólování): v A G → F♯ → G♯.',
      open: 'V A, E a D jsou otevřené septakordy: A7 x02020, D7 xx0212, E7 020100. Zvuk „starého blues“.',
    },
    rhythmNotes: {
      shuffle: 'Trioly: dlouhá–krátká, dlouhá–krátká. Přízvuk na 2 a 4 dělá bicí, ty drž rovnoměrně.',
    },
    try: {
      boogie: ['Přes {V7} → {IV7} (takty 9–10) nech boogie běžet beze změny prstokladu – jen o strunu jinde.'],
      shell: ['Zkus celé blues ve shell chords mezi 5. a 7. pražcem – ani jednou se neposuneš o víc než dva pražce.'],
    },
  },

  iiVI: {
    feel: 'Jazzové {ii7}–{V7}–{Imaj7}: každý akord táhne do dalšího o kvartu. Doprovod tu dělá vedení hlasů – septima jednoho akordu sjede o půltón na tercii dalšího.',
    sazby: ['shell', 'drop2', 'colors', 'triads'],
    rhythms: ['freddieGreen', 'charleston', 'bossa', 'quarters'],
    notes: {
      shell: 'V C: Dm7 x535xx → G7 3x34xx → Cmaj7 x324xx. Septima Dm7 (C) sjede na tercii G7 (H), septima G7 (F) sjede na tercii Cmaj7 (E). Tyhle horní hlasy jsou přesně linka vodicích tónů z přístupu „Linka vodicích tónů“ v Sólování.',
      drop2: 'Čtyři hlasy na strunách 1–4: v C Dm7 xx7768, G7 xx5767, Cmaj7 xx5557 – nejvýš o pražec dva, horní hlas klesá.',
      colors: '{ii7} jako m9, {V7} jako 13, {Imaj7} jako maj9: v C Dm9 x5355x, G13 3x345x, Cmaj9 x3243x. Barvy z tóniny, nic nedrhne.',
    },
    rhythmNotes: {
      freddieGreen: 'Čtyři krátké úhozy dolů na takt, 2 a 4 o chlup silněji. Levá ruka po úhozu povolí, ať to nezvoní.',
      charleston: 'Na 1 a na „a“ dvojky: krátce–dlouze. Nejtypičtější jazzový comping.',
    },
    try: {
      shell: ['Zahraj jen horní tón každého shellu a zazpívej ho – to je linka 3 a 7.', 'Tytéž shelly, ale kořen na druhé struně (střídej 6. a 5. strunu jinak než engine).'],
      drop2: ['Najdi Cmaj7 v drop 2 ještě o obrat výš a zahraj kolečko v té poloze.'],
    },
  },

  iiVIlong: {
    feel: 'Dlouhé ii–V–I: dva takty {ii7}, dva {V7}, čtyři {Imaj7}. Víc času na jednom akordu – prostor pro rytmus a pro obměnu hmatu uvnitř akordu.',
    sazby: ['shell', 'drop2', 'colors', 'triads'],
    rhythms: ['freddieGreen', 'charleston', 'bossa', 'quarters'],
    notes: {
      shell: 'V C Dm7 x535xx, G7 3x34xx, Cmaj7 x324xx – na čtyři takty Cmaj7 přepni ve třetím taktu na C6 (horní hlas H → A): je to starý swingový trik a zní to jako pohyb.',
      drop2: 'Na dlouhém {Imaj7} projdi obraty drop 2 nahoru po hmatníku – harmonie stojí, ale doprovod se hýbe.',
      triads: 'Trojzvuky nad septakordy: nad {Imaj7} trojzvuk od tercie (v C Em xxx987) = maj7 bez kořene, nad {V7} zmenšený od tercie.',
    },
    rhythmNotes: {
      bossa: 'Bossa přes ii–V–I: palec drží kořen a kvintu, prsty hrají synkopy. Funguje i v pomalejším tempu.',
    },
    try: {
      shell: ['Druhý takt každého akordu zahraj druhým tvarem (6. ↔ 5. struna).'],
      drop2: ['Na čtyři takty {Imaj7} čtyři různé obraty, každý takt jeden.'],
    },
  },

  gypsyMinor: {
    feel: 'Cikánská moll {i}–{iv}–{V7b9}: dlouhé plochy po dvou taktech, napětí nese malá nona dominanty – tón {bVI.r} nad {V7b9.r}, který táhne dolů na kvintu {i}. Doprovod krátce a rytmicky, ať je slyšet swing.',
    sazby: ['colors', 'open', 'shell', 'bassChord', 'drop2', 'triads', 'barre'],
    rhythms: ['freddieGreen', 'arpeggio', 'tramp', 'quarters', 'bossa'],
    notes: {
      colors: 'V A moll: Am9 5x5557, Dm6 x5343x, E7♭9 x7676x. Sexta na {iv} a malá nona na dominantě (F nad E) jsou ten cikánský zvuk.',
      open: 'V A moll Am x02210, Dm xx0231 a E7♭9 020101 – od obyčejného E7 (020100) se liší jen prstem na 1. struně (F místo E).',
      shell: 'Dominanta má v shell sazbě čtyři tóny 1-3-7-♭9 (v A moll x7676x). Bez kořene by to byl zmenšený septakord – proto zmenšená stupnice přes {V7b9} v Sólování.',
    },
    rhythmNotes: {
      freddieGreen: 'Swing po čtvrtích má nejblíž k „la pompe“ cikánského jazzu: krátké údery, 2 a 4 silněji, levá ruka po úderu povolí.',
    },
  },

  minorCircle: {
    feel: 'Kvintový kruh v moll: každý další akord je o kvartu výš ({i} → {iv} → {bVII} → {bIII} → {bVI} → {iiø} → {V7} → {i}). Basa jde po kvartách, nahoře se hlasy skoro nehýbou – ideální na vedení hlasů.',
    sazby: ['open', 'colors', 'shell', 'drop2', 'bassChord', 'triads', 'barre'],
    rhythms: ['arpeggio', 'folkPop', 'bossa', 'freddieGreen', 'quarters', 'travis'],
    notes: {
      open: 'V A moll je otevřené všechno kromě Bm7♭5: Am x02210, Dm xx0231, G 320003, C x32010, F 133211, Bm7♭5 x2323x, E7 020100. Bm7♭5 → E7 je mollová obdoba ii–V.',
      colors: 'Kruh v barvách (A moll): Am9 5x5557, Dm6 x5343x, G6/9 3222xx, C6/9 x32233, F6/9 xx3233, Bm7♭5 7x776x, E7♭9 x7676x. Durové akordy 6/9, mollové 9 nebo 6, dominanta malou nonu.',
    },
    try: {
      bassChord: ['Poslouchej basu: po kvartách nahoru, před každou změnou přechodový tón. Pak zkus basu vést dolů po kvintách – jsou to tytéž tóny.'],
    },
  },

  waltzMinor: {
    feel: 'Mollový valčík {i}–{iv}–{V7}: um–pa–pa, každý akord dva takty. Smutný a houpavý – jedničku nech zaznít, pa–pa hraj lehce.',
    sazby: ['bassChord', 'open', 'colors', 'triads', 'barre', 'shell'],
    rhythms: ['waltzAlt', 'waltz', 'arpeggio34'],
    notes: {
      bassChord: 'V A moll Am x02210 s basem A–E, Dm xx0231 s basem D–A, E7 020100 s basem E–H. Před změnou zahraje basa na poslední osminu přechod: z Dm do E7 F, z E7 do Am G♯ (vodicí tón).',
      colors: 'Am9 5x5557, Dm6 x5343x, E7♭9 x7676x (A moll) – ve valčíku to zní jako starý salonní orchestr.',
    },
    rhythmNotes: {
      arpeggio34: 'p-i-m-a-m-i: jedna vlnka na takt. Nad Dm6 a E7♭9 vyzní barva nahoře.',
    },
  },

  secDominants: {
    feel: 'Lidovka s vedlejší dominantou: místo {vi} zazní {VI7} – durový akord se septimou, který táhne do {ii}. Jeho tercie {VI7.3} je mimo tóninu a stoupne o půltón na {ii.r}.',
    sazby: ['open', 'bassChord', 'colors', 'shell', 'triads', 'barre', 'drop2'],
    rhythms: ['folkPop', 'tramp', 'trampCU', 'quarters', 'travis', 'arpeggio'],
    notes: {
      open: 'V C samé otevřené hmaty: C x32010, A7 x02020, Dm xx0231, G7 320001.',
      bassChord: 'Basové přechody (v C): z C do A7 H, z A7 do Dm C♯ (tercie A7 – vodicí tón do D), z Dm do G7 A, z G7 do C H.',
      colors: 'C6/9 x32233, A9 5454xx, Dm6 x5343x, G13 3x345x (v C).',
    },
  },

  bluesQuick: {
    feel: 'Blues s rychlou čtyřkou: už ve 2. taktu přijde {IV7} a vrátí se na {I7}. Pravá ruka drží stejný vzor, levá jen přeskočí o strunu.',
    sazby: ['boogie', 'shell', 'open', 'barre', 'colors'],
    rhythms: ['shuffle', 'rockPalm', 'eighths', 'freddieGreen'],
    notes: {
      boogie: 'V A: A5 x02xxx (horní tón po dobách 2-4-5-4 na 4. struně), D5 xx02xx, E5 02xxxx – ruka zůstává u nultého pražce.',
      open: 'V A je celé blues otevřené: A7 x02020, D7 xx0212, E7 020100.',
    },
    rhythmNotes: {
      shuffle: 'Dlouhá–krátká v triolách. S boogie sazbou je to Chuck Berry / Status Quo.',
    },
  },

  minorBlues: {
    feel: 'Mollové blues: {i7} a {iv7} jsou mollové, v 9. taktu {bVI7} sjede o půltón na dominantu {V7}. Pomalé a temné – hraj málo a nech to dýchat.',
    sazby: ['shell', 'colors', 'open', 'drop2', 'barre', 'boogie'],
    rhythms: ['shuffle', 'freddieGreen', 'quarters', 'arpeggio'],
    notes: {
      shell: 'V A moll Am7 5x55xx, Dm7 x535xx, F7 x878xx, E7 x767xx. Z F7 do E7 se celý hmat posune o pražec dolů – nejsilnější místo kolečka.',
      colors: 'Am9 5x5557, Dm9 x5355x, F9 x87888, E7♭9 x7676x (A moll). Malá nona E7♭9 je tón F – kořen předchozího F9.',
    },
  },

  pop1564: {
    feel: 'Nejčastější popové kolečko {I}–{V}–{vi}–{IV}: akord na takt, pohyb drží pravá ruka – osminy nebo D.DU.UDU.',
    sazby: ['open', 'barre', 'triads', 'colors', 'bassChord', 'shell'],
    rhythms: ['folkPop', 'eighths', 'quarters', 'rockPalm', 'arpeggio', 'travis'],
    notes: {
      open: 'V C: C x32010, G 320003, Am x02210, F 133211 (nebo malé xx3211). V G je otevřené všechno: G, D, Em, C.',
      barre: 'V C: C x35553 (A-tvar), G 355433, Am 577555, F 133211 (E-tvary) – ruka mezi 1. a 7. pražcem.',
      triads: 'Druhá kytara na strunách 1–3 (v C): C xxx988, G xxx787, Am x-x-x-9-10-8, F x-x-x-10-10-8 – celé kolečko mezi 7. a 10. pražcem.',
    },
  },

  fifties: {
    feel: 'Padesátky {I}–{vi}–{IV}–{V}: doo-wop a rokenrolové balady. Arpeggio nebo pomalé osminy, kytara měkce pod zpěvem.',
    sazby: ['open', 'colors', 'triads', 'bassChord', 'barre', 'shell'],
    rhythms: ['arpeggio', 'folkPop', 'quarters', 'eighths', 'travis'],
    notes: {
      open: 'V C: C x32010, Am x02210, F 133211, G 320003. Z C do Am se hýbe jen prsteneček.',
      colors: 'C6/9 x32233, Am9 5x5557, F6/9 xx3233, G13 3x345x (v C) – sexta a nona udělají z doo-wopu jazzovou baladu.',
    },
  },

  minor145: {
    feel: 'Mollové {i}–{iv}–{i}–{v}: mollová {v} nemá vodicí tón, takže netáhne domů – kolečko zní staře, modálně, skoro středověce.',
    sazby: ['open', 'barre', 'boogie', 'bassChord', 'triads', 'colors', 'shell'],
    rhythms: ['eighths', 'rockPalm', 'folkPop', 'tramp', 'quarters'],
    notes: {
      open: 'V A moll Am x02210, Dm xx0231, Em 022000 – tři nejsnazší hmaty na kytaře.',
      colors: 'Am9 5x5557, Dm6 x5343x, Em7 x7978x (A moll). H v Dm6 je dórská sexta – drsná moll se tím trochu rozjasní.',
    },
  },

  harmonicMinor: {
    feel: 'Mollová kadence s dominantou {V7}: tercie {V7.3} (vodicí tón) stoupne o půltón na {i.r}. Krátké kolečko, akord na takt.',
    sazby: ['open', 'colors', 'bassChord', 'shell', 'triads', 'barre', 'drop2'],
    rhythms: ['arpeggio', 'folkPop', 'tramp', 'quarters', 'travis', 'bossa'],
    notes: {
      colors: 'Am9 5x5557, Dm6 x5343x, E7♭9 x7676x (A moll). Malá nona E7♭9 je tón F – tercie předchozího Dm.',
      bassChord: 'Před {i} zahraje basa na poslední osminu {V7.3} – vodicí tón v basu (v A moll z E7 do Am G♯).',
    },
  },

  andalusian: {
    feel: 'Andaluská kadence {i}–{bVII}–{bVI}–{V7}: basa klesá po krocích {i.r} → {bVII.r} → {bVI.r} → {V7.r}, flamenco. Největší napětí je na {V7} – tam úhoz zesil.',
    sazby: ['open', 'barre', 'bassChord', 'colors', 'triads', 'shell'],
    rhythms: ['folkPop', 'eighths', 'quarters', 'arpeggio', 'rockPalm', 'tramp'],
    notes: {
      open: 'V A moll Am x02210, G 320003, F 133211, E7 020100. Přidej k E7 F na 1. struně (020101) a zazní španělská malá nona.',
      colors: 'Am9 5x5557, G6/9 xx5455, F6/9 x87788, E7♭9 x7676x (A moll). {bVII} a {bVI} dostanou 6/9, ne septimu – jinak by zněly jako cizí dominanty.',
    },
  },

  mixoVamp: {
    feel: 'Mixolydický vamp {I}–{bVII}–{IV}: rock a folk-rock (Sweet Home Alabama, Gloria). Žádná dominanta – {bVII} je z mixolydické stupnice a vrací se na {I} krokem.',
    sazby: ['open', 'barre', 'boogie', 'triads', 'colors', 'bassChord', 'shell'],
    rhythms: ['eighths', 'rockPalm', 'folkPop', 'tramp', 'shuffle'],
    notes: {
      open: 'V A: A x02220, G 320003, D xx0232; v D: D, C, G – všechno otevřené.',
      triads: 'Na strunách 1–3 (v A): A xxx655, G xxx787, D xxx775 – rockový riff z trojzvuků.',
      boogie: 'V A leží boogie na 5. pražci (A5 57xxxx, G5 xx57xx, D5 x57xxx) a ♭7 je pořádná natahovačka; v E (E5 02xxxx, D5 xx02xx, A5 x02xxx) je to u nultého pražce pohodlnější.',
    },
  },

  dorianVamp: {
    feel: 'Dórský vamp {i7}–{IV7}: mollový septakord a durový se septimou (Oye Como Va). Harmonie stojí, všechno je v rytmu – funk, latina.',
    sazby: ['triads', 'shell', 'drop2', 'colors', 'barre', 'open'],
    rhythms: ['funk16', 'reggae', 'eighths', 'bossa', 'freddieGreen'],
    notes: {
      triads: 'Nahoře (v A): Am7 xxx555 (C–E–A) a D7 xxx575 (C–F♯–A) – hýbe se jen jeden prst. Tercie {IV7.3} je dórská sexta {i7}.',
      colors: 'Am9 5x5557 a D13 x5x577 (v A) – D13 má nahoře F♯ a H, sextu a nonu Am.',
    },
    rhythmNotes: {
      funk16: 'Šestnáctiny, většina úderů tlumená, zní jen přízvuky. Hmat malý nahoře.',
    },
  },
};
