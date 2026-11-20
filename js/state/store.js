// Jednoduchý pozorovatelný stav. Část se ukládá do localStorage, aby nastavení přežilo reload.

const STORAGE_KEY = 'musicbox.v1';

const PERSISTED = [
  'tab', 'key', 'progression', 'groove', 'tempo', 'chordSound', 'mix', 'countIn', 'humanize',
  'labelMode', 'posCenter', 'a4', 'tunerMode', 'metro', 'approachByProgression', 'wikiOpen',
  'sazbaByProgression', 'rhythmByProgression', 'compMode', 'soloGuitar',
];

const DEFAULTS = {
  tab: 'solo',
  key: 9, // A
  progression: 'trampMinor',
  groove: 'folk44',
  tempo: 100,
  chordSound: 'ep',
  mix: { drums: 0.9, chords: 0.7, bass: 0.8, lead: 0.8, click: 0.9 },
  countIn: true,
  humanize: true,
  labelMode: 'chord', // chord = intervaly vůči hranému akordu, names = názvy tónů, source = intervaly vůči zdroji
  approachByProgression: {},
  // doprovod: sazba a rytmus pro každé kolečko, režim (demo = kytara hraje, self = hraju sám, alt = střídání po taktech)
  sazbaByProgression: {},
  rhythmByProgression: {},
  compMode: 'demo',
  soloGuitar: false, // v Sólování doprovází kytara místo kláves
  wikiOpen: true,
  posCenter: 6.5,
  a4: 440,
  tunerMode: 'guitar',
  metro: { bpm: 80, meter: '4/4', subdiv: 1, accent: true, sound: 'click', groove: 'rock8' },
  // jen za běhu
  viewBar: 0,
  freeze: false,
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const out = {};
    PERSISTED.forEach((k) => { if (k in saved) out[k] = saved[k]; });
    if (out.mix) out.mix = { ...DEFAULTS.mix, ...out.mix };
    if (out.metro) out.metro = { ...DEFAULTS.metro, ...out.metro };
    if (!['chord', 'names', 'source'].includes(out.labelMode)) delete out.labelMode;
    if (!['demo', 'self', 'alt'].includes(out.compMode)) delete out.compMode;
    return out;
  } catch {
    return {};
  }
}

let state = { ...DEFAULTS, ...(typeof localStorage === 'undefined' ? {} : load()) };
const subscribers = new Set();
let saveTimer = null;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const out = {};
      PERSISTED.forEach((k) => { out[k] = state[k]; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      // soukromé okno apod. – nastavení se jen neuloží
    }
  }, 200);
}

export const store = {
  get: () => state,
  set(patch) {
    const changed = Object.keys(patch).filter((k) => state[k] !== patch[k]);
    if (!changed.length) return;
    state = { ...state, ...patch };
    save();
    subscribers.forEach((fn) => fn(state, changed));
  },
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
