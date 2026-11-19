// McLeod Pitch Method: normalizovaná diferenční funkce (NSDF), výběr „klíčových maxim“
// a parabolická interpolace. Proti prosté autokorelaci méně chybuje o oktávu.

export function detectPitch(buf, sampleRate, { k = 0.9, minFreq = 60, maxFreq = 1100, window = 2048 } = {}) {
  const W = Math.min(window, buf.length);
  const maxTau = Math.min(Math.floor(sampleRate / minFreq), buf.length - W);
  const minTau = Math.floor(sampleRate / maxFreq);
  if (maxTau <= minTau) return null;

  const nsdf = new Float32Array(maxTau + 1);
  for (let tau = 0; tau <= maxTau; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0; i < W; i++) {
      const a = buf[i];
      const b = buf[i + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // klíčová maxima: nejvyšší bod mezi každým kladným průchodem nulou a dalším záporným
  const peaks = [];
  let tau = 1;
  while (tau < maxTau && nsdf[tau] > 0) tau++; // přeskočit hlavní lalok kolem 0
  while (tau < maxTau) {
    while (tau < maxTau && nsdf[tau] <= 0) tau++;
    let best = tau;
    while (tau < maxTau && nsdf[tau] > 0) {
      if (nsdf[tau] > nsdf[best]) best = tau;
      tau++;
    }
    if (best < maxTau && best >= minTau) peaks.push(best);
  }
  if (!peaks.length) return null;

  const highest = Math.max(...peaks.map((p) => nsdf[p]));
  if (highest < 0.5) return null;
  const chosen = peaks.find((p) => nsdf[p] >= k * highest);

  const y0 = nsdf[chosen - 1];
  const y1 = nsdf[chosen];
  const y2 = nsdf[chosen + 1];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  return { freq: sampleRate / (chosen + shift), clarity: y1 };
}

export const rms = (buf) => Math.sqrt(buf.reduce((s, x) => s + x * x, 0) / buf.length);
