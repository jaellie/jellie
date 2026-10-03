/**
 * The stage: how a place sits on a portrait phone screen, Kairosoft style — the two back walls across
 * the top, the floor running all the way down to the bottom edge, everyone walking tile by tile on an
 * isometric grid. The engine owns this geometry so the UI can't get it wrong: every character comes with
 * a ready position (x, y = fractions of the reference box, feet), and `stageInfo()` tells the painter
 * where the walls meet the floor.
 *
 * Grid → screen (reference box 360 × 642, the play area under the HUD and the log line):
 *   x = 180 + (i − j)·36      y = 110 + (i + j)·18
 * The far corner of the room (i = j = 0) is at the top middle; i grows down-right, j down-left.
 * A UI box of another size scales the reference box uniformly to *cover* it (centered; any overflow
 * is cut) — the walkable floor keeps a margin, so nobody is ever cut off.
 */
import type { SeededRandom } from "../core/rng";

export type Pt = [number, number];

export const STAGE = {
  ref: [360, 642] as [number, number],
  cx: 180,
  dx: 36,
  y0: 110,
  dy: 18,
  /** Half-tile lattice: everyone stands and steps on it. */
  step: 0.5,
  /** Walkable floor: i, j ≥ min (off the walls); |i − j| ≤ halfWidth (on screen); sMin ≤ i + j ≤ sMax (to the bottom edge). */
  min: 1,
  halfWidth: 4,
  sMin: 3,
  sMax: 28.5,
  /** Where the player stands when a scene opens (lower middle). */
  home: [9, 9] as Pt,
  /** Where people pose for a memory card (a group around the middle). */
  photo: [[9, 9], [8, 9.5], [9.5, 8], [10, 10], [8, 8], [10.5, 9], [7.5, 9.5], [9, 10.5]] as Pt[],
};

const snap = (x: number) => Math.round(x / STAGE.step) * STAGE.step;
export const key = (p: Pt) => `${p[0]},${p[1]}`;

/** Screen position (fractions of the reference box) of a grid point — where the feet go. */
export function project(p: Pt): { x: number; y: number } {
  const [w, h] = STAGE.ref;
  return { x: (STAGE.cx + (p[0] - p[1]) * STAGE.dx) / w, y: (STAGE.y0 + (p[0] + p[1]) * STAGE.dy) / h };
}

export function inStage(p: Pt): boolean {
  const s = p[0] + p[1];
  return p[0] >= STAGE.min && p[1] >= STAGE.min && Math.abs(p[0] - p[1]) <= STAGE.halfWidth + 1e-9 && s >= STAGE.sMin - 1e-9 && s <= STAGE.sMax + 1e-9;
}

/** The nearest walkable lattice point. */
export function snapStage(p: Pt): Pt {
  let s = p[0] + p[1];
  let d = p[0] - p[1];
  d = Math.max(-STAGE.halfWidth, Math.min(STAGE.halfWidth, d));
  s = Math.max(STAGE.sMin, Math.min(STAGE.sMax, s));
  s = Math.max(s, 2 * STAGE.min + Math.abs(d));
  let q: Pt = [snap((s + d) / 2), snap((s - d) / 2)];
  if (!inStage(q)) q = [snap((s + d) / 2 - 0.25), snap((s - d) / 2 - 0.25)];
  return inStage(q) ? q : STAGE.home;
}

let LATTICE: Pt[] | undefined;
/** Every walkable lattice point (back to front). */
export function stageLattice(): Pt[] {
  if (!LATTICE) {
    LATTICE = [];
    for (let i = STAGE.min; i <= STAGE.sMax; i += STAGE.step) for (let j = STAGE.min; j <= STAGE.sMax; j += STAGE.step) if (inStage([i, j])) LATTICE.push([i, j]);
  }
  return LATTICE;
}

/** A random walkable point (not one already taken, if possible). */
export function randomStage(rng: SeededRandom, taken?: Set<string>): Pt {
  const all = stageLattice();
  for (let k = 0; k < 20; k++) {
    const p = all[rng.int(0, all.length - 1)];
    if (!taken?.has(key(p))) return p;
  }
  return all[rng.int(0, all.length - 1)];
}

/**
 * A walk from `from` to `to`, one half-tile along an axis per step (Kairosoft walkers): long straight
 * runs, turning only when the next step would leave the floor. Both ends should be on the stage.
 */
export function stagePath(from: Pt, to: Pt, iFirst = true): Pt[] {
  const out: Pt[] = [];
  let p: Pt = [from[0], from[1]];
  let axis: 0 | 1 = iFirst ? 0 : 1;
  for (let guard = 0; guard < 400 && (Math.abs(p[0] - to[0]) > 1e-9 || Math.abs(p[1] - to[1]) > 1e-9); guard++) {
    const stepOn = (a: 0 | 1): Pt | undefined => {
      const diff = to[a] - p[a];
      if (Math.abs(diff) < 1e-9) return;
      const q: Pt = [p[0], p[1]];
      q[a] += Math.sign(diff) * STAGE.step;
      return q;
    };
    const other: 0 | 1 = axis === 0 ? 1 : 0;
    let q = stepOn(axis);
    if (!q || !inStage(q)) {
      const alt = stepOn(other);
      if (alt && inStage(alt)) {
        q = alt;
        axis = other;
      } else q = q ?? alt;
    }
    if (!q) break;
    out.push(q);
    p = q;
  }
  return out;
}

/** A straight walk (along i, then j — or the other way), allowed to leave the floor: for walking off-screen. */
export function gridPath(from: Pt, to: Pt, iFirst: boolean): Pt[] {
  const out: Pt[] = [];
  let [i, j] = from;
  const walk = (axis: 0 | 1, target: number) => {
    while (Math.abs((axis === 0 ? i : j) - target) > 1e-6) {
      const d = Math.sign(target - (axis === 0 ? i : j)) * STAGE.step;
      if (axis === 0) i += d;
      else j += d;
      out.push([i, j]);
    }
  };
  if (iFirst) (walk(0, to[0]), walk(1, to[1]));
  else (walk(1, to[1]), walk(0, to[0]));
  return out;
}

/**
 * A straight walk on screen (alternating i and j steps — straight down, or straight across), allowed
 * to leave the floor: for stepping off the screen edge and coming back in.
 */
export function stairPath(from: Pt, to: Pt): Pt[] {
  const out: Pt[] = [];
  let [i, j] = from;
  let turn: 0 | 1 = Math.abs(to[0] - i) >= Math.abs(to[1] - j) ? 0 : 1;
  for (let guard = 0; guard < 400; guard++) {
    const di = to[0] - i;
    const dj = to[1] - j;
    if (Math.abs(di) < 1e-9 && Math.abs(dj) < 1e-9) break;
    const axis: 0 | 1 = Math.abs(di) < 1e-9 ? 1 : Math.abs(dj) < 1e-9 ? 0 : turn;
    if (axis === 0) i += Math.sign(di) * STAGE.step;
    else j += Math.sign(dj) * STAGE.step;
    turn = axis === 0 ? 1 : 0;
    out.push([i, j]);
  }
  return out;
}

/** Just off the screen from `p`: past the left or right edge (same depth), or below the bottom edge. */
export function exitFrom(p: Pt, side: "left" | "right" | "bottom"): Pt {
  const s = p[0] + p[1];
  const d = p[0] - p[1];
  if (side === "bottom") return [snap((STAGE.sMax + 3 + d) / 2), snap((STAGE.sMax + 3 - d) / 2)];
  const out = side === "right" ? STAGE.halfWidth + 3 : -(STAGE.halfWidth + 3);
  return [snap((s + out) / 2), snap((s - out) / 2)];
}

/** Is this point off the screen (where people go when they step out)? */
export function offStage(p: Pt): boolean {
  return Math.abs(p[0] - p[1]) > STAGE.halfWidth + 2 || p[0] + p[1] > STAGE.sMax + 2;
}

/**
 * For the painter (fractions of the reference box): the back walls rise from a "V" — the far corner at
 * the top middle, down to where they meet the left and right edges — to the top edge; the floor fills
 * everything below. Floor tiles are diamonds `tile` wide/high (a unit square of the grid).
 */
export function stageInfo() {
  const [w, h] = STAGE.ref;
  const edgeY = STAGE.y0 + (STAGE.cx / STAGE.dx) * STAGE.dy;
  return {
    ref: STAGE.ref,
    corner: { x: 0.5, y: STAGE.y0 / h },
    leftBase: { x: 0, y: edgeY / h },
    rightBase: { x: 1, y: edgeY / h },
    tile: { w: (2 * STAGE.dx) / w, h: (2 * STAGE.dy) / h },
    /** A character sprite's height as a fraction of the box (≈ 64 px of 642; about one tile wide). */
    spriteHeight: 64 / h,
  };
}
