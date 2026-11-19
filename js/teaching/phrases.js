// Engine výukových frází: z motivu (js/data/motifs.js) udělá skutečnou frázi na hmatníku.
// Slovník určuje vybraný čip (stupnice), cíl určuje akord na „jedna“, styl groove.
// Vše jsou čisté funkce – testovatelné v node.

import { MOTIFS } from '../data/motifs.js';
import { SCALES } from '../data/scales.js';
import { ARPEGGIOS } from '../data/arpeggios.js';
import { LICKS } from '../data/licks.js';
import { parsedMotif } from './motif-parse.js';
import { spellIntervals } from '../theory/intervals.js';
import { degreeRoot } from '../theory/chords.js';
import { degreeTone, guideTones, keyScale, chordFamily } from '../theory/harmony.js';
import { mod } from '../theory/notes.js';
import { TUNING, STRINGS, MAX_FRET } from '../fretboard/neck.js';

// ---------- náhoda se semínkem (deterministická) ----------
export function rng(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- slovník (vocabulary) ----------
// item = položka sólování (čip); vrací tóny, kořen („domov“) a 7tónovou stupnici pro doplňování.
export function vocabFor(item, chord, song) {
  const keyFill = keyScale(song.tonic, song.progression.mode);
  const ref = item?.ref ?? '';
  const [kind, id] = ref.split(':');
  let def = kind === 'scale' ? SCALES[id] : kind === 'arp' ? ARPEGGIOS[id] : kind === 'lick' ? SCALES[LICKS[id]?.scale] : null;
  let root;
  let vKind = kind === 'lick' ? 'scale' : kind;
  if (!def) {
    def = song.progression.mode === 'minor' ? SCALES.minor : SCALES.major;
    root = song.tonic;
    vKind = 'scale';
  } else if (kind === 'lick') root = song.tonic;
  else if (item.root === 'chord') root = chord.root;
  else root = degreeRoot(item.root ?? (kind === 'arp' ? 'I' : 'I'), song.tonic);
  if (kind === 'arp' && item.root !== 'chord') root = chord.root;
  const tones = spellIntervals(root, def.intervals);
  return {
    id: kind === 'scale' || kind === 'lick' ? (kind === 'lick' ? LICKS[id]?.scale : id) : `arp:${id}`,
    kind: vKind,
    name: def.name,
    tones,
    pcs: new Set(tones.map((t) => t.pc)),
    byInterval: new Map(tones.map((t) => [t.interval, t])),
    homePc: tones[0].pc,
    fill: tones.length >= 7 ? tones : keyFill,
  };
}

const overList = (item) => (item.over == null || item.over === '*' ? null : [].concat(item.over));

// Slovník pro konkrétní akord: čip s `over` platí jen přes své akordy,
// jinak první čip stupnice bez omezení.
export function vocabResolver(song, items, selected) {
  const fallback = items.find((i) => i.ref.startsWith('scale:') && !overList(i));
  return (chord) => {
    const list = selected && overList(selected);
    const item = !selected ? fallback : list && !list.includes(chord.degree) ? fallback ?? selected : selected;
    return vocabFor(item, chord, song);
  };
}

// ---------- kompatibilita motivu se slovníkem ----------
function degTokens(motif) {
  const p = parsedMotif(motif);
  return [...p.body, ...p.tail].filter((t) => t.kind === 'deg');
}

export function compatible(motif, vocab) {
  if (motif.anchor === 'chord') return true;
  if (vocab.kind !== 'scale') return false;
  return degTokens(motif).every((t) => vocab.byInterval.has(t.deg) && (!t.t.bendTo || vocab.byInterval.has(t.t.bendTo)));
}

// ---------- hmatník ----------
const midiRange = { lo: 40, hi: 88 };

function placesFor(midi, lo, hi) {
  const out = [];
  for (const s of STRINGS) {
    const f = midi - TUNING[s];
    if (f >= Math.max(0, lo) && f <= Math.min(MAX_FRET, hi)) out.push({ s, f });
  }
  return out;
}

function midisFor(pc, lo, hi) {
  const out = [];
  for (let m = midiRange.lo; m <= midiRange.hi; m++) if (mod(m, 12) === pc && placesFor(m, lo, hi).length) out.push(m);
  return out;
}

// Přiřazení strun: dynamické programování přes polohy v okně (minimum pohybu ruky).
function assignStrings(notes, win, strict) {
  const lo = win.lo - 1;
  const hi = win.hi + 1;
  const states = notes.map((n) => {
    let p = placesFor(n.midi, lo, hi);
    if (!p.length) p = placesFor(n.midi, win.lo - 3, win.hi + 3);
    return p;
  });
  if (states.some((p) => !p.length)) return null;
  const nodeCost = (st) => 3 * Math.max(0, win.lo - st.f, st.f - win.hi);
  const allowed = (prevN, st, n) => {
    if (!strict) return true;
    if (n.bendSemis && st.s > (n.bendSemis <= 1 ? 4 : 3)) return false;
    return true;
  };
  const link = (prevN, a, b, n) => {
    if (strict && (prevN.t.leg || prevN.t.slide)) {
      if (a.s !== b.s) return Infinity;
      if (prevN.t.leg === 'h' && b.f <= a.f) return Infinity;
      if (prevN.t.leg === 'p' && b.f >= a.f) return Infinity;
      if (prevN.t.slide && Math.abs(b.f - a.f) > 5) return Infinity;
    }
    if (strict && n.t.release && (a.s !== b.s || a.f !== b.f)) return Infinity;
    return 0.5 * Math.abs(b.f - a.f) + 0.7 * Math.abs(b.s - a.s) + (a.s === b.s && Math.abs(b.f - a.f) > 3 ? 2 : 0);
  };
  let cost = states[0].map((st) => (allowed(null, st, notes[0]) ? nodeCost(st) : Infinity));
  const back = [];
  for (let i = 1; i < notes.length; i++) {
    const row = [];
    const bp = [];
    states[i].forEach((st) => {
      let best = Infinity;
      let arg = -1;
      states[i - 1].forEach((pst, j) => {
        const c = cost[j] + link(notes[i - 1], pst, st, notes[i]);
        if (c < best) { best = c; arg = j; }
      });
      row.push(allowed(notes[i - 1], st, notes[i]) ? best + nodeCost(st) : Infinity);
      bp.push(arg);
    });
    cost = row;
    back.push(bp);
  }
  let k = cost.indexOf(Math.min(...cost));
  if (!Number.isFinite(cost[k])) return null;
  const path = [states[notes.length - 1][k]];
  for (let i = notes.length - 1; i > 0; i--) {
    k = back[i - 1][k];
    path.unshift(states[i - 1][k]);
  }
  return path;
}

// ---------- realizace motivu ----------
const REAL = new Set(['deg', 'chord', 'next', 'land', 'guide', 'common']);
const REMAP = { fifth: { 3: 5, 5: 7, 7: 9 }, root: { 3: 1, 5: 3, 7: 5 } };

export function realiseMotif(motif, ctx) {
  const { vocab, chordAt, landChord, startAbs, landAbs, win, opts = {}, remap, homePc } = ctx;
  const parsed = parsedMotif(motif);
  const fill = vocab.fill;
  const toks = [];
  let t = startAbs;
  parsed.body.forEach((tok) => { toks.push({ tok, abs: t, part: 'body' }); t += tok.d; });
  t = landAbs;
  parsed.tail.forEach((tok, i) => { toks.push({ tok, abs: t, part: i === 0 ? 'land' : 'tail' }); t += tok.d; });

  const lo = win.lo;
  const hi = win.hi;
  const centreMidi = TUNING[3] + Math.round((lo + hi) / 2);
  let prev = ctx.prevMidi ?? centreMidi;

  const pickMidi = (cands, oct, extra = () => 0) => {
    let list = cands;
    if (oct > 0 && cands.some(([m]) => m > prev)) list = cands.filter(([m]) => m > prev);
    if (oct < 0 && cands.some(([m]) => m < prev)) list = cands.filter(([m]) => m < prev);
    let best = null;
    for (const c of list) {
      const cost = Math.abs(c[0] - prev) + extra(c);
      if (!best || cost < best.cost) best = { m: c[0], pc: c[1], cost };
    }
    return best;
  };
  const candsFor = (pcs) => pcs.flatMap((pc, prio) => midisFor(pc, lo - 1, hi + 1).map((m) => [m, pc, prio]));

  // 1) konkrétní tóny (stupně, tóny akordu, cíl)
  let first = true;
  let lastOct = 0;
  for (const e of toks) {
    const { tok } = e;
    if (tok.kind === 'rest') continue;
    let pcs = null;
    if (tok.kind === 'deg') {
      const tone = vocab.byInterval.get(tok.deg);
      if (!tone) return null;
      pcs = [tone.pc];
    } else if (tok.kind === 'chord') {
      const num = remap?.[tok.num] ?? tok.num;
      pcs = [degreeTone(chordAt(e.abs), num, fill, opts).pc];
    } else if (tok.kind === 'next') {
      pcs = [degreeTone(landChord, tok.num, fill, opts).pc];
    } else if (tok.kind === 'land') {
      const target = motif.target.map((n) => degreeTone(landChord, n, fill, opts).pc);
      const inVocab = vocab.kind === 'scale' ? target.filter((pc) => vocab.pcs.has(pc)) : target;
      pcs = homePc != null && landChord.tones.some((x) => x.pc === homePc) ? [homePc] : inVocab.length ? inVocab : target;
    }
    if (!pcs) continue;
    const cands = candsFor(pcs);
    if (!cands.length) return null;
    // první tón fráze táhne ke středu okna ruky, aby fráze neklesaly/nestoupaly donekonečna
    // stejná značka oktávy u po sobě jdoucích tónů = celá skupina v té poloze (ne skok u každého)
    const oct = first || (tok.oct !== 0 && tok.oct === lastOct) ? 0 : tok.oct;
    lastOct = tok.oct;
    const best = pickMidi(cands, oct, tok.kind === 'land'
      ? ([m, , prio]) => 3 * prio + (m === prev ? 5 : 0) + (Math.abs(m - prev) > 5 ? 4 : 0)
      : first ? ([m]) => 0.8 * Math.abs(m - centreMidi) : () => 0);
    first = false;
    e.midi = best.m;
    e.pc = best.pc;
    prev = e.midi;
  }
  const nextReal = (i) => toks.slice(i + 1).find((x) => REAL.has(x.tok.kind) && x.midi != null);

  // 2) vodicí a společné tóny (vztažené k následujícímu tónu)
  for (let i = toks.length - 1; i >= 0; i--) {
    const e = toks[i];
    if (e.tok.kind !== 'guide' && e.tok.kind !== 'common') continue;
    const nx = nextReal(i);
    const chord = chordAt(e.abs);
    let pcs = e.tok.kind === 'common'
      ? chord.tones.filter((x) => landChord.tones.some((y) => y.pc === x.pc)).map((x) => x.pc)
      : [];
    if (!pcs.length) pcs = guideTones(chord, fill).map((x) => x.pc);
    const ref = nx?.midi ?? prev;
    const cands = candsFor(pcs);
    if (!cands.length) return null;
    const best = cands.reduce((b, c) => (Math.abs(c[0] - ref) < Math.abs(b[0] - ref) ? c : b));
    e.midi = best[0];
    e.pc = best[1];
  }
  // 3) nájezdy (krok stupnice / půltón od následujícího tónu)
  for (let i = toks.length - 1; i >= 0; i--) {
    const e = toks[i];
    if (e.tok.kind !== 'step' && e.tok.kind !== 'chrom') continue;
    const nx = nextReal(i) ?? toks.slice(i + 1).find((x) => x.midi != null);
    if (!nx) { e.tok = { ...e.tok, kind: 'rest' }; continue; }
    let m = nx.midi;
    if (e.tok.kind === 'chrom') m += e.tok.semis;
    else {
      const dir = Math.sign(e.tok.steps);
      for (let k = 0; k < Math.abs(e.tok.steps); k++) {
        do { m += dir; } while (!vocab.pcs.has(mod(m, 12)) && !fill.some((x) => x.pc === mod(m, 12)));
      }
    }
    e.midi = m;
    e.pc = mod(m, 12);
  }

  // 4) techniky
  const notes = [];
  let lastBend = 0;
  for (const e of toks) {
    if (e.tok.kind === 'rest' || e.midi == null) continue;
    const tt = { ...e.tok.t };
    let bendSemis = 0;
    if (tt.bendTo) {
      const target = vocab.byInterval.get(tt.bendTo);
      const semis = target ? mod(target.pc - e.pc, 12) : 0;
      if (semis >= 1 && semis <= 2) bendSemis = semis;
      delete tt.bendTo;
    }
    if (tt.curl) {
      if (/^b[37]$/.test(e.tok.deg ?? '')) bendSemis = 0.5;
      delete tt.curl;
    }
    if (tt.release) {
      if (lastBend) bendSemis = lastBend;
      else delete tt.release;
    }
    lastBend = bendSemis && !tt.release ? bendSemis : 0;
    notes.push({ abs: e.abs, d: e.tok.d, midi: e.midi, pc: e.pc, t: tt, bendSemis, part: e.part, kind: e.tok.kind });
  }
  if (notes.length < 2) return null;

  // 5) struny
  let path = assignStrings(notes, win, true);
  if (!path) {
    notes.forEach((n) => { delete n.t.leg; delete n.t.slide; delete n.t.release; n.bendSemis = 0; });
    path = assignStrings(notes, win, false);
  }
  if (!path) return null;
  notes.forEach((n, i) => Object.assign(n, path[i]));
  return notes;
}

// ---------- důvody (proč tenhle tón) ----------
export function toneRole(pc, chord, vocab) {
  const isHome = vocab && vocab.kind === 'scale' && pc === vocab.homePc;
  const semis = mod(pc - chord.rootPc, 12);
  const fam = chordFamily(chord);
  const own = chord.tones.find((x) => x.pc === pc);
  if (own) {
    const n = Number(own.interval.replace(/[b#]/g, ''));
    if (n === 1) return isHome ? 'home' : 'root';
    if (n === 3) return 'third';
    if (n === 5) return 'fifth';
    if (n === 7) return own.interval === '7' ? 'sevMaj' : fam === 'dom' ? 'sevDom' : 'sevMin';
  }
  if (isHome) return 'home';
  if (semis === 9) return 'six';
  if (semis === 2) return 'nine';
  if (semis === 5) return 'four';
  if (semis === 6 && vocab?.byInterval.has('b5')) return 'blue';
  if (semis === 3 && (fam === 'maj' || fam === 'dom')) return 'b3OverMaj';
  if (semis === 8) return 'b6';
  if (semis === 10) return fam === 'dom' ? 'sevDom' : 'sevMin';
  if (semis === 11) return fam === 'maj' ? 'sevMaj' : 'leading';
  return 'approach';
}

// ---------- výběr motivu ----------
const CONNECTOR = { guide: 'cn_guide', approach: 'cn_chrom', common: 'cn_hold', root: 'cn_walkUp' };

function candidates({ mode, vocab, chord, landChord, bodyMax, level, style, prefer, recent, call, colors }) {
  const fam = chordFamily(chord);
  const out = [];
  for (const [id, m] of Object.entries(MOTIFS)) {
    if (m.role !== 'phrase') continue;
    if (m.level > level) continue;
    const p = parsedMotif(m);
    if (p.bodyBeats > bodyMax) continue;
    if (!m.fits.includes(fam)) continue;
    if (m.colorLand && !['maj', 'min'].includes(chordFamily(landChord))) continue;
    if (call && (!m.call || [...p.body, ...p.tail].filter((x) => x.kind !== 'rest').length > 7)) continue;
    let score = 0;
    if (mode === 'phrase' || mode === 'call') {
      if (m.anchor === 'scale') {
        if (!compatible(m, vocab)) continue;
        score += m.vocab.includes(vocab.id) ? 3 : 1;
      } else {
        if (m.color && !colors) continue;
        score += 0.5;
      }
    } else {
      // od tercie / od kvinty / od kořene: jen fráze z tónů akordu
      if (!m.idea && !(m.color && colors)) continue;
      score += m.idea ? 2 : 0.5;
    }
    if (m.style.includes(style)) score += 2;
    if (prefer?.includes(id)) score += 4;
    if (recent.includes(id)) score -= 3;
    out.push({ id, m, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------- celé kolečko ----------
// segments: [{ bar, seg, start, beats, chord }] (z plánu); vrací fráze po dvoutaktových oknech.
export function buildPhrases({ song, segments, beatsPerBar, mode, change, style, level = 2, centre, win, seed = 0, vocabAt, preferAt, colors = true, opts = {} }) {
  const total = segments.reduce((s, x) => s + x.beats, 0);
  const chordAt = (abs) => {
    const a = mod(abs, total);
    return (segments.find((s) => a >= s.start && a < s.start + s.beats) ?? segments[0]).chord;
  };
  const nBars = song.bars.length;
  const windowBars = beatsPerBar === 2 ? 4 : 2;
  const nWin = Math.max(1, Math.ceil(nBars / windowBars));
  const bodyMax = (windowBars / 2) * beatsPerBar;
  const remap = REMAP[mode];
  const rand = rng(`${seed}|${song.progression.name}|${mode}|${style}`);
  const phrases = [];
  const recent = [];
  let prevMidi = null;

  for (let w = 0; w < nWin; w++) {
    const startBar = w * windowBars;
    const windowStart = startBar * beatsPerBar;
    const landAbs = (startBar + windowBars / 2) * beatsPerBar;
    const chord = chordAt(windowStart);
    const landChord = chordAt(landAbs);
    const vocab = vocabAt(chord);
    const prefer = preferAt?.(chord);
    const home = w === nWin - 1 && vocab.kind === 'scale' ? vocab.homePc : null;
    const list = candidates({ mode, vocab, chord, landChord, bodyMax, level, style, prefer, recent, call: mode === 'call', colors });
    // náhodně z nejlepších tří (deterministicky podle semínka)
    const top = list.slice(0, 3);
    const pick = top[Math.floor(rand() * top.length)];
    const order = pick ? [pick, ...list.filter((x) => x !== pick)] : [];
    let made = null;
    for (const c of order) {
      const bodyBeats = parsedMotif(c.m).bodyBeats;
      const notes = realiseMotif(c.m, {
        vocab, chordAt, landChord, startAbs: landAbs - bodyBeats, landAbs, win, prevMidi, remap, homePc: home, opts,
      });
      if (!notes) continue;
      if ((mode === 'phrase' || mode === 'call') && c.m.anchor === 'chord'
        && notes.some((n) => n.part === 'body' && !vocab.pcs.has(n.pc))) continue;
      made = { id: c.id, motif: c.m, notes };
      break;
    }
    if (!made) continue;
    recent.unshift(made.id);
    recent.length = Math.min(recent.length, 2);
    prevMidi = made.notes.at(-1).midi;
    const startNote = made.notes[0];
    const landNote = made.notes.find((n) => n.part === 'land') ?? made.notes.at(-1);
    phrases.push({
      window: w,
      windowStart,
      windowEnd: windowStart + windowBars * beatsPerBar,
      landAbs,
      motifId: made.id,
      motif: made.motif,
      vocab,
      events: made.notes.map((n) => ({ ...n, role: n.part === 'body' ? 'path' : n.part })),
      start: { pc: startNote.pc, role: toneRole(startNote.pc, chordAt(startNote.abs), vocab) },
      land: { pc: landNote.pc, role: toneRole(landNote.pc, landChord, vocab), chord: landChord },
      home: home != null && landNote.pc === home,
    });
  }

  // spojky přes změnu akordu na posledních dobách okna
  const cnId = CONNECTOR[change];
  if (cnId && mode !== 'call') {
    const cn = MOTIFS[cnId];
    const cBeats = parsedMotif(cn).bodyBeats;
    phrases.forEach((ph, i) => {
      const next = phrases[(i + 1) % phrases.length];
      const at = ph.windowEnd - cBeats;
      const target = ph.windowEnd;
      const cur = chordAt(at);
      const nextChord = chordAt(target);
      if (cur.degree === nextChord.degree) return;
      // další fráze musí začít aspoň dobu po cíli spojky
      const nextStart = next.events[0].abs + (next.window <= ph.window ? total : 0);
      if (nextStart < target + 1) return;
      const lastTail = ph.events.filter((e) => e.abs < at);
      const notes = realiseMotif(cn, {
        vocab: vocabAt(cur), chordAt, landChord: nextChord, startAbs: at, landAbs: target, win,
        prevMidi: lastTail.at(-1)?.midi ?? null, opts,
      });
      if (!notes) return;
      // tail fráze zkrátit, aby nepřekrýval spojku
      ph.events = ph.events.filter((e) => e.abs < at).map((e) => ({ ...e, d: Math.min(e.d, at - e.abs) }));
      ph.connector = { id: cnId, motif: cn };
      ph.events.push(...notes.map((n) => ({ ...n, role: 'connector', abs: n.abs })));
    });
  }

  // pořadí tónů a vrchol
  phrases.forEach((ph) => {
    ph.events.sort((a, b) => a.abs - b.abs);
    ph.events.forEach((e, i) => { e.n = i + 1; });
    const body = ph.events.filter((e) => e.role === 'path');
    ph.peak = body.reduce((b, e) => (e.midi + (e.bendSemis || 0) > b.midi + (b.bendSemis || 0) ? e : b), body[0]);
  });
  return { phrases, total };
}

// Rozdělení frází do segmentů plánu (pro zvuk a pulz): beat relativně k segmentu.
export function splitToSegments(phrases, segments, total) {
  const demo = segments.map(() => []);
  for (const ph of phrases) {
    for (const e of ph.events) {
      const a = mod(e.abs, total);
      const i = segments.findIndex((s) => a >= s.start - 1e-9 && a < s.start + s.beats - 1e-9);
      if (i < 0) continue;
      const sg = segments[i];
      const beat = a - sg.start;
      demo[i].push({ ...e, beat, d: Math.min(e.d, sg.beats - beat), phrase: ph.window });
    }
  }
  demo.forEach((list) => list.sort((x, y) => x.beat - y.beat));
  return demo;
}
