// Sólový hlas pro fráze hrané přes groove: bendy, povolení, slidy, hammer/pull a vibrato.
// Přehrávač ho volá po krocích; stav (předchozí tón) se drží mezi voláními.
// Utlumení tónu se odkládá, dokud není jasné, že na něj nenavazuje slide nebo povolení bendu.

import { pluck } from '../audio/pluck.js';

export function createLeadVoice() {
  let prev = null; // { ev, voice, pitch }
  let pending = null; // { voice, at }
  const byString = new Map();

  const flush = () => {
    pending?.voice.release(pending.at, 0.06);
    pending = null;
  };

  return {
    // zavolat při každém kroku: utlumí tón, jehož konec už nastal a nikdo na něj nenavázal
    tick(time) {
      if (pending && pending.at - 0.031 <= time) flush();
    },

    // ev: { midi, s, f, t: { vib, leg, slide, release }, bendSemis }
    play(ev, t, tEnd, vel = 0.7) {
      const dur = tEnd - t;
      const p = prev;
      const continues = p && pending && pending.voice === p.voice;
      let voice;
      let pitch = 0;

      if (continues && p.ev.t.slide && p.ev.s === ev.s) {
        // slide: struna zní dál, mění se jen výška
        voice = p.voice;
        pitch = ev.midi - voice.midi;
        voice.rampPitch(p.pitch, pitch, t - 0.02, 0.06);
        pending = null;
      } else if (continues && ev.t.release && p.ev.s === ev.s && p.ev.f === ev.f) {
        // povolení bendu bez nového úhozu
        voice = p.voice;
        voice.rampPitch(ev.bendSemis, 0, t + dur * 0.15, Math.min(0.25, dur * 0.6));
        pending = null;
      } else {
        flush();
        const legato = p && (p.ev.t.leg === 'h' || p.ev.t.leg === 'p');
        byString.get(ev.s)?.release(t, legato ? 0.004 : 0.012);
        voice = pluck(ev.midi, t, { vel: legato ? vel * 0.6 : vel });
        byString.set(ev.s, voice);
        if (ev.t.release && ev.bendSemis) {
          voice.holdPitch(ev.bendSemis, t);
          voice.rampPitch(ev.bendSemis, 0, t + dur * 0.2, Math.min(0.25, dur * 0.6));
        } else if (ev.bendSemis) {
          pitch = ev.bendSemis;
          voice.rampPitch(0, pitch, t + 0.03, Math.min(0.22, dur * 0.45));
        }
      }
      if (ev.t.vib) voice.vibrato(t + Math.min(0.15, dur * 0.3), tEnd);
      prev = { ev, voice, pitch };
      pending = { voice, at: tEnd + 0.03 };
    },

    reset() {
      flush();
      prev = null;
      byString.clear();
    },
  };
}
