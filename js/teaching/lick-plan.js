// Licky u přístupu: které patří ke kterému pruhu, přes který akord zazní a jak leží na hmatníku.
// Lick se vždy kotví ke zdroji pruhu v akordu, přes který se hraje – nikdy ke „kořeni tóniny obecně“.

import { LICKS } from '../data/licks.js';
import { resolveLick } from '../fretboard/positions.js';
import { realizeLine, parseLine } from './line.js';

const keyKind = (ctx) => (ctx.blues ? 'blues' : ctx.mode);
const allowed = (id, ctx) => LICKS[id] && (!LICKS[id].when || LICKS[id].when.includes(keyKind(ctx)));

// Licky pro pruh (index) nebo 'cycle' (přes celé kolečko).
export function licksFor(res, lane) {
  const map = res.approach.licks ?? {};
  if (lane === 'cycle') return (map.cycle ?? []).filter((id) => allowed(id, res.ctx));
  const l = res.lanes[lane];
  if (!l) return [];
  // pruh „akord“, který přístup přidal sám, dostane licky přístupu Od tercie
  const ids = l.auto ? ['otArp'] : [...(map[l.id] ?? []), ...(map['*'] ?? [])];
  return [...new Set(ids)].filter((id) => allowed(id, res.ctx));
}

const bodyBeats = (def) => {
  const { tokens, bar } = parseLine(def.line);
  return (bar < 0 ? [] : tokens.slice(0, bar)).reduce((a, t) => a + t.d, 0);
};

// Segmenty, přes které může lick začít, v pořadí od `from`. Vrací [{ seg, offset }],
// offset = o kolik dob po začátku segmentu lick začíná (záporný = předtaktí).
export function startOptions(id, res, lane, from = 0) {
  const def = LICKS[id];
  const { segments, laneOf } = res;
  const n = segments.length;
  const order = Array.from({ length: n }, (_, k) => (from + k) % n);
  if (lane === 'cycle') {
    return order.filter((k) => segments[k].seg === 0).map((seg) => ({ seg, offset: 0 }));
  }
  const inLane = order.filter((k) => laneOf[k] === lane);
  if (def.line && def.change) {
    const body = bodyBeats(def);
    // nejdřív změna pruhu (G7 → C), jinak aspoň změna akordu ve stejném pruhu (F → G7)
    const leavesLane = inLane.filter((k) => laneOf[(k + 1) % n] !== lane);
    const leavesChord = inLane.filter((k) => segments[(k + 1) % n].chord.degree !== segments[k].chord.degree);
    const pickFrom = leavesLane.length ? leavesLane : leavesChord.length ? leavesChord : inLane;
    return pickFrom.map((seg) => ({ seg, offset: segments[seg].beats - body }));
  }
  const starts = inLane.filter((k) => laneOf[(k - 1 + n) % n] !== lane || segments[(k - 1 + n) % n].chord.degree !== segments[k].chord.degree);
  return (starts.length ? starts : inLane).map((seg) => ({ seg, offset: 0 }));
}

// Lick → události na hmatníku přes konkrétní segment.
export function realizeLick(id, res, lane, seg, win) {
  const def = LICKS[id];
  if (def.line) {
    return { def, ...realizeLine(def, { res, startSeg: seg, win, each: lane === 'cycle' || !!def.each }) };
  }
  // klasický lick v tabulatuře: kořen = kořen zdroje pruhu
  const src = res.sourceAt(lane === 'cycle' ? res.laneOf[seg] : lane, seg);
  const resolved = resolveLick(def, src.rootPc, (win.lo + win.hi) / 2);
  const { segments } = res;
  let k = seg;
  let end = segments[seg].beats;
  resolved.events.forEach((e) => {
    while (e.start >= end - 1e-6) {
      k = (k + 1) % segments.length;
      end += segments[k].beats;
    }
    e.seg = k;
  });
  return { def, ...resolved, offset: 0, startSeg: seg, landSeg: null };
}
