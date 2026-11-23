// Horní lišta: záložky, přehrávání grooveboxu, tempo, zvuk, mix a klávesy (malé, servisní),
// pod tím kolečko, tónina, groove a co právě hraje (takt, akord, další akord a odpočet „za 2“).

import { h, selectBox, setOptions } from './dom.js';
import { T } from '../i18n/cs.js';
import { store } from '../state/store.js';
import { PROGRESSIONS } from '../data/progressions.js';
import { GROOVES } from '../data/grooves.js';
import { KEY_NAMES, keyLabel } from '../theory/notes.js';
import { degreeLabel } from '../theory/chords.js';
import { buildSong, nextChordAfter, progressionOf } from '../programs/song.js';
import { onTransport, isRunning } from '../audio/transport.js';
import { setBusLevel } from '../audio/engine.js';

const FADERS = ['drums', 'chords', 'bass', 'lead'];
const faderGain = (v) => v * v * 1.25;

export function createBar(root, { nav, groove, actions }) {
  // ---------- přehrávání ----------
  const playBtn = h('button', { type: 'button', class: 'bar-btn bar-play', onclick: () => actions.toggle() });
  const check = (label, key) => {
    const input = h('input', { type: 'checkbox', onchange: (e) => store.set({ [key]: e.target.checked }) });
    return { input, el: h('label', { class: 'bar-check' }, input, label) };
  };
  const countIn = check(T.countIn.toLowerCase(), 'countIn');
  const freeze = check(T.keyFreeze.toLowerCase(), 'freeze');
  const transport = h('div', { class: 'bar-group bar-groove' },
    playBtn,
    h('button', { type: 'button', class: 'bar-btn', title: T.keyRewind, onclick: () => actions.rewind() }, '⏮'),
    countIn.el,
    freeze.el);

  // ---------- tempo ----------
  const nudge = (d) => store.set({ tempo: Math.max(40, Math.min(220, store.get().tempo + d)) });
  const tempoOut = h('output', { class: 'bar-tempo-num' });
  const tempoRange = h('input', {
    type: 'range', min: 40, max: 220, step: 1, class: 'bar-range', 'aria-label': T.tempo,
    oninput: (e) => store.set({ tempo: Number(e.target.value) }),
  });
  const tempo = h('div', { class: 'bar-group bar-groove' },
    h('button', { type: 'button', class: 'bar-btn', 'aria-label': `${T.tempo} −1`, onclick: () => nudge(-1) }, '−'),
    tempoOut, h('span', { class: 'bar-unit' }, 'bpm'),
    h('button', { type: 'button', class: 'bar-btn', 'aria-label': `${T.tempo} +1`, onclick: () => nudge(1) }, '+'),
    tempoRange);

  // ---------- zvuk, mix, klávesy ----------
  const soundSel = selectBox([['ep', T.soundEp], ['pad', T.soundPad]], store.get().chordSound, (v) => store.set({ chordSound: v }), { 'aria-label': T.sound, class: 'inline-select' });
  const sliders = FADERS.map((name) => h('input', {
    type: 'range', min: 0, max: 1, step: 0.01, class: 'bar-range', 'aria-label': T.faders[name],
    oninput: (e) => store.set({ mix: { ...store.get().mix, [name]: Number(e.target.value) } }),
  }));
  const mix = h('details', { class: 'bar-pop bar-groove' },
    h('summary', {}, 'mix'),
    h('div', { class: 'bar-pop-body bar-mix' }, FADERS.map((name, i) => h('label', {}, h('span', {}, T.faders[name]), sliders[i]))));
  const keys = h('details', { class: 'bar-pop' },
    h('summary', { title: 'Klávesové zkratky' }, '?'),
    h('ul', { class: 'bar-pop-body bar-keys' }, T.shortcuts.split(' · ').map((s) => {
      const [k, ...rest] = s.split(' ');
      // „←→ okno ruky“, „1–4 záložky“: první slovo je klávesa
      return h('li', {}, h('kbd', {}, k), ' ', rest.join(' '));
    })));
  // rozbalené okénko zavře klik mimo
  document.addEventListener('click', (e) => {
    [mix, keys].forEach((d) => { if (d.open && !d.contains(e.target)) d.open = false; });
  });

  // ---------- kolečko, tónina, groove ----------
  const step = (sel, d) => {
    const n = sel.options.length;
    if (!n) return;
    sel.selectedIndex = (sel.selectedIndex + d + n) % n;
    sel.dispatchEvent(new Event('change'));
  };
  const picker = (label, sel) => h('span', { class: 'bar-pick' },
    h('span', { class: 'bar-label' }, label),
    h('button', { type: 'button', class: 'bar-step', 'aria-label': `${label}: předchozí`, onclick: () => step(sel, -1) }, '‹'),
    sel,
    h('button', { type: 'button', class: 'bar-step', 'aria-label': `${label}: další`, onclick: () => step(sel, 1) }, '›'));
  const progSel = selectBox(Object.entries(PROGRESSIONS).map(([id, p]) => [id, p.name]), store.get().progression, (id) => {
    const p = PROGRESSIONS[id];
    store.set({ progression: id, groove: p.defaults?.groove ?? store.get().groove, tempo: p.defaults?.tempo ?? store.get().tempo, viewBar: 0, soloKey: null, freeze: false });
  }, { 'aria-label': T.progression, class: 'bar-select' });
  const keySel = selectBox([], store.get().key, (v) => store.set({ key: Number(v) }), { 'aria-label': T.key, class: 'bar-select' });
  const grooveSel = selectBox([], store.get().groove, (v) => store.set({ groove: v }), { 'aria-label': T.groove, class: 'bar-select' });

  const sBar = h('span', { class: 'bar-status-bar' });
  const sChord = h('b', { class: 'bar-status-chord' });
  const sNext = h('span', { class: 'bar-status-next' });
  const status = h('span', { class: 'bar-status', 'aria-live': 'off' }, sBar, sChord, sNext);

  root.append(
    h('div', { class: 'bar-row bar-main' },
      h('b', { class: 'bar-logo' }, T.appName),
      nav,
      h('div', { class: 'bar-right' },
        transport,
        tempo,
        h('label', { class: 'bar-group bar-groove bar-small' }, T.sound.toLowerCase(), ' ', soundSel),
        mix,
        keys)),
    h('div', { class: 'bar-row bar-song bar-groove' },
      picker(T.progression, progSel),
      picker(T.key, keySel),
      picker(T.groove, grooveSel),
      status));

  // ---------- stav ----------
  let song = buildSong(store.get());
  let live = null; // { bar, chord, next } z běžícího grooveu
  let soon = 0; // dob do změny akordu (jen při posledních dvou dobách)
  let count = 0; // odpočet před startem

  function drawStatus(bar, chord, next) {
    const frozen = store.get().freeze;
    sBar.textContent = count ? `${T.countIn} ${count}` : `${T.bar.toLowerCase()} ${bar + 1}/${song.bars.length}`;
    sChord.textContent = `${chord.symbol} (${degreeLabel(chord.degree)})`;
    if (frozen) sNext.textContent = `· ${T.frozen.toLowerCase()}`;
    else if (next.symbol === chord.symbol) sNext.textContent = '';
    else sNext.textContent = `→ ${next.symbol}${soon ? ` ${T.laneIn(soon)}` : ''}`;
    sNext.classList.toggle('is-soon', !!soon && !frozen);
  }

  function idle() {
    const st = store.get();
    const bar = Math.min(st.viewBar, song.bars.length - 1);
    live = null;
    soon = 0;
    count = 0;
    drawStatus(bar, song.bars[bar][0], nextChordAfter(song.bars, bar, 0));
  }

  function refresh() {
    const st = store.get();
    const prog = progressionOf(st.progression);
    progSel.value = st.progression;
    setOptions(keySel, KEY_NAMES[prog.mode].map((name, pc) => [pc, keyLabel(pc, prog.mode)]), st.key);
    const grooves = Object.entries(GROOVES).filter(([, g]) => g.meter.join('/') === prog.meter.join('/'));
    setOptions(grooveSel, grooves.map(([id, g]) => [id, g.name]), st.groove);
    soundSel.value = st.chordSound;
    tempoOut.textContent = st.tempo;
    tempoRange.value = st.tempo;
    countIn.input.checked = st.countIn;
    freeze.input.checked = st.freeze;
    FADERS.forEach((name, i) => {
      if (Number(sliders[i].value) !== st.mix[name]) sliders[i].value = st.mix[name];
      setBusLevel(name, faderGain(st.mix[name]));
    });
  }

  function drawPlay() {
    const on = isRunning('groove');
    playBtn.textContent = on ? `■ ${T.keyStop.toLowerCase()}` : `▶ ${T.keyPlay.toLowerCase()}`;
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  store.subscribe((st, changed) => {
    if (changed.some((k) => ['progression', 'key'].includes(k))) {
      song = buildSong(st);
      if (!isRunning('groove')) idle();
    }
    if (changed.includes('viewBar') && !isRunning('groove')) idle();
    if (changed.includes('freeze') && live) drawStatus(live.bar, live.chord, live.next);
    if (changed.includes('freeze') && !live) idle();
    refresh();
  });

  onTransport((e) => {
    if (e.type === 'start' || e.type === 'stop') {
      drawPlay();
      if (e.type === 'stop' && e.program === 'groove') idle();
      return;
    }
    if (!isRunning('groove')) return;
    if (e.type === 'countin') {
      count = e.data.beats - e.data.beat;
      const bar = live?.bar ?? Math.min(store.get().viewBar, song.bars.length - 1);
      drawStatus(bar, song.bars[bar][0], nextChordAfter(song.bars, bar, 0));
      return;
    }
    if (e.type === 'chord') {
      count = 0;
      soon = 0;
      if (e.data.total !== song.bars.length) song = buildSong(store.get());
      live = e.data;
      drawStatus(live.bar, live.chord, live.next);
    }
    if (e.type === 'beat' && live) {
      const chordsInBar = song.bars[live.bar]?.length ?? 1;
      const segBeats = e.data.beats / chordsInBar;
      const left = segBeats - (e.data.beat % segBeats);
      const s = left <= 2 && live.next.symbol !== live.chord.symbol ? left : 0;
      if (s !== soon) {
        soon = s;
        drawStatus(live.bar, live.chord, live.next);
      }
    }
  });

  refresh();
  drawPlay();
  idle();
}
