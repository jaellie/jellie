/**
 * Layer B — Day Master (日主) and element balance / strength.
 *
 * INTERPRETATION MODEL (kept isolated here, documented in docs/saju-engine.md):
 *  Strength = share of the chart's weighted element mass (excluding the day stem
 *  itself) that SUPPORTS the Day Master: its own element (比劫) + the element
 *  that generates it (印). The month branch counts double (월령).
 *    strength ≥ 0.50 → STRONG, < 0.35 → WEAK, otherwise BALANCED.
 *  Favorable / unfavorable (용신·희신 / 기신) use a simplified 억부 (扶抑) rule:
 *    STRONG   → favor what drains/controls the DM (食傷, 財, 官); disfavor 比劫, 印
 *    WEAK     → favor 印 and 比劫; disfavor 官, 財, 食傷
 *    BALANCED → favor the weakest elements; disfavor the strongest
 *  조후 (climate balancing) and 격국 (structure) schools are NOT modeled.
 */
import { type FiveElement, type FourPillars, type HeavenlyStem, type YinYang, stemInfo } from "../types";
import {
  ELEMENTS,
  type FiveElementDistribution,
  distributionValue,
  getControlledElement,
  getControllingElement,
  getGeneratedByElement,
  getGeneratingElement,
  normalizeDistribution,
  rawElementDistribution,
  ELEMENT_KEY,
} from "./fiveElements";

export interface DayMaster {
  stem: HeavenlyStem;
  element: FiveElement;
  yinYang: YinYang;
  /** 0..1 share of supporting element mass. */
  strength?: number;
}

export type DayMasterStrengthClass = "STRONG" | "BALANCED" | "WEAK";

export interface ElementBalance {
  /** Percentages, sum = 100. */
  distribution: FiveElementDistribution;
  strongest: FiveElement[];
  weakest: FiveElement[];
  favorable?: FiveElement[];
  unfavorable?: FiveElement[];
  /** Name of the interpretation model that produced favorable/unfavorable. */
  favorableModel?: "EOKBU_SIMPLIFIED";
}

export const STRENGTH_THRESHOLDS = { strong: 0.5, weak: 0.35 };

/** Elements grouped by their relation to the DM. */
export function elementRoles(dm: FiveElement) {
  return {
    peer: dm,
    resource: getGeneratedByElement(dm),
    output: getGeneratingElement(dm),
    wealth: getControllingElement(dm),
    officer: getControlledElement(dm),
  };
}

export function calculateDayMaster(fp: FourPillars): DayMaster {
  const info = stemInfo(fp.day.heavenlyStem);
  const raw = rawElementDistribution(fp);
  raw[ELEMENT_KEY[info.element]] -= 1; // exclude the day stem itself
  const total = ELEMENTS.reduce((s, e) => s + distributionValue(raw, e), 0);
  const roles = elementRoles(info.element);
  const support = distributionValue(raw, roles.peer) + distributionValue(raw, roles.resource);
  return { stem: info.id, element: info.element, yinYang: info.yinYang, strength: total > 0 ? support / total : 0.5 };
}

export function classifyStrength(strength: number): DayMasterStrengthClass {
  if (strength >= STRENGTH_THRESHOLDS.strong) return "STRONG";
  if (strength < STRENGTH_THRESHOLDS.weak) return "WEAK";
  return "BALANCED";
}

function extremes(d: FiveElementDistribution, pick: "max" | "min"): FiveElement[] {
  const values = ELEMENTS.map((e) => distributionValue(d, e));
  const target = pick === "max" ? Math.max(...values) : Math.min(...values);
  return ELEMENTS.filter((e) => Math.abs(distributionValue(d, e) - target) < 1);
}

export function calculateElementBalance(fp: FourPillars, dm: DayMaster): ElementBalance {
  const distribution = normalizeDistribution(rawElementDistribution(fp));
  const strongest = extremes(distribution, "max");
  const weakest = extremes(distribution, "min");
  const roles = elementRoles(dm.element);
  const cls = classifyStrength(dm.strength ?? 0.5);
  let favorable: FiveElement[];
  let unfavorable: FiveElement[];
  if (cls === "STRONG") {
    favorable = [roles.output, roles.wealth, roles.officer];
    unfavorable = [roles.peer, roles.resource];
  } else if (cls === "WEAK") {
    favorable = [roles.resource, roles.peer];
    unfavorable = [roles.officer, roles.wealth, roles.output];
  } else {
    favorable = weakest;
    unfavorable = strongest.filter((e) => !weakest.includes(e));
  }
  return { distribution, strongest, weakest, favorable, unfavorable, favorableModel: "EOKBU_SIMPLIFIED" };
}
