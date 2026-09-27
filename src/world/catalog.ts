/**
 * Typed registries over data/world/*.json. The only place world data is loaded.
 */
import locationData from "../../data/world/locations.json";
import backgroundData from "../../data/world/backgrounds.json";
import activityData from "../../data/world/activities.json";
import npcTypeData from "../../data/world/npcTypes.json";
import destinationData from "../../data/world/destinations.json";
import climateData from "../../data/world/climate.json";
import ruleData from "../../data/world/encounterRules.json";
import type { Activity, ActivityId, EncounterType, Location, LocationBackground, LocationNPCPool, RelationshipOriginType, Season, Weather } from "./types";

export interface NpcTypeDef {
  id: string;
  kind: "STAFF" | "REGULAR" | "TRANSIENT";
  defaultWeight: number;
  originType: RelationshipOriginType;
  romanceEligible: boolean;
  foreignChance: number;
}

export interface Destination {
  id: string;
  name: { ko: string; en: string };
  country: string;
  international: boolean;
  hub: string;
  locations: string[];
  cost: number;
  days: [number, number];
  tags: string[];
  mementos: Array<{ ko: string; en: string }>;
}

export interface OverlayDef {
  kind: "tint" | "pattern" | "particles";
  color?: string;
  css?: string;
  sprite?: string;
}

export const LOCATIONS: Location[] = locationData.locations as unknown as Location[];
export const BACKGROUNDS: LocationBackground[] = backgroundData.backgrounds as unknown as LocationBackground[];
export const OVERLAYS = backgroundData.overlays as Record<string, OverlayDef>;
export const ART_DIRECTION = backgroundData.artDirection;
export const ACTIVITIES: Activity[] = activityData.activities as unknown as Activity[];
export const NPC_TYPES: NpcTypeDef[] = npcTypeData.types as NpcTypeDef[];
export const DESTINATIONS: Destination[] = destinationData.destinations as unknown as Destination[];
export const CLIMATE = climateData.regions as Record<string, Record<Season, Partial<Record<Weather, number>>>>;
export const ENCOUNTER_RULES = ruleData;

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
const locationMap = byId(LOCATIONS);
const backgroundMap = byId(BACKGROUNDS);
const activityMap = byId(ACTIVITIES);
const npcTypeMap = byId(NPC_TYPES);
const destinationMap = byId(DESTINATIONS);
const prototypeMap = new Map(LOCATIONS.filter((l) => l.prototypeId).map((l) => [l.prototypeId!, l]));

function must<T>(v: T | undefined, what: string, id: string): T {
  if (!v) throw new Error(`Unknown ${what} "${id}"`);
  return v;
}

export const getLocation = (id: string) => must(locationMap.get(id), "location", id);
export const findLocation = (id: string) => locationMap.get(id) ?? prototypeMap.get(id);
export const getBackground = (id: string) => must(backgroundMap.get(id), "background", id);
export const getActivity = (id: ActivityId) => must(activityMap.get(id), "activity", id);
export const getNpcType = (id: string) => must(npcTypeMap.get(id), "npc type", id);
export const getDestination = (id: string) => must(destinationMap.get(id), "destination", id);
export const backgroundsFor = (locationId: string) => BACKGROUNDS.filter((b) => b.locationId === locationId);

const poolOverrides = new Map((npcTypeData.pools as LocationNPCPool[]).map((p) => [p.locationId, p]));

/** Weighted NPC pool for a location (explicit override, else type defaults). */
export function npcPoolFor(locationId: string): LocationNPCPool {
  const o = poolOverrides.get(locationId);
  if (o) return o;
  const loc = getLocation(locationId);
  return { locationId, npcTypes: loc.npcPool.map((type) => ({ type, weight: getNpcType(type).defaultWeight })) };
}

export function locationsWithTag(tag: string): Location[] {
  return LOCATIONS.filter((l) => l.tags.includes(tag));
}

export function encounterTypeOfNpc(type: NpcTypeDef): EncounterType {
  if (type.kind === "STAFF") return "STAFF";
  if (type.kind === "REGULAR") return "RECURRING";
  return type.originType === "TRAVEL" ? "TRAVELER" : "STRANGER";
}

/** Referential integrity check used by tests and at dev start-up. */
export function validateCatalog(): string[] {
  const errors: string[] = [];
  for (const l of LOCATIONS) {
    if (l.backgrounds.length === 0) errors.push(`${l.id}: no backgrounds`);
    for (const b of l.backgrounds) if (!backgroundMap.has(b)) errors.push(`${l.id}: missing background ${b}`);
    for (const a of l.activities) if (!activityMap.has(a)) errors.push(`${l.id}: missing activity ${a}`);
    for (const t of l.npcPool) if (!npcTypeMap.has(t)) errors.push(`${l.id}: missing npc type ${t}`);
  }
  for (const b of BACKGROUNDS) if (!locationMap.has(b.locationId)) errors.push(`background ${b.id}: unknown location ${b.locationId}`);
  for (const p of poolOverrides.values()) for (const t of p.npcTypes) if (!npcTypeMap.has(t.type)) errors.push(`pool ${p.locationId}: unknown type ${t.type}`);
  for (const d of DESTINATIONS) for (const l of [d.hub, ...d.locations]) if (!locationMap.has(l)) errors.push(`destination ${d.id}: unknown location ${l}`);
  return errors;
}
