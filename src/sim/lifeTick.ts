/**
 * Monthly background life: time, money, graduation. No destiny input.
 */
import { addMonths } from "../core/gameDate";
import { type LifeState, educationRank, isAbroad } from "./types";
import directorCfg from "../../data/game/director.json";

const MORTALITY = directorCfg.mortality;

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

/** Annual death probability (Gompertz-style, fictional but plausible). */
export function annualMortality(age: number): number {
  const m = MORTALITY;
  const band = m.bands.find((b) => age <= b.maxAge) ?? m.bands[m.bands.length - 1];
  return Math.min(0.5, (m.base + m.a * Math.exp(m.b * age)) * band.factor);
}

/** Advance one month. Returns notable life-script events (graduation etc.). */
export function lifeTick(s: LifeState, rng?: { chance(p: number): boolean }, opts: { parents?: boolean; autoRetire?: boolean } = {}): string[] {
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
    const net = (yearlyIncome(s) * (1 - ECONOMY.lifestyleSpendRate)) / 12 - living * supportShare;
    // Everyday living never puts you in the red: short months are covered by a part-time shift, parents,
    // eating cheaper. Only real events (a loan, a scam, a hospital bill) can push money below zero.
    s.money += net >= 0 ? net : Math.max(net, -Math.max(0, s.money));
    if (s.debt > 0 && s.money > 5) {
      const pay = Math.min(s.debt, ECONOMY.debtPaymentPerMonth);
      s.debt -= pay;
      s.money -= pay;
    }
  }
  if (opts.autoRetire !== false && s.age >= 65 && s.career.employed) {
    s.career.employed = false;
    s.career.cid = (s.career.cid ?? 0) + 1;
    notes.push("Retired.");
  }
  if (rng) {
    // Parents age and pass away eventually; the player too — the game ends only then.
    for (const who of opts.parents === false ? [] : (["mom", "dad"] as const)) {
      const p = s.family?.[who];
      if (p?.alive && rng.chance(annualMortality(s.date.year - p.birthYear) / 12)) {
        p.alive = false;
        notes.push(who === "mom" ? "Mom passed away." : "Dad passed away.");
      }
    }
    if (s.alive && rng.chance(annualMortality(s.age) / 12)) {
      s.alive = false;
      s.diedAtMonth = s.monthIndex;
      notes.push(`Passed away at ${Math.floor(s.age)}.`);
    }
  }
  for (const n of notes) s.memories.push({ date: { ...s.date }, age: Math.floor(s.age), text: n, tags: ["life"] });
  return notes;
}
