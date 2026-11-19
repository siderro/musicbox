// Zvuky metronomu. level: 2 = přízvuk (1. doba), 1 = doba, 0 = dělení doby.

import { getCtx, busInput, noise, registerVoice } from './engine.js';

const LEVEL_GAIN = [0.18, 0.32, 0.5];

function beep(t, level) {
  const ctx = getCtx();
  const o = ctx.createOscillator();
  o.frequency.value = [800, 1050, 1550][level];
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(LEVEL_GAIN[level], t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  o.connect(g).connect(busInput('click'));
  o.start(t);
  o.stop(t + 0.05);
  registerVoice(g, [o], t + 0.05);
}

function wood(t, level) {
  const ctx = getCtx();
  const base = [700, 820, 1000][level];
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(LEVEL_GAIN[level] * 1.2, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  const oscs = [1, 2.7].map((r, i) => {
    const o = ctx.createOscillator();
    o.frequency.value = base * r;
    const og = ctx.createGain();
    og.gain.value = i ? 0.3 : 1;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 0.08);
    return o;
  });
  const n = ctx.createBufferSource();
  n.buffer = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = base * 1.5;
  bp.Q.value = 6;
  const ng = ctx.createGain();
  ng.gain.value = 0.6;
  n.connect(bp).connect(ng).connect(g);
  n.start(t);
  n.stop(t + 0.02);
  g.connect(busInput('click'));
  registerVoice(g, [...oscs, n], t + 0.08);
}

export function click(t, level = 1, sound = 'click') {
  (sound === 'wood' ? wood : beep)(t, level);
}
