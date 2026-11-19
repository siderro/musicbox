// Metronom jako kapesní digitální metronom z počátku 90. let (vymyšlená značka KOHAKU DM-91).
// Žluté lisované tělo, šedozelený segmentový LCD, gumové membránové klávesy a palcové kolečko tempa.

import { h } from './dom.js';
import { T } from '../i18n/cs.js';
import { TM } from '../i18n/metronome.js';
import { store } from '../state/store.js';
import { GROOVES } from '../data/grooves.js';
import { METERS } from '../programs/metronome-program.js';
import { onTransport, isRunning } from '../audio/transport.js';

const SVG = 'http://www.w3.org/2000/svg';
const MIN = 30;
const MAX = 260;
const MAX_BEATS = 7;
const SOUNDS = Object.keys(T.metroSounds);
const SUBDIVS = Object.keys(T.subdivs).map(Number);

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

// ---------- 7segmentová číslice (SVG, nesvítící segmenty zůstávají jako „duch“) ----------
const hSeg = (x1, x2, y) => `${x1},${y} ${x1 + 4},${y - 4} ${x2 - 4},${y - 4} ${x2},${y} ${x2 - 4},${y + 4} ${x1 + 4},${y + 4}`;
const vSeg = (x, y1, y2) => `${x},${y1} ${x + 4},${y1 + 4} ${x + 4},${y2 - 4} ${x},${y2} ${x - 4},${y2 - 4} ${x - 4},${y1 + 4}`;
const SEGS = {
  a: hSeg(8, 42, 6), g: hSeg(8, 42, 45), d: hSeg(8, 42, 84),
  f: vSeg(6, 8, 43), b: vSeg(44, 8, 43), e: vSeg(6, 47, 82), c: vSeg(44, 47, 82),
};
const DIGITS = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', ' ': '',
};

function segDigit(cls = '') {
  const polys = Object.fromEntries(Object.entries(SEGS).map(([k, p]) => [k, s('polygon', { points: p })]));
  const svg = s('svg', { class: `mt-digit ${cls}`, viewBox: '0 0 58 90', 'aria-hidden': 'true' },
    s('g', { transform: 'translate(7 0) skewX(-7)' }, ...Object.values(polys)));
  svg.set = (ch) => {
    const on = DIGITS[ch] ?? '';
    for (const [k, p] of Object.entries(polys)) p.classList.toggle('on', on.includes(k));
  };
  return svg;
}

// ---------- ikony not do LCD ----------
function noteIcon(kind) {
  const head = (x, y) => s('ellipse', { cx: x, cy: y, rx: 4.2, ry: 3.1, transform: `rotate(-22 ${x} ${y})` });
  const stem = (x, y) => s('rect', { x: x + 2.6, y: y - 15, width: 1.5, height: 15 });
  const parts = [];
  if (kind === 1) {
    parts.push(head(10, 20), stem(10, 20));
  } else {
    const xs = kind === 3 ? [4, 12, 20] : [5, 17];
    xs.forEach((x) => parts.push(head(x, 20), stem(x, 20)));
    const x1 = xs[0] + 2.6;
    const x2 = xs[xs.length - 1] + 4.1;
    parts.push(s('rect', { x: x1, y: 4.5, width: x2 - x1, height: 2.6 }));
    if (kind === 4) parts.push(s('rect', { x: x1, y: 9, width: x2 - x1, height: 2.4 }));
    if (kind === 3) parts.push(s('text', { x: 14, y: 3.2, 'text-anchor': 'middle', class: 'mt-trip' }, '3'));
  }
  return s('svg', { class: 'mt-note', viewBox: '-1 -4 28 28', 'aria-hidden': 'true' }, ...parts);
}

// řemínek na zápěstí: pletená šňůrka s plastovou průchodkou
const STRAP = `<svg viewBox="0 0 120 110" width="120" height="110">
  <path d="M92 104 C70 70 30 86 14 58 C2 36 18 8 44 10 C66 12 70 40 84 62 C90 74 94 90 98 104" fill="none" stroke="#14295e" stroke-width="9" stroke-linecap="round"/>
  <path d="M92 104 C70 70 30 86 14 58 C2 36 18 8 44 10 C66 12 70 40 84 62 C90 74 94 90 98 104" fill="none" stroke="#2c56c4" stroke-width="6" stroke-linecap="round"/>
  <path d="M92 104 C70 70 30 86 14 58 C2 36 18 8 44 10 C66 12 70 40 84 62 C90 74 94 90 98 104" fill="none" stroke="#8fb0ff" stroke-width="1.6" stroke-dasharray="2.5 3.5" opacity=".55"/>
  <rect x="78" y="72" width="16" height="22" rx="4" transform="rotate(-24 86 83)" fill="#1d1e21"/>
  <rect x="80" y="74" width="5" height="18" rx="2" transform="rotate(-24 86 83)" fill="#4a4d52"/>
</svg>`;

export function createMetronomeView(root, { actions }) {
  const metro = () => store.get().metro;
  const setMetro = (patch) => store.set({ metro: { ...metro(), ...patch } });
  const setBpm = (bpm) => setMetro({ bpm: Math.max(MIN, Math.min(MAX, Math.round(bpm))) });
  const cycle = (list, cur, dir) => list[(list.indexOf(cur) + dir + list.length) % list.length];

  // ---------- LCD ----------
  const bpmDigits = [segDigit(), segDigit(), segDigit()];
  const sigTop = segDigit('is-small');
  const sigBot = segDigit('is-small');
  const notes = Object.fromEntries(SUBDIVS.map((n) => [n, h('span', { class: 'mt-lcd-ic mt-ic-note' }, noteIcon(n))]));
  const soundIcons = Object.fromEntries(SOUNDS.map((k) => [k, h('span', { class: 'mt-lcd-ic mt-ic-word' }, TM.lcdSounds[k])]));
  const accIcon = h('span', { class: 'mt-lcd-ic mt-ic-acc' }, TM.lcdAcc);
  const playIcon = h('span', { class: 'mt-lcd-ic mt-ic-play' }, '▶');
  const battery = h('span', { class: 'mt-lcd-ic mt-ic-batt is-on', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  const beatCells = Array.from({ length: MAX_BEATS }, (_, i) => h('span', { class: 'mt-beat' },
    h('span', { class: 'mt-beat-acc' }, '>'),
    h('span', { class: 'mt-beat-bar' }),
    h('span', { class: 'mt-beat-num' }, String(i + 1))));
  const dotLine = h('span', { class: 'mt-lcd-line' });
  const lcdNote = h('span', { class: 'mt-lcd-note' });
  // velký segment přízvuku – bliká na první době
  const downbeat = h('span', { class: 'mt-lcd-down', 'aria-hidden': 'true', html:
    '<svg viewBox="0 0 30 44"><polygon points="3,3 27,22 3,41 3,31 15,22 3,13"/></svg>' });
  const sigBox = h('div', { class: 'mt-lcd-sig' });
  const soundGroup = h('span', { class: 'mt-lcd-group mt-lcd-sounds' });
  const notesGroup = h('span', { class: 'mt-lcd-group mt-lcd-notes' });

  const lcd = h('div', { class: 'mt-lcd', role: 'status', 'aria-live': 'off' },
    h('div', { class: 'mt-lcd-row mt-lcd-top' },
      soundGroup,
      notesGroup,
      h('span', { class: 'mt-lcd-group' }, accIcon, playIcon, battery)),
    h('div', { class: 'mt-lcd-main' },
      h('div', { class: 'mt-lcd-bpm' }, ...bpmDigits, h('span', { class: 'mt-lcd-unit' }, TM.lcdBpm)),
      downbeat,
      sigBox),
    h('div', { class: 'mt-lcd-beats' }, ...beatCells),
    h('div', { class: 'mt-lcd-row mt-lcd-bottom' }, dotLine, lcdNote));

  soundGroup.append(...Object.values(soundIcons));
  notesGroup.append(...Object.values(notes));
  sigBox.append(sigTop, h('span', { class: 'mt-sig-bar' }), sigBot);

  // ---------- klávesy ----------
  function mtKey({ label, legend, cls = '', latch = false, title, onclick, repeat }) {
    const btn = h('button', {
      class: `mt-key ${cls}`,
      type: 'button',
      title: title ?? label,
      'aria-label': label,
      'aria-pressed': latch ? 'false' : null,
    }, h('span', { class: 'mt-key-cap' }, legend ?? label));
    if (repeat) {
      // podržení = autorepeat; klávesnice (detail 0) jde přes click
      let timer = null;
      const stopRep = () => { clearTimeout(timer); timer = null; };
      btn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        onclick(e);
        let delay = 380;
        const rep = () => { onclick(e); delay = Math.max(45, delay * 0.8); timer = setTimeout(rep, delay); };
        timer = setTimeout(rep, delay);
      });
      ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => btn.addEventListener(ev, stopRep));
      btn.addEventListener('click', (e) => { if (e.detail === 0) onclick(e); });
    } else {
      btn.addEventListener('click', onclick);
    }
    return btn;
  }
  const keyUnit = (label, key, cls = '') => h('div', { class: `mt-key-unit ${cls}` }, h('span', { class: 'mt-legend' }, label), key);

  const dir = (e) => (e?.shiftKey ? -1 : 1);
  // po stisku režimové klávesy ukáže LCD na 1,5 s všechny volby a zvýrazní tu aktivní
  let menu = null;
  let menuTimer = null;
  const withMenu = (kind, fn) => (e) => {
    fn(e);
    menu = kind;
    clearTimeout(menuTimer);
    menuTimer = setTimeout(() => { menu = null; renderLine(); }, 1500);
    renderLine();
  };
  const kSound = mtKey({ label: T.metroSound, legend: TM.keySound, cls: 'is-mode', onclick: withMenu('sound', (e) => setMetro({ sound: cycle(SOUNDS, metro().sound, dir(e)) })) });
  const kMeter = mtKey({ label: T.meter, legend: TM.keyMeter, cls: 'is-mode', onclick: withMenu('meter', (e) => setMetro({ meter: cycle(Object.keys(METERS), metro().meter, dir(e)) })) });
  const kSubdiv = mtKey({ label: T.subdiv, legend: TM.keySubdiv, cls: 'is-mode', onclick: withMenu('subdiv', (e) => setMetro({ subdiv: cycle(SUBDIVS, metro().subdiv, dir(e)) })) });
  const kGroove = mtKey({ label: T.metroGroove, legend: TM.keyGroove, cls: 'is-mode', onclick: withMenu('groove', (e) => setMetro({ groove: cycle(Object.keys(GROOVES), metro().groove, dir(e)) })) });
  const kAccent = mtKey({ label: T.accent, legend: TM.keyAccent, cls: 'is-mode is-acc', latch: true, onclick: withMenu('accent', () => setMetro({ accent: !metro().accent })) });

  let taps = [];
  function tap() {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 2500);
    taps.push(now);
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
    }
    kTap.classList.remove('is-hit');
    void kTap.offsetWidth;
    kTap.classList.add('is-hit');
  }

  const kMinus = mtKey({ label: '−1 BPM', legend: '−', cls: 'is-round', repeat: true, onclick: () => setBpm(metro().bpm - 1) });
  const kPlus = mtKey({ label: '+1 BPM', legend: '+', cls: 'is-round', repeat: true, onclick: () => setBpm(metro().bpm + 1) });
  const kTap = mtKey({ label: T.tap, legend: TM.keyTap, cls: 'is-round is-tap', title: T.tapHint, onclick: tap });
  const kPlay = mtKey({ label: T.keyPlay, legend: h('span', {}, h('b', { 'aria-hidden': 'true' }, '▶'), TM.keyStart), cls: 'is-start', latch: true, onclick: () => actions.playMetronome() });
  const kStop = mtKey({ label: T.keyStop, legend: h('span', {}, h('b', { 'aria-hidden': 'true' }, '■'), TM.keyStop), cls: 'is-stop', onclick: () => actions.stopAll() });

  const soundUnit = keyUnit(TM.keySound, kSound);
  const accentUnit = keyUnit(TM.keyAccent, kAccent);
  const subdivUnit = keyUnit(TM.keySubdiv, kSubdiv);
  const meterUnit = keyUnit(TM.keyMeter, kMeter);
  const grooveUnit = keyUnit(TM.keyGroove, kGroove);

  // ---------- palcové kolečko tempa ----------
  const wheelDrum = h('div', { class: 'mt-wheel-drum' });
  const wheel = h('div', {
    class: 'mt-wheel', role: 'slider', tabindex: '0',
    'aria-label': T.tempo, 'aria-valuemin': MIN, 'aria-valuemax': MAX,
    title: `${TM.tempo} – ${TM.wheelHint}`,
  }, wheelDrum);
  let drag = null;
  wheel.addEventListener('pointerdown', (e) => {
    drag = { y: e.clientY, bpm: metro().bpm };
    wheel.setPointerCapture(e.pointerId);
    wheel.classList.add('is-grab');
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!drag) return;
    setBpm(drag.bpm + (drag.y - e.clientY) / 4);
  });
  const endDrag = () => { drag = null; wheel.classList.remove('is-grab'); };
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);
  let wheelAcc = 0;
  wheel.addEventListener('wheel', (e) => {
    e.preventDefault();
    wheelAcc += e.deltaY;
    const steps = Math.trunc(wheelAcc / 30);
    if (steps) { wheelAcc -= steps * 30; setBpm(metro().bpm - steps); }
  }, { passive: false });
  wheel.addEventListener('keydown', (e) => {
    const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
    let next = null;
    if (d) next = metro().bpm + d * (e.shiftKey && Math.abs(d) === 1 ? 5 : 1);
    else if (e.key === 'Home') next = MIN;
    else if (e.key === 'End') next = MAX;
    if (next == null) return;
    e.preventDefault();
    e.stopPropagation(); // globální zkratky ↑↓ by tempo změnily podruhé
    setBpm(next);
  });

  const led = h('span', { class: 'mt-led', title: TM.beatLed, 'aria-hidden': 'true' });

  // ---------- tělo přístroje ----------
  const device = h('div', { class: 'mt-device' },
    h('div', { class: 'mt-lug', 'aria-hidden': 'true' }, h('span', { class: 'mt-strap', html: STRAP })),
    h('div', { class: 'mt-shell' },
      h('div', { class: 'mt-wheel-well' },
        h('span', { class: 'mt-wheel-legend is-up', 'aria-hidden': 'true' }, '▲'),
        wheel,
        h('span', { class: 'mt-wheel-legend is-down', 'aria-hidden': 'true' }, '▼')),
      h('span', { class: 'mt-grip is-left', 'aria-hidden': 'true' }),
      h('span', { class: 'mt-grip is-right', 'aria-hidden': 'true' }),
      h('span', { class: 'mt-screw is-tl', 'aria-hidden': 'true' }),
      h('span', { class: 'mt-screw is-bl', 'aria-hidden': 'true' }),
      h('div', { class: 'mt-head' },
        h('div', { class: 'mt-logo' },
          h('span', { class: 'mt-brand' }, TM.brand),
          h('span', { class: 'mt-model' }, h('b', {}, TM.model), ' ', TM.modelName)),
        h('div', { class: 'mt-led-wrap' }, led, h('span', { class: 'mt-legend' }, TM.beatLed)),
      ),
      h('div', { class: 'mt-face' },
        h('div', { class: 'mt-bezel' }, h('span', { class: 'mt-bezel-print' }, 'LIQUID CRYSTAL DISPLAY'), lcd),
        h('div', { class: 'mt-speaker-col' },
          h('div', { class: 'mt-sticker', 'aria-hidden': 'true' },
            h('span', { class: 'mt-sticker-main' }, h('em', {}, TM.sticker[0]), h('strong', {}, TM.sticker[1])),
            h('span', { class: 'mt-sticker-sub' }, TM.stickerSub)),
          h('div', { class: 'mt-speaker', 'aria-hidden': 'true' }))),
      h('div', { class: 'mt-deck' },
        h('div', { class: 'mt-cluster is-modes' },
          soundUnit, meterUnit, subdivUnit, grooveUnit, accentUnit),
        h('div', { class: 'mt-cluster is-tempo' },
          keyUnit('', kMinus), keyUnit('', kTap, 'is-tapunit'), keyUnit('', kPlus)),
        h('div', { class: 'mt-cluster is-transport' },
          keyUnit('', kPlay), keyUnit('', kStop))),
      h('div', { class: 'mt-foot', 'aria-hidden': 'true' },
        h('span', {}, TM.madeIn),
        h('span', {}, `${MIN}–${MAX} BPM`))));

  root.append(h('div', { class: 'mt-stage' }, device));

  // ---------- stav ----------
  function beatsCount() {
    const m = metro();
    return m.sound === 'drums' ? (GROOVES[m.groove]?.meter[0] ?? 4) : METERS[m.meter].beats;
  }

  function meterParts() {
    const m = metro();
    if (m.sound === 'drums') return (GROOVES[m.groove]?.meter ?? [4, 4]).map(String);
    return m.meter.split('/');
  }

  let lastActive = -1;
  function drawBeats(active = -1) {
    const n = beatsCount();
    const m = metro();
    lastActive = active;
    beatCells.forEach((c, i) => {
      c.classList.toggle('is-avail', i < n);
      c.classList.toggle('is-on', i === active);
      c.classList.toggle('is-one', i === 0);
      c.classList.toggle('show-acc', i === 0 && i < n && m.accent);
    });
    downbeat.classList.toggle('is-on', active === 0);
  }

  const opt = (label, sel) => h('span', { class: sel ? 'mt-opt is-sel' : 'mt-opt' }, label);
  function renderLine() {
    const m = metro();
    const drums = m.sound === 'drums';
    device.dataset.menu = menu ?? '';
    lcdNote.hidden = !drums || !!menu;
    if (menu === 'sound') dotLine.replaceChildren(...SOUNDS.map((k) => opt(TM.lcdSounds[k], k === m.sound)));
    else if (menu === 'meter') dotLine.replaceChildren(...Object.keys(METERS).map((k) => opt(k, k === m.meter)));
    else if (menu === 'subdiv') dotLine.replaceChildren(...SUBDIVS.map((k) => opt(T.subdivs[k], k === m.subdiv)));
    else if (menu === 'accent') dotLine.replaceChildren(opt(TM.lcdAccent), opt(TM.lcdOn, m.accent), opt(TM.lcdOff, !m.accent));
    else if (menu === 'groove') {
      const ids = Object.keys(GROOVES);
      dotLine.replaceChildren(opt(`${ids.indexOf(m.groove) + 1}/${ids.length}`), opt(GROOVES[m.groove]?.name ?? '', true));
    } else dotLine.replaceChildren(drums ? (GROOVES[m.groove]?.name ?? '') : `${T.subdiv}: ${T.subdivs[m.subdiv]}`);
  }

  function flashLed(beat) {
    led.classList.remove('is-flash', 'is-one');
    void led.offsetWidth;
    led.classList.add('is-flash');
    if (beat === 0) led.classList.add('is-one');
  }

  function refresh() {
    const m = metro();
    const drums = m.sound === 'drums';
    const txt = String(m.bpm).padStart(3, ' ');
    bpmDigits.forEach((d, i) => d.set(txt[i]));
    const [top, bot] = meterParts();
    sigTop.set(top.slice(-1));
    sigBot.set(bot.slice(-1));
    for (const [k, el] of Object.entries(soundIcons)) el.classList.toggle('is-on', k === m.sound);
    for (const [k, el] of Object.entries(notes)) el.classList.toggle('is-on', !drums && Number(k) === m.subdiv);
    accIcon.classList.toggle('is-on', m.accent);
    lcdNote.textContent = TM.lcdDrumsMeter(`${top}/${bot}`);
    device.classList.toggle('is-drums', drums);
    // pevná sada kláves – co v daném režimu nedává smysl, je jen neaktivní
    [[meterUnit, kMeter, drums], [subdivUnit, kSubdiv, drums], [grooveUnit, kGroove, !drums]].forEach(([unit, key, off]) => {
      unit.classList.toggle('is-off', off);
      key.disabled = off;
    });
    renderLine();
    kSound.setAttribute('aria-label', `${T.metroSound}: ${T.metroSounds[m.sound]}`);
    kMeter.setAttribute('aria-label', `${T.meter}: ${m.meter}`);
    kSubdiv.setAttribute('aria-label', `${T.subdiv}: ${T.subdivs[m.subdiv]}`);
    kGroove.setAttribute('aria-label', `${T.metroGroove}: ${GROOVES[m.groove]?.name ?? ''}`);
    [kSound, kMeter, kSubdiv, kGroove].forEach((k) => { k.title = `${k.getAttribute('aria-label')} (${TM.cycleHint})`; });
    kAccent.setAttribute('aria-pressed', m.accent ? 'true' : 'false');
    wheel.setAttribute('aria-valuenow', m.bpm);
    wheel.setAttribute('aria-valuetext', `${m.bpm} ${T.bpm}`);
    wheelDrum.style.setProperty('--turn', `${m.bpm * 3}px`);
    drawBeats(isRunning('metro') ? lastActive : -1);
  }

  function setRunning() {
    const on = isRunning('metro');
    kPlay.setAttribute('aria-pressed', on ? 'true' : 'false');
    device.classList.toggle('is-running', on);
    playIcon.classList.toggle('is-on', on);
  }

  store.subscribe((st, changed) => { if (changed.includes('metro')) refresh(); });
  onTransport((e) => {
    if (e.type === 'start' || e.type === 'stop') {
      setRunning();
      if (e.type === 'stop') drawBeats();
    } else if (e.type === 'beat' && isRunning('metro')) {
      drawBeats(e.data.beat);
      flashLed(e.data.beat);
    }
  });
  refresh();
  setRunning();

  return { tap };
}
