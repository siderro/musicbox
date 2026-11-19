import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RHYTHMS } from '../js/data/rhythms.js';
import { GROOVES } from '../js/data/grooves.js';
import {
  parsePattern, checkRhythm, stepsPerCycle, rhythmEvents, rhythmsFor, tokenNotes, stepBeat, rhythmGrid,
} from '../js/comp/strum.js';

// Ruční hmaty (od 6. struny k 1.). midi: E2 = 40.
const note = (s, f, midi) => ({ s, f, midi });
const SHAPES = {
  // C: x32010, bas C na 5, střídavý bas G na 6 (3. pražec)
  C: {
    chord: 'C', notes: [note(5, 3, 48), note(4, 2, 52), note(3, 0, 55), note(2, 1, 60), note(1, 0, 64)],
    muted: [6], bass: note(5, 3, 48), alt: note(6, 3, 43),
  },
  // G7: 320001
  G7: {
    chord: 'G7', notes: [note(6, 3, 43), note(5, 2, 47), note(4, 0, 50), note(3, 0, 55), note(2, 0, 59), note(1, 1, 65)],
    muted: [], bass: note(6, 3, 43), alt: note(4, 0, 50),
  },
  // Am: x02210, střídavý bas E na 6
  Am: {
    chord: 'Am', notes: [note(5, 0, 45), note(4, 2, 52), note(3, 2, 57), note(2, 1, 60), note(1, 0, 64)],
    muted: [6], bass: note(5, 0, 45), alt: note(6, 0, 40),
  },
  // shell Cmaj7: 8x99xx – jen tři tóny, bez alt
  shell: {
    chord: 'Cmaj7', notes: [note(6, 8, 48), note(4, 9, 59), note(3, 9, 64)],
    muted: [5, 2, 1], bass: note(6, 8, 48), alt: null,
  },
};
const ids = Object.keys(RHYTHMS);

test('rytmy: délka, tokeny, metadata', () => {
  for (const id of ids) {
    const r = RHYTHMS[id];
    assert.deepEqual(checkRhythm(r), [], id);
    assert.equal(parsePattern(r.pattern).length, r.stepsPerBeat * r.meter[0] * r.bars, id);
    assert.ok(r.name && r.tip && r.level >= 1 && r.level <= 3, id);
    assert.ok([1, 2].includes(r.bars), id);
    assert.ok(Array.isArray(r.styles) && r.styles.length, id);
    const g = GROOVES[r.groove];
    assert.ok(g, `${id}: groove ${r.groove}`);
    assert.deepEqual(g.meter, r.meter, `${id}: metrum groove`);
  }
});

test('parser: přízvuk, skupina, chyby', () => {
  const st = parsePattern('^D. [pa]-');
  assert.equal(st.length, 4);
  assert.deepEqual(st[0], [{ t: 'D', accent: true }]);
  assert.deepEqual(st[2].map((x) => x.t), ['p', 'a']);
  assert.throws(() => parsePattern('DQ'));
  assert.throws(() => parsePattern('[pa'));
});

test('rhythmEvents: události v rozsahu segmentu, tóny z hmatu', () => {
  for (const id of ids) {
    const r = RHYTHMS[id];
    const cycle = r.meter[0] * r.bars;
    for (const shape of Object.values(SHAPES)) {
      for (const [beats, startBeat] of [[r.meter[0], 0], [cycle, 0], [r.meter[0] / 2, r.meter[0] / 2], [cycle * 2, 0], [2, 1]]) {
        const evs = rhythmEvents(id, shape, { beats, startBeat });
        assert.ok(evs.length > 0, `${id} ${shape.chord} ${beats}@${startBeat}`);
        const midis = new Set(shape.notes.map((n) => n.midi));
        if (shape.bass) midis.add(shape.bass.midi);
        if (shape.alt) midis.add(shape.alt.midi);
        for (const e of evs) {
          assert.ok(e.beat >= 0 && e.beat < beats, `${id} beat ${e.beat}`);
          assert.ok(e.dur > 0 && e.beat + e.dur <= beats + 1e-9, `${id} dur ${e.dur}`);
          assert.ok(e.vel > 0 && e.vel <= 1);
          assert.ok(['strum', 'bass', 'pick'].includes(e.kind));
          for (const n of e.notes) assert.ok(midis.has(n.midi), `${id} ${shape.chord} midi ${n.midi}`);
        }
        for (let k = 1; k < evs.length; k++) assert.ok(evs[k].beat >= evs[k - 1].beat);
      }
    }
  }
});

test('úhoz dolů 6 → 1, nahoru 1 → 6 jen horní struny', () => {
  for (const id of ids) {
    for (const shape of Object.values(SHAPES)) {
      for (const e of rhythmEvents(id, shape, { beats: RHYTHMS[id].meter[0] })) {
        const s = e.notes.map((n) => n.s);
        if (e.dir === 'down') assert.deepEqual(s, [...s].sort((a, b) => b - a), `${id} down`);
        if (e.dir === 'up') {
          assert.deepEqual(s, [...s].sort((a, b) => a - b), `${id} up`);
          if (shape.notes.length > 3) assert.ok(s.every((x) => x <= 4), `${id} up jen horní`);
        }
      }
    }
  }
  const d = rhythmEvents('eighths', SHAPES.G7, { beats: 4 })[0];
  assert.deepEqual(d.notes.map((n) => n.s), [6, 5, 4, 3, 2, 1]);
});

test('tokeny: bas, střídavý bas, prsty, chick', () => {
  const C = SHAPES.C;
  assert.deepEqual(tokenNotes('B', C), [C.bass]);
  assert.deepEqual(tokenNotes('A', C), [C.alt]);
  assert.equal(tokenNotes('a', C)[0].s, 1);
  assert.equal(tokenNotes('m', C)[0].s, 2);
  assert.equal(tokenNotes('i', C)[0].s, 3);
  assert.deepEqual(tokenNotes('f', C).map((n) => n.s), [3, 2, 1]);
  assert.ok(tokenNotes('C', C).every((n) => n.s < 5), 'chick bez basů');
  // shell bez alt: A = bas, prsty jen nad basem
  assert.deepEqual(tokenNotes('A', SHAPES.shell), [SHAPES.shell.bass]);
  assert.ok(['i', 'm', 'a'].every((t) => tokenNotes(t, SHAPES.shell)[0].s < 6));
});

test('swing posouvá offbeat, trioly a straight ne', () => {
  const sw = RHYTHMS.freddieGreen;
  assert.equal(stepBeat(sw, 1), 2 / 3);
  assert.equal(stepBeat(RHYTHMS.eighths, 1), 0.5);
  assert.equal(stepBeat(RHYTHMS.shuffle, 1), 1 / 3);
  const ch = rhythmEvents('charleston', SHAPES.C, { beats: 4 });
  assert.deepEqual(ch.map((e) => +e.beat.toFixed(3)), [0, 1.667]);
  const st = rhythmEvents('eighths', SHAPES.C, { beats: 4 });
  assert.deepEqual(st.map((e) => e.beat), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
});

test('ring vs hold: akord zní přes mezeru, staccato ne', () => {
  const f = rhythmEvents('folkPop', SHAPES.C, { beats: 4 });
  assert.equal(f[0].dur, 1); // D na 1 zní až do D na 2
  const fg = rhythmEvents('freddieGreen', SHAPES.C, { beats: 4 });
  assert.ok(fg.every((e) => e.dur < 1));
  const ch = rhythmEvents('charleston', SHAPES.C, { beats: 4 });
  assert.ok(Math.abs(ch[0].dur - 1) < 1e-9); // ^D- = dvě osminy
});

test('segmenty: půltakt, zopakování, chybějící úder na začátku', () => {
  // druhá půlka folkPop začíná na '.', doplní se úder z prvního kroku
  const h = rhythmEvents('folkPop', SHAPES.C, { beats: 2, startBeat: 2 });
  assert.equal(h[0].beat, 0);
  assert.equal(h[0].dir, 'down');
  // dvoutaktový valčík: druhý takt hraje střídavý bas
  const w2 = rhythmEvents('waltzAlt', SHAPES.C, { beats: 3, startBeat: 3 });
  assert.deepEqual(w2[0].notes, [SHAPES.C.alt]);
  // delší segment = zopakovaný cyklus
  assert.equal(rhythmEvents('eighths', SHAPES.C, { beats: 8 }).length, 16);
  // startBeat za cyklem se zabalí
  assert.deepEqual(rhythmEvents('polka', SHAPES.C, { beats: 2, startBeat: 6 }), rhythmEvents('polka', SHAPES.C, { beats: 2, startBeat: 2 }));
});

test('rhythmsFor: jen rytmy do taktu', () => {
  const three = rhythmsFor([3, 4]);
  assert.ok(three.includes('waltz') && three.includes('waltzAlt') && three.includes('arpeggio34'));
  assert.ok(three.every((id) => RHYTHMS[id].meter[0] === 3));
  assert.ok(!rhythmsFor([4, 4]).some((id) => RHYTHMS[id].meter[0] !== 4));
  assert.deepEqual(rhythmsFor([2, 4]), ['polka']);
  assert.ok(rhythmsFor([4, 4], 'jazz').includes('freddieGreen'));
  assert.ok(!rhythmsFor([4, 4], 'jazz').includes('tramp'));
  // každý rytmus je v nabídce svého metra
  for (const id of ids) assert.ok(rhythmsFor(RHYTHMS[id].meter).includes(id));
});

test('rhythmGrid: popisky pro UI', () => {
  const g = rhythmGrid('folkPop');
  assert.equal(g.length, 8);
  assert.equal(g[0].tokens[0].label, '↓');
  assert.equal(g[3].tokens[0].label, '↑');
  assert.ok(g[0].onBeat && !g[1].onBeat);
});
