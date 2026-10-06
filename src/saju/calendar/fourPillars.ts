/**
 * Layer A — Birth data → Four Pillars. NO gameplay logic here.
 *
 * Rules implemented (documented choices):
 *  - Year pillar changes at 立春 (Sun longitude 315°), not at 1 Jan or Lunar New Year.
 *  - Month pillar changes at each 節 (jie) solar term; stem via 五虎遁 (year stem → 寅-month stem).
 *  - Day pillar from the continuous 60-day cycle anchored on JDN (2000-01-01 = 戊午).
 *  - Hour pillar: 12 double-hours, 子 = 23:00–00:59; stem via 五鼠遁 (day stem → 子-hour stem).
 *  - Zi-hour day boundary is configurable: "23:00" (子初換日, default) or "00:00" (야자시/조자시 split).
 *  - Optional local-mean-solar-time correction from birth longitude (e.g. Seoul 127°E ≈ −32 min vs KST).
 */
import {
  type EarthlyBranch,
  type FourPillars,
  type HeavenlyStem,
  type Pillar,
  branchAt,
  indexOfStem,
  pillarFromCycleIndex,
  stemAt,
} from "../types";
import { civilDayNumber, julianDayFromDate, lichunMoment, nextJie, previousJie, sajuMonthIndexFromLongitude, sunApparentLongitude } from "./astronomy";

export type Sex = "MALE" | "FEMALE";

export interface BirthData {
  year: number;
  month: number;
  day: number;
  /** Local civil clock time; omit both for unknown birth time. */
  hour?: number;
  minute?: number;
  /** Offset of the civil clock from UTC in minutes. Default 540 (KST, UTC+9). Include DST if it applied. */
  utcOffsetMinutes?: number;
  /** Birthplace longitude (°E positive). Used only when useTrueSolarTime is on. */
  longitude?: number;
  /** Needed for Daeun direction. */
  sex: Sex;
}

export interface PillarCalculationOptions {
  ziHourDayBoundary?: "23:00" | "00:00";
  useTrueSolarTime?: boolean;
}

export interface CalendarResult {
  fourPillars: FourPillars;
  /** Birth instant as UT Julian Day (used by Daeun timing). */
  jdUT: number;
  birthInstant: Date;
  /** The Saju (立春-based) year the birth falls in. */
  sajuYear: number;
  /** 0 = 寅 … 11 = 丑 */
  sajuMonthIndex: number;
  timeKnown: boolean;
  /** True when birth is within 30 min of a 節 — month/year pillar could flip with a more precise ephemeris. */
  nearSolarTermBoundary: boolean;
}

const DEFAULT_OFFSET_MINUTES = 9 * 60;

// ---- Individual pillar rules (reused by fortune calculations) ------------

export function yearPillarForSajuYear(sajuYear: number): Pillar {
  // 4 CE was 甲子.
  return pillarFromCycleIndex(sajuYear - 4);
}

/** 五虎遁: 甲/己→丙寅, 乙/庚→戊寅, 丙/辛→庚寅, 丁/壬→壬寅, 戊/癸→甲寅. */
export function monthPillar(yearStem: HeavenlyStem, sajuMonthIndex: number): Pillar {
  const firstStem = (indexOfStem(yearStem) * 2 + 2) % 10;
  return { heavenlyStem: stemAt(firstStem + sajuMonthIndex), earthlyBranch: branchAt(2 + sajuMonthIndex) };
}

export function dayPillarForCivilDate(year: number, month: number, day: number): Pillar {
  return pillarFromCycleIndex(civilDayNumber(year, month, day) + 49);
}

/** 五鼠遁: 甲/己→甲子, 乙/庚→丙子, 丙/辛→戊子, 丁/壬→庚子, 戊/癸→壬子. */
export function hourPillar(dayStem: HeavenlyStem, hourBranchIndex: number): Pillar {
  return {
    heavenlyStem: stemAt(indexOfStem(dayStem) * 2 + hourBranchIndex),
    earthlyBranch: branchAt(hourBranchIndex),
  };
}

export function hourBranchIndex(hour: number, minute: number): number {
  return Math.floor(((hour * 60 + minute + 60) % 1440) / 120);
}

// ---- Instant-based helpers ------------------------------------------------

export function sajuYearAt(jdUT: number, gregorianYear: number): number {
  return jdUT < lichunMoment(gregorianYear) ? gregorianYear - 1 : gregorianYear;
}

/** Year + month pillars at an instant (used for 세운/월운 too). */
export function yearAndMonthPillarsAt(date: Date): { year: Pillar; month: Pillar; sajuYear: number; sajuMonthIndex: number } {
  const jd = julianDayFromDate(date);
  const sajuYear = sajuYearAt(jd, date.getUTCFullYear());
  const year = yearPillarForSajuYear(sajuYear);
  const sajuMonthIndex = sajuMonthIndexFromLongitude(sunApparentLongitude(jd));
  return { year, month: monthPillar(year.heavenlyStem, sajuMonthIndex), sajuYear, sajuMonthIndex };
}

// ---- Main entry -----------------------------------------------------------

export function calculateFourPillars(birth: BirthData, options: PillarCalculationOptions = {}): CalendarResult {
  const boundary = options.ziHourDayBoundary ?? "23:00";
  const offset = birth.utcOffsetMinutes ?? DEFAULT_OFFSET_MINUTES;
  const timeKnown = birth.hour !== undefined;
  const hour = birth.hour ?? 12;
  const minute = birth.minute ?? 0;

  const birthInstant = new Date(Date.UTC(birth.year, birth.month - 1, birth.day, hour, minute) - offset * 60_000);
  const jdUT = julianDayFromDate(birthInstant);

  const ym = yearAndMonthPillarsAt(birthInstant);

  // Clock used for day/hour pillars: civil time, or local mean solar time.
  let clock = new Date(Date.UTC(birth.year, birth.month - 1, birth.day, hour, minute));
  if (options.useTrueSolarTime && birth.longitude !== undefined && timeKnown) {
    const lmtOffsetMinutes = birth.longitude * 4; // 1° = 4 min
    clock = new Date(birthInstant.getTime() + lmtOffsetMinutes * 60_000);
  }
  const cy = clock.getUTCFullYear();
  const cm = clock.getUTCMonth() + 1;
  const cd = clock.getUTCDate();
  const ch = clock.getUTCHours();
  const cmin = clock.getUTCMinutes();

  const isLateZi = timeKnown && ch === 23;
  let day = dayPillarForCivilDate(cy, cm, cd);
  let hourStemSourceDay = day;
  if (isLateZi) {
    const next = dayPillarForCivilDate(cy, cm, cd + 1);
    if (boundary === "23:00") day = next;
    hourStemSourceDay = next;
  }

  const fourPillars: FourPillars = { year: ym.year, month: ym.month, day };
  if (timeKnown) fourPillars.hour = hourPillar(hourStemSourceDay.heavenlyStem, hourBranchIndex(ch, cmin));

  const prev = previousJie(jdUT).jdUT;
  const next = nextJie(jdUT).jdUT;
  const halfHour = 30 / 1440;
  const nearSolarTermBoundary = Math.abs(jdUT - prev) < halfHour || Math.abs(next - jdUT) < halfHour;

  return { fourPillars, jdUT, birthInstant, sajuYear: ym.sajuYear, sajuMonthIndex: ym.sajuMonthIndex, timeKnown, nearSolarTermBoundary };
}

export type { EarthlyBranch };
