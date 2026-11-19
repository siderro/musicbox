// Drnkaná struna metodou Karplus-Strong. Zvuk každého tónu se spočítá jednou do bufferu
// a pak se přehrává; bend, slide a vibrato mění playbackRate.

import { getCtx, busInput, registerVoice } from './engine.js';
import { midiToFreq } from '../theory/notes.js';

const cache = new Map();
const LENGTH = 4;

function ksBuffer(midi) {
  const ctx = getCtx();
  const key = `${midi}@${ctx.sampleRate}`;
  if (cache.has(key)) return cache.get(key);
  const sr = ctx.sampleRate;
  const f = midiToFreq(midi);
  // smyčka se zprůměrováním má zpoždění N + 0,5 vzorku; zbytek doladí playbackRate
  const N = Math.max(2, Math.floor(sr / f - 0.5));
  const rate = f / (sr / (N + 0.5));
  const len = Math.floor(sr * LENGTH);
  const buf = ctx.createBuffer(1, len, sr);
  const y = buf.getChannelData(0);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    lp += 0.55 * (Math.random() * 2 - 1 - lp);
    y[i] = lp;
  }
  const decay = midi > 70 ? 0.998 : 0.996;
  for (let i = N; i < len; i++) y[i] = decay * 0.5 * (y[i - N] + (i - N - 1 >= 0 ? y[i - N - 1] : 0));
  // odstranit stejnosměrnou složku
  let mean = 0;
  for (let i = 0; i < N; i++) mean += y[i];
  mean /= N;
  for (let i = 0; i < len; i++) y[i] -= mean * Math.exp(-i / (sr * 0.05));
  const entry = { buf, rate };
  cache.set(key, entry);
  return entry;
}

export function warmUp(midis) {
  if (!getCtx()) return;
  midis.forEach(ksBuffer);
}

// Vrací ovladač tónu. Zdroj hraje celou délku bufferu, konec tónu řídí release().
export function pluck(midi, t, { vel = 0.8, bus = 'lead' } = {}) {
  const ctx = getCtx();
  const { buf, rate } = ksBuffer(midi);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.setValueAtTime(rate, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel * 0.9, t + 0.002);
  src.connect(g).connect(busInput(bus));
  src.start(t);
  g.gain.setTargetAtTime(0, t + LENGTH - 0.2, 0.04);
  src.stop(t + LENGTH);
  registerVoice(g, [src], t + LENGTH);

  const ratio = (st) => rate * 2 ** (st / 12);
  return {
    midi,
    // posun výšky o půltóny vůči původnímu tónu (bend, slide)
    rampPitch(fromSt, toSt, at, glide) {
      src.playbackRate.setValueAtTime(ratio(fromSt), at);
      src.playbackRate.linearRampToValueAtTime(ratio(toSt), at + glide);
    },
    holdPitch(st, at) {
      src.playbackRate.setValueAtTime(ratio(st), at);
    },
    vibrato(from, to, depthSt = 0.25) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.5;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, from);
      depth.gain.linearRampToValueAtTime(rate * (2 ** (depthSt / 12) - 1), from + 0.25);
      lfo.connect(depth).connect(src.playbackRate);
      lfo.start(from);
      lfo.stop(Math.max(from + 0.01, to));
    },
    release(at, tau = 0.04) {
      g.gain.setTargetAtTime(0, at, tau);
    },
  };
}
