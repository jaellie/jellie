/**
 * WorldEngine — one visit to one location at one time.
 *
 *   location → background → activity → NPCs present (schedules + staff + passers-by)
 *   → sightings/encounters → location events → memories → (choices) → consequences
 *
 * A visit may produce nothing at all; that is the most common outcome.
 */
import type { GameDate } from "../core/gameDate";
import { type LifeModifierKey, type LifeModifiers, clamp } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import type { ScoreFactor } from "../sim/opportunity";
import { checkRequirements } from "../sim/requirements";
import type { LifeState } from "../sim/types";
import { type BackgroundSelection, backgroundEngine } from "./backgroundEngine";
import { ENCOUNTER_RULES as R, getActivity, getLocation } from "./catalog";
import { worldTime } from "./clock";
import { type Attraction, type EncounterContext, processSighting } from "./encounters";
import type { WorldEvent } from "./events";
import { drawTransients, isPresent, populateLocation } from "./npcs";
import type { ActivityId, LocationMemory, TravelState, WorldNpc, WorldState, WorldTime } from "./types";

export interface VisitContext {
  state: LifeState;
  world: WorldState;
  /** Combined destiny + world modifiers (Saju, later Astrology/MBTI, WORLD…). */
  modifiers: LifeModifiers;
  rng: SeededRandom;
  /** Seed for deterministic weather. */
  seed: number;
  attraction?: Attraction;
  withPartner?: boolean;
  trip?: TravelState;
  /** Life facts for fact-dependent backgrounds (married home…). */
  facts?: Record<string, unknown>;
}

export interface VisitRequest {
  locationId: string;
  activityId?: ActivityId;
  date: GameDate;
  hour: number;
}

export interface VisitResult {
  time: WorldTime;
  locationId: string;
  activityId: ActivityId;
  background: BackgroundSelection;
  /** NPC ids visible in the scene this visit (for sprite composition). */
  present: string[];
  /** Ephemeral passers-by (not persisted) — still drawn in the scene. */
  passersBy: WorldNpc[];
  events: WorldEvent[];
  nothingHappened: boolean;
  closedReason?: string;
}

const EMPTY_MEMORY = (locationId: string): LocationMemory => ({ locationId, visitCount: 0, importantEvents: [], recurringNPCs: [], memories: [] });
const monthsBetween = (a: GameDate, b: GameDate) => (b.year - a.year) * 12 + (b.month - a.month);
const t = (ko: string, en: string) => ({ ko, en });

export class WorldEngine {
  visit(ctx: VisitContext, req: VisitRequest): VisitResult {
    const loc = getLocation(req.locationId);
    const activityId = req.activityId && loc.activities.includes(req.activityId) ? req.activityId : loc.activities[0];
    const activity = getActivity(activityId);
    const time = worldTime(ctx.seed, req.date, req.hour, loc.region);
    const background = backgroundEngine.getBackground({ location: loc.id, activityId, timeOfDay: time.timeOfDay, weather: time.weather, season: time.season, facts: ctx.facts });
    const base: VisitResult = { time, locationId: loc.id, activityId, background, present: [], passersBy: [], events: [], nothingHappened: true };

    // ---- Is it even possible to be here now? ----
    const closed =
      (req.hour < loc.availableHours.start || req.hour >= loc.availableHours.end) ? "closed at this hour"
      : loc.seasonalAvailability && !loc.seasonalAvailability.includes(time.season) ? `closed in ${time.season}`
      : !checkRequirements(ctx.state, loc.travelRequirements).ok ? "requirements not met"
      : undefined;
    if (closed) {
      return { ...base, closedReason: closed, events: [{ kind: "CLOSED", scale: "NONE", date: time.date, locationId: loc.id, text: t("지금은 들어갈 수 없다.", "Can't go in right now.") }] };
    }

    const { world, rng, state } = ctx;
    ctx.state.money -= activity.cost;
    for (const x of activity.experience ?? []) world.experience[x] = (world.experience[x] ?? 0) + activity.durationHours;
    if (activity.startsHabit && !world.habits[loc.id]) {
      world.habits[loc.id] = { activityId, since: { ...req.date }, perMonth: loc.type === "ONLINE" ? 6 : loc.type === "GYM" ? 8 : 4 };
    }

    // ---- Memory & callbacks ----
    const mem = (world.locationMemory[loc.id] ??= EMPTY_MEMORY(loc.id));
    const events: WorldEvent[] = [];
    if (mem.lastVisit && monthsBetween(mem.lastVisit, req.date) >= R.reunion.minMonthsAway && mem.importantEvents.length) {
      events.push({ kind: "MEMORY_CALLBACK", scale: "SMALL", date: time.date, locationId: loc.id, text: t(`여기… ${mem.importantEvents.at(-1)}`, `This place… ${mem.importantEvents.at(-1)}`) });
    }
    mem.visitCount += 1;
    mem.firstVisit ??= { ...req.date };
    const lastVisit = mem.lastVisit;
    mem.lastVisit = { ...req.date };
    if (ctx.trip && !ctx.trip.visitedLocations.includes(loc.id)) ctx.trip.visitedLocations.push(loc.id);

    // ---- Who is here? ----
    const regulars = populateLocation(world, loc.id, rng, req.date, state.age, ctx.trip ? "TEMPORARY" : "PERSISTENT");
    if (ctx.trip) for (const id of regulars) if (!ctx.trip.temporaryNPCs.includes(id)) ctx.trip.temporaryNPCs.push(id);
    const present = regulars.map((id) => world.npcs[id]).filter((n) => n && isPresent(n, loc.id, time, rng));
    const tp = R.transientPresence;
    const passersBy = loc.online ? [] : drawTransients(world, loc.id, rng, req.date, state.age, rng.int(tp.min, tp.max));
    const noticed = [...rng.weightedSample(present.map((n) => ({ item: n, weight: 1 })), R.maxNoticedPerVisit), ...passersBy];

    const ectx: EncounterContext = {
      state,
      world,
      modifiers: ctx.modifiers,
      rng,
      date: time.date,
      locationId: loc.id,
      activity,
      attraction: ctx.attraction ?? "ANY",
      inTrip: !!ctx.trip,
    };
    // Your partner's presence makes strangers less likely to approach.
    const talkers = ctx.withPartner ? noticed.filter(() => rng.chance(0.3)) : noticed;
    for (const npc of talkers) events.push(...processSighting(ectx, npc));
    for (const e of events) if (e.npcId && ctx.trip && world.npcs[e.npcId]?.persistence === "TEMPORARY" && !ctx.trip.temporaryNPCs.includes(e.npcId)) ctx.trip.temporaryNPCs.push(e.npcId);

    // ---- Reunion with someone first met here ----
    if (lastVisit && monthsBetween(lastVisit, req.date) >= R.reunion.minMonthsAway) {
      const old = Object.values(world.relationships).find((r) => r.origin.locationId === loc.id && ["LOST_CONTACT", "ACQUAINTANCE", "FRIEND"].includes(r.stage) && monthsBetween(r.lastContact, req.date) >= R.reunion.minMonthsAway);
      if (old && rng.chance(R.reunion.chance * Math.exp(ctx.modifiers.social ?? 0))) {
        const npc = world.npcs[old.npcId];
        old.lastContact = { ...req.date };
        old.stage = old.stage === "LOST_CONTACT" ? "ACQUAINTANCE" : old.stage;
        events.push({ kind: "REUNION", scale: "MAJOR", date: time.date, locationId: loc.id, npcId: old.npcId, text: t(`${npc?.name}!? 여기서 다시 만나다니.`, `${npc?.name}?! Running into each other here again.`) });
        if (npc && !present.includes(npc)) present.push(npc);
      }
    }

    // ---- Online relationships can move offline ----
    if (loc.online) {
      for (const rel of Object.values(world.relationships)) {
        if (rel.channel !== "ONLINE" || rel.metOffline || rel.origin.locationId !== loc.id) continue;
        if (rel.lastInvite && monthsBetween(rel.lastInvite, req.date) < 6) continue;
        if (rel.conversations >= 3 && rng.chance(R.onlineToOfflineChance * Math.exp(ctx.modifiers.social ?? 0))) {
          const npc = world.npcs[rel.npcId];
          rel.lastInvite = { ...req.date };
          events.push({
            kind: "ONLINE_MEETUP",
            scale: "MAJOR",
            date: time.date,
            locationId: loc.id,
            npcId: rel.npcId,
            text: t(`${npc?.name}: "우리 실제로 한번 만나볼래요?"`, `${npc?.name}: "Want to meet in person sometime?"`),
            choices: [
              { id: "MEET", label: t("카페에서 만나기", "Meet at a café") },
              { id: "NOT_YET", label: t("아직은 온라인으로", "Keep it online for now") },
            ],
          });
          break;
        }
      }
    }

    // ---- Location's own events (often none) ----
    const le = this.rollLocationEvent(ctx, loc.id, activityId, time);
    if (le) events.push(le);

    // ---- Remember ----
    for (const e of events) {
      if (e.kind === "LOCATION_EVENT" && e.payload?.important) mem.importantEvents.push(e.text.en);
      if (["FRIENDSHIP", "ROMANCE_OPPORTUNITY", "REUNION", "NEW_ACQUAINTANCE"].includes(e.kind) && e.npcId) {
        if (!mem.recurringNPCs.includes(e.npcId)) mem.recurringNPCs.push(e.npcId);
        if (e.kind !== "NEW_ACQUAINTANCE") mem.importantEvents.push(e.text.en);
      }
      if (e.scale !== "NONE") mem.memories.push(e.text.en);
      if (e.scale === "MAJOR" || e.kind === "NEW_ACQUAINTANCE") {
        state.memories.push({ date: { ...time.date }, age: Math.floor(state.age), text: `[${loc.name.en}] ${e.text.en}`, tags: ["world", loc.id, e.kind.toLowerCase()] });
      }
      if (ctx.trip && e.scale !== "NONE") ctx.trip.memories.push(`[${loc.name.en}] ${e.text.en}`);
    }
    if (mem.memories.length > 30) mem.memories.splice(0, mem.memories.length - 30);

    const shown = present.map((n) => n.id);
    return { ...base, present: shown, passersBy, events, nothingHappened: events.filter((e) => e.scale !== "NONE").length === 0 };
  }

  private rollLocationEvent(ctx: VisitContext, locationId: string, activityId: ActivityId, time: WorldTime): WorldEvent | undefined {
    const loc = getLocation(locationId);
    const candidates = (loc.events ?? []).filter((e) => (e.requires === "partner" ? ctx.withPartner : e.requires === "travel" ? !!ctx.trip : e.requires === "solo" ? !ctx.withPartner : true));
    if (!candidates.length) return undefined;
    const weights = candidates.map((e) => {
      let d = 0;
      for (const [k, w] of Object.entries(e.affinity ?? {})) d += (w as number) * (ctx.modifiers[k as LifeModifierKey] ?? 0);
      return e.weight * Math.exp(d);
    });
    const factors: ScoreFactor[] = [
      { name: "EVENTINESS", value: loc.eventiness },
      { name: "DESTINY", value: Math.exp(0.5 * (ctx.modifiers.opportunity ?? 0) + 0.3 * (ctx.modifiers.volatility ?? 0)) },
      { name: "ACTIVITY", value: 0.7 + getActivity(activityId).socialness * 0.6 },
    ];
    const p = clamp(factors.reduce((a, f) => a * f.value, 1), 0, 0.8);
    if (!ctx.rng.chance(p)) return undefined;
    // Something important that already happened here feels smaller (and rarer) the second time.
    const seen = ctx.world.locationMemory[locationId]?.importantEvents ?? [];
    const pick = ctx.rng.weighted(candidates.map((item, i) => ({ item, weight: weights[i] * (item.important && seen.includes(item.text.en) ? 0.2 : 1) })));
    const important = !!pick.important && !seen.includes(pick.text.en);
    return {
      kind: "LOCATION_EVENT",
      scale: important ? "MAJOR" : "SMALL",
      date: time.date,
      locationId,
      text: pick.text,
      payload: { eventId: pick.id, important },
      explanation: { probability: p, factors },
    };
  }
}

