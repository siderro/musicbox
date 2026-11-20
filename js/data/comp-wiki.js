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
      bassChord: 'Kořen na 1, kvinta na 3: nad {I} {I.r}–{V.r}, nad {vi} {vi.r}–{iii.r}. Na poslední dobu taktu {V7} zahraj místo kvinty {V7.3} (tón pod {I.r}) – basa sama dojde domů.',
      colors: 'Místo {I} zahraj {I}6/9, místo {vi} m9, {V7} jako 13. V C: C6/9 x32233, Am9 5x5557, F6/9 xx3233, G13 3x345x. Pořád stejné kolečko, jen „měkčí“ – sexta a nona jsou tvoje oblíbené barvy.',
      triads: 'Na strunách 1–3 se trojzvuky skoro nehýbou: v C C (3-5-1) xxx988 → Am (5-1-3) x-x-x-9-10-8 → F x-x-x-10-10-8 → G7 xxx787, horní tón tvoří melodii. Hraj to jako druhá kytara k někomu, kdo drží otevřené akordy.',
      shell: 'Kvintakordy dostanou sextu: {I}6, {IV}6, mollový {vi} oktávu. Horní hlasy (3 a 7, u {I}6 a {IV}6 3 a 6) jsou přesně linka vodicích tónů z přístupu „Linka vodicích tónů“ v Sólování.',
    },
    rhythmNotes: {
      folkPop: 'D.DU.UDU je pro tohle kolečko „ten“ úhoz. Přehmat dělej na posledním ↑ – prázdné struny tam klidně zazní.',
      travis: 'Palec střídá kořen a basovou strunu o dvě níž, prsty hrají melodii z horních strun. Na {V7} zní nejhezčí ♭7 nahoře.',
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
      colors: 'Nad {i} m9, nad {iv} m6 (romantická klasika), nad {V7} 7♭9. V A moll: Am9 5x5557, Dm6 x5343x, E7♭9 x7676x. Malá nona na dominantě = cikánský zvuk.',
      shell: 'Tři tóny: {i} jako 1-8-3, {iv}6 a {V7} 1-3-7. Mezi {iv}6 a {V7} jde horní hlas o půltón – to je linka vodicích tónů z přístupu „Linka vodicích tónů“ v Sólování, jen ji teď držíš v hmatu.',
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
      colors: 'Tady barvy zazáří nejvíc: {i}m9, {bVI}6/9, {bIII}6/9, {bVII}13. V A moll: Am9 5x5557, F6/9 xx3233, C6/9 x32233, G13 3x345x. Nona nad {i} je zároveň tercie {bVII} – zní, jako by melodie pokračovala dál.',
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
};
