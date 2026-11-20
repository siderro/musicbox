// Kontrola obsahu – při startu vypíše do konzole, co je v datech špatně.

import { PROGRESSIONS } from './progressions.js';
import { GROOVES } from './grooves.js';
import { SCALES } from './scales.js';
import { ARPEGGIOS } from './arpeggios.js';
import { LICKS } from './licks.js';
import { APPROACHES } from './approaches.js';
import { SAZBY } from './voicings.js';
import { RHYTHMS } from './rhythms.js';
import { COMP_WIKI } from './comp-wiki.js';
import { parseLine } from '../teaching/line.js';
import { parseDegree } from '../theory/chords.js';
import { parseInterval } from '../theory/intervals.js';

export const splitSteps = (str) => str.replace(/[\s|]/g, '').split('');
export const splitTokens = (str) => str.split(/[\s|]+/).filter(Boolean);

const LIBRARIES = { scale: SCALES, arp: ARPEGGIOS, lick: LICKS };
const DRUMS = ['kick', 'snare', 'rim', 'clap', 'hat', 'ohat', 'ride', 'crash'];
const BASS_TOKENS = /^(R|-|\.|[b#]?\d+)$/;

export function lookup(ref) {
  const [kind, id] = String(ref).split(':');
  return LIBRARIES[kind]?.[id] ? { kind, id, def: LIBRARIES[kind][id] } : null;
}

function tryCatch(errors, where, fn) {
  try { fn(); } catch (e) { errors.push(`${where}: ${e.message}`); }
}

export function validateAll() {
  const errors = [];

  for (const [id, p] of Object.entries(PROGRESSIONS)) {
    const at = `kolečko ${id}`;
    const degrees = new Set();
    p.bars.forEach((bar) => (Array.isArray(bar) ? bar : [bar]).forEach((d) => {
      degrees.add(d);
      tryCatch(errors, at, () => parseDegree(d));
    }));
    if (p.defaults?.groove && !GROOVES[p.defaults.groove]) errors.push(`${at}: neznámý groove „${p.defaults.groove}“`);
    for (const item of p.solo ?? []) {
      if (!lookup(item.ref)) errors.push(`${at}: neznámá reference „${item.ref}“`);
      if (item.root && item.root !== 'chord') tryCatch(errors, at, () => parseDegree(item.root));
      const overs = item.over == null || item.over === '*' ? [] : [].concat(item.over);
      overs.forEach((o) => { if (!degrees.has(o)) errors.push(`${at}: over „${o}“ v kolečku není`); });
    }
  }

  for (const [id, g] of Object.entries(GROOVES)) {
    const at = `groove ${id}`;
    const len = g.stepsPerBeat * g.meter[0] * g.bars;
    for (const [lane, str] of Object.entries(g.drums)) {
      if (!DRUMS.includes(lane)) errors.push(`${at}: neznámý nástroj „${lane}“`);
      const n = splitSteps(str).length;
      if (n !== len) errors.push(`${at}: stopa ${lane} má ${n} kroků, má mít ${len}`);
    }
    if (g.comp && splitSteps(g.comp).length !== len) errors.push(`${at}: comp má ${splitSteps(g.comp).length} kroků, má mít ${len}`);
    if (g.bass) {
      const tokens = splitTokens(g.bass);
      if (tokens.length !== len) errors.push(`${at}: bass má ${tokens.length} kroků, má mít ${len}`);
      tokens.filter((t) => !BASS_TOKENS.test(t)).forEach((t) => errors.push(`${at}: neplatný token basy „${t}“`));
    }
  }

  for (const [id, s] of Object.entries({ ...SCALES, ...ARPEGGIOS })) {
    s.intervals.forEach((iv) => tryCatch(errors, `stupnice/arpeggio ${id}`, () => parseInterval(iv)));
    if (s.positionsFrom && !SCALES[s.positionsFrom]) errors.push(`stupnice ${id}: neznámé positionsFrom`);
  }

  for (const [id, l] of Object.entries(LICKS)) {
    if (l.scale && !SCALES[l.scale]) errors.push(`lick ${id}: neznámá stupnice „${l.scale}“`);
    if (l.line) {
      tryCatch(errors, `lick ${id}`, () => {
        const { tokens } = parseLine(l.line);
        if (/^(s[+-]|x[+-]|w)$/.test(tokens[0]?.pitch)) throw new Error('linka nesmí začínat odloženým tónem (s±, x±, w)');
      });
      continue;
    }
    if (!Array.isArray(l.notes)) {
      errors.push(`lick ${id}: chybí notes nebo line`);
      continue;
    }
    l.notes.forEach((n, i) => {
      if (!(n.d > 0)) errors.push(`lick ${id}: nota ${i + 1} nemá délku d`);
      const pairs = n.rest ? [] : n.dbl ?? [[n.s, n.f]];
      pairs.forEach(([s, f]) => {
        if (!(s >= 1 && s <= 6) || !Number.isFinite(f)) errors.push(`lick ${id}: nota ${i + 1} má neplatnou strunu/pražec`);
      });
    });
  }

  for (const [id, a] of Object.entries(APPROACHES)) {
    const laneIds = new Set(a.lanes.map((l) => l.id));
    for (const [lane, ids] of Object.entries(a.licks ?? {})) {
      if (lane !== '*' && lane !== 'cycle' && !laneIds.has(lane)) errors.push(`přístup ${id}: licky pro neznámý pruh „${lane}“`);
      ids.forEach((l) => { if (!LICKS[l]) errors.push(`přístup ${id}: neznámý lick „${l}“`); });
    }
  }

  for (const [id, r] of Object.entries(RHYTHMS)) {
    if (r.groove && !GROOVES[r.groove]) errors.push(`rytmus ${id}: neznámý groove „${r.groove}“`);
    else if (r.groove && GROOVES[r.groove].meter.join('/') !== r.meter.join('/')) errors.push(`rytmus ${id}: groove „${r.groove}“ má jiný takt`);
  }

  for (const [id, w] of Object.entries(COMP_WIKI)) {
    const at = `wiki doprovodu ${id}`;
    const p = PROGRESSIONS[id];
    if (!p) {
      errors.push(`${at}: neznámé kolečko`);
      continue;
    }
    (w.sazby ?? []).forEach((s) => { if (!SAZBY[s]) errors.push(`${at}: neznámá sazba „${s}“`); });
    Object.keys(w.notes ?? {}).concat(Object.keys(w.try ?? {})).forEach((s) => { if (!SAZBY[s]) errors.push(`${at}: poznámka k neznámé sazbě „${s}“`); });
    (w.rhythms ?? []).concat(Object.keys(w.rhythmNotes ?? {})).forEach((r) => {
      if (!RHYTHMS[r]) errors.push(`${at}: neznámý rytmus „${r}“`);
      else if (RHYTHMS[r].meter.join('/') !== p.meter.join('/')) errors.push(`${at}: rytmus „${r}“ nesedí do taktu ${p.meter.join('/')}`);
    });
  }

  return errors;
}
