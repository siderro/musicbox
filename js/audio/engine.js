// Jeden AudioContext pro celou aplikaci.
// Signál: hlasy → busy (drums, chords, bass, lead, click) → master → limiter → výstup.
// Akordy, lead a trochu bicích posílají signál do společného dozvuku.

import { makeImpulse } from './reverb.js';

let ctx = null;
let buses = null;
let leadIn = null;
let noiseBuf = null;
const active = new Set();
const levels = {};

export const getCtx = () => ctx;

export function ensureAudio() {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' });
    build();
  }
  if (ctx.state !== 'running') ctx.resume();
  return ctx;
}

function build() {
  const master = ctx.createGain();
  master.gain.value = 0.8;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter).connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx, 2.2, 0.5);
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = 0.9;
  reverb.connect(reverbReturn).connect(master);

  buses = {};
  const sends = { drums: 0.05, chords: 0.3, lead: 0.22 };
  for (const name of ['drums', 'chords', 'bass', 'lead', 'click']) {
    const g = ctx.createGain();
    g.gain.value = levels[name] ?? 1;
    g.connect(master);
    if (sends[name]) {
      const send = ctx.createGain();
      send.gain.value = sends[name];
      g.connect(send).connect(reverb);
    }
    buses[name] = g;
  }

  // „Kombo“ pro lead: jemné zkreslení a ořez výšek.
  leadIn = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.curve = softClip(1.8);
  shaper.oversample = '2x';
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3500;
  tone.Q.value = 0.7;
  leadIn.connect(shaper).connect(tone).connect(buses.lead);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function softClip(drive) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

export const busInput = (name) => (name === 'lead' ? leadIn : buses[name]);
export const noise = () => noiseBuf;

export function setBusLevel(name, value) {
  levels[name] = value;
  if (!ctx) return;
  buses[name].gain.setTargetAtTime(value, ctx.currentTime, 0.02);
}

// Evidence znějících hlasů, aby šlo všechno okamžitě umlčet (stop).
export function registerVoice(gain, sources, endTime) {
  const now = ctx.currentTime;
  for (const v of active) if (v.endTime < now) active.delete(v);
  active.add({ gain, sources, endTime });
}

export function silenceAll() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const v of active) {
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setTargetAtTime(0, now, 0.015);
      v.sources.forEach((s) => s.stop(now + 0.12));
    } catch {
      // zdroj už skončil
    }
  }
  active.clear();
}
