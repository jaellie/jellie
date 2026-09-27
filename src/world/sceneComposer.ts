/**
 * Composes a scene from reusable parts:
 *   background (+ overlays) + character sprites on location spots + props + UI.
 * No per-combination background art is ever needed.
 */
import { backgroundsFor, getLocation } from "./catalog";
import type { BackgroundLayer } from "./types";
import type { VisitResult } from "./worldEngine";
import type { WorldState } from "./types";
import type { LifeState } from "../sim/types";
import { ageMixFor, knowsName, npcAge } from "./npcs";
import { ENCOUNTER_RULES } from "./catalog";
import { STAGE, stageLattice } from "./stage";

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
  /** An online place: the player is at home on their phone. */
  online?: boolean;
}

const AMBIENT = (ENCOUNTER_RULES.crowds as unknown as { ambient: Record<string, [number, number]> }).ambient;

export function composeScene(visit: VisitResult, world: WorldState, state: LifeState, opts: { withPartner?: boolean; household?: boolean } = {}): Scene {
  const loc = getLocation(visit.locationId);
  const bg = visit.background.background;
  const actors: SceneActor[] = [];
  // The player starts in the lower middle of the stage; everyone else is spread over the whole floor
  // (not lined up), stable per person so a scene looks the same when redrawn.
  const lattice = stageLattice();
  const used = new Set<string>();
  let i = 0;
  const place = (a: Omit<SceneActor, "spot" | "z">) => {
    let spot: [number, number] = [STAGE.home[0], STAGE.home[1]];
    if (i++ > 0) {
      // FNV-1a + avalanche, so similar ids ("amb0", "amb1") land far apart instead of in a row.
      let h = 2166136261;
      for (const c of `${a.id}@${loc.id}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
      h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
      for (let k = 0; k < lattice.length; k++) {
        const p = lattice[(h + k * 37) % lattice.length];
        if (!used.has(p.join(","))) {
          spot = p;
          break;
        }
      }
    }
    used.add(spot.join(","));
    actors.push({ ...a, spot, z: Math.round((spot[0] + spot[1]) * 10) });
  };
  // An online place (community, SNS, apps) is you at home on your phone: the people you talk to
  // aren't in the room — your household is.
  const online = !!loc.online;
  place({ id: "player", kind: "player", sex: state.birth.sex, age: Math.floor(state.age), spriteSeed: 0 });
  if (opts.withPartner && state.relationship.partnerId) {
    const pid = state.relationship.partnerId;
    const pn = world.npcs[pid] ?? state.npcs.find((n) => n.id === pid);
    const sex = pn && "sex" in pn ? (pn as { sex: "MALE" | "FEMALE" }).sex : pn && "birth" in pn ? (pn as { birth: { sex: "MALE" | "FEMALE" } }).birth.sex : undefined;
    place({ id: pid, kind: "partner", name: pn?.name, sex, spriteSeed: (world.npcs[pid]?.spriteSeed ?? 1), fated: world.npcs[pid]?.fated });
  }
  for (const id of online ? [] : visit.present) {
    const n = world.npcs[id];
    if (n) place({ id, kind: "npc", name: knowsName(world, id) ? n.name : undefined, npcType: n.type, sex: n.sex, age: npcAge(n, visit.time.date), spriteSeed: n.spriteSeed, fated: n.fated, familiar: !!world.relationships[id] || (world.encounters[`${id}@${loc.id}`]?.encounterCount ?? 0) >= 2 });
  }
  if (opts.household || online) {
    for (const k of state.kids ?? []) place({ id: k.id, kind: "npc", name: k.name, npcType: "kid", sex: k.sex, age: visit.time.date.year - k.bornYear, spriteSeed: k.spriteSeed });
    for (const p of (state.pets ?? []).filter((x) => x.alive)) place({ id: p.id, kind: "npc", name: p.name, npcType: p.species === "DOG" ? "pet_dog" : "pet_cat", spriteSeed: p.spriteSeed });
  }
  if (!online) {
    for (const n of visit.passersBy) place({ id: n.id, kind: "passerby", npcType: n.type, sex: n.sex, age: npcAge(n, visit.time.date), spriteSeed: n.spriteSeed });
    // Ambient crowd (visual only): a busy street, a few more customers — of the place's usual ages.
    const [lo, hi] = (AMBIENT[loc.type] ?? AMBIENT.default) as [number, number];
    const mix = ageMixFor(loc);
    let h = 0;
    for (const c of `${loc.id}|${visit.time.date.year}-${visit.time.date.month}-${visit.time.date.day}|${visit.time.hour}`) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    const rnd = () => ((h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
    const count = lo + Math.floor(rnd() * (hi - lo + 1));
    for (let k = 0; k < count; k++) {
      const band = mix ? mix[Math.floor(rnd() * mix.length)] : [20, 60];
      place({ id: `amb${k}`, kind: "passerby", npcType: "extra", sex: rnd() < 0.5 ? "MALE" : "FEMALE", age: band[0] + Math.floor(rnd() * (band[1] - band[0] + 1)), spriteSeed: Math.floor(rnd() * 1_000_000) });
    }
  }
  // Variants (evening/rain…) reuse the base background's props & layers unless they define their own.
  const baseBg = backgroundsFor(loc.id).find((b) => !b.timeOfDay && !b.weather && !b.season && !b.activities);
  const layers = bg.layers ?? baseBg?.layers ?? [];
  return {
    size: [STAGE.ref[0], STAGE.ref[1]],
    locationId: loc.id,
    prototypeId: loc.prototypeId,
    background: { id: bg.id, assetPath: bg.assetPath, renderer: bg.renderer, status: bg.status, layers: layers.filter((l) => l.kind !== "interactive") },
    overlays: visit.background.overlays,
    actors,
    props: layers.filter((l) => l.kind === "interactive"),
    ...(online ? { online: true } : {}),
  };
}
