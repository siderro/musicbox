// Tóny: písmeno (0–6 = C–B) + posuvka (-1 = ♭, +1 = ♯). Výška jako MIDI číslo.

export const mod = (n, m) => ((n % m) + m) % m;

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

export function pcOf(n) {
  return mod(LETTER_PC[n.letter] + n.acc, 12);
}

export function parseNote(str) {
  const m = /^([A-Ga-g])([#b♯♭]*)$/.exec(String(str).trim());
  if (!m) throw new Error(`Neplatný tón: ${str}`);
  let acc = 0;
  for (const ch of m[2]) acc += ch === '#' || ch === '♯' ? 1 : -1;
  return { letter: LETTERS.indexOf(m[1].toUpperCase()), acc };
}

export function noteName(n) {
  const acc = n.acc > 0 ? '♯'.repeat(n.acc) : '♭'.repeat(-n.acc);
  return LETTERS[n.letter] + acc;
}

// Nejjednodušší zápis třídy tónu (bez posuvky, jinak ♭ nebo ♯ podle preference).
export function simplest(pc, preferFlat = false) {
  const natural = LETTER_PC.indexOf(pc);
  if (natural >= 0) return { letter: natural, acc: 0 };
  return preferFlat
    ? { letter: LETTER_PC.indexOf(mod(pc + 1, 12)), acc: -1 }
    : { letter: LETTER_PC.indexOf(mod(pc - 1, 12)), acc: 1 };
}

// Posun o interval: písmeno se posune o `steps`, posuvka dorovná rozdíl půltónů.
// Dvojité posuvky (jen ve vzdálených tóninách) se přepíšou enharmonicky.
export function transposeNote(n, steps, semis) {
  const letter = mod(n.letter + steps, 7);
  const target = mod(pcOf(n) + semis, 12);
  const acc = mod(target - LETTER_PC[letter] + 6, 12) - 6;
  return Math.abs(acc) > 1 ? simplest(target, acc < 0) : { letter, acc };
}

// Tóniny v nabídce – zápis volený tak, aby v dané tónině vycházelo co nejméně posuvek.
export const KEY_NAMES = {
  major: ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'],
  minor: ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'],
};

export function tonicNote(pc, mode = 'major') {
  return parseNote(KEY_NAMES[mode === 'minor' ? 'minor' : 'major'][mod(pc, 12)]);
}

export function keyLabel(pc, mode = 'major') {
  const name = KEY_NAMES[mode === 'minor' ? 'minor' : 'major'][mod(pc, 12)];
  return mode === 'minor' ? `${name.toLowerCase()} moll` : `${name} dur`;
}

export const midiToFreq = (m, a4 = 440) => a4 * 2 ** ((m - 69) / 12);
export const freqToMidi = (f, a4 = 440) => 69 + 12 * Math.log2(f / a4);
