/**
 * Astrology Layer B+ — time techniques beyond transits (all hidden from the player).
 *
 *  - Secondary progressions ("a day for a year"): the slow inner chapter of life.
 *    Progressed Sun/Moon/Mercury/Venus/Mars; progressed ASC/MC by solar arc.
 *  - Solar Return: the chart for the moment the Sun returns to its natal degree
 *    → the theme of that year (birthday to birthday).
 *  - Lunar Return: the same for the Moon (~27.3 days) → the mood of the month.
 *
 * Orb weighting (tight first): < 1° strong, 1–2° moderate, > 2° background.
 * Applying aspects (still building) count more than separating ones (fading).
 * Without a birth time, return angles/houses are unreliable (the return moment
 * shifts by up to ±12 h), so they are marked and ignored downstream.
 */
import { julianDayFromDate } from "../saju/calendar/astronomy";
import { type Aspect, type AspectType, type AstrologyChart, type ChartPoint, type ZodiacSign, angularDistance, findAspectWithin, houseOf, signIndexOf, signOf } from "./chart";
import { PLANETS, type Planet, angles, planetLongitude } from "./ephemeris";

const YEAR_DAYS = 365.2422;
const SIDEREAL_MONTH = 27.321661;
const SUN_SPEED = 0.985647;
const MOON_SPEED = 13.176358;
const norm = (x: number) => ((x % 360) + 360) % 360;
const wrap180 = (x: number) => ((((x % 360) + 540) % 360) - 180);

/** < 1° strong, 1–2° moderate, > 2° background only. */
export function orbWeight(orb: number): number {
  return orb < 1 ? 1 : orb < 2 ? 0.6 : 0.25;
}

/** Applying (orb shrinking = still ahead) counts more than separating (already peaked). */
export function phaseWeight(applying: boolean): number {
  return applying ? 1.15 : 0.8;
}

// ---------------------------------------------------------------------------
// Secondary progressions
// ---------------------------------------------------------------------------

export type ProgressedPoint = "SUN" | "MOON" | "MERCURY" | "VENUS" | "MARS" | "ASC" | "MC";
const PROGRESSED: ProgressedPoint[] = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "ASC", "MC"];
const PROGRESSION_TARGETS: ChartPoint[] = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "ASC", "MC"];
const PROGRESSION_ORB = 1;

export interface ProgressedAspect {
  progressed: ProgressedPoint;
  natalPoint: ChartPoint;
  type: AspectType;
  nature: Aspect["nature"];
  orb: number;
  applying: boolean;
}

export interface Progressions {
  jdUT: number;
  progressedJd: number;
  positions: Partial<Record<ProgressedPoint, { longitude: number; sign: ZodiacSign; natalHouse: number }>>;
  aspects: ProgressedAspect[];
  /** Progressed Sun / Moon changed sign during the past year → a new chapter. */
  ingresses: Array<{ point: "SUN" | "MOON"; sign: ZodiacSign }>;
}

function progressedLongitudes(chart: AstrologyChart, jdUT: number): Partial<Record<ProgressedPoint, number>> {
  const pj = chart.jdUT + (jdUT - chart.jdUT) / YEAR_DAYS;
  const out: Partial<Record<ProgressedPoint, number>> = {};
  for (const p of ["SUN", "MOON", "MERCURY", "VENUS", "MARS"] as const) out[p] = planetLongitude(p, pj);
  // Angles by solar arc (the progressed Sun's distance travelled), only with a known birth time.
  const arc = norm(out.SUN! - chart.positions.SUN!.longitude);
  if (chart.timeKnown && chart.positions.ASC && chart.positions.MC) {
    out.ASC = norm(chart.positions.ASC.longitude + arc);
    out.MC = norm(chart.positions.MC.longitude + arc);
  }
  return out;
}

export function calculateProgressions(chart: AstrologyChart, jdUT: number): Progressions {
  const firstIdx = signIndexOf(chart.positions[chart.timeKnown ? "ASC" : "SUN"]!.longitude);
  const now = progressedLongitudes(chart, jdUT);
  const soon = progressedLongitudes(chart, jdUT + 60);
  const yearAgo = progressedLongitudes(chart, jdUT - 365.25);
  const positions: Progressions["positions"] = {};
  const aspects: ProgressedAspect[] = [];
  for (const p of PROGRESSED) {
    const lon = now[p];
    if (lon === undefined) continue;
    positions[p] = { longitude: lon, sign: signOf(lon), natalHouse: houseOf(lon, firstIdx) };
    for (const t of PROGRESSION_TARGETS) {
      if (t === p) continue; // progressed X to natal X is just "not moved yet"
      const natal = chart.positions[t];
      if (!natal) continue;
      const f = findAspectWithin(lon, natal.longitude, PROGRESSION_ORB);
      if (!f) continue;
      const later = findAspectWithin(soon[p]!, natal.longitude, PROGRESSION_ORB + 1);
      aspects.push({ progressed: p, natalPoint: t, ...f, applying: !!later && later.type === f.type && later.orb < f.orb });
    }
  }
  const ingresses: Progressions["ingresses"] = [];
  for (const p of ["SUN", "MOON"] as const) {
    if (signIndexOf(now[p]!) !== signIndexOf(yearAgo[p]!)) ingresses.push({ point: p, sign: signOf(now[p]!) });
  }
  return { jdUT, progressedJd: chart.jdUT + (jdUT - chart.jdUT) / YEAR_DAYS, positions, aspects, ingresses };
}

// ---------------------------------------------------------------------------
// Solar & Lunar Returns
// ---------------------------------------------------------------------------

export interface ReturnChart {
  kind: "SOLAR" | "LUNAR";
  jdUT: number;
  /** The next return (this chart's period ends there). */
  endJd: number;
  /** Return angles/houses are only trustworthy with a known birth time. */
  anglesReliable: boolean;
  ascSign?: ZodiacSign;
  /** Natal house the return Ascendant falls in (the period's overall tone). */
  ascInNatalHouse?: number;
  /** Return houses (whole sign from the return ASC); empty if angles are unreliable. */
  houses: Partial<Record<Planet, number>>;
  /** Natal houses the return planets fall in ("where events land"). */
  natalHouses: Record<Planet, number>;
  /** Planets within 5° of a return angle (ASC, IC, DSC, MC): loud this period. */
  angular: Planet[];
  /** Return planets hitting natal Sun / Moon / ASC / MC (orb ≤ 2°): natal themes repeating. */
  contacts: Array<{ planet: Planet; natalPoint: ChartPoint; type: AspectType; nature: Aspect["nature"]; orb: number }>;
}

/** The moment the Sun returns to its natal degree in the given calendar year. */
export function solarReturnJd(chart: AstrologyChart, year: number): number {
  const target = chart.positions.SUN!.longitude;
  let jd = julianDayFromDate(new Date(Date.UTC(year, 0, 1)));
  jd += norm(target - planetLongitude("SUN", jd)) / SUN_SPEED;
  for (let i = 0; i < 6; i++) jd += wrap180(target - planetLongitude("SUN", jd)) / SUN_SPEED;
  return jd;
}

function refineMoon(target: number, jd: number): number {
  for (let i = 0; i < 6; i++) jd += wrap180(target - planetLongitude("MOON", jd)) / MOON_SPEED;
  return jd;
}

/** The latest Lunar Return at or before `jdUT`, and the next one. */
export function lunarReturnJd(chart: AstrologyChart, jdUT: number): { start: number; end: number } {
  const target = chart.positions.MOON!.longitude;
  let start = refineMoon(target, jdUT - norm(planetLongitude("MOON", jdUT) - target) / MOON_SPEED);
  if (start > jdUT) start = refineMoon(target, start - SIDEREAL_MONTH);
  return { start, end: refineMoon(target, start + SIDEREAL_MONTH) };
}

function returnChart(chart: AstrologyChart, kind: ReturnChart["kind"], jdUT: number, endJd: number): ReturnChart {
  const natalFirst = signIndexOf(chart.positions[chart.timeKnown ? "ASC" : "SUN"]!.longitude);
  const lons = Object.fromEntries(PLANETS.map((p) => [p, planetLongitude(p, jdUT)])) as Record<Planet, number>;
  const reliable = chart.timeKnown;
  const natalHouses = Object.fromEntries(PLANETS.map((p) => [p, houseOf(lons[p], natalFirst)])) as Record<Planet, number>;
  const out: ReturnChart = { kind, jdUT, endJd, anglesReliable: reliable, houses: {}, natalHouses, angular: [], contacts: [] };
  if (reliable) {
    const ang = angles(jdUT, chart.place.lat, chart.place.lon);
    const first = signIndexOf(ang.ascendant);
    out.ascSign = signOf(ang.ascendant);
    out.ascInNatalHouse = houseOf(ang.ascendant, natalFirst);
    for (const p of PLANETS) {
      out.houses[p] = houseOf(lons[p], first);
      const pts = [ang.ascendant, ang.ascendant + 180, ang.midheaven, ang.midheaven + 180];
      if (pts.some((x) => angularDistance(lons[p], x) <= 5)) out.angular.push(p);
    }
  }
  for (const p of PLANETS) {
    // The returning body sits on its own natal degree by definition; skip that trivial contact.
    if ((kind === "SOLAR" && p === "SUN") || (kind === "LUNAR" && p === "MOON")) continue;
    for (const t of ["SUN", "MOON", "ASC", "MC"] as ChartPoint[]) {
      const natal = chart.positions[t];
      if (!natal || ((t === "ASC" || t === "MC") && !chart.timeKnown)) continue;
      const f = findAspectWithin(lons[p], natal.longitude, 2);
      if (f) out.contacts.push({ planet: p, natalPoint: t, ...f });
    }
  }
  return out;
}

/** Solar Return for the birthday falling in `year` (covers that birthday → the next). */
export function calculateSolarReturn(chart: AstrologyChart, year: number): ReturnChart {
  return returnChart(chart, "SOLAR", solarReturnJd(chart, year), solarReturnJd(chart, year + 1));
}

/** The Solar Return in effect at `jdUT` (the most recent birthday). */
export function activeSolarReturn(chart: AstrologyChart, jdUT: number, calendarYear: number): ReturnChart {
  const thisYear = solarReturnJd(chart, calendarYear);
  return calculateSolarReturn(chart, thisYear <= jdUT ? calendarYear : calendarYear - 1);
}

/** The Lunar Return in effect at `jdUT` (the most recent one, about 27 days long). */
export function calculateLunarReturn(chart: AstrologyChart, jdUT: number): ReturnChart {
  const { start, end } = lunarReturnJd(chart, jdUT);
  return returnChart(chart, "LUNAR", start, end);
}
