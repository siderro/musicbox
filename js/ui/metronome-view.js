// Metronom: velké číslo BPM, řada dob (přízvuk tučně, hraná doba invertovaná),
// volby zvuku, taktu, dělení a rytmu bicích jako odkazy, tap, start a stop.

import { h, selectBox, setOptions } from './dom.js';
import { T } from '../i18n/cs.js';
import { store } from '../state/store.js';
import { GROOVES } from '../data/grooves.js';
import { METERS } from '../programs/metronome-program.js';
import { onTransport, isRunning } from '../audio/transport.js';

const MIN = 30;
const MAX = 260;
const SOUNDS = Object.keys(T.metroSounds);
const SUBDIVS = Object.keys(T.subdivs).map(Number);

export function createMetronomeView(root, { actions }) {
  const metro = () => store.get().metro;
  const setMetro = (patch) => store.set({ metro: { ...metro(), ...patch } });
  const setBpm = (bpm) => setMetro({ bpm: Math.max(MIN, Math.min(MAX, Math.round(bpm))) });

  let taps = [];
  function tap() {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 2500);
    taps.push(now);
    if (taps.length < 2) return;
    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
  }

  // ---------- tempo ----------
  const bpmEl = h('span', { class: 'mt-bpm' });
  const range = h('input', {
    type: 'range', min: MIN, max: MAX, step: 1, class: 'mt-range', 'aria-label': T.tempo,
    oninput: (e) => setBpm(Number(e.target.value)),
  });
  const playBtn = h('button', { type: 'button', class: 'mt-play', onclick: () => (isRunning('metro') ? actions.stopAll() : actions.playMetronome()) });
  const beatsEl = h('div', { class: 'mt-beats', 'aria-hidden': 'true' });

  // ---------- volby jako odkazy ----------
  const choiceRow = (label, values, names, key) => {
    const btns = values.map((v) => h('button', {
      type: 'button', class: 'ctl', 'aria-pressed': 'false', dataset: { v: String(v) },
      onclick: () => setMetro({ [key]: v }),
    }, names(v)));
    const row = h('div', { class: 'mt-row' }, h('span', { class: 'mt-label' }, label), h('span', { class: 'mt-opts' }, btns));
    return { row, mark: () => btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === String(metro()[key]) ? 'true' : 'false')) };
  };
  const sound = choiceRow(T.metroSound, SOUNDS, (k) => T.metroSounds[k], 'sound');
  const meter = choiceRow(T.meter, Object.keys(METERS), (k) => k, 'meter');
  const subdiv = choiceRow(T.subdiv, SUBDIVS, (k) => T.subdivs[k], 'subdiv');
  const grooveSel = selectBox([], metro().groove, (v) => setMetro({ groove: v }), { class: 'inline-select', 'aria-label': T.metroGroove });
  const grooveRow = h('div', { class: 'mt-row' }, h('span', { class: 'mt-label' }, T.metroGroove), grooveSel);
  const accent = h('input', { type: 'checkbox', onchange: (e) => setMetro({ accent: e.target.checked }) });

  root.append(h('div', { class: 'mt' },
    h('div', { class: 'mt-tempo' },
      h('button', { type: 'button', class: 'bar-btn mt-step', 'aria-label': '−1 BPM', onclick: () => setBpm(metro().bpm - 1) }, '−'),
      h('div', { class: 'mt-bpm-box' }, bpmEl, h('span', { class: 'mt-unit' }, 'bpm')),
      h('button', { type: 'button', class: 'bar-btn mt-step', 'aria-label': '+1 BPM', onclick: () => setBpm(metro().bpm + 1) }, '+')),
    range,
    h('div', { class: 'mt-transport' },
      playBtn,
      h('button', { type: 'button', class: 'bar-btn', title: T.tapHint, onclick: tap }, `${T.tap} (T)`)),
    beatsEl,
    h('div', { class: 'mt-options' },
      sound.row,
      meter.row,
      subdiv.row,
      grooveRow,
      h('div', { class: 'mt-row' }, h('span', { class: 'mt-label' }, T.accent), h('label', { class: 'bar-check' }, accent, 'první doba nahlas')))));

  // ---------- stav ----------
  const beatsCount = () => (metro().sound === 'drums' ? (GROOVES[metro().groove]?.meter[0] ?? 4) : METERS[metro().meter].beats);

  let active = -1;
  function drawBeats() {
    const n = beatsCount();
    if (beatsEl.children.length !== n) beatsEl.replaceChildren(...Array.from({ length: n }, (_, i) => h('span', {}, i + 1)));
    [...beatsEl.children].forEach((b, i) => {
      b.classList.toggle('is-accent', i === 0 && metro().accent);
      b.classList.toggle('is-now', i === active);
    });
  }

  function refresh() {
    const m = metro();
    const drums = m.sound === 'drums';
    bpmEl.textContent = m.bpm;
    range.value = m.bpm;
    sound.mark();
    meter.mark();
    subdiv.mark();
    meter.row.hidden = drums;
    subdiv.row.hidden = drums;
    grooveRow.hidden = !drums;
    setOptions(grooveSel, Object.entries(GROOVES).map(([id, g]) => [id, `${g.name} (${g.meter.join('/')})`]), m.groove);
    accent.checked = m.accent;
    drawBeats();
  }

  function drawPlay() {
    const on = isRunning('metro');
    playBtn.textContent = on ? `■ ${T.keyStop.toLowerCase()}` : `▶ ${T.keyPlay.toLowerCase()}`;
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  store.subscribe((st, changed) => { if (changed.includes('metro')) refresh(); });
  onTransport((e) => {
    if (e.type === 'start' || e.type === 'stop') {
      drawPlay();
      if (e.type === 'stop') {
        active = -1;
        drawBeats();
      }
    } else if (e.type === 'beat' && isRunning('metro')) {
      active = e.data.beat;
      drawBeats();
    }
  });
  refresh();
  drawPlay();

  return { tap };
}
