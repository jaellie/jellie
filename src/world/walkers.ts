/**
 * Kairosoft-style crowd movement for a scene (visual only; never affects the story).
 *
 * Everyone walks tile by tile on the floor grid (one half-tile step per tick, along the
 * iso axes), pauses at a spot, then heads somewhere else. Now and then an NPC walks off
 * the edge of the screen and comes back a little later. Staff stay near their post, the
 * player never leaves, pets potter about.
 *
 * Call `stepCrowd` once per tick (the game does it in `wander()`); animate each actor from
 * its previous spot to the new one over the tick (linear), flip the sprite by `facing`,
 * and play the walk frames while `walking`.
 */
import type { SeededRandom } from "../core/rng";

export type Facing = "NE" | "NW" | "SE" | "SW";
type Pt = [number, number];

export interface CrowdActor {
  who: string;
  spot: [number, number];
  z: number;
  role: string;
  npcType?: string;
  /** Moved this tick (play the walk animation). */
  walking?: boolean;
  /** Which way the sprite faces (iso direction of the last step). */
  facing?: Facing;
  /** Out of the room for now (walked off the edge; will come back). */
  offscreen?: boolean;
}

interface Walker {
  pos: Pt;
  path: Pt[];
  idle: number;
  away: number;
  facing: Facing;
  home?: Pt;
}

export interface CrowdState {
  key: string;
  walkers: Record<string, Walker>;
}

/** Walkable floor (iso grid coordinates, half-tile lattice) and the off-screen exits. */
export const FLOOR = { min: 2.5, max: 6.5, step: 0.5 };
export const EXITS: Pt[] = [
  [9.5, 2.5], // off the right edge
  [2.5, 9.5], // off the left edge
];

const STAFF = /barista|staff|trainer|instructor|nurse|doctor|clerk|chef|librarian|receptionist|guard|judge|officiant/;
const snap = (x: number) => Math.round(x / FLOOR.step) * FLOOR.step;
const clampFloor = (x: number) => Math.max(FLOOR.min, Math.min(FLOOR.max, snap(x)));
const key = (p: Pt) => `${p[0]},${p[1]}`;
const zOf = (p: Pt) => Math.round((p[0] + p[1]) * 10);

/** Grid path: along i first, then j (or the other way), one half-tile per step — like Kairosoft walkers. */
function gridPath(from: Pt, to: Pt, iFirst: boolean): Pt[] {
  const out: Pt[] = [];
  let [i, j] = from;
  const walk = (axis: 0 | 1, target: number) => {
    while (Math.abs((axis === 0 ? i : j) - target) > 1e-6) {
      const d = Math.sign(target - (axis === 0 ? i : j)) * FLOOR.step;
      if (axis === 0) i += d;
      else j += d;
      out.push([i, j]);
    }
  };
  if (iFirst) (walk(0, to[0]), walk(1, to[1]));
  else (walk(1, to[1]), walk(0, to[0]));
  return out;
}

function facingOf(from: Pt, to: Pt): Facing {
  if (to[0] > from[0]) return "SE";
  if (to[0] < from[0]) return "NW";
  if (to[1] > from[1]) return "SW";
  return "NE";
}

function randomFloor(rng: SeededRandom, taken: Set<string>): Pt {
  for (let k = 0; k < 20; k++) {
    const p: Pt = [snap(rng.range(FLOOR.min, FLOOR.max)), snap(rng.range(FLOOR.min, FLOOR.max))];
    if (!taken.has(key(p))) return p;
  }
  return [snap(rng.range(FLOOR.min, FLOOR.max)), snap(rng.range(FLOOR.min, FLOOR.max))];
}

/** How likely an idle actor is to leave the room when choosing what to do next. */
function leaveChance(a: CrowdActor): number {
  if (a.role === "me" || a.role === "partner" || a.role === "kid" || a.role === "baby") return 0;
  if (a.role === "pet") return 0;
  if (a.role === "passerby") return 0.35;
  return 0.12;
}

/** Advance everyone one tick. `sceneKey` resets the crowd when the scene (place/visit) changes. */
export function stepCrowd(state: CrowdState | undefined, sceneKey: string, actors: CrowdActor[], rng: SeededRandom): { state: CrowdState; actors: CrowdActor[] } {
  const st: CrowdState = state && state.key === sceneKey ? state : { key: sceneKey, walkers: {} };
  const taken = new Set<string>();
  for (const w of Object.values(st.walkers)) if (!w.away) taken.add(key(w.path.at(-1) ?? w.pos));
  const out = actors.map((a) => {
    let w = st.walkers[a.who];
    const staff = STAFF.test(a.npcType ?? "");
    if (!w) {
      // Start where the scene placed them (snapped onto the floor lattice).
      const pos: Pt = [clampFloor(a.spot[0]), clampFloor(a.spot[1])];
      // Already on the move when the scene opens (only staff start still at their post).
      w = st.walkers[a.who] = { pos, path: [], idle: staff ? rng.int(1, 3) : 0, away: 0, facing: rng.chance(0.5) ? "SE" : "SW", home: staff ? pos : undefined };
    }
    let walking = false;
    if (w.away > 0) {
      w.away -= 1;
      if (w.away === 0) {
        // Back in: enter from an edge and walk to somewhere on the floor.
        const door = EXITS[rng.int(0, EXITS.length - 1)];
        w.pos = [...door] as Pt;
        const target = randomFloor(rng, taken);
        w.path = gridPath(w.pos, target, door[0] > door[1]);
        taken.add(key(target));
      }
    } else if (w.path.length) {
      const next = w.path.shift()!;
      w.facing = facingOf(w.pos, next);
      w.pos = next;
      walking = true;
      if (!w.path.length) {
        if (EXITS.some((e) => key(e) === key(w!.pos))) w.away = rng.int(6, 16); // out of the room for a while
        else w.idle = a.role === "pet" ? rng.int(0, 2) : rng.int(1, 4);
      }
    } else if (w.idle > 0) {
      w.idle -= 1;
    } else if (staff && w.home) {
      // Staff potter around their post.
      const target: Pt = [clampFloor(w.home[0] + rng.int(-1, 1) * FLOOR.step), clampFloor(w.home[1] + rng.int(-1, 1) * FLOOR.step)];
      w.path = gridPath(w.pos, target, rng.chance(0.5));
      w.idle = rng.int(3, 8);
    } else if (rng.chance(leaveChance(a))) {
      const door = EXITS[rng.int(0, EXITS.length - 1)];
      w.path = gridPath(w.pos, door, door[0] < door[1]);
    } else {
      const reach = a.role === "pet" ? 1.5 : 4;
      const target: Pt = [clampFloor(w.pos[0] + rng.range(-reach, reach)), clampFloor(w.pos[1] + rng.range(-reach, reach))];
      if (!taken.has(key(target))) {
        w.path = gridPath(w.pos, target, rng.chance(0.5));
        taken.add(key(target));
      }
    }
    const offscreen = w.away > 0;
    return { ...a, spot: [w.pos[0], w.pos[1]] as [number, number], z: zOf(w.pos), walking, facing: w.facing, offscreen };
  });
  // Forget walkers no longer in the scene.
  const present = new Set(actors.map((a) => a.who));
  for (const k of Object.keys(st.walkers)) if (!present.has(k)) delete st.walkers[k];
  return { state: st, actors: out };
}
