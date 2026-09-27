/**
 * World NPCs: persistent regulars/staff with simple schedules, and temporary
 * transients. Regulars are generated lazily the first time the player goes
 * somewhere, then persist — which is what makes recurring encounters possible.
 */
import type { GameDate } from "../core/gameDate";
import type { SeededRandom } from "../core/rng";
import { ENCOUNTER_RULES, getLocation, getNpcType, npcPoolFor, type NpcTypeDef } from "./catalog";
import type { Location, NPCSchedule, ScheduleBlock, WorldNpc, WorldState, WorldTime } from "./types";

const LOCAL_NAMES = {
  MALE: ["서준", "도윤", "하준", "지호", "민재", "현우", "태오", "시우", "준서", "Ren", "건우", "우진", "선우", "유찬", "은호", "승민", "재윤", "지훈", "민호", "태민"],
  FEMALE: ["지우", "서아", "하린", "유나", "소희", "민지", "채원", "윤슬", "세라", "Mia", "수아", "예린", "다은", "가은", "하윤", "지안", "서윤", "나연", "보라", "은비"],
};
const FOREIGN_NAMES = {
  MALE: ["Alex", "Leo", "Theo", "Lucas", "Hugo", "Kai", "Daniel", "Noah", "Sam", "Julien"],
  FEMALE: ["Emma", "Chloé", "Nina", "Léa", "Sophie", "Maya", "Ella", "Camille", "Rin", "Ava"],
};

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
}

function ageFor(t: NpcTypeDef, around: number, rng: SeededRandom): number {
  if (/student|classmate/.test(t.id)) return rng.int(19, 27);
  if (/professor|manager|doctor/.test(t.id)) return rng.int(38, 60);
  if (t.kind === "STAFF") return rng.int(22, 50);
  return Math.max(18, Math.min(80, Math.round(around + rng.range(-8, 8))));
}

export function generateNpc(world: WorldState, rng: SeededRandom, spawn: NpcSpawn): WorldNpc {
  const t = getNpcType(spawn.type);
  const sex = rng.chance(0.5) ? "MALE" : "FEMALE";
  const foreign = spawn.region !== world.homeRegion && spawn.region !== "coast" ? rng.chance(0.85) : rng.chance(t.foreignChance);
  // Avoid giving a new NPC the same name as someone the player already knows.
  const known = new Set(Object.keys(world.relationships).map((id) => world.npcs[id]?.name));
  const all = foreign ? FOREIGN_NAMES[sex] : LOCAL_NAMES[sex];
  const names = all.filter((n) => !known.has(n)).length ? all.filter((n) => !known.has(n)) : all;
  const age = ageFor(t, spawn.aroundAge, rng);
  const npc: WorldNpc = {
    id: `w${world.nextNpcId++}`,
    name: names[rng.int(0, names.length - 1)],
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
export function populateLocation(world: WorldState, locationId: string, rng: SeededRandom, date: GameDate, aroundAge: number, persistence: WorldNpc["persistence"] = "PERSISTENT"): string[] {
  if (world.populated[locationId]) return world.populated[locationId];
  const loc = getLocation(locationId);
  const pool = npcPoolFor(locationId).npcTypes;
  const ids: string[] = [];
  for (const entry of pool) {
    const t = getNpcType(entry.type);
    if (t.kind === "STAFF") {
      const n = entry.weight >= 10 && rng.chance(0.5) ? 2 : 1;
      for (let i = 0; i < n; i++) ids.push(generateNpc(world, rng, { type: t.id, region: loc.region, date, aroundAge, persistence, anchoredTo: loc.id }).id);
    }
  }
  const regularTypes = pool.filter((e) => getNpcType(e.type).kind === "REGULAR");
  const counts = ENCOUNTER_RULES.regularsPerLocation as Record<string, number>;
  const n = regularTypes.length ? counts[loc.type] ?? counts.default : 0;
  for (let i = 0; i < n; i++) {
    const type = rng.weighted(regularTypes.map((e) => ({ item: e.type, weight: e.weight })));
    ids.push(generateNpc(world, rng, { type, region: loc.region, date, aroundAge, persistence, schedule: withDailyLife(regularBlock(loc, rng)) }).id);
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
    const npc = generateNpc(world, rng, { type, region: loc.region, date, aroundAge, persistence: "TEMPORARY" });
    delete world.npcs[npc.id]; // ephemeral until something happens
    out.push(npc);
  }
  return out;
}

export function npcAge(npc: WorldNpc, date: GameDate): number {
  return date.year - npc.birthYear - (date.month < npc.birthMonth ? 1 : 0);
}
