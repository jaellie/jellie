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
import { type Sky, skyAt } from "./sky";
import type { LifeState } from "../sim/types";
import { getDestination, getLocation } from "./catalog";
import { seasonOf, weatherFor } from "./clock";
import skylineData from "../../data/world/skylines.json";
import { findPlace } from "../destiny/birthplace";

type SkylineDef = { id: string; ko: string; en: string; landmarks: Bi[]; street: Bi[]; palette: { sky: string; buildings: string; accent: string } };
const SKYLINES = new Map((skylineData.cities as SkylineDef[]).map((c) => [c.id, c]));
const GENERIC = skylineData.generic as Record<"korea" | "world", SkylineDef>;
/** Trip destinations → their city. */
const TRIP_CITY: Record<string, string> = { paris: "paris", tokyo: "tokyo", coast: "busan" };

/** The skyline and street vibe for a city (top-50 list), else a generic Korean or foreign city. */
export function skylineFor(city: string, country: string, lang: "ko" | "en"): Skyline {
  const place = findPlace(city);
  const def = (place && SKYLINES.get(place.id)) ?? (country === "Korea" || place?.country === "KR" ? GENERIC.korea : GENERIC.world);
  return { id: def.id, name: def[lang], landmarks: def.landmarks.map((x) => x[lang]), street: def.street.map((x) => x[lang]), palette: def.palette, generic: def.id === "korea" || def.id === "world" };
}

export interface Skyline {
  /** City id (e.g. "seoul", "tokyo", "paris"), or "korea" / "world" for a generic city. */
  id: string;
  name: string;
  /** Landmarks on the horizon (N서울타워, 에펠탑, 자유의 여신상…). */
  landmarks: string[];
  /** Street props that line the road — the city's own street feel (편의점, 자판기, 노란 택시…). */
  street: string[];
  palette: { sky: string; buildings: string; accent: string };
  generic: boolean;
}

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
  /** Long distance: they walk with you in your heart — draw them a little faded (about 55% opacity). */
  apart?: boolean;
}

export type RoadTheme = "city" | "town" | "seaside" | "countryside" | "abroad" | "travel";

export interface RoadView {
  walkers: RoadWalker[];
  backdrop: {
    /** What lines the road: city blocks, a small town, the sea, fields (old age), a foreign city, a trip. */
    theme: RoadTheme;
    season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
    /**
     * How every roadside tree looks right now — use this, never a color fixed when the tree appeared
     * (trees already on screen must change with the season too): spring blossoms, summer green,
     * autumn red/orange, winter bare branches with snow. `ground` is the grass/field color.
     */
    trees: { look: "blossom" | "green" | "autumn" | "bare"; leaf: string; snow: boolean; ground: string };
    timeOfDay: "MORNING" | "DAY" | "EVENING" | "NIGHT";
    weather: string;
    /** The sky right now: a rich gradient (dawn → morning → afternoon → sunset → dusk → night), sun/moon, stars, and what may fly by (see sky.ts). */
    sky: Sky;
    /** The city's skyline and street vibe (top-50 cities; generic otherwise). */
    skyline: Skyline;
    /** Where the road is (for a foreign city skyline / signs): Korean or English per language. */
    city: string;
    country: string;
    /**
     * Which side the sea is on (seaside towns: Busan, Jeju…). Then big buildings stand on the other
     * side and only small houses line the sea side — nothing floats on the water.
     */
    sea?: "right";
    /** What lines each side of the road: big shops/buildings vs. small houses (and the sea). */
    sides: { left: "buildings" | "houses"; right: "buildings" | "houses" };
  };
  /**
   * Today's place, passing by at the roadside (a café, the office, the hospital…). `size` big = a
   * large building (office, hospital, wedding hall…); `side` = which side of the road it stands on.
   */
  landmark?: { id: string; type: string; name: string; size: "big" | "small"; side: "left" | "right" };
  /** False while a popup is open or the day is over (stop scrolling, everyone stands still). */
  walking: boolean;
}

/** The season's trees and grass (one table for every tree on the road). */
const TREES: Record<RoadView["backdrop"]["season"], RoadView["backdrop"]["trees"]> = {
  SPRING: { look: "blossom", leaf: "#ffb7c9", snow: false, ground: "#9ad67a" },
  SUMMER: { look: "green", leaf: "#4fa84a", snow: false, ground: "#6fbf5a" },
  AUTUMN: { look: "autumn", leaf: "#e0782f", snow: false, ground: "#d9a55a" },
  WINTER: { look: "bare", leaf: "#8a6a4f", snow: true, ground: "#e9eef2" },
};
/** Seasons are flipped south of the equator (July is winter in Sydney). */
const SOUTH = new Set(["Australia", "AU", "New Zealand", "NZ", "Argentina", "AR", "Chile", "CL", "Brazil", "BR", "Peru", "PE", "South Africa", "ZA"]);
const FLIP = { SPRING: "AUTUMN", SUMMER: "WINTER", AUTUMN: "SPRING", WINTER: "SUMMER" } as const;

const SEASIDE = ["Busan", "Jeju", "Gangneung", "Sokcho", "Yeosu", "Pohang", "Ulsan"];
/** Large buildings (by the sea they stand on the land side, never on the water). */
const BIG_TYPES = new Set(["WORKPLACE", "HOSPITAL", "UNIVERSITY", "WEDDING_VENUE", "ENTERTAINMENT", "LIBRARY", "CITY", "HOTEL", "AIRPORT", "GYM"]);

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
  // Your partner walks beside you from the moment you're together (the HUD says "연애 중") — even long
  // distance, when they walk with you in your heart (`apart`: draw them a little faded).
  const pid = state.relationship.partnerId;
  const together = (state.relationship.status === "DATING" || state.relationship.status === "MARRIED") && !!pid;
  const apart = together && !!state.relationship.longDistance;
  if (together && pid) {
    const n = w?.npcs[pid];
    const pn = state.npcs.find((x) => x.id === pid);
    const pAge = n ? year - n.birthYear : pn ? year - pn.birth.year : age;
    const sex = n?.sex ?? pn?.birth.sex;
    left.push({ who: "partner", role: "partner", name: n?.name ?? pn?.name, gender: sex === "MALE" ? "M" : sex === "FEMALE" ? "F" : undefined, seed: n?.spriteSeed ?? hash(pid) % 1_000_000, age: pAge, slot: 0, pace: pAge >= 75 ? 0.6 : pAge >= 65 ? 0.8 : 1, holds: "me", ...(apart ? { apart: true } : {}) });
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
  const tripDest = trip ? getDestination(trip.destinationId) : undefined;
  const abroad = state.location.country !== (state.homeCountry || "Korea");
  const theme: RoadTheme = trip ? "travel" : abroad ? "abroad" : age >= 65 ? "countryside" : SEASIDE.includes(state.location.city) ? "seaside" : state.location.city === "Seoul" ? "city" : "town";
  const date = { year, month: state.date.month, day: state.date.day ?? 15 };
  const north = seasonOf(date.month) as RoadView["backdrop"]["season"];
  const season = SOUTH.has(state.location.country) ? FLIP[north] : north;
  const loc = opts.locationId ? getLocation(opts.locationId) : undefined;
  const weather = weatherFor(opts.seed, date, loc?.region ?? "home_city");
  const seaside = theme === "seaside";
  const big = !!loc && BIG_TYPES.has(loc.type);
  // By the sea, everything big stands on the land side (left); otherwise big buildings alternate sides by place.
  const side: "left" | "right" = seaside && big ? "left" : hash(loc?.id ?? "") % 2 ? "right" : "left";
  const landmark = loc && loc.id !== "home" && !loc.online ? { id: loc.id, type: loc.type, name: loc.name[opts.lang], size: big ? ("big" as const) : ("small" as const), side } : undefined;
  return {
    walkers,
    backdrop: {
      theme,
      season,
      trees: TREES[season],
      timeOfDay: timeOfDay(opts.minute),
      weather,
      sky: skyAt(opts.minute, weather),
      skyline: trip ? skylineFor(TRIP_CITY[trip.destinationId] ?? state.location.city, "", opts.lang) : skylineFor(state.location.city, state.location.country, opts.lang),
      // On a trip abroad, the road is in that city (Tokyo), not at home.
      city: tripDest && tripDest.country !== "HOME" ? tripDest.name[opts.lang] : opts.lang === "ko" ? opts.cityName(state.location.city) : state.location.city,
      country: opts.countryName(tripDest && tripDest.country !== "HOME" ? tripDest.country : state.location.country),
      ...(seaside ? { sea: "right" as const } : {}),
      // By the sea: big buildings on the left; small houses on the right, with the sea behind them.
      sides: seaside ? { left: "buildings", right: "houses" } : { left: "buildings", right: "buildings" },
    },
    landmark,
    walking: opts.walking,
  };
}

export type { Bi };
