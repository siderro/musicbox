// Akordový nástroj: FM elektrické piano („ep“) nebo teplý pad („pad“).

import { getCtx, busInput, registerVoice } from './engine.js';
import { midiToFreq } from '../theory/notes.js';

function epNote(m, t, dur, v) {
  const ctx = getCtx();
  const out = busInput('chords');
  const f = midiToFreq(m);

  const carrier = ctx.createOscillator();
  carrier.frequency.value = f;
  const mod = ctx.createOscillator();
  mod.frequency.value = f;
  const index = ctx.createGain();
  index.gain.setValueAtTime(f * 2.2 * v, t);
  index.gain.exponentialRampToValueAtTime(Math.max(1, f * 0.25), t + 0.6);
  mod.connect(index).connect(carrier.frequency);

  const tine = ctx.createOscillator();
  tine.frequency.value = Math.min(f * 14, 9000);
  const tineGain = ctx.createGain();
  tineGain.gain.setValueAtTime(0, t);
  tineGain.gain.linearRampToValueAtTime(0.035 * v, t + 0.002);
  tineGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.2 * v, t + 0.004);
  amp.gain.setTargetAtTime(0.07 * v, t + 0.004, 0.7);
  amp.gain.setTargetAtTime(0, t + dur, 0.07);

  carrier.connect(amp);
  tine.connect(tineGain).connect(amp);
  amp.connect(out);
  const end = t + dur + 0.5;
  [carrier, mod, tine].forEach((o) => { o.start(t); o.stop(end); });
  registerVoice(amp, [carrier, mod, tine], end);
}

function padNote(m, t, dur, v) {
  const ctx = getCtx();
  const out = busInput('chords');
  const f = midiToFreq(m);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.8;
  lp.frequency.setValueAtTime(400, t);
  lp.frequency.linearRampToValueAtTime(1400, t + 0.35);
  lp.frequency.setTargetAtTime(900, t + 0.35, 0.8);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.09 * v, t + 0.15);
  amp.gain.setTargetAtTime(0, t + dur, 0.25);

  const oscs = [-7, 7].map((cents) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = cents;
    o.connect(lp);
    return o;
  });
  lp.connect(amp).connect(out);
  const end = t + dur + 1.2;
  oscs.forEach((o) => { o.start(t); o.stop(end); });
  registerVoice(amp, oscs, end);
}

export function playChord(midis, t, dur, v = 0.8, sound = 'ep') {
  const voice = sound === 'pad' ? padNote : epNote;
  // lehké „rozbrnknutí“ zdola nahoru
  midis.forEach((m, i) => voice(m, t + i * 0.006, dur, v));
}
