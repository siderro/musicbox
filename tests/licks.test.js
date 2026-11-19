import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSong } from '../js/programs/song.js';
import { PROGRESSIONS } from '../js/data/progressions.js';
import { resolveApproach, applicableApproaches } from '../js/teaching/approach.js';
import { licksFor, startOptions, realizeLick } from '../js/teaching/lick-plan.js';
import { MAX_FRET } from '../js/fretboard/neck.js';
import { mod } from '../js/theory/notes.js';

const WIN = { lo: 4, hi: 9 };
const names = (r) => r.events.filter((e) => !e.rest).map((e) => ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'H'][mod(e.notes[0].midi, 12)]);

test('Dm lick přes G7 dopadne po změně na E (C dur)', () => {
  const song = buildSong({ progression: 'folk1645', key: 0 });
  const res = resolveApproach('tdPent', song);
  const n = res.lanes.findIndex((l) => l.id === 'N');
  assert.ok(licksFor(res, n).includes('tdChange'));
  const [opt] = startOptions('tdChange', res, n, 0);
  assert.equal(res.segments[opt.seg].chord.symbol, 'G7');
  const r = realizeLick('tdChange', res, n, opt.seg, WIN);
  const last = r.events.filter((e) => !e.rest).at(-1);
  assert.equal(res.segments[last.seg].chord.symbol, 'C');
  assert.deepEqual(names(r).slice(-2), ['F', 'E']);
});

test('linka vodicích tónů hraje přes každý akord jen jeho 3 a 7', () => {
  const song = buildSong({ progression: 'folk1645', key: 0 });
  const res = resolveApproach('guideLine', song);
  const r = realizeLick('glLine', res, 'cycle', 0, WIN);
  // na každou „jedna“ zazní vodicí tón akordu (mezi nimi chůze)
  for (const sg of res.segments) {
    const ev = r.events.find((e) => !e.rest && e.seg === sg.index && Math.abs(e.start - sg.start) < 1e-6);
    const src = res.sourceAt(res.laneOf[sg.index], sg.index);
    assert.ok(src.pcs.has(mod(ev.notes[0].midi, 12)), `${sg.chord.symbol}`);
  }
});

test('lick pruhu se kotví ke zdroji pruhu, ne k tónice', () => {
  const song = buildSong({ progression: 'folk1645', key: 0 });
  const res = resolveApproach('tdPent', song);
  const t = res.lanes.findIndex((l) => l.id === 'T');
  const r = realizeLick('tdSix', res, t, 0, WIN);
  // Em pentatonika nad C: A G E D (6 5 3 9)
  assert.deepEqual(names(r), ['A', 'G', 'E', 'D']);
});

test('všechny licky všech přístupů jdou zahrát ve všech kolečkách a tóninách', () => {
  for (const prog of Object.keys(PROGRESSIONS)) {
    for (const key of [0, 3, 9]) {
      const song = buildSong({ progression: prog, key });
      for (const id of applicableApproaches(song)) {
        const res = resolveApproach(id, song);
        for (const lane of [...res.lanes.map((_, i) => i), 'cycle']) {
          for (const lid of licksFor(res, lane)) {
            const opts = startOptions(lid, res, lane, 0);
            assert.ok(opts.length, `${prog}/${id}/${lid}: nemá kde zaznít`);
            const r = realizeLick(lid, res, lane, opts[0].seg, WIN);
            const notes = r.events.flatMap((e) => e.notes);
            assert.ok(notes.length, `${prog}/${id}/${lid}: prázdný`);
            notes.forEach((nt) => assert.ok(nt.f >= 0 && nt.f <= MAX_FRET + 3, `${prog}/${id}/${lid}: pražec ${nt.f}`));
            r.events.filter((e) => !e.rest).forEach((e) => assert.ok(e.notes.length, `${prog}/${id}/${lid}: tón bez místa na hmatníku`));
          }
        }
      }
    }
  }
});
