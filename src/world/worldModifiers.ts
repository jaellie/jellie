/**
 * The world feeds back into destiny-style probabilities: who you know and
 * what you've practiced reshape future opportunities. Emitted as an ordinary
 * DestinyModifierSource ("WORLD") so OpportunityEngine needs no special case.
 */
import type { DestinyModifierSource, LifeModifierKey, Modifier } from "../core/lifeModifiers";
import { sumModifierList } from "../core/lifeModifiers";
import type { WorldState } from "./types";

const KNOWN = new Set(["ACQUAINTANCE", "FRIEND", "CLOSE_FRIEND", "ROMANTIC_INTEREST", "PARTNER"]);
const FRIENDS = new Set(["FRIEND", "CLOSE_FRIEND"]);

export function worldModifierSource(world: WorldState, weight = 1): DestinyModifierSource {
  const trace: Modifier[] = [];
  const add = (key: LifeModifierKey, value: number, source: string) => value && trace.push({ key, value, source: `WORLD/${source}` });
  const rels = Object.values(world.relationships);
  const foreign = rels.filter((r) => KNOWN.has(r.stage) && world.npcs[r.npcId]?.foreign).length;
  const friends = rels.filter((r) => FRIENDS.has(r.stage)).length;
  const professional = rels.filter((r) => KNOWN.has(r.stage) && ["COWORKER", "PROFESSIONAL_NETWORKING"].includes(r.origin.type)).length;
  const x = world.experience;

  add("overseas", Math.min(0.25, foreign * 0.05), `foreign_connections(${foreign})`);
  add("travel", Math.min(0.2, foreign * 0.03 + world.pastTrips.length * 0.03), "foreign_connections+trips");
  add("social", Math.min(0.2, friends * 0.03), `friends(${friends})`);
  add("romance", Math.min(0.08, friends * 0.01), "friend_of_friend_intros");
  add("career", Math.min(0.15, professional * 0.03), `professional_network(${professional})`);
  add("overseas", Math.min(0.15, (x.language ?? 0) / 200), "language_practice");
  add("communication", Math.min(0.12, (x.language ?? 0) / 250), "language_practice");
  add("creativity", Math.min(0.12, ((x.cooking ?? 0) + (x.art ?? 0) + (x.photography ?? 0)) / 300), "creative_practice");
  add("education", Math.min(0.1, ((x.study ?? 0) + (x.research ?? 0)) / 400), "study_hours");
  add("stability", Math.min(0.1, Object.keys(world.habits).length * 0.025), "routines");
  add("business", Math.min(0.06, (x.work ?? 0) / 3000), "work_experience");

  return { source: "WORLD", weight, modifiers: sumModifierList(trace), breakdown: trace };
}
