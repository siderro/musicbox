// Doprovod: sazba (jakými hmaty) × rytmus (co dělá pravá ruka) ke zvolenému kolečku.
// Kostra jako Sólování: řádek sazeb (A) a rytmů (R) a režimy, mapa kolečka s diagramy hmatů
// (další hmat se rozbliká a odpočítá „za 2 → za 1“), velký diagram + hmatník, mřížka rytmu nad
// tabulaturou a wiki vpravo (W). Kytaru hraje groovebox (js/programs/groove-program.js);
// panel jen zobrazuje a mění volbu ve store.

import { h, selectBox } from './dom.js';
import { T } from '../i18n/cs.js';
import { store } from '../state/store.js';
import { SAZBY } from '../data/voicings.js';
import { RHYTHMS } from '../data/rhythms.js';
import { GROOVES } from '../data/grooves.js';
import { COMP_WIKI } from '../data/comp-wiki.js';
import { buildSong } from '../programs/song.js';
import { analyzeSong } from '../theory/function.js';
import { fillTokens } from '../teaching/approach.js';
import { fretString } from '../comp/voicing-engine.js';
import { rhythmEvents, rhythmGrid, cycleBeats } from '../comp/strum.js';
import { compChoice, voicedFor, remember, cycleIn, changeAhead, tabOf, walkFor, COMP_MODES } from '../comp/comp-plan.js';
import { chordBoxSvg } from '../fretboard/render-chordbox.js';
import { createFretboard } from '../fretboard/render-fretboard.js';
import { renderTab } from '../fretboard/render-tab.js';
import { onTransport, isRunning } from '../audio/transport.js';
import { setGuitarLevel } from '../audio/guitar.js';

const MAX_KEYS = 5;
const pretty = (iv) => String(iv).replace(/b/g, '♭').replace(/#/g, '♯');
const PPB = 92; // pixelů na dobu v render-tab.js
const TAB_LEFT = 48;
// popisky dob v mřížce: 1 & 2 & / 1 e & a / 1 t l
const SUB = { 2: ['', '&'], 3: ['', 't', 'l'], 4: ['', 'e', '&', 'a'] };

export function createCompPanel(root, { groove }) {
  const wikiBtn = h('button', { type: 'button', class: 'wiki-toggle', onclick: () => store.set({ wikiOpen: !store.get().wikiOpen }) });
  const labelBtn = h('button', { type: 'button', class: 'ctl', onclick: () => cycleLabels() });

  // ---------- volba sazby a rytmu ----------
  const sazbaBar = h('div', { class: 'cc-keys', role: 'radiogroup', 'aria-label': T.sazba });
  const rhythmBar = h('div', { class: 'cc-keys', role: 'radiogroup', 'aria-label': T.rhythm });
  const grooveBtn = h('button', { type: 'button', class: 'cc-groove', onclick: () => applyGroove() });
  const modeKeys = COMP_MODES.map((m) => h('button', {
    type: 'button', class: 'cc-mode', title: T.compModeTips[m], 'aria-pressed': 'false', dataset: { mode: m },
    onclick: () => store.set({ compMode: m }),
  }, T.compModes[m]));
  // kdo teď hraje: ukázka / ty (při střídání se mění po taktech)
  const modeState = h('span', { class: 'cc-state' });
  const tools = h('div', { class: 'solo-tools' },
    h('div', { class: 'cc-modes', role: 'group', 'aria-label': T.compModeLabel }, h('span', { class: 'ctl-label' }, T.compModeLabel), modeKeys, modeState),
    h('div', { class: 'ctl-group' }, labelBtn), wikiBtn);
  const deck = h('section', { class: 'cc-console' },
    h('div', { class: 'cc-row' }, h('span', { class: 'cc-legend' }, T.sazba, ' ', h('kbd', {}, 'A')), sazbaBar, tools),
    h('div', { class: 'cc-row' }, h('span', { class: 'cc-legend' }, T.rhythm, ' ', h('kbd', {}, 'R')), rhythmBar, grooveBtn));

  const mapStrip = h('div', { class: 'cmap' });
  const bigBox = h('div', { class: 'cbig-box' });
  const bigName = h('b', { class: 'cbig-name' });
  const bigMeta = h('span', { class: 'cbig-meta' });
  const bigBadge = h('span', { class: 'cbig-badge' });
  const fbBox = h('div', { class: 'cbig-fb' });
  const legend = h('div', { class: 'legend' },
    h('span', { class: 'legend-item is-src-root' }, h('i'), T.rootLegend),
    h('span', { class: 'legend-item is-src' }, h('i'), T.toneLegend),
    h('span', { class: 'legend-item is-chord' }, h('i'), T.keepLegend),
    h('span', { class: 'legend-item is-ghost' }, h('i'), T.nextLegend));
  const stage = h('section', { class: 'cbig' },
    h('div', { class: 'cbig-card' }, h('header', {}, bigName, bigBadge), bigBox, bigMeta),
    h('div', { class: 'cbig-right' }, fbBox, legend));

  const rhythmName = h('b', { class: 'crh-name' });
  const rhythmTip = h('span', { class: 'crh-tip' });
  const gridEl = h('div', { class: 'crh-grid' });
  const tabEl = h('div', { class: 'crh-tab' });
  const tabScroll = h('div', { class: 'tab-scroll crh-scroll' }, gridEl, tabEl);
  const rhythmDock = h('section', { class: 'crh' }, h('header', { class: 'crh-head' }, rhythmName, rhythmTip), tabScroll);

  const main = h('div', { class: 'solo-main comp-main' },
    deck,
    mapStrip,
    stage,
    rhythmDock);
  const wikiBox = h('aside', { class: 'wiki comp-wiki', 'aria-label': T.compWikiTitle });
  root.append(main, wikiBox);

  const fb = createFretboard(fbBox, { compact: true });

  let song = null;
  let analysis = null;
  let choice = null;
  let voiced = null;
  let grid = [];
  let tab = null;
  let cur = 0;
  let beatInSeg = 0;
  let ahead = null;
  let gridStep = -1;
  let playing = true; // hraje teď kytara (režim střídání)

  const st = () => store.get();
  const shapes = () => voiced.shapes;
  const rhythm = () => RHYTHMS[choice.rhythmId];

  // ---------- sestavení ----------
  function rebuild() {
    song = buildSong(st());
    analysis = analyzeSong(song);
    choice = compChoice(st(), song, analysis);
    voiced = voicedFor(choice.sazbaId, song, analysis);
    if (!isRunning('groove')) {
      cur = analysis.byBar[Math.min(st().viewBar, song.bars.length - 1)][0];
      beatInSeg = 0;
      ahead = null;
    }
    cur = Math.min(cur, analysis.segments.length - 1);
    drawKeys();
    drawMap();
    drawShape();
    drawRhythm();
    drawModes();
    drawWiki();
  }

  // ---------- lišty sazeb a rytmů ----------
  function keyRow(bar, list, active, names, levels, onPick, moreLabel) {
    const shown = list.slice(0, MAX_KEYS);
    if (!shown.includes(active)) shown[MAX_KEYS - 1] = active;
    const rest = list.filter((id) => !shown.includes(id));
    bar.replaceChildren(
      ...shown.map((id) => h('button', {
        type: 'button', role: 'radio', class: 'cc-key', 'aria-checked': id === active ? 'true' : 'false',
        title: names[id], onclick: () => onPick(id),
      }, names[id], h('i', { class: `lvl lvl-${levels[id]}` }))),
      ...(rest.length ? [selectBox([['', moreLabel], ...rest.map((id) => [id, names[id]])], '', (v) => v && onPick(v), { class: 'cc-more', 'aria-label': moreLabel })] : []));
  }

  function drawKeys() {
    const sn = Object.fromEntries(choice.sazby.map((id) => [id, SAZBY[id].name]));
    const sl = Object.fromEntries(choice.sazby.map((id) => [id, SAZBY[id].level]));
    keyRow(sazbaBar, choice.sazby, choice.sazbaId, sn, sl, setSazba, T.moreSazby);
    const rn = Object.fromEntries(choice.rhythms.map((id) => [id, RHYTHMS[id].name]));
    const rl = Object.fromEntries(choice.rhythms.map((id) => [id, RHYTHMS[id].level]));
    keyRow(rhythmBar, choice.rhythms, choice.rhythmId, rn, rl, setRhythm, T.moreRhythms);
    drawGrooveBtn();
  }

  // doporučený groove k rytmu se jen nabídne – nic se nepřepne samo
  function drawGrooveBtn() {
    const gid = rhythm().groove;
    const g = GROOVES[gid];
    const fits = g && g.meter.join('/') === song.progression.meter.join('/');
    grooveBtn.hidden = !fits;
    if (!fits) return;
    const same = st().groove === gid;
    grooveBtn.disabled = same;
    grooveBtn.classList.toggle('is-match', same);
    grooveBtn.textContent = same ? `✓ ${T.grooveMatches}` : `♪ ${T.grooveForRhythm}`;
    grooveBtn.title = `${T.compGroove}: ${g.name}`;
  }

  function applyGroove() {
    const gid = rhythm().groove;
    if (GROOVES[gid]) store.set({ groove: gid });
  }

  const setSazba = (id) => store.set({ sazbaByProgression: remember(st().sazbaByProgression, st().progression, id) });
  const setRhythm = (id) => store.set({ rhythmByProgression: remember(st().rhythmByProgression, st().progression, id) });

  function cycleSazba(dir) {
    setSazba(cycleIn(choice.sazby, choice.sazbaId, dir));
  }
  function cycleRhythm(dir) {
    setRhythm(cycleIn(choice.rhythms, choice.rhythmId, dir));
  }

  // ---------- popisky ----------
  const labelOf = (n) => (st().labelMode === 'names' ? n.name : pretty(n.interval));

  function cycleLabels() {
    const order = ['chord', 'names', 'source'];
    store.set({ labelMode: order[(order.indexOf(st().labelMode) + 1) % order.length] });
  }

  // ---------- mapa kolečka s diagramy ----------
  const shortName = (sh) => sh.name.replace(/\s*\(.*\)$/, '').replace(/ · .*$/, '');

  function drawMap() {
    const n = analysis.segments.length;
    mapStrip.style.setProperty('--cols', n > 12 ? Math.ceil(n / 2) : n);
    mapStrip.classList.toggle('is-two-rows', n > 12);
    keepCell = -1;
    mapStrip.replaceChildren(...analysis.segments.map((sg, i) => {
      const sh = shapes()[i];
      return h('button', {
        type: 'button', class: 'cmap-cell', dataset: { i: String(i) },
        onclick: () => (isRunning('groove') ? groove.jumpTo(sg.bar) : store.set({ viewBar: sg.bar })),
      },
      h('span', { class: 'cmap-head' }, h('b', {}, shortName(sh)), h('em', { class: 'cmap-badge' })),
      h('span', { class: 'cmap-box', html: chordBoxSvg(sh, { mini: true }) }),
      h('small', {}, fretString(sh)));
    }));
    markMap();
  }

  // tóny, které zůstávají, se kreslí jen u dalšího hmatu (vůči aktuálnímu)
  let keepCell = -1;
  function markMap() {
    const n = analysis.segments.length;
    const nextIdx = ahead ? ahead.next : (cur + 1) % n;
    if (keepCell !== nextIdx) {
      const paint = (i, keep) => {
        const box = mapStrip.children[i]?.querySelector('.cmap-box');
        if (box) box.innerHTML = chordBoxSvg(shapes()[i], { mini: true, keep: new Set(keep ? shapes()[i].keep : []) });
      };
      if (keepCell >= 0) paint(keepCell, false);
      paint(nextIdx, true);
      keepCell = nextIdx;
    }
    [...mapStrip.children].forEach((c, i) => {
      c.classList.toggle('is-current', i === cur);
      c.classList.toggle('is-next', !!ahead && ahead.next === i);
      c.querySelector('.cmap-badge').textContent = ahead && ahead.next === i ? T.laneIn(ahead.left) : '';
    });
  }

  // ---------- velký diagram a hmatník ----------
  function drawShape() {
    const sh = shapes()[cur];
    const next = ahead ? shapes()[ahead.next] : null;
    // při odpočtu: kroužek = tón, který v dalším hmatu zůstane
    const stay = new Set(next ? next.keep : []);
    bigBox.innerHTML = chordBoxSvg(sh, { label: labelOf, keep: stay });
    bigName.textContent = sh.name;
    bigMeta.textContent = [fretString(sh), sh.barre ? `${T.barreLabel} ${sh.barre.f}` : null,
      sh.notes.map((n) => (st().labelMode === 'names' ? n.name : pretty(n.interval))).join(' ')].filter(Boolean).join(' · ');
    bigBadge.textContent = ahead ? `${T.laneIn(ahead.left)} → ${shortName(next)}` : '';
    const dots = sh.notes.map((n) => ({ s: n.s, f: n.f, cls: n.interval === '1' ? 'src-root' : 'src', chord: stay.has(n.pc), label: labelOf(n) }));
    if (next) {
      const here = new Set(sh.notes.map((n) => `${n.s}:${n.f}`));
      next.notes.filter((n) => !here.has(`${n.s}:${n.f}`)).forEach((n) => dots.push({ s: n.s, f: n.f, cls: 'ghost', label: labelOf(n) }));
    }
    const all = [...sh.notes, ...(next?.notes ?? [])].map((n) => n.f);
    const lo = Math.max(0, Math.min(...all) - 1);
    const hi = Math.min(17, Math.max(lo + 7, Math.max(...all) + 1));
    fb.render(dots);
    fb.setView([lo, hi]);
  }

  // ---------- mřížka rytmu a tabulatura ----------
  function drawRhythm() {
    const r = rhythm();
    const sh = shapes()[cur];
    rhythmName.textContent = `${r.name} · ${r.meter.join('/')}${r.bars > 1 ? ` · ${r.bars} takty` : ''}`;
    rhythmTip.textContent = r.tip ?? '';
    grid = rhythmGrid(choice.rhythmId);
    const beats = cycleBeats(choice.rhythmId);
    const w = PPB / r.stepsPerBeat;
    gridEl.style.setProperty('--step', `${w}px`);
    gridEl.style.paddingLeft = `${TAB_LEFT}px`;
    gridEl.replaceChildren(...grid.map((g, k) => {
      const beatNo = Math.floor(k / r.stepsPerBeat) % r.meter[0] + 1;
      const sub = SUB[r.stepsPerBeat]?.[k % r.stepsPerBeat] ?? '';
      const tokens = g.tokens.filter((t) => t.label && t.label !== '–');
      const hold = g.tokens.some((t) => t.t === '-');
      return h('span', { class: `crh-step${g.onBeat ? ' is-beat' : ''}${tokens.some((t) => t.accent) ? ' is-accent' : ''}${hold ? ' is-hold' : ''}`, dataset: { k: String(k) } },
        h('small', {}, g.onBeat ? beatNo : sub),
        h('b', {}, tokens.length ? tokens.map((t) => t.label).join('') : hold ? '–' : '·'));
    }));
    // u bas + akord ukáže i basový přechod k dalšímu hmatu (na konci cyklu rytmu)
    const events = rhythmEvents(choice.rhythmId, sh, { beats, startBeat: 0, walkTo: walkFor(voiced, analysis, cur) });
    tab = renderTab(tabEl, tabOf(events, beats), { beatsPerBar: r.meter[0], marks: [{ beat: 0, label: shortName(sh) }] });
    gridStep = -1;
  }

  function markGrid(pos) {
    let k = -1;
    if (pos != null) {
      for (let i = 0; i < grid.length; i++) if (grid[i].beat <= pos + 1e-6) k = i;
    }
    if (k === gridStep) return;
    gridEl.children[gridStep]?.classList.remove('is-now');
    gridStep = k;
    gridEl.children[k]?.classList.add('is-now');
  }

  // ---------- režimy ----------
  function drawModes() {
    const mode = st().compMode;
    modeKeys.forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false'));
    const running = isRunning('groove');
    const you = mode === 'self' || (mode === 'alt' && !playing);
    modeState.textContent = !running ? '' : you ? T.compYou : T.compDemo;
    main.classList.toggle('is-you', running && you);
    labelBtn.textContent = st().labelMode === 'names' ? T.labelModes.names : T.labelModes.chord;
    wikiBtn.textContent = `${st().wikiOpen ? T.wikiHide : T.wikiShow} (W)`;
    wikiBtn.setAttribute('aria-pressed', st().wikiOpen ? 'true' : 'false');
  }

  // „Hraju sám“: kytara ztlumená hned (i dozvuk), jinak plná
  function applyLevel() {
    setGuitarLevel(st().tab === 'comp' && st().compMode === 'self' ? 0 : 1);
  }

  // ---------- wiki ----------
  const para = (text) => h('p', { html: text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') });

  function drawWiki() {
    root.classList.toggle('has-wiki', st().wikiOpen);
    wikiBox.hidden = !st().wikiOpen;
    if (!st().wikiOpen) return;
    const page = COMP_WIKI[st().progression] ?? {};
    const fill = (s) => fillTokens(s, song);
    const firstOfDegree = analysis.segments.filter((sg, i, arr) => arr.findIndex((x) => x.chord.degree === sg.chord.degree) === i);
    const rows = firstOfDegree.map((sg) => {
      const sh = shapes()[sg.index];
      return h('tr', {},
        h('td', {}, h('b', {}, shortName(sh))),
        h('td', { class: 'mono' }, fretString(sh)),
        h('td', {}, sh.notes.map((n) => pretty(n.interval)).join(' ')));
    });
    const sazbaCards = choice.sazby.map((id) => {
      const sz = SAZBY[id];
      const active = id === choice.sazbaId;
      const tries = [...(page.try?.[id] ?? []), ...(sz.try ?? [])];
      return h('article', { class: `wiki-card${active ? ' is-active' : ''}` },
        h('header', {},
          h('h3', {}, sz.name, h('i', { class: `lvl lvl-${sz.level}` })),
          active ? h('span', { class: 'wiki-active' }, T.activeApproach)
            : h('button', { type: 'button', class: 'wiki-try', onclick: () => setSazba(id) }, `▶ ${T.tryButton}`)),
        h('h4', {}, T.why),
        para(fill(sz.why)),
        page.notes?.[id] ? para(fill(page.notes[id])) : null,
        id === 'shell' ? h('button', { type: 'button', class: 'wiki-lick', onclick: () => toSoloGuide() }, `▶ ${T.compToSolo}`) : null,
        tries.length ? h('h4', {}, T.tryIt) : null,
        tries.length ? h('ul', {}, tries.map((t) => h('li', {}, fill(t)))) : null);
    });
    const rhythmCards = choice.rhythms.map((id) => {
      const r = RHYTHMS[id];
      const active = id === choice.rhythmId;
      const g = GROOVES[r.groove];
      return h('article', { class: `wiki-card${active ? ' is-active' : ''}` },
        h('header', {},
          h('h3', {}, r.name, h('i', { class: `lvl lvl-${r.level}` })),
          active ? h('span', { class: 'wiki-active' }, T.activeApproach)
            : h('button', { type: 'button', class: 'wiki-try', onclick: () => setRhythm(id) }, `▶ ${T.tryButton}`)),
        h('p', { class: 'mono wiki-pattern' }, r.pattern),
        r.tip ? para(r.tip) : null,
        page.rhythmNotes?.[id] ? para(fill(page.rhythmNotes[id])) : null,
        g ? h('p', { class: 'wiki-sub' }, `${T.compGroove}: ${g.name} `,
          st().groove === r.groove ? '✓' : h('button', { type: 'button', class: 'wiki-try', onclick: () => store.set({ groove: r.groove }) }, T.compUseGroove)) : null);
    });
    wikiBox.replaceChildren(
      h('h2', {}, T.compWikiTitle),
      h('section', { class: 'wiki-intro' },
        h('h3', {}, T.wikiFeel),
        page.feel ? para(fill(page.feel)) : null,
        h('h4', {}, `${T.compWikiShapes} · ${SAZBY[choice.sazbaId].name}`),
        h('table', { class: 'wiki-table' }, h('thead', {}, h('tr', {}, T.compWikiCols.map((c) => h('th', {}, c)))), h('tbody', {}, rows))),
      h('h3', {}, T.compWikiSazby),
      ...sazbaCards,
      h('h3', {}, T.compWikiRhythms),
      ...rhythmCards);
  }

  // propojení se Sólováním: shell chords = vodicí tóny 3 a 7
  function toSoloGuide() {
    store.set({ approachByProgression: { ...st().approachByProgression, [st().progression]: 'guideLine' }, tab: 'solo' });
  }

  // ---------- živé události ----------
  function setSegment(i) {
    if (i === cur) return;
    cur = i;
    beatInSeg = 0;
    ahead = null;
    markMap();
    drawShape();
    drawRhythm();
  }

  onTransport((e) => {
    if (e.program && e.program !== 'groove') return;
    if (!voiced) return;
    if (e.type === 'start') {
      playing = true;
      drawModes();
    } else if (e.type === 'comp') {
      if (e.data.play !== playing) {
        playing = e.data.play;
        drawModes();
      }
    } else if (e.type === 'chord') {
      setSegment(analysis.byBar[e.data.bar]?.[e.data.seg] ?? cur);
    } else if (e.type === 'beat') {
      const segs = analysis.byBar[e.data.bar];
      if (!segs) return;
      const segBeats = e.data.beats / segs.length;
      const seg = Math.min(segs.length - 1, Math.floor(e.data.beat / segBeats));
      setSegment(segs[seg]);
      beatInSeg = e.data.beat - seg * segBeats;
      const next = st().freeze ? null : changeAhead(analysis, shapes(), cur, beatInSeg);
      if ((next?.next ?? -1) !== (ahead?.next ?? -1) || (next?.left ?? 0) !== (ahead?.left ?? 0)) {
        ahead = next;
        markMap();
        drawShape();
      }
    } else if (e.type === 'tick') {
      const r = rhythm();
      if (r.meter[0] !== e.data.beats) return;
      const pos = (e.data.bar % r.bars) * r.meter[0] + e.data.beatInBar;
      markGrid(pos);
      tab?.setPlayhead(pos);
    } else if (e.type === 'stop') {
      markGrid(null);
      tab?.setPlayhead(null);
      rebuild();
    }
  });

  store.subscribe((s, changed) => {
    if (changed.some((k) => ['progression', 'key', 'sazbaByProgression', 'rhythmByProgression'].includes(k))) {
      rebuild();
      return;
    }
    if (changed.includes('groove')) {
      drawGrooveBtn();
      drawWiki();
    }
    if (changed.includes('viewBar') && !isRunning('groove')) {
      cur = analysis.byBar[Math.min(s.viewBar, song.bars.length - 1)][0];
      markMap();
      drawShape();
      drawRhythm();
    }
    if (changed.includes('labelMode')) {
      drawShape();
      drawModes();
    }
    if (changed.includes('compMode') || changed.includes('tab')) {
      drawModes();
      applyLevel();
    }
    if (changed.includes('wikiOpen')) {
      drawWiki();
      drawModes();
    }
  });

  rebuild();
  applyLevel();

  return { cycleSazba, cycleRhythm };
}
