// Rozložení akordu do sevřené polohy s co nejmenším pohybem hlasů.

import { mod } from './notes.js';

const LOW = 50; // D3
const HIGH = 72; // C5
const MAX_VOICES = 4;

function candidates(pcs) {
  const out = [];
  for (let r = 0; r < pcs.length; r++) {
    const order = [...pcs.slice(r), ...pcs.slice(0, r)];
    let m = LOW + mod(order[0] - LOW, 12);
    const notes = [m];
    for (const pc of order.slice(1)) {
      m += mod(pc - m, 12) || 12;
      notes.push(m);
    }
    if (notes[notes.length - 1] <= HIGH) out.push(notes);
  }
  return out;
}

function distance(a, b) {
  let sum = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    sum += Math.abs((a[Math.min(i, a.length - 1)]) - (b[Math.min(i, b.length - 1)]));
  }
  return sum;
}

// tones: [{ interval, pc }] – u pětizvuků se vynechá kvinta.
export function voiceChord(tones, prev = null) {
  let pcs = tones.map((t) => t.pc);
  if (pcs.length > MAX_VOICES) {
    pcs = tones.filter((t) => !/^[b#]?5$/.test(t.interval)).map((t) => t.pc).slice(0, MAX_VOICES);
  }
  const options = candidates(pcs);
  if (!options.length) return pcs.map((pc) => LOW + mod(pc - LOW, 12)).sort((a, b) => a - b);
  if (!prev) {
    const centre = (LOW + HIGH) / 2;
    return options.reduce((best, c) => (Math.abs(avg(c) - centre) < Math.abs(avg(best) - centre) ? c : best));
  }
  return options.reduce((best, c) => (distance(c, prev) < distance(best, prev) ? c : best));
}

const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// Kořen basy v rozsahu A1–G♯2.
export const bassRoot = (pc) => 33 + mod(pc - 9, 12);
