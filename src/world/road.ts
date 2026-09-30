/**
 * The life road: the play screen is one long road seen from behind, 2D pixel art. You walk through
 * your whole life on it; the people you share it with walk beside you — your partner once you're
 * together (not while you live apart), your kids, your pets. The road never cuts: only the backdrop
 * drifts (where you live, the season, the hour, the weather, the quiet countryside of old age), and
 * the places of the day pass by as roadside landmarks. Popups (photo + choices) appear over it.
 *
 * The engine decides *who* walks and *where*; the UI draws the road, scrolls it while `walking`, and
 * animates everyone's backs (slower steps for the old, little trots for pets).
 */
import type { LifeState } from "../sim/types";
import { getLocation } from "./catalog";
import { seasonOf, weatherFor } from "./clock";

type Bi = { ko: string; en: string };

export interface RoadWalker {
  who: string;
  role: "me" | "partner" | "kid" | "baby" | "pet";
  name?: string;
  gender?: "M" | "F";
  /** Sprite seed (stable per person). */
  seed: number;
  age?: number;
  /** pet_dog / pet_cat. */
  npcType?: string;
  /** Left-to-right position on the road (0 = leftmost). You are always in the middle of the group. */
  slot: number;
  /** Walking pace (1 = normal; the old walk slower, pets trot, a baby is carried). */
  pace: number;
  /** Holding hands with (who) — draw the hands joined. */
  holds?: string;
  /** Carried in someone's arms / a stroller pushed by `who`. */
  carriedBy?: string;
}

export type RoadTheme = "city" | "town" | "seaside" | "countryside" | "abroad" | "travel";

export interface RoadView {
  walkers: RoadWalker[];
  backdrop: {
    /** What lines the road: city blocks, a small town, the sea, fields (old age), a foreign city, a trip. */
    theme: RoadTheme;
    season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
    timeOfDay: "MORNING" | "DAY" | "EVENING" | "NIGHT";
    weather: string;
    /** Where the road is (for a foreign city skyline / signs): Korean or English per language. */
    city: string;
    country: string;
  };
  /** Today's place, passing by at the roadside (a café, the office, the hospital…). */
  landmark?: { id: string; type: string; name: string };
  /** False while a popup is open or the day is over (stop scrolling, everyone stands still). */
  walking: boolean;
}

const SEASIDE = ["Busan", "Jeju", "Gangneung", "Sokcho", "Yeosu", "Pohang", "Ulsan"];

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

function timeOfDay(minute: number): RoadView["backdrop"]["timeOfDay"] {
  const h = minute / 60;
  return h < 11 ? "MORNING" : h < 17 ? "DAY" : h < 20 ? "EVENING" : "NIGHT";
}

export function buildRoad(
  state: LifeState,
  opts: { minute: number; locationId?: string; walking: boolean; lang: "ko" | "en"; seed: number; cityName: (c: string) => string; countryName: (c: string) => string },
): RoadView {
  const w = state.world;
  const year = state.date.year;
  const age = Math.floor(state.age);
  const me: RoadWalker = { who: "me", role: "me", gender: state.birth.sex === "MALE" ? "M" : "F", seed: 0, age, slot: 0, pace: age >= 75 ? 0.6 : age >= 65 ? 0.8 : 1 };
  const left: RoadWalker[] = [];
  const right: RoadWalker[] = [];
  // Your partner walks beside you (holding your hand) — unless you still live in different places.
  const pid = state.relationship.partnerId;
  const together = (state.relationship.status === "DATING" || state.relationship.status === "MARRIED") && !!pid && !state.relationship.longDistance;
  if (together && pid) {
    const n = w?.npcs[pid];
    const pn = state.npcs.find((x) => x.id === pid);
    const pAge = n ? year - n.birthYear : pn ? year - pn.birth.year : age;
    const sex = n?.sex ?? pn?.birth.sex;
    left.push({ who: "partner", role: "partner", name: n?.name ?? pn?.name, gender: sex === "MALE" ? "M" : sex === "FEMALE" ? "F" : undefined, seed: n?.spriteSeed ?? hash(pid) % 1_000_000, age: pAge, slot: 0, pace: pAge >= 75 ? 0.6 : pAge >= 65 ? 0.8 : 1, holds: "me" });
    me.holds = "partner";
  }
  // Kids walk with you until they grow up and leave home; a baby is carried.
  for (const k of state.kids ?? []) {
    const kAge = year - k.bornYear;
    if (kAge >= 20) continue;
    const kid: RoadWalker = { who: k.id, role: kAge < 2 ? "baby" : "kid", name: k.name, gender: k.sex === "MALE" ? "M" : "F", seed: k.spriteSeed, age: kAge, slot: 0, pace: kAge < 2 ? 1 : 1.15 };
    if (kAge < 2) kid.carriedBy = together ? "partner" : "me";
    else if (kAge < 8 && !right.some((x) => x.holds === "me")) (kid.holds = "me");
    right.push(kid);
  }
  // Pets trot along at the edge.
  for (const p of (state.pets ?? []).filter((x) => x.alive)) right.push({ who: p.id, role: "pet", name: p.name, npcType: p.species === "DOG" ? "pet_dog" : "pet_cat", seed: p.spriteSeed, slot: 0, pace: 1.3 });
  const walkers = [...left, me, ...right].map((x, i) => ({ ...x, slot: i }));

  // The backdrop drifts slowly: where you live, the season, the hour, the weather — and old age's quiet fields.
  const trip = w?.travel;
  const abroad = state.location.country !== (state.homeCountry || "Korea");
  const theme: RoadTheme = trip ? "travel" : abroad ? "abroad" : age >= 65 ? "countryside" : SEASIDE.includes(state.location.city) ? "seaside" : state.location.city === "Seoul" ? "city" : "town";
  const date = { year, month: state.date.month, day: state.date.day ?? 15 };
  const loc = opts.locationId ? getLocation(opts.locationId) : undefined;
  const landmark = loc && loc.id !== "home" && !loc.online ? { id: loc.id, type: loc.type, name: loc.name[opts.lang] } : undefined;
  return {
    walkers,
    backdrop: {
      theme,
      season: seasonOf(date.month),
      timeOfDay: timeOfDay(opts.minute),
      weather: weatherFor(opts.seed, date, loc?.region ?? "home_city"),
      city: opts.lang === "ko" ? opts.cityName(state.location.city) : state.location.city,
      country: opts.countryName(state.location.country),
    },
    landmark,
    walking: opts.walking,
  };
}

export type { Bi };
