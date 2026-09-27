/**
 * Living-world types. A Location is a simulation context (background +
 * activities + NPC pool + schedules + encounters + memory), not an image.
 */
import type { GameDate } from "../core/gameDate";
import type { LifeModifierKey } from "../core/lifeModifiers";
import type { Requirement } from "../sim/opportunity";

export type LocationType =
  | "HOME"
  | "CITY"
  | "CAFE"
  | "GYM"
  | "UNIVERSITY"
  | "WORKPLACE"
  | "RESTAURANT"
  | "BEACH"
  | "PARK"
  | "LIBRARY"
  | "CLASS"
  | "HOBBY"
  | "AIRPORT"
  | "HOTEL"
  | "TOURIST_SITE"
  | "ONLINE"
  | "FAMILY_HOME"
  | "HOSPITAL"
  | "WEDDING_VENUE"
  | "ENTERTAINMENT";

export type ActivityId = string;
export type TimeOfDay = "MORNING" | "DAY" | "EVENING" | "NIGHT";
export type Weather = "CLEAR" | "CLOUDY" | "RAIN" | "SNOW";
export type Season = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

export type EncounterType =
  | "STRANGER"
  | "RECURRING"
  | "STAFF"
  | "FRIEND_OF_FRIEND"
  | "ROMANTIC"
  | "PROFESSIONAL"
  | "TRAVELER";

export interface BackgroundLayer {
  id: string;
  kind: "sky" | "architecture" | "foreground" | "environment" | "npc_slot" | "interactive" | "overlay";
  assetPath?: string;
  /** Procedural painter id, e.g. "ROOMS.cafe" in the Claude Design prototype. */
  renderer?: string;
  z?: number;
}

export interface LocationBackground {
  id: string;
  locationId: string;
  /** Omitted fields mean "any" — a less specific fallback. */
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  season?: Season;
  /** Activity-specific framing (e.g. cafe_window for sit_alone). */
  activities?: ActivityId[];
  assetPath: string;
  /** Procedural renderer used until/instead of a bitmap (prototype: ROOMS.<id>). */
  renderer?: string;
  layers?: BackgroundLayer[];
  /** "procedural" = drawn in code today, "planned" = bitmap to be produced, "ready" = bitmap exists. */
  status?: "procedural" | "planned" | "ready";
}

export interface Location {
  id: string;
  name: { ko: string; en: string };
  type: LocationType;
  /** Background ids (see data/world/backgrounds.json). */
  backgrounds: string[];
  activities: ActivityId[];
  /** NPC type ids (see npcPools). */
  npcPool: string[];
  encounterTypes: EncounterType[];
  tags: string[];
  availableHours: { start: number; end: number };
  seasonalAvailability?: Season[];
  travelRequirements?: Requirement[];
  travelCost?: number;
  /** City/region this belongs to (weather + travel instance grouping). */
  region: string;
  /** Standing positions (isometric grid, same convention as the prototype's SPOTS). */
  spots?: Array<[number, number]>;
  /** Legacy id in the Claude Design prototype (ROOMS/WBG/SPOTS key). */
  prototypeId?: string;
  /** Location-specific small events (never forced; weights relative to "nothing"). */
  events?: LocationEventDef[];
  /** Base chance per visit that *anything* happens (the rest is "nothing"). */
  eventiness: number;
  /** Online contexts can convert to offline meetings. */
  online?: boolean;
}

export interface LocationEventDef {
  id: string;
  weight: number;
  text: { ko: string; en: string };
  affinity?: Partial<Record<LifeModifierKey, number>>;
  /** Tags written into memory. */
  tags?: string[];
  important?: boolean;
  /** Needs a partner present / a trip etc. */
  requires?: "partner" | "travel" | "solo";
}

export interface Activity {
  id: ActivityId;
  name: { ko: string; en: string };
  durationHours: number;
  cost: number;
  /** 0..1 how much this activity involves other people. */
  socialness: number;
  /** Experience tags accumulated (fitness, cooking, language, surf…). */
  experience?: string[];
  /** Which modifier keys make encounters during this activity likelier. */
  affinity?: Partial<Record<LifeModifierKey, number>>;
  /** Encounter kinds this activity favors. */
  favors?: EncounterType[];
  /** Makes the location a habit (e.g. buying a gym membership). */
  startsHabit?: boolean;
}

export interface ScheduleBlock {
  startHour: number;
  endHour: number;
  locationId: string;
  activityId?: ActivityId;
  /** 0=Sun … 6=Sat. Omitted = every day in the block's weekday/weekend set. */
  days?: number[];
  /** Chance the NPC actually shows up. */
  attendance?: number;
}

export interface NPCSchedule {
  weekday: ScheduleBlock[];
  weekend: ScheduleBlock[];
}

export interface LocationNPCPool {
  locationId: string;
  npcTypes: Array<{ type: string; weight: number }>;
}

export interface WorldNpc {
  id: string;
  name: string;
  /** NPC type id: trainer, regular_member, tourist, … */
  type: string;
  sex: "MALE" | "FEMALE";
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  /** Home region; travel NPCs live elsewhere. */
  region: string;
  /** Persistent NPCs recur; temporary ones exist only inside a trip or a single visit. */
  persistence: "PERSISTENT" | "TEMPORARY";
  schedule?: NPCSchedule;
  /** Staff NPCs are anchored to a location during its hours. */
  anchoredTo?: string;
  single: boolean;
  /** 0..1 how outgoing — affects how fast they open up. */
  warmth: number;
  spriteSeed: number;
  foreign: boolean;
}

export type RelationshipStage =
  | "STRANGER"
  | "FAMILIAR_FACE"
  | "ACQUAINTANCE"
  | "FRIEND"
  | "CLOSE_FRIEND"
  | "ROMANTIC_INTEREST"
  | "PARTNER"
  | "EX"
  | "LOST_CONTACT";

export type RelationshipOriginType =
  | "FRIEND"
  | "FRIEND_OF_FRIEND"
  | "COWORKER"
  | "CLASSMATE"
  | "GYM"
  | "PERSONAL_TRAINER"
  | "COOKING_CLASS"
  | "SURFING"
  | "CAFE"
  | "LIBRARY"
  | "TRAVEL"
  | "AIRPORT"
  | "HOTEL"
  | "ONLINE_COMMUNITY"
  | "LANGUAGE_EXCHANGE_APP"
  | "SOCIAL_MEDIA"
  | "DATING_APP"
  | "NEIGHBOR"
  | "FAMILY_CONNECTION"
  | "PROFESSIONAL_NETWORKING"
  | "OLD_FRIEND"
  | "FORMER_CLASSMATE"
  | "RECURRING_STRANGER"
  | "RANDOM_ENCOUNTER";

export interface RelationshipOrigin {
  type: RelationshipOriginType;
  locationId?: string;
  firstEncounterDate: GameDate;
  firstEncounterContext?: string;
}

export interface EncounterHistory {
  npcId: string;
  locationId: string;
  firstSeen: GameDate;
  lastSeen: GameDate;
  encounterCount: number;
  /** 0..1 */
  familiarity: number;
}

export interface WorldRelationship {
  npcId: string;
  stage: RelationshipStage;
  /** 0..1 closeness. */
  closeness: number;
  /** 0..1 romantic tension (only grows when both could be interested). */
  spark: number;
  conversations: number;
  origin: RelationshipOrigin;
  lastContact: GameDate;
  channel: "IN_PERSON" | "ONLINE";
  metOffline: boolean;
  lastInvite?: GameDate;
}

export interface LocationMemory {
  locationId: string;
  visitCount: number;
  firstVisit?: GameDate;
  lastVisit?: GameDate;
  importantEvents: string[];
  recurringNPCs: string[];
  memories: string[];
}

export interface TravelState {
  active: boolean;
  destinationId: string;
  arrivalDate: GameDate;
  departureDate: GameDate;
  visitedLocations: string[];
  temporaryNPCs: string[];
  memories: string[];
  mementos: string[];
}

/** Precise in-world moment used for schedules, backgrounds and hours. */
export interface WorldTime {
  date: GameDate & { day: number };
  hour: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  season: Season;
  timeOfDay: TimeOfDay;
  weather: Weather;
}

export interface WorldState {
  /** Region the player currently lives in (home base). */
  homeRegion: string;
  npcs: Record<string, WorldNpc>;
  /** "npcId@locationId" → history */
  encounters: Record<string, EncounterHistory>;
  relationships: Record<string, WorldRelationship>;
  locationMemory: Record<string, LocationMemory>;
  /** Locations whose regulars have been generated. */
  populated: Record<string, string[]>;
  /** Habitual locations → activity (gym membership, class enrollment…). */
  habits: Record<string, { activityId: ActivityId; since: GameDate; perMonth: number }>;
  experience: Record<string, number>;
  travel?: TravelState;
  pastTrips: TravelState[];
  /** Destinations the player decided to visit (processed by the routine). */
  pendingTrips?: string[];
  nextNpcId: number;
}
