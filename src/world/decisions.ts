/**
 * World-event choices. The UI shows WorldEvent.choices; the simulation uses
 * AutoWorldPolicy. Either way resolveWorldEvent applies the outcome.
 */
import { type LifeModifiers, clamp } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import { calculateNatalChart } from "../saju/chart";
import type { LifeState } from "../sim/types";
import { getNpcType } from "./catalog";
import type { WorldEvent } from "./events";
import { generateNpc } from "./npcs";
import type { WorldState } from "./types";

export interface WorldDecisionPolicy {
  choose(event: WorldEvent, state: LifeState, world: WorldState, rng: SeededRandom): string;
}

export class AutoWorldPolicy implements WorldDecisionPolicy {
  choose(e: WorldEvent, s: LifeState, _w: WorldState, rng: SeededRandom): string {
    const t = s.traits;
    const noise = rng.range(-0.2, 0.2);
    switch (e.kind) {
      case "ROMANCE_OPPORTUNITY":
        return 0.35 + t.sociability * 0.3 + t.riskTolerance * 0.2 + noise > 0.55 ? "ASK_OUT" : "STAY_FRIENDS";
      case "INVITATION":
        return 0.3 + t.sociability * 0.6 + noise > 0.5 ? "ACCEPT" : "DECLINE";
      case "ONLINE_MEETUP":
        return 0.25 + t.sociability * 0.3 + t.riskTolerance * 0.3 + noise > 0.5 ? "MEET" : "NOT_YET";
      case "TRAVEL_OPPORTUNITY":
        return s.money > 8 && 0.2 + t.novelty * 0.6 + noise > 0.5 ? "GO" : "LATER";
      default:
        return e.choices?.at(-1)?.id ?? "";
    }
  }
}

export interface WorldResolution {
  choiceId: string;
  success?: boolean;
  changes: string[];
}

/** Apply a chosen option. Returns what changed (for the log). */
export function resolveWorldEvent(
  e: WorldEvent,
  choiceId: string,
  ctx: { state: LifeState; world: WorldState; modifiers: LifeModifiers; rng: SeededRandom },
): WorldResolution {
  const { state: s, world, rng, modifiers: m } = ctx;
  const rel = e.npcId ? world.relationships[e.npcId] : undefined;
  const npc = e.npcId ? world.npcs[e.npcId] : undefined;
  const changes: string[] = [];
  const remember = (text: string, tags: string[]) => s.memories.push({ date: { ...e.date }, age: Math.floor(s.age), text, tags });

  switch (`${e.kind}:${choiceId}`) {
    case "ROMANCE_OPPORTUNITY:ASK_OUT": {
      if (!rel || !npc) break;
      const p = clamp((0.3 + rel.spark * 0.5 + rel.closeness * 0.2) * Math.exp(m.romance ?? 0), 0.05, 0.9);
      const success = rng.chance(p);
      if (success && (s.relationship.status === "SINGLE" || s.relationship.status === "DIVORCED")) {
        rel.stage = "PARTNER";
        if (!s.npcs.some((n) => n.id === npc.id)) {
          const birth = { year: npc.birthYear, month: npc.birthMonth, day: npc.birthDay, sex: npc.sex };
          s.npcs.push({ id: npc.id, name: npc.name, birth, chart: calculateNatalChart(birth), role: "PARTNER", metAt: { ...rel.origin.firstEncounterDate } });
        }
        s.relationship = { status: "DATING", partnerId: npc.id, sinceMonth: s.monthIndex, longDistance: npc.region !== world.homeRegion && npc.region !== "coast" };
        changes.push(`dating ${npc.name} (met via ${rel.origin.type.toLowerCase()})`);
        remember(`Started dating ${npc.name}, first met at ${rel.origin.locationId}.`, ["romance", "world"]);
      } else {
        rel.spark = 0;
        rel.closeness = clamp(rel.closeness - 0.1, 0, 1);
        changes.push(`${npc.name} said no`);
        remember(`Asked ${npc.name} out; it didn't happen.`, ["romance"]);
      }
      return { choiceId, success, changes };
    }
    case "ROMANCE_OPPORTUNITY:STAY_FRIENDS":
      if (rel) rel.spark *= 0.5;
      break;
    case "INVITATION:ACCEPT":
      if (rel) rel.closeness = clamp(rel.closeness + 0.1, 0, 1);
      s.socialCircle += 1;
      changes.push("joined the group dinner");
      if (npc && rng.chance(0.5 * Math.exp(m.social ?? 0))) {
        const type = getNpcType("friend").id;
        const fof = generateNpc(world, rng, { type, region: world.homeRegion, date: e.date, aroundAge: s.age, persistence: "PERSISTENT" });
        world.relationships[fof.id] = {
          npcId: fof.id,
          stage: "ACQUAINTANCE",
          closeness: 0.15,
          spark: 0,
          conversations: 1,
          origin: { type: "FRIEND_OF_FRIEND", locationId: "restaurant", firstEncounterDate: { ...e.date }, firstEncounterContext: `via ${npc.name}` },
          lastContact: { ...e.date },
          channel: "IN_PERSON",
          metOffline: true,
        };
        changes.push(`met ${fof.name} through ${npc.name}`);
      }
      break;
    case "INVITATION:DECLINE":
      if (rel) rel.closeness = clamp(rel.closeness - 0.03, 0, 1);
      break;
    case "ONLINE_MEETUP:MEET":
      if (rel && npc) {
        rel.metOffline = true;
        rel.channel = "IN_PERSON";
        rel.closeness = clamp(rel.closeness + 0.1, 0, 1);
        changes.push(`met ${npc.name} offline`);
        remember(`Met ${npc.name} in person for the first time after chatting online.`, ["online", "world"]);
      }
      break;
    case "TRAVEL_OPPORTUNITY:GO":
      world.pendingTrips = [...(world.pendingTrips ?? []), String(e.payload?.destination ?? "paris")];
      changes.push(`planning a trip to ${e.payload?.destination}`);
      break;
  }
  return { choiceId, changes };
}
