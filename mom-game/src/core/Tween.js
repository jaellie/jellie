// Tiny tween runner driven by the game loop (pauses with the game, no timers drifting).
export const ease = {
  linear: (t) => t,
  inOut: (t) => t * t * (3 - 2 * t),
  out: (t) => 1 - (1 - t) * (1 - t),
  back: (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

export class Tweens {
  constructor() { this.list = []; }
  add(duration, fn, e = ease.inOut) {
    return new Promise((resolve) => this.list.push({ t: 0, d: Math.max(0.0001, duration), fn, e, resolve }));
  }
  wait(sec) { return this.add(sec, () => {}); }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const tw = this.list[i];
      tw.t += dt;
      const u = Math.min(1, tw.t / tw.d);
      try { tw.fn(tw.e(u), u); } catch (err) { console.error(err); }
      if (u >= 1) { this.list.splice(i, 1); tw.resolve(); }
    }
  }
  clear() { this.list.forEach((t) => t.resolve()); this.list = []; }
}
