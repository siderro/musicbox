// SVG hmatník: vodorovně, tenká e nahoře (jako tabulatura).
// Statická část (krk, pražce, struny) se kreslí jednou; tečky se překreslují jen při změně obsahu.
// Každá instance má vlastní geometrii (běžná / kompaktní pro pruhy pod sebou) a vlastní id šipek.

import { MAX_FRET, STRINGS } from './neck.js';

const INLAYS = [3, 5, 7, 9, 15, 17];
const real = (n) => 1 - 2 ** (-n / 12);
let instances = 0;

export function geometry(compact = false) {
  const g = compact
    ? { W: 1200, TOP: 22, GAP: 28, R: 13, NUT_X: 74, END_X: 1186 }
    : { W: 1200, TOP: 26, GAP: 34, R: 15, NUT_X: 74, END_X: 1186 };
  g.H = g.TOP + 5 * g.GAP + (compact ? 38 : 44);
  // polovina realistické rozteče, polovina rovnoměrné – čitelné i ve vysokých polohách
  g.fretX = (n) => g.NUT_X + (g.END_X - g.NUT_X) * (0.5 * (real(n) / real(MAX_FRET)) + 0.5 * (n / MAX_FRET));
  g.noteX = (f) => (f === 0 ? g.NUT_X - 30 : (g.fretX(f - 1) + g.fretX(f)) / 2);
  g.stringY = (s) => g.TOP + (s - 1) * g.GAP;
  return g;
}

// Výřez viewBoxu kolem rozsahu pražců [lo, hi] (pro užší sloupec).
export function viewBoxFor(g, range) {
  if (!range) return [0, 0, g.W, g.H];
  const x1 = range[0] <= 0 ? 0 : Math.max(0, g.fretX(range[0] - 1) - 6);
  const x2 = Math.min(g.W, g.fretX(Math.min(MAX_FRET, range[1])) + 8);
  return [x1, 0, x2 - x1, g.H];
}

function staticLayer(g) {
  const parts = [];
  const pad = g.R + 2;
  const neckTop = g.stringY(1) - pad;
  const neckBottom = g.stringY(6) + pad;
  parts.push(`<rect class="fb-neck" x="${g.NUT_X}" y="${neckTop}" width="${g.END_X - g.NUT_X}" height="${neckBottom - neckTop}" rx="3"/>`);
  const mid = (g.stringY(3) + g.stringY(4)) / 2;
  const ir = g.R * 0.58;
  for (const f of INLAYS) parts.push(`<circle class="fb-inlay" cx="${g.noteX(f)}" cy="${mid}" r="${ir}"/>`);
  parts.push(`<circle class="fb-inlay" cx="${g.noteX(12)}" cy="${(g.stringY(2) + g.stringY(3)) / 2}" r="${ir}"/>`);
  parts.push(`<circle class="fb-inlay" cx="${g.noteX(12)}" cy="${(g.stringY(4) + g.stringY(5)) / 2}" r="${ir}"/>`);
  for (let f = 1; f <= MAX_FRET; f++) {
    parts.push(`<line class="fb-fret" x1="${g.fretX(f)}" y1="${neckTop}" x2="${g.fretX(f)}" y2="${neckBottom}"/>`);
  }
  parts.push(`<rect class="fb-nut" x="${g.NUT_X - 5}" y="${neckTop}" width="7" height="${neckBottom - neckTop}" rx="2"/>`);
  for (const s of STRINGS) {
    parts.push(`<line class="fb-string" x1="${g.NUT_X - 46}" y1="${g.stringY(s)}" x2="${g.END_X}" y2="${g.stringY(s)}" stroke-width="${0.8 + (s - 1) * 0.38}"/>`);
  }
  for (let f = 0; f <= MAX_FRET; f++) {
    const marked = f === 0 || INLAYS.includes(f) || f === 12;
    parts.push(`<text class="fb-fretnum${marked ? ' is-marked' : ''}" x="${g.noteX(f)}" y="${g.H - 6}">${f}</text>`);
  }
  return parts.join('');
}

// dots: [{ s, f, label, cls, dim, chord, faded, tag }]
//   cls: scale | root | blue | chord | outside | lick | idea | idea-root | color | target | approach | hold | ghost
//        | start | path | land | home | src | src-root | next   (+ tag: krátký nápis nad tečkou)
function dotMarkup(g, d) {
  const x = g.noteX(d.f);
  const y = g.stringY(d.s);
  const r = g.R;
  const cls = `fb-dot is-${d.cls}${d.dim ? ' is-dim' : ''}${d.faded ? ' is-faded' : ''}${d.chord ? ' has-chord' : ''}${d.nextChord ? ' has-next' : ''}`;
  const square = ['root', 'chord-root', 'idea-root', 'src-root'].includes(d.cls);
  const shape = square
    ? `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.42}"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  const ring = d.chord || d.nextChord ? `<circle class="fb-ring" cx="${x}" cy="${y}" r="${r + 3.5}"/>` : '';
  const tag = d.tag ? `<text class="fb-tag" x="${x}" y="${y - r - 5}">${d.tag}</text>` : '';
  return `<g class="${cls}" data-key="${d.s}:${d.f}">${ring}${shape}<text x="${x}" y="${y + r * 0.36}">${d.label ?? ''}</text>${tag}</g>`;
}

// Šipka mezi dvěma tóny (rozvod vodicího tónu): from/to = { s, f }
function linkMarkup(g, markerId, l) {
  const x1 = g.noteX(l.from.f);
  const y1 = g.stringY(l.from.s);
  const x2 = g.noteX(l.to.f);
  const y2 = g.stringY(l.to.s);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return `<circle class="fb-link-hold" cx="${x1}" cy="${y1}" r="${g.R + 7}"/>`;
  const k = (g.R + 3) / len;
  return `<line class="fb-link ${l.cls ?? ''}" x1="${x1 + (x2 - x1) * k}" y1="${y1 + (y2 - y1) * k}" x2="${x2 - (x2 - x1) * k * 1.25}" y2="${y2 - (y2 - y1) * k * 1.25}" marker-end="url(#${markerId})"/>`;
}

export function createFretboard(container, { compact = false } = {}) {
  const g = geometry(compact);
  const markerId = `fb-arrow-${++instances}`;
  container.innerHTML = `<svg class="fb${compact ? ' is-compact' : ''}" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="Hmatník">
    <g class="fb-static">${staticLayer(g)}</g>
    <defs><marker id="${markerId}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="fb-arrow-head"/></marker></defs>
    <rect class="fb-window" visibility="hidden"/>
    <g class="fb-dots"></g>
    <g class="fb-links"></g>
  </svg>`;
  const svg = container.querySelector('svg');
  const dotsLayer = container.querySelector('.fb-dots');
  const linksLayer = container.querySelector('.fb-links');
  const windowRect = container.querySelector('.fb-window');
  let lit = null;

  return {
    geometry: g,
    render(dots, range = null, links = []) {
      dotsLayer.innerHTML = dots.map((d) => dotMarkup(g, d)).join('');
      linksLayer.innerHTML = links.map((l) => linkMarkup(g, markerId, l)).join('');
      lit = null;
      if (range) {
        const x1 = range[0] === 0 ? g.NUT_X - 48 : g.fretX(range[0] - 1);
        const x2 = g.fretX(range[1]);
        const pad = g.R + 5;
        windowRect.setAttribute('x', x1 + 2);
        windowRect.setAttribute('y', g.stringY(1) - pad);
        windowRect.setAttribute('width', x2 - x1 - 4);
        windowRect.setAttribute('height', g.stringY(6) - g.stringY(1) + 2 * pad);
        windowRect.setAttribute('rx', 8);
        windowRect.setAttribute('visibility', 'visible');
      } else {
        windowRect.setAttribute('visibility', 'hidden');
      }
    },
    // výřez: null = celý hmatník, [lo, hi] = jen pražce kolem okna ruky
    setView(range) {
      svg.setAttribute('viewBox', viewBoxFor(g, range).join(' '));
    },
    // rozsvítí jednu tečku (ukázka v rytmu); null zhasne
    pulse(s, f) {
      lit?.classList.remove('is-hit');
      lit = s == null ? null : dotsLayer.querySelector(`[data-key="${s}:${f}"]`);
      lit?.classList.add('is-hit');
    },
  };
}
