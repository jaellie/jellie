/**
 * Layer B — Annual (歲運/세운) and Monthly (月運/월운) fortune pillars.
 */
import { yearAndMonthPillarsAt, yearPillarForSajuYear } from "../calendar/fourPillars";
import type { Pillar } from "../types";
import type { DayMaster, ElementBalance } from "./dayMaster";
import { analyzeTransitPillar, type TransitPillarAnalysis } from "./fortunePillar";
import type { FourPillars } from "../types";
import type { LabeledPillar } from "./relations";

export interface AnnualFortune extends TransitPillarAnalysis {
  year: number;
  pillar: Pillar;
}

export interface MonthlyFortune extends TransitPillarAnalysis {
  year: number;
  /** Gregorian month 1–12. */
  month: number;
  pillar: Pillar;
  /** 0 = 寅 … 11 = 丑 — the solar month dominating this Gregorian month. */
  sajuMonthIndex: number;
}

interface ChartCore {
  fourPillars: FourPillars;
  dayMaster: DayMaster;
  elementBalance: ElementBalance;
}

/**
 * The 세운 of Gregorian year Y is the pillar of the Saju year that starts at
 * 立春 of Y (it governs ~Feb 4 of Y to ~Feb 3 of Y+1).
 */
export function annualPillar(year: number): Pillar {
  return yearPillarForSajuYear(year);
}

/**
 * The 월운 for a Gregorian month is the solar month in force on its 15th
 * (solar months start around the 4th–8th, so this is the dominant one).
 */
export function monthlyPillar(year: number, month: number): { pillar: Pillar; sajuMonthIndex: number } {
  const mid = new Date(Date.UTC(year, month - 1, 15, 3)); // 12:00 KST
  const r = yearAndMonthPillarsAt(mid);
  return { pillar: r.month, sajuMonthIndex: r.sajuMonthIndex };
}

export function calculateAnnualFortune(chart: ChartCore, year: number, context: LabeledPillar[] = []): AnnualFortune {
  const pillar = annualPillar(year);
  const b = chart.elementBalance;
  return { year, ...analyzeTransitPillar(chart.fourPillars, chart.dayMaster.stem, b.favorable, b.unfavorable, pillar, "annual", context) };
}

export function calculateMonthlyFortune(chart: ChartCore, year: number, month: number): MonthlyFortune {
  const { pillar, sajuMonthIndex } = monthlyPillar(year, month);
  const b = chart.elementBalance;
  return {
    year,
    month,
    sajuMonthIndex,
    ...analyzeTransitPillar(chart.fourPillars, chart.dayMaster.stem, b.favorable, b.unfavorable, pillar, "monthly"),
  };
}

