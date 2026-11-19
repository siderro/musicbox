import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSong } from '../js/programs/song.js';
import { buildPlan, phaseAt, changeTargets } from '../js/teaching/plan.js';
import { keyScale } from '../js/theory/harmony.js';
import { tonicNote } from '../js/theory/notes.js';
import { chordInKey } from '../js/theory/chords.js';
import { handWindow, dyadPairs } from '../js/teaching/fingering.js';
import { PROGRESSIONS } from '../js/data/progressions.js';

const TEACH = { idea: 'third', change: 'guide', layers: { colors: true }, leadBeats: 2, colorSix: 'key' };

test('plán pokryje celé kolečko a tóny jsou v okně', () => {
  for (const id of Object.keys(PROGRESSIONS)) {
    const song = buildSong({ progression: id, key: 9 });
    const beatsPerBar = PROGRESSIONS[id].meter[0];
    const plan = buildPlan({ song, beatsPerBar, teach: TEACH, centre: 6.5 });
    const total = plan.segments.reduce((s, sg) => s + sg.beats, 0);
    assert.equal(total, song.bars.length * beatsPerBar, id);
    for (const sg of plan.segments) {
      sg.placed.forEach((n) => assert.ok(n.f >= plan.window.lo && n.f <= plan.window.hi));
      assert.ok(sg.placed.length >= 3, `${id}: málo tónů nápadu v okně`);
      sg.demo.forEach((e) => assert.ok(e.beat + e.d <= sg.beats + 1e-9, `${id}: fráze přetéká`));
    }
  }
});

test('ukázkové fráze na sebe navazují', () => {
  const song = buildSong({ progression: 'blues12', key: 9 });
  const plan = buildPlan({ song, beatsPerBar: 4, teach: TEACH, centre: 6.5 });
  for (let i = 1; i < plan.segments.length; i++) {
    const prev = plan.segments[i - 1].demo.at(-1);
    const first = plan.segments[i].demo[0];
    assert.ok(Math.abs(first.midi - prev.midi) <= 5, `skok ${prev.midi} → ${first.midi}`);
  }
});

test('vodicí tóny A7 → D7: G → F♯ a C♯ → C', () => {
  const A = tonicNote(9);
  const scale = keyScale(A);
  const ch = changeTargets(chordInKey('I7', A), chordInKey('IV7', A), 'guide', scale, handWindow(6.5), null);
  const moves = new Set(ch.links.map((l) => `${l.from.pc}->${l.to.pc}`));
  assert.ok(moves.has('7->6'), 'G → F♯');
  assert.ok(moves.has('1->0'), 'C♯ → C');
  ch.links.forEach((l) => assert.ok(Math.abs(l.semis) <= 2));
});

test('chromatický nájezd je půltón pod cílem', () => {
  const C = tonicNote(0);
  const ch = changeTargets(chordInKey('V7', C), chordInKey('I', C), 'approach', keyScale(C), handWindow(6.5), 60);
  assert.equal(ch.approach[0].s, ch.targets[0].s);
  assert.equal(ch.approach[0].f, ch.targets[0].f - 1);
});

test('odpočet před změnou a žádný při držení akordu', () => {
  const song = buildSong({ progression: 'blues12', key: 9 });
  const plan = buildPlan({ song, beatsPerBar: 4, teach: TEACH, centre: 6.5 });
  // takt 4 (A7) → takt 5 (D7)
  assert.equal(phaseAt(plan, 3, 0, 1).countdown, null);
  assert.equal(phaseAt(plan, 3, 0, 2).countdown, 2);
  assert.equal(phaseAt(plan, 3, 0, 3).countdown, 1);
  assert.equal(phaseAt(plan, 3, 0, 3, { freeze: true }).countdown, null);
  // takt 1 → takt 2 je stejný akord, odpočet nemá být
  assert.equal(phaseAt(plan, 0, 0, 3).countdown, null);
});

test('druhý hlas: spodní tón je diatonická tercie pod horním', () => {
  const C = tonicNote(0);
  const scale = keyScale(C);
  const pairs = dyadPairs(chordInKey('I', C).tones, 'dyad3', scale, handWindow(6.5));
  assert.ok(pairs.length >= 2);
  for (const p of pairs) {
    const semis = p.upper.midi - p.lower.midi;
    assert.ok(semis === 3 || semis === 4, `${semis}`);
    assert.equal(p.lower.s, p.upper.s + 1);
  }
});

test('pokyn u Am → Dm vede G → F, ne společné C', () => {
  const Am = tonicNote(9, 'minor');
  const scale = keyScale(Am, 'minor');
  const ch = changeTargets(chordInKey('i', Am), chordInKey('iv', Am), 'guide', scale, handWindow(6.5), null);
  assert.equal(ch.cue.key, 'resolve');
  assert.equal(ch.cue.from, 'G');
  assert.equal(ch.cue.note, 'F');
  ch.links.forEach((l) => assert.ok(Math.abs(l.semis) <= 2));
});
