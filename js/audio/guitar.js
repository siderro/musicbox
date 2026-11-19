// Akustická doprovodná kytara: struny z pluck.js (Karplus-Strong), úhoz = tóny rozprostřené
// o pár ms, tlumený úhoz = krátké „chck“ se šumem. Signál: struny → filtr úhozu → tělo →
// hlasitost kytary → sběrnice 'chords' (sdílí ji s klávesami grooveboxu).

import { getCtx, busInput, noise, registerVoice } from './engine.js';
import { pluck, warmUp } from './pluck.js';

let chain = null; // { ctx, input, level }
let level = 1;
const ringing = new Map(); // struna → znějící tón; nový úder na strunu ten starý utlumí

function onString(s, t, note) {
  if (s == null) return;
  ringing.get(s)?.release(t, 0.008);
  ringing.set(s, note);
}

function guitarIn() {
  const ctx = getCtx();
  if (chain?.ctx === ctx) return chain.input;
  const input = ctx.createGain();
  input.gain.value = 1;
  // tělo: trochu basového „boxu“, ořezaná ostrost KS
  const body = ctx.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = 210;
  body.Q.value = 1.1;
  body.gain.value = 3;
  const air = ctx.createBiquadFilter();
  air.type = 'highshelf';
  air.frequency.value = 5000;
  air.gain.value = -4;
  const out = ctx.createGain();
  out.gain.value = level;
  input.connect(body).connect(air).connect(out).connect(busInput('chords'));
  chain = { ctx, input, out };
  return input;
}

// Hlasitost kytary zvlášť od kláves (0 = „hraju sám“).
export function setGuitarLevel(v) {
  level = v;
  if (chain) chain.out.gain.setTargetAtTime(v, chain.ctx.currentTime, 0.02);
}

// Předpočítat buffery strun (první úhoz nového hmatu by jinak mohl zadrhnout).
export function warmUpGuitar(shapesOrMidis) {
  const midis = new Set();
  for (const x of shapesOrMidis) {
    if (typeof x === 'number') midis.add(x);
    else x?.notes?.forEach((n) => midis.add(n.midi));
  }
  warmUp([...midis]);
}

// Filtr pro jeden úhoz: silnější úhoz = jasnější, dlaň = tmavé.
function strokeFilter(t, vel, palm) {
  const ctx = getCtx();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(palm ? 650 + 500 * vel : 1800 + 4200 * vel, t);
  lp.connect(guitarIn());
  return lp;
}

// Šumový „škrab“ trsátka; u tlumeného úhozu hlavní složka zvuku.
function scratch(t, vel, len, freq) {
  const ctx = getCtx();
  const src = ctx.createBufferSource();
  src.buffer = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(bp).connect(g).connect(guitarIn());
  src.start(t, Math.random() * 0.5);
  src.stop(t + len + 0.02);
  registerVoice(g, [src], t + len + 0.02);
}

// Úhoz přes tóny hmatu. notes [{ midi, s? }] v pořadí zásahu; když mají `s` a je dán směr,
// seřadí se samy (dolů 6 → 1, nahoru 1 → 6). time, spread, dur v sekundách.
export function strum(notes, time, { dir = 'down', vel = 0.8, spread, mute = false, palm = false, dur = 1 } = {}) {
  if (!getCtx() || !notes.length) return;
  let list = notes;
  if (dir && notes.every((n) => n.s != null)) {
    list = [...notes].sort((a, b) => (dir === 'up' ? a.s - b.s : b.s - a.s));
  }
  // rozprostření: nahoru rychleji, silnější úhoz rychleji
  const gap = spread ?? (dir === 'up' ? 0.008 : 0.013) * (1.25 - 0.45 * vel);
  const lp = strokeFilter(time, vel, palm);
  list.forEach((n, i) => {
    const t = time + i * gap;
    // první struny úhozu dostanou nejvíc, ke konci ruka slábne
    const v = vel * (1 - 0.06 * i) * (mute ? 0.5 : 0.36);
    const note = pluck(n.midi, t, { vel: Math.max(0.02, v), bus: lp });
    onString(n.s, t, note);
    if (mute) note.release(t + 0.012, 0.012);
    else if (palm) note.release(t + Math.min(dur, 0.16), 0.05);
    else note.release(time + Math.max(0.05, dur), 0.06);
  });
  const span = gap * list.length;
  if (mute) scratch(time, 0.35 * vel, 0.05 + span, 2200);
  else scratch(time, 0.05 * vel, 0.02 + span, 3500);
}

// Jeden tón prstem nebo palcem (arpeggio, bas). time, dur v sekundách.
// s = číslo struny (nepovinné), aby nový tón utlumil předchozí na téže struně.
export function pickNote(midi, time, { vel = 0.7, dur = 1, palm = false, s } = {}) {
  if (!getCtx()) return;
  const lp = strokeFilter(time, vel, palm);
  const note = pluck(midi, time, { vel: 0.42 * vel, bus: lp });
  onString(s, time, note);
  note.release(time + (palm ? Math.min(dur, 0.16) : Math.max(0.05, dur)), 0.06);
}

// Zahraje jednu událost z rhythmEvents. time = čas začátku události v s.
export function playEvent(ev, time, secPerBeat) {
  const dur = ev.dur * secPerBeat;
  if (ev.kind === 'strum') {
    strum(ev.notes, time, { dir: ev.dir, vel: ev.vel, mute: ev.mute, palm: ev.palm, dur });
  } else {
    ev.notes.forEach((n) => pickNote(n.midi, time, { vel: ev.vel, dur, palm: ev.palm, s: n.s }));
  }
}
