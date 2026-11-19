// Levý panel jako kazetový deck z rackové sestavy pol. 80. let (smyšlená značka ORIKAWA):
// vícebarevný VFD s akordem a špičkovými měřidly, soft-touch klávesy transportu,
// kazeta s kolečkem na štítku, voliče, tempo a otočné knoflíky mixu.

import { h, selectBox, setOptions } from './dom.js';
import { T } from '../i18n/cs.js';
import { G } from '../i18n/groovebox.js';
import { store } from '../state/store.js';
import { PROGRESSIONS } from '../data/progressions.js';
import { GROOVES } from '../data/grooves.js';
import { KEY_NAMES, keyLabel } from '../theory/notes.js';
import { degreeLabel } from '../theory/chords.js';
import { buildSong, nextChordAfter, progressionOf } from '../programs/song.js';
import { onTransport, isRunning } from '../audio/transport.js';
import { setBusLevel } from '../audio/engine.js';

const FADERS = ['drums', 'chords', 'bass', 'lead'];
export const faderGain = (v) => v * v * 1.25;

const METER_SEGS = 22;

// Cívka kazety: náboj se zuby a navinutý pásek (r = poloměr návinu).
const reelSvg = (r) => `<svg viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <radialGradient id="gbTape${r}" cx="50%" cy="50%" r="50%">
      <stop offset="0.55" stop-color="#2a1a10"/><stop offset="0.9" stop-color="#3b2717"/><stop offset="1" stop-color="#1c120b"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="${r}" fill="url(#gbTape${r})"/>
  <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,220,180,.08)" stroke-width="0.6" stroke-dasharray="1 2.4"/>
  <circle cx="50" cy="50" r="17" fill="#f2efe6" stroke="#9c978a" stroke-width="1"/>
  <circle cx="50" cy="50" r="11" fill="#1b1b1b"/>
  ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="48" y="38.5" width="4" height="6" rx="0.8" fill="#f2efe6" transform="rotate(${a} 50 50)"/>`).join('')}
  <circle cx="50" cy="50" r="3" fill="#0a0a0a"/>
  <path d="M50 33 L52 36 L48 36 Z" fill="#c8c2b2"/>
</svg>`;

// soft-touch klávesa s malou LED; latch = zůstává zamáčknutá
function gbKey({ label, symbol, cls = '', latch = false, led = null, onclick }) {
  const btn = h('button', {
    class: `gb-key ${cls}`,
    type: 'button',
    title: label,
    'aria-label': label,
    'aria-pressed': latch ? 'false' : null,
    onclick,
  },
  led ? h('i', { class: `gb-led gb-led-${led}`, 'aria-hidden': 'true' }) : null,
  h('span', { class: 'gb-key-sym', 'aria-hidden': 'true' }, symbol));
  return h('div', { class: 'gb-key-cell' }, btn, h('span', { class: 'gb-legend gb-key-label', 'aria-hidden': 'true' }, label));
}
const setPressed = (cell, on) => cell.querySelector('.gb-key').setAttribute('aria-pressed', on ? 'true' : 'false');

// Otočný knoflík: pod ním skutečný <input type=range> (fokus, klávesnice, aria),
// myší se točí tahem nahoru/dolů (kolečkem, když má knoflík fokus).
function knob({ label, value, red = false, onInput }) {
  const input = h('input', { type: 'range', min: 0, max: 1, step: 0.01, class: 'gb-knob-input', 'aria-label': label });
  input.value = value;
  const cap = h('div', { class: 'gb-knob-cap' }, h('i', { class: 'gb-knob-mark' }));
  const body = h('div', { class: `gb-knob${red ? ' is-red' : ''}` },
    h('div', { class: 'gb-knob-scale', 'aria-hidden': 'true' }),
    h('div', { class: 'gb-knob-skirt' }, cap),
    input);
  const paint = () => body.style.setProperty('--v', input.value);
  const set = (v) => {
    input.value = Math.max(0, Math.min(1, v));
    paint();
    onInput(Number(input.value));
  };
  input.addEventListener('input', () => { paint(); onInput(Number(input.value)); });
  let drag = null;
  body.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.focus();
    drag = { y: e.clientY, v: Number(input.value) };
    body.setPointerCapture(e.pointerId);
    body.classList.add('is-grab');
  });
  body.addEventListener('pointermove', (e) => { if (drag) set(drag.v + (drag.y - e.clientY) / 160); });
  const end = () => { drag = null; body.classList.remove('is-grab'); };
  body.addEventListener('pointerup', end);
  body.addEventListener('pointercancel', end);
  // kolečko myši jen u knoflíku s fokusem, jinak by posouvání panelu měnilo mix
  body.addEventListener('wheel', (e) => {
    if (document.activeElement !== input) return;
    e.preventDefault();
    set(Number(input.value) - Math.sign(e.deltaY) * 0.03);
  }, { passive: false });
  paint();
  const cell = h('div', { class: 'gb-knob-cell' }, body, h('span', { class: 'gb-legend' }, label));
  return { cell, input, paint };
}

// ---------- posuvky ♭ ♯ ----------
// Písma VFD (tečková matice) a štítku (rukopis) znaky ♭ ♯ nemají, proto se kreslí v SVG:
// na displeji jako tečky v mřížce 5×7 (se zhasnutými „duchy“), na štítku perem.
// Rozteč bodů písma Doto je 0,1 em (verzálka = 7 řad), SVG proto drží stejnou rozteč:
// plná posuvka 5×7 (velikost znaku), menší (5–6 řad) k velkému akordu.
const DOT_GLYPHS = {
  full: {
    '♭': ['X....', 'X....', 'X....', 'X.XX.', 'XX..X', 'X..X.', 'XXX..'],
    '♯': ['.X.X.', '.X.X.', 'XXXXX', '.X.X.', 'XXXXX', '.X.X.', '.X.X.'],
  },
  small: {
    '♭': ['X...', 'X...', 'X.XX', 'XX.X', 'X.X.', 'XX..'],
    '♯': ['.X.X.', 'XXXXX', '.X.X.', 'XXXXX', '.X.X.'],
  },
};
function dotGlyph(ch, size, cls) {
  const rows = DOT_GLYPHS[size][ch];
  const w = rows[0].length;
  const dots = rows.flatMap((row, y) => [...row].map((c, x) => (c === 'X' ? `<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" rx="0.22"/>` : ''))).join('');
  return h('span', {
    class: `gb-dot-acc ${cls}`,
    style: `width:${w / 10}em;height:${rows.length / 10}em`,
    html: `<svg viewBox="0 0 ${w} ${rows.length}" aria-hidden="true">${dots}</svg>`,
  });
}
const INK_PATHS = {
  '♭': 'M3.2 0.8 C3.1 6 2.9 12 3 18.6 M3.1 11.8 C5.2 9.4 8.6 9.2 8.4 12.2 C8.2 14.8 5.6 16.8 3 18.6',
  '♯': 'M4.3 2 L3.6 18.6 M7.6 1.2 L7 17.6 M1 8.4 L9.6 6.2 M0.9 13.6 L9.4 11.4',
};
const inkSvg = (ch) => `<svg viewBox="0 0 10 20" aria-hidden="true"><path d="${INK_PATHS[ch]}"/></svg>`;

// text s posuvkami: písmena jako text, ♭ ♯ jako SVG; kind = 'dot' | 'dot-small' | 'ink'
function richText(str, kind, cls = '') {
  return String(str).split(/([♭♯])/).filter(Boolean).map((part) => {
    if (!INK_PATHS[part]) return part;
    if (kind === 'ink') return h('span', { class: `gb-ink-acc ${cls}`, html: inkSvg(part) });
    return dotGlyph(part, kind === 'dot-small' ? 'small' : 'full', cls);
  });
}

// akord do VFD: kořen velký, posuvka v půlce výšky verzálky, přípona na účaří
function chordParts(symbol) {
  const m = /^([A-G])([♭♯]?)(.*)$/.exec(symbol);
  if (!m) return richText(symbol, 'dot');
  return [
    h('span', { class: 'gb-ch-root' }, m[1]),
    m[2] ? richText(m[2], 'dot-small', 'gb-ch-acc') : null,
    m[3] ? h('span', { class: 'gb-ch-suf' }, richText(m[3], 'dot')) : null,
  ].flat().filter(Boolean);
}

export function createDeck(root, { groove, actions }) {
  // ---------- VFD ----------
  const dLabel = h('span', { class: 'gb-vfd-status' }, T.nowPlaying);
  const dBarNum = h('span', { class: 'gb-ghost-text', 'data-ghost': '88/88' });
  const dBar = h('span', { class: 'gb-vfd-bar' }, h('small', {}, T.bar), dBarNum);
  const dChord = h('div', { class: 'gb-vfd-chord' });
  const dDegree = h('span', { class: 'gb-vfd-degree' });
  const dBeats = h('div', { class: 'gb-vfd-beats' });
  const dNext = h('span', { class: 'gb-vfd-next-chord' });
  const meterRow = (ch) => {
    const segs = Array.from({ length: METER_SEGS }, (_, i) => h('i', {
      class: i >= METER_SEGS - 3 ? 'is-red' : i >= METER_SEGS - 7 ? 'is-amber' : '',
    }));
    return { segs, el: h('div', { class: 'gb-meter' }, h('b', {}, ch), h('div', { class: 'gb-meter-segs' }, segs)) };
  };
  const mL = meterRow(G.meterL);
  const mR = meterRow(G.meterR);
  const ind = (txt, cls) => h('span', { class: `gb-ind ${cls}` }, txt);
  const iPlay = ind(`▶ ${G.indicatorPlay}`, 'is-cyan');
  const iCount = ind(T.countIn, 'is-amber');
  const iFreeze = ind(T.keyFreeze, 'is-red');
  const iLoop = ind(G.indicatorLoop, 'is-cyan');
  const iNr = ind(G.badgeNrShort, 'is-amber');

  const display = h('div', { class: 'gb-vfd' },
    h('div', { class: 'gb-vfd-row gb-vfd-top' }, dLabel, dBar),
    h('div', { class: 'gb-vfd-matrix' }, dChord),
    h('div', { class: 'gb-vfd-row gb-vfd-mid' },
      h('div', { class: 'gb-vfd-pos' }, dDegree, dBeats),
      h('span', { class: 'gb-vfd-next' }, h('small', {}, T.next), dNext)),
    h('div', { class: 'gb-meters', 'aria-hidden': 'true' },
      mL.el, mR.el,
      h('div', { class: 'gb-meter-scale' }, h('b', {}, 'dB'), h('div', {}, G.meterScale.map((s) => h('span', {}, s))))),
    h('div', { class: 'gb-vfd-row gb-vfd-inds', 'aria-hidden': 'true' }, iPlay, iLoop, iCount, iFreeze, iNr));

  // ---------- klávesy ----------
  const kCount = gbKey({ label: T.keyCountIn, symbol: '●', cls: 'is-rec', latch: true, led: 'red', onclick: () => store.set({ countIn: !store.get().countIn }) });
  const kRewind = gbKey({ label: T.keyRewind, symbol: '◀◀', onclick: () => actions.rewind() });
  const kPlay = gbKey({ label: T.keyPlay, symbol: '▶', cls: 'is-play', latch: true, led: 'green', onclick: () => actions.playGroove() });
  const kStop = gbKey({ label: T.keyStop, symbol: '■', onclick: () => actions.stopAll() });
  const kFreeze = gbKey({ label: T.keyFreeze, symbol: '⟲', cls: 'is-hold', latch: true, led: 'amber', onclick: () => store.set({ freeze: !store.get().freeze }) });
  const transport = h('div', { class: 'gb-transport' }, kCount, kRewind, kPlay, kStop, kFreeze);

  // ---------- kazeta s kolečkem ----------
  const grid = h('div', { class: 'gb-grid' });
  const tapeTitle = h('span', { class: 'gb-label-title' });
  const cassette = h('div', { class: 'gb-cassette' },
    h('div', { class: 'gb-label' },
      h('div', { class: 'gb-label-head' },
        h('b', { class: 'gb-label-side' }, G.side),
        h('span', { class: 'gb-label-brand' }, G.tapeBrand),
        h('span', { class: 'gb-label-len' }, G.tape)),
      h('div', { class: 'gb-label-titlebar' }, h('span', { class: 'gb-label-k' }, T.loopWindow), tapeTitle),
      grid,
      h('div', { class: 'gb-label-window' },
        h('div', { class: 'gb-reel gb-reel-l', html: reelSvg(40) }),
        h('div', { class: 'gb-tape-run', 'aria-hidden': 'true' }),
        h('div', { class: 'gb-reel gb-reel-r', html: reelSvg(27) })),
      h('div', { class: 'gb-label-stripes', 'aria-hidden': 'true' })),
    h('div', { class: 'gb-cassette-foot', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')));
  const well = h('div', { class: 'gb-well' },
    h('div', { class: 'gb-well-head', 'aria-hidden': 'true' },
      h('span', { class: 'gb-legend' }, `◂ ${G.door}`),
      h('span', { class: 'gb-badge-loop' }, G.badgeLoop)),
    h('div', { class: 'gb-door' }, cassette, h('div', { class: 'gb-door-glass', 'aria-hidden': 'true' })));

  // ---------- voliče ----------
  const progSel = selectBox(Object.entries(PROGRESSIONS).map(([id, p]) => [id, p.name]), store.get().progression, (id) => {
    const p = PROGRESSIONS[id];
    store.set({ progression: id, groove: p.defaults?.groove ?? store.get().groove, tempo: p.defaults?.tempo ?? store.get().tempo, viewBar: 0, soloKey: null, freeze: false });
  }, { 'aria-label': T.progression, class: 'gb-select' });
  const keySel = selectBox([], store.get().key, (v) => store.set({ key: Number(v) }), { 'aria-label': T.key, class: 'gb-select' });
  const grooveSel = selectBox([], store.get().groove, (v) => store.set({ groove: v }), { 'aria-label': T.groove, class: 'gb-select' });
  const soundSel = selectBox([['ep', T.soundEp], ['pad', T.soundPad]], store.get().chordSound, (v) => store.set({ chordSound: v }), { 'aria-label': T.sound, class: 'gb-select' });

  // rackový volič: zapuštěné okénko (pod ním <select>) a krokovací klávesy ◀ ▶
  const step = (sel, d) => {
    const n = sel.options.length;
    if (!n) return;
    sel.selectedIndex = (sel.selectedIndex + d + n) % n;
    sel.dispatchEvent(new Event('change'));
  };
  const field = (label, control, cls = '') => h('div', { class: `gb-field ${cls}` },
    h('span', { class: 'gb-legend gb-engrave' }, label),
    h('div', { class: 'gb-selector' },
      h('button', { class: 'gb-step', type: 'button', 'aria-label': `${label}: ${G.stepPrev}`, title: G.stepPrev, onclick: () => step(control, -1) }, '◀'),
      h('span', { class: 'gb-sel-window' }, control),
      h('button', { class: 'gb-step', type: 'button', 'aria-label': `${label}: ${G.stepNext}`, title: G.stepNext, onclick: () => step(control, 1) }, '▶')));
  const selectors = h('div', { class: 'gb-selectors' },
    field(T.progression, progSel, 'is-wide'),
    field(T.key, keySel),
    field(T.sound, soundSel),
    field(T.groove, grooveSel, 'is-wide'));

  // ---------- tempo ----------
  const tempoReadout = h('output', { class: 'gb-ghost-text', 'data-ghost': '888' });
  const tempoRange = h('input', { type: 'range', min: 40, max: 220, step: 1, class: 'gb-slider', 'aria-label': T.tempo, oninput: (e) => store.set({ tempo: Number(e.target.value) }) });
  const nudge = (d) => store.set({ tempo: Math.max(40, Math.min(220, store.get().tempo + d)) });
  const tempo = h('div', { class: 'gb-tempo' },
    h('span', { class: 'gb-legend gb-tempo-title' }, T.tempo),
    h('button', { class: 'gb-mini', type: 'button', onclick: () => nudge(-1), 'aria-label': G.tempoMinus, title: G.tempoMinus }, '−'),
    h('div', { class: 'gb-tempo-vfd' }, tempoReadout, h('small', {}, T.bpm)),
    h('button', { class: 'gb-mini', type: 'button', onclick: () => nudge(1), 'aria-label': G.tempoPlus, title: G.tempoPlus }, '+'),
    h('div', { class: 'gb-slider-wrap' },
      tempoRange,
      h('div', { class: 'gb-slider-scale', 'aria-hidden': 'true' }, [40, 80, 120, 160, 200, 220].map((n) => h('span', { style: `--p:${(n - 40) / 180}` }, n)))));

  // ---------- knoflíky mixu ----------
  const knobs = FADERS.map((name) => knob({
    label: T.faders[name],
    value: store.get().mix[name],
    red: name === 'lead',
    onInput: (v) => store.set({ mix: { ...store.get().mix, [name]: v } }),
  }));
  const mix = h('div', { class: 'gb-mix' },
    h('div', { class: 'gb-section-title' }, h('span', { class: 'gb-legend' }, `${G.mix} · ${G.levels}`)),
    h('div', { class: 'gb-knobs' }, knobs.map((k) => k.cell)));

  // ---------- hlavička ----------
  const led = h('span', { class: 'gb-power-led', title: G.power, 'aria-hidden': 'true' });
  const screw = () => h('i', { class: 'gb-screw', 'aria-hidden': 'true' });
  const head = h('div', { class: 'gb-head' },
    h('div', { class: 'gb-brand' },
      h('span', { class: 'gb-brand-name' }, G.brand),
      h('span', { class: 'gb-brand-sub' }, h('span', { class: 'gb-kana' }, G.brandKana), G.kind)),
    h('div', { class: 'gb-model' },
      h('span', { class: 'gb-model-no' }, G.model),
      h('span', { class: 'gb-model-power' }, led, h('span', { class: 'gb-legend' }, G.indicatorPlay))));

  const badges = h('div', { class: 'gb-badges', 'aria-hidden': 'true' },
    h('span', { class: 'gb-badge-nr' }, G.badgeNrShort),
    h('span', { class: 'gb-badge-q' }, G.badgeQuartz),
    h('span', { class: 'gb-badge-series' }, G.series));

  const plate = h('div', { class: 'gb-foot', 'aria-hidden': 'true' },
    h('div', { class: 'gb-vents' }),
    h('div', { class: 'gb-plate' }, h('span', {}, G.plate), h('span', {}, G.plateSerial)));

  root.append(h('div', { class: 'gb-face' },
    screw(), screw(),
    head,
    h('div', { class: 'gb-vfd-bezel' }, display),
    badges,
    transport,
    well,
    selectors,
    tempo,
    mix,
    plate));

  // ---------- měřidla na dobách ----------
  const peaks = [0, 0];
  let meterTimers = [];
  function lightMeter(m, level, ch) {
    const n = Math.round(level * METER_SEGS);
    if (n >= peaks[ch]) peaks[ch] = n;
    m.segs.forEach((s, i) => {
      s.classList.toggle('is-on', i < n);
      s.classList.toggle('is-peak', i === peaks[ch] - 1 && i >= n);
    });
  }
  function meterHit(beat) {
    meterTimers.forEach(clearTimeout);
    const mixv = store.get().mix;
    const base = 0.45 + 0.35 * ((mixv.drums + mixv.chords + mixv.bass) / 3);
    const accent = beat === 0 ? 1 : beat % 2 === 0 ? 0.9 : 0.82;
    const lv = [0, 1].map(() => Math.min(1, base * accent + (Math.random() - 0.5) * 0.12));
    peaks[0] = Math.max(peaks[0] - 1, 0);
    peaks[1] = Math.max(peaks[1] - 1, 0);
    lightMeter(mL, lv[0], 0);
    lightMeter(mR, lv[1], 1);
    meterTimers = [0.72, 0.5, 0.34].map((f, i) => setTimeout(() => {
      lightMeter(mL, lv[0] * f, 0);
      lightMeter(mR, lv[1] * f, 1);
    }, 90 + i * 85));
  }
  function meterOff() {
    meterTimers.forEach(clearTimeout);
    peaks[0] = 0;
    peaks[1] = 0;
    lightMeter(mL, 0, 0);
    lightMeter(mR, 0, 1);
  }

  // ---------- stav ----------
  let song = buildSong(store.get());
  let live = null; // { bar, seg, chord, next }
  let countIn = null;
  let curBar = 0;
  let nextSymbol = '';

  // při držení akordu žádný další není – pole zhasne na „—“
  function renderNext() {
    const frozen = store.get().freeze;
    dNext.classList.toggle('is-ghost', frozen);
    if (frozen) dNext.classList.remove('is-soon');
    dNext.replaceChildren(...(frozen ? ['—'] : richText(nextSymbol, 'dot')));
  }

  function showChord(chord, next) {
    dChord.classList.remove('is-count');
    dChord.replaceChildren(...chordParts(chord.symbol));
    dDegree.replaceChildren(...richText(degreeLabel(chord.degree), 'dot'));
    nextSymbol = next.symbol;
    renderNext();
    dChord.classList.toggle('is-long', chord.symbol.length > 7);
  }

  // odpočet: velké číslice místo akordu, další = první akord po odpočtu
  function showCount(n) {
    dChord.classList.add('is-count');
    dChord.classList.remove('is-long');
    dChord.replaceChildren(String(n));
    nextSymbol = song.bars[curBar]?.[0]?.symbol ?? nextSymbol;
    renderNext();
  }

  function statusText() {
    if (countIn) return dLabel.textContent;
    return store.get().freeze ? T.frozen : T.nowPlaying;
  }

  function showBar(bar) {
    curBar = bar;
    dBarNum.textContent = `${String(bar + 1).padStart(2, '0')}/${String(song.bars.length).padStart(2, '0')}`;
    grid.querySelectorAll('.gb-cell').forEach((c, i) => c.classList.toggle('is-current', i === bar));
  }

  function drawBeats(count, active = -1) {
    if (dBeats.children.length !== count) dBeats.replaceChildren(...Array.from({ length: count }, () => h('i')));
    [...dBeats.children].forEach((b, i) => {
      b.classList.toggle('is-on', i === active);
      b.classList.toggle('is-one', i === 0 && i === active);
    });
  }

  function drawGrid() {
    const n = song.bars.length;
    // 12 taktů po jednom akordu → dvě řady po šesti, aby zůstalo vidět okénko s cívkami
    const six = n % 6 === 0 && n > 8 && song.bars.every((b) => b.length === 1);
    grid.style.setProperty('--cols', six ? 6 : n % 4 === 0 || n > 4 ? 4 : n);
    grid.classList.toggle('is-six', six);
    tapeTitle.textContent = progressionOf(store.get().progression).name;
    grid.replaceChildren(...song.bars.map((chords, i) => h('button', {
      class: 'gb-cell', type: 'button', title: `${T.bar} ${i + 1}`, 'aria-label': `${T.bar} ${i + 1}: ${chords.map((c) => c.symbol).join(' ')}`,
      onclick: () => (isRunning('groove') ? groove.jumpTo(i) : store.set({ viewBar: i })),
    }, h('small', { class: 'gb-cell-no' }, i + 1), chords.map((c) => h('span', {}, richText(c.symbol, 'ink'))))));
    showBar(curBar);
  }

  function idle() {
    const st = store.get();
    const bar = Math.min(st.viewBar, song.bars.length - 1);
    const chord = song.bars[bar][0];
    live = null;
    countIn = null;
    dLabel.textContent = st.freeze ? T.frozen : T.nowPlaying;
    showChord(chord, nextChordAfter(song.bars, bar, 0));
    showBar(bar);
    drawBeats(progressionOf(st.progression).meter?.[0] ?? 4);
    dNext.classList.remove('is-soon');
    meterOff();
  }

  function refreshSelectors() {
    const st = store.get();
    const prog = progressionOf(st.progression);
    progSel.value = st.progression;
    setOptions(keySel, KEY_NAMES[prog.mode].map((name, pc) => [pc, keyLabel(pc, prog.mode)]), st.key);
    const grooves = Object.entries(GROOVES).filter(([, g]) => g.meter.join('/') === prog.meter.join('/'));
    setOptions(grooveSel, grooves.map(([id, g]) => [id, g.name]), st.groove);
    soundSel.value = st.chordSound;
    tempoReadout.textContent = String(st.tempo).padStart(3, '0');
    tempoRange.value = st.tempo;
    tempoRange.style.setProperty('--p', (st.tempo - 40) / 180);
    setPressed(kCount, st.countIn);
    setPressed(kFreeze, st.freeze);
    iCount.classList.toggle('is-lit', st.countIn);
    iFreeze.classList.toggle('is-lit', st.freeze);
    display.classList.toggle('is-frozen', st.freeze);
    dLabel.textContent = statusText();
    renderNext();
    // cívky se točí rychleji při rychlejším tempu (90 BPM = 2,2 s na otáčku levé cívky)
    root.style.setProperty('--gb-reel-l', `${(2.2 * 90 / st.tempo).toFixed(2)}s`);
    root.style.setProperty('--gb-reel-r', `${(1.5 * 90 / st.tempo).toFixed(2)}s`);
    FADERS.forEach((name, i) => {
      if (Number(knobs[i].input.value) !== st.mix[name]) {
        knobs[i].input.value = st.mix[name];
        knobs[i].paint();
      }
      setBusLevel(name, faderGain(st.mix[name]));
    });
  }

  store.subscribe((st, changed) => {
    if (changed.some((k) => ['progression', 'key'].includes(k))) {
      song = buildSong(st);
      drawGrid();
      if (!isRunning('groove')) idle();
      else showBar(curBar);
    }
    if (changed.includes('viewBar') && !isRunning('groove')) idle();
    refreshSelectors();
  });

  onTransport((e) => {
    if (e.type === 'start' || e.type === 'stop') {
      const on = isRunning('groove');
      setPressed(kPlay, on);
      root.classList.toggle('is-playing', on);
      iPlay.classList.toggle('is-lit', on);
      iLoop.classList.toggle('is-lit', on);
      if (e.type === 'start' && on) {
        display.classList.remove('is-warmup');
        void display.offsetWidth; // restart animace „naskočení“ displeje
        display.classList.add('is-warmup');
      }
      if (e.type === 'stop' && e.program === 'groove') idle();
      return;
    }
    if (!isRunning('groove')) return;
    if (e.type === 'countin') {
      countIn = e.data;
      dLabel.textContent = `${T.countIn} ${e.data.beats - e.data.beat}`;
      showCount(e.data.beats - e.data.beat);
      drawBeats(e.data.beats, e.data.beat);
      led.classList.toggle('is-blink', true);
      return;
    }
    if (e.type === 'chord') {
      countIn = null;
      live = e.data;
      if (e.data.total !== song.bars.length) song = buildSong(store.get());
      dLabel.textContent = store.get().freeze ? T.frozen : T.nowPlaying;
      showChord(e.data.chord, e.data.next);
      showBar(e.data.bar);
    }
    if (e.type === 'beat') {
      drawBeats(e.data.beats, e.data.beat);
      led.classList.toggle('is-blink', e.data.beat === 0);
      meterHit(e.data.beat);
      if (live) {
        const chordsInBar = song.bars[live.bar]?.length ?? 1;
        const segBeats = e.data.beats / chordsInBar;
        const left = segBeats - (e.data.beat % segBeats);
        const changes = live.next.symbol !== live.chord.symbol;
        dNext.classList.toggle('is-soon', left === 1 && changes && !store.get().freeze);
      }
    }
  });

  drawGrid();
  refreshSelectors();
  idle();
}
