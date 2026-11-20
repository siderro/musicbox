// Doprovod – čistá logika mezi daty a přehráváním/zobrazením:
// která sazba a rytmus platí pro kolečko (pamatuje se volba pro každé kolečko),
// hmaty pro kolečko (s cache), časování událostí rytmu v segmentu, režimy a odpočet změny.
// Bez DOM a bez zvuku – používá ho groovebox (js/programs/groove-program.js) i panel (js/ui/comp-panel.js).

import { COMP_WIKI } from '../data/comp-wiki.js';
import { RHYTHMS } from '../data/rhythms.js';
import { applicableSazby, voiceProgression, styleOf, fretString } from './voicing-engine.js';
import { rhythmsFor, rhythmEvents } from './strum.js';
import { analyzeSong } from '../theory/function.js';
import { TUNING } from '../fretboard/neck.js';
import { mod } from '../theory/notes.js';

export const COMP_MODES = ['demo', 'self', 'alt'];

const uniq = (ids) => [...new Set(ids)];

// Sazby v pořadí: nejdřív pořadí z wiki kolečka (jen použitelné), pak zbytek podle stylu.
export function sazbaList(progId, song, analysis = analyzeSong(song)) {
  const applicable = applicableSazby(song, analysis);
  const wiki = COMP_WIKI[progId]?.sazby ?? [];
  return uniq([...wiki.filter((id) => applicable.includes(id)), ...applicable]);
}

// Rytmy, které sedí do taktu kolečka: pořadí z wiki, pak rytmy stylu kolečka, pak ostatní ve stejném taktu.
export function rhythmList(progId, song) {
  const meter = song.progression.meter;
  const all = rhythmsFor(meter);
  const styled = rhythmsFor(meter, styleOf(song));
  const wiki = COMP_WIKI[progId]?.rhythms ?? [];
  return uniq([...wiki.filter((id) => all.includes(id)), ...styled, ...all]);
}

// Uložená volba platí, jen když je v seznamu; jinak první (doporučená).
export const pickRemembered = (saved, list) => (list.includes(saved) ? saved : list[0]);

// Aktuální volba doprovodu podle stavu (store) a kolečka.
export function compChoice(st, song, analysis = analyzeSong(song)) {
  const sazby = sazbaList(st.progression, song, analysis);
  const rhythms = rhythmList(st.progression, song);
  return {
    sazby,
    rhythms,
    sazbaId: pickRemembered(st.sazbaByProgression?.[st.progression], sazby),
    rhythmId: pickRemembered(st.rhythmByProgression?.[st.progression], rhythms),
  };
}

// Nová mapa „kolečko → volba“ (pro store.set); ostatní kolečka zůstanou.
export const remember = (map, progId, id) => ({ ...(map ?? {}), [progId]: id });

// Další / předchozí položka seznamu (klávesy A, R se Shiftem).
export function cycleIn(list, cur, dir) {
  const i = Math.max(0, list.indexOf(cur));
  return list[(i + dir + list.length) % list.length];
}

// Hmaty pro kolečko – výpočet je dražší, proto cache podle kolečka, tóniny a sazby.
const voicedCache = new Map();
export function voicedFor(sazbaId, song, analysis = analyzeSong(song)) {
  const key = `${song.progression.name}|${song.bars.map((b) => b.map((c) => c.symbol).join(',')).join(';')}|${sazbaId}`;
  if (!voicedCache.has(key)) {
    if (voicedCache.size > 40) voicedCache.clear();
    voicedCache.set(key, voiceProgression(sazbaId, song, analysis));
  }
  return voicedCache.get(key);
}

// Kde v cyklu rytmu segment začíná: akord v taktu = meter / počet akordů v taktu,
// rytmus přes víc taktů pokračuje podle čísla taktu kolečka.
export function segmentTiming(rhythmId, { meterBeats, chordsInBar = 1, bar = 0, seg = 0 }) {
  const r = RHYTHMS[rhythmId];
  const beats = meterBeats / chordsInBar;
  const startBeat = (bar % r.bars) * meterBeats + seg * beats;
  return { beats, startBeat };
}

export function segmentEvents(rhythmId, shape, where, { walkTo = null } = {}) {
  return rhythmEvents(rhythmId, shape, { ...segmentTiming(rhythmId, where), walkTo });
}

// Basový přechod k dalšímu akordu (sazba bas + akord): tón o krok od dalšího kořene ze strany,
// odkud basa přichází – nejdřív o půltón (když patří do tóniny nebo do hraného akordu, např. G♯ z E7
// do Am), jinak o celý tón; kdyby to byl kořen hraného akordu, chromaticky (F → F♯ → G).
// Vrací { s, f, midi } na basových strunách blízko ruky, nebo null (stejný kořen, bez basu).
export function bassApproach(shape, next, keyPcs) {
  const from = shape?.bass;
  const to = next?.bass;
  if (!from || !to || mod(from.midi - to.midi, 12) === 0) return null;
  const ok = new Set([...keyPcs, ...shape.notes.map((n) => n.midi % 12)]);
  const dir = from.midi < to.midi ? -1 : 1;
  let midi = [1, 2].map((d) => to.midi + dir * d).find((m) => ok.has(mod(m, 12)));
  if (midi == null || mod(midi - from.midi, 12) === 0) midi = to.midi + dir;
  let best = null;
  for (const s of [to.s, to.s + 1, to.s - 1, from.s]) {
    if (s < 4 || s > 6) continue;
    const f = midi - TUNING[s];
    if (f < 0 || f > 12) continue;
    const cost = (f === 0 ? 0 : Math.abs(f - from.f)) + (s === to.s ? 0 : 0.5);
    if (!best || cost < best.cost) best = { s, f, midi, cost };
  }
  return best && { s: best.s, f: best.f, midi: best.midi };
}

// Přechod jen v sazbě bas + akord a jen před změnou hmatu.
export function walkFor(voiced, analysis, segIdx) {
  if (voiced.sazba.build !== 'bassChord') return null;
  const n = voiced.shapes.length;
  const sh = voiced.shapes[segIdx];
  const next = voiced.shapes[(segIdx + 1) % n];
  if (fretString(sh) === fretString(next)) return null;
  return bassApproach(sh, next, analysis.ctx.keyPcs);
}

// Události, jejichž čas padne do [t0, t1). segStart = čas začátku segmentu v s.
const EPS = 1e-6;
export function dueEvents(events, segStart, secPerBeat, t0, t1) {
  const out = [];
  for (const ev of events) {
    const time = segStart + ev.beat * secPerBeat;
    if (time >= t0 - EPS && time < t1 - EPS) out.push({ ev, time });
  }
  return out;
}

// Události, jejichž doba v segmentu padne do [b0, b1) – okno jednoho kroku grooveboxu v dobách.
// Okna kroků segment rozdělí beze zbytku, takže každá událost zazní právě jednou, i když se
// uprostřed segmentu změní tempo (čas se počítá od začátku kroku, ne od začátku segmentu).
export function eventsInBeats(events, b0, b1) {
  return events.filter((ev) => ev.beat >= b0 - EPS && ev.beat < b1 - EPS);
}

// Hraje v tomto taktu kytara? barCount = kolikátý takt od startu (0, 1, 2 …).
export function guitarPlays(mode, barCount) {
  if (mode === 'self') return false;
  if (mode === 'alt') return barCount % 2 === 0;
  return true;
}

// Odpočet před změnou hmatu: { next, left } když je změna za ≤ 2 doby (u 2dobého segmentu za 1), jinak null.
export function changeAhead(analysis, shapes, cur, beatInSeg) {
  const segs = analysis.segments;
  const seg = segs[cur];
  if (!seg) return null;
  const next = (cur + 1) % segs.length;
  const left = Math.round(seg.beats - beatInSeg);
  const limit = seg.beats > 2 ? 2 : 1;
  if (left < 1 || left > limit) return null;
  const same = fretString(shapes[cur]) === fretString(shapes[next]);
  return same ? null : { next, left };
}

// Události rytmu → vstup pro renderTab (js/fretboard/render-tab.js).
export function tabOf(events, beats) {
  const sorted = [...events].sort((a, b) => a.beat - b.beat);
  const starts = [...new Set(sorted.map((e) => e.beat))];
  const out = starts.map((beat, i) => {
    const at = sorted.filter((e) => e.beat === beat);
    const notes = [...new Map(at.flatMap((e) => e.notes).map((n) => [n.s, n])).values()];
    const d = (starts[i + 1] ?? beats) - beat;
    return { start: beat, d, notes: notes.map((n) => ({ s: n.s, f: n.f })), t: '' };
  });
  return { events: out, beats };
}
