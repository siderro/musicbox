import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSong } from '../js/programs/song.js';
import { PROGRESSIONS } from '../js/data/progressions.js';
import { APPROACHES } from '../js/data/approaches.js';
import { resolveApproach, applicableApproaches, chordView, switchAhead, fillTokens } from '../js/teaching/approach.js';

const lanesMap = (res) => res.segments.map((s, i) => `${s.chord.symbol}:${res.lanes[res.laneOf[i]].id}`).join(' ');

test('C–Am–F–G7: Em přes tóniku, Dm přes napětí', () => {
  const song = buildSong({ progression: 'folk1645', key: 0 });
  const res = resolveApproach('tdPent', song);
  assert.equal(lanesMap(res), 'C:T Am:T F:N G7:N');
  assert.deepEqual(res.lanes.map((l) => l.source.label), ['Em pentatonika', 'Dm pentatonika']);
});

test('co zní nad akordem: Em nad C, Dm nad G7 a nad F', () => {
  const song = buildSong({ progression: 'folk1645', key: 0 });
  const res = resolveApproach('tdPent', song);
  const [c, , f, g7] = res.segments.map((s) => s.chord);
  const em = res.lanes[0].source;
  const dm = res.lanes[1].source;
  assert.deepEqual([...chordView(em, c).values()].sort(), ['3', '5', '6', '7', '9'].sort());
  assert.deepEqual([...chordView(dm, g7).values()].sort(), ['1', '11', '5', '9', 'b7'].sort());
  assert.deepEqual([...chordView(dm, f).values()].sort(), ['1', '3', '5', '6', '9'].sort());
});

test('trampská moll: Em, Dm a G♯°7 přes E7', () => {
  const song = buildSong({ progression: 'trampMinor', key: 9 });
  const res = resolveApproach('tdPent', song);
  assert.equal(lanesMap(res), 'Am:T Am:T Dm:N Am:T E7:V E7:V Am:T Am:T');
  assert.equal(res.lanes[2].source.label, 'G♯°7');
  assert.equal(res.lanes[2].bg.label, 'A harm. moll');
});

test('vedlejší dominanta dostane pruh „akord“ (od tercie)', () => {
  const song = buildSong({ progression: 'secDominants', key: 0 });
  const res = resolveApproach('tdPent', song);
  const i = res.segments.findIndex((s) => s.chord.symbol === 'A7');
  const lane = res.lanes[res.laneOf[i]];
  assert.equal(lane.id, 'X');
  assert.deepEqual(res.sourceAt(res.laneOf[i], i).tones.map((t) => t.name), ['C♯', 'E', 'G']);
});

test('blues: dur nad I7, moll nad IV7 a V7', () => {
  const song = buildSong({ progression: 'blues12', key: 9 });
  assert.ok(applicableApproaches(song).includes('bluesMix'));
  assert.ok(!applicableApproaches(song).includes('tdPent'));
  const res = resolveApproach('bluesMix', song);
  assert.ok(lanesMap(res).startsWith('A7:D A7:D A7:D A7:D D7:M'));
});

test('od tercie s nejvýš třemi akordy = pruh pro každý akord', () => {
  const song = buildSong({ progression: 'blues12', key: 9 });
  const res = resolveApproach('odTercie', song);
  assert.equal(res.lanes.length, 3);
  assert.deepEqual(res.lanes.map((l) => l.source.tones.map((t) => t.name).join(' ')), ['C♯ E G', 'F♯ A C', 'G♯ B D']);
});

test('odpočet jen při změně pruhu', () => {
  const song = buildSong({ progression: 'folk1645', key: 0 });
  const res = resolveApproach('tdPent', song);
  assert.equal(switchAhead(res, 0, 2), null); // C → Am: stejný pruh
  assert.equal(switchAhead(res, 1, 2).left, 2); // Am → F: změna
  assert.equal(switchAhead(res, 1, 1), null);
});

test('každé kolečko × 12 tónin: přístupy se dají sestavit', () => {
  for (const id of Object.keys(PROGRESSIONS)) {
    for (let key = 0; key < 12; key++) {
      const song = buildSong({ progression: id, key });
      const list = applicableApproaches(song);
      assert.ok(list.length >= 3, id);
      for (const a of list) {
        const res = resolveApproach(a, song);
        assert.ok(res.lanes.length >= 1 && res.lanes.length <= 4, `${id} ${a}: ${res.lanes.length} pruhů`);
        res.laneOf.forEach((l) => assert.ok(l >= 0, `${id} ${a}`));
      }
    }
  }
});

test('texty se přizpůsobí tónině', () => {
  const song = buildSong({ progression: 'folk1645', key: 7 });
  assert.equal(fillTokens('{iii} a {ii.r}', song), 'Bm a A');
  const res = resolveApproach('tdPent', song);
  assert.ok(fillTokens(APPROACHES.tdPent.why, song, res).includes('Bm pentatonika'));
  assert.ok(fillTokens('{ex:third}', song).startsWith('nad G Bm'));
});
