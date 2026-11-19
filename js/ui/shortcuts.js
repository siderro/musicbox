// Klávesové zkratky. Nefungují, když je fokus v poli formuláře.

import { store } from '../state/store.js';

const TABS = ['solo', 'tuner', 'metro'];
const LABELS = ['chord', 'names', 'source'];
const cycle = (list, cur) => list[(list.indexOf(cur) + 1) % list.length];

function tapper(onBpm) {
  let taps = [];
  return () => {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 2500);
    taps.push(now);
    if (taps.length < 2) return;
    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    onBpm(Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)));
  };
}

export function installShortcuts({ actions, solo, metronome }) {
  const tapGroove = tapper((bpm) => store.set({ tempo: Math.max(40, Math.min(220, bpm)) }));

  const changeTempo = (d) => {
    const st = store.get();
    if (st.tab === 'metro') store.set({ metro: { ...st.metro, bpm: Math.max(30, Math.min(260, st.metro.bpm + d)) } });
    else store.set({ tempo: Math.max(40, Math.min(220, st.tempo + d)) });
  };

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.('select, textarea, input:not([type=range])')) return;
    // posuvníky a knoby si šipky a Home/End nechávají, ostatní zkratky fungují dál
    if (e.target.matches?.('input[type=range]') && /^(Arrow|Home|End|Page)/.test(e.key)) return;
    const st = store.get();
    const key = e.key;
    let handled = true;

    if (key === ' ') actions.toggle();
    else if (key === 'Escape') actions.stopAll();
    else if (key === 'ArrowUp') changeTempo(e.shiftKey ? 5 : 1);
    else if (key === 'ArrowDown') changeTempo(e.shiftKey ? -5 : -1);
    else if (key === '[') store.set({ key: (st.key + 11) % 12 });
    else if (key === ']') store.set({ key: (st.key + 1) % 12 });
    else if (key === 'ArrowLeft' && st.tab === 'solo') solo.stepPosition(-1);
    else if (key === 'ArrowRight' && st.tab === 'solo') solo.stepPosition(1);
    else if (key === 'l' || key === 'L') store.set({ labelMode: cycle(LABELS, st.labelMode) });
    else if ((key === 'a' || key === 'A') && st.tab === 'solo') solo.cycleApproach(e.shiftKey ? -1 : 1);
    else if (key === 'w' || key === 'W') store.set({ wikiOpen: !st.wikiOpen });
    else if (key === 'f' || key === 'F') store.set({ freeze: !st.freeze });
    else if ((key === 'p' || key === 'P') && solo.isLickSelected()) solo.toggleLick();
    else if (key === 't' || key === 'T') (st.tab === 'metro' ? metronome.tap() : tapGroove());
    else if (['1', '2', '3'].includes(key)) store.set({ tab: TABS[Number(key) - 1] });
    else handled = false;

    if (handled) e.preventDefault();
  });

  // Tlačítka a voliče po použití pustí fokus, aby mezerník dál ovládal přehrávání.
  document.addEventListener('click', (e) => e.target.closest?.('button')?.blur());
  document.addEventListener('change', (e) => { if (e.target.matches?.('select')) e.target.blur(); });
}
