// Plán výuky pro celé kolečko: pro každý akord nápad, jeho polohy v okně ruky,
// ukázková fráze v rytmu a cílové tóny pro příští změnu. Počítá se jednou při změně
// nastavení, ne při každé době.

import { keyScale, guideTones, degreeTone, chordFamily } from '../theory/harmony.js';
import { nextChordAfter } from '../programs/song.js';
import { ideaFor } from './ideas.js';
import { handWindow, placeTones, dyadPairs } from './fingering.js';
import { buildPhrases, splitToSegments } from './phrases.js';

// Režimy, ve kterých ukázku tvoří skutečné fráze z motivů (ne dvojhlasy).
export const PHRASE_MODES = new Set(['phrase', 'third', 'fifth', 'root', 'call']);

export const CHANGE_TYPES = ['guide', 'common', 'approach', 'root', 'off'];

const semiDist = (a, b) => Math.min(Math.abs(a - b), 12 - Math.abs(a - b));
const nearest = (notes, midi) => notes.reduce((best, n) => (Math.abs(n.midi - midi) < Math.abs(best.midi - midi) ? n : best));
const sameChord = (a, b) => a.degree === b.degree;

// Ukázka v rytmu: tóny nápadu nahoru a dolů od tónu nejbližšího konci předchozí fráze.
// Při zapnutých barvách skončí fráze delším tónem 6 nebo 9.
export function demoPhrase(notes, { beats, leadBeats, meterBeats, fromMidi, color }) {
  if (!notes.length) return [];
  const unit = meterBeats === 3 ? 1 : 0.5;
  const room = Math.max(unit, beats - leadBeats);
  const count = Math.max(1, Math.round(room / unit));
  const sorted = [...notes].sort((a, b) => a.midi - b.midi || a.s - b.s);
  let i = sorted.indexOf(fromMidi == null ? sorted[0] : nearest(sorted, fromMidi));
  let dir = i >= sorted.length - 1 ? -1 : 1;
  const events = [];
  for (let k = 0; k < count; k++) {
    events.push({ beat: k * unit, d: unit, ...pick(sorted[i]), role: 'idea' });
    if (sorted.length > 1) {
      if (i + dir < 0 || i + dir >= sorted.length) dir = -dir;
      i += dir;
    }
  }
  if (color && events.length >= 2) {
    const last = events[events.length - 2];
    const target = nearest(color, last.midi);
    events.splice(events.length - 2, 2, { beat: last.beat, d: unit * 2, ...pick(target), role: 'color' });
  }
  return events;
}

const pick = (n) => ({ s: n.s, f: n.f, midi: n.midi, pc: n.pc });

export function changeTargets(cur, next, type, scale, win, fromMidi) {
  const empty = { type, targets: [], links: [], approach: [], hold: [] };
  if (type === 'off') return empty;
  const inWin = (tones) => placeTones(tones, win);

  if (type === 'common') {
    const common = cur.tones.filter((t) => next.tones.some((u) => u.pc === t.pc));
    if (common.length) {
      const hold = inWin(common);
      return { ...empty, hold, cue: { key: 'hold', note: common[0].name, chord: next.symbol } };
    }
    type = 'guide';
  }

  if (type === 'root') {
    const root = next.tones[0];
    return { ...empty, type, targets: inWin([{ ...root, num: 1 }]), cue: { key: 'landOn', note: root.name, num: '1', chord: next.symbol } };
  }

  if (type === 'approach') {
    const third = degreeTone(next, 3, scale);
    const targets = inWin([third]);
    if (!targets.length) return empty;
    const target = fromMidi == null ? targets[0] : nearest(targets, fromMidi);
    const approach = target.f > 0 ? [{ s: target.s, f: target.f - 1 }] : [];
    return { ...empty, type, targets: [target], approach, cue: { key: 'approach', note: third.name, chord: next.symbol } };
  }

  // vodicí tóny: tercie a septimy, spojené s nejbližším vodicím tónem dalšího akordu
  const curG = guideTones(cur, scale);
  const nextG = guideTones(next, scale);
  const targets = inWin(nextG);
  const links = [];
  const moves = [];
  for (const g of curG) {
    const to = nextG.reduce((best, t) => (semiDist(t.pc, g.pc) < semiDist(best.pc, g.pc) ? t : best));
    const dist = semiDist(to.pc, g.pc);
    if (dist > 2) continue;
    moves.push({ g, to, dist });
    for (const from of inWin([g])) {
      // šipka jen na skutečně blízký tón (do celého tónu) na stejné nebo vedlejší struně
      const dest = targets.filter((t) => t.pc === to.pc && Math.abs(t.s - from.s) <= 1 && Math.abs(t.midi - from.midi) <= 2);
      if (!dest.length) continue;
      const d = nearest(dest, from.midi);
      links.push({ from: pick(from), to: pick(d), semis: d.midi - from.midi });
    }
  }
  // pokyn: přednostně tón, který se opravdu pohne (G → F), ne společný tón (C → C)
  moves.sort((a, b) => (a.dist === 0) - (b.dist === 0) || a.dist - b.dist);
  const m = moves[0];
  const cue = m && m.dist > 0
    ? { key: 'resolve', from: m.g.name, note: m.to.name, num: m.to.num === 3 ? '3' : '7', chord: next.symbol }
    : m ? { key: 'hold', note: m.to.name, chord: next.symbol }
      : { key: 'landOn', note: nextG[0].name, num: '3', chord: next.symbol };
  return { ...empty, type: 'guide', targets, links, cue };
}

export function buildPlan({ song, beatsPerBar = 4, teach, centre, phrase = null }) {
  const scale = keyScale(song.tonic, song.progression.mode);
  const win = handWindow(centre);
  const opts = { colorSix: teach.colorSix };
  const segments = [];
  const byBar = [];
  let start = 0;
  song.bars.forEach((chords, bar) => {
    byBar[bar] = [];
    chords.forEach((chord, seg) => {
      const beats = beatsPerBar / chords.length;
      byBar[bar][seg] = segments.length;
      segments.push({ bar, seg, start, beats, chord, next: nextChordAfter(song.bars, bar, seg) });
      start += beats;
    });
  });

  let fromMidi = null;
  // dva průchody, aby i první akord navazoval na konec kolečka
  for (let pass = 0; pass < 2; pass++) {
    for (const sg of segments) {
      const idea = ideaFor(sg.chord, teach.idea, scale, opts);
      const placed = placeTones(idea.tones, win).map((n) => ({ ...n, role: n.pc === idea.tones[0].pc ? 'idea-root' : 'idea' }));
      const colors = teach.layers.colors ? placeTones(idea.colors, win).map((n) => ({ ...n, role: 'color' })) : [];
      const pairs = idea.type === 'dyad3' || idea.type === 'dyad6' ? dyadPairs(sg.chord.tones, idea.type, scale, win) : null;
      const changes = !sameChord(sg.chord, sg.next);
      const leadBeats = changes ? Math.min(sg.beats - 1, sg.beats < 4 || beatsPerBar < 4 ? 1 : teach.leadBeats) : 0;
      const change = changes ? changeTargets(sg.chord, sg.next, teach.change, scale, win, fromMidi) : null;
      const colorOk = colors.length && chordFamily(sg.chord) !== 'dom';
      const demo = demoPhrase(placed, { beats: sg.beats, leadBeats, meterBeats: beatsPerBar, fromMidi, color: colorOk ? colors : null });
      if (demo.length) fromMidi = demo[demo.length - 1].midi;
      Object.assign(sg, { idea, window: win, placed, colors, pairs, demo, change, leadBeats });
    }
  }

  // fráze z motivů: nahradí jednoduchou ukázku
  let phrases = null;
  if (phrase && PHRASE_MODES.has(teach.idea)) {
    const mode = teach.idea === 'call' ? 'call' : teach.idea;
    const built = buildPhrases({
      song, segments, beatsPerBar, mode, change: teach.change, style: phrase.style, level: teach.level ?? 2,
      win, seed: teach.seed ?? 0, vocabAt: phrase.vocabAt, preferAt: phrase.preferAt, colors: teach.layers.colors, opts,
    });
    phrases = built.phrases;
    const demos = splitToSegments(phrases, segments, built.total);
    segments.forEach((sg, i) => { sg.demo = demos[i]; });
  }
  return { segments, byBar, beatsPerBar, scale, window: win, phrases, total: start };
}

// Kde jsme: segment, zbývající doby a odpočet před změnou.
export function phaseAt(plan, bar, seg, beat, { freeze = false } = {}) {
  const index = plan.byBar[bar]?.[seg];
  if (index == null) return null;
  const sg = plan.segments[index];
  const beatInSeg = beat - seg * sg.beats;
  const beatsLeft = sg.beats - beatInSeg;
  const countdown = !freeze && sg.change && sg.leadBeats > 0 && beatsLeft <= sg.leadBeats ? beatsLeft : null;
  return { index, segment: sg, beatInSeg, beatsLeft, countdown };
}

// Segmenty od aktuálního dál (pro časovou osu).
export function upcoming(plan, index, n = 3) {
  return Array.from({ length: n }, (_, k) => plan.segments[(index + k) % plan.segments.length]);
}

// Místo pro budoucí zpětnou vazbu z mikrofonu: co je teď „správně“.
export function expectedAt(plan, index) {
  const sg = plan.segments[index];
  return { pcs: new Set(sg.idea.tones.map((t) => t.pc)), targets: sg.change?.targets ?? [] };
}
