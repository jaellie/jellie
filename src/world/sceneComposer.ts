/**
 * Composes a scene from reusable parts:
 *   background (+ overlays) + character sprites on location spots + props + UI.
 * No per-combination background art is ever needed.
 */
import { ART_DIRECTION, backgroundsFor, getLocation } from "./catalog";
import type { BackgroundLayer } from "./types";
import type { VisitResult } from "./worldEngine";
import type { WorldState } from "./types";
import type { LifeState } from "../sim/types";
import { npcAge } from "./npcs";

export interface SceneActor {
  id: string;
  kind: "player" | "partner" | "npc" | "passerby";
  name?: string;
  npcType?: string;
  sex?: "MALE" | "FEMALE";
  age?: number;
  spriteSeed: number;
  /** Isometric grid position (prototype SPOTS convention). */
  spot: [number, number];
  z: number;
  /** Familiar faces get a subtle marker in the UI. */
  familiar?: boolean;
  fated?: boolean;
}

export interface Scene {
  size: [number, number];
  locationId: string;
  prototypeId?: string;
  background: { id: string; assetPath: string; renderer?: string; status?: string; layers: BackgroundLayer[] };
  overlays: VisitResult["background"]["overlays"];
  actors: SceneActor[];
  props: BackgroundLayer[];
}

export function composeScene(visit: VisitResult, world: WorldState, state: LifeState, opts: { withPartner?: boolean } = {}): Scene {
  const loc = getLocation(visit.locationId);
  const spots = loc.spots ?? [[4.5, 4.5]];
  const bg = visit.background.background;
  const actors: SceneActor[] = [];
  let i = 0;
  const place = (a: Omit<SceneActor, "spot" | "z">) => {
    const spot = spots[i++ % spots.length];
    actors.push({ ...a, spot, z: Math.round((spot[0] + spot[1]) * 10) });
  };
  if (!loc.online) {
    place({ id: "player", kind: "player", sex: state.birth.sex, age: Math.floor(state.age), spriteSeed: 0 });
    if (opts.withPartner && state.relationship.partnerId) {
      const pid = state.relationship.partnerId;
      const pn = world.npcs[pid] ?? state.npcs.find((n) => n.id === pid);
      const sex = pn && "sex" in pn ? (pn as { sex: "MALE" | "FEMALE" }).sex : pn && "birth" in pn ? (pn as { birth: { sex: "MALE" | "FEMALE" } }).birth.sex : undefined;
      place({ id: pid, kind: "partner", name: pn?.name, sex, spriteSeed: (world.npcs[pid]?.spriteSeed ?? 1), fated: world.npcs[pid]?.fated });
    }
    for (const id of visit.present) {
      const n = world.npcs[id];
      if (n) place({ id, kind: "npc", name: n.name, npcType: n.type, sex: n.sex, age: npcAge(n, visit.time.date), spriteSeed: n.spriteSeed, fated: n.fated, familiar: !!world.relationships[id] || (world.encounters[`${id}@${loc.id}`]?.encounterCount ?? 0) >= 2 });
    }
    for (const n of visit.passersBy) place({ id: n.id, kind: "passerby", npcType: n.type, sex: n.sex, age: npcAge(n, visit.time.date), spriteSeed: n.spriteSeed });
  }
  // Variants (evening/rain…) reuse the base background's props & layers unless they define their own.
  const baseBg = backgroundsFor(loc.id).find((b) => !b.timeOfDay && !b.weather && !b.season && !b.activities);
  const layers = bg.layers ?? baseBg?.layers ?? [];
  return {
    size: [ART_DIRECTION.frame[0], ART_DIRECTION.sceneHeight],
    locationId: loc.id,
    prototypeId: loc.prototypeId,
    background: { id: bg.id, assetPath: bg.assetPath, renderer: bg.renderer, status: bg.status, layers: layers.filter((l) => l.kind !== "interactive") },
    overlays: visit.background.overlays,
    actors,
    props: layers.filter((l) => l.kind === "interactive"),
  };
}
