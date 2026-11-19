// Knihovna stupnic. Intervaly od kořene: '1', 'b3', '4', '#4', 'b7' …
//
//   nps           – kolik tónů na strunu v polohách (2 = boxy pentatoniky, 3 = 3NPS)
//   positionsFrom – polohy převezme z jiné stupnice a doplní chybějící tóny (blues z pentatoniky)
//   blue          – intervaly, které se na hmatníku zvýrazní jako „blue note“
//   use           – kdy ji použít (zobrazí se v katalogu ve wiki)

export const SCALES = {
  minorPentatonic: {
    name: 'Mollová pentatonika',
    intervals: ['1', 'b3', '4', '5', 'b7'],
    nps: 2,
    use: 'Základ blues a rocku; v dur od 3., 6. nebo 2. stupně dává barvy 9, 6 a 3 (Em přes C).',
  },
  majorPentatonic: {
    name: 'Durová pentatonika',
    intervals: ['1', '2', '3', '5', '6'],
    nps: 2,
    use: 'Sladká, lidová, country. Přes durový akord a přes I7 v blues.',
  },
  blues: {
    name: 'Bluesová stupnice',
    intervals: ['1', 'b3', '4', 'b5', '5', 'b7'],
    positionsFrom: 'minorPentatonic',
    blue: ['b5'],
    use: 'Mollová pentatonika s ♭5 – blue note jen projdi, nekonči na ní.',
  },
  majorBlues: {
    name: 'Durová bluesová',
    intervals: ['1', '2', 'b3', '3', '5', '6'],
    positionsFrom: 'majorPentatonic',
    blue: ['b3'],
    use: 'Durová pentatonika s ♭3, která se sveze do velké tercie. B.B. King, country.',
  },
  major: {
    name: 'Durová (jónská)',
    intervals: ['1', '2', '3', '4', '5', '6', '7'],
    nps: 3,
    use: 'Celá durová tónina. Přes tóniku se nezastavuj na 4.',
  },
  minor: {
    name: 'Přirozená moll (aiolská)',
    intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    nps: 3,
    use: 'Přirozená moll – smutná, lidová. Přes i a iv.',
  },
  dorian: {
    name: 'Dórská',
    intervals: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    nps: 3,
    use: 'Moll s velkou sextou: světlejší, „folková“ moll. Přes m7 akord ve vampu i–IV.',
  },
  mixolydian: {
    name: 'Mixolydická',
    intervals: ['1', '2', '3', '4', '5', '6', 'b7'],
    nps: 3,
    use: 'Dur s malou septimou: přes dominantní septakord, blues, rock vamp I–♭VII–IV.',
  },
  harmonicMinor: {
    name: 'Harmonická moll',
    intervals: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    nps: 3,
    use: 'Moll se zvýšenou septimou: přes V7 v moll, „cikánský“ zvuk ♭6–7.',
  },
  phrygian: {
    name: 'Frygická',
    intervals: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    nps: 3,
    use: 'Moll s malou sekundou: temná, španělská. Přes mollový akord na 3. stupni (Em v C).',
  },
  lydian: {
    name: 'Lydická',
    intervals: ['1', '2', '3', '#4', '5', '6', '7'],
    nps: 3,
    use: 'Dur se zvětšenou kvartou: vzdušná, filmová. Přes durový akord na 4. stupni (F v C).',
  },
  locrian: {
    name: 'Lokrická',
    intervals: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    nps: 3,
    use: 'Přes malý zmenšený akord (m7♭5, iiø v moll).',
  },
  phrygianDominant: {
    name: 'Frygická dominantní',
    intervals: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
    nps: 3,
    use: 'Harmonická moll od dominanty: přes V7 v moll (E7 v a moll), flamenco, klezmer.',
  },
  // symetrické stupnice: tvar se opakuje po malých terciích (zmenšené) nebo po celých tónech
  halfWhole: {
    name: 'Zmenšená půltón–celý tón',
    intervals: ['1', 'b2', 'b3', '3', '#4', '5', '6', 'b7'],
    symmetric: 3,
    use: 'Přes dominantní septakord (7♭9, 13♭9). Symetrická – posouvej po 3 pražcích.',
  },
  wholeHalf: {
    name: 'Zmenšená celý tón–půltón',
    intervals: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'],
    symmetric: 3,
    use: 'Přes zmenšený septakord (°7). Symetrická – posouvej po 3 pražcích.',
  },
  wholeTone: {
    name: 'Celotónová',
    intervals: ['1', '2', '3', '#4', '#5', 'b7'],
    symmetric: 2,
    use: 'Přes zvětšený akord (+, 7♯5). Snová, bez půltónů – posouvej po 2 pražcích.',
  },
};
