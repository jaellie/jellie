/**
 * World NPCs: persistent regulars/staff with simple schedules, and temporary
 * transients. Regulars are generated lazily the first time the player goes
 * somewhere, then persist — which is what makes recurring encounters possible.
 */
import type { GameDate } from "../core/gameDate";
import type { SeededRandom } from "../core/rng";
import { ENCOUNTER_RULES, getLocation, getNpcType, npcPoolFor, type NpcTypeDef } from "./catalog";
import { cultureOf, pickName } from "./names";
import type { Location, NPCSchedule, ScheduleBlock, WorldNpc, WorldState, WorldTime } from "./types";

/** Where a region is (trips abroad); home regions are wherever you live now. */
const REGION_COUNTRY: Record<string, string> = { paris: "France", tokyo: "Japan" };
/** Foreigners you might meet: in Korea mostly English speakers; abroad, sometimes a fellow Korean. */
const VISITOR_CULTURES = ["ANGLO", "ANGLO", "ANGLO", "JP", "FR", "DE", "ES", "CN"];

export function createWorldState(homeRegion = "home_city"): WorldState {
  return {
    homeRegion,
    npcs: {},
    encounters: {},
    relationships: {},
    locationMemory: {},
    populated: {},
    habits: {},
    experience: {},
    pastTrips: [],
    nextNpcId: 1,
  };
}

export interface NpcSpawn {
  type: string;
  region: string;
  date: GameDate;
  aroundAge: number;
  persistence: WorldNpc["persistence"];
  anchoredTo?: string;
  schedule?: NPCSchedule;
  /** Age bands of the place ([min, max, weight]); without it the NPC is a peer of `aroundAge`. */
  ageMix?: Array<[number, number, number]>;
  /** A person of this sex (a partner who must match who you like). Random otherwise. */
  sex?: "MALE" | "FEMALE";
  /** Where they're from ("Korea", "JP"…); otherwise where they are. */
  country?: string;
}

type AgeBand = [number, number, number];
const CROWDS = ENCOUNTER_RULES.crowds as unknown as { ageMix: Record<string, AgeBand[]>; tenureYears: [number, number]; staffAge: [number, number]; minAgeToBefriend: number };

/** The age mix of a kind of place (online communities keep peers near your age). */
export function ageMixFor(location: Location): AgeBand[] | undefined {
  if (location.online) return undefined;
  return CROWDS.ageMix[location.type] ?? CROWDS.ageMix.default;
}

function ageFor(t: NpcTypeDef, spawn: NpcSpawn, rng: SeededRandom): number {
  if (/student|classmate/.test(t.id)) return rng.int(19, 27);
  if (/professor|manager|doctor/.test(t.id)) return rng.int(38, 60);
  if (t.kind === "STAFF") return rng.int(CROWDS.staffAge[0], CROWDS.staffAge[1]);
  if (spawn.ageMix?.length) {
    const [lo, hi] = rng.weighted(spawn.ageMix.map((b) => ({ item: b, weight: b[2] })));
    return rng.int(lo, hi);
  }
  return Math.max(18, Math.min(80, Math.round(spawn.aroundAge + rng.range(-8, 8))));
}

export function generateNpc(world: WorldState, rng: SeededRandom, spawn: NpcSpawn): WorldNpc {
  const t = getNpcType(spawn.type);
  const sex = spawn.sex ?? (rng.chance(0.5) ? "MALE" : "FEMALE");
  // Names follow the place: locals of where this is (where you live, or the trip's city), sometimes a visitor.
  const here = cultureOf(REGION_COUNTRY[spawn.region] ?? world.country ?? "Korea");
  const online = spawn.region === "online";
  const visitor = online ? rng.chance(0.5) : rng.chance(t.foreignChance >= 1 ? 1 : here === "KR" ? t.foreignChance : 0.12);
  const culture = spawn.country ? cultureOf(spawn.country) : visitor ? (here === "KR" ? VISITOR_CULTURES[rng.int(0, VISITOR_CULTURES.length - 1)] : "KR") : here;
  const foreign = culture !== "KR";
  // Avoid giving a new NPC the same name as someone the player already knows.
  const known = [...Object.keys(world.relationships).map((id) => world.npcs[id]?.name), ...Object.values(world.npcs).filter((n) => n.fated || n.deceased).map((n) => n.name)];
  const age = ageFor(t, spawn, rng);
  const npc: WorldNpc = {
    id: `w${world.nextNpcId++}`,
    name: pickName(sex, culture, rng, known),
    type: t.id,
    sex,
    birthYear: spawn.date.year - age,
    birthMonth: rng.int(1, 12),
    birthDay: rng.int(1, 28),
    region: spawn.region,
    persistence: spawn.persistence,
    schedule: spawn.schedule,
    anchoredTo: spawn.anchoredTo,
    single: rng.chance(age < 30 ? 0.65 : age < 40 ? 0.4 : 0.25),
    warmth: rng.range(0.2, 1),
    spriteSeed: rng.int(0, 1_000_000),
    foreign,
    since: spawn.date.year,
  };
  world.npcs[npc.id] = npc;
  return npc;
}

// ---- Schedules --------------------------------------------------------------

/** Fixed class/session slots for CLASS/HOBBY locations, deterministic per location id. */
export function sessionSlot(location: Location): ScheduleBlock {
  let h = 0;
  for (const c of location.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const weekend = location.type === "HOBBY" || h % 3 === 0;
  const start = weekend ? 10 + (h % 4) : 19;
  return { locationId: location.id, startHour: start, endHour: start + 2, days: weekend ? [6] : [2 + (h % 3)], attendance: 0.85 };
}

/** When the player habitually goes somewhere (used by the routine). */
export function habitSlot(location: Location, rng: SeededRandom): ScheduleBlock {
  switch (location.type) {
    case "CLASS":
    case "HOBBY":
      return sessionSlot(location);
    case "GYM":
      return { locationId: location.id, startHour: 19, endHour: 20, days: [1, 3, 5] };
    case "ONLINE":
      return { locationId: location.id, startHour: 21, endHour: 22 };
    case "UNIVERSITY":
    case "WORKPLACE":
      return { locationId: location.id, startHour: 10, endHour: 17, days: [1, 2, 3, 4, 5] };
    case "PARK":
      return { locationId: location.id, startHour: 8, endHour: 9, days: [6, 0] };
    default:
      return { locationId: location.id, startHour: 14 + rng.int(0, 3), endHour: 17, days: [6, 0] };
  }
}

function regularBlock(location: Location, rng: SeededRandom): { weekday: ScheduleBlock[]; weekend: ScheduleBlock[] } {
  const att = ENCOUNTER_RULES.regularAttendance;
  if (location.type === "CLASS" || location.type === "HOBBY") {
    const s = sessionSlot(location);
    const b = { ...s, attendance: s.attendance ?? att };
    return (s.days ?? []).some((d) => d === 0 || d === 6) ? { weekday: [], weekend: [b] } : { weekday: [b], weekend: [] };
  }
  if (location.type === "WORKPLACE" || location.type === "UNIVERSITY") {
    return { weekday: [{ locationId: location.id, startHour: 9, endHour: 18, attendance: 0.9 }], weekend: [] };
  }
  if (location.type === "ONLINE") {
    return { weekday: [{ locationId: location.id, startHour: 19, endHour: 24, attendance: 0.5 }], weekend: [{ locationId: location.id, startHour: 12, endHour: 24, attendance: 0.5 }] };
  }
  // Gyms, cafés, parks…: a personal habit window on some days.
  const r = rng.next();
  const start = r < 0.55 ? rng.int(18, 20) : r < 0.85 ? rng.int(6, 8) : rng.int(11, 15);
  const days = [1, 2, 3, 4, 5].filter(() => rng.chance(0.6));
  const weekday = days.length ? [{ locationId: location.id, startHour: start, endHour: start + rng.int(1, 2), days, attendance: att }] : [];
  const weekend = rng.chance(0.4) ? [{ locationId: location.id, startHour: rng.int(9, 15), endHour: 0, days: [rng.chance(0.5) ? 6 : 0], attendance: att }] : [];
  for (const w of weekend) w.endHour = w.startHour + 2;
  return { weekday, weekend };
}

/** Wrap location blocks with home/work filler so schedules read naturally (e.g. "Ren: 07–08 home, 09–18 office, 18:30 gym"). */
function withDailyLife(core: { weekday: ScheduleBlock[]; weekend: ScheduleBlock[] }): NPCSchedule {
  return {
    weekday: [{ locationId: "home", startHour: 7, endHour: 8 }, ...core.weekday, { locationId: "home", startHour: 22, endHour: 24 }],
    weekend: [...core.weekend],
  };
}

export function isPresent(npc: WorldNpc, locationId: string, t: WorldTime, rng: SeededRandom): boolean {
  if (npc.deceased || npc.moved) return false;
  if (npc.anchoredTo === locationId) {
    const loc = getLocation(locationId);
    const works = t.hour >= loc.availableHours.start && t.hour < loc.availableHours.end;
    return works && rng.chance(0.8);
  }
  if (!npc.schedule) return false;
  const weekend = t.weekday === 0 || t.weekday === 6;
  const blocks = weekend ? npc.schedule.weekend : npc.schedule.weekday;
  for (const b of blocks) {
    if (b.locationId !== locationId) continue;
    if (b.days && !b.days.includes(t.weekday)) continue;
    // Allow ±1h of overlap: people arrive a bit early/late.
    if (t.hour + 1 < b.startHour || t.hour > b.endHour) continue;
    return rng.chance(b.attendance ?? 1);
  }
  return false;
}

/** Generate a location's staff + regulars once. */
/** Someone the player actually knows (or the destined person) — they stay, and age with the player. */
function bonded(world: WorldState, npc: WorldNpc): boolean {
  const stage = world.relationships[npc.id]?.stage;
  return !!npc.fated || (!!stage && stage !== "STRANGER" && stage !== "FAMILIAR_FACE");
}

/**
 * Strangers don't grow old alongside the player: after a few years (per person) or once they
 * outgrow the place, they move on and someone new — of the place's usual ages — takes their spot.
 */
function refreshCrowd(world: WorldState, locationId: string, rng: SeededRandom, date: GameDate, aroundAge: number): string[] {
  const loc = getLocation(locationId);
  const mix = ageMixFor(loc);
  const maxAge = mix ? Math.max(...mix.map((b) => b[1])) : 200;
  const [tMin, tMax] = CROWDS.tenureYears;
  const ids = world.populated[locationId];
  const out: string[] = [];
  for (const id of ids) {
    const npc = world.npcs[id];
    const staff = npc ? getNpcType(npc.type).kind === "STAFF" : false;
    if (npc && !npc.deceased && !npc.moved && bonded(world, npc)) {
      // People you know stay and age with you — until they retire (staff) or outgrow the place.
      const tooOld = npcAge(npc, date) > (staff ? CROWDS.staffAge[1] + 4 : maxAge + 8);
      if (!tooOld) {
        out.push(id);
        continue;
      }
      if (staff) npc.anchoredTo = undefined; // retired: still someone you know, just not behind the counter
    }
    if (npc) npc.since ??= date.year;
    const tenure = npc ? tMin + (npc.spriteSeed % (tMax - tMin + 1)) : 0;
    const ageCap = staff ? CROWDS.staffAge[1] + 4 : maxAge + 3;
    const stays = npc && !bonded(world, npc) && !npc.deceased && !npc.moved && date.year - (npc.since ?? date.year) <= tenure && npcAge(npc, date) <= ageCap;
    if (stays) {
      out.push(id);
      continue;
    }
    if (npc && !bonded(world, npc)) npc.moved = true;
    const type = npc?.type ?? npcPoolFor(locationId).npcTypes[0]?.type;
    if (!type) continue;
    const t = getNpcType(type);
    const fresh = generateNpc(world, rng, {
      type,
      region: loc.region,
      date,
      aroundAge,
      persistence: npc?.persistence ?? "PERSISTENT",
      anchoredTo: t.kind === "STAFF" ? loc.id : undefined,
      schedule: t.kind === "STAFF" ? undefined : withDailyLife(regularBlock(loc, rng)),
      ageMix: mix,
    });
    out.push(fresh.id);
  }
  world.populated[locationId] = out;
  return out;
}

export function populateLocation(world: WorldState, locationId: string, rng: SeededRandom, date: GameDate, aroundAge: number, persistence: WorldNpc["persistence"] = "PERSISTENT"): string[] {
  if (world.populated[locationId]) return refreshCrowd(world, locationId, rng, date, aroundAge);
  const loc = getLocation(locationId);
  const ageMix = ageMixFor(loc);
  const pool = npcPoolFor(locationId).npcTypes;
  const ids: string[] = [];
  for (const entry of pool) {
    const t = getNpcType(entry.type);
    if (t.kind === "STAFF") {
      const n = entry.weight >= 10 && rng.chance(0.5) ? 2 : 1;
      for (let i = 0; i < n; i++) ids.push(generateNpc(world, rng, { type: t.id, region: loc.region, date, aroundAge, persistence, anchoredTo: loc.id, ageMix }).id);
    }
  }
  const regularTypes = pool.filter((e) => getNpcType(e.type).kind === "REGULAR");
  const counts = ENCOUNTER_RULES.regularsPerLocation as Record<string, number>;
  const n = regularTypes.length ? counts[loc.type] ?? counts.default : 0;
  for (let i = 0; i < n; i++) {
    const type = rng.weighted(regularTypes.map((e) => ({ item: e.type, weight: e.weight })));
    ids.push(generateNpc(world, rng, { type, region: loc.region, date, aroundAge, persistence, schedule: withDailyLife(regularBlock(loc, rng)), ageMix }).id);
  }
  world.populated[locationId] = ids;
  return ids;
}

/** One-off passers-by drawn from the location's pool (not stored unless a bond forms). */
export function drawTransients(world: WorldState, locationId: string, rng: SeededRandom, date: GameDate, aroundAge: number, count: number): WorldNpc[] {
  const pool = npcPoolFor(locationId).npcTypes.filter((e) => getNpcType(e.type).kind === "TRANSIENT");
  if (!pool.length || count <= 0) return [];
  const loc = getLocation(locationId);
  const out: WorldNpc[] = [];
  for (let i = 0; i < count; i++) {
    const type = rng.weighted(pool.map((e) => ({ item: e.type, weight: e.weight })));
    const npc = generateNpc(world, rng, { type, region: loc.region, date, aroundAge, persistence: "TEMPORARY", ageMix: ageMixFor(loc) });
    delete world.npcs[npc.id]; // ephemeral until something happens
    out.push(npc);
  }
  return out;
}

/** You only know someone's name once you've actually met them (not a stranger / familiar face). */
export function knowsName(world: WorldState | undefined, npcId: string): boolean {
  const stage = world?.relationships[npcId]?.stage;
  return !!stage && stage !== "STRANGER" && stage !== "FAMILIAR_FACE";
}

export function npcAge(npc: WorldNpc, date: GameDate): number {
  return date.year - npc.birthYear - (date.month < npc.birthMonth ? 1 : 0);
}
