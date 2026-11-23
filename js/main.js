// Start aplikace: rozvržení, záložky a propojení transportu s pohledy.

import { store } from './state/store.js';
import { T } from './i18n/cs.js';
import { h } from './ui/dom.js';
import { validateAll } from './data/validate.js';
import { PROGRESSIONS } from './data/progressions.js';
import { GROOVES } from './data/grooves.js';
import { start, stop, isRunning } from './audio/transport.js';
import { silenceAll } from './audio/engine.js';
import { createGrooveProgram } from './programs/groove-program.js';
import { createMetronomeProgram } from './programs/metronome-program.js';
import { createBar } from './ui/bar.js';
import { createSoloPanel } from './ui/solo-panel.js';
import { createCompPanel } from './ui/comp-panel.js';
import { createTunerView } from './ui/tuner-view.js';
import { createMetronomeView } from './ui/metronome-view.js';
import { installShortcuts } from './ui/shortcuts.js';

const TABS = [['solo', T.tabSolo], ['comp', T.tabComp], ['tuner', T.tabTuner], ['metro', T.tabMetro]];

// Kontrola obsahu – chyby v nově přidaných předvolbách se ukážou v konzoli.
const problems = validateAll();
if (problems.length) {
  console.warn(`Musicbox: v datech je ${problems.length} problémů:`);
  problems.forEach((p) => console.warn(' •', p));
}

// Uložený stav může odkazovat na předvolbu, která už neexistuje.
{
  const st = store.get();
  const fix = {};
  if (!PROGRESSIONS[st.progression]) fix.progression = Object.keys(PROGRESSIONS)[0];
  if (!GROOVES[st.groove]) fix.groove = Object.keys(GROOVES)[0];
  if (!TABS.some(([id]) => id === st.tab)) fix.tab = 'solo';
  if (Object.keys(fix).length) store.set(fix);
}

const groove = createGrooveProgram();
const metronomeProgram = createMetronomeProgram();

const barEl = h('header', { class: 'bar' });
const tabButtons = TABS.map(([id, label], i) => h('button', {
  class: 'nav-tab', type: 'button', role: 'tab', dataset: { tab: id },
  onclick: () => store.set({ tab: id }),
}, h('kbd', {}, i + 1), label));
const views = Object.fromEntries(TABS.map(([id]) => [id, h('section', { class: `view view-${id}`, role: 'tabpanel' })]));

const appEl = document.getElementById('app');
appEl.replaceChildren(barEl, h('main', { class: 'stage' }, Object.values(views)));

let solo;
let tuner;

const actions = {
  playGroove() {
    tuner?.stop();
    if (!isRunning('groove')) start(groove);
  },
  playMetronome() {
    tuner?.stop();
    if (!isRunning('metro')) start(metronomeProgram);
  },
  stopAll() {
    stop();
    silenceAll();
    solo?.stopLick();
  },
  rewind() {
    if (isRunning('groove')) groove.jumpTo(0);
    else store.set({ viewBar: 0 });
  },
  toggle() {
    const metroTab = store.get().tab === 'metro';
    if (isRunning(metroTab ? 'metro' : 'groove')) actions.stopAll();
    else if (metroTab) actions.playMetronome();
    else actions.playGroove();
  },
};

createBar(barEl, { nav: h('nav', { class: 'tabs', role: 'tablist' }, tabButtons), groove, actions });
solo = createSoloPanel(views.solo);
solo.setSilence(silenceAll);
const comp = createCompPanel(views.comp);
tuner = createTunerView(views.tuner, { beforeStart: () => actions.stopAll() });
const metronome = createMetronomeView(views.metro, { actions });
installShortcuts({ actions, solo, comp, metronome });

function showTab() {
  const { tab } = store.get();
  appEl.dataset.tab = tab;
  tabButtons.forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'));
  Object.entries(views).forEach(([id, el]) => { el.hidden = id !== tab; });
  if (tab !== 'tuner') tuner.stop();
}
store.subscribe((st, changed) => {
  if (!changed.includes('tab')) return;
  showTab();
  window.scrollTo(0, 0);
});
showTab();
