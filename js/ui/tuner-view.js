// Ladička jako stříbrný hi-fi přístroj konce 70. let (smyšlená značka HAYASE GT-770):
// podsvícený ručkový měřák se středovou nulou, skleněná stupnice s jezdcem,
// páčkový vypínač mikrofonu, otočné voliče a kontrolky.

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

// ---------- ručkový měřák ----------
const ANGLE = 42; // výchylka ručky pro ±50 centů
const PX = 180;
const PY = 262; // osa ručky leží pod okénkem, schovaná za krytem

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (cents, r) => {
  const a = rad((cents / 50) * ANGLE);
  return [PX + Math.sin(a) * r, PY - Math.cos(a) * r];
};
const arc = (c1, c2, r) => {
  const [x1, y1] = pt(c1, r);
  const [x2, y2] = pt(c2, r);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

function meterSvg() {
  const parts = [];
  for (let c = -50; c <= 50; c += 2.5) {
    const major = c % 10 === 0;
    const mid = !major && c % 5 === 0;
    const [x1, y1] = pt(c, 210);
    const [x2, y2] = pt(c, major ? 224 : mid ? 219 : 215);
    const cls = Math.abs(c) <= OK_CENTS ? ' is-ok' : Math.abs(c) >= 30 ? ' is-warn' : '';
    parts.push(`<line class="tn-m-tick${major ? ' is-major' : ''}${cls}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`);
    if (major) {
      const [tx, ty] = pt(c, 233);
      const rot = (c / 50) * ANGLE;
      parts.push(`<text class="tn-m-num" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)})">${c > 0 ? '+' : ''}${c}</text>`);
    }
  }
  const [fx, fy] = pt(-41, 182);
  const [sx, sy] = pt(41, 182);
  const needle = (cls) => `<g class="${cls}"><path d="M ${PX - 1.6} ${PY} L ${PX - 0.55} ${PY - 226} L ${PX + 0.55} ${PY - 226} L ${PX + 1.6} ${PY} Z"/></g>`;
  return `<svg class="tn-meter-svg" viewBox="0 0 360 200" aria-hidden="true">
    <defs>
      <filter id="tn-needle-blur" filterUnits="userSpaceOnUse" x="0" y="0" width="360" height="300"><feGaussianBlur stdDeviation="1.3"/></filter>
    </defs>
    <path class="tn-m-band is-warn" d="${arc(-50, -30, 206)}"/>
    <path class="tn-m-band is-warn" d="${arc(30, 50, 206)}"/>
    <path class="tn-m-band is-ok" d="${arc(-OK_CENTS, OK_CENTS, 205)}"/>
    <path class="tn-m-arc" d="${arc(-50, 50, 210)}"/>
    ${parts.join('')}
    <text class="tn-m-sym" x="${fx.toFixed(1)}" y="${fy.toFixed(1)}">${TN.flat}</text>
    <text class="tn-m-sym" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}">${TN.sharp}</text>
    <text class="tn-m-title" x="${PX}" y="104">${TN.meterTitle}</text>
    <text class="tn-m-unit" x="${PX}" y="120">${T.cents}</text>
    <text class="tn-m-brand" x="${PX}" y="146">${TN.brand}</text>
    <g class="tn-needle-shadow" filter="url(#tn-needle-blur)">${needle('tn-needle-shape')}</g>
    <g class="tn-needle">${needle('tn-needle-shape')}</g>
    <path class="tn-m-shroud" d="M 0 200 L 0 178 Q ${PX} 150 360 178 L 360 200 Z"/>
    <path class="tn-m-shroud-edge" d="M 0 178 Q ${PX} 150 360 178"/>
  </svg>`;
}

// ---------- skleněná stupnice s jezdcem ----------
const DIAL_W = 880;
const DIAL_LO = 39.4; // MIDI vlevo (těsně pod E2)
const DIAL_HI = 64.6; // MIDI vpravo (těsně nad E4)
const dialX = (m) => 28 + ((m - DIAL_LO) / (DIAL_HI - DIAL_LO)) * (DIAL_W - 56);

function dialSvg() {
  const parts = [];
  for (let m = 40; m <= 64; m++) {
    const x = dialX(m);
    const name = noteName(simplest(mod(m, 12)));
    const sharp = name.length > 1;
    parts.push(`<text class="tn-d-note${sharp ? ' is-sharp' : ''}" x="${x.toFixed(1)}" y="21">${name}</text>`);
    parts.push(`<line class="tn-d-tick is-major" x1="${x.toFixed(1)}" y1="28" x2="${x.toFixed(1)}" y2="${sharp ? 36 : 40}"/>`);
    if (m < 64) {
      for (const q of [0.25, 0.5, 0.75]) {
        const xq = dialX(m + q);
        parts.push(`<line class="tn-d-tick" x1="${xq.toFixed(1)}" y1="28" x2="${xq.toFixed(1)}" y2="${q === 0.5 ? 33 : 31}"/>`);
      }
    }
  }
  GUITAR_STRINGS.forEach((m, i) => {
    const x = dialX(m);
    parts.push(`<circle class="tn-d-string" cx="${x.toFixed(1)}" cy="52" r="7.5"/>`);
    parts.push(`<text class="tn-d-snum" x="${x.toFixed(1)}" y="55.5">${6 - i}</text>`);
    parts.push(`<text class="tn-d-sname" x="${(x + 12).toFixed(1)}" y="56">${STRING_NAMES[i]}</text>`);
  });
  return `<svg class="tn-dial-svg" viewBox="0 0 ${DIAL_W} 66" aria-hidden="true">
    <line class="tn-d-rule" x1="20" y1="28" x2="${DIAL_W - 20}" y2="28"/>
    <text class="tn-d-legend" x="8" y="21">${TN.tone}</text>
    <text class="tn-d-legend" x="8" y="56">${TN.string}</text>
    ${parts.join('')}
  </svg>`;
}

// ---------- otočný regulátor A4 – stupnice kolem knoflíku ----------
function a4ScaleSvg() {
  const parts = [];
  for (let v = 430; v <= 450; v++) {
    const a = rad(((v - 440) / 10) * 135);
    const major = v % 5 === 0;
    const r1 = 47;
    const r2 = major ? 54 : 51;
    parts.push(`<line class="tn-k-tick${major ? ' is-major' : ''}" x1="${(60 + Math.sin(a) * r1).toFixed(2)}" y1="${(60 - Math.cos(a) * r1).toFixed(2)}" x2="${(60 + Math.sin(a) * r2).toFixed(2)}" y2="${(60 - Math.cos(a) * r2).toFixed(2)}"/>`);
    if (v % 10 === 0) {
      parts.push(`<text class="tn-k-num" x="${(60 + Math.sin(a) * 63).toFixed(2)}" y="${(60 - Math.cos(a) * 63 + 3).toFixed(2)}">${v}</text>`);
    }
  }
  return `<svg class="tn-knob-scale" viewBox="-10 -10 140 140" aria-hidden="true">${parts.join('')}</svg>`;
}

// ---------- volič režimu – ryska s aretacemi ----------
function modeScaleSvg() {
  const parts = [];
  for (let d = -60; d <= 60; d += 10) {
    const a = rad(d);
    const detent = Math.abs(d) === 40;
    const r = detent ? 3 : 1.4;
    parts.push(`<circle class="tn-k-dot${detent ? ' is-detent' : ''}" cx="${(60 + Math.sin(a) * 50).toFixed(2)}" cy="${(60 - Math.cos(a) * 50).toFixed(2)}" r="${r}"/>`);
  }
  return `<svg class="tn-knob-scale" viewBox="-10 -10 140 140" aria-hidden="true">${parts.join('')}</svg>`;
}

// ---------- plynem plněný sedmisegmentovka (oranžový neon, styl 70. let) ----------
const SEG_PATHS = {
  a: '8,5 13,0 47,0 52,5 47,10 13,10',
  b: '55,8 60,13 60,43 55,48 50,43 50,13',
  c: '55,52 60,57 60,87 55,92 50,87 50,57',
  d: '8,95 13,90 47,90 52,95 47,100 13,100',
  e: '5,52 10,57 10,87 5,92 0,87 0,57',
  f: '5,8 10,13 10,43 5,48 0,43 0,13',
  g: '8,50 13,45 47,45 52,50 47,55 13,55',
};
const GLYPHS = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
  A: 'abcefg', B: 'cdefg', C: 'adef', D: 'bcdeg', E: 'adefg', F: 'aefg', G: 'acdef', '-': 'g', ' ': '',
};

// n číslic; dp = zda má číslice desetinnou tečku. Vrací { el, set(text) }.
function segDisplay(n, { cls = '', dp = false, sign = false } = {}) {
  const W = 74;
  let x = 0;
  const cells = [];
  if (sign) {
    cells.push(`<g class="tn-seg-sign" transform="translate(4 0)"><polygon class="tn-seg" data-s="h" points="0,50 5,45 31,45 36,50 31,55 5,55"/><polygon class="tn-seg" data-s="v" points="18,32 23,37 23,63 18,68 13,63 13,37"/></g>`);
    x = 46;
  }
  for (let i = 0; i < n; i++) {
    const segs = Object.entries(SEG_PATHS).map(([k, pts]) => `<polygon class="tn-seg" data-s="${k}" points="${pts}"/>`).join('');
    const dot = dp ? '<circle class="tn-seg" data-s="p" cx="68" cy="95" r="5"/>' : '';
    cells.push(`<g class="tn-seg-cell" transform="translate(${x + 6} 0) skewX(-6)">${segs}${dot}</g>`);
    x += W;
  }
  const el = h('span', { class: `tn-seg-display ${cls}`, html: `<svg viewBox="0 -2 ${x} 104" aria-hidden="true">${cells.join('')}</svg>` });
  const cellEls = [...el.querySelectorAll('.tn-seg-cell')];
  const signEl = el.querySelector('.tn-seg-sign');
  return {
    el,
    // text: znaky pro číslice, '.' rozsvítí tečku předchozí číslice; signChar '+', '-' nebo ''
    set(text, signChar = '') {
      const chars = [];
      for (const ch of String(text)) {
        if (ch === '.' && chars.length) chars[chars.length - 1].dp = true;
        else chars.push({ ch, dp: false });
      }
      while (chars.length < n) chars.unshift({ ch: ' ', dp: false });
      cellEls.forEach((cell, i) => {
        const on = GLYPHS[chars[i].ch.toUpperCase()] ?? '';
        cell.querySelectorAll('.tn-seg').forEach((seg) => {
          const k = seg.dataset.s;
          seg.classList.toggle('is-on', k === 'p' ? chars[i].dp : on.includes(k));
        });
      });
      if (signEl) {
        signEl.querySelector('[data-s="h"]').classList.toggle('is-on', signChar === '+' || signChar === '-');
        signEl.querySelector('[data-s="v"]').classList.toggle('is-on', signChar === '+');
      }
    },
  };
}

// ---------- tlumená mechanika ručky a jezdce ----------
function spring(x, k, c, apply) {
  return { x, v: 0, t: x, k, c, apply };
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function createTunerView(root, { beforeStart }) {
  const meter = h('div', { class: 'tn-meter', html: meterSvg() });
  const needle = meter.querySelector('.tn-needle');
  const needleShadow = meter.querySelector('.tn-needle-shadow');

  const pointer = h('div', { class: 'tn-dial-pointer' });
  const dial = h('div', { class: 'tn-dial' },
    h('div', { class: 'tn-dial-glass', html: dialSvg() }, pointer));

  // displej: velký tón, ♯/♭, oktáva, Hz a centy
  const noteSeg = segDisplay(1, { cls: 'tn-seg-note' });
  const octSeg = segDisplay(1, { cls: 'tn-seg-oct' });
  const hzSeg = segDisplay(4, { cls: 'tn-seg-small', dp: true });
  const ctSeg = segDisplay(2, { cls: 'tn-seg-small', sign: true });
  const accSharp = h('span', { class: 'tn-acc' }, '♯');
  const accFlat = h('span', { class: 'tn-acc' }, '♭');
  const msgEl = h('div', { class: 'tn-msg' }, TN.idleOff);
  const srEl = h('span', { class: 'tn-sr' }, TN.idleOff);
  const a4Read = h('span', { class: 'tn-readout-a4' });
  const error = h('p', { class: 'tn-error', hidden: true, role: 'alert' }, T.tunerMicError);

  const lamp = (label, color) => h('div', { class: `tn-lamp tn-lamp-${color}` }, h('i', { class: 'tn-jewel' }), h('span', { class: 'tn-legend' }, label));
  const lampLow = lamp(TN.low, 'red');
  const lampOk = lamp(TN.tuned, 'green');
  const lampHigh = lamp(TN.high, 'red');
  lampLow.classList.add('tn-lamp-low');
  lampOk.classList.add('tn-lamp-ok');
  lampHigh.classList.add('tn-lamp-high');

  const tuner = createTuner(show);

  // páčkový vypínač mikrofonu na chromovaném štítku
  const lever = h('button', {
    class: 'tn-lever', type: 'button', 'aria-pressed': 'false', 'aria-label': T.tunerStart, title: T.tunerStart,
    onclick: () => toggleMic(),
  }, h('span', { class: 'tn-lever-nut' }), h('span', { class: 'tn-lever-bat' }));

  // volič režimu (dvoupolohový otočný přepínač)
  const modeKnob = h('button', {
    class: 'tn-knob tn-knob-mode', type: 'button', role: 'switch',
    onclick: () => store.set({ tunerMode: store.get().tunerMode === 'guitar' ? 'chromatic' : 'guitar' }),
    onkeydown: (e) => {
      const map = { ArrowLeft: 'guitar', ArrowDown: 'guitar', ArrowRight: 'chromatic', ArrowUp: 'chromatic' };
      if (!map[e.key]) return;
      e.preventDefault();
      e.stopPropagation();
      store.set({ tunerMode: map[e.key] });
    },
  }, h('span', { class: 'tn-knob-cap' }, h('span', { class: 'tn-knob-mark' })));

  // kalibrace A4 (otočný knoflík + dvě tlačítka)
  const a4 = (d) => store.set({ a4: Math.max(430, Math.min(450, store.get().a4 + d)) });
  const a4Knob = h('button', {
    class: 'tn-knob tn-knob-a4', type: 'button', title: TN.knobHint,
    onclick: (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      a4(e.clientX < r.left + r.width / 2 ? -1 : 1);
    },
    onwheel: (e) => {
      e.preventDefault();
      a4(e.deltaY > 0 || e.deltaX > 0 ? -1 : 1);
    },
    onkeydown: (e) => {
      const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
      if (!d) return;
      e.preventDefault();
      e.stopPropagation();
      a4(d);
    },
  }, h('span', { class: 'tn-knob-cap' }, h('span', { class: 'tn-knob-mark' })));

  const nudge = (d, label, sym) => h('button', { class: 'tn-nudge', type: 'button', 'aria-label': label, title: label, onclick: () => a4(d) }, sym);

  // tlačítka strun – po stisku zůstanou zamáčknutá a svítí, dokud zní referenční tón
  let refTimer = null;
  const releaseRef = () => {
    clearTimeout(refTimer);
    refTimer = null;
    stringKeys.forEach((k) => k.classList.remove('is-down'));
  };
  const stringKeys = GUITAR_STRINGS.map((midi, i) => h('button', {
    class: 'tn-key', type: 'button', title: `${T.tunerRef}: ${STRING_NAMES[i]}`, 'aria-label': `${T.tunerRef}: ${STRING_NAMES[i]}`,
    onclick: () => {
      const ctx = ensureAudio();
      const v = pluck(midi, ctx.currentTime + 0.02, { vel: 0.9 });
      v.release(ctx.currentTime + 2.5, 0.3);
      releaseRef();
      stringKeys[i].classList.add('is-down');
      refTimer = setTimeout(releaseRef, 2500);
      if (!device.classList.contains('has-signal')) {
        pointerSpring.t = midi;
        kick();
      }
    },
  }, h('i', { class: 'tn-key-lamp' }), h('span', { class: 'tn-key-cap' }), h('span', { class: 'tn-key-label' }, h('b', {}, `${6 - i}`), STRING_NAMES[i])));

  const screw = (pos) => h('i', { class: `tn-screw tn-screw-${pos}`, 'aria-hidden': 'true' });

  const device = h('div', { class: 'tn-device' },
    h('div', { class: 'tn-wood tn-wood-l', 'aria-hidden': 'true' }),
    h('div', { class: 'tn-face' },
      screw('tl'), screw('tr'), screw('bl'), screw('br'),
      h('header', { class: 'tn-head' },
        h('div', { class: 'tn-logo' }, h('span', { class: 'tn-brand' }, TN.brand), h('span', { class: 'tn-model' }, TN.model)),
        h('div', { class: 'tn-sub' }, h('span', {}, TN.subtitle), h('span', { class: 'tn-sub-small' }, TN.series))),
      h('div', { class: 'tn-top' },
        h('div', { class: 'tn-meter-col' },
          h('div', { class: 'tn-bezel tn-bezel-meter' }, meter),
          h('div', { class: 'tn-lamps' }, lampLow, lampOk, lampHigh)),
        h('div', { class: 'tn-bezel tn-bezel-readout' },
          h('div', { class: 'tn-readout' },
            h('div', { class: 'tn-readout-top' }, h('span', { class: 'tn-readout-mode' }), a4Read),
            h('div', { class: 'tn-readout-note' }, noteSeg.el, h('span', { class: 'tn-accs' }, accSharp, accFlat), octSeg.el),
            h('div', { class: 'tn-readout-nums' },
              h('span', { class: 'tn-num' }, hzSeg.el, h('i', {}, 'Hz')),
              h('span', { class: 'tn-num' }, ctSeg.el, h('i', {}, T.cents))),
            msgEl,
            h('div', { 'aria-live': 'polite' }, srEl)))),
      h('div', { class: 'tn-bezel tn-bezel-dial' }, dial),
      h('div', { class: 'tn-controls' },
        h('div', { class: 'tn-ctl tn-ctl-mic' },
          h('span', { class: 'tn-legend tn-legend-head' }, TN.mic),
          h('div', { class: 'tn-mic-row' },
            h('div', { class: 'tn-plate' },
              h('i', { class: 'tn-plate-screw' }), h('i', { class: 'tn-plate-screw is-bottom' }),
              h('span', { class: 'tn-plate-legend' }, TN.on),
              lever,
              h('span', { class: 'tn-plate-legend' }, TN.off)),
            h('i', { class: 'tn-jewel tn-mic-lamp' }))),
        h('div', { class: 'tn-ctl tn-ctl-mode' },
          h('span', { class: 'tn-legend tn-legend-head' }, TN.mode),
          h('div', { class: 'tn-knob-well', html: modeScaleSvg() },
            h('span', { class: 'tn-legend tn-pos tn-pos-l' }, T.tunerModeGuitar),
            h('span', { class: 'tn-legend tn-pos tn-pos-r' }, TN.chromShort),
            modeKnob)),
        h('div', { class: 'tn-ctl tn-ctl-a4' },
          h('span', { class: 'tn-legend tn-legend-head' }, TN.a4),
          h('div', { class: 'tn-knob-well', html: a4ScaleSvg() }, a4Knob),
          h('div', { class: 'tn-nudges' }, nudge(-1, TN.down, '−'), h('span', { class: 'tn-legend' }, 'Hz'), nudge(1, TN.up, '+'))),
        h('div', { class: 'tn-ctl tn-ctl-strings' },
          h('span', { class: 'tn-legend tn-legend-head' }, TN.strings),
          h('div', { class: 'tn-keys' }, stringKeys)))),
    h('div', { class: 'tn-wood tn-wood-r', 'aria-hidden': 'true' }));

  root.append(h('div', { class: 'tn-stage' },
    device,
    h('p', { class: 'tn-note-text' }, T.tunerRef, ' · ', T.tunerNote),
    error));

  // --- mechanika: pružina s tlumením (lehký překmit jako u skutečné ručky) ---
  const needleSpring = spring(0, 220, 17, (x) => {
    const a = (Math.max(-54, Math.min(54, x)) / 50) * ANGLE;
    needle.setAttribute('transform', `rotate(${a.toFixed(3)} ${PX} ${PY})`);
    needleShadow.setAttribute('transform', `translate(3 4) rotate(${a.toFixed(3)} ${PX} ${PY})`);
  });
  const pointerSpring = spring(52, 60, 14, (x) => {
    pointer.style.left = `${((dialX(x) / DIAL_W) * 100).toFixed(3)}%`;
  });
  const springs = [needleSpring, pointerSpring];
  let raf = null;
  let last = 0;

  function tick(now) {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    let busy = false;
    for (const s of springs) {
      const acc = s.k * (s.t - s.x) - s.c * s.v;
      s.v += acc * dt;
      s.x += s.v * dt;
      if (Math.abs(s.t - s.x) < 0.02 && Math.abs(s.v) < 0.02) {
        s.x = s.t;
        s.v = 0;
      } else busy = true;
      s.apply(s.x);
    }
    raf = busy ? requestAnimationFrame(tick) : null;
  }
  function kick() {
    if (reducedMotion()) {
      // bez animace: ručka i jezdec skočí rovnou na místo
      for (const s of springs) {
        s.x = s.t;
        s.v = 0;
        s.apply(s.x);
      }
      return;
    }
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  springs.forEach((s) => s.apply(s.x));

  let reading = null;

  function renderReadout() {
    const r = reading;
    if (!r) {
      noteSeg.set(' ');
      octSeg.set(' ');
      hzSeg.set('    ');
      ctSeg.set('  ', '');
      accSharp.classList.remove('is-on');
      accFlat.classList.remove('is-on');
      const idle = tuner.running ? T.tunerIdle : TN.idleOff;
      msgEl.textContent = idle;
      srEl.textContent = idle;
      return;
    }
    const name = noteName(simplest(mod(r.midi, 12)));
    const octave = Math.floor(r.midi / 12) - 1;
    noteSeg.set(name[0]);
    octSeg.set(String(octave).slice(-1));
    accSharp.classList.toggle('is-on', name.includes('♯') || name.includes('#'));
    accFlat.classList.toggle('is-on', name.includes('♭') || /^[A-G]b/.test(name));
    hzSeg.set(r.freq >= 999.95 ? String(Math.round(r.freq)) : r.freq.toFixed(1));
    const c = Math.round(Math.max(-99, Math.min(99, r.cents)));
    ctSeg.set(String(Math.abs(c)).padStart(2, '0'), c > 0 ? '+' : c < 0 ? '-' : '');
    msgEl.textContent = '';
    srEl.textContent = `${name}${octave} · ${r.freq.toFixed(1)} Hz · ${c > 0 ? '+' : ''}${c} ${T.cents}`;
  }

  function show(r) {
    reading = r;
    stringKeys.forEach((k, i) => k.classList.toggle('is-lit', !!r && r.string === i));
    renderReadout();
    if (!r) {
      device.classList.remove('is-ok', 'is-low', 'is-high', 'has-signal');
      needleSpring.t = 0;
      kick();
      return;
    }
    const ok = Math.abs(r.cents) <= OK_CENTS;
    device.classList.add('has-signal');
    device.classList.toggle('is-ok', ok);
    device.classList.toggle('is-low', !ok && r.cents < 0);
    device.classList.toggle('is-high', !ok && r.cents > 0);
    needleSpring.t = Math.max(-50, Math.min(50, r.cents));
    // jezdec ukazuje výšku v rozsahu E2–E4; chromatické tóny mimo rozsah se přeloží o oktávu
    let m = r.midi + r.cents / 100;
    while (m < DIAL_LO) m += 12;
    while (m > DIAL_HI) m -= 12;
    pointerSpring.t = m;
    kick();
  }

  function setMic(on) {
    lever.setAttribute('aria-pressed', on ? 'true' : 'false');
    lever.setAttribute('aria-label', on ? T.tunerStop : T.tunerStart);
    lever.title = on ? T.tunerStop : T.tunerStart;
    device.classList.toggle('is-on', on);
    renderReadout();
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
    const chromatic = st.tunerMode === 'chromatic';
    modeKnob.style.setProperty('--rot', chromatic ? '40deg' : '-40deg');
    modeKnob.setAttribute('aria-checked', chromatic ? 'true' : 'false');
    modeKnob.setAttribute('aria-label', `${TN.modeLabel}: ${chromatic ? T.tunerModeChromatic : T.tunerModeGuitar}`);
    modeKnob.title = modeKnob.getAttribute('aria-label');
    device.dataset.mode = st.tunerMode;
    a4Knob.style.setProperty('--rot', `${((st.a4 - 440) / 10) * 135}deg`);
    a4Knob.setAttribute('aria-label', `${TN.a4}: ${st.a4} Hz`);
    a4Read.textContent = `A4 ${st.a4} Hz`;
    tuner.configure({ a4: st.a4, mode: st.tunerMode });
  }
  store.subscribe(refresh);
  refresh();
  renderReadout();

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
