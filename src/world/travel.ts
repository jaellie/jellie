/**
 * Travel = a temporary world instance: its own locations, temporary NPCs,
 * weather and memories. After the trip the instance dissolves, but location
 * memories, mementos and any contacts you kept remain.
 */
import type { GameDate } from "../core/gameDate";
import type { SeededRandom } from "../core/rng";
import { ENCOUNTER_RULES as R, getDestination, getLocation, type Destination } from "./catalog";
import type { WorldDecisionPolicy } from "./decisions";
import { resolveWorldEvent } from "./decisions";
import type { TravelState, WorldState } from "./types";
import { type VisitContext, type VisitResult, WorldEngine } from "./worldEngine";

export interface TripResult {
  trip: TravelState;
  visits: VisitResult[];
  keptContacts: string[];
}

export function startTrip(world: WorldState, destinationId: string, date: GameDate, rng: SeededRandom): TravelState {
  const d = getDestination(destinationId);
  const days = rng.int(d.days[0], d.days[1]);
  const day = Math.min(28 - days, Math.max(1, date.day ?? rng.int(1, 20)));
  const trip: TravelState = {
    active: true,
    destinationId,
    arrivalDate: { year: date.year, month: date.month, day },
    departureDate: { year: date.year, month: date.month, day: day + days },
    visitedLocations: [],
    temporaryNPCs: [],
    memories: [],
    mementos: [],
  };
  world.travel = trip;
  return trip;
}

/** Plan & play a whole trip: airport → hub → sights → airport. */
export function runTrip(
  ctx: Omit<VisitContext, "trip">,
  destinationId: string,
  date: GameDate,
  policy?: WorldDecisionPolicy,
  engine = new WorldEngine(),
): TripResult {
  const { world, rng, state } = ctx;
  const d: Destination = getDestination(destinationId);
  const trip = startTrip(world, destinationId, date, rng);
  const tctx: VisitContext = { ...ctx, trip };
  const visits: VisitResult[] = [];
  const at = (day: number) => ({ year: trip.arrivalDate.year, month: trip.arrivalDate.month, day });
  state.money -= d.cost;

  const visit = (locationId: string, day: number, hour: number, activityId?: string) => {
    const r = engine.visit(tctx, { locationId, date: at(day), hour, activityId });
    visits.push(r);
    if (policy) for (const e of r.events) if (e.choices?.length) resolveWorldEvent(e, policy.choose(e, state, world, rng), { state, world, modifiers: ctx.modifiers, rng });
    return r;
  };

  if (d.international) visit("airport", trip.arrivalDate.day!, 9, "wait");
  const nights = trip.departureDate.day! - trip.arrivalDate.day!;
  const sights = d.locations;
  for (let i = 0; i <= nights; i++) {
    const day = trip.arrivalDate.day! + i;
    const todays = rng.weightedSample(
      sights.map((id) => ({ item: id, weight: trip.visitedLocations.includes(id) ? 1 : 3 })),
      Math.min(2, sights.length),
    );
    todays.forEach((id, k) => {
      const loc = getLocation(id);
      const social = state.traits.sociability > 0.6 && loc.activities.includes("meet_people");
      const act = social ? "meet_people" : loc.activities.find((a) => ["sightseeing", "walk", "surf", "drink_coffee"].includes(a));
      visit(id, day, k === 0 ? 11 : 18, act);
    });
    if (d.hub !== sights[0]) visit(d.hub, day, 22, getLocation(d.hub).activities[0]);
  }
  if (d.international) visit("airport", trip.departureDate.day!, 20, "arrive");

  // Mementos: the destination's classic + photos from the trip.
  if (d.mementos.length) trip.mementos.push(d.mementos[rng.int(0, d.mementos.length - 1)].en);
  for (const v of visits) for (const e of v.events) if (e.payload?.eventId === "take_photo" || e.payload?.eventId === "shell") trip.mementos.push(e.text.en);

  const keptContacts = endTrip(world, rng);
  state.memories.push({
    date: { ...trip.arrivalDate },
    age: Math.floor(state.age),
    text: `Trip to ${d.name.en}: ${trip.visitedLocations.length} places${keptContacts.length ? `, kept in touch with ${keptContacts.map((id) => world.npcs[id]?.name).join(", ")}` : ""}.`,
    tags: ["travel", d.id],
  });
  return { trip, visits, keptContacts };
}

/** Dissolve the temporary world; keep memories and (some) contacts. */
export function endTrip(world: WorldState, rng: SeededRandom): string[] {
  const trip = world.travel;
  if (!trip) return [];
  const kept: string[] = [];
  for (const id of trip.temporaryNPCs) {
    const rel = world.relationships[id];
    const npc = world.npcs[id];
    if (rel && npc && rel.stage !== "STRANGER" && rng.chance(R.travelContactKeepChance + rel.closeness * 0.4)) {
      npc.persistence = "PERSISTENT";
      npc.schedule = undefined;
      npc.anchoredTo = undefined;
      rel.channel = "ONLINE";
      kept.push(id);
    } else {
      delete world.relationships[id];
      delete world.npcs[id];
      for (const k of Object.keys(world.encounters)) if (k.startsWith(`${id}@`)) delete world.encounters[k];
    }
  }
  for (const locId of trip.visitedLocations) {
    const loc = getLocation(locId);
    if (loc.region !== world.homeRegion) delete world.populated[locId];
    const mem = world.locationMemory[locId];
    if (mem) mem.recurringNPCs = mem.recurringNPCs.filter((id) => world.npcs[id]);
  }
  trip.active = false;
  world.pastTrips.push(trip);
  world.travel = undefined;
  return kept;
}
