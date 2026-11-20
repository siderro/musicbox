// Realizace rytmu na hmatu: z řetězce kroků (rhythms.js) a hmatu (voicing engine)
// udělá seznam událostí s přesným časem v dobách a tóny, které zní. Čisté funkce, bez zvuku.
//
// Basový přechod (walkTo): na poslední osminu před změnou akordu tón o krok od dalšího kořene (token 'w').
// Boogie (hmat s `walk`): tón na struně chůze se v každé době vymění za 5 – 6 – ♭7 – 6.
//
// Událost: { beat, step, notes: [{ s, f, midi }], dir: 'down'|'up'|null, vel, dur, mute,
//            palm, accent, kind: 'strum'|'bass'|'pick', token }
//   beat, dur v dobách od začátku segmentu (swing už započten), notes v pořadí, jak je ruka
//   zasáhne (dolů 6 → 1, nahoru 1 → 6).

import { RHYTHMS } from '../data/rhythms.js';

export const TOKENS = {
  D: { label: '↓', kind: 'strum', dir: 'down', vel: 0.85, set: 'all' },
  d: { label: '↓', kind: 'strum', dir: 'down', vel: 0.5, set: 'all' },
  U: { label: '↑', kind: 'strum', dir: 'up', vel: 0.62, set: 'top' },
  u: { label: '↑', kind: 'strum', dir: 'up', vel: 0.4, set: 'top' },
  C: { label: '↓', kind: 'strum', dir: 'down', vel: 0.65, set: 'chick' },
  X: { label: '×', kind: 'strum', dir: 'down', vel: 0.7, set: 'all', mute: true },
  x: { label: '×', kind: 'strum', dir: 'up', vel: 0.5, set: 'top', mute: true },
  B: { label: 'B', kind: 'bass', dir: null, vel: 0.8, set: 'bass' },
  A: { label: 'A', kind: 'bass', dir: null, vel: 0.78, set: 'alt' },
  p: { label: 'p', kind: 'bass', dir: null, vel: 0.68, set: 'bass' },
  i: { label: 'i', kind: 'pick', dir: null, vel: 0.52, set: 'i' },
  m: { label: 'm', kind: 'pick', dir: null, vel: 0.55, set: 'm' },
  a: { label: 'a', kind: 'pick', dir: null, vel: 0.6, set: 'a' },
  f: { label: 'f', kind: 'pick', dir: null, vel: 0.55, set: 'fingers' },
};
const HOLD = '-';
const REST = '.';
const ACCENT = 1.25;
export const SWING_RATIO = 2 / 3;

// Řetězec → pole kroků; krok = pole tokenů [{ t, accent }] ('-' a '.' jako { t: '-' }).
export function parsePattern(pattern) {
  const src = pattern.replace(/[\s|]/g, '');
  const steps = [];
  let i = 0;
  const one = () => {
    let accent = false;
    if (src[i] === '^') { accent = true; i++; }
    const t = src[i++];
    if (!(t in TOKENS) && t !== HOLD && t !== REST) throw new Error(`neznámý token '${t}' v '${pattern}'`);
    return { t, accent };
  };
  while (i < src.length) {
    if (src[i] === '[') {
      i++;
      const group = [];
      while (i < src.length && src[i] !== ']') group.push(one());
      if (src[i++] !== ']') throw new Error(`neuzavřená [ v '${pattern}'`);
      if (group.some((g) => !(g.t in TOKENS))) throw new Error(`ve [..] jen údery: '${pattern}'`);
      steps.push(group);
    } else steps.push([one()]);
  }
  return steps;
}

export const stepsPerCycle = (r) => r.stepsPerBeat * r.meter[0] * r.bars;
export const cycleBeats = (id) => RHYTHMS[id].meter[0] * RHYTHMS[id].bars;

// Ověří rytmus, vrací pole chyb.
export function checkRhythm(r) {
  const errs = [];
  let steps;
  try {
    steps = parsePattern(r.pattern);
  } catch (e) {
    return [e.message];
  }
  if (steps.length !== stepsPerCycle(r)) errs.push(`délka ${steps.length}, má být ${stepsPerCycle(r)}`);
  if (![2, 3, 4].includes(r.stepsPerBeat)) errs.push(`stepsPerBeat ${r.stepsPerBeat}`);
  if (!['straight', 'swing', 'shuffle'].includes(r.feel)) errs.push(`feel ${r.feel}`);
  return errs;
}

// Čas kroku v dobách (absolutní index kroku, může přesáhnout cyklus).
export function stepBeat(r, step, swing = SWING_RATIO) {
  const spb = r.stepsPerBeat;
  const base = step / spb;
  if (r.feel === 'straight' || spb === 3 || step % 2 === 0) return base;
  // druhý krok dvojice posunout z 1/2 na `swing` dvojice
  const pair = 2 / spb;
  return base + (swing - 0.5) * pair;
}

// Které tóny hmatu daný token zasáhne.
const byString = (a, b) => b.s - a.s; // 6 → 1
const pick = ({ s, f, midi }) => ({ s, f, midi });

export function tokenNotes(t, shape) {
  const notes = [...shape.notes].sort(byString);
  if (!notes.length) return [];
  const bass = shape.bass ?? notes[0];
  const alt = shape.alt ?? bass;
  const bassStrings = new Set([bass.s, alt.s]);
  const upper = notes.filter((n) => n.s < Math.min(...bassStrings));
  switch (TOKENS[t].set) {
    case 'all':
      return notes.map(pick);
    case 'top': {
      const top = notes.filter((n) => n.s <= 4);
      return (top.length >= 3 ? top : notes.slice(-3)).map(pick);
    }
    case 'chick':
      return (upper.length >= 2 ? upper : notes.slice(-3)).map(pick);
    case 'bass':
      return [pick(bass)];
    case 'alt':
      return [pick(alt)];
    default: {
      // prsty: a = nejvyšší, m = druhá, i = třetí nejvyšší struna nad basem
      const pool = (upper.length ? upper : notes).slice(-3);
      const at = (k) => pool[Math.max(0, pool.length - 1 - k)];
      if (t === 'f') return pool.map(pick);
      return [pick(at({ a: 0, m: 1, i: 2 }[t]))];
    }
  }
}

// Seznam rytmů, které sedí do taktu (a volitelně stylu), seřazený podle úrovně.
export function rhythmsFor(meter, style) {
  return Object.entries(RHYTHMS)
    .filter(([, r]) => r.meter[0] === meter[0] && r.meter[1] === meter[1])
    .filter(([, r]) => !style || r.styles.includes(style))
    .sort(([, a], [, b]) => a.level - b.level)
    .map(([id]) => id);
}

// Události rytmu na hmatu pro segment `beats` dob, který začíná `startBeat` dob od začátku
// cyklu rytmu (cyklus = bars × doby; větší startBeat se zabalí). Kratší segment se ořízne,
// delší zopakuje cyklus. Když segment nezačíná začátkem cyklu a první krok nemá úder
// (nový akord na „.“), zahraje se tam úder z prvního kroku rytmu, ať akord nezačne tichem.
// walkTo = basový přechodový tón { s, f, midi } k dalšímu akordu (bas + akord): u rytmů s `walkBass`
// zazní na poslední osminu segmentu, když je tam v rytmu pauza.
export function rhythmEvents(rhythmId, shape, { beats, startBeat = 0, swing = SWING_RATIO, walkTo = null } = {}) {
  const r = RHYTHMS[rhythmId];
  if (!r) throw new Error(`neznámý rytmus ${rhythmId}`);
  const steps = parsePattern(r.pattern);
  const n = steps.length;
  const spb = r.stepsPerBeat;
  const ring = (r.sustain ?? 'ring') === 'ring' && !r.palm;
  const first = Math.round(startBeat * spb);
  const last = first + Math.round(beats * spb); // vyloučeně
  const at = (k) => steps[((k % n) + n) % n];
  const t0 = stepBeat(r, first, swing);
  const beatOf = (k) => Math.min(beats, stepBeat(r, k, swing) - t0);

  // boogie (shape.walk): horní tón dvojhmatu chodí po dobách 5 – 6 – ♭7 – 6 (Chuck Berry)
  const WALK = [0, 1, 2, 1];
  const walkAt = (k, notes) => {
    if (!shape.walk?.length) return notes;
    const w = shape.walk[WALK[Math.floor(k / spb) % r.meter[0] % WALK.length]];
    return notes.map((x) => (x.s === w.s ? { s: w.s, f: w.f, midi: w.midi } : x));
  };

  const events = [];
  for (let k = first; k < last; k++) {
    let step = at(k);
    if (k === first && first % n !== 0 && !(step[0].t in TOKENS)) step = steps[0].filter((x) => x.t in TOKENS);
    for (const { t, accent } of step) {
      if (!(t in TOKENS)) continue;
      const info = TOKENS[t];
      const notes = walkAt(k, tokenNotes(t, shape));
      if (!notes.length) continue;
      // délka v režimu hold: 1 krok + následující '-'
      let end = k + 1;
      while (end < last && at(end).length === 1 && at(end)[0].t === HOLD) end++;
      events.push({
        step: k - first,
        beat: beatOf(k),
        notes: info.dir === 'up' ? [...notes].reverse() : notes,
        dir: info.dir,
        vel: Math.min(1, info.vel * (accent ? ACCENT : 1)),
        mute: !!info.mute,
        palm: !!r.palm,
        accent,
        kind: info.kind,
        token: t,
        _k: k,
        _end: end,
      });
    }
  }

  const lastStep = last - 1;
  if (walkTo && r.walkBass && last - first >= 2 && at(lastStep).length === 1 && at(lastStep)[0].t === REST) {
    events.push({
      step: lastStep - first, beat: beatOf(lastStep), notes: [{ s: walkTo.s, f: walkTo.f, midi: walkTo.midi }],
      dir: null, vel: TOKENS.A.vel * 0.85, mute: false, palm: !!r.palm, accent: false, kind: 'bass', token: 'w',
      _k: lastStep, _end: last,
    });
  }

  // doba trvání: ring = do dalšího úderu na nejhlubší strunu události, jinak 1 krok + držení
  for (const [idx, e] of events.entries()) {
    let endK = e._end;
    if (ring && !e.mute) {
      // utne ho až úder na jeho nejhlubší strunu (↑ přes horní struny nechá basy znít;
      // horní struny přebije zvuk – guitar.js utlumí předchozí tón na téže struně)
      const low = Math.max(...e.notes.map((x) => x.s));
      const next = events.slice(idx + 1).find((o) => o._k > e._k && o.notes.some((x) => x.s === low));
      endK = next ? next._k : last;
    }
    e.dur = Math.max(0.05, beatOf(endK) - e.beat);
    delete e._k;
    delete e._end;
  }
  return events;
}

// Mřížka pro UI: pro každý krok popisky tokenů ('↓', '↑', '×', 'B', 'p', …) a čas kroku.
export function rhythmGrid(rhythmId) {
  const r = RHYTHMS[rhythmId];
  return parsePattern(r.pattern).map((step, k) => ({
    beat: stepBeat(r, k),
    onBeat: k % r.stepsPerBeat === 0,
    tokens: step.map(({ t, accent }) => ({ t, accent, label: TOKENS[t]?.label ?? (t === HOLD ? '–' : '') })),
  }));
}
