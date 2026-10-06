// Section 30 hooks. Real paper/pencil samples drop in later; for now a very soft synthesized tick.
let ctx;
const CUES = { shuffle: [180, .05], tap: [320, .03], pencil: [900, .04], stop: [0, 0], chime: [660, .6] };
export function sfx(name) {
  const [f, d] = CUES[name] || [0, 0];
  if (!f) return;
  try {
    ctx ||= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f; o.type = name === 'chime' ? 'sine' : 'triangle';
    g.gain.setValueAtTime(.015, ctx.currentTime); g.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + d);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
  } catch {}
}
