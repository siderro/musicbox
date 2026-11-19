// Syntetizované bicí ve stylu 808/909. Každá funkce naplánuje jeden úder na čas t.

import { getCtx, busInput, noise, registerVoice } from './engine.js';

const METAL_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];
let openHat = null;

function envGain(t, peak, decay, attack = 0.001) {
  const g = getCtx().createGain();
  g.gain.value = 0;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function noiseSource(t, dur) {
  const src = getCtx().createBufferSource();
  src.buffer = noise();
  src.loop = true;
  src.loopStart = Math.random() * 0.5;
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur);
  return src;
}

function filter(type, freq, q = 0.7) {
  const f = getCtx().createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function metal(t, base, dur) {
  const ctx = getCtx();
  const mix = ctx.createGain();
  mix.gain.value = 0.18;
  const oscs = METAL_RATIOS.map((r) => {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = base * r;
    o.connect(mix);
    o.start(t);
    o.stop(t + dur);
    return o;
  });
  return { out: mix, oscs };
}

export function kick(t, v = 1) {
  const ctx = getCtx();
  const out = busInput('drums');
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  const g = envGain(t, v * 1.0, 0.42);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.5);

  const n = noiseSource(t, 0.03);
  const ng = envGain(t, v * 0.22, 0.012);
  n.connect(filter('highpass', 2500)).connect(ng).connect(out);
  registerVoice(g, [o], t + 0.5);
  registerVoice(ng, [n], t + 0.03);
}

export function snare(t, v = 1) {
  const ctx = getCtx();
  const out = busInput('drums');
  const n = noiseSource(t, 0.3);
  const ng = envGain(t, v * 0.55, 0.18);
  n.connect(filter('bandpass', 1800, 0.8)).connect(filter('highpass', 600)).connect(ng).connect(out);

  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
  const og = envGain(t, v * 0.45, 0.09);
  o.connect(og).connect(out);
  o.start(t);
  o.stop(t + 0.2);
  registerVoice(ng, [n], t + 0.3);
  registerVoice(og, [o], t + 0.2);
}

export function rim(t, v = 1) {
  const ctx = getCtx();
  const out = busInput('drums');
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = 1700;
  const og = envGain(t, v * 0.35, 0.025);
  o.connect(filter('bandpass', 1700, 3)).connect(og).connect(out);
  const b = ctx.createOscillator();
  b.frequency.value = 460;
  const bg = envGain(t, v * 0.4, 0.05);
  b.connect(bg).connect(out);
  [o, b].forEach((x) => { x.start(t); x.stop(t + 0.1); });
  registerVoice(og, [o], t + 0.1);
  registerVoice(bg, [b], t + 0.1);
}

export function clap(t, v = 1) {
  const out = busInput('drums');
  const n = noiseSource(t, 0.3);
  const g = getCtx().createGain();
  g.gain.value = 0;
  // tři rychlé „tlesknutí“ a doznění
  [0, 0.011, 0.022].forEach((dt) => {
    g.gain.setValueAtTime(v * 0.5, t + dt);
    g.gain.exponentialRampToValueAtTime(0.05, t + dt + 0.009);
  });
  g.gain.setValueAtTime(v * 0.45, t + 0.031);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  n.connect(filter('bandpass', 1100, 1.4)).connect(g).connect(out);
  registerVoice(g, [n], t + 0.3);
}

export function hat(t, v = 1, open = false) {
  const out = busInput('drums');
  const decay = open ? 0.32 : 0.045;
  const { out: m, oscs } = metal(t, 40, decay + 0.05);
  const g = envGain(t, v * (open ? 0.22 : 0.26), decay);
  m.connect(filter('bandpass', 10000, 0.8)).connect(filter('highpass', 7000)).connect(g).connect(out);

  const n = noiseSource(t, decay + 0.05);
  const ng = envGain(t, v * 0.08, decay);
  n.connect(filter('highpass', 8000)).connect(ng).connect(out);

  // zavřený hi-hat ztlumí otevřený
  if (!open && openHat && openHat.end > t) {
    openHat.gains.forEach((x) => {
      x.gain.cancelScheduledValues(t);
      x.gain.setTargetAtTime(0, t, 0.008);
    });
  }
  if (open) openHat = { gains: [g, ng], end: t + decay };
  registerVoice(g, oscs, t + decay + 0.05);
  registerVoice(ng, [n], t + decay + 0.05);
}

export function ride(t, v = 1) {
  const ctx = getCtx();
  const out = busInput('drums');
  const { out: m, oscs } = metal(t, 62, 1.3);
  const g = envGain(t, v * 0.14, 1.1);
  m.connect(filter('bandpass', 5200, 1.2)).connect(g).connect(out);
  const ping = ctx.createOscillator();
  ping.frequency.value = 3150;
  const pg = envGain(t, v * 0.05, 0.6);
  ping.connect(pg).connect(out);
  ping.start(t);
  ping.stop(t + 0.8);
  registerVoice(g, oscs, t + 1.3);
  registerVoice(pg, [ping], t + 0.8);
}

export function crash(t, v = 1) {
  const out = busInput('drums');
  const n = noiseSource(t, 1.8);
  const g = envGain(t, v * 0.3, 1.6, 0.003);
  n.connect(filter('highpass', 4000)).connect(g).connect(out);
  const { out: m, oscs } = metal(t, 55, 1.6);
  const mg = envGain(t, v * 0.12, 1.4);
  m.connect(filter('highpass', 5000)).connect(mg).connect(out);
  registerVoice(g, [n], t + 1.8);
  registerVoice(mg, oscs, t + 1.6);
}

export const DRUM_VOICES = {
  kick,
  snare,
  rim,
  clap,
  hat: (t, v) => hat(t, v, false),
  ohat: (t, v) => hat(t, v, true),
  ride,
  crash,
};
