/**
 * Layer B entry point — the structured Saju chart.
 *
 * `calculateNatalChart` runs ONCE per character (birth). `getCurrentFortune`
 * is cheap and memoized per chart, and is called when game time advances
 * (month / year / Daeun transitions) — never per frame.
 *
 * Nothing here knows about gameplay. See ./interpretation for that.
 */
import { type BirthData, type CalendarResult, type PillarCalculationOptions, calculateFourPillars } from "./calendar/fourPillars";
import { type DayMaster, type DayMasterStrengthClass, type ElementBalance, calculateDayMaster, calculateElementBalance, classifyStrength } from "./analysis/dayMaster";
import { type DaeunInfo, type DaeunPeriod, activeDaeun, calculateDaeun } from "./analysis/daeun";
import { type AnnualFortune, type MonthlyFortune, calculateAnnualFortune, calculateMonthlyFortune } from "./analysis/fortune";
import { natalLabeledPillars } from "./analysis/fortunePillar";
import { type ElementInteraction, findInteractions } from "./analysis/relations";
import { type ShinsalResult, calculateNatalShinsal } from "./analysis/shinsal";
import {
  type PillarTenGods,
  type TenGodDistribution,
  type TenGodGroup,
  natalTenGodDistribution,
  pillarTenGods,
  tenGodGroupTotals,
} from "./analysis/tenGods";
import type { FourPillars, PillarPosition } from "./types";
import { type GameDate, ageAt } from "../core/gameDate";

export interface SajuChart {
  birth: BirthData;
  calendar: CalendarResult;
  fourPillars: FourPillars;
  dayMaster: DayMaster;
  dayMasterStrength: DayMasterStrengthClass;
  elementBalance: ElementBalance;
  tenGods: {
    byPillar: PillarTenGods[];
    distribution: TenGodDistribution;
    groups: Record<TenGodGroup, number>;
  };
  natalInteractions: ElementInteraction[];
  shinsal: ShinsalResult[];
  daeun: DaeunInfo;
}

export interface CurrentFortune {
  date: GameDate;
  age: number;
  daeun?: DaeunPeriod;
  annual: AnnualFortune;
  monthly: MonthlyFortune;
}

export function calculateNatalChart(birth: BirthData, options?: PillarCalculationOptions): SajuChart {
  const calendar = calculateFourPillars(birth, options);
  const fp = calendar.fourPillars;
  const dayMaster = calculateDayMaster(fp);
  const elementBalance = calculateElementBalance(fp, dayMaster);
  const positions = (["year", "month", "day", "hour"] as PillarPosition[]).filter((p) => fp[p]);
  const distribution = natalTenGodDistribution(dayMaster.stem, fp);
  return {
    birth,
    calendar,
    fourPillars: fp,
    dayMaster,
    dayMasterStrength: classifyStrength(dayMaster.strength ?? 0.5),
    elementBalance,
    tenGods: {
      byPillar: positions.map((p) => pillarTenGods(dayMaster.stem, fp[p]!, p)),
      distribution,
      groups: tenGodGroupTotals(distribution),
    },
    natalInteractions: findInteractions(natalLabeledPillars(fp)),
    shinsal: calculateNatalShinsal(fp),
    daeun: calculateDaeun(calendar, birth.sex, dayMaster, elementBalance),
  };
}

// ---- Memoized time-dependent analysis ------------------------------------

const annualCache = new WeakMap<SajuChart, Map<number, AnnualFortune>>();
const monthlyCache = new WeakMap<SajuChart, Map<string, MonthlyFortune>>();

export function getAnnualFortune(chart: SajuChart, year: number): AnnualFortune {
  let m = annualCache.get(chart);
  if (!m) annualCache.set(chart, (m = new Map()));
  let v = m.get(year);
  if (!v) m.set(year, (v = calculateAnnualFortune(chart, year)));
  return v;
}

export function getMonthlyFortune(chart: SajuChart, year: number, month: number): MonthlyFortune {
  let m = monthlyCache.get(chart);
  if (!m) monthlyCache.set(chart, (m = new Map()));
  const key = `${year}-${month}`;
  let v = m.get(key);
  if (!v) m.set(key, (v = calculateMonthlyFortune(chart, year, month)));
  return v;
}

export function birthGameDate(chart: SajuChart): GameDate {
  return { year: chart.birth.year, month: chart.birth.month, day: chart.birth.day };
}

export function getCurrentFortune(chart: SajuChart, date: GameDate): CurrentFortune {
  const age = ageAt(birthGameDate(chart), date);
  // The 세운 switches at 立春; January belongs to the previous Saju year.
  const annualYear = date.month === 1 ? date.year - 1 : date.year;
  return {
    date,
    age,
    daeun: activeDaeun(chart.daeun, age),
    annual: getAnnualFortune(chart, annualYear),
    monthly: getMonthlyFortune(chart, date.year, date.month),
  };
}
