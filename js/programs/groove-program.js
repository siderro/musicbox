// Groovebox jako program pro transport: bicí + akordy + basa podle kolečka a grooveu.
// Změny tóniny, kolečka a grooveu se načtou vždy na začátku taktu.

import { store } from '../state/store.js';
import { buildSong, grooveFor, nextChordAfter } from './song.js';
import { splitSteps, splitTokens } from '../data/validate.js';
import { voiceChord, bassRoot } from '../theory/voicing.js';
import { parseInterval } from '../theory/intervals.js';
import { DRUM_VOICES } from '../audio/drums.js';
import { playChord } from '../audio/keys.js';
import { playBass } from '../audio/bass.js';
import { click } from '../audio/clicks.js';
import { getCtx } from '../audio/engine.js';
import { getLead } from './lead-bus.js';
import { playEvent, warmUpGuitar } from '../audio/guitar.js';
import { analyzeSong } from '../theory/function.js';
import { compChoice, voicedFor, segmentEvents, dueEvents, guitarPlays } from '../comp/comp-plan.js';

// Kytarový doprovod místo kláves: na záložce Doprovod vždy, v Sólování s volbou „Doprovod: kytara“.
export const guitarComp = (st) => st.tab === 'comp' || (st.tab === 'solo' && !!st.soloGuitar);

const VELOCITY = { X: 1, x: 0.72, g: 0.3 };
const HITS = /[Xxg]/;

// Basový token → půltóny od kořene akordu. '3', '5', '7' se berou z akordu.
function bassSemis(token, chord) {
  const fromChord = (num, fallback) => {
    const iv = chord.intervals.find((i) => i.replace(/[b#]/g, '') === num);
    return parseInterval(iv ?? fallback).semis;
  };
  if (token === 'R') return 0;
  if (token === '3') return fromChord('3', '3');
  if (token === '5') return fromChord('5', '5');
  if (token === '7') return fromChord('7', 'b7');
  return parseInterval(token).semis;
}

// Kolik kroků trvá nota: 1 + počet následujících '-' (nejdál do `limit`).
function holdLength(lane, i, limit) {
  let n = 1;
  while (i + n < lane.length && n < limit && lane[i + n] === '-') n++;
  return n;
}

export function createGrooveProgram() {
  let s = null;
  let bar = 0;
  let stepInBar = 0;
  let grooveBar = 0;
  let countInLeft = 0;
  let chord = null;
  let voicing = null;
  let pendingJump = null;
  let barStart = 0;
  let curBar = 0;
  let stepDur = 0.1;
  // otázka–odpověď: dvojice taktů zazní dvakrát (poprvé hraje aplikace, podruhé ty)
  let crChunk = 0;
  let crStep = 0;
  let wasCall = false;
  const callMode = () => store.get().teach?.idea === 'call';
  // kytara: hmaty kolečka, události aktuálního segmentu a jestli v tomto taktu hraje (režim střídání)
  let guitar = null; // { rhythmId, voiced, analysis, mode }
  let warmed = null;
  let segEvents = [];
  let segStart = 0;
  let barCount = 0;
  let guitarBar = true;

  function load() {
    const st = store.get();
    const song = buildSong(st);
    const g = grooveFor(st.groove, song.progression);
    const beats = g.meter[0];
    s = {
      ...song,
      groove: g,
      sp: g.stepsPerBeat,
      beats,
      stepsPerBar: g.stepsPerBeat * beats,
      drums: Object.entries(g.drums).map(([name, str]) => [DRUM_VOICES[name], splitSteps(str)]),
      comp: g.comp ? splitSteps(g.comp) : [],
      bass: g.bass ? splitTokens(g.bass) : [],
      sound: st.chordSound,
      humanize: st.humanize,
    };
    guitar = null;
    if (guitarComp(st)) {
      const analysis = analyzeSong(song, beats);
      const choice = compChoice(st, song, analysis);
      const voiced = voicedFor(choice.sazbaId, song, analysis);
      guitar = { rhythmId: choice.rhythmId, voiced, analysis, mode: st.tab === 'comp' ? st.compMode : 'demo' };
      if (warmed !== voiced && getCtx()) {
        warmUpGuitar(voiced.shapes);
        warmed = voiced;
      }
    }
  }

  const program = {
    id: 'groove',

    reset() {
      load();
      bar = Math.min(store.get().viewBar, s.bars.length - 1);
      stepInBar = 0;
      grooveBar = 0;
      countInLeft = store.get().countIn ? (s.beats < 3 ? 2 : 1) : 0;
      voicing = null;
      pendingJump = null;
      crChunk = bar;
      crStep = 0;
      wasCall = callMode();
      segEvents = [];
      barCount = 0;
    },

    jumpTo(i) {
      pendingJump = i;
    },

    // Čas nejbližší příští první doby (pro lick přehrávaný přes groove).
    nextDownbeat() {
      const barDur = s.stepsPerBar * stepDur;
      let t = barStart + barDur;
      while (t < getCtx().currentTime + 0.05) t += barDur;
      return t;
    },

    // Čas, kdy groove příště dojde na takt `target` a dobu `beat` (může být záporná = předtaktí).
    timeOf(target, beat = 0) {
      const beatDur = s.sp * stepDur;
      const barDur = s.beats * beatDur;
      const L = s.bars.length;
      let t = barStart + ((((target - curBar) % L) + L) % L) * barDur + beat * beatDur;
      while (t < getCtx().currentTime + 0.12) t += L * barDur;
      return { t, beatDur };
    },

    get stepsPerBeat() {
      return s?.sp ?? 4;
    },

    step(time, emit, muted) {
      if (stepInBar === 0) {
        load();
        grooveBar %= s.groove.bars; // po přepnutí na kratší groove
        if (pendingJump != null && countInLeft === 0) {
          bar = pendingJump;
          pendingJump = null;
          crChunk = bar;
          crStep = 0;
        }
        bar %= s.bars.length;
        barStart = time;
        curBar = countInLeft > 0 ? (bar - 1 + s.bars.length) % s.bars.length : bar;
        if (callMode() && !wasCall) {
          crChunk = bar;
          crStep = 0;
        }
        wasCall = callMode();
        if (countInLeft === 0) {
          guitarBar = guitar ? guitarPlays(guitar.mode, barCount) : false;
          if (guitar) emit(time, 'comp', { bar, play: guitarBar, mode: guitar.mode, barCount });
        }
      }
      stepDur = 60 / store.get().tempo / s.sp;
      const dur = stepDur;
      const isBeat = stepInBar % s.sp === 0;

      if (countInLeft > 0) {
        if (isBeat) {
          const beat = stepInBar / s.sp;
          if (!muted) click(time, beat === 0 ? 2 : 1, 'click');
          emit(time, 'countin', { beat, beats: s.beats });
        }
        if (++stepInBar >= s.stepsPerBar) {
          stepInBar = 0;
          countInLeft--;
        }
        return dur;
      }

      const chords = s.bars[bar];
      const segLen = s.stepsPerBar / chords.length;
      const seg = Math.floor(stepInBar / segLen);
      const chordStart = stepInBar % segLen === 0;
      const stepsLeftInChord = segLen - (stepInBar % segLen);
      const role = wasCall ? (crStep < 2 ? 'call' : 'response') : null;
      if (chordStart) {
        chord = chords[seg];
        voicing = voiceChord(chord.tones, voicing);
        segEvents = [];
        if (guitar) {
          const shape = guitar.voiced.shapes[guitar.analysis.byBar[bar]?.[seg] ?? 0];
          segEvents = segmentEvents(guitar.rhythmId, shape, { meterBeats: s.beats, chordsInBar: chords.length, bar, seg });
          segStart = time;
        }
        emit(time, 'chord', { bar, seg, chord, next: nextChordAfter(s.bars, bar, seg), total: s.bars.length, role, crChunk, crStep });
      }
      if (isBeat) emit(time, 'beat', { beat: stepInBar / s.sp, beats: s.beats, bar, role });
      emit(time, 'tick', { bar, seg, beatInBar: stepInBar / s.sp, beats: s.beats, role });

      if (!muted) {
        const i = grooveBar * s.stepsPerBar + stepInBar;
        const jitter = () => (s.humanize ? Math.random() * 0.004 : 0);
        const vel = (v) => (s.humanize ? v * (0.95 + Math.random() * 0.1) : v);

        for (const [voice, lane] of s.drums) {
          const ch = lane[i];
          if (HITS.test(ch)) voice(time + jitter(), vel(VELOCITY[ch]));
        }

        const c = s.comp[i];
        if (guitar) {
          // stejné tempo celý segment; při změně tempa uprostřed se zbytek posune jen nepatrně
          if (guitarBar) {
            const spb = stepDur * s.sp;
            for (const { ev, time: t } of dueEvents(segEvents, segStart, spb, time, time + dur)) playEvent(ev, t + jitter(), spb);
          }
        } else if (c && (HITS.test(c) || (c === '-' && chordStart))) {
          const steps = holdLength(s.comp, i, stepsLeftInChord);
          playChord(voicing, time + jitter(), steps * dur * 0.92, vel(VELOCITY[c] ?? 0.72), s.sound);
        }

        const b = s.bass[i];
        if (b && (/^(R|[b#]?\d+)$/.test(b) || (b === '-' && chordStart))) {
          const token = b === '-' ? 'R' : b;
          const steps = holdLength(s.bass, i, stepsLeftInChord);
          playBass(bassRoot(chord.rootPc) + bassSemis(token, chord), time + jitter(), steps * dur * 0.9, vel(0.8));
        }

        getLead()?.(time, { bar, seg, beatInBar: stepInBar / s.sp, sp: s.sp, beatDur: stepDur * s.sp, role });
      }

      if (++stepInBar >= s.stepsPerBar) {
        stepInBar = 0;
        barCount++;
        grooveBar = (grooveBar + 1) % s.groove.bars;
        if (store.get().freeze) {
          // drží se aktuální takt
        } else if (wasCall) {
          crStep = (crStep + 1) % 4;
          if (crStep === 0) crChunk = (crChunk + 2) % s.bars.length;
          bar = (crChunk + (crStep % 2)) % s.bars.length;
        } else {
          bar = (bar + 1) % s.bars.length;
        }
      }
      return dur;
    },
  };
  return program;
}
