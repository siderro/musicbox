// Slovník výukových frází (navrhla rada kytarových lektorů).
//
// Fráze = dvoutaktová věta: tělo (motiv) skončí přesně na taktové čáře, za '|' je CÍL na „jedna“
// dalšího taktu (tón akordu, který tehdy zní), pak držený tón a nádech.
//
// Zápis not: TÓN[oktáva][technika]:DÉLKA, oddělené mezerou; '|' = taktová čára před cílem.
//   TÓN  1 2 b3 3 4 b5 5 b6 6 b7 7   stupeň od kořene stupnice (vybraného čipu)
//        cN   (N = 1 3 5 7 9 6)      tón akordu, který právě zní
//        nN                          tón akordu na „jedna“ (cílového)
//        L                           cíl: první vhodný z `target` (stupně cílového akordu)
//        g                           vodicí tón (3/7) tohoto akordu nejblíž cíli
//        m                           společný tón tohoto a dalšího akordu
//        +s / -s / -s2               o krok (dva) stupnice nad/pod následujícím tónem
//        +c / -c                     o půltón nad/pod následujícím tónem
//        -                           pauza
//   oktáva  '  nad předchozím tónem   ,  pod předchozím (jinak nejbližší)
//   technika ~ vibrato · h hammer · p pull-off · / \ slide (k dalšímu tónu)
//            *STUPEŇ bend na stupeň · r povolení bendu · q curl (čtvrttón, jen b3 a b7)
//   DÉLKA v dobách, násobky 0,5 (ve swingu/shuffle se osminy samy zhoupnou)
//
//   anchor  'scale' = stupně jsou od kořene stupnice, 'chord' = jen tóny akordu (cN/nN)
//   target  priorita stupňů cílového akordu, např. [3, 1, 5]
//   vocab   stupnice, pro které je fráze „rodná“
//   fits    rodiny akordu, přes které se tělo hraje: maj min dom
//   style   blues rock folk country jazz pop funk romantic
//   call    vhodná pro otázku–odpověď (krátká, jasná)
//   role    'phrase' | 'connector' (spojka na posledních dobách před změnou akordu)

const m = (name, notes, target, vocab, fits, style, level, why, extra = {}) =>
  ({ name, notes, target, vocab, fits, style, level, why, anchor: vocab.length ? 'scale' : 'chord', role: 'phrase', ...extra });
const ALL = ['maj', 'min', 'dom'];

export const MOTIFS = {
  // ---------- mollová pentatonika ----------
  mp_bendAnswer: m('Bend a odpověď', 'b3:.5 4:.5 4*5:1 4r:.5 b3:.5 | L~:2', [1, 5, 7], ['minorPentatonic', 'blues'], ['dom', 'min'], ['blues', 'rock'], 1,
    'Z ♭3 nahoru, bend 4→5 je vrchol (otázka), sestup přes ♭3 dopadne na kořen = odpověď.', { call: true }),
  mp_sing: m('Zpívaný sestup', "1':1.5~ b7:.5 5:1 | L~:2", [3, 1, 5], ['minorPentatonic', 'blues'], ['dom', 'min'], ['blues', 'folk'], 1,
    'Kořen nahoře zazpívej s vibratem, pomalu dolů, dopad na tón akordu.', { call: true }),
  mp_repeat: m('Opakovaný tón', '5:.5 5:.5 b7:.5 5:1 b3:.5 | L:2', [1, 3, 5], ['minorPentatonic', 'blues'], ['dom', 'min'], ['blues', 'rock', 'funk'], 1,
    'Opakování = rytmus místo stupnice; ♭3 na konci je nájezd na kořen.', { call: true }),
  mp_slide: m('Slide do kvinty', '4/:.5 5:1 b7:.5 5:.5 b3:.5 | L~:2', [1, 5], ['minorPentatonic', 'blues'], ['dom', 'min'], ['rock', 'blues'], 1,
    'Sklouzni ze 4 na pevnou 5, vrchol na ♭7, dolů na kořen.', { call: true }),
  mp_cascade: m('Pull-off kaskáda', "b3':.5p 1':.5 b7:.5p 5:.5 4:.5p b3:.5 | L~:2", [1, 5], ['minorPentatonic', 'blues'], ['dom', 'min'], ['rock', 'blues'], 2,
    'Tři struny, tři pull-offy dolů boxem: z vysoké ♭3 až do kořene.'),

  // ---------- bluesová ----------
  bl_descent: m('Sestup přes ♭5', '5:.5 b5:.5 4:.5 b3:.5 | L~:2', [1, 5], ['blues'], ['dom', 'min'], ['blues'], 1,
    'Z kvinty chromaticky přes blue note ♭5 – ♭5 jen projdi, nikdy na ní nekonči.', { call: true }),
  bl_riff: m('Riff s ♭5 nahoru', '1:.5 b3:.5 1:.5 b3:.5 4:.5 b5:.5 | L:1 -:1', [5, 1, 7], ['blues'], ['dom', 'min'], ['blues', 'rock'], 1,
    'Krátký opakovaný riff; ♭5 se na „jedna“ rozvede o půltón.', { call: true }),
  bl_curl: m('♭3 s curlem', 'b3q:.5 1:.5 b3q:.5 1:.5 b7,:.5 1:.5 | L:2', [5, 1], ['blues', 'minorPentatonic'], ['dom'], ['blues'], 1,
    'Malá tercie lehce dotažená k velké – bluesové tření nad durovým akordem.', { call: true }),
  bl_highBend: m('Opakovaný bend', "4*5:.5 1':.5 4*5:.5 1':.5 b7:.5 5:.5 | L~:2", [3, 1], ['blues', 'minorPentatonic'], ['dom', 'min'], ['blues', 'rock'], 2,
    'Bend proti kořeni nad ním: stejná výška dvakrát, napětí roste, uvolní se sestupem.'),
  bl_slowCry: m('Pomalý pláč', '5:1~ b5:.5 4:.5 b3*4:1 | L~:2', [1, 3], ['blues'], ['min', 'dom'], ['blues'], 2,
    'Dlouhá kvinta, průchod ♭5 a bend ♭3→4, který se rozpláče do kořene.'),

  // ---------- durová pentatonika ----------
  Mp_sixth: m('Sexta, sladký nádech', '5:.5 6:1~ 5:.5 3:1 | L~:2', [1, 3, 5], ['majorPentatonic', 'majorBlues'], ['maj', 'dom'], ['folk', 'country', 'pop'], 1,
    'Sexta je sladká lidová barva; přes kvintu dolů na tercii a domů.', { call: true }),
  Mp_bend23: m('Country bend 2→3', '2*3:1 1:.5 6,:.5 1:1 | L~:2', [3, 5], ['majorPentatonic', 'majorBlues'], ['maj', 'dom'], ['country', 'blues'], 2,
    'Bend z nony na tercii zní jako steel kytara; kořen, sexta pod ním, dopad na tercii.'),
  Mp_question: m('Otázka s pauzou', '3:.5 5:1 -:.5 3:.5 2:.5 | L:2', [1, 3], ['majorPentatonic'], ['maj'], ['folk', 'pop'], 1,
    'Krátká otázka, nádech v pauze; 2 je krok k cíli.', { call: true }),
  Mp_slide3: m('Slide na tercii', '2/:.5 3:1 5:.5 6:.5 5:.5 | L~:2', [3, 1], ['majorPentatonic', 'majorBlues'], ['maj', 'dom'], ['country', 'pop'], 1,
    'Sklouzni z 2 na 3 – nejdurovější tón; vrchol na 6, dopad zpět na tercii.', { call: true }),
  Mp_leapHome: m('Skok na sextu, kroky domů', "1:.5 6':1 5:.5 3:.5 2:.5 | L~:2", [1, 3], ['majorPentatonic'], ['maj'], ['folk', 'pop'], 1,
    'Skok nahoru na 6 je vrchol, pak kroky dolů – skok se vyplní, jako v lidové písni.', { call: true }),

  // ---------- durová bluesová ----------
  mb_hammer: m('♭3→3 hammer', '1:.5 b3h:.5 3:1 1:.5 6,:.5 | L~:2', [1, 3, 5], ['majorBlues'], ['dom', 'maj'], ['blues', 'country'], 1,
    'Hammer z ♭3 na 3: mollová tercie se „opraví“ na durovou – B.B. King i country.', { call: true }),
  mb_slide6: m('Slide do tercie a sexta', 'b3/:.5 3:.5 5:.5 6:1 5:.5 | L:2', [3, 1], ['majorBlues'], ['dom', 'maj'], ['country'], 1,
    'Slide do tercie, vrchol na sextě, dopad zpět na tercii.', { call: true }),
  mb_walk: m('Chromatický výstup 2–♭3–3', '2:.5 b3:.5 3:.5 5:.5 6:.5 5:.5 | L~:2', [3, 1], ['majorBlues'], ['dom', 'maj'], ['country', 'jazz'], 2,
    '2 → ♭3 → 3 chromaticky jako walk-up, vrchol 6, rozvod na tercii.'),
  mb_sixHome: m('Ze sexty domů', '6:.5 5:.5 b3h:.5 3:.5 | L~:2', [1, 5], ['majorBlues'], ['dom', 'maj'], ['country', 'blues'], 1,
    'Ze sexty přes kvintu na durovou tercii a krokem domů.', { call: true }),
  mb_answer: m('Durová odpověď', '5:1 b3h:.5 3:.5 2:.5 1:.5 | L:2', [3, 5], ['majorBlues'], ['dom', 'maj'], ['blues'], 1,
    'Po mollové otázce odpověz durovou tercií – světlo po stínu.', { call: true }),

  // ---------- durová ----------
  ma_neighbor: m('Obal kořene', '3:1 2:.5 1:.5 7,:.5 2:.5 | L~:2', [1, 3], ['major'], ['maj'], ['folk', 'pop'], 1,
    'Kořen obkroužíš: 7 zdola a 2 shora – ucho čeká, a pak „jedna“ sedne.', { call: true }),
  ma_sigh: m('Vzdech 4→3', '5:1 6:.5 5:.5 4:1 | L~:2', [3], ['major'], ['maj', 'dom'], ['folk', 'pop'], 1,
    'Kvarta visí jako otázka a spadne o půltón na tercii – nejstarší trik melodie.', { call: true }),
  ma_octave: m('Oktávový skok a kroky dolů', "1:.5 1':1 7:.5 6:.5 5:.5 | L~:2", [3, 5], ['major'], ['maj'], ['folk', 'pop'], 1,
    'Skok o oktávu je vrchol hned na začátku; zbytek fráze ho vyplní kroky dolů.', { call: true }),
  ma_sequence: m('Sekvence o stupeň níž', '5:.5 4:.5 3:1 4:.5 3:.5 2:1 | L~:2', [1, 3], ['major'], ['maj'], ['folk', 'pop', 'jazz'], 2,
    'Stejný motiv dvakrát, podruhé o stupeň níž – tak fráze „vede někam“.'),
  ma_polka: m('Polkový skok', "5:.5 3:.5 5:.5 1':.5 | L:1 -:1", [3, 5], ['major'], ['maj', 'dom'], ['folk'], 1,
    'Krátké, skákavé, z tónů akordu – na „jedna“ dopad na tercii.', { call: true }),
  ma_leading: m('Vodicí tón 7→1', '4:.5 2:.5 7,:1 | L~:2', [1, 3], ['major', 'harmonicMinor'], ['dom'], ['folk', 'jazz'], 1,
    'Přes V7 hraj 4–2–7 (tóny V7); 7 se na „jedna“ rozvede nahoru do kořene.', { call: true }),

  // ---------- přirozená moll ----------
  mi_lament: m('Vzdech ♭6→5', "b3':1 2':.5 1':.5 b6:1 | L~:2", [5, 1], ['minor', 'harmonicMinor'], ['min'], ['folk', 'romantic'], 1,
    '♭6 je „slza“ mollu: zazní na konci taktu a spadne o půltón na kvintu.', { call: true }),
  mi_tramp: m('Trampská odpověď', '5:.5 b6:.5 5:.5 4:.5 b3:1 | L~:2', [1, 3], ['minor', 'harmonicMinor'], ['min'], ['folk'], 1,
    'Obal kvinty (♭6 nad ní) a sestup na tercii – typický trampský refrén.', { call: true }),
  mi_nine: m('Stoupání k noně', "1:.5 b3:.5 5:.5 b7:.5 2':1~ | L:2", [3, 1], ['minor', 'dorian'], ['min'], ['folk', 'romantic'], 2,
    'Akordem nahoru až k noně – vrchol s vibratem, pak krok na tercii.'),
  mi_seq: m('Mollová sekvence', "b3':.5 2':.5 1':1 2':.5 1':.5 b7:1 | L~:2", [5, 3, 1], ['minor'], ['min', 'maj'], ['folk', 'romantic'], 2,
    'Motiv 3-2-1 a hned o stupeň níž 2-1-7 – sekvence sama táhne kruhem dolů.'),
  mi_hold: m('Držený tón a pád', '5:2~ 4:.5 b3:.5 | L~:2', [1], ['minor', 'minorPentatonic', 'dorian'], ['min'], ['folk', 'rock', 'blues'], 1,
    'Méně je víc: jeden dlouhý tón s vibratem, dva kroky dolů a kořen.', { call: true }),

  // ---------- dórská ----------
  do_six: m('Dórská sexta', '1:.5 b3:.5 4:.5 6:1 5:.5 | L~:2', [3, 1], ['dorian'], ['min'], ['funk', 'rock', 'jazz'], 1,
    'Velká 6 je podpis dórské – nech ji vyznít jako vrchol, pak dolů přes 5.', { call: true }),
  do_ivThird: m('Sexta = tercie IV7', '6:1.5~ 5:.5 4:.5 b3:.5 | L~:2', [1, 3], ['dorian'], ['dom', 'min'], ['funk'], 1,
    'Přes IV7 je velká 6 jeho tercie – drž ji, to je ten funky tón.'),
  do_santana: m('Sestup od nony', "2':1~ 1':.5 6:.5 5:.5 4:.5 | L~:2", [3, 1], ['dorian'], ['min'], ['rock', 'jazz'], 2,
    'Začni zpěvnou nonou s vibratem, sestup přes 6 a 5 na tercii.'),
  do_rep: m('Funky opakování', '6:.5 6:.5 5:.5 6:.5 -:.5 4:.5 | L:1 -:1', [3, 7], ['dorian'], ['min', 'dom'], ['funk'], 1,
    'Krátké staccato na 6 – rytmus je důležitější než tóny; dopad krátce, pak ticho.', { call: true }),
  do_box: m('Mollový box + velká 6', 'b3:.5 4:.5 5:.5 6:.5 b7:1 | L~:2', [1, 5], ['dorian'], ['min'], ['rock', 'funk'], 1,
    'Pentatonika doplněná o 6: stoupání na ♭7 a krok domů.'),

  // ---------- mixolydická ----------
  mx_b7sigh: m('♭7 → 6 → 5', '3:.5 5:.5 b7:1~ 6:.5 5:.5 | L~:2', [3, 1], ['mixolydian'], ['dom', 'maj'], ['blues', 'rock', 'country'], 1,
    '♭7 je barva dominanty: vrchol s vibratem, krokem přes 6 dolů.', { call: true }),
  mx_bbBox: m('B.B. bend 9→3', "1':.5 2'*3:1 1':.5 6:.5 5:.5 | L~:2", [3, 1], ['mixolydian'], ['dom'], ['blues'], 2,
    'Bend z nony na tercii, kořen a sexta – B.B. box kolem kořene na struně H.'),
  mx_arp: m('Septakord s ozdobou', '1:.5 3:.5 5:.5 b7:.5 6:.5 5:.5 | L~:2', [3, 1], ['mixolydian'], ['dom'], ['jazz', 'country'], 2,
    'Tóny 7 akordu nahoru, ♭7–6 jako ozdoba, dopad na tercii.'),
  mx_sus: m('Kvarta visí', '5:.5 4:1~ 3:1 2:.5 | L~:2', [1, 3], ['mixolydian', 'major'], ['dom', 'maj'], ['rock', 'folk'], 1,
    'Kvarta drží napětí (sus), uvolní se do tercie a krokem domů.', { call: true }),
  mx_rock: m('Zvuk ♭VII', "b7:.5 1':.5 b7:.5 5:.5 4:1 | L~:2", [3, 1], ['mixolydian'], ['dom', 'maj'], ['rock'], 1,
    'Obal ♭7 kořenem = zvuk akordu ♭VII; kvarta pak padá na tercii.', { call: true }),

  // ---------- harmonická moll (♭6→7 je zvětšená sekunda prsty, nikdy bend) ----------
  hm_leading: m('Vodicí tón 7→1', '5:.5 b6:.5 7:1 | L~:2', [1], ['harmonicMinor'], ['dom'], ['folk', 'romantic'], 1,
    'Zvýšená 7 je tercie V7 – na „jedna“ se rozvede o půltón nahoru do kořene.', { call: true }),
  hm_aug2: m('Zvětšená sekunda', "1':.5 7:.5 b6:1 7:.5 b6:.5 | L~:2", [5, 1], ['harmonicMinor'], ['dom', 'min'], ['folk', 'romantic'], 2,
    'Skok ♭6–7 (tři půltóny) zní orientálně, klezmerově; ♭6 nakonec padne na 5.'),
  hm_dim: m('Zmenšený akord nad V7', '7,:.5 2:.5 4:.5 b6:.5 | L~:2', [5, 1], ['harmonicMinor'], ['dom'], ['romantic', 'jazz'], 2,
    '7–2–4–♭6 = zmenšený septakord, tedy V7 s ♭9; ♭6 padá na kvintu i.', { call: true }),
  hm_enclose: m('Neoklasický obal kořene', 'b3:.5 2:.5 7,:.5 2:.5 | L~:2', [1], ['harmonicMinor'], ['min', 'dom'], ['romantic'], 2,
    'Kořen obkroužen shora (2) a zdola (zvýšená 7) – Bach i Malmsteen.', { call: true }),
  hm_andalus: m('Frygická dominanta', "1':.5 7:.5 b6:.5 5:1 4:.5 | L~:2", [3, 1], ['harmonicMinor'], ['dom'], ['romantic'], 2,
    'Přes V7: 1–7–♭6–5 je flamenco; 4 spadne na mollovou tercii i.'),

  // ---------- arpeggio od tercie (jen tóny akordu) ----------
  ot_arch: m('Oblouk od tercie', 'c3:1 c5:.5 c7:1~ c5:.5 | L~:2', [3, 5], [], ALL, ['folk', 'romantic', 'jazz'], 1,
    'Tercie = barva akordu, vrchol na 7, dopad na tercii dalšího akordu.', { call: true, idea: true }),
  ot_descend: m('Sestup od septimy', 'c7:1.5~ c5:.5 c3:1 | L~:2', [3, 7], [], ALL, ['folk', 'jazz'], 1,
    'Arpeggio od tercie pozpátku: 7 drž, sestup na 3; k dalšímu akordu je odtud jen krok.', { call: true, idea: true }),
  ot_enclose: m('Obal tercie', 'c5:.5 +s:.5 -c:.5 c3:1.5 | L~:2', [3, 5], [], ALL, ['jazz', 'folk'], 2,
    'Tercii obkroužíš: krok shora ze stupnice, půltón zdola – jazzový obal, ale zní i lidově.', { idea: true }),
  ot_waltz: m('Valčík od tercie', 'c3:1 c5:1 c7:1 | L~:2', [3], [], ALL, ['folk'], 1,
    'Ve 3/4 jeden tón na dobu: 3–5–7 a na „raz“ tercie dalšího akordu.', { call: true, idea: true }),
  ot_nine: m('Od tercie k noně', 'c3:.5 c5:.5 c7:.5 c9:1~ c7:.5 | L~:2', [3, 5], [], ['maj', 'min'], ['romantic', 'jazz'], 2,
    '3–5–7–9 je arpeggio od tercie prodloužené o nonu: zní maj9, aniž bys hrál kořen.', { idea: true }),
  ot_thirds: m('Linka tercií', 'c3:2~ c5:.5 c3:.5 | L~:2', [3], [], ALL, ['folk'], 1,
    'Melodie z tercií akordů: v C–Am–F–G7 zazpívá E–C–A–H → E.', { call: true, idea: true }),

  // ---------- barvy 6 a 9 ----------
  c_hold6: m('Držená sexta', 'c5:.5 c6:2~ c5:.5 | L~:2', [3, 1], [], ['maj', 'min'], ['folk', 'romantic'], 1,
    'Sexta nad akordem = lidová romantika; drž ji s vibratem, pak se vrať na kvintu.', { call: true, color: true }),
  c_appog9: m('Nona na „raz“', 'c1:.5 c3:.5 c5:1 | n9:1~ n1:1~', [1], [], ['maj', 'min'], ['romantic'], 2,
    'Na „jedna“ nona místo kořene – zatoužíš a o dobu později se rozvedeš krokem dolů.', { color: true, colorLand: true }),
  c_sixNine: m('Vzdech 9–1–6–5', 'c9:.5 c1:.5 c6,:1 c5:1 | L:2', [3, 1], [], ['maj'], ['folk', 'country'], 2,
    '9 a 6 jako ozdoby kolem tónů akordu – lidovka se tak „zpívá sama“.', { color: true }),
  c_m6: m('Mollová sexta', 'c1:.5 c3:.5 c6:1.5~ c5:.5 | L~:2', [3, 5], [], ['min'], ['romantic', 'folk'], 2,
    'Sexta nad mollovým akordem (♭6 jako vzdech, s „6 vždy velká“ dórská barva) a pád na 5.', { color: true }),

  // ---------- spojky přes změnu akordu ----------
  cn_guide: m('Vodicí tón', 'g:1 | L:1', [3, 1], [], ALL, [], 1,
    'Tercie nebo septima tohoto akordu se posune o krok na tercii/septimu dalšího.', { role: 'connector', change: 'guide' }),
  cn_chrom: m('Půltón zdola', 'c5:.5 -c:.5 | L:1', [3], [], ALL, [], 2,
    'Půltón pod cílem na poslední osmině – ucho slyší, kam míříš.', { role: 'connector', change: 'approach' }),
  cn_enclose: m('Obal cíle', '+s:.5 -c:.5 | L:1', [3, 1], [], ALL, [], 3,
    'Krok shora, půltón zdola, cíl na „jedna“ – jazzový obal.', { role: 'connector', change: 'approach' }),
  cn_walkUp: m('Dva kroky nahoru', '-s2:.5 -s:.5 | L:1', [1, 3], [], ALL, [], 1,
    'Nájezd jako basa v trampské písni: dva tóny stupnice zdola do cíle.', { role: 'connector', change: 'root' }),
  cn_hold: m('Společný tón', 'm:1 | L:1~', [3, 1, 5], [], ALL, [], 1,
    'Tón, který mají oba akordy, drž přes změnu – harmonie se pod ním přebarví.', { role: 'connector', change: 'common' }),
};

// Styl podle grooveu (dá se přebít polem `style` u kolečka).
export const GROOVE_STYLE = {
  shuffle: 'blues', slowBlues: 'blues', rock8: 'rock', rockHalf: 'rock', folk44: 'folk', waltz: 'folk',
  polka: 'folk', ballad: 'folk', countryTrain: 'country', jazzSwing: 'jazz', pop: 'pop', funk16: 'funk',
};
