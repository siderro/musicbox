// Metronom jako program pro transport. Zvuk: klik, woodblock, nebo bicí z vybraného grooveu.

import { store } from '../state/store.js';
import { GROOVES } from '../data/grooves.js';
import { splitSteps } from '../data/validate.js';
import { click } from '../audio/clicks.js';
import { DRUM_VOICES } from '../audio/drums.js';

const VELOCITY = { X: 1, x: 0.72, g: 0.3 };

// Takty: počet dob a skupiny pro vedlejší přízvuky (6/8 = 3+3, 7/8 = 2+2+3).
export const METERS = {
  '2/4': { beats: 2, groups: [2] },
  '3/4': { beats: 3, groups: [3] },
  '4/4': { beats: 4, groups: [4] },
  '5/4': { beats: 5, groups: [3, 2] },
  '6/8': { beats: 6, groups: [3, 3] },
  '7/8': { beats: 7, groups: [2, 2, 3] },
};

function groupStarts(groups) {
  const starts = new Set();
  let acc = 0;
  groups.forEach((g) => { starts.add(acc); acc += g; });
  return starts;
}

// 2 = přízvuk, 1 = doba; ve složených taktech (6/8, 7/8, 5/4) jsou doby uvnitř skupin tišší.
function beatLevel(cfg, beat) {
  if (!cfg.accent) return 1;
  if (beat === 0) return 2;
  if (!cfg.compound) return 1;
  return cfg.starts.has(beat) ? 1 : 0;
}

export function createMetronomeProgram() {
  let step = 0;
  let cfg = null;

  function load() {
    const m = store.get().metro;
    if (m.sound === 'drums') {
      const g = GROOVES[m.groove] ?? GROOVES.rock8;
      return {
        drums: true,
        bpm: m.bpm,
        sp: g.stepsPerBeat,
        beats: g.meter[0],
        total: g.stepsPerBeat * g.meter[0] * g.bars,
        lanes: Object.entries(g.drums).map(([name, str]) => [DRUM_VOICES[name], splitSteps(str)]),
      };
    }
    const meter = METERS[m.meter] ?? METERS['4/4'];
    return {
      drums: false,
      bpm: m.bpm,
      sp: m.subdiv,
      beats: meter.beats,
      total: m.subdiv * meter.beats,
      starts: groupStarts(meter.groups),
      compound: meter.groups.length > 1,
      accent: m.accent,
      sound: m.sound,
    };
  }

  return {
    id: 'metro',
    reset() {
      step = 0;
      cfg = load();
    },
    step(time, emit, muted) {
      if (step === 0) cfg = load();
      const dur = 60 / store.get().metro.bpm / cfg.sp;
      const isBeat = step % cfg.sp === 0;
      const beat = Math.floor(step / cfg.sp) % cfg.beats;

      if (isBeat) emit(time, 'beat', { beat, beats: cfg.beats });
      if (!muted) {
        if (cfg.drums) {
          for (const [voice, lane] of cfg.lanes) {
            const ch = lane[step];
            if (ch in VELOCITY) voice(time, VELOCITY[ch]);
          }
        } else if (isBeat) {
          click(time, beatLevel(cfg, beat), cfg.sound);
        } else {
          click(time, 0, cfg.sound);
        }
      }
      step = (step + 1) % cfg.total;
      return dur;
    },
  };
}
