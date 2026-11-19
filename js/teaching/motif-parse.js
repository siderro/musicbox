// Parser zápisu motivů (viz hlavička js/data/motifs.js).

const RE = /^(L|g|m|-|c\d+|n\d+|[+-]s\d*|[+-]c|[b#]*\d+)(['’,]?)((?:\*[b#]*\d+'?|[~hprq/\\])*):(\d*\.?\d+)([~hpq/\\]*)$/;

function tech(str) {
  const t = {};
  const bend = /\*([b#]*\d+)/.exec(str);
  if (bend) t.bendTo = bend[1];
  const rest = str.replace(/\*[b#]*\d+'?/, '');
  if (rest.includes('~')) t.vib = true;
  if (rest.includes('h')) t.leg = 'h';
  if (rest.includes('p')) t.leg = 'p';
  if (rest.includes('/')) t.slide = 'up';
  if (rest.includes('\\')) t.slide = 'down';
  if (rest.includes('r')) t.release = true;
  if (rest.includes('q')) t.curl = true;
  return t;
}

export function parseToken(raw) {
  const m = RE.exec(raw);
  if (!m) throw new Error(`Neplatný token motivu: „${raw}“`);
  const [, p, octMark, t1, dur, t2] = m;
  const tok = { raw, d: Number(dur), oct: octMark === ',' ? -1 : octMark ? 1 : 0, t: tech(`${t1 ?? ''}${t2 ?? ''}`) };
  if (p === '-') tok.kind = 'rest';
  else if (p === 'L') tok.kind = 'land';
  else if (p === 'g') tok.kind = 'guide';
  else if (p === 'm') tok.kind = 'common';
  else if (p[0] === 'c' && /\d/.test(p[1])) Object.assign(tok, { kind: 'chord', num: Number(p.slice(1)) });
  else if (p[0] === 'n') Object.assign(tok, { kind: 'next', num: Number(p.slice(1)) });
  else if (/^[+-]s/.test(p)) Object.assign(tok, { kind: 'step', steps: (p[0] === '+' ? 1 : -1) * (Number(p.slice(2)) || 1) });
  else if (/^[+-]c$/.test(p)) Object.assign(tok, { kind: 'chrom', semis: p[0] === '+' ? 1 : -1 });
  else Object.assign(tok, { kind: 'deg', deg: p });
  return tok;
}

export function parseMotif(str) {
  const parts = str.trim().split(/\s+/);
  const bar = parts.indexOf('|');
  const body = (bar < 0 ? parts : parts.slice(0, bar)).map(parseToken);
  const tail = (bar < 0 ? [] : parts.slice(bar + 1)).map(parseToken);
  const sum = (list) => list.reduce((s, t) => s + t.d, 0);
  return { body, tail, bodyBeats: sum(body), tailBeats: sum(tail) };
}

const cache = new Map();
export function parsedMotif(motif) {
  if (!cache.has(motif)) cache.set(motif, parseMotif(motif.notes));
  return cache.get(motif);
}
