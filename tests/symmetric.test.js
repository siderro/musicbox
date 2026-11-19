import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCALES } from '../js/data/scales.js';
import { APPROACHES } from '../js/data/approaches.js';
import { PROGRESSION_WIKI } from '../js/data/wiki.js';
import { LICKS } from '../js/data/licks.js';
import { parseInterval } from '../js/theory/intervals.js';
import { buildSong } from '../js/programs/song.js';
import { resolveApproach, applicableApproaches, chordView, fillTokens } from '../js/teaching/approach.js';

const pcs = (id, root = 0) => new Set(SCALES[id].intervals.map((iv) => (root + parseInterval(iv).semis) % 12));

test('symetrické stupnice: posun o svůj krok dá stejné tóny', () => {
  for (const id of ['halfWhole', 'wholeHalf', 'wholeTone']) {
    const step = SCALES[id].symmetric;
    assert.deepEqual([...pcs(id, step)].sort(), [...pcs(id, 0)].sort(), id);
  }
});

test('zmenšená přes E7♭9 v cikánské moll', () => {
  const song = buildSong({ progression: 'gypsyMinor', key: 9 });
  assert.ok(applicableApproaches(song).includes('dimDom'));
  const res = resolveApproach('dimDom', song);
  const i = res.segments.findIndex((s) => s.chord.symbol === 'E7♭9');
  const src = res.sourceAt(res.laneOf[i], i);
  assert.equal(res.lanes[res.laneOf[i]].id, 'D');
  assert.deepEqual([...chordView(src, res.segments[i].chord).values()], ['1', 'b9', '#9', '3', '#11', '5', '6', 'b7']);
});

test('zmenšená přes dominanty v blues: každý akord vlastní pruh', () => {
  const song = buildSong({ progression: 'blues12', key: 9 });
  const res = resolveApproach('dimDom', song);
  assert.ok(res.lanes.length >= 2);
});

test('texty wiki a přístupů se doplní ve všech tóninách', () => {
  for (const [prog, page] of Object.entries(PROGRESSION_WIKI)) {
    for (const key of [0, 3, 9]) {
      const song = buildSong({ progression: prog, key });
      for (const id of page.approaches) {
        const res = resolveApproach(id, song);
        const texts = [APPROACHES[id].why, page.notes?.[id], ...(page.try?.[id] ?? []), ...(APPROACHES[id].try ?? []), page.feel].filter(Boolean);
        texts.forEach((t) => assert.ok(!/[{}]/.test(fillTokens(t, song, res)), `${prog}/${id}: ${fillTokens(t, song, res)}`));
      }
      Object.values(page.licks ?? {}).flat().forEach((l) => assert.ok(LICKS[l], `${prog}: lick ${l}`));
    }
  }
});
