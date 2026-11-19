// Knihovna grooveů (bicí + rytmus doprovodu + basová linka).
//
// Každá stopa je řetězec kroků; mezery a '|' jsou jen pro čitelnost.
//   stepsPerBeat – 4 = šestnáctiny, 3 = trioly (shuffle a swing se dělají triolami)
//   bars         – kolik taktů pattern trvá (délka stopy = stepsPerBeat × doby × bars)
//
// Bicí (kick snare rim clap hat ohat ride crash):
//   X = přízvuk, x = normálně, g = ghost (potichu), . = nic
// comp (akordy):
//   x / X = úder akordu, - = držet, . = pustit
// bass – tokeny oddělené mezerou, jeden na krok, intervaly od kořene aktuálního akordu:
//   R kořen, 3 tercie akordu (velká/malá podle akordu), 5 kvinta akordu, 7 septima akordu,
//   2 4 6 b3 b7 8 – pevné intervaly; - držet; . pauza

export const GROOVES = {
  rock8: {
    name: 'Rock – osminy',
    meter: [4, 4],
    stepsPerBeat: 4,
    bars: 1,
    drums: {
      kick: 'X... .... x.x. ....',
      snare: '.... X... .... X...',
      hat: 'x.x. x.x. x.x. x.x.',
    },
    comp: 'x--- ---. x--- ---.',
    bass: 'R - R - R - R - 5 - 5 - R - 8 -',
  },
  rockHalf: {
    name: 'Rock – half-time',
    meter: [4, 4],
    stepsPerBeat: 4,
    bars: 1,
    drums: {
      kick: 'X... .... .... ..x.',
      snare: '.... .... X... ....',
      hat: 'x.x. x.x. x.x. x.x.',
    },
    comp: 'x--- ---- ---- ---.',
    bass: 'R - - - - - - - R - - - - - 5 -',
  },
  pop: {
    name: 'Pop – four on the floor',
    meter: [4, 4],
    stepsPerBeat: 4,
    bars: 1,
    drums: {
      kick: 'X... X... X... X...',
      clap: '.... X... .... X...',
      hat: 'x... x... x... x...',
      ohat: '..x. ..x. ..x. ..x.',
    },
    comp: 'x-.x -.x- -.x- x-..',
    bass: 'R - . R - . R - R - . R - . 5 -',
  },
  funk16: {
    name: 'Funk – šestnáctiny',
    meter: [4, 4],
    stepsPerBeat: 4,
    bars: 1,
    drums: {
      kick: 'X..x ..x. ..X. .x..',
      snare: '.g.. X..g .g.g X..g',
      hat: 'xgxg xgxg xgxg xgxg',
    },
    comp: 'x... ..x. .x.. x...',
    bass: 'R . . R . . 8 . . R . 5 . 3 . 5',
  },
  ballad: {
    name: 'Balada',
    meter: [4, 4],
    stepsPerBeat: 4,
    bars: 1,
    drums: {
      kick: 'X... .... ..x. ....',
      rim: '.... X... .... X...',
      ride: 'x... x... x... x...',
    },
    comp: 'x--- ---- ---- ---.',
    bass: 'R - - - - - - - 5 - - - - - - .',
  },
  countryTrain: {
    name: 'Country – train beat',
    meter: [4, 4],
    stepsPerBeat: 4,
    bars: 1,
    drums: {
      kick: 'X... .... X... ....',
      snare: 'gggg Xggg gggg Xggg',
    },
    comp: '.... x-.. .... x-..',
    bass: 'R - - . . . . . 5 - - . . . . .',
  },
  shuffle: {
    name: 'Blues shuffle',
    meter: [4, 4],
    stepsPerBeat: 3,
    bars: 2,
    drums: {
      kick: 'X..|...|x..|...|X..|...|x..|...',
      snare: '...|X..|...|X..|...|X..|...|X..',
      hat: 'x.x|x.x|x.x|x.x|x.x|x.x|x.x|x.x',
    },
    comp: 'x..|..x|...|..x|x..|..x|...|..x',
    bass: 'R - R | 3 - 3 | 5 - 5 | 6 - 6 | b7 - b7 | 6 - 6 | 5 - 5 | 3 - 3',
  },
  slowBlues: {
    name: 'Pomalý blues 12/8',
    meter: [4, 4],
    stepsPerBeat: 3,
    bars: 1,
    drums: {
      kick: 'X..|...|x.x|...',
      snare: '...|X..|...|X..',
      hat: 'Xxx|Xxx|Xxx|Xxx',
    },
    comp: 'x--|--.|x--|--.',
    bass: 'R - - | 3 - - | 5 - - | 6 - 5',
  },
  jazzSwing: {
    name: 'Jazz swing',
    meter: [4, 4],
    stepsPerBeat: 3,
    bars: 1,
    drums: {
      ride: 'X..|x.x|X..|x.x',
      hat: '...|g..|...|g..',
      kick: 'g..|g..|g..|g..',
      snare: '...|...|...|..g',
    },
    comp: 'x--|..x|...|...',
    bass: 'R - - | 3 - - | 5 - - | 6 - -',
  },
  folk44: {
    name: 'Tramp – boom-chick',
    meter: [4, 4],
    stepsPerBeat: 2,
    bars: 2,
    drums: {
      kick: 'X. .. X. .. | X. .. X. ..',
      snare: '.. x. .. x. | .. x. .. x.',
      hat: '.g .g .g .g | .g .g .g .g',
    },
    comp: '.. x. .x x. | .. x. .x x.',
    bass: 'R - . . 5 - . . | R - . . 5 - . .',
  },
  waltz: {
    name: 'Valčík (3/4)',
    meter: [3, 4],
    stepsPerBeat: 2,
    bars: 2,
    drums: {
      kick: 'X. .. .. | X. .. ..',
      hat: '.. x. x. | .. x. x.',
    },
    comp: '.. x. x. | .. x. x.',
    bass: 'R - . . . . | 5 - . . . .',
  },
  polka: {
    name: 'Polka (2/4)',
    meter: [2, 4],
    stepsPerBeat: 2,
    bars: 2,
    drums: {
      kick: 'X. .. | X. ..',
      snare: '.. X. | .. X.',
      hat: '.x .x | .x .x',
    },
    comp: '.. x. | .. x.',
    bass: 'R - . . | 5 - . .',
  },
};
