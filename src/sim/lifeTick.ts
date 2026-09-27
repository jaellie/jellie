/**
 * Monthly background life: time, money, graduation. No destiny input.
 */
import { addMonths } from "../core/gameDate";
import { type LifeState, educationRank, isAbroad } from "./types";

export const ECONOMY = {
  baseIncome: 18,
  incomePerLevel: 9,
  incomePerEducation: 6,
  abroadIncomeBonus: 1.2,
  livingCostHome: 14,
  livingCostAbroad: 20,
  debtPaymentPerMonth: 0.6,
  /** Share of income that goes to lifestyle spending on top of living costs. */
  lifestyleSpendRate: 0.6,
};

export function yearlyIncome(s: LifeState): number {
  if (!s.career.employed) return 0;
  const base = ECONOMY.baseIncome + ECONOMY.incomePerLevel * s.career.level + ECONOMY.incomePerEducation * educationRank(s.education);
  return base * (s.career.abroad ? ECONOMY.abroadIncomeBonus : 1);
}

/** Advance one month. Returns notable life-script events (graduation etc.). */
export function lifeTick(s: LifeState): string[] {
  const notes: string[] = [];
  s.monthIndex += 1;
  s.date = addMonths(s.date, 1);
  s.age = s.monthIndex / 12;

  if (s.age >= 18 && s.education === "NONE") {
    s.education = "HIGH_SCHOOL";
    notes.push("Finished high school.");
  }

  if (s.enrollment && s.monthIndex >= s.enrollment.untilMonth) {
    s.education = s.enrollment.program;
    notes.push(`Graduated: ${s.enrollment.program}${s.enrollment.abroad ? " (abroad)" : ""}.`);
    s.enrollment = undefined;
  }

  if (s.age >= 18) {
    const living = (isAbroad(s) ? ECONOMY.livingCostAbroad : ECONOMY.livingCostHome) / 12;
    const supportShare = s.career.employed ? 1 : s.enrollment ? 0.5 : 0.35;
    s.money += (yearlyIncome(s) * (1 - ECONOMY.lifestyleSpendRate)) / 12 - living * supportShare;
    if (s.debt > 0 && s.money > 5) {
      const pay = Math.min(s.debt, ECONOMY.debtPaymentPerMonth);
      s.debt -= pay;
      s.money -= pay;
    }
  }
  if (s.age >= 65 && s.career.employed) {
    s.career.employed = false;
    notes.push("Retired.");
  }
  for (const n of notes) s.memories.push({ date: { ...s.date }, age: Math.floor(s.age), text: n, tags: ["life"] });
  return notes;
}
