// Ladička: velký tón, odchylka v centech číslem a na stupnici −50…+50 (jedna čára = měření),
// struny jako referenční tóny, mikrofon, režim a kalibrace A4.

import { h } from './dom.js';
import { T } from '../i18n/cs.js';
import { TN } from '../i18n/tuner.js';
import { store } from '../state/store.js';
import { createTuner, GUITAR_STRINGS } from '../tuner/tuner.js';
import { ensureAudio } from '../audio/engine.js';
import { pluck } from '../audio/pluck.js';
import { simplest, noteName, mod } from '../theory/notes.js';

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const OK_CENTS = 5;

// stupnice centů: x od 0 do 1000 pro −50…+50
const cx = (c) => 500 + Math.max(-50, Math.min(50, c)) * 9.6;
function scaleSvg() {
  const parts = [`<rect class="tn-ok-zone" x="${cx(-OK_CENTS)}" y="8" width="${cx(OK_CENTS) - cx(-OK_CENTS)}" height="44"/>`];
  for (let c = -50; c <= 50; c += 5) {
    const major = c % 10 === 0;
    parts.push(`<line class="tn-tick${major ? ' is-major' : ''}" x1="${cx(c)}" y1="${c === 0 ? 4 : major ? 14 : 22}" x2="${cx(c)}" y2="${c === 0 ? 56 : major ? 46 : 38}"/>`);
    if (major) parts.push(`<text class="tn-num" x="${cx(c)}" y="76">${c > 0 ? '+' : ''}${c}</text>`);
  }
  parts.push('<line class="tn-mark" x1="500" y1="0" x2="500" y2="60"/>');
  return `<svg class="tn-scale" viewBox="-20 0 1040 82" aria-hidden="true">${parts.join('')}</svg>`;
}

export function createTunerView(root, { beforeStart }) {
  const noteEl = h('span', { class: 'tn-note' }, '–');
  const octEl = h('sub', { class: 'tn-oct' });
  const centsEl = h('span', { class: 'tn-cents' });
  const hzEl = h('span', { class: 'tn-hz' });
  const verdict = h('p', { class: 'tn-verdict', 'aria-live': 'polite' }, TN.idleOff);
  const scale = h('div', { class: 'tn-scale-box', html: scaleSvg() });
  const mark = scale.querySelector('.tn-mark');
  const error = h('p', { class: 'tn-error', hidden: true, role: 'alert' }, T.tunerMicError);

  const tuner = createTuner(show);

  const micBtn = h('button', { type: 'button', class: 'tn-mic', 'aria-pressed': 'false', onclick: () => toggleMic() });
  const modeBtns = ['guitar', 'chromatic'].map((m) => h('button', {
    type: 'button', class: 'ctl', 'aria-pressed': 'false', dataset: { mode: m },
    onclick: () => store.set({ tunerMode: m }),
  }, m === 'guitar' ? T.tunerModeGuitar : T.tunerModeChromatic));
  const a4 = (d) => store.set({ a4: Math.max(430, Math.min(450, store.get().a4 + d)) });
  const a4Out = h('output', { class: 'mono' });

  // struny: klik = referenční tón; struna, kterou ladička slyší, je tučně
  const stringBtns = GUITAR_STRINGS.map((midi, i) => h('button', {
    type: 'button', class: 'tn-string', title: `${T.tunerRef}: ${STRING_NAMES[i]}`,
    onclick: () => {
      const ctx = ensureAudio();
      const v = pluck(midi, ctx.currentTime + 0.02, { vel: 0.9 });
      v.release(ctx.currentTime + 2.5, 0.3);
    },
  }, h('small', {}, 6 - i), STRING_NAMES[i]));

  root.append(h('div', { class: 'tn' },
    h('div', { class: 'tn-reading' },
      h('div', { class: 'tn-big' }, noteEl, octEl),
      h('div', { class: 'tn-nums' }, centsEl, hzEl)),
    scale,
    verdict,
    h('div', { class: 'tn-strings' }, h('span', { class: 'tn-label' }, TN.strings), stringBtns),
    h('div', { class: 'tn-controls' },
      micBtn,
      h('span', { class: 'ctl-group' }, h('span', { class: 'ctl-label' }, TN.mode), modeBtns),
      h('span', { class: 'ctl-group' }, h('span', { class: 'ctl-label' }, TN.a4),
        h('button', { type: 'button', class: 'bar-btn', 'aria-label': TN.down, onclick: () => a4(-1) }, '−'),
        a4Out,
        h('button', { type: 'button', class: 'bar-btn', 'aria-label': TN.up, onclick: () => a4(1) }, '+'))),
    h('p', { class: 'tn-help' }, T.tunerNote),
    error));

  function show(r) {
    stringBtns.forEach((b, i) => b.classList.toggle('is-heard', !!r && r.string === i));
    root.classList.toggle('has-signal', !!r);
    if (!r) {
      noteEl.textContent = '–';
      octEl.textContent = '';
      centsEl.textContent = '';
      hzEl.textContent = '';
      verdict.textContent = tuner.running ? T.tunerIdle : TN.idleOff;
      verdict.className = 'tn-verdict';
      mark.setAttribute('visibility', 'hidden');
      return;
    }
    const c = Math.round(Math.max(-99, Math.min(99, r.cents)));
    const ok = Math.abs(r.cents) <= OK_CENTS;
    noteEl.textContent = noteName(simplest(mod(r.midi, 12)));
    octEl.textContent = Math.floor(r.midi / 12) - 1;
    centsEl.textContent = `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c)} ${T.cents}`;
    hzEl.textContent = `${r.freq.toFixed(1)} Hz`;
    verdict.textContent = ok ? TN.tuned : r.cents < 0 ? TN.low : TN.high;
    verdict.className = `tn-verdict${ok ? ' is-ok' : ''}`;
    mark.setAttribute('visibility', 'visible');
    mark.setAttribute('x1', cx(r.cents));
    mark.setAttribute('x2', cx(r.cents));
  }

  function setMic(on) {
    micBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    micBtn.textContent = on ? `■ ${T.tunerStop.toLowerCase()}` : `● ${T.tunerStart.toLowerCase()}`;
    show(null);
  }

  async function toggleMic() {
    if (tuner.running) {
      tuner.stop();
      setMic(false);
      return;
    }
    beforeStart();
    error.hidden = true;
    try {
      tuner.configure({ a4: store.get().a4, mode: store.get().tunerMode });
      await tuner.start();
      setMic(true);
    } catch {
      error.hidden = false;
      setMic(false);
    }
  }

  function refresh() {
    const st = store.get();
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === st.tunerMode ? 'true' : 'false'));
    a4Out.textContent = `${st.a4} Hz`;
    tuner.configure({ a4: st.a4, mode: st.tunerMode });
  }
  store.subscribe(refresh);
  refresh();
  setMic(false);

  return {
    stop() {
      if (tuner.running) {
        tuner.stop();
        setMic(false);
      }
    },
    get running() {
      return tuner.running;
    },
  };
}
