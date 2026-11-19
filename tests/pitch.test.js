import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch } from '../js/tuner/pitch-mpm.js';

const SR = 48000;

function tone(freq, harmonics = [1]) {
  const buf = new Float32Array(4096);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = harmonics.reduce((s, a, h) => s + a * Math.sin((2 * Math.PI * freq * (h + 1) * i) / SR), 0);
  }
  return buf;
}

const cents = (a, b) => 1200 * Math.log2(a / b);

for (const f of [82.41, 110, 146.83, 196, 246.94, 329.63]) {
  test(`sinus ${f} Hz`, () => {
    const r = detectPitch(tone(f), SR);
    assert.ok(Math.abs(cents(r.freq, f)) < 1, `${r.freq}`);
  });
  test(`kytarový tón s alikvotami ${f} Hz bez oktávové chyby`, () => {
    const r = detectPitch(tone(f, [0.6, 1, 0.7, 0.4, 0.3]), SR);
    assert.ok(Math.abs(cents(r.freq, f)) < 1, `${r.freq}`);
  });
}

test('ticho a šum nevrací tón', () => {
  assert.equal(detectPitch(new Float32Array(4096), SR), null);
  const noise = Float32Array.from({ length: 4096 }, () => Math.random() * 2 - 1);
  const r = detectPitch(noise, SR);
  assert.ok(r === null || r.clarity < 0.9);
});
