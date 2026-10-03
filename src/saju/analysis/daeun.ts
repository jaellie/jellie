/**
 * Layer B — Daeun (大運), the 10-year life-cycle pillars.
 * Timing is derived from the birth instant's distance to the adjacent 節,
 * never hard-coded.
 */
import rules from "../../../data/saju/daeunRules.json";
import { nextJie, previousJie } from "../calendar/astronomy";
import type { CalendarResult, Sex } from "../calendar/fourPillars";
import { type Pillar, shiftPillar, stemInfo } from "../types";
import type { ElementBalance } from "./dayMaster";
import type { DayMaster } from "./dayMaster";
import { analyzeTransitPillar, type TransitPillarAnalysis } from "./fortunePillar";

export type DaeunDirection = "FORWARD" | "BACKWARD";

export interface DaeunPeriod extends TransitPillarAnalysis {
  id: string;
  index: number;
  /** Age in years since birth (not Korean age). */
  startAge: number;
  endAge: number;
  pillar: Pillar;
}

export interface DaeunInfo {
  direction: DaeunDirection;
  /** Fractional start age from the 3-days-per-year rule. */
  exactStartAge: number;
  /** Conventional integer 대운수 (rounded, min 1). */
  conventionalStartAge: number;
  /** The start age actually used for the period table (per daeunRules.roundingMode). */
  startAge: number;
  /** Days between birth and the governing 節. */
  daysToSolarTerm: number;
  solarTermName: string;
  periods: DaeunPeriod[];
}

export function daeunDirection(yearStemYinYang: "YANG" | "YIN", sex: Sex): DaeunDirection {
  const yang = yearStemYinYang === "YANG";
  return (yang && sex === "MALE") || (!yang && sex === "FEMALE") ? "FORWARD" : "BACKWARD";
}

export function calculateDaeun(calendar: CalendarResult, sex: Sex, dayMaster: DayMaster, balance: ElementBalance): DaeunInfo {
  const fp = calendar.fourPillars;
  const direction = daeunDirection(stemInfo(fp.year.heavenlyStem).yinYang, sex);
  const term = direction === "FORWARD" ? nextJie(calendar.jdUT) : previousJie(calendar.jdUT);
  const daysToSolarTerm = Math.abs(term.jdUT - calendar.jdUT);
  const exactStartAge = daysToSolarTerm / rules.daysPerYear;
  const conventionalStartAge = Math.max(1, Math.round(exactStartAge));
  const startAge = rules.roundingMode === "ROUND" ? conventionalStartAge : exactStartAge;
  const step = direction === "FORWARD" ? 1 : -1;

  const periods: DaeunPeriod[] = [];
  for (let i = 0; i < rules.periodCount; i++) {
    const pillar = shiftPillar(fp.month, step * (i + 1));
    const start = startAge + i * rules.periodLengthYears;
    periods.push({
      id: `daeun-${i + 1}`,
      index: i,
      startAge: start,
      endAge: start + rules.periodLengthYears,
      ...analyzeTransitPillar(fp, dayMaster.stem, balance.favorable, balance.unfavorable, pillar, "daeun"),
    });
  }
  return { direction, exactStartAge, conventionalStartAge, startAge, daysToSolarTerm, solarTermName: term.nameHanja, periods };
}

export function activeDaeun(info: DaeunInfo, age: number): DaeunPeriod | undefined {
  return info.periods.find((p) => age >= p.startAge && age < p.endAge);
}
