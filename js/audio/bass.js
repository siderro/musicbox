// Syntetická basa: pila + sinus přes lowpass s rychlou obálkou („plucky“).

import { getCtx, busInput, registerVoice } from './engine.js';
import { midiToFreq } from '../theory/notes.js';

export function playBass(m, t, dur, v = 0.8) {
  const ctx = getCtx();
  const f = midiToFreq(m);
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = f;
  const sub = ctx.createOscillator();
  sub.frequency.value = f;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.8;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(400 + 900 * v, t);
  lp.frequency.exponentialRampToValueAtTime(260, t + 0.22);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.45 * v, t + 0.006);
  amp.gain.setTargetAtTime(0.3 * v, t + 0.006, 0.25);
  amp.gain.setTargetAtTime(0, t + dur, 0.035);

  saw.connect(lp);
  sub.connect(subGain).connect(lp);
  lp.connect(amp).connect(busInput('bass'));
  const end = t + dur + 0.3;
  [saw, sub].forEach((o) => { o.start(t); o.stop(end); });
  registerVoice(amp, [saw, sub], end);
}
