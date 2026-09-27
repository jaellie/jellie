/**
 * Astrology Layer B — natal chart & transits (structured data, no gameplay).
 *
 * Houses: Whole Sign (the ASC's sign is the 1st house). Without a birth time
 * the chart uses Solar Whole Sign houses (the Sun's sign is the 1st house) and
 * sets `houseSystem: "SOLAR_WHOLE_SIGN"` — a common convention for unknown times.
 */
import signData from "../../data/astrology/signs.json";
import aspectData from "../../data/astrology/aspects.json";
import { julianDayFromDate } from "../saju/calendar/astronomy";
import type { BirthData } from "../saju/calendar/fourPillars";
import { PLANETS, type Planet, angles, dailyMotion, planetLongitude } from "./ephemeris";

export type ZodiacSign =
  | "ARIES" | "TAURUS" | "GEMINI" | "CANCER" | "LEO" | "VIRGO"
  | "LIBRA" | "SCORPIO" | "SAGITTARIUS" | "CAPRICORN" | "AQUARIUS" | "PISCES";
export type AstroElement = "FIRE" | "EARTH" | "AIR" | "WATER";
export type Modality = "CARDINAL" | "FIXED" | "MUTABLE";
export type AspectType = "CONJUNCTION" | "SEXTILE" | "SQUARE" | "TRINE" | "OPPOSITION";
export type ChartPoint = Planet | "ASC" | "MC";

export interface SignInfo { id: ZodiacSign; ko: string; glyph: string; element: AstroElement; modality: Modality; ruler: Planet }
export const SIGNS = signData.signs as SignInfo[];
const ASPECTS = aspectData.aspects as Array<{ id: AspectType; angle: number; natalOrb: number; transitOrb: number; nature: "harmonious" | "hard" | "conjunction" }>;

export interface BirthPlace { lat: number; lon: number; name?: string }
/** Seoul — the default when no birthplace is given. */
export const DEFAULT_BIRTHPLACE: BirthPlace = { lat: 37.5665, lon: 126.978, name: "Seoul" };

export interface PlanetPosition {
  planet: ChartPoint;
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
  house: number;
  retrograde: boolean;
}

export interface Aspect {
  a: ChartPoint;
  b: ChartPoint;
  type: AspectType;
  nature: "harmonious" | "hard" | "conjunction";
  orb: number;
}

export interface AstrologyChart {
  jdUT: number;
  timeKnown: boolean;
  houseSystem: "WHOLE_SIGN" | "SOLAR_WHOLE_SIGN";
  place: BirthPlace;
  positions: Record<ChartPoint, PlanetPosition | undefined>;
  /** Sign on the 1st house cusp (ASC sign, or Sun sign when time is unknown). */
  firstHouseSign: ZodiacSign;
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign?: ZodiacSign;
  elementBalance: Record<AstroElement, number>;
  modalityBalance: Record<Modality, number>;
  aspects: Aspect[];
  /** Planets per house (1–12). */
  houseEmphasis: Record<number, Planet[]>;
}

export const signIndexOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
export const signOf = (lon: number): ZodiacSign => SIGNS[signIndexOf(lon)].id;
export const signInfo = (s: ZodiacSign) => SIGNS.find((x) => x.id === s)!;
export const houseOf = (lon: number, firstHouseSignIndex: number) => ((signIndexOf(lon) - firstHouseSignIndex + 12) % 12) + 1;

export function angularDistance(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

export function findAspect(lonA: number, lonB: number, orbKind: "natalOrb" | "transitOrb"): { type: AspectType; nature: Aspect["nature"]; orb: number } | undefined {
  const d = angularDistance(lonA, lonB);
  for (const asp of ASPECTS) {
    const orb = Math.abs(d - asp.angle);
    if (orb <= asp[orbKind]) return { type: asp.id, nature: asp.nature, orb };
  }
  return undefined;
}

/** Like findAspect, but with one fixed orb for every aspect (progressions use 1°, returns 2°). */
export function findAspectWithin(lonA: number, lonB: number, maxOrb: number): { type: AspectType; nature: Aspect["nature"]; orb: number } | undefined {
  const d = angularDistance(lonA, lonB);
  for (const asp of ASPECTS) {
    const orb = Math.abs(d - asp.angle);
    if (orb <= maxOrb) return { type: asp.id, nature: asp.nature, orb };
  }
  return undefined;
}

/** Point weights for element/modality balance. */
const BALANCE_WEIGHTS: Partial<Record<ChartPoint, number>> = { SUN: 3, MOON: 3, ASC: 2, MERCURY: 1, VENUS: 1.5, MARS: 1.5, JUPITER: 1, SATURN: 1 };

export function birthJulianDay(birth: BirthData): number {
  const hour = birth.hour ?? 12;
  const minute = birth.minute ?? 0;
  const offset = birth.utcOffsetMinutes ?? 540;
  return julianDayFromDate(new Date(Date.UTC(birth.year, birth.month - 1, birth.day, hour, minute) - offset * 60_000));
}

export function calculateAstrologyChart(birth: BirthData, place: BirthPlace = DEFAULT_BIRTHPLACE): AstrologyChart {
  const jd = birthJulianDay(birth);
  const timeKnown = birth.hour !== undefined;
  const lons: Partial<Record<ChartPoint, number>> = {};
  for (const p of PLANETS) lons[p] = planetLongitude(p, jd);
  let risingSign: ZodiacSign | undefined;
  if (timeKnown) {
    const ang = angles(jd, place.lat, place.lon);
    lons.ASC = ang.ascendant;
    lons.MC = ang.midheaven;
    risingSign = signOf(ang.ascendant);
  }
  const firstIdx = signIndexOf(timeKnown ? lons.ASC! : lons.SUN!);
  const positions = {} as Record<ChartPoint, PlanetPosition | undefined>;
  for (const [p, lon] of Object.entries(lons) as Array<[ChartPoint, number]>) {
    positions[p] = {
      planet: p,
      longitude: lon,
      sign: signOf(lon),
      degreeInSign: lon % 30,
      house: houseOf(lon, firstIdx),
      retrograde: p !== "ASC" && p !== "MC" && p !== "SUN" && p !== "MOON" && dailyMotion(p as Planet, jd) < 0,
    };
  }

  const elementBalance: Record<AstroElement, number> = { FIRE: 0, EARTH: 0, AIR: 0, WATER: 0 };
  const modalityBalance: Record<Modality, number> = { CARDINAL: 0, FIXED: 0, MUTABLE: 0 };
  for (const [p, w] of Object.entries(BALANCE_WEIGHTS) as Array<[ChartPoint, number]>) {
    const pos = positions[p];
    if (!pos) continue;
    const info = signInfo(pos.sign);
    elementBalance[info.element] += w;
    modalityBalance[info.modality] += w;
  }

  const points = Object.keys(lons) as ChartPoint[];
  const aspects: Aspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if ((points[i] === "ASC" || points[i] === "MC") && (points[j] === "ASC" || points[j] === "MC")) continue;
      const f = findAspect(lons[points[i]]!, lons[points[j]]!, "natalOrb");
      if (f) aspects.push({ a: points[i], b: points[j], ...f });
    }
  }

  const houseEmphasis: Record<number, Planet[]> = {};
  for (const p of PLANETS) (houseEmphasis[positions[p]!.house] ??= []).push(p);

  return {
    jdUT: jd,
    timeKnown,
    houseSystem: timeKnown ? "WHOLE_SIGN" : "SOLAR_WHOLE_SIGN",
    place,
    positions,
    firstHouseSign: SIGNS[firstIdx].id,
    sunSign: positions.SUN!.sign,
    moonSign: positions.MOON!.sign,
    risingSign,
    elementBalance,
    modalityBalance,
    aspects,
    houseEmphasis,
  };
}

// ---- Transits ---------------------------------------------------------------

export interface TransitHit {
  planet: Planet;
  longitude: number;
  sign: ZodiacSign;
  /** Natal house the transiting planet is moving through. */
  house: number;
  retrograde: boolean;
  /** `applying`: the orb is still shrinking (building, ahead) vs separating (peaked, fading). */
  aspects: Array<{ natalPoint: ChartPoint; type: AspectType; nature: Aspect["nature"]; orb: number; applying: boolean }>;
  /** Transit planet conjunct its own natal position (e.g. Saturn return). */
  isReturn: boolean;
}

export interface AstrologyTransits {
  jdUT: number;
  hits: TransitHit[];
}

const TRANSIT_TARGETS: ChartPoint[] = ["SUN", "MOON", "VENUS", "MARS", "ASC", "MC"];

export function calculateTransits(chart: AstrologyChart, jdUT: number, planets: Planet[]): AstrologyTransits {
  const firstIdx = SIGNS.findIndex((s) => s.id === chart.firstHouseSign);
  return {
    jdUT,
    hits: planets.map((p) => {
      const lon = planetLongitude(p, jdUT);
      const later = planetLongitude(p, jdUT + 10);
      const aspects = TRANSIT_TARGETS.flatMap((t) => {
        const natal = chart.positions[t];
        const f = natal ? findAspect(lon, natal.longitude, "transitOrb") : undefined;
        if (!f) return [];
        const next = findAspect(later, natal!.longitude, "transitOrb");
        return [{ natalPoint: t, ...f, applying: !!next && next.type === f.type && next.orb < f.orb }];
      });
      const natalSelf = chart.positions[p];
      return {
        planet: p,
        longitude: lon,
        sign: signOf(lon),
        house: houseOf(lon, firstIdx),
        retrograde: dailyMotion(p, jdUT) < 0,
        aspects,
        isReturn: !!natalSelf && angularDistance(lon, natalSelf.longitude) <= 5 && p !== "SUN" && p !== "MOON",
      };
    }),
  };
}

/** Mid-month instant for a game month (12:00 KST on the 15th). */
export function jdForMonth(year: number, month: number): number {
  return julianDayFromDate(new Date(Date.UTC(year, month - 1, 15, 3)));
}

export const SLOW_PLANETS: Planet[] = ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];
export const FAST_PLANETS: Planet[] = ["SUN", "VENUS", "MARS", "MERCURY"];
