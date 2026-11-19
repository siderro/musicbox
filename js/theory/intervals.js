// Intervaly zapisované jako '1', 'b3', '#4', 'b7', '9', 'bb7'.

import { transposeNote, pcOf, noteName } from './notes.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

export function parseInterval(str) {
  const m = /^([b#♭♯]*)(\d+)$/.exec(String(str));
  if (!m) throw new Error(`Neplatný interval: ${str}`);
  const num = Number(m[2]);
  if (num < 1) throw new Error(`Neplatný interval: ${str}`);
  let acc = 0;
  for (const ch of m[1]) acc += ch === '#' || ch === '♯' ? 1 : -1;
  const steps = num - 1;
  return { steps, semis: MAJOR[steps % 7] + 12 * Math.floor(steps / 7) + acc };
}

export const intervalLabel = (str) => String(str).replace(/b/g, '♭').replace(/#/g, '♯');

// Rozepíše intervaly od kořene na konkrétní tóny: [{ interval, note, pc, name }].
export function spellIntervals(root, intervals) {
  return intervals.map((iv) => {
    const { steps, semis } = parseInterval(iv);
    const note = transposeNote(root, steps, semis);
    return { interval: iv, note, pc: pcOf(note), name: noteName(note) };
  });
}
