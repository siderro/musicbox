// Engine sazeb: ze sazby (js/data/voicings.js) a kolečka udělá hmaty na kytaře – ke každému akordu
// kandidáty v rozpětí 4 pražců a přes celé kolečko (cyklicky, poslední → první) vybere ty,
// při kterých se ruka a hlasy hýbou nejmíň. Čisté funkce.

import { SAZBY, COMP_ORDER, GROOVE_STYLE, OPEN, COLOR_TYPES } from '../data/voicings.js';
import { TUNING, MAX_FRET } from '../fretboard/neck.js';
import { analyzeSong } from '../theory/function.js';
import { chordFamily } from '../theory/harmony.js';
import { spellIntervals } from '../theory/intervals.js';
import { mod, noteName, parseNote, pcOf } from '../theory/notes.js';

const SPAN = 3; // nejvyšší − nejnižší hmatný pražec (4 pražce pod rukou)
const MAX_CANDS = 24;

const TYPE_KEYS = {
  '1,3,5': '', '1,b3,5': 'm', '1,3,5,b7': '7', '1,3,5,7': 'maj7', '1,b3,5,b7': 'm7', '1,b3,5,7': 'mmaj7',
  '1,3,5,6': '6', '1,b3,5,6': 'm6', '1,3,5,b7,9': '9', '1,b3,5,b7,9': 'm9', '1,3,5,9': 'add9', '1,b3,5,9': 'madd9',
  '1,2,5': 'sus2', '1,4,5': 'sus4', '1,4,5,b7': '7sus4', '1,b3,b5': 'dim', '1,b3,b5,bb7': 'dim7', '1,b3,b5,b7': 'm7b5',
  '1,3,5,b7,#9': '7#9', '1,3,5,b7,b9': '7b9', '1,3,#5': 'aug', '1,3,#5,b7': '7#5',
};
export const typeKey = (chord) => TYPE_KEYS[chord.intervals.join(',')] ?? 'other';

const num = (iv) => Number(String(iv).replace(/\D/g, ''));
const fold = (n) => (n > 7 ? n - 7 : n);

// Role z tvaru ('1', '3', '7', 'b9' …) → tón: přesná shoda, jinak podle čísla (3 = tercie velká i malá,
// u sus akordu kvarta/sekunda), jinak tón, který sazba smí přidat.
function roleTone(role, tones, extra) {
  const exact = tones.find((t) => t.interval === role);
  if (exact) return exact;
  if (/^\d+$/.test(role)) {
    const f = fold(Number(role));
    const same = tones.find((t) => fold(num(t.interval)) === f);
    if (same) return same;
    if (f === 3) {
      const sus = tones.find((t) => [2, 4].includes(fold(num(t.interval))));
      if (sus) return sus;
    }
  }
  return extra?.(role) ?? null;
}

// 'x 1 5 7 3 x' → sloty [{ s, alts }] od struny 6 k 1
const parseGrip = (shape) => shape.trim().split(/\s+/)
  .map((tok, i) => ({ s: 6 - i, alts: tok.split('|') }))
  .filter((sl) => sl.alts[0] !== 'x');

function* product(lists, i = 0, acc = []) {
  if (i === lists.length) { yield acc; return; }
  for (const x of lists[i]) yield* product(lists, i + 1, [...acc, x]);
}

// Prstoklad: rozpětí, barré, počet prstů. Vrátí { lo, hi, barre } nebo null (nehratelné).
// Sousední struny na stejném pražci zahraje jeden prst (malé barré); velké barré ukazovákem na nejnižším
// pražci jde jen přes struny, které všechny znějí a nemají nižší pražec.
const runs = (notes, f) => notes.filter((n) => n.f === f).reduce((k, n, i, at) => k + (i && at[i - 1].s === n.s + 1 ? 0 : 1), 0);

export function fingering(notes) {
  const fr = notes.filter((n) => n.f > 0);
  if (!fr.length) return { lo: 0, hi: 0, barre: null };
  const lo = Math.min(...fr.map((n) => n.f));
  const hi = Math.max(...fr.map((n) => n.f));
  if (hi - lo > SPAN) return null;
  const at = fr.filter((n) => n.f === lo);
  const from = Math.max(...at.map((n) => n.s));
  const to = Math.min(...at.map((n) => n.s));
  const byS = new Map(notes.map((n) => [n.s, n]));
  let canBarre = at.length >= 2;
  for (let s = to; s <= from; s++) if (!byS.has(s) || byS.get(s).f < lo) canBarre = false;
  const frets = [...new Set(fr.map((n) => n.f))];
  const loose = frets.reduce((k, f) => k + runs(fr, f), 0);
  const barred = canBarre ? 1 + frets.filter((f) => f > lo).reduce((k, f) => k + runs(fr, f), 0) : Infinity;
  if (Math.min(loose, barred) > 4) return null;
  const barre = canBarre && (loose > 4 || at.length >= 3 || from - to >= 3) ? { f: lo, from, to } : null;
  return { lo, hi, barre };
}

function makeShape(placed) {
  const notes = placed
    .map(({ s, f, tone }) => ({ s, f, midi: TUNING[s] + f, interval: tone.interval, name: tone.name, pc: tone.pc, added: !!tone.added }))
    .sort((a, b) => b.s - a.s);
  const fing = fingering(notes);
  if (!fing) return null;
  const used = new Set(notes.map((n) => n.s));
  return { notes, muted: [6, 5, 4, 3, 2, 1].filter((s) => !used.has(s)), ...fing };
}

// '7|6|1' → první role, kterou akord má (nebo smí přidat); pozdější volba = vyšší cena
const firstTone = (alts, tones, extra) => {
  for (let i = 0; i < alts.length; i++) {
    const tone = roleTone(alts[i], tones, extra);
    if (tone) return [{ tone, pen: i }];
  }
  return [];
};

// Všechny hratelné polohy tvaru na hmatníku. Prázdné struny jen u hmatů do 4. pražce.
function place(slots, tones, { extra, needs, rootBass, noOpen } = {}) {
  const choices = slots.map(({ s, alts }) => ({
    s,
    opts: alts[0] === '*' ? tones.map((tone) => ({ tone, pen: 0 })) : firstTone(alts, tones, extra),
  }));
  if (choices.some((c) => !c.opts.length)) return [];
  const out = new Map();
  for (let w = 1; w + SPAN <= MAX_FRET; w++) {
    const per = choices.map(({ s, opts }) => opts.flatMap(({ tone, pen }) => {
      const res = [];
      for (let f = w === 1 && !noOpen ? 0 : w; f <= w + SPAN; f++) if (mod(TUNING[s] + f - tone.pc, 12) === 0) res.push({ s, f, tone, pen });
      return res;
    }));
    if (per.some((p) => !p.length)) continue;
    for (const combo of product(per)) {
      const key = combo.map((n) => `${n.s}:${n.f}`).join(' ');
      if (out.has(key)) continue;
      if (rootBass && combo[0].tone.interval !== '1') continue;
      if (needs && !needs.every((pc) => combo.some((n) => n.tone.pc === pc))) continue;
      const shape = makeShape(combo);
      if (shape) out.set(key, { ...shape, pen: combo.reduce((a, n) => a + n.pen, 0) });
    }
  }
  return [...out.values()];
}

// Záchrana pro druhy akordů bez vlastních tvarů: kořen v basu, ostatní tóny akordu na sousedních strunách.
const GENERIC = ['x 1 * * * x', '1 * * * x x', 'x x 1 * * *', 'x 1 * * x x', '1 * * x x x', 'x x 1 * * x'];
function genericCands(chord) {
  const essential = chord.tones.length > 3 ? chord.tones.filter((t) => !/^5$/.test(t.interval)) : chord.tones;
  const needs = essential.map((t) => t.pc);
  for (const shape of GENERIC) {
    const slots = parseGrip(shape);
    if (slots.length < needs.length) continue;
    const c = place(slots, chord.tones, { needs, rootBass: true });
    if (c.length) return c.map((sh) => ({ ...sh, name: chord.symbol }));
  }
  return [];
}

// ---------- stavitelé kandidátů podle sazby ----------

const extraFor = (sazba, chord, allowed) => (role) => {
  if (!sazba.extras?.includes(role) || role !== '6') return null;
  if (chord.tones.length !== 3 || !['maj', 'min'].includes(chordFamily(chord))) return null;
  const [t] = spellIntervals(chord.root, ['6']);
  return allowed.has(t.pc) ? { ...t, added: true } : null;
};

const fromGrips = (grips, type) => {
  const own = grips.filter((g) => g.types?.includes(type));
  return own.length ? own : grips.filter((g) => !g.types);
};

// číslice hmatu zdola nahoru: '1-7-3', opakovaný kořen = 8
function digits(notes) {
  let roots = 0;
  return notes.map((n) => {
    if (n.interval === '1') return roots++ ? '8' : '1';
    const k = num(n.interval);
    return String(k === 9 || k === 13 ? k : fold(k));
  }).join('-');
}

const withSix = (chord, notes) => (notes.some((n) => n.added)
  ? noteName(chord.root) + (chordFamily(chord) === 'min' ? 'm6' : '6')
  : chord.symbol);

function gripCands(sazba, ch, noOpen = sazba.noOpen) {
  const extra = extraFor(sazba, ch.chord, ch.allowed);
  return fromGrips(sazba.grips, ch.type).flatMap((g) => place(parseGrip(g.shape), ch.chord.tones, { extra, rootBass: true, noOpen })
    .map((sh) => ({ ...sh, pen: sh.pen + (g.pen ?? 0), label: g.label })));
}

function barreCands(ch, prefix = '') {
  return gripCands(SAZBY.barre, ch, false).map((sh) => ({ ...sh, name: `${ch.chord.symbol} (${prefix}${sh.label})` }));
}

// otevřené tvary z tabulky OPEN (podle třídy tónu kořene a druhu akordu)
const OPEN_BY_PC = new Map();
for (const [sym, shapes] of Object.entries(OPEN)) {
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  OPEN_BY_PC.set(`${pcOf(parseNote(m[1]))}${m[2]}`, shapes);
}

export function openShape(frets, chord) {
  const placed = [];
  [...frets].forEach((ch, i) => {
    if (ch === 'x') return;
    const s = 6 - i;
    const f = Number(ch);
    const tone = chord.tones.find((t) => t.pc === mod(TUNING[s] + f, 12));
    placed.push({ s, f, tone });
  });
  if (placed.some((p) => !p.tone) || placed[0].tone.interval !== '1') return null;
  return makeShape(placed);
}

function openCands(ch) {
  const table = OPEN_BY_PC.get(`${ch.chord.rootPc}${ch.type}`) ?? [];
  const open = table.map((fr, i) => openShape(fr, ch.chord) && { ...openShape(fr, ch.chord), pen: i * 0.5, name: ch.chord.symbol, open: true }).filter(Boolean);
  return open.length ? open : barreCands(ch, 'barré ');
}

function closeCands(sazba, ch) {
  const lists = sazba.tones[ch.type] ?? sazba.tones['*'];
  const extra = extraFor(sazba, ch.chord, ch.allowed);
  const out = [];
  lists.forEach((tones, li) => tones.forEach((_, r) => {
    let order = [...tones.slice(r), ...tones.slice(0, r)];
    if (sazba.drop === 2) order = [order[order.length - 2], ...order.slice(0, -2), order[order.length - 1]];
    sazba.sets.forEach((set, si) => {
      const slots = set.map((s, i) => ({ s, alts: order[i].split('|') }));
      for (const sh of place(slots, ch.chord.tones, { extra })) {
        out.push({ ...sh, pen: sh.pen + li + si * (sazba.setPenalty ?? 0), set: si });
      }
    });
  }));
  return out.map((sh) => {
    const sym = withSix(ch.chord, sh.notes);
    return { ...sh, name: sazba.drop === 2 ? `${sym} (drop 2, ${digits(sh.notes)})` : `${sym} (${digits(sh.notes)})` };
  });
}

function colorCands(sazba, ch) {
  const rule = sazba.choose[ch.type];
  const ids = rule ? rule[ch.fn] ?? rule['*'] ?? [] : [];
  const own = new Set(ch.chord.tones.map((t) => t.pc));
  for (const id of ids) {
    const def = COLOR_TYPES[id];
    const tones = spellIntervals(ch.chord.root, def.iv).map((t) => ({ ...t, added: !own.has(t.pc) }));
    if (![...own].every((pc) => tones.some((t) => t.pc === pc))) continue;
    if (!tones.every((t) => !t.added || ch.allowed.has(t.pc))) continue;
    const cands = def.grips.flatMap((g, gi) => place(parseGrip(g), tones, { rootBass: true }).map((sh) => ({ ...sh, pen: sh.pen + gi * 0.5 })));
    if (cands.length) return cands.map((sh) => ({ ...sh, name: noteName(ch.chord.root) + def.suffix, color: id }));
  }
  const plain = barreCands(ch);
  return plain.length ? plain.map((sh) => ({ ...sh, name: ch.chord.symbol })) : [];
}

function powerCands(sazba, ch) {
  const walkTones = (chord) => {
    const min = chordFamily(chord) === 'min' || chordFamily(chord) === 'hdim';
    const [six, b6] = spellIntervals(chord.root, ['6', 'b6']);
    const fifth = roleTone('5', chord.tones);
    const [b7] = spellIntervals(chord.root, ['b7']);
    return { 5: fifth, 6: min && !ch.allowed.has(six.pc) ? b6 : six, b7: roleTone('b7', chord.tones) ?? b7 };
  };
  const wt = walkTones(ch.chord);
  return gripCands(sazba, ch).map((sh) => {
    const top = sh.notes[sh.notes.length - 1];
    const walk = sazba.walk.map((k) => {
      const t = wt[k];
      const f = top.f + mod(t.pc - top.pc, 12);
      return { s: top.s, f, midi: TUNING[top.s] + f, interval: t.interval, name: t.name };
    });
    return { ...sh, name: `${noteName(ch.chord.root)}5`, walk };
  });
}

const BUILD = {
  open: (sazba, ch) => openCands(ch),
  bassChord: (sazba, ch) => openCands(ch),
  grips: (sazba, ch) => gripCands(sazba, ch).map((sh) => ({
    ...sh,
    name: sh.label === 'shell' ? `${withSix(ch.chord, sh.notes)} (shell ${digits(sh.notes)})` : `${ch.chord.symbol} (${sh.label})`,
  })),
  close: closeCands,
  colors: colorCands,
  power: powerCands,
};

// ---------- bas, střídavý bas, horní struny ----------

const bassOf = (notes) => {
  const low = notes[0];
  return low && low.interval === '1' ? { s: low.s, f: low.f, midi: low.midi } : null;
};

// Střídavý bas: kvinta na vedlejší basové struně (v hmatu, nebo na dosah ruky), jinak tercie.
function altOf(shape, chord) {
  const bass = shape.bass;
  if (!bass) return null;
  const fifth = roleTone('5', chord.tones);
  const third = roleTone('3', chord.tones);
  const tries = [[fifth, bass.s + 1], [fifth, bass.s - 1], [fifth, bass.s - 2], [third, bass.s - 1], [third, bass.s + 1]];
  for (const [tone, s] of tries) {
    if (!tone || s < 3 || s > 6) continue;
    const inShape = shape.notes.find((n) => n.s === s);
    if (inShape) {
      if (inShape.pc === tone.pc) return { s, f: inShape.f, midi: inShape.midi, interval: tone.interval, name: tone.name };
      continue;
    }
    const lo = shape.hi ? Math.max(1, shape.lo - 1) : 1;
    const hi = shape.hi ? shape.hi + 1 : 4;
    for (let f = 0; f <= MAX_FRET; f++) {
      if ((f === 0 || (f >= lo && f <= hi)) && mod(TUNING[s] + f - tone.pc, 12) === 0) {
        return { s, f, midi: TUNING[s] + f, interval: tone.interval, name: tone.name };
      }
    }
  }
  return null;
}

// struny pro „úder“ akordu: nad basem a střídavým basem, nejvýš struny 1–4
function topOf(shape) {
  const below = Math.min(shape.bass?.s ?? 7, shape.alt?.s ?? 7);
  const top = shape.notes.filter((n) => n.s < below && n.s <= 4).map((n) => n.s);
  return top.length ? top : shape.notes.map((n) => n.s);
}

// ---------- výběr přes kolečko ----------

const posOf = (sh) => {
  const fr = sh.notes.filter((n) => n.f > 0);
  return fr.length ? fr.reduce((a, n) => a + n.f, 0) / fr.length : 0;
};

// pohyb hlasů zarovnaných shora; kořen v basu se počítá zvlášť a slaběji (basa skáče vždycky)
function voiceDist(a, b) {
  const rooted = a.bass && b.bass;
  const x = a.notes.slice(rooted ? 1 : 0).map((n) => n.midi);
  const y = b.notes.slice(rooted ? 1 : 0).map((n) => n.midi);
  let sum = rooted ? 0.2 * Math.abs(a.bass.midi - b.bass.midi) : 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    sum += Math.abs(x[Math.max(0, x.length - 1 - i)] - y[Math.max(0, y.length - 1 - i)]);
  }
  return sum;
}

const shapeKey = (sh) => sh.notes.map((n) => `${n.s}:${n.f}`).join(' ');

// vlastní cena hmatu: náhradní tóny, poloha (od `center`, nad 10. pražcem navíc), barré, roztažení
function intrinsic(sh, move) {
  return sh.pen * 2 + (move.pos ?? 0.3) * Math.abs(posOf(sh) - (move.center ?? 5)) + 1.5 * Math.max(0, sh.hi - 10)
    + (sh.barre ? 0.5 : 0) + 0.1 * (sh.hi - sh.lo);
}

function transition(a, b, move) {
  if (shapeKey(a) === shapeKey(b)) return 0;
  return (move.hand ?? 1) * Math.abs(posOf(a) - posOf(b))
    + (move.voice ?? 0) * voiceDist(a, b)
    + (a.set !== b.set ? move.setChange ?? 0 : 0);
}

// Viterbi po kruhu: pro každý start projde kolečko a přičte návrat z posledního akordu na první.
function chooseCyclic(nodes, move) {
  const n = nodes.length;
  const cost = nodes.map((cs) => cs.map((c) => c.cost));
  if (n === 1) return [cost[0].indexOf(Math.min(...cost[0]))];
  const memo = new Map();
  const trans = (i) => {
    const a = nodes[i];
    const b = nodes[(i + 1) % n];
    const key = `${a.id}>${b.id}`;
    if (!memo.has(key)) memo.set(key, a.map((x) => b.map((y) => transition(x, y, move))));
    return memo.get(key);
  };
  let best = { total: Infinity, path: null };
  nodes[0].forEach((_, s0) => {
    let dp = nodes[0].map((_, j) => (j === s0 ? cost[0][j] : Infinity));
    const back = [];
    for (let i = 1; i < n; i++) {
      const T = trans(i - 1);
      const from = nodes[i].map((_, k) => {
        let arg = 0;
        let min = Infinity;
        dp.forEach((d, j) => { if (d + T[j][k] < min) { min = d + T[j][k]; arg = j; } });
        return [min + cost[i][k], arg];
      });
      dp = from.map((x) => x[0]);
      back.push(from.map((x) => x[1]));
    }
    const close = trans(n - 1);
    dp.forEach((d, k) => {
      const total = d + close[k][s0];
      if (total < best.total) {
        const path = [k];
        for (let i = n - 2; i >= 0; i--) path.unshift(back[i][path[0]]);
        best = { total, path };
      }
    });
  });
  return best.path;
}

const allowedPcs = (ctx, chord) => new Set([...ctx.keyPcs, ...chord.tones.map((t) => t.pc)]);

// Kandidáti pro jeden akord (seřazení podle vlastní ceny, nejvýš MAX_CANDS).
export function candidates(sazbaId, chord, ctx, fn = 'T') {
  const sazba = SAZBY[sazbaId];
  const ch = { chord, type: typeKey(chord), fn, allowed: allowedPcs(ctx, chord) };
  let cands = BUILD[sazba.build](sazba, ch);
  if (!cands.length) cands = genericCands(chord);
  if (!cands.length) throw new Error(`Sazba ${sazbaId}: žádný hmat pro ${chord.symbol}`);
  cands = cands.map((sh) => {
    const out = { ...sh, chord };
    out.bass = sazba.build === 'close' && !sazba.drop ? null : bassOf(out.notes);
    out.alt = altOf(out, chord);
    out.top = topOf(out);
    out.added = out.notes.filter((n) => n.added).map((n) => n.interval);
    out.cost = intrinsic(out, sazba.move) + (sazba.build === 'bassChord' && !out.alt ? 3 : 0);
    return out;
  });
  return cands.sort((a, b) => a.cost - b.cost).slice(0, MAX_CANDS);
}

function finish(sazba, sh) {
  const { notes, muted, bass, alt, lo, hi, barre, top, walk, added, chord } = sh;
  let { name } = sh;
  if (sazba.build === 'bassChord' && alt) name = `${name} · bas ${notes[0].name}–${alt.name}`;
  const out = { chord, name, notes: notes.map(({ s, f, midi, interval, name: nm, pc }) => ({ s, f, midi, interval, name: nm, pc })), muted, bass, alt, lo, hi, barre, top, added };
  if (sh.color) out.color = sh.color;
  if (walk) out.walk = walk;
  return out;
}

// Hlavní funkce: hmat pro každý segment kolečka.
export function voiceProgression(sazbaId, song, analysis = analyzeSong(song)) {
  const sazba = SAZBY[sazbaId];
  if (!sazba) throw new Error(`Neznámá sazba ${sazbaId}`);
  const { segments, ctx } = analysis;

  // uzly = běhy stejného akordu za sebou; kandidáti se počítají jednou pro každý akord a funkci
  const pool = new Map();
  const nodes = [];
  const nodeOf = segments.map((sg) => {
    const id = `${sg.chord.degree}@${sg.fn.fn}`;
    if (!pool.has(id)) pool.set(id, Object.assign(candidates(sazbaId, sg.chord, ctx, sg.fn.fn), { id }));
    const last = nodes[nodes.length - 1];
    if (!last || last.id !== id) nodes.push(pool.get(id));
    return nodes.length - 1;
  });
  // kolečko začínající a končící stejným akordem = jeden uzel přes hranici
  const wrap = nodes.length > 1 && nodes[0].id === nodes[nodes.length - 1].id;
  const ring = wrap ? nodes.slice(0, -1) : nodes;
  const pick = chooseCyclic(ring, sazba.move);
  const chosen = ring.map((cs, i) => cs[pick[i]]);
  const shapeOfNode = (k) => chosen[wrap && k === nodes.length - 1 ? 0 : k];

  const shapes = segments.map((sg, i) => ({ ...finish(sazba, shapeOfNode(nodeOf[i])), chord: sg.chord }));
  shapes.forEach((sh, i) => {
    const prev = shapes[(i - 1 + shapes.length) % shapes.length];
    const pcs = new Set(prev.notes.map((n) => n.pc));
    sh.keep = [...new Set(sh.notes.map((n) => n.pc).filter((pc) => pcs.has(pc)))];
  });
  return { id: sazbaId, sazba, shapes };
}

export const shapeAt = (voiced, segIdx) => voiced.shapes[mod(segIdx, voiced.shapes.length)];

// Jeden hmat pro akord mimo kolečko (náhled, „drž akord“); prev = předchozí hmat pro vedení hlasů.
export function shapeFor(sazbaId, chord, song, { fn = 'T', prev = null } = {}) {
  const sazba = SAZBY[sazbaId];
  const analysis = analyzeSong(song);
  const cs = candidates(sazbaId, chord, analysis.ctx, fn);
  const score = (c) => c.cost + (prev ? transition(prev, c, sazba.move) : 0);
  const best = cs.reduce((a, c) => (score(c) < score(a) ? c : a));
  return finish(sazba, best);
}

// Pražce struna 6 → 1 (null = tlumená) a krátký zápis 'x32010' / 'x-10-12-12-x-x'.
export function fretsOf(shape) {
  return [6, 5, 4, 3, 2, 1].map((s) => shape.notes.find((n) => n.s === s)?.f ?? null);
}
export function fretString(shape) {
  const fr = fretsOf(shape).map((f) => (f == null ? 'x' : String(f)));
  return fr.some((f) => f.length > 1) ? fr.join('-') : fr.join('');
}

export function styleOf(song) {
  const p = song.progression;
  return p.style ?? GROOVE_STYLE[p.defaults?.groove] ?? 'pop';
}

// Sazby v pořadí doporučení pro styl kolečka; v 2/4 a 3/4 jde bas + akord dopředu.
export function applicableSazby(song, analysis = analyzeSong(song)) {
  const beats = analysis.beatsPerBar ?? song.progression.meter[0];
  let order = song.progression.sazby ?? COMP_ORDER[styleOf(song)] ?? COMP_ORDER.pop;
  if (beats !== 4) order = ['bassChord', ...order.filter((id) => id !== 'bassChord')];
  const ids = [...order, ...Object.keys(SAZBY).filter((id) => !order.includes(id))];
  return ids.filter((id) => {
    const a = SAZBY[id]?.applies;
    return SAZBY[id] && (!a?.meters || a.meters.includes(beats));
  });
}
