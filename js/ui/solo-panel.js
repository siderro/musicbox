// Sólování: přístup (jak do kolečka sólovat) → 1–3 pruhy (hmatníky pod sebou), mapa kolečka
// a wiki ke kolečku vpravo. Tečky v pruzích stojí; mění se jen to, který pruh svítí.
// Nic se nepřekresluje na každou dobu – jen při změně akordu, přístupu, tóniny nebo okna ruky.

import { h, selectBox } from './dom.js';
import { T } from '../i18n/cs.js';
import { store } from '../state/store.js';
import { APPROACHES } from '../data/approaches.js';
import { PROGRESSION_WIKI } from '../data/wiki.js';
import { LICKS } from '../data/licks.js';
import { buildSong } from '../programs/song.js';
import { analyzeSong } from '../theory/function.js';
import { intervalLabel, spellIntervals } from '../theory/intervals.js';
import { SCALES } from '../data/scales.js';
import { notesOnNeck, MAX_FRET } from '../fretboard/neck.js';
import { createFretboard } from '../fretboard/render-fretboard.js';
import { renderTab } from '../fretboard/render-tab.js';
import { handWindow } from '../teaching/fingering.js';
import { changeTargets } from '../teaching/plan.js';
import { applicableApproaches, resolveApproach, switchAhead, chordInterval, chordView, fillTokens } from '../teaching/approach.js';
import { onTransport, isRunning, current } from '../audio/transport.js';
import { licksFor, startOptions, realizeLick } from '../teaching/lick-plan.js';
import { playLick } from '../programs/lick-player.js';
import { getCtx } from '../audio/engine.js';

const MAX_BUTTONS = 5;
const pretty = (iv) => iv.replace(/b/g, '♭').replace(/#/g, '♯');

export function createSoloPanel(root, { groove }) {
  const wikiBtn = h('button', { type: 'button', class: 'wiki-toggle', onclick: () => store.set({ wikiOpen: !store.get().wikiOpen }) });
  const approachBar = h('div', { class: 'approach-bar', role: 'radiogroup', 'aria-label': T.approach });
  const mapStrip = h('div', { class: 'map-strip' });
  const lanesBox = h('div', { class: 'lanes' });
  const hint = h('div', { class: 'lane-hint' });
  const winLabel = h('output', { class: 'win-label' });
  const labelBtn = h('button', { type: 'button', class: 'ctl', onclick: () => cycleLabels() });
  // doprovod pod sólem: klávesy grooveboxu, nebo kytara v sazbě a rytmu ze záložky Doprovod
  const compKeysBtn = h('button', { type: 'button', class: 'ctl', 'aria-pressed': 'false', onclick: () => store.set({ soloGuitar: false }) }, T.soloCompKeys);
  const compGuitarBtn = h('button', { type: 'button', class: 'ctl', 'aria-pressed': 'false', onclick: () => store.set({ soloGuitar: true }) }, T.soloCompGuitar);
  const compSwitch = h('div', { class: 'ctl-group ctl-switch', title: T.soloCompTip },
    h('span', { class: 'ctl-label' }, T.soloComp), compKeysBtn, compGuitarBtn);
  const markCompSwitch = () => {
    compKeysBtn.setAttribute('aria-pressed', store.get().soloGuitar ? 'false' : 'true');
    compGuitarBtn.setAttribute('aria-pressed', store.get().soloGuitar ? 'true' : 'false');
  };
  const wikiBox = h('aside', { class: 'wiki', 'aria-label': T.wikiTitle });
  const cycleBox = h('div', { class: 'cycle-licks' });

  // dok s lickem pod pruhy: tabulatura, kde lick zazní, přehrávání
  const tabBox = h('div', { class: 'tab-scroll' });
  const lickBtn = h('button', { type: 'button', class: 'play-lick', onclick: () => toggleLick() });
  const lickTitle = h('b', { class: 'lick-title' });
  const lickWhere = h('span', { class: 'lick-where' });
  const lickShifts = h('span', { class: 'lick-shifts' });
  const lickTip = h('p', { class: 'lick-tip' });
  const lickClose = h('button', { type: 'button', class: 'lick-close', title: T.closeLick, onclick: () => closeLick() }, '×');
  const lickArea = h('section', { class: 'lick-dock', hidden: true },
    h('div', { class: 'lick-head' }, lickBtn, lickTitle, lickWhere, lickShifts, lickClose), lickTip, tabBox);

  const main = h('div', { class: 'solo-main' },
    h('div', { class: 'approach-row' },
      h('span', { class: 'approach-label' }, T.approach), approachBar,
      h('div', { class: 'solo-tools' },
        h('div', { class: 'ctl-group' },
          h('button', { type: 'button', class: 'ctl', title: T.prevPos, onclick: () => stepPosition(-1) }, '←'),
          winLabel,
          h('button', { type: 'button', class: 'ctl', title: T.nextPos, onclick: () => stepPosition(1) }, '→')),
        compSwitch,
        h('div', { class: 'ctl-group' }, labelBtn),
        wikiBtn)),
    mapStrip,
    lanesBox,
    hint,
    cycleBox,
    lickArea);
  root.append(main, wikiBox);

  let song = null;
  let analysis = null;
  let list = [];
  let res = null;
  let lanes = []; // { el, caption, badge, src, fb }
  let cur = 0; // aktuální segment
  let beatInSeg = 0;
  let ahead = null;
  let lick = null; // { id, lane, shift, def, plan, tab, playback, raf, at }
  let songKey = '';

  const st = () => store.get();
  const approachId = () => {
    const saved = st().approachByProgression[st().progression];
    return list.includes(saved) ? saved : list[0];
  };
  const setApproach = (id) => store.set({ approachByProgression: { ...st().approachByProgression, [st().progression]: id } });

  // ---------- sestavení ----------
  function rebuild() {
    song = buildSong(st());
    analysis = analyzeSong(song);
    const wikiOrder = PROGRESSION_WIKI[st().progression]?.approaches;
    const applicable = applicableApproaches(song, analysis);
    list = wikiOrder ? [...wikiOrder.filter((id) => applicable.includes(id)), ...applicable.filter((id) => !wikiOrder.includes(id))] : applicable;
    res = resolveApproach(approachId(), song, analysis);
    const k = `${st().progression}|${st().key}|${approachId()}`;
    if (k !== songKey) closeLick();
    songKey = k;
    if (!isRunning('groove')) {
      cur = analysis.byBar[Math.min(st().viewBar, song.bars.length - 1)][0];
      beatInSeg = 0;
      ahead = null;
    }
    cur = Math.min(cur, analysis.segments.length - 1);
    drawApproachBar();
    buildLanes();
    drawMap();
    drawLanes();
    drawHint();
    drawCycleLicks();
    drawWiki();
  }

  // ---------- lišta přístupů ----------
  // konkrétní jméno: „Em ↔ Dm“ místo obecného „Tónika ↔ napětí“
  function shortName(id) {
    if (id === 'tdPent' || id === 'tsdPent') {
      const r = resolveApproach(id, song, analysis);
      const names = r.lanes.filter((l) => l.kind === 'fixed' && !l.perChord).map((l) => l.source.label.split(' ')[0]);
      return names.join(id === 'tdPent' ? ' ↔ ' : ' · ');
    }
    if (id === 'triadPair') {
      const r = resolveApproach(id, song, analysis);
      return r.lanes.filter((l) => l.kind === 'fixed').map((l) => l.source.label.replace(/ /g, '')).join(' ↔ ');
    }
    if (id === 'keyPent' || id === 'keyScale') return resolveApproach(id, song, analysis).lanes[0].source.label;
    return APPROACHES[id].name;
  }

  function drawApproachBar() {
    const active = approachId();
    const shown = list.slice(0, MAX_BUTTONS);
    if (!shown.includes(active)) shown[MAX_BUTTONS - 1] = active;
    const rest = list.filter((id) => !shown.includes(id));
    approachBar.replaceChildren(
      ...shown.map((id) => h('button', {
        type: 'button', role: 'radio', class: 'approach-btn', 'aria-checked': id === active ? 'true' : 'false',
        title: APPROACHES[id].name, onclick: () => setApproach(id),
      }, shortName(id), h('i', { class: `lvl lvl-${APPROACHES[id].level}` }))),
      ...(rest.length ? [selectBox([['', T.moreApproaches], ...rest.map((id) => [id, APPROACHES[id].name])], '', (v) => v && setApproach(v), { class: 'approach-more', 'aria-label': T.moreApproaches })] : []));
  }

  function cycleApproach(dir) {
    const i = list.indexOf(approachId());
    setApproach(list[(i + dir + list.length) % list.length]);
  }

  // ---------- mapa kolečka ----------
  function drawMap() {
    mapStrip.replaceChildren(...analysis.segments.map((sg, i) => {
      const lane = res.lanes[res.laneOf[i]];
      const src = res.sourceAt(res.laneOf[i], i);
      return h('button', {
        type: 'button', class: `map-cell${i === cur ? ' is-current' : ''}`, style: `--lane:${lane.color}`,
        // za běhu skočí groove na takt, jinak se jen ukáže
        onclick: () => (isRunning('groove') ? groove.jumpTo(sg.bar) : store.set({ viewBar: sg.bar })),
      },
      h('b', {}, sg.chord.symbol),
      h('span', {}, src.label.split(' ')[0]),
      h('small', {}, T.fn[sg.fn.fn]));
    }));
    // do 12 taktů jedna řada, jinak dvě
    const n = analysis.segments.length;
    mapStrip.style.setProperty('--cols', n > 12 ? Math.ceil(n / 2) : n);
  }

  function markMap() {
    [...mapStrip.children].forEach((c, i) => c.classList.toggle('is-current', i === cur));
  }

  // ---------- pruhy ----------
  function buildLanes() {
    lanesBox.replaceChildren();
    lanes = res.lanes.map((lane) => {
      const caption = h('span', { class: 'lane-caption' });
      const badge = h('span', { class: 'lane-badge' });
      const src = h('span', { class: 'lane-src' });
      const fbBox = h('div', { class: 'lane-fb' });
      const laneIdx = res.lanes.indexOf(lane);
      const chips = h('span', { class: 'lane-licks' }, licksFor(res, laneIdx).slice(0, 3).map((id) => lickChip(id, laneIdx)));
      const el = h('section', { class: 'lane', style: `--lane:${lane.color}` },
        h('header', { class: 'lane-head' }, h('b', { class: 'lane-name' }, lane.name), src, caption, badge, chips),
        fbBox);
      lanesBox.append(el);
      return { el, caption, badge, src, fb: createFretboard(fbBox, { compact: res.lanes.length > 1 }) };
    });
    lanesBox.dataset.count = res.lanes.length;
  }

  // segment, podle kterého se pruh popisuje: aktivní = teď, příští = další akord, jinak nejbližší jeho akord
  function refSeg(i) {
    if (res.laneOf[cur] === i) return cur;
    if (ahead && ahead.nextLane === i) return ahead.nextSeg;
    for (let k = 1; k <= analysis.segments.length; k++) {
      const j = (cur + k) % analysis.segments.length;
      if (res.laneOf[j] === i) return j;
    }
    return res.homeSeg[i];
  }

  function laneState(i) {
    if (res.laneOf[cur] === i) return 'active';
    if (ahead && ahead.nextLane === i) return 'next';
    return 'idle';
  }

  function drawLane(i) {
    const lane = res.lanes[i];
    const view = lanes[i];
    const seg = refSeg(i);
    const chord = analysis.segments[seg].chord;
    const src = res.sourceAt(i, seg);
    const win = handWindow(st().posCenter ?? 6.5);
    const mode = st().labelMode;
    const chordPcs = new Set(chord.tones.map((t) => t.pc));
    const byPc = new Map(src.tones.map((t) => [t.pc, t]));
    const dots = [];
    if (lane.bg) {
      for (const n of notesOnNeck(lane.bg.pcs, 0, MAX_FRET)) {
        if (!byPc.has(n.pc)) dots.push({ s: n.s, f: n.f, cls: 'scale', dim: true, label: '' });
      }
    }
    for (const n of notesOnNeck(src.pcs, 0, MAX_FRET)) {
      const tone = byPc.get(n.pc);
      const label = mode === 'names' ? tone.name : mode === 'source' ? intervalLabel(tone.interval) : pretty(chordInterval(chord, tone.note));
      dots.push({ s: n.s, f: n.f, cls: n.pc === src.rootPc ? 'src-root' : 'src', dim: n.f < win.lo || n.f > win.hi, chord: chordPcs.has(n.pc), label });
    }
    view.fb.render(dots, [win.lo, win.hi]);
    view.src.textContent = src.label;
    const over = [...chordView(src, chord).values()].map(pretty).join(' ');
    view.caption.textContent = `${laneState(i) === 'active' ? T.laneNow(chord.symbol) : T.laneOver(chord.symbol)} = ${over}`;
  }

  function drawLanes() {
    res.lanes.forEach((_, i) => drawLane(i));
    markLanes();
  }

  function markLanes() {
    lanes.forEach((v, i) => {
      const state = laneState(i);
      v.el.classList.toggle('is-active', state === 'active');
      v.el.classList.toggle('is-next', state === 'next');
      v.el.classList.toggle('is-idle', state === 'idle');
      v.badge.textContent = state === 'next' && ahead ? T.laneIn(ahead.left) : '';
    });
    const win = handWindow(st().posCenter ?? 6.5);
    winLabel.textContent = `${T.window} ${win.lo}.–${win.hi}.`;
    labelBtn.textContent = T.labelModes[st().labelMode] ?? T.labelModes.chord;
    wikiBtn.textContent = `${st().wikiOpen ? T.wikiHide : T.wikiShow} (W)`;
    wikiBtn.setAttribute('aria-pressed', st().wikiOpen ? 'true' : 'false');
  }

  function drawHint() {
    let bridge = '';
    if (ahead) {
      const a = analysis.segments[cur].chord;
      const b = analysis.segments[ahead.nextSeg].chord;
      const ch = changeTargets(a, b, 'guide', res.scale, handWindow(st().posCenter ?? 6.5), null);
      if (ch.cue?.key === 'resolve') bridge = T.bridge(ch.cue.from, ch.cue.note, ch.cue.num, ch.cue.chord);
    }
    hint.replaceChildren(
      h('span', { class: 'lane-bridge' }, bridge),
      h('span', { class: 'legend' },
        h('span', { class: 'legend-item is-src-root' }, h('i'), T.legendSrcRoot),
        h('span', { class: 'legend-item is-src' }, h('i'), T.legendSrc),
        h('span', { class: 'legend-item is-chord' }, h('i'), T.legendChordTone),
        h('span', { class: 'legend-item is-window' }, h('i'), T.legendWindow)));
  }

  // ---------- licky: každý patří k pruhu a hraje se přes jeho akord ----------
  const actionsRef = { silence: () => {} };

  function lickChip(id, lane) {
    const def = LICKS[id];
    return h('button', {
      type: 'button', class: 'lick-chip', dataset: { lick: id, lane: String(lane) },
      title: def.name, onclick: () => (lick?.id === id && lick.lane === lane ? toggleLick() : openLick(id, lane)),
    }, `▶ ${def.short ?? def.name}`);
  }

  function drawCycleLicks() {
    const ids = licksFor(res, 'cycle');
    cycleBox.hidden = !ids.length;
    cycleBox.replaceChildren(h('span', { class: 'approach-label' }, T.cycleLicks), ...ids.map((id) => lickChip(id, 'cycle')));
    markChips();
  }

  function markChips() {
    root.querySelectorAll('.lick-chip').forEach((b) => {
      const on = lick && b.dataset.lick === lick.id && b.dataset.lane === String(lick.lane);
      b.classList.toggle('is-on', !!on);
      b.classList.toggle('is-playing', !!(on && lick.playback));
    });
  }

  // Symetrický lick (zmenšená, celotónová) jde posunout o malou tercii / celý tón a zní pořád „správně“.
  function shifted(resolved, semis) {
    if (!semis) return resolved;
    const max = Math.max(...resolved.events.flatMap((e) => e.notes.map((n) => n.f)));
    const by = max + semis > MAX_FRET + 2 ? semis - 12 : semis;
    return { ...resolved, events: resolved.events.map((e) => ({ ...e, notes: e.notes.map((n) => ({ ...n, f: n.f + by, midi: n.midi + by })) })) };
  }

  // Kde lick zazní: nejbližší vhodný akord (přes běžící groove podle času, jinak od zobrazeného taktu).
  function planLick() {
    const opts = startOptions(lick.id, res, lick.lane, cur);
    if (!opts.length) return null;
    const bpb = analysis.beatsPerBar;
    const groove = isRunning('groove') ? current() : null;
    let pick = { ...opts[0], at: null };
    if (groove?.timeOf) {
      let best = null;
      for (const o of opts) {
        const P = analysis.segments[o.seg].start + o.offset;
        const barAbs = Math.floor(P / bpb);
        const { t } = groove.timeOf(((barAbs % song.bars.length) + song.bars.length) % song.bars.length, P - barAbs * bpb);
        if (!best || t < best.at) best = { ...o, at: t };
      }
      pick = best;
    }
    const win = handWindow(st().posCenter ?? 6.5);
    const r = realizeLick(lick.id, res, lick.lane, pick.seg, win);
    return { ...r, ...shifted(r, lick.shift), at: pick.at };
  }

  function renderLick() {
    const plan = lick.plan;
    const segs = analysis.segments;
    const bpb = analysis.beatsPerBar;
    const P = segs[plan.startSeg].start + plan.offset;
    // akordy nad tabulaturou
    const marks = [];
    let pos = -plan.offset;
    for (let k = plan.startSeg; pos < plan.beats; k = (k + 1) % segs.length) {
      marks.push({ beat: Math.max(0, pos), label: segs[k].chord.symbol });
      pos += segs[k].beats;
    }
    lick.tab = renderTab(tabBox, plan, { beatsPerBar: bpb, startBeat: ((P % bpb) + bpb) % bpb, marks });
    const from = segs[plan.startSeg].chord.symbol;
    const land = plan.landSeg != null ? ` → ${segs[plan.landSeg].chord.symbol}` : '';
    const running = isRunning('groove');
    lickWhere.textContent = lick.lane === 'cycle'
      ? (running ? T.lickCycle : T.lickCycleAlone)
      : (running ? T.lickOver : T.lickAlone)(`${from}${land}`, segs[plan.startSeg].bar + 1);
  }

  function stopLickPlayhead() {
    if (!lick) return;
    cancelAnimationFrame(lick.raf);
    lick.playback = null;
    lick.tab?.setPlayhead(null);
    lanes.forEach((v) => v.fb.pulse(null));
    lickBtn.replaceChildren('▶ ', T.playLick);
    markChips();
  }

  function toggleLick() {
    if (!lick) return;
    if (lick.playback) {
      actionsRef.silence();
      stopLickPlayhead();
      return;
    }
    lick.plan = planLick();
    if (!lick.plan) return;
    renderLick();
    lick.playback = playLick(lick.def, lick.plan, lick.plan.at);
    lickBtn.replaceChildren('■ ', T.stopLick);
    markChips();
    let lastEv = null;
    const frame = () => {
      const ctx = getCtx();
      const t = ctx.currentTime - (ctx.outputLatency || 0);
      const beat = (t - lick.playback.start) / lick.playback.beatDur;
      if (beat > lick.playback.beats + 0.5) {
        stopLickPlayhead();
        return;
      }
      lick.tab.setPlayhead(beat >= 0 ? beat : null);
      const ev = lick.plan.events.find((e) => !e.rest && beat >= e.start && beat < e.start + e.d);
      if (ev !== lastEv) {
        lastEv = ev;
        // tón licku blikne v pruhu, přes jehož akord zrovna zní
        const laneNow = ev ? res.laneOf[ev.seg] : -1;
        lanes.forEach((v, i) => v.fb.pulse(i === laneNow && ev ? ev.notes[0].s : null, ev?.notes[0].f));
        if (ev) {
          const x = 48 + ev.start * 92;
          if (x < tabBox.scrollLeft + 40 || x > tabBox.scrollLeft + tabBox.clientWidth - 80) tabBox.scrollLeft = x - 60;
        }
      }
      lick.raf = requestAnimationFrame(frame);
    };
    lick.raf = requestAnimationFrame(frame);
  }

  function openLick(id, lane, shift = 0) {
    stopLickPlayhead();
    const def = LICKS[id];
    lick = { id, lane, shift, def };
    lickTitle.textContent = def.name;
    lickTip.textContent = fillTokens(def.tip ?? '', song, res);
    lickShifts.replaceChildren(...(def.symmetric
      ? [0, 1, 2, 3].map((k) => h('button', {
        type: 'button', class: `lick-shift${k * def.symmetric === shift ? ' is-on' : ''}`, onclick: () => openLick(id, lane, k * def.symmetric),
      }, k ? `+${k * def.symmetric}` : '0'))
      : []));
    lickArea.hidden = false;
    lickArea.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    lickArea.style.setProperty('--lane', lane === 'cycle' ? 'var(--text)' : res.lanes[lane].color);
    toggleLick();
  }

  function closeLick() {
    if (!lick) return;
    if (lick.playback) actionsRef.silence();
    stopLickPlayhead();
    lick = null;
    lickArea.hidden = true;
    markChips();
  }

  // ---------- wiki ----------
  const para = (text) => h('p', { html: text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') });

  function drawWiki() {
    root.classList.toggle('has-wiki', st().wikiOpen);
    wikiBox.hidden = !st().wikiOpen;
    if (!st().wikiOpen) return;
    const page = PROGRESSION_WIKI[st().progression] ?? {};
    const fill = (s, r) => fillTokens(s, song, r);
    const active = approachId();
    const firstOfDegree = analysis.segments.filter((sg, i, arr) => arr.findIndex((x) => x.chord.degree === sg.chord.degree) === i);
    const rows = firstOfDegree.map((sg) => {
      const lane = res.lanes[res.laneOf[sg.index]];
      const src = res.sourceAt(res.laneOf[sg.index], sg.index);
      const fn = sg.fn.kind !== 'diatonic' && T.fnKind[sg.fn.kind] ? `${T.fn[sg.fn.fn]} · ${T.fnKind[sg.fn.kind]}` : T.fn[sg.fn.fn];
      return h('tr', {},
        h('td', {}, h('b', {}, sg.chord.symbol)),
        h('td', {}, fn),
        h('td', {}, h('span', { class: 'wiki-lane', style: `--lane:${lane.color}` }), src.label.split(' · ')[0]),
        h('td', {}, [...chordView(src, sg.chord).values()].map(pretty).join(' ')));
    });
    const cards = list.map((id) => {
      const a = APPROACHES[id];
      const r = id === active ? res : resolveApproach(id, song, analysis);
      const tries = [...(page.try?.[id] ?? []), ...(a.try ?? [])];
      const lickRows = [...r.lanes.map((l, i) => [i, l]), ['cycle', null]].flatMap(([lane, l]) => licksFor(r, lane).map((lid) => h('li', { class: 'wiki-lick-row' },
        h('button', {
          type: 'button', class: 'wiki-lick', style: l ? `--lane:${l.color}` : '',
          onclick: () => {
            if (id !== approachId()) setApproach(id);
            openLick(lid, lane);
          },
        }, `▶ ${LICKS[lid].name}`),
        h('span', { class: 'wiki-lick-lane' }, l ? `${l.name}${l.kind === 'fixed' ? ` · ${l.source.label.split(' · ')[0]}` : ''}` : T.cycleLicks),
        h('small', {}, fillTokens(LICKS[lid].tip ?? '', song, r)))));
      return h('article', { class: `wiki-card${id === active ? ' is-active' : ''}`, dataset: { id } },
        h('header', {},
          h('h3', {}, a.name, h('i', { class: `lvl lvl-${a.level}` })),
          id === active
            ? h('span', { class: 'wiki-active' }, T.activeApproach)
            : h('button', { type: 'button', class: 'wiki-try', onclick: () => setApproach(id) }, `▶ ${T.tryButton}`)),
        h('div', { class: 'wiki-lanes' }, r.lanes.map((l) => h('span', { class: 'wiki-chip', style: `--lane:${l.color}` }, `${l.name}: ${l.kind === 'fixed' ? l.source.label.split(' · ')[0] : T.laneFollow}`))),
        h('h4', {}, T.why),
        para(fill(a.why, r)),
        page.notes?.[id] ? para(fill(page.notes[id], r)) : null,
        tries.length ? h('h4', {}, T.tryIt) : null,
        tries.length ? h('ul', {}, tries.map((t) => h('li', {}, fill(t, r)))) : null,
        lickRows.length ? h('h4', {}, T.licks) : null,
        lickRows.length ? h('ul', { class: 'wiki-licks' }, lickRows) : null);
    });
    wikiBox.replaceChildren(
      h('h2', {}, T.wikiTitle),
      h('section', { class: 'wiki-intro' },
        h('h3', {}, T.wikiFeel),
        page.feel ? para(fill(page.feel, res)) : null,
        h('h4', {}, `${T.wikiAnalysis} · ${APPROACHES[active].name}`),
        h('table', { class: 'wiki-table' }, h('thead', {}, h('tr', {}, T.wikiCols.map((c) => h('th', {}, c)))), h('tbody', {}, rows))),
      h('h3', {}, T.wikiApproaches),
      ...cards,
      drawCatalog());
  }

  // obecný katalog stupnic od tóniky kolečka
  function drawCatalog() {
    const tonic = song.tonic;
    return h('section', { class: 'wiki-catalog' },
      h('h3', {}, T.catalog),
      h('p', { class: 'wiki-sub' }, T.catalogFrom(spellIntervals(tonic, ['1'])[0].name)),
      h('dl', {}, Object.values(SCALES).flatMap((sc) => [
        h('dt', {}, h('b', {}, sc.name), h('span', {}, spellIntervals(tonic, sc.intervals).map((t) => t.name).join(' ')), h('small', {}, sc.intervals.map(pretty).join(' '))),
        h('dd', {}, sc.use ?? ''),
      ])));
  }

  // ---------- ovládání ----------
  function stepPosition(dir) {
    const c = st().posCenter ?? 6.5;
    store.set({ posCenter: Math.max(2.5, Math.min(MAX_FRET - 2.5, c + dir * 2)) });
  }

  function cycleLabels() {
    const order = ['chord', 'names', 'source'];
    store.set({ labelMode: order[(order.indexOf(st().labelMode) + 1) % order.length] });
  }

  // ---------- živé události ----------
  function setSegment(i) {
    if (i === cur) return;
    cur = i;
    beatInSeg = 0;
    ahead = null;
    markMap();
    drawLanes();
    drawHint();
  }

  onTransport((e) => {
    if (e.program && e.program !== 'groove') return;
    if (!res) return;
    if (e.type === 'chord') {
      setSegment(analysis.byBar[e.data.bar]?.[e.data.seg] ?? cur);
    } else if (e.type === 'beat') {
      // aktuální takt bereme z dob – opakovaný akord (Am Am) chord událost nepošle znovu
      const segs = analysis.byBar[e.data.bar];
      if (!segs) return;
      const segBeats = e.data.beats / segs.length;
      const seg = Math.min(segs.length - 1, Math.floor(e.data.beat / segBeats));
      setSegment(segs[seg]);
      beatInSeg = e.data.beat - seg * segBeats;
      const next = st().freeze ? null : switchAhead(res, cur, beatInSeg);
      const laneChanged = (next?.nextLane ?? -1) !== (ahead?.nextLane ?? -1);
      const changed = laneChanged || (next?.left ?? 0) !== (ahead?.left ?? 0);
      ahead = next;
      if (laneChanged && ahead) drawLane(ahead.nextLane);
      if (changed) {
        markLanes();
        drawHint();
      }
    } else if (e.type === 'stop') {
      rebuild();
    }
  });

  store.subscribe((s, changed) => {
    if (changed.includes('soloGuitar')) markCompSwitch();
    if (changed.some((k) => ['progression', 'key', 'approachByProgression', 'groove'].includes(k))) {
      rebuild();
      return;
    }
    if (changed.includes('viewBar') && !isRunning('groove')) {
      cur = analysis.byBar[Math.min(s.viewBar, song.bars.length - 1)][0];
      markMap();
      drawLanes();
      drawHint();
    }
    if (changed.some((k) => ['posCenter', 'labelMode'].includes(k))) {
      drawLanes();
      drawHint();
    }
    if (changed.includes('wikiOpen')) {
      drawWiki();
      drawLanes();
    }
  });

  rebuild();
  markCompSwitch();

  return {
    stepPosition,
    cycleApproach,
    toggleLick,
    stopLick: stopLickPlayhead,
    setSilence(fn) {
      actionsRef.silence = fn;
    },
    isLickSelected: () => !!lick,
    closeLick,
  };
}
