import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fretMidi } from '../js/fretboard/neck.js';
import { npsPositions, derivedPositions, windowPositions, resolveLick, anchorFret } from '../js/fretboard/positions.js';
import { SCALES } from '../js/data/scales.js';
import { LICKS } from '../js/data/licks.js';

test('MIDI na hmatníku', () => {
  assert.equal(fretMidi(6, 5), 45);
  assert.equal(fretMidi(1, 0), 64);
  assert.equal(fretMidi(2, 10), 69);
});

test('A mollová pentatonika: 5 boxů, box 1 na pražcích 5–8', () => {
  const pos = npsPositions(9, SCALES.minorPentatonic.intervals, 2);
  assert.equal(pos.length, 5);
  assert.equal(pos[0].lo, 5);
  assert.equal(pos[0].hi, 8);
  assert.equal(pos[0].notes.length, 12);
  assert.deepEqual(pos[1].notes.filter((n) => n.s === 3).map((n) => n.f), [7, 9]);
  pos.forEach((p) => p.notes.forEach((n) => assert.ok(n.f >= 0 && n.f <= 17)));
});

test('E durová pentatonika nevyjde pod nultý pražec', () => {
  const pos = npsPositions(4, SCALES.majorPentatonic.intervals, 2);
  pos.forEach((p) => p.notes.forEach((n) => assert.ok(n.f >= 0)));
});

test('bluesová stupnice doplní ♭5 do boxu 1', () => {
  const [box1] = derivedPositions(9, SCALES.blues.intervals, SCALES.minorPentatonic);
  const eb = box1.notes.filter((n) => n.pc === 3).map((n) => `${n.s}:${n.f}`).sort();
  assert.deepEqual(eb, ['3:8', '5:6']);
});

test('3NPS durová stupnice má 7 poloh po 18 tónech', () => {
  const pos = npsPositions(7, SCALES.major.intervals, 3);
  assert.equal(pos.length, 7);
  pos.forEach((p) => assert.equal(p.notes.length, 18));
});

test('okna arpeggia', () => {
  const pos = windowPositions(9, ['1', '3', '5', 'b7']);
  assert.ok(pos.length >= 3);
  pos.forEach((p) => assert.ok(p.hi - p.lo <= 4));
});

test('ukotvení licků v A, E a C', () => {
  assert.equal(anchorFret(9, 6, [0, 3]), 5);
  assert.equal(anchorFret(4, 6, [0, 3]), 0);
  assert.equal(anchorFret(4, 6, [-3, 0]), 12);
  assert.equal(anchorFret(0, 6, [0, 3]), 8);
  const lick = resolveLick(LICKS.box1Bend, 9);
  assert.equal(lick.rootFret, 5);
  assert.deepEqual(lick.events[0].notes[0], { s: 3, f: 7, midi: 62 });
  for (const l of Object.values(LICKS).filter((x) => x.notes)) {
    for (let k = 0; k < 12; k++) {
      resolveLick(l, k).events.forEach((e) => e.notes.forEach((n) => assert.ok(n.f >= 0 && n.f <= 20)));
    }
  }
});
