// Mikrofon → analyzátor → detekce výšky. Výsledek se vyhlazuje (medián + EMA),
// aby ručička neskákala, a chvíli se drží i po odeznění struny.

import { ensureAudio } from '../audio/engine.js';
import { detectPitch, rms } from './pitch-mpm.js';
import { freqToMidi } from '../theory/notes.js';

const GUITAR = [40, 45, 50, 55, 59, 64];
const GATE = 0.003; // ~ −50 dBFS
const HOLD_MS = 600;

export function createTuner(onReading) {
  let stream = null;
  let source = null;
  let analyser = null;
  let raf = null;
  let frame = 0;
  let history = [];
  let smoothCents = null;
  let lastNote = null;
  let lastTime = 0;
  let settings = { a4: 440, mode: 'guitar' };

  function analyse(buf, sampleRate) {
    if (rms(buf) < GATE) return null;
    const r = detectPitch(buf, sampleRate);
    if (!r || r.clarity < 0.85) return null;
    return r.freq;
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (frame++ % 3) return; // ~20 analýz za sekundu
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const freq = analyse(buf, analyser.context.sampleRate);
    const now = performance.now();

    if (freq == null) {
      if (lastNote && now - lastTime > HOLD_MS) {
        lastNote = null;
        smoothCents = null;
        history = [];
        onReading(null);
      }
      return;
    }
    history.push(freq);
    if (history.length > 5) history.shift();
    const median = [...history].sort((a, b) => a - b)[Math.floor(history.length / 2)];

    const midiExact = freqToMidi(median, settings.a4);
    const target = settings.mode === 'guitar'
      ? GUITAR.reduce((best, m) => (Math.abs(m - midiExact) < Math.abs(best - midiExact) ? m : best))
      : Math.round(midiExact);
    const cents = (midiExact - target) * 100;
    if (target !== lastNote) smoothCents = cents;
    smoothCents = smoothCents == null ? cents : smoothCents + 0.35 * (cents - smoothCents);
    lastNote = target;
    lastTime = now;
    onReading({
      freq: median,
      midi: target,
      cents: Math.max(-99, Math.min(99, smoothCents)),
      string: GUITAR.indexOf(target),
    });
  }

  return {
    async start() {
      const ctx = ensureAudio();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      loop();
    },
    stop() {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      source?.disconnect();
      stream = source = analyser = null;
      history = [];
      lastNote = null;
      onReading(null);
    },
    get running() {
      return !!stream;
    },
    configure(next) {
      settings = { ...settings, ...next };
    },
  };
}

export const GUITAR_STRINGS = GUITAR;
