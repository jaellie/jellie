// @ts-nocheck — web/flat.js and web/flat-walk.js are plain browser scripts that attach to globalThis.
import { describe, it, expect, beforeAll } from "vitest";

/** A canvas context stand-in that records the size of every shape drawn (position and rotation are ignored). */
function recorder() {
  const shapes: string[] = [];
  let scaleCalls = 0;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  const cx: any = {
    shapes,
    get scaleCalls() { return scaleCalls; },
    save() {}, restore() {}, translate() {}, rotate() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, fill() {}, stroke() {}, fillRect() {}, clearRect() {}, setTransform() {}, drawImage() {},
    rect() {}, scale() { scaleCalls++; },
    arc(_x: number, _y: number, rad: number) { shapes.push("arc:" + r(rad)); },
    ellipse(_x: number, _y: number, rx: number, ry: number) { shapes.push("ell:" + r(rx) + "x" + r(ry)); },
    roundRect(_x: number, _y: number, w: number, h: number) { shapes.push("rr:" + r(w) + "x" + r(h)); },
    createLinearGradient() { return { addColorStop() {} }; },
  };
  return cx;
}

const LEAFC = { SUMMER: ["#79bd93", "#5ca67a"], SPRING: ["#ffcdd8", "#f2a5b8"], AUTUMN: ["#f4b469", "#e07a52"], WINTER: ["#f4f6ff", "#cfd7ee"] };
const G = { VX: 90, HZ: 104, RB: 207, RK: 6, RW: 180, RH: 311, theme: "town", season: "SUMMER", landmark: null };
const env = (t: number) => ({ c: { winter: 0, dark: 0, cloud: 0 }, bd: { season: "SUMMER" }, TRS: null, lit: false, glows: [], LEAFC, t, tint: (v: string) => v });

let Flat: any;
beforeAll(async () => {
  await import("../web/flat.js");
  await import("../web/flat-walk.js");
  Flat = (globalThis as any).Flat;
});

describe("fixed-scene walking (Mode B)", () => {
  it("has three scenes with fixed items and Mode B as the default", () => {
    expect(Flat.mode).toBe("B");
    expect(Flat.walk.SCENES.map((s: any) => s.id)).toEqual(["village-entrance", "tree-lined-road", "residential"]);
    for (const s of Flat.walk.SCENES) expect(s.items.length).toBeGreaterThan(10);
  });

  it("draws every scene with exactly the same shape sizes at any time of the walk", () => {
    for (const scene of Flat.walk.SCENES) {
      const sizes = (t: number) => { const c = recorder(); Flat.walk.drawScene(c, scene, env(t), G); return c.shapes.slice().sort(); };
      const first = sizes(0);
      expect(first.length).toBeGreaterThan(50);
      for (const t of [0.7, 3.1, 5.9, 9.4, 40]) expect(sizes(t)).toEqual(first);
    }
  });

  it("never scales environmental objects (swaying is rotation only)", () => {
    for (const scene of Flat.walk.SCENES) { const c = recorder(); Flat.walk.drawScene(c, scene, env(2.5), G); expect(c.scaleCalls).toBe(0); }
  });

  it("keeps object sizes constant through the crossfade", () => {
    const R: any = {}; const sizes = (idx: number) => { const c = recorder(); Flat.walk.drawScene(c, Flat.walk.SCENES[idx], env(1), G); return c.shapes.slice().sort(); };
    const before = [sizes(0), sizes(1)];
    const { segmentSeconds, fadeSeconds } = Flat.walk.CONFIG;
    // step through the fade; the scenes must still draw identical shapes (alpha is the only thing that changes)
    let sawFade = false;
    for (let t = 0; t < segmentSeconds + 1; t += 0.25) {
      const P = Flat.walk.progress(R, 0.25, true);
      if (P.k > 0 && P.k < 1) sawFade = true;
      expect([sizes(0), sizes(1)]).toEqual(before);
    }
    expect(sawFade).toBe(true);
    expect(fadeSeconds).toBeLessThan(segmentSeconds);
  });

  it("progresses deterministically and only while walking", () => {
    const R: any = {}; const { segmentSeconds: T } = Flat.walk.CONFIG;
    Flat.walk.progress(R, 5, false); expect(R.seg.i).toBe(0); expect(R.seg.t).toBe(0);
    Flat.walk.progress(R, T - 0.1, true); expect(R.seg.i).toBe(0);
    Flat.walk.progress(R, 0.2, true); expect(R.seg.i).toBe(1);
    Flat.walk.progress(R, T, true); expect(R.seg.i).toBe(2);
    Flat.walk.progress(R, T, true); expect(R.seg.i).toBe(0); // loops
  });

  it("crossfade progress rises smoothly from 0 to 1 and never jumps", () => {
    const R: any = {}; const { segmentSeconds: T, fadeSeconds: F } = Flat.walk.CONFIG; let last = 0;
    Flat.walk.progress(R, T - F - 0.01, true);
    for (let i = 0; i < 100; i++) { const P = Flat.walk.progress(R, F / 100, true); if (R.seg.i !== 0) break; expect(P.k - last).toBeLessThan(0.08); last = P.k; }
    expect(last).toBeGreaterThan(0.9);
  });

  it("walks in place: the character keeps its size and spot, only limbs and a small bob move", () => {
    const look = { v: 2, g: "F", skin: 0, hc: 0, hair: "long", outfit: 0, pal: 0, body: 1 };
    const record = (ph: number) => {
      const c = recorder(); const ys: number[] = []; const xs: number[] = [];
      c.translate = (x: number, y: number) => { xs.push(x); ys.push(y); };
      Flat.char(c, 90, 299, 40, look, 25, ph, true, "me");
      return { sizes: c.shapes.slice().sort(), xs, ys };
    };
    const base = record(0);
    for (const ph of [0.3, 0.77, 1.5, 2.9, 7.1]) {
      const r = record(ph);
      expect(r.sizes).toEqual(base.sizes);          // same size every frame
      expect(r.xs[0]).toBe(90);                      // same horizontal spot
      expect(Math.abs(r.ys[0] - 299)).toBe(0);       // anchored at the same ground line
      expect(Math.abs(r.ys[1] - base.ys[1])).toBeLessThan(2.5); // bob stays small
    }
  });
});
