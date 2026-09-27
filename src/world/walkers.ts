/**
 * Kairosoft-style crowd movement for a scene (visual only; never affects the story).
 *
 * Everyone walks tile by tile over the whole floor of the stage (see stage.ts: the portrait room that
 * fills the screen), one half-tile step per tick along the iso axes, pauses at a spot, then heads
 * somewhere else — often across the room. Now and then an NPC walks off the left, right or bottom
 * edge and comes back a little later. Staff stay near their post, the player never leaves, pets
 * potter about.
 *
 * Call `stepCrowd` once per tick (the game does it in `wander()`); animate each actor from its previous
 * position to the new one over the tick (linear), flip the sprite by `facing`, and play the walk
 * frames while `walking`.
 */
import type { SeededRandom } from "../core/rng";
import { type Pt, STAGE, exitFrom, inStage, key, offStage, randomStage, snapStage, stagePath, stairPath } from "./stage";

export type Facing = "NE" | "NW" | "SE" | "SW";

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

/** The walkable floor (grid units) — kept for callers that only need its extent. */
export const FLOOR = { min: STAGE.min, max: STAGE.sMax - STAGE.min, step: STAGE.step };

const STAFF = /barista|staff|trainer|instructor|nurse|doctor|clerk|chef|librarian|receptionist|guard|judge|officiant/;
const zOf = (p: Pt) => Math.round((p[0] + p[1]) * 10);

function facingOf(from: Pt, to: Pt): Facing {
  if (to[0] > from[0]) return "SE";
  if (to[0] < from[0]) return "NW";
  if (to[1] > from[1]) return "SW";
  return "NE";
}

/** How likely an idle actor is to leave the room when choosing what to do next. */
function leaveChance(a: CrowdActor): number {
  if (a.role === "me" || a.role === "partner" || a.role === "kid" || a.role === "baby") return 0;
  if (a.role === "pet") return 0;
  if (a.role === "passerby") return 0.35;
  return 0.12;
}

const SIDES = ["left", "right", "bottom"] as const;

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
      const pos = snapStage(a.spot as Pt);
      // Already on the move when the scene opens (only staff start still at their post).
      w = st.walkers[a.who] = { pos, path: [], idle: staff ? rng.int(1, 3) : 0, away: 0, facing: rng.chance(0.5) ? "SE" : "SW", home: staff ? pos : undefined };
    }
    let walking = false;
    if (w.away > 0) {
      w.away -= 1;
      if (w.away === 0) {
        // Back in: from off one edge, walk to somewhere on the floor.
        const target = randomStage(rng, taken);
        const door = exitFrom(target, SIDES[rng.int(0, SIDES.length - 1)]);
        w.pos = door;
        w.path = stairPath(door, target);
        taken.add(key(target));
      }
    } else if (w.path.length) {
      const next = w.path.shift()!;
      w.facing = facingOf(w.pos, next);
      w.pos = next;
      walking = true;
      if (!w.path.length) {
        if (offStage(w.pos)) w.away = rng.int(6, 16); // out of the room for a while
        else w.idle = a.role === "pet" ? rng.int(0, 2) : rng.int(1, 4);
      }
    } else if (w.idle > 0) {
      w.idle -= 1;
    } else if (staff && w.home) {
      // Staff potter around their post.
      const target = snapStage([w.home[0] + rng.int(-1, 1) * STAGE.step, w.home[1] + rng.int(-1, 1) * STAGE.step]);
      w.path = stagePath(w.pos, target, rng.chance(0.5));
      w.idle = rng.int(3, 8);
    } else if (rng.chance(leaveChance(a))) {
      const door = exitFrom(w.pos, SIDES[rng.int(0, SIDES.length - 1)]);
      w.path = stairPath(w.pos, door);
    } else {
      // Somewhere nearby, or right across the room (people cross the whole screen).
      const reach = a.role === "pet" ? 1.5 : 3;
      const target =
        a.role !== "pet" && rng.chance(0.4)
          ? randomStage(rng, taken)
          : snapStage([w.pos[0] + rng.range(-reach, reach), w.pos[1] + rng.range(-reach, reach)]);
      if (!taken.has(key(target)) && inStage(target)) {
        w.path = stagePath(inStage(w.pos) ? w.pos : snapStage(w.pos), target, rng.chance(0.5));
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
