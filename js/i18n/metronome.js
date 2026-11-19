// Texty kapesního metronomu (vymyšlená značka KOHAKU, model DM-91).

export const TM = {
  brand: 'KOHAKU',
  model: 'DM-91',
  modelName: 'Pocket Tempo',
  sticker: ['PULSE', 'LOCK'],
  stickerSub: 'quartz timing',
  madeIn: 'Quartz · Digital Metronome',

  keySound: 'Zvuk',
  keyMeter: 'Takt',
  keySubdiv: 'Dělení',
  keyGroove: 'Rytmus',
  keyAccent: 'Přízvuk',
  keyTap: 'Tap',
  keyStart: 'Start',
  keyStop: 'Stop',
  tempo: 'Tempo',
  slow: 'Pomaleji',
  fast: 'Rychleji',

  // LCD (zkratky jako na skutečném displeji)
  lcdSounds: { click: 'KLIK', wood: 'WOOD', drums: 'BICÍ' },
  lcdAcc: 'ACC',
  lcdBpm: 'BPM',
  lcdDrumsMeter: (meter) => `BICÍ = ${meter}`,
  lcdOn: 'ZAP',
  lcdOff: 'VYP',
  lcdAccent: 'PŘÍZVUK',

  cycleHint: 'klikni = další, Shift+klik = předchozí',
  wheelHint: 'Táhni, toč kolečkem myši nebo šipkami',
  beatLed: 'Doba',
};
