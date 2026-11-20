// Engine přístupů: z přístupu (js/data/approaches.js) a kolečka udělá pruhy (hmatníky pod sebou)
// a ke každému akordu určí, který pruh platí a co v něm nad akordem zní. Čisté funkce.

import { APPROACHES, DEFAULT_ORDER } from '../data/approaches.js';
import { SCALES } from '../data/scales.js';
import { ARPEGGIOS } from '../data/arpeggios.js';
import { spellIntervals } from '../theory/intervals.js';
import { degreeRoot, chordInKey } from '../theory/chords.js';
import { noteName, mod } from '../theory/notes.js';
import { intervalBetween, keyScale, nameTones, degreeTone, chordFamily } from '../theory/harmony.js';
import { analyzeSong } from '../theory/function.js';

const LANE_COLORS = ['#4fd8c8', '#ffb347', '#b896ff'];

// Krátký název zdroje: „Em pentatonika“, „C dur“, „G♯°7“.
function labelOf(kind, id, root) {
  const r = noteName(root);
  if (kind === 'arp') return id === 'dim7' ? `${r}°7` : `${r} ${ARPEGGIOS[id].name.toLowerCase()}`;
  const names = {
    minorPentatonic: `${r}m pentatonika`,
    majorPentatonic: `${r} dur. pentatonika`,
    major: `${r} dur`,
    minor: `${r} moll`,
    harmonicMinor: `${r} harm. moll`,
    blues: `${r} blues`,
    dorian: `${r} dórská`,
    mixolydian: `${r} mixolydická`,
    phrygian: `${r} frygická`,
    lydian: `${r} lydická`,
    locrian: `${r} lokrická`,
    phrygianDominant: `${r} frygická dom.`,
    halfWhole: `${r} zmenšená`,
    wholeHalf: `${r} zmenšená c–p`,
    wholeTone: `${r} celotónová`,
  };
  return names[id] ?? `${r} ${SCALES[id].name.toLowerCase()}`;
}

// Dvojice kvintakordů 'pair:V+vi' → šest tónů: 1–3 první kvintakord, 4–6 druhý (G B D A C E v C).
// Intervaly se počítají od kořene prvního kvintakordu.
function pairSource(spec, song) {
  const chords = spec.slice(5).split('+').map((d) => chordInKey(d, song.tonic));
  const base = chords[0].root;
  const tones = chords.flatMap((c) => c.tones.slice(0, 3)).map((t) => ({ ...t, interval: intervalBetween(base, t.note) }));
  return { ref: spec, kind: 'pair', id: spec.slice(5), rootNote: base, rootPc: tones[0].pc, tones, pcs: new Set(tones.map((t) => t.pc)), label: chords.map((c) => c.symbol).join(' + ') };
}

// 'scale:minorPentatonic@iii' → zdroj v tónině
export function resolveSource(spec, song) {
  if (spec.startsWith('pair:')) return pairSource(spec, song);
  const [ref, deg] = spec.split('@');
  const [kind, id] = ref.split(':');
  const def = kind === 'arp' ? ARPEGGIOS[id] : SCALES[id];
  if (!def) throw new Error(`Neznámý zdroj ${spec}`);
  const root = degreeRoot(deg ?? 'I', song.tonic);
  const tones = spellIntervals(root, def.intervals);
  return { ref, kind, id, rootNote: root, rootPc: tones[0].pc, tones, pcs: new Set(tones.map((t) => t.pc)), label: labelOf(kind, id, root) };
}

// Zdroj, který se mění s akordem: tóny akordu, od tercie/kvinty, stupnice od kořene,
// pentatonika akordu, mód podle akordu, vodicí tóny 3 a 7, barvy 6 a 9.
const FOLLOW_SCALES = { halfWhole: 'zmenšená', wholeTone: 'celotónová' };
const MAJOR_MODES = ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'];

const scaleSource = (id, root, label) => {
  const tones = spellIntervals(root, SCALES[id].intervals);
  return { kind: 'scale', id, rootNote: root, rootPc: tones[0].pc, tones, pcs: new Set(tones.map((t) => t.pc)), label };
};
const toneSource = (kind, tones, label, id = null) => ({ kind, id, rootNote: tones[0].note, rootPc: tones[0].pc, tones, pcs: new Set(tones.map((t) => t.pc)), label });

const hasIv = (chord, iv) => chord.intervals.includes(iv);
const isDom = (chord) => hasIv(chord, '3') && hasIv(chord, 'b7');

// Mód pro akord: diatonický akord → stupnice tóniny od jeho kořene (Dm v C = dórská),
// jinak podle druhu akordu (dominantní → mixolydická, V7 v moll → frygická dominantní …).
export function modeFor(chord, scale) {
  const keyPcs = new Set(scale.map((t) => t.pc));
  const minorKey = intervalBetween(scale[0].note, scale[2].note) === 'b3';
  const idx = scale.findIndex((t) => t.pc === chord.rootPc);
  if (idx >= 0 && chord.tones.every((t) => keyPcs.has(t.pc))) return MAJOR_MODES[(idx + (minorKey ? 5 : 0)) % 7];
  const fam = chordFamily(chord);
  if (hasIv(chord, '#5')) return 'wholeTone';
  if (isDom(chord)) {
    if (hasIv(chord, 'b9')) return 'phrygianDominant';
    if (minorKey && idx === 4) return 'phrygianDominant';
    return 'mixolydian';
  }
  if (fam === 'hdim') return 'locrian';
  if (fam === 'dim') return 'wholeHalf';
  if (fam === 'min') return 'dorian';
  if (fam === 'sus') return 'mixolydian';
  return 'lydian';
}

// Charakteristický tón módu (to, čím se liší od obyčejné dur/moll).
export const MODE_CHAR = { major: '7', dorian: '6', phrygian: 'b2', lydian: '#4', mixolydian: 'b7', minor: 'b6', locrian: 'b5', phrygianDominant: 'b2', harmonicMinor: '7' };

export function followSource(follow, chord, scale) {
  const over = ` · nad ${chord.symbol}`;
  if (FOLLOW_SCALES[follow]) return scaleSource(follow, chord.root, `${noteName(chord.root)} ${FOLLOW_SCALES[follow]}${over}`);
  if (follow === 'chord') {
    const tones = chord.tones.map((t) => ({ interval: t.interval, note: t.note, pc: t.pc, name: t.name }));
    return toneSource('chord', tones, `${chord.symbol} · tóny akordu`);
  }
  const fam = chordFamily(chord);
  if (follow === 'mode') {
    const id = modeFor(chord, scale);
    return scaleSource(id, chord.root, `${labelOf('scale', id, chord.root)}${over}`);
  }
  if (follow === 'pent') {
    if (fam === 'dim') return scaleSource('wholeHalf', chord.root, `${labelOf('scale', 'wholeHalf', chord.root)}${over}`);
    const id = fam === 'min' || fam === 'hdim' ? 'minorPentatonic' : 'majorPentatonic';
    return scaleSource(id, chord.root, `${labelOf('scale', id, chord.root)}${over}`);
  }
  if (follow === 'pentFifth') {
    if (hasIv(chord, '#5')) return scaleSource('wholeTone', chord.root, `${labelOf('scale', 'wholeTone', chord.root)}${over}`);
    if (fam === 'dim' || fam === 'hdim') return followSource('chord', chord, scale);
    const fifth = degreeTone(chord, 5, scale).note;
    const id = fam === 'min' || isDom(chord) || fam === 'sus' ? 'minorPentatonic' : 'majorPentatonic';
    return scaleSource(id, fifth, `${labelOf('scale', id, fifth)} · od kvinty ${chord.symbol}`);
  }
  if (follow === 'guide') {
    const tones = [3, 7].map((n) => degreeTone(chord, n, scale));
    return toneSource('follow', tones, `${tones.map((t) => t.name).join(' ')} · 3 a 7 ${chord.symbol}`, 'guide');
  }
  if (follow === 'color') {
    const own = chord.tones.map((t) => ({ interval: t.interval, note: t.note, pc: t.pc, name: t.name }));
    const extra = [6, 9].map((n) => degreeTone(chord, n, scale)).filter((t) => !own.some((o) => o.pc === t.pc));
    return toneSource('follow', [...own, ...extra], `${chord.symbol} + ${extra.map((t) => pretty(intervalBetween(chord.root, t.note).replace(/^([b#]?)2$/, '$19'))).join(', ')}`, 'color');
  }
  if (follow === 'martino') {
    // Martinovo zmollovatění: 4 tóny stupnice od sexty (C → Am: A H C D), pak arpeggio od tercie (Em7: E G H D)
    // nad mollovou tónikou velká (dórská) sexta: malá sexta na „jedna“ přes Cm drhne, Cm6 je Martinův zvuk
    const six = fam === 'min' && scale[0].pc === chord.rootPc ? { colorSix: 'major' } : {};
    const tones = [6, 7, 1, 9, 3, 5, 7].map((n) => degreeTone(chord, n, scale, n === 6 ? six : {}));
    const arp = nameTones(tones.slice(4)) ?? tones.slice(4).map((t) => t.name).join(' ');
    return toneSource('follow', tones, `${tones[0].name}–${tones[3].name} + ${arp}${over}`, 'martino');
  }
  const nums = follow === 'fifth' ? [5, 7, 9] : [3, 5, 7];
  const tones = nums.map((n) => degreeTone(chord, n, scale));
  const name = nameTones(tones) ?? tones.map((t) => t.name).join(' ');
  return toneSource('follow', tones, `${name} · od ${follow === 'fifth' ? 'kvinty' : 'tercie'} ${chord.symbol}`, follow);
}

const pretty = (iv) => iv.replace(/b/g, '♭').replace(/#/g, '♯');

const pick = (src, ctx) => (src ? (ctx.blues ? src.blues ?? src[ctx.mode] : src[ctx.mode]) : null);

export function isApplicable(approach, ctx, chords = []) {
  const a = approach.applies ?? {};
  if (a.needs === 'dom' && !chords.some((c) => c.intervals.includes('b7') && c.intervals.includes('3'))) return false;
  if (a.needs === 'aug' && !chords.some((c) => c.intervals.includes('#5'))) return false;
  if (ctx.blues) return a.blues !== false;
  if (a.bluesOnly) return false;
  return (a.modes ?? ['major', 'minor']).includes(ctx.mode);
}

export function applicableApproaches(song, analysis = analyzeSong(song)) {
  const style = song.progression.style ?? (song.progression.mode === 'minor' ? 'folk' : 'default');
  const order = song.progression.approaches ?? DEFAULT_ORDER[style] ?? DEFAULT_ORDER.default;
  const ids = [...order, ...Object.keys(APPROACHES).filter((id) => !order.includes(id))];
  const chords = song.bars.flat();
  return ids.filter((id) => APPROACHES[id] && isApplicable(APPROACHES[id], analysis.ctx, chords));
}

// Interval tónu vůči akordu tak, jak ho kytarista říká: 9, 11, 13 místo 2, 4 (6 zůstává 6).
// U akordu s velkou tercií se ♭3 čte jako ♯9, u akordu s kvintou ♭5 jako ♯11 a ♭6 jako ♭13.
export function chordInterval(chord, note) {
  let iv = intervalBetween(chord.root, note);
  if (iv === 'b3' && chord.intervals.includes('3')) iv = '#9';
  if (iv === 'b5' && chord.intervals.includes('5')) iv = '#11';
  if (iv === 'b6' && chord.intervals.includes('5') && chord.intervals.includes('b7')) iv = 'b13';
  return iv.replace(/^([b#]?)2$/, '$19').replace(/^([b#]?)4$/, '$111');
}

export function chordView(source, chord) {
  return new Map(source.tones.map((t) => [t.pc, chordInterval(chord, t.note)]));
}

// Hlavní funkce: pruhy přístupu a pruh pro každý segment kolečka.
export function resolveApproach(id, song, analysis = analyzeSong(song)) {
  const approach = APPROACHES[id];
  const { ctx, segments } = analysis;
  const scale = keyScale(song.tonic, ctx.mode);
  const keyPcs = new Set(ctx.keyPcs);
  const leadingPc = mod(ctx.tonicPc + 11, 12);

  // pruhy s pevným zdrojem
  const lanes = [];
  for (const spec of approach.lanes) {
    if (spec.follow) {
      const bg = pick(spec.bg, ctx);
      lanes.push({ id: spec.id, name: spec.name, kind: 'follow', follow: spec.follow, fn: spec.fn, domOnly: spec.domOnly, augOnly: spec.augOnly, bg: bg ? resolveSource(bg, song) : null });
      continue;
    }
    const src = pick(spec.src, ctx);
    if (!src) continue;
    const bg = pick(spec.bg, ctx);
    lanes.push({ id: spec.id, name: spec.name, kind: 'fixed', fn: spec.fn, leading: spec.leading, source: resolveSource(src, song), bg: bg ? resolveSource(bg, song) : null });
  }

  // přiřazení segmentů do pruhů
  const fitsLane = (lane, sg) => {
    if (lane.fn !== '*' && !lane.fn.includes(sg.fn.fn)) return false;
    if (lane.domOnly && !(sg.chord.intervals.includes('b7') && sg.chord.intervals.includes('3'))) return false;
    if (lane.augOnly && !sg.chord.intervals.includes('#5')) return false;
    if (lane.kind === 'follow') return true;
    if (lane.leading) return sg.chord.tones.some((t) => t.pc === leadingPc);
    if (ctx.blues) return true;
    // tóny akordu musí patřit do tóniny (jinak by pentatonika drhla)
    return sg.chord.tones.every((t) => keyPcs.has(t.pc));
  };
  let auto = null;
  const laneOf = segments.map((sg) => {
    const i = lanes.findIndex((l) => fitsLane(l, sg));
    if (i >= 0) return i;
    if (!auto) {
      auto = { id: 'X', name: 'akord (od tercie)', kind: 'follow', follow: 'third', fn: '*', auto: true };
      lanes.push(auto);
    }
    return lanes.indexOf(auto);
  });

  // pruhy, které nic nehrají, vynechat
  const used = lanes.map((_, i) => laneOf.includes(i));
  const keep = lanes.filter((_, i) => used[i]);
  const remap = lanes.map((l) => keep.indexOf(l));
  let finalLanes = keep;
  let finalLaneOf = laneOf.map((i) => remap[i]);

  // přístup „za akordem“ s nejvýš třemi různými akordy → každý akord vlastní pevný pruh (mapa)
  if (finalLanes.length === 1 && finalLanes[0].kind === 'follow') {
    const distinct = [...new Map(segments.map((sg) => [sg.chord.degree, sg.chord])).values()];
    if (distinct.length <= 3) {
      const base = finalLanes[0];
      finalLanes = distinct.map((chord) => ({
        id: chord.degree, name: chord.symbol, kind: 'fixed', fn: '*', perChord: chord.degree, bg: base.bg,
        source: followSource(base.follow, chord, scale),
      }));
      finalLaneOf = segments.map((sg) => finalLanes.findIndex((l) => l.perChord === sg.chord.degree));
    }
  }
  finalLanes.forEach((l, i) => { l.color = LANE_COLORS[i % LANE_COLORS.length]; });

  // zdroj pruhu v daném segmentu (pevný, nebo podle akordu)
  const sourceAt = (laneIdx, segIdx) => {
    const lane = finalLanes[laneIdx];
    if (lane.kind === 'fixed') return lane.source;
    return followSource(lane.follow, segments[segIdx].chord, scale);
  };
  // akord, „ke kterému pruh patří“, když zrovna nehraje (pro popisky v tlumeném pruhu)
  const homeSeg = finalLanes.map((_, i) => finalLaneOf.indexOf(i));

  return { id, approach, lanes: finalLanes, laneOf: finalLaneOf, sourceAt, homeSeg, segments, scale, ctx };
}

// Odpočet před změnou pruhu (nebo zdroje v pruhu „za akordem“): zbývající doby, jinak null.
export function switchAhead(resolved, segIdx, beatInSeg, lead = 2) {
  const { segments, laneOf, lanes } = resolved;
  const sg = segments[segIdx];
  const nextIdx = (segIdx + 1) % segments.length;
  const a = laneOf[segIdx];
  const b = laneOf[nextIdx];
  const changes = a !== b || (lanes[a].kind === 'follow' && segments[nextIdx].chord.degree !== sg.chord.degree);
  if (!changes) return null;
  const n = sg.beats < 4 ? 1 : lead;
  const left = sg.beats - beatInSeg;
  return left <= n ? { left, nextSeg: nextIdx, nextLane: b } : null;
}

// Doplnění tokenů v textech: {iii} → „Em“, {ii.r} → „D“, {V7.3} → tercie akordu V7,
// {lane:T} → zdroj pruhu, {ex:third} → příklady z kolečka.
export function fillTokens(str, song, resolved = null) {
  str = str.replace(/\{lane:(\w+)\}/g, (m, id) => {
    const lane = resolved?.lanes.find((l) => l.id === id);
    return lane?.source?.label ?? '';
  });
  str = str.replace(/\{ex:(third|fifth|chord)\}/g, (m, kind) => {
    const scale = keyScale(song.tonic, song.progression.mode === 'minor' ? 'minor' : 'major');
    const distinct = [...new Map(song.bars.flat().map((c) => [c.degree, c])).values()].slice(0, 4);
    return distinct.map((c) => `nad ${c.symbol} ${followSource(kind, c, scale).label.split(' · ')[0]}`).join(', ');
  });
  return str.replace(/\{([b#]?[ivIV]+[^.}]*)(?:\.(r|3))?\}/g, (m, deg, part) => {
    try {
      const root = degreeRoot(deg, song.tonic);
      if (part === 'r') return noteName(root);
      const chord = song.bars.flat().find((c) => c.degree === deg);
      if (part === '3') {
        const c = chord ?? null;
        return c ? c.tones[1].name : noteName(root);
      }
      if (chord) return chord.symbol;
      // akord, který v kolečku není: postav ho diatonicky
      const lower = deg === deg.toLowerCase();
      return noteName(root) + (lower ? (deg.startsWith('vii') ? '°' : 'm') : '');
    } catch {
      return m;
    }
  });
}
