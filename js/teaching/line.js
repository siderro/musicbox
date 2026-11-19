// Linka (lick zapsaný vůči pruhu): tóny se čtou ze zdroje pruhu v akordu, přes který zrovna zní,
// takže tentýž lick sedí v každé tónině i nad každým akordem pruhu. Čisté funkce.
//
// Zápis: tokeny oddělené mezerou, TÓN[oktáva][&3|&6][technika]:DÉLKA
//   1 … 9    n-tý tón zdroje pruhu (Em pentatonika: 1 = E, 2 = G …), nejbližší k předchozímu tónu
//   t        cílový tón akordu, který teď zní (tercie, kořen, kvinta, septima – co je ve zdroji a nejblíž)
//   L        cílový tón DALŠÍHO akordu ve zdroji jeho pruhu (za „|“ = akordu, který už zní)
//   k        charakteristický tón módu (dórská 6, mixolydická ♭7 …)
//   c3 c9 …  tón akordu podle čísla (c6, c9 = barvy), i když není ve zdroji
//   > < >> <<  o jeden / dva tóny zdroje nahoru / dolů od předchozího
//   s+ s-    tón tóniny nad / pod NÁSLEDUJÍCÍM tónem (obal)
//   x+ x-    půltón nad / pod následujícím tónem (chromatický nájezd)
//   w        chůze po zdroji k následujícímu tónu, vyplní délku osminami
//   r        pauza
//   oktáva   ' = nad předchozím tónem, , = pod ním, = = nejblíž okna ruky (jinak nejbližší)
//   &3 &6    druhý hlas: tercie / sexta tóniny pod tónem
//   technika ~ vibrato, b bend o celý tón, h p / \ k následujícímu tónu (před i za délkou: t:2~)
//   |        taktová čára změny akordu: co je za ní, zní už přes další akord

import { TUNING, MAX_FRET } from '../fretboard/neck.js';
import { mod } from '../theory/notes.js';
import { degreeTone } from '../theory/harmony.js';
import { MODE_CHAR } from './approach.js';

const TOKEN = /^(t|L|k|c\d{1,2}|>>|<<|>|<|s[+-]|x[+-]|w|r|[1-9])(['’,=]*)(&[36])?([~bhp/\\]?):(\d*\.?\d+)([~bhp/\\]?)$/;
const DEFERRED = /^(s[+-]|x[+-]|w)$/;
const LOW = 40;
const HIGH = 88;

export function parseLine(str) {
  const tokens = [];
  let bar = -1;
  for (const raw of str.trim().split(/\s+/)) {
    if (raw === '|') {
      bar = tokens.length;
      continue;
    }
    const m = TOKEN.exec(raw);
    if (!m) throw new Error(`neznámý token „${raw}“`);
    const [, pitch, oct, dyad, tech, d, techAfter] = m;
    tokens.push({ pitch, up: (oct.match(/['’]/g) ?? []).length, down: (oct.match(/,/g) ?? []).length, home: oct.includes('='), dyad: dyad ? Number(dyad[1]) : 0, tech: tech || techAfter || null, d: Number(d) });
  }
  return { tokens, bar };
}

const lineBeats = (tokens) => tokens.reduce((a, t) => a + t.d, 0);

// Buňka pro segment jiné délky: delší segment se doplní pauzou, kratší zkrátí –
// poslední tón buňky (nájezd na další akord) zůstává vždy.
function fitCell(tokens, beats) {
  const total = lineBeats(tokens);
  if (Math.abs(total - beats) < 1e-6) return tokens;
  if (total < beats) return [...tokens, { pitch: 'r', up: 0, down: 0, dyad: 0, tech: null, d: beats - total }];
  const last = tokens[tokens.length - 1];
  const room = beats - Math.min(last.d, beats / 2);
  const out = [];
  let t = 0;
  for (const tok of tokens.slice(0, -1)) {
    if (t + tok.d > room + 1e-6) break;
    out.push({ ...tok });
    t += tok.d;
  }
  if (!out.length) out.push({ ...tokens[0], d: room });
  else if (t < room) out[out.length - 1].d += room - t;
  out.push({ ...last, d: beats - room });
  return out;
}

const pitchesOf = (pcs) => {
  const out = [];
  for (let m = LOW - 4; m <= HIGH + 4; m++) if (pcs.has(mod(m, 12))) out.push(m);
  return out;
};

// registr: bez tahu ke středu by dlouhá linka pomalu ujela nahoru nebo dolů
let pull = null;
let home = 60;

function nearest(pc, prev, tok) {
  const cands = [];
  for (let m = LOW; m <= HIGH; m++) if (mod(m, 12) === pc) cands.push(m);
  let best;
  if (tok?.home) best = cands.reduce((a, m) => (Math.abs(m - home) < Math.abs(a - home) ? m : a));
  else if (tok?.up) best = cands.filter((m) => m > prev)[tok.up - 1] ?? cands[cands.length - 1];
  else if (tok?.down) best = cands.filter((m) => m < prev).reverse()[tok.down - 1] ?? cands[0];
  else {
    const cost = (m) => Math.abs(m - prev) + (pull == null ? 0 : Math.abs(m - pull) * 0.25);
    best = cands.reduce((a, m) => (cost(m) < cost(a) || (cost(m) === cost(a) && m > a) ? m : a));
  }
  return best;
}

const PRIORITY = { 3: 0, 1: 1, 5: 2, 7: 3 };
const ivNum = (iv) => Number(String(iv).replace(/[b#]/g, '')) % 7 || 7;

// cílový tón akordu ve zdroji: blízko předchozímu tónu, tercie má přednost
function target(chord, source, prev, tok) {
  let cands = chord.tones.filter((t) => source.pcs.has(t.pc));
  if (!cands.length) cands = chord.tones;
  let best = null;
  const dom = chord.intervals.includes('3') && chord.intervals.includes('b7');
  for (const t of cands) {
    const m = nearest(t.pc, prev, tok);
    const num = ivNum(t.interval);
    // septima dominanty je vodicí tón (sjede na tercii tóniky) – skoro stejně důležitá jako tercie
    const prio = dom && num === 7 ? 0.5 : PRIORITY[num] ?? 4;
    const score = Math.abs(m - prev) + prio * 1.5;
    if (!best || score < best.score) best = { m, score };
  }
  return best.m;
}

function step(pitches, prev, n) {
  if (n > 0) {
    const i = pitches.findIndex((m) => m > prev);
    return pitches[Math.min(pitches.length - 1, (i < 0 ? pitches.length - 1 : i) + n - 1)];
  }
  let i = pitches.length - 1;
  while (i > 0 && pitches[i] >= prev) i--;
  return pitches[Math.max(0, i + n + 1)];
}

// chůze po tónech zdroje z prev k cíli: n osmin, poslední o krok vedle cíle.
// Když je cíl moc blízko, melodie nejdřív vystoupá a cíl pak obalí z druhé strany.
function walk(pitches, prev, goal, n) {
  const dir = goal >= prev ? 1 : -1;
  const between = pitches.filter((m) => (dir > 0 ? m > prev && m < goal : m < prev && m > goal));
  if (dir < 0) between.reverse();
  if (between.length >= n) return between.slice(between.length - n);
  const side = prev > goal ? 1 : prev < goal ? -1 : 1;
  const half = Math.floor((n - 1) / 2);
  const offsets = [];
  for (let k = 1; k <= half + 1; k++) offsets.push(k);
  for (let k = half; k >= 1; k--) offsets.push(k);
  while (offsets.length < n) offsets.push(-1);
  return offsets.slice(0, n).map((o) => step(pitches, goal, side * o));
}

function lowerVoice(m, kind, keyPcs) {
  const range = kind === 6 ? [8, 9] : [3, 4];
  for (const r of range) if (keyPcs.has(mod(m - r, 12))) return m - r;
  return m - range[1];
}

// Rozmístění na hmatník: v okně ruky, bez zbytečného skákání po strunách,
// legato a slide na stejné struně.
function place(events, win) {
  let prev = null;
  const out = (f) => Math.max(0, win.lo - f, f - win.hi);
  const playable = (m) => m >= TUNING[6] && m <= TUNING[1] + MAX_FRET;
  for (const ev of events) {
    if (ev.rest) continue;
    // tón mimo hmatník (dlouhá chůze) o oktávu zpět
    while (ev.midis.some((m) => m > TUNING[1] + MAX_FRET)) ev.midis = ev.midis.map((m) => m - 12);
    while (ev.midis.some((m) => !playable(m))) ev.midis = ev.midis.map((m) => m + 12);
    const [top, low] = ev.midis;
    let best = null;
    for (let s = 1; s <= 6; s++) {
      const f = top - TUNING[s];
      if (f < 0 || f > MAX_FRET) continue;
      let notes = [{ s, f, midi: top }];
      let cost = out(f) * 4 + (f === 0 && win.lo > 2 ? 3 : 0);
      if (low != null) {
        const s2 = s + (ev.dyad === 6 ? 2 : 1);
        const f2 = low - TUNING[s2];
        if (s2 > 6 || f2 < 0 || f2 > MAX_FRET) continue;
        notes = [...notes, { s: s2, f: f2, midi: low }];
        cost += out(f2) * 4 + Math.abs(f2 - f) * 0.5;
      }
      if (prev) {
        cost += Math.abs(s - prev.s) * 0.7 + Math.max(0, Math.abs(f - prev.f) - 3) * 0.8;
        if (['h', 'p', '/', '\\'].includes(prev.t) && s !== prev.s) cost += 8;
      }
      if (!best || cost < best.cost) best = { cost, notes };
    }
    ev.notes = best ? best.notes : [];
    prev = best ? { s: best.notes[0].s, f: best.notes[0].f, t: ev.t } : prev;
  }
}

// Linka → události pro tabulaturu a přehrávač.
//   res      vyřešený přístup (resolveApproach)
//   startSeg segment, ve kterém linka začíná (u linky s „|“ segment PŘED změnou)
//   each     buňka se zopakuje přes každý akord kolečka (jedno kolo + dopad)
//   win      okno ruky { lo, hi }
export function realizeLine(def, { res, startSeg, win, each = false }) {
  const { segments, scale } = res;
  const keyPcs = new Set(scale.map((t) => t.pc));
  const nSeg = segments.length;
  const parsed = parseLine(def.line);

  // tokeny s časem a segmentem
  const stream = [];
  let offset = 0;
  if (each) {
    let t = 0;
    for (let k = 0; k < nSeg; k++) {
      const seg = (startSeg + k) % nSeg;
      for (const tok of fitCell(parsed.tokens, segments[seg].beats)) {
        stream.push({ ...tok, seg, start: t });
        t += tok.d;
      }
    }
    const home = startSeg % nSeg;
    stream.push({ pitch: 't', up: 0, down: 0, dyad: 0, tech: '~', d: Math.min(2, segments[home].beats), seg: home, start: t });
  } else {
    const body = parsed.bar < 0 ? parsed.tokens : parsed.tokens.slice(0, parsed.bar);
    const land = parsed.bar < 0 ? [] : parsed.tokens.slice(parsed.bar);
    const bodyBeats = lineBeats(body);
    offset = parsed.bar < 0 ? 0 : segments[startSeg].beats - bodyBeats;
    // tělo: segment podle času (dlouhá linka bez „|“ přejde do dalších akordů)
    let t = 0;
    let seg = startSeg;
    let segEnd = segments[startSeg].beats - offset;
    for (const tok of body) {
      if (parsed.bar < 0) {
        while (t >= segEnd - 1e-6) {
          seg = (seg + 1) % nSeg;
          segEnd += segments[seg].beats;
        }
      }
      stream.push({ ...tok, seg, start: t });
      t += tok.d;
    }
    seg = (startSeg + 1) % nSeg;
    segEnd = t + segments[seg].beats;
    for (const tok of land) {
      while (t >= segEnd - 1e-6) {
        seg = (seg + 1) % nSeg;
        segEnd += segments[seg].beats;
      }
      stream.push({ ...tok, seg, start: t, landed: true });
      t += tok.d;
    }
  }

  const sourceOf = (seg) => res.sourceAt(res.laneOf[seg], seg);
  const centre = TUNING[3] + Math.round((win.lo + win.hi) / 2);
  pull = centre + 3;
  home = centre - 7; // linka od „=“ stoupá, tak začíná v dolní části okna
  let prev = centre;
  const midis = new Array(stream.length).fill(null);
  const pending = [];
  const resolvePending = (goal) => {
    // obal i chůze míří na následující pevný tón
    const next = goal;
    for (const i of pending) {
      const tok = stream[i];
      const src = sourceOf(tok.seg);
      if (tok.pitch === 'x+') midis[i] = next + 1;
      else if (tok.pitch === 'x-') midis[i] = next - 1;
      else if (tok.pitch === 's+') midis[i] = step(pitchesOf(keyPcs), next, 1);
      else if (tok.pitch === 's-') midis[i] = step(pitchesOf(keyPcs), next, -1);
      else if (tok.pitch === 'w') midis[i] = { walk: true, goal: next, src };
    }
    pending.length = 0;
  };

  stream.forEach((tok, i) => {
    if (tok.pitch === 'r') return;
    if (DEFERRED.test(tok.pitch)) {
      pending.push(i);
      return;
    }
    const seg = tok.seg;
    const src = sourceOf(seg);
    const chord = segments[seg].chord;
    // předchozí znějící tón pro „nejbližší“: po odložených tokenech se počítá od posledního pevného
    let m;
    if (/^[1-9]$/.test(tok.pitch)) {
      const tone = src.tones[(Number(tok.pitch) - 1) % src.tones.length];
      m = nearest(tone.pc, prev, tok);
    } else if (tok.pitch === 't') {
      m = target(chord, src, prev, tok);
    } else if (tok.pitch === 'L') {
      // za „|“ už akord zní – L je jeho cíl; před ní je to cíl akordu, který přijde
      const nxt = tok.landed ? seg : (seg + 1) % segments.length;
      m = target(segments[nxt].chord, sourceOf(nxt), prev, tok);
    } else if (tok.pitch === 'k') {
      const iv = MODE_CHAR[src.id];
      const tone = iv && src.tones.find((x) => x.interval === iv);
      m = tone ? nearest(tone.pc, prev, tok) : target(chord, src, prev, tok);
    } else if (tok.pitch.startsWith('c')) {
      m = nearest(degreeTone(chord, Number(tok.pitch.slice(1)), scale).pc, prev, tok);
    } else {
      const n = (tok.pitch.length) * (tok.pitch[0] === '>' ? 1 : -1);
      m = step(pitchesOf(src.pcs), prev, n);
    }
    if (pending.length) resolvePending(m);
    midis[i] = m;
    prev = m;
  });
  if (pending.length) resolvePending(prev);

  // rozbalení chůze na osminy
  const events = [];
  let walkFrom = centre;
  stream.forEach((tok, i) => {
    const m = midis[i];
    if (tok.pitch === 'r') {
      events.push({ start: tok.start, d: tok.d, rest: true, notes: [], midis: [], seg: tok.seg });
      return;
    }
    if (m && m.walk) {
      const n = Math.max(1, Math.round(tok.d / 0.5));
      const path = walk(pitchesOf(m.src.pcs), walkFrom, m.goal, n);
      path.forEach((p, j) => events.push({ start: tok.start + (j * tok.d) / n, d: tok.d / n, midis: [p], seg: tok.seg, t: null, bend: 1 }));
      walkFrom = path[path.length - 1];
      return;
    }
    const pair = tok.dyad ? [m, lowerVoice(m, tok.dyad, keyPcs)] : [m];
    events.push({ start: tok.start, d: tok.d, midis: pair, dyad: tok.dyad, seg: tok.seg, t: tok.tech, bend: 1 });
    walkFrom = m;
  });

  // celou linku posunout o oktávu, aby co nejvíc tónů leželo v okně ruky
  const fit = (shift) => events.reduce((a, e) => a + e.midis.reduce((b, m) => {
    const fr = [1, 2, 3, 4, 5, 6].map((s) => m + shift - TUNING[s]).filter((f) => f >= 0 && f <= MAX_FRET);
    return b + (fr.length ? Math.min(...fr.map((f) => Math.max(0, win.lo - f, f - win.hi))) : 20);
  }, 0), 0);
  const shift = [0, -12, 12].reduce((a, s) => (fit(s) < fit(a) ? s : a), 0);
  if (shift) events.forEach((e) => { e.midis = e.midis.map((m) => m + shift); });

  place(events, win);
  const beats = stream.reduce((a, t) => Math.max(a, t.start + t.d), 0);
  return { events, beats, offset, startSeg, landSeg: parsed.bar < 0 ? null : (startSeg + 1) % nSeg };
}

export { lineBeats };
export const lineHasLanding = (def) => def.line ? parseLine(def.line).bar >= 0 : false;
