import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTIFS } from '../js/data/motifs.js';
import { PROGRESSIONS } from '../js/data/progressions.js';
import { parseMotif } from '../js/teaching/motif-parse.js';
import { buildPhrases, vocabResolver } from '../js/teaching/phrases.js';
import { buildPlan } from '../js/teaching/plan.js';
import { handWindow } from '../js/teaching/fingering.js';
import { buildSong } from '../js/programs/song.js';
import { mod } from '../js/theory/notes.js';

function segmentsOf(song, bpb) {
  let start = 0;
  return song.bars.flatMap((chords, bar) => chords.map((chord, seg) => {
    const s = { bar, seg, start, beats: bpb / chords.length, chord };
    start += s.beats;
    return s;
  }));
}

function phrasesFor(prog, key, chipRef, mode = 'phrase', seed = 1, centre = 6.5) {
  const song = buildSong({ progression: prog, key });
  const bpb = PROGRESSIONS[prog].meter[0];
  const segments = segmentsOf(song, bpb);
  const items = song.progression.solo;
  const sel = items.find((i) => i.ref === chipRef) ?? null;
  return {
    song, segments, bpb,
    ...buildPhrases({
      song, segments, beatsPerBar: bpb, mode, change: 'guide', style: 'folk', level: 3, win: handWindow(centre), seed,
      vocabAt: vocabResolver(song, items, sel), preferAt: () => sel?.prefer ?? [],
    }),
  };
}

test('všechny motivy jdou přečíst a sedí do rytmické mřížky', () => {
  for (const [id, m] of Object.entries(MOTIFS)) {
    const p = parseMotif(m.notes);
    [...p.body, ...p.tail].forEach((t) => assert.ok(Number.isInteger(t.d * 2), `${id}: ${t.raw}`));
    assert.ok(p.bodyBeats <= 4, `${id}: tělo ${p.bodyBeats} dob`);
    if (m.vocab.length) {
      const degs = [...p.body, ...p.tail].filter((t) => t.kind === 'deg').map((t) => t.deg);
      assert.ok(degs.length, id);
    }
  }
});

test('cíl každé fráze je tón akordu, který na „jedna“ zní', () => {
  for (const prog of Object.keys(PROGRESSIONS)) {
    for (const key of [0, 9]) {
      const { phrases, segments, total } = phrasesFor(prog, key, null);
      assert.ok(phrases.length > 0, `${prog}: žádná fráze`);
      for (const ph of phrases) {
        const land = ph.events.find((e) => e.role === 'land');
        if (!land || ph.motif.colorLand) continue;
        const a = mod(land.abs, total);
        const sg = segments.find((s) => a >= s.start && a < s.start + s.beats);
        assert.ok(sg.chord.tones.some((t) => t.pc === land.pc) || ph.land.role !== 'approach', `${prog} ${ph.motifId}`);
      }
    }
  }
});

test('fráze jsou deterministické a reagují na vybraný čip', () => {
  const a = phrasesFor('blues12', 9, 'scale:minorPentatonic');
  const b = phrasesFor('blues12', 9, 'scale:minorPentatonic');
  assert.deepEqual(a.phrases.map((p) => p.motifId), b.phrases.map((p) => p.motifId));
  const c = phrasesFor('blues12', 9, 'scale:mixolydian');
  const pcsA = a.phrases.flatMap((p) => p.events.filter((e) => e.role === 'path').map((e) => e.pc)).join();
  const pcsC = c.phrases.flatMap((p) => p.events.filter((e) => e.role === 'path').map((e) => e.pc)).join();
  assert.notEqual(pcsA, pcsC);
});

test('tóny těla fráze patří do zvoleného slovníku', () => {
  const { phrases } = phrasesFor('folk1645', 0, 'scale:majorPentatonic');
  const allowed = new Set([0, 2, 4, 7, 9]); // C D E G A
  for (const ph of phrases) {
    ph.events.filter((e) => e.role === 'path').forEach((e) => assert.ok(allowed.has(e.pc), `${ph.motifId} pc ${e.pc}`));
  }
});

test('techniky: bendy na tenkých strunách, hammer/pull/slide na stejné struně', () => {
  for (const prog of ['blues12', 'minorBlues', 'mixoVamp', 'dorianVamp', 'trampMinor', 'folk1645']) {
    for (const key of [0, 4, 9]) {
      for (const centre of [3.5, 6.5, 9.5, 12.5]) {
        const { phrases } = phrasesFor(prog, key, null, 'phrase', 2, centre);
        for (const ph of phrases) {
          ph.events.forEach((e, i) => {
            assert.ok(e.f >= 0 && e.f <= 20, `${ph.motifId} pražec ${e.f}`);
            if (e.bendSemis >= 1 && !e.t.release) assert.ok(e.s <= (e.bendSemis <= 1 ? 4 : 3), `${ph.motifId} bend na struně ${e.s}`);
            const next = ph.events[i + 1];
            if (next && (e.t.leg || e.t.slide) && next.role === e.role) assert.equal(next.s, e.s, `${ph.motifId} legato přes struny`);
          });
        }
      }
    }
  }
});

test('od tercie nad C–Am–F–G7 hraje tóny 3-5-7', () => {
  const { phrases, segments, total } = phrasesFor('folk1645', 0, 'scale:major', 'third');
  const want = { I: [4, 7, 11], vi: [0, 4, 7], IV: [9, 0, 4], V7: [11, 2, 5] };
  for (const ph of phrases) {
    for (const e of ph.events.filter((x) => x.role === 'path' && x.kind === 'chord')) {
      const a = mod(e.abs, total);
      const sg = segments.find((s) => a >= s.start && a < s.start + s.beats);
      if (!want[sg.chord.degree]) continue;
      if (ph.motif.color) continue;
      assert.ok(want[sg.chord.degree].includes(e.pc), `${ph.motifId} ${sg.chord.degree} pc ${e.pc}`);
    }
  }
});

test('plán rozdělí fráze do segmentů bez přetékání', () => {
  for (const prog of Object.keys(PROGRESSIONS)) {
    const song = buildSong({ progression: prog, key: 9 });
    const bpb = PROGRESSIONS[prog].meter[0];
    const items = song.progression.solo;
    const plan = buildPlan({
      song, beatsPerBar: bpb, centre: 6.5,
      teach: { idea: 'phrase', change: 'guide', layers: { colors: true }, leadBeats: 2, colorSix: 'key', level: 2, seed: 0 },
      phrase: { vocabAt: vocabResolver(song, items, items[0]), preferAt: () => [], style: 'folk' },
    });
    assert.ok(plan.phrases.length, prog);
    plan.segments.forEach((sg) => sg.demo.forEach((e) => assert.ok(e.beat + e.d <= sg.beats + 1e-9, `${prog}: přetéká`)));
  }
});
