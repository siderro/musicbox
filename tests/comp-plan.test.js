import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RHYTHMS } from '../js/data/rhythms.js';
import { SAZBY } from '../js/data/voicings.js';
import { COMP_WIKI } from '../js/data/comp-wiki.js';
import { PROGRESSIONS } from '../js/data/progressions.js';
import { buildSong } from '../js/programs/song.js';
import { analyzeSong } from '../js/theory/function.js';
import { rhythmEvents } from '../js/comp/strum.js';
import {
  sazbaList, rhythmList, pickRemembered, remember, compChoice, cycleIn, voicedFor,
  segmentTiming, segmentEvents, dueEvents, guitarPlays, changeAhead, tabOf,
} from '../js/comp/comp-plan.js';
import { chordBoxSvg, boxWindow } from '../js/fretboard/render-chordbox.js';
import { validateAll } from '../js/data/validate.js';

const song = (progression, key = 0) => buildSong({ progression, key });

test('plánování: celý takt, půltakt, 3/4, dvoutaktový rytmus', () => {
  assert.deepEqual(segmentTiming('folkPop', { meterBeats: 4, chordsInBar: 1, bar: 3, seg: 0 }), { beats: 4, startBeat: 0 });
  assert.deepEqual(segmentTiming('folkPop', { meterBeats: 4, chordsInBar: 2, bar: 0, seg: 1 }), { beats: 2, startBeat: 2 });
  assert.deepEqual(segmentTiming('waltz', { meterBeats: 3, chordsInBar: 1, bar: 5, seg: 0 }), { beats: 3, startBeat: 0 });
  // valčík se střídavým basem má 2 takty: lichý takt kolečka začíná druhým taktem rytmu
  assert.equal(RHYTHMS.waltzAlt.bars, 2);
  assert.deepEqual(segmentTiming('waltzAlt', { meterBeats: 3, bar: 1 }), { beats: 3, startBeat: 3 });
  assert.deepEqual(segmentTiming('polka', { meterBeats: 2, bar: 2 }), { beats: 2, startBeat: 0 });
  assert.deepEqual(segmentTiming('bossa', { meterBeats: 4, chordsInBar: 2, bar: 1, seg: 1 }), { beats: 2, startBeat: 6 });
});

test('plánování: události segmentu = rhythmEvents se správným startem', () => {
  const s = song('waltzMajor');
  const v = voicedFor('bassChord', s);
  const sh = v.shapes[0];
  const ev = segmentEvents('waltzAlt', sh, { meterBeats: 3, bar: 1 });
  assert.deepEqual(ev, rhythmEvents('waltzAlt', sh, { beats: 3, startBeat: 3 }));
  // druhý takt rytmu začíná střídavým basem (A)
  assert.equal(ev[0].token, 'A');
  assert.ok(ev.every((e) => e.beat >= 0 && e.beat < 3));
});

test('plánování: okna kroků zahrají každou událost právě jednou', () => {
  const s = song('folk1645');
  const sh = voicedFor('open', s).shapes[0];
  for (const [id, beats, chords] of [['folkPop', 4, 1], ['shuffle', 4, 1], ['eighths', 4, 2], ['waltz', 3, 1], ['polka', 2, 1]]) {
    const ev = segmentEvents(id, sh, { meterBeats: beats, chordsInBar: chords, bar: 0, seg: chords - 1 });
    const spb = 0.5;
    const stepDur = spb / 4; // groovebox po šestnáctinách
    const segStart = 10;
    const played = [];
    const segBeats = beats / chords;
    for (let t = segStart; t < segStart + segBeats * spb - 1e-9; t += stepDur) {
      played.push(...dueEvents(ev, segStart, spb, t, t + stepDur));
    }
    assert.equal(played.length, ev.length, id);
    played.forEach(({ ev: e, time }) => assert.ok(Math.abs(time - (segStart + e.beat * spb)) < 1e-9, id));
  }
});

test('režimy: ukázka, hraju sám, střídání po taktech', () => {
  assert.deepEqual([0, 1, 2, 3].map((b) => guitarPlays('demo', b)), [true, true, true, true]);
  assert.deepEqual([0, 1, 2, 3].map((b) => guitarPlays('self', b)), [false, false, false, false]);
  assert.deepEqual([0, 1, 2, 3].map((b) => guitarPlays('alt', b)), [true, false, true, false]);
});

test('pamatování volby pro každé kolečko', () => {
  const map = remember({ folk1645: 'shell' }, 'polka', 'open');
  assert.deepEqual(map, { folk1645: 'shell', polka: 'open' });
  assert.equal(pickRemembered('shell', ['open', 'shell']), 'shell');
  assert.equal(pickRemembered('nic', ['open', 'shell']), 'open');
  const s = song('polka');
  // uložený rytmus ve 4/4 do polky (2/4) nepatří → výchozí
  const c = compChoice({ progression: 'polka', sazbaByProgression: map, rhythmByProgression: { polka: 'folkPop' } }, s);
  assert.equal(c.sazbaId, 'open');
  assert.equal(c.rhythmId, 'polka');
  const d = compChoice({ progression: 'folk1645', sazbaByProgression: map, rhythmByProgression: {} }, song('folk1645'));
  assert.equal(d.sazbaId, 'shell');
  assert.equal(d.rhythmId, COMP_WIKI.folk1645.rhythms[0]);
  assert.equal(cycleIn(['a', 'b', 'c'], 'c', 1), 'a');
  assert.equal(cycleIn(['a', 'b', 'c'], 'a', -1), 'c');
});

test('seznamy: pořadí z wiki, rytmy jen ve správném taktu', () => {
  for (const id of Object.keys(PROGRESSIONS)) {
    const s = song(id);
    const a = analyzeSong(s);
    const sz = sazbaList(id, s, a);
    const rh = rhythmList(id, s);
    assert.ok(sz.length && sz.every((x) => SAZBY[x]), id);
    assert.ok(rh.length, `${id}: žádný rytmus`);
    rh.forEach((r) => assert.deepEqual(RHYTHMS[r].meter, s.progression.meter, `${id}/${r}`));
    const w = COMP_WIKI[id];
    if (w) {
      assert.equal(sz[0], w.sazby[0], id);
      assert.equal(rh[0], w.rhythms[0], id);
    }
  }
});

test('wiki doprovodu: požadovaná kolečka a data bez chyb', () => {
  for (const id of ['folk1645', 'trampMinor', 'romanticMinor', 'waltzMajor', 'polka', 'blues12', 'iiVI', 'iiVIlong']) {
    const w = COMP_WIKI[id];
    assert.ok(w?.feel && w.sazby.length && w.rhythms.length && Object.keys(w.notes).length, id);
  }
  assert.ok(/vodicích tónů/.test(COMP_WIKI.iiVI.notes.shell));
  assert.deepEqual(validateAll(), []);
});

test('odpočet změny hmatu', () => {
  const s = song('folk1645');
  const a = analyzeSong(s);
  const sh = voicedFor('open', s, a).shapes;
  assert.equal(changeAhead(a, sh, 0, 0), null);
  assert.equal(changeAhead(a, sh, 0, 1), null);
  assert.deepEqual(changeAhead(a, sh, 0, 2), { next: 1, left: 2 });
  assert.deepEqual(changeAhead(a, sh, 3, 3), { next: 0, left: 1 });
  // stejný hmat dvakrát za sebou (trampská moll: i i) → žádný odpočet
  const t = song('trampMinor', 9);
  const ta = analyzeSong(t);
  assert.equal(changeAhead(ta, voicedFor('open', t, ta).shapes, 0, 3), null);
  // polka: 2dobý segment odpočítává jen „za 1“
  const p = song('polka');
  const pa = analyzeSong(p);
  const ps = voicedFor('open', p, pa).shapes;
  assert.equal(changeAhead(pa, ps, 1, 0), null);
  assert.deepEqual(changeAhead(pa, ps, 1, 1), { next: 2, left: 1 });
});

test('tabulatura z rytmu a diagram akordu', () => {
  const s = song('folk1645');
  const sh = voicedFor('open', s).shapes[0]; // C x32010
  const ev = rhythmEvents('tramp', sh, { beats: 4 });
  const t = tabOf(ev, 4);
  assert.equal(t.beats, 4);
  assert.deepEqual(t.events.map((e) => e.start), [0, 1, 2, 3]);
  assert.ok(Math.abs(t.events.reduce((x, e) => x + e.d, 0) - 4) < 1e-9);
  assert.deepEqual(boxWindow(sh), { start: 1, rows: 4, nut: true });
  const svg = chordBoxSvg(sh);
  assert.equal((svg.match(/cb-mute/g) ?? []).length, 1); // 6. struna x
  assert.equal((svg.match(/class="cb-open/g) ?? []).length, 2); // G a e prázdné
  const barre = voicedFor('barre', s).shapes.find((x) => x.barre);
  assert.ok(barre);
  assert.match(chordBoxSvg(barre), /cb-barre/);
});
