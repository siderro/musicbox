// Svislý diagram akordu (chord box) jako SVG řetězec: struny 6 → 1 zleva doprava, pražce shora dolů,
// x / o nad strunami, barré, číslo prvního pražce, kroužky s intervaly (nebo bez popisku v malém diagramu).
// Čistá funkce – vrací markup, nic nevkládá.

const pretty = (s) => String(s).replace(/b/g, '♭').replace(/#/g, '♯');

// Okno pražců: do 4. pražce od nultého (s nultým pražcem), jinak od nejnižšího hmatného.
export function boxWindow(shape, rows = 4) {
  const fr = shape.notes.filter((n) => n.f > 0).map((n) => n.f);
  const hi = fr.length ? Math.max(...fr) : 0;
  const lo = fr.length ? Math.min(...fr) : 1;
  if (hi <= rows) return { start: 1, rows, nut: true };
  return { start: lo, rows: Math.max(rows, hi - lo + 1), nut: false };
}

// opts: { label: (note) => text | '', keep: Set(pc) – kroužek „zůstává“, mini: bez textu a čísel, cls }
export function chordBoxSvg(shape, { label = (n) => pretty(n.interval), keep = new Set(), mini = false, cls = '' } = {}) {
  const { start, rows, nut } = boxWindow(shape);
  const GAP = mini ? 11 : 30; // rozteč strun
  const ROW = mini ? 12 : 34; // výška pražce
  const R = mini ? 4.2 : 12;
  const left = mini ? 8 : 34;
  const top = mini ? 12 : 34;
  const W = left + 5 * GAP + (mini ? 8 : 18);
  const H = top + rows * ROW + (mini ? 4 : 30);
  const x = (s) => left + (6 - s) * GAP;
  const yMid = (f) => top + (f - start + 0.5) * ROW;
  const p = [];

  // pražce a struny
  for (let r = 0; r <= rows; r++) {
    const y = top + r * ROW;
    p.push(`<line class="cb-fret${r === 0 && nut ? ' is-nut' : ''}" x1="${x(6)}" y1="${y}" x2="${x(1)}" y2="${y}"/>`);
  }
  for (let s = 6; s >= 1; s--) p.push(`<line class="cb-string" x1="${x(s)}" y1="${top}" x2="${x(s)}" y2="${top + rows * ROW}"/>`);
  if (!nut && !mini) p.push(`<text class="cb-fretno" x="${left - 12}" y="${yMid(start) + 5}">${start}</text>`);
  if (!nut && mini) p.push(`<text class="cb-fretno is-mini" x="${left - 5}" y="${top - 3}">${start}</text>`);

  // x / o nad strunami
  const byS = new Map(shape.notes.map((n) => [n.s, n]));
  for (let s = 6; s >= 1; s--) {
    const n = byS.get(s);
    const y = top - (mini ? 6 : 14);
    if (!n) {
      const d = mini ? 2.6 : 6;
      p.push(`<path class="cb-mute" d="M${x(s) - d} ${y - d} L${x(s) + d} ${y + d} M${x(s) + d} ${y - d} L${x(s) - d} ${y + d}"/>`);
    } else if (n.f === 0) {
      p.push(`<circle class="cb-open${n.interval === '1' ? ' is-root' : ''}${keep.has(n.pc) ? ' is-keep' : ''}" cx="${x(s)}" cy="${y}" r="${mini ? 2.8 : 7}"/>`);
    }
  }

  // barré
  if (shape.barre && shape.barre.f >= start) {
    const y = yMid(shape.barre.f);
    const x1 = x(shape.barre.from) - R * 0.9;
    const x2 = x(shape.barre.to) + R * 0.9;
    p.push(`<rect class="cb-barre" x="${x1}" y="${y - R * 0.8}" width="${x2 - x1}" height="${R * 1.6}" rx="${R * 0.8}"/>`);
  }

  // tóny
  for (const n of shape.notes) {
    if (n.f === 0) continue;
    const cx = x(n.s);
    const cy = yMid(n.f);
    const k = keep.has(n.pc);
    p.push(`<g class="cb-dot${n.interval === '1' ? ' is-root' : ''}${k ? ' is-keep' : ''}">`
      + `${k ? `<circle class="cb-ring" cx="${cx}" cy="${cy}" r="${R + (mini ? 2 : 4)}"/>` : ''}`
      + `<circle cx="${cx}" cy="${cy}" r="${R}"/>`
      + `${mini ? '' : `<text x="${cx}" y="${cy + 4.5}">${label(n)}</text>`}</g>`);
  }

  // popisky prázdných strun pod diagramem
  if (!mini) {
    for (const n of shape.notes.filter((m) => m.f === 0)) {
      p.push(`<text class="cb-under${n.interval === '1' ? ' is-root' : ''}" x="${x(n.s)}" y="${top + rows * ROW + 20}">${label(n)}</text>`);
    }
  }

  return `<svg class="cb${mini ? ' is-mini' : ''} ${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagram akordu">${p.join('')}</svg>`;
}
