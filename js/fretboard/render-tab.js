// SVG tabulatura licku s jednoduchým rytmickým řádkem a ukazatelem přehrávání.

const LEFT = 48;
const PPB = 92; // pixelů na dobu
const TOP = 40;
const GAP = 15;
const RHYTHM_TOP = TOP + 5 * GAP + 18;
const RHYTHM_BOTTOM = RHYTHM_TOP + 26;
const H = RHYTHM_BOTTOM + 14;

const y = (s) => TOP + (s - 1) * GAP;
const x = (beat) => LEFT + beat * PPB + 14;
const near = (a, b) => Math.abs(a - b) < 0.02;

function bendLabel(bend) {
  if (near(bend, 1)) return 'full';
  if (near(bend, 0.5)) return '½';
  if (near(bend, 1.5)) return '1½';
  return `${bend * 2}`;
}

function rhythm(events) {
  const parts = [];
  const groups = new Map();
  events.forEach((e) => {
    const nx = x(e.start);
    if (e.rest) {
      // pauza: celotaktová visí pod čarou, kratší sedí na čáře
      const hang = e.d >= 4;
      parts.push(`<line class="tab-stem" x1="${nx - 9}" y1="${RHYTHM_TOP + 10}" x2="${nx + 9}" y2="${RHYTHM_TOP + 10}"/>`);
      parts.push(`<rect class="tab-rest" x="${nx - 6}" y="${hang ? RHYTHM_TOP + 10 : RHYTHM_TOP + 5}" width="12" height="5"/>`);
      return;
    }
    if (e.d < 4) {
      const top = e.d >= 2 ? RHYTHM_TOP + 8 : RHYTHM_TOP;
      parts.push(`<line class="tab-stem" x1="${nx}" y1="${top}" x2="${nx}" y2="${RHYTHM_BOTTOM}"/>`);
    }
    if (e.d >= 2) parts.push(`<ellipse class="tab-half" cx="${e.d >= 4 ? nx : nx - 4}" cy="${RHYTHM_BOTTOM}" rx="${e.d >= 4 ? 5.5 : 4.5}" ry="3.2"/>`);
    if (e.d < 1) {
      const key = Math.floor(e.start + 1e-6);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
  });
  for (const group of groups.values()) {
    const triplet = group.some((e) => near(e.d * 3, Math.round(e.d * 3)) && !near(e.d * 2, Math.round(e.d * 2)));
    if (group.length === 1) {
      const nx = x(group[0].start);
      parts.push(`<path class="tab-flag" d="M${nx} ${RHYTHM_BOTTOM} q 7 -3 9 -11"/>`);
      if (group[0].d <= 0.25 + 1e-6) parts.push(`<path class="tab-flag" d="M${nx} ${RHYTHM_BOTTOM - 5} q 7 -3 9 -11"/>`);
      continue;
    }
    const x1 = x(group[0].start);
    const x2 = x(group[group.length - 1].start);
    parts.push(`<line class="tab-beam" x1="${x1}" y1="${RHYTHM_BOTTOM}" x2="${x2}" y2="${RHYTHM_BOTTOM}"/>`);
    group.forEach((e, i) => {
      if (e.d <= 0.25 + 1e-6) {
        const nx = x(e.start);
        const other = group[i + 1] ?? group[i - 1];
        const ox = x(other.start);
        parts.push(`<line class="tab-beam" x1="${Math.min(nx, ox)}" y1="${RHYTHM_BOTTOM - 5}" x2="${Math.max(nx, ox)}" y2="${RHYTHM_BOTTOM - 5}"/>`);
      }
    });
    if (triplet) parts.push(`<text class="tab-tuplet" x="${(x1 + x2) / 2}" y="${RHYTHM_TOP - 3}">3</text>`);
  }
  return parts.join('');
}

// startBeat: na které době taktu lick začíná (předtaktí), marks: [{ beat, label }] = akordy nad tabulaturou
export function renderTab(container, resolved, { beatsPerBar = 4, startBeat = 0, marks = [] } = {}) {
  const { events, beats } = resolved;
  const totalBeats = Math.max(beatsPerBar, Math.ceil((beats + startBeat) / beatsPerBar) * beatsPerBar - startBeat);
  const W = LEFT + totalBeats * PPB + 20;
  const parts = [];

  parts.push(`<text class="tab-clef" x="14" y="${y(2) + 4}">T</text><text class="tab-clef" x="14" y="${y(3.5) + 4}">A</text><text class="tab-clef" x="14" y="${y(5) + 4}">B</text>`);
  for (let s = 1; s <= 6; s++) parts.push(`<line class="tab-line" x1="${LEFT - 8}" y1="${y(s)}" x2="${W - 12}" y2="${y(s)}"/>`);
  const frac = startBeat % 1;
  for (let b = 0; b <= totalBeats + 1; b++) {
    const at = b - frac;
    if (at < 0 || at > totalBeats + 1e-6) continue;
    const bx = LEFT + at * PPB;
    const isBar = Math.abs((at + startBeat) % beatsPerBar) < 1e-6;
    parts.push(`<line class="${isBar ? 'tab-bar' : 'tab-beat'}" x1="${bx}" y1="${y(1)}" x2="${bx}" y2="${y(6)}"/>`);
  }
  marks.forEach((m) => parts.push(`<text class="tab-chord" x="${LEFT + m.beat * PPB + 4}" y="14">${m.label}</text>`));

  events.forEach((e, i) => {
    const nx = x(e.start);
    const next = events[i + 1];
    e.notes.forEach((n) => {
      const label = String(n.f);
      const w = label.length * 8 + 6;
      parts.push(`<rect class="tab-num-bg" x="${nx - w / 2}" y="${y(n.s) - 8}" width="${w}" height="16"/>`);
      parts.push(`<text class="tab-num" x="${nx}" y="${y(n.s) + 4.5}">${label}</text>`);
    });
    const first = e.notes[0];
    if (!first) return;
    const ny = y(first.s);
    if (e.t === 'b' || e.t === 'r') {
      const up = e.t === 'b';
      const ax = nx + 10;
      parts.push(up
        ? `<path class="tab-bend" d="M${ax} ${ny - 4} Q ${ax + 14} ${ny - 6} ${ax + 14} ${TOP - 18}"/>`
        : `<path class="tab-bend" d="M${ax + 14} ${TOP - 18} Q ${ax + 14} ${ny - 6} ${ax + 26} ${ny - 4}"/>`);
      parts.push(`<text class="tab-tech" x="${ax + 14}" y="${TOP - 22}">${up ? bendLabel(e.bend) : 'r'}</text>`);
    }
    if (e.t === '~') {
      const vx = nx + 12;
      parts.push(`<path class="tab-vib" d="M${vx} ${ny - 13} q 4 -5 8 0 t 8 0 t 8 0 t 8 0"/>`);
    }
    if (next && !next.rest && ['h', 'p', '/', '\\'].includes(e.t)) {
      const mx = x(next.start);
      const nny = y(next.notes[0].s);
      if (e.t === 'h' || e.t === 'p') {
        parts.push(`<path class="tab-arc" d="M${nx + 6} ${ny - 9} Q ${(nx + mx) / 2} ${ny - 22} ${mx - 6} ${nny - 9}"/>`);
        parts.push(`<text class="tab-tech" x="${(nx + mx) / 2}" y="${ny - 19}">${e.t}</text>`);
      } else {
        const rising = next.notes[0].f > first.f;
        parts.push(`<line class="tab-slide" x1="${nx + 10}" y1="${ny + (rising ? 4 : -4)}" x2="${mx - 10}" y2="${nny + (rising ? -4 : 4)}"/>`);
      }
    }
  });

  parts.push(rhythm(events));

  container.innerHTML = `<svg class="tab" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Tabulatura">
    ${parts.join('')}
    <line class="tab-playhead" x1="0" y1="${y(1) - 12}" x2="0" y2="${RHYTHM_BOTTOM}" visibility="hidden"/>
  </svg>`;
  const playhead = container.querySelector('.tab-playhead');
  return {
    setPlayhead(beat) {
      if (beat == null || beat < 0 || beat > totalBeats) {
        playhead.setAttribute('visibility', 'hidden');
        return;
      }
      const px = LEFT + beat * PPB;
      playhead.setAttribute('x1', px);
      playhead.setAttribute('x2', px);
      playhead.setAttribute('visibility', 'visible');
    },
  };
}
