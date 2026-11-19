// Generovaná impulzní odezva: stereo šum s exponenciálním doznikem a tlumenými výškami.

export function makeImpulse(ctx, seconds, decay) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      // jednopólový lowpass, který se s časem zavírá → teplý dozvuk
      const k = 0.6 - 0.45 * Math.min(1, t / seconds);
      lp += k * (Math.random() * 2 - 1 - lp);
      d[i] = lp * Math.exp(-t / decay) * (i < rate * 0.01 ? i / (rate * 0.01) : 1);
    }
  }
  return buf;
}
