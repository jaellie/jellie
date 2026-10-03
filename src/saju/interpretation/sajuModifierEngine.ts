/**
 * Layer C entry point — converts Saju analysis into composable LifeModifiers.
 *
 *   Natal chart (Ten Gods, Shinsal, Day Master, interactions)   — cached per chart
 * + Daeun (10-year chapter)
 * + Annual fortune (세운)
 * + Monthly fortune (월운, light)
 * + Synergy rules (官+印+驛馬 …)
 * = LifeModifiers  (+ a full per-source trace for debugging)
 *
 * The engine never creates events; it only reshapes probabilities.
 */
import type { GameDate } from "../../core/gameDate";
import {
  type DestinyModifierSource,
  type LifeModifierKey,
  type LifeModifiers,
  LIFE_MODIFIER_KEYS,
  type Modifier,
  combineModifiers,
  sumModifierList,
} from "../../core/lifeModifiers";
import { type CurrentFortune, type SajuChart, getCurrentFortune } from "../chart";
import { MAPPINGS } from "./mappings";
import { natalModifierTrace } from "./natal";
import { synergyModifierTrace } from "./synergy";
import { transitModifierTrace } from "./transit";

export type SajuLayer = "natal" | "daeun" | "annual" | "monthly" | "synergy";
export const SAJU_LAYERS: SajuLayer[] = ["natal", "daeun", "annual", "monthly", "synergy"];

export interface SajuModifierResult {
  date: GameDate;
  fortune: CurrentFortune;
  /** Final combined (clamped) modifiers. */
  modifiers: LifeModifiers;
  /** Per-layer totals, unclamped. */
  layerTotals: Record<SajuLayer, LifeModifiers>;
  /** Every individual contribution with its source. */
  trace: Record<SajuLayer, Modifier[]>;
  activeSynergies: Array<{ id: string; label: string; intensity: number }>;
}

export class SajuModifierEngine {
  private natalCache = new WeakMap<SajuChart, Modifier[]>();

  natalTrace(chart: SajuChart): Modifier[] {
    let t = this.natalCache.get(chart);
    if (!t) {
      const scale = MAPPINGS.layerScales.natal;
      t = natalModifierTrace(chart).map((m) => ({ ...m, value: m.value * scale }));
      this.natalCache.set(chart, t);
    }
    return t;
  }

  calculateDetailed(chart: SajuChart, currentDate: GameDate): SajuModifierResult {
    const fortune = getCurrentFortune(chart, currentDate);
    const synergy = synergyModifierTrace(chart, fortune);
    const trace: Record<SajuLayer, Modifier[]> = {
      natal: this.natalTrace(chart),
      daeun: fortune.daeun ? transitModifierTrace(fortune.daeun, "daeun") : [],
      annual: transitModifierTrace(fortune.annual, "annual"),
      monthly: transitModifierTrace(fortune.monthly, "monthly"),
      synergy: synergy.trace.map((m) => ({ ...m, value: m.value * MAPPINGS.layerScales.synergy })),
    };
    const layerTotals = Object.fromEntries(SAJU_LAYERS.map((l) => [l, sumModifierList(trace[l])])) as Record<SajuLayer, LifeModifiers>;
    return {
      date: currentDate,
      fortune,
      modifiers: combineModifiers(...SAJU_LAYERS.map((l) => layerTotals[l])),
      layerTotals,
      trace,
      activeSynergies: synergy.active,
    };
  }

  calculate(chart: SajuChart, currentDate: GameDate): LifeModifiers {
    return this.calculateDetailed(chart, currentDate).modifiers;
  }

  /** Package as a destiny source so it can be merged with Astrology / MBTI. */
  toModifierSource(result: SajuModifierResult, weight = 1): DestinyModifierSource {
    return { source: "SAJU", modifiers: result.modifiers, weight, breakdown: SAJU_LAYERS.flatMap((l) => result.trace[l]) };
  }
}

// ---- Static interpretation for display ------------------------------------

export type TendencyArrow = "↑↑" | "↑" | "→" | "↓" | "↓↓";

export interface SajuSimulationInterpretation {
  /** Natal-only modifiers (the life-long "shape"). */
  tendencies: LifeModifiers;
  labels: Array<{ key: LifeModifierKey; value: number; arrow: TendencyArrow }>;
  disclaimer: string;
}

export function arrowFor(value: number): TendencyArrow {
  if (value >= 0.3) return "↑↑";
  if (value >= 0.1) return "↑";
  if (value <= -0.3) return "↓↓";
  if (value <= -0.1) return "↓";
  return "→";
}

/** Gameplay reading of the natal chart, kept separate from the raw chart data. */
export function interpretSajuForSimulation(chart: SajuChart, engine = new SajuModifierEngine()): SajuSimulationInterpretation {
  const tendencies = combineModifiers(sumModifierList(engine.natalTrace(chart)));
  const labels = LIFE_MODIFIER_KEYS.map((key) => ({ key, value: tendencies[key], arrow: arrowFor(tendencies[key]) })).sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  );
  return {
    tendencies,
    labels,
    disclaimer: "Fictional game tendencies derived from the chart. They shift probabilities in this simulation; they do not predict real life.",
  };
}
