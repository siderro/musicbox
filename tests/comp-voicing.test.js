import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSong } from '../js/programs/song.js';
import { PROGRESSIONS } from '../js/data/progressions.js';
import { SAZBY, OPEN } from '../js/data/voicings.js';
import { analyzeSong } from '../js/theory/function.js';
import { chordInKey } from '../js/theory/chords.js';
import { parseNote, pcOf } from '../js/theory/notes.js';
import { spellIntervals } from '../js/theory/intervals.js';
import { TUNING } from '../js/fretboard/neck.js';
import { voiceProgression, applicableSazby, fretString, openShape, shapeFor, typeKey } from '../js/comp/voicing-engine.js';

const song = (progression, key = 0) => buildSong({ progression, key });
const distinct = (v) => [...new Map(v.shapes.map((s) => [s.chord.degree, s])).values()];
const byName = (v) => Object.fromEntries(distinct(v).map((s) => [s.chord.symbol, fretString(s)]));

// kontrola jednoho hmatu: hratelnost, výšky, tóny
function check(sh, where, ctx, id) {
  const at = `${where} ${sh.name} ${fretString(sh)}`;
  assert.ok(sh.notes.length >= 2, `${at}: málo tónů`);
  const strings = sh.notes.map((n) => n.s);
  assert.equal(new Set(strings).size, strings.length, `${at}: struna dvakrát`);
  assert.deepEqual(strings, [...strings].sort((a, b) => b - a), `${at}: pořadí strun`);
  for (const n of sh.notes) {
    assert.equal(n.midi, TUNING[n.s] + n.f, `${at}: midi`);
    assert.ok(n.f >= 0 && n.f <= 17, `${at}: pražec`);
    assert.ok(n.name && n.interval, `${at}: název tónu`);
    assert.equal(pcOf(parseNote(n.name)), n.midi % 12, `${at}: pravopis ${n.name}`);
  }
  const fretted = sh.notes.filter((n) => n.f > 0).map((n) => n.f);
  if (fretted.length) {
    assert.equal(sh.lo, Math.min(...fretted), `${at}: lo`);
    assert.equal(sh.hi, Math.max(...fretted), `${at}: hi`);
    assert.ok(sh.hi - sh.lo <= 3, `${at}: rozpětí ${sh.hi - sh.lo}`);
  }
  assert.deepEqual([...sh.muted, ...strings].sort(), [1, 2, 3, 4, 5, 6], `${at}: tlumené struny`);
  const own = new Set(sh.chord.tones.map((t) => t.pc));
  for (const n of sh.notes) {
    const midiPc = n.midi % 12;
    if (own.has(midiPc)) continue;
    // přidat smí jen barvy, shell a drop 2 (sexta) – a jen tón z tóniny
    assert.ok(['colors', 'shell', 'drop2'].includes(id), `${at}: cizí tón ${n.name}`);
    assert.ok(ctx.keyPcs.has(midiPc), `${at}: přidaný tón ${n.name} není z tóniny`);
  }
  if (sh.bass) assert.equal(sh.notes[0].interval, '1', `${at}: bas není kořen`);
  for (const x of [sh.alt, ...(sh.walk ?? [])].filter(Boolean)) assert.equal(pcOf(parseNote(x.name)), x.midi % 12, `${at}: pravopis ${x.name}`);
  if (sh.barre) assert.ok(sh.barre.f === sh.lo && sh.barre.from > sh.barre.to, `${at}: barré`);
}

test('všechny tóniny × kolečka × sazby: hmat existuje, je hratelný a sedí na akord', () => {
  for (const id of Object.keys(PROGRESSIONS)) {
    for (let key = 0; key < 12; key++) {
      const s = song(id, key);
      const an = analyzeSong(s);
      for (const sid of applicableSazby(s, an)) {
        const v = voiceProgression(sid, s, an);
        assert.equal(v.shapes.length, an.segments.length);
        v.shapes.forEach((sh, i) => {
          assert.equal(sh.chord, an.segments[i].chord);
          check(sh, `${id}/${key}/${sid}`, an.ctx, sid);
        });
      }
    }
  }
});

test('shell obsahuje tercii a septimu, kořen v basu', () => {
  for (const id of Object.keys(PROGRESSIONS)) {
    for (let key = 0; key < 12; key++) {
      const v = voiceProgression('shell', song(id, key));
      for (const sh of v.shapes) {
        const nums = sh.notes.map((n) => n.interval.replace(/\D/g, ''));
        assert.ok(sh.bass, `${sh.name}: bez basu`);
        if (sh.chord.intervals.some((iv) => /7$/.test(iv))) {
          assert.ok(nums.includes('7') && (nums.includes('3') || typeKey(sh.chord).startsWith('sus')), `${id}/${key} ${sh.name}: chybí 3 nebo 7`);
        }
      }
    }
  }
});

test('ii–V–I v C shell: septima vede o půltón na tercii (C → H, F → E)', () => {
  const v = voiceProgression('shell', song('iiVI', 0));
  const [dm7, g7, cmaj7] = v.shapes;
  assert.deepEqual([dm7.chord.symbol, g7.chord.symbol, cmaj7.chord.symbol], ['Dm7', 'G7', 'Cmaj7']);
  const tone = (sh, iv) => sh.notes.find((n) => n.interval === iv);
  assert.equal(tone(dm7, 'b7').name, 'C');
  assert.equal(tone(g7, '3').name, 'B');
  assert.equal(tone(g7, '3').midi - tone(dm7, 'b7').midi, -1);
  assert.equal(tone(cmaj7, '3').midi - tone(g7, 'b7').midi, -1);
  assert.equal(tone(dm7, 'b7').s, tone(g7, '3').s, 'stejná struna');
  // tvary se střídají: kořen na 5. → na 6. → na 5. struně (nebo naopak)
  assert.notEqual(dm7.bass.s, g7.bass.s);
  assert.notEqual(g7.bass.s, cmaj7.bass.s);
  assert.match(g7.name, /^G7 \(shell 1-(7-3|3-7)\)$/);
});

test('otevřené akordy: známé táborákové tvary', () => {
  assert.deepEqual(byName(voiceProgression('open', song('folk1645', 0))), { C: 'x32010', Am: 'x02210', F: '133211', G7: '320001' });
  const pop = byName(voiceProgression('open', song('pop1564', 7)));
  assert.equal(pop.G, '320003');
  assert.equal(pop.D, 'xx0232');
  assert.equal(pop.Em, '022000');
  assert.equal(pop.C, 'x32010');
  const a = byName(voiceProgression('open', song('pop1564', 9)));
  assert.equal(a.A, 'x02220');
  assert.equal(a.E, '022100');
  const gypsy = byName(voiceProgression('open', song('gypsyMinor', 9)));
  assert.deepEqual(gypsy, { Am: 'x02210', Dm: 'xx0231', 'E7♭9': '020101' });
  // kde otevřený tvar není, barré
  const bb = voiceProgression('open', song('folk1645', 10)).shapes[0];
  assert.match(bb.name, /barré/);
  assert.ok(bb.barre);
});

test('tabulka otevřených tvarů: tóny akordu, kořen v basu', () => {
  const IV = { '': ['1', '3', '5'], m: ['1', 'b3', '5'], 7: ['1', '3', '5', 'b7'], maj7: ['1', '3', '5', '7'], m7: ['1', 'b3', '5', 'b7'],
    6: ['1', '3', '5', '6'], m6: ['1', 'b3', '5', '6'], sus4: ['1', '4', '5'], sus2: ['1', '2', '5'], '7b9': ['1', '3', '5', 'b7', 'b9'],
    m7b5: ['1', 'b3', 'b5', 'b7'], dim7: ['1', 'b3', 'b5', 'bb7'] };
  for (const [sym, shapes] of Object.entries(OPEN)) {
    const [, r, type] = /^([A-G])(.*)$/.exec(sym);
    const root = parseNote(r);
    const chord = { root, rootPc: pcOf(root), symbol: sym, intervals: IV[type], tones: spellIntervals(root, IV[type]) };
    assert.equal(typeKey(chord), type, sym);
    for (const fr of shapes) {
      const sh = openShape(fr, chord);
      assert.ok(sh, `${sym} ${fr}`);
      assert.equal(sh.notes[0].interval, '1', `${sym} ${fr}: kořen v basu`);
      // každý tón akordu kromě kvinty zazní
      for (const t of chord.tones.filter((x) => x.interval !== '5')) assert.ok(sh.notes.some((n) => n.pc === t.pc), `${sym} ${fr}: chybí ${t.name}`);
    }
  }
});

test('barré: E-tvar a A-tvar, ruka se nestěhuje', () => {
  const v = voiceProgression('barre', song('blues12', 0));
  const shapes = distinct(v);
  assert.ok(shapes.every((s) => /\((E|A)-tvar\)/.test(s.name)));
  assert.ok(shapes.every((s) => s.notes.every((n) => n.f > 0)), 'bez prázdných strun');
  const roots = shapes.map((s) => s.bass.f);
  assert.ok(Math.max(...roots) - Math.min(...roots) <= 2, roots.join(','));
});

test('trojzvuky nahoře: bez basu, nejbližší obrat', () => {
  const v = voiceProgression('triads', song('folk1645', 0));
  for (const sh of v.shapes) {
    assert.equal(sh.bass, null);
    assert.ok(sh.notes.every((n) => n.s <= 4) && sh.notes.length === 3);
  }
  // horní hlas se mezi akordy pohne nejvýš o 3 půltóny
  v.shapes.forEach((sh, i) => {
    const next = v.shapes[(i + 1) % v.shapes.length];
    assert.ok(Math.abs(sh.notes[2].midi - next.notes[2].midi) <= 3, `${sh.name} → ${next.name}`);
  });
});

test('barvy 6 a 9: C6/9, Am9, F6/9, G13 v C; v moll E7♭9 a Dm6', () => {
  const names = distinct(voiceProgression('colors', song('folk1645', 0))).map((s) => s.name);
  assert.deepEqual(names, ['C6/9', 'Am9', 'F6/9', 'G13']);
  const gypsy = distinct(voiceProgression('colors', song('gypsyMinor', 9))).map((s) => s.name);
  assert.deepEqual(gypsy, ['Am9', 'Dm6', 'E7♭9']);
  const jazz = distinct(voiceProgression('colors', song('iiVI', 0))).map((s) => s.name);
  assert.deepEqual(jazz, ['Dm9', 'G13', 'Cmaj9']);
  for (const sh of voiceProgression('colors', song('folk1645', 0)).shapes) {
    assert.ok(sh.notes.length >= 4 && sh.notes.length <= 5, sh.name);
  }
});

test('bas + akord: kořen a střídavý bas (kvinta), úder na horních strunách', () => {
  const v = voiceProgression('bassChord', song('waltzMajor', 0));
  for (const sh of v.shapes) {
    assert.equal(sh.notes[0].interval, '1');
    assert.ok(sh.alt, sh.name);
    assert.ok(['5', '3', 'b3'].includes(sh.alt.interval));
    assert.ok(sh.top.every((s) => s < Math.min(sh.bass.s, sh.alt.s)));
  }
  const c = v.shapes[0];
  assert.deepEqual([c.bass.s, c.bass.f, c.alt.s, c.alt.f], [5, 3, 6, 3]);
  assert.equal(c.name, 'C · bas C–G');
});

test('dvojhmaty: 1-5 na basových strunách a krok 5-6-♭7', () => {
  const v = voiceProgression('boogie', song('blues12', 9));
  for (const sh of distinct(v)) {
    assert.deepEqual(sh.notes.map((n) => n.interval), ['1', '5']);
    assert.deepEqual(sh.walk.map((w) => w.interval), ['5', '6', 'b7']);
    assert.deepEqual(sh.walk.map((w) => w.f - sh.walk[0].f), [0, 2, 3]);
  }
  assert.deepEqual(byName(v), { A7: 'x02xxx', D7: 'xx02xx', E7: '02xxxx' });
});

test('drop 2: čtyři hlasy na sousedních strunách, vedení hlasů', () => {
  const v = voiceProgression('drop2', song('iiVI', 0));
  for (const sh of v.shapes) {
    const s = sh.notes.map((n) => n.s);
    assert.equal(s.length, 4);
    assert.equal(s[0] - s[3], 3, sh.name);
    assert.match(sh.name, /drop 2/);
  }
  const [dm7, g7, cmaj7] = v.shapes;
  const moved = (a, b) => a.notes.reduce((k, n, i) => k + Math.abs(n.midi - b.notes[i].midi), 0);
  assert.ok(moved(dm7, g7) <= 4 && moved(g7, cmaj7) <= 4, `${moved(dm7, g7)} ${moved(g7, cmaj7)}`);
});

test('keep: tóny společné s předchozím hmatem (cyklicky)', () => {
  const v = voiceProgression('open', song('folk1645', 0));
  const [c, am] = v.shapes;
  assert.deepEqual([...am.keep].sort((a, b) => a - b), [0, 4]); // C a E zůstávají
  assert.ok(c.keep.includes(7)); // G7 → C: G zůstává
});

test('opakovaný akord = stejný hmat', () => {
  const v = voiceProgression('shell', song('blues12', 0));
  const keyOf = (sh) => fretString(sh);
  const byDeg = new Map();
  for (const sh of v.shapes) {
    if (!byDeg.has(sh.chord.degree)) byDeg.set(sh.chord.degree, new Set());
    byDeg.get(sh.chord.degree).add(keyOf(sh));
  }
  for (const [deg, set] of byDeg) assert.ok(set.size <= 2, `${deg}: ${[...set]}`);
  // čtyři takty I7 za sebou drží jeden tvar
  assert.equal(new Set(v.shapes.slice(0, 4).map(keyOf)).size, 1);
});

test('pořadí sazeb podle stylu a metra', () => {
  assert.equal(applicableSazby(song('iiVI'))[0], 'shell');
  assert.equal(applicableSazby(song('blues12'))[0], 'boogie');
  assert.equal(applicableSazby(song('folk1645'))[0], 'open');
  const waltz = applicableSazby(song('waltzMajor'));
  assert.equal(waltz[0], 'bassChord');
  assert.ok(!waltz.includes('boogie'));
  assert.deepEqual([...applicableSazby(song('folk1645'))].sort(), Object.keys(SAZBY).sort());
});

test('shapeFor: jeden hmat mimo kolečko', () => {
  const s = song('folk1645', 0);
  const sh = shapeFor('open', chordInKey('V', s.tonic), s);
  assert.equal(fretString(sh), '320003');
});

test('každý druh akordu v každé sazbě (i mimo kolečka)', () => {
  const kinds = ['I', 'i', 'I7', 'i7', 'Imaj7', 'imaj7', 'I6', 'i6', 'I9', 'i9', 'Iadd9', 'iadd9', 'Isus2', 'Isus4', 'I7sus4',
    'i°', 'i°7', 'iø', 'I7#9', 'I7b9', 'I+', 'I7#5'];
  for (const key of [0, 6, 10]) {
    const s = song('folk1645', key);
    const ctx = analyzeSong(s).ctx;
    for (const deg of kinds) {
      const chord = chordInKey(deg, s.tonic);
      for (const sid of Object.keys(SAZBY)) {
        for (const fn of ['T', 'S', 'D']) check({ ...shapeFor(sid, chord, s, { fn }), chord }, `${key}/${deg}/${sid}/${fn}`, ctx, sid);
      }
    }
  }
});

test('audit: otevřená sazba drží polohu u nultého pražce i bez otevřených tvarů', () => {
  const g = byName(voiceProgression('open', song('gypsyMinor', 0)));
  assert.equal(g.Cm, 'x35543');
  assert.equal(g.Fm, '133111');
  assert.equal(g['G7♭9'], '3231xx');
  const bb = byName(voiceProgression('open', song('trampMinor', 10)));
  assert.equal(bb.F7, '131211');
});

test('audit: shell a drop 2 dají mollovému kvintakordu septimu, mollové iv sextu', () => {
  const names = (id, prog, key) => distinct(voiceProgression(id, song(prog, key))).map((s) => s.name);
  assert.ok(names('shell', 'folk1645', 0).some((n) => n.startsWith('Am7 (shell')), 'Am7 v C');
  assert.ok(names('drop2', 'folk1645', 0).some((n) => n.startsWith('Am7 (drop 2')), 'Am7 drop 2 v C');
  const am = names('shell', 'trampMinor', 9);
  assert.ok(am.some((n) => n.startsWith('Am7 ')), am.join(', '));
  assert.ok(am.some((n) => n.startsWith('Dm6 ')), am.join(', '));
});

test('audit: barvy – 13 jen na dominantě V, ne na ♭VII', () => {
  for (const [prog, key] of [['romanticMinor', 9], ['romanticMinor', 0], ['andalusian', 9]]) {
    const sh = distinct(voiceProgression('colors', song(prog, key))).find((s) => s.chord.degree === 'bVII');
    assert.ok(!sh.notes.some((n) => n.interval === 'b7'), `${prog} ${key}: ${sh.name} ${fretString(sh)}`);
  }
  // V7 v lidovce dál G13
  assert.equal(distinct(voiceProgression('colors', song('folk1645', 0)))[3].name, 'G13');
});

test('audit: trojzvuky nad 7♭9 bez kořene (zmenšený trojzvuk s malou nonou)', () => {
  for (const key of [0, 4, 9]) {
    const sh = distinct(voiceProgression('triads', song('gypsyMinor', key))).find((s) => s.chord.degree === 'V7b9');
    assert.ok(!sh.notes.some((n) => n.interval === '1'), `${sh.name} ${fretString(sh)}`);
    assert.ok(sh.notes.some((n) => n.interval === 'b9'), `${sh.name} ${fretString(sh)}`);
  }
});
