// Plánovač s předstihem („A Tale of Two Clocks“): worker tiká po 25 ms a program
// naplánuje všechny kroky, které spadnou do příštích 120 ms, přesně na čas AudioContextu.
// Zobrazení se synchronizuje přes frontu událostí, kterou čte requestAnimationFrame.
//
// Program = { id, reset(), step(time, emit, muted) → délka kroku v s, onStop?() }.
// Najednou běží jen jeden program (groovebox nebo metronom).

import { ensureAudio, getCtx, silenceAll } from './engine.js';

const LOOKAHEAD = 0.12;

let worker = null;
let program = null;
let nextTime = 0;
let rafId = null;
const queue = [];
const listeners = new Set();

export const onTransport = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const notify = (e) => listeners.forEach((fn) => fn(e));

function emit(time, type, data) {
  queue.push({ time, type, data, program: program?.id });
}

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./ticker.worker.js', import.meta.url));
    worker.onmessage = tick;
  }
  return worker;
}

export function start(prog) {
  const ctx = ensureAudio();
  stop();
  program = prog;
  program.reset();
  nextTime = ctx.currentTime + 0.08;
  getWorker().postMessage('start');
  tick();
  loop();
  notify({ type: 'start', program: prog.id });
}

export function stop() {
  if (!program) return;
  getWorker().postMessage('stop');
  const p = program;
  program = null;
  queue.length = 0;
  silenceAll();
  p.onStop?.();
  notify({ type: 'stop', program: p.id });
}

export const current = () => program;
export const isRunning = (id) => (id ? program?.id === id : !!program);

function tick() {
  if (!program) return;
  const ctx = getCtx();
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    // Po zaseknutí (uspaný notebook…) kroky v minulosti jen přeskočíme bez zvuku.
    const muted = nextTime < ctx.currentTime - 0.05;
    nextTime += program.step(nextTime, emit, muted);
  }
}

function loop() {
  cancelAnimationFrame(rafId);
  const frame = () => {
    const ctx = getCtx();
    const now = ctx.currentTime - (ctx.outputLatency || 0);
    while (queue.length && queue[0].time <= now) notify(queue.shift());
    rafId = program || queue.length ? requestAnimationFrame(frame) : null;
  };
  rafId = requestAnimationFrame(frame);
}
