// Nápady, co hrát přes akord: arpeggio od tercie (3-5-7), od kvinty (5-7-9),
// od kořene (tóny akordu), druhý hlas v terciích/sextách. Plus barevné tóny 6 a 9.

import { degreeTone, nameTones, chordFamily } from '../theory/harmony.js';

export const IDEA_TYPES = ['phrase', 'third', 'fifth', 'root', 'dyad3', 'dyad6', 'licks', 'call', 'off'];

const NUMS = { third: [3, 5, 7], fifth: [5, 7, 9] };

export function ideaFor(chord, type, scale, opts = {}) {
  let kind = type;
  // akordy bez tercie (sus) nemají „od tercie“ – vezme se kořenové arpeggio
  if (kind === 'third' && chordFamily(chord) === 'sus') kind = 'root';
  if (!['third', 'fifth'].includes(kind)) kind = 'root';

  const tones = kind === 'root'
    ? chord.tones.map((t) => degreeTone(chord, Number(t.interval.replace(/[b#]/g, '')), scale, opts))
    : NUMS[kind].map((n) => degreeTone(chord, n, scale, opts));
  const symbol = kind === 'root' ? chord.symbol : nameTones(tones) ?? tones.map((t) => t.name).join(' ');

  const used = new Set([...tones.map((t) => t.pc), ...chord.tones.map((t) => t.pc)]);
  const colors = [6, 9].map((n) => degreeTone(chord, n, scale, opts)).filter((c) => !used.has(c.pc));

  return { type, kind, symbol, tones, colors };
}
