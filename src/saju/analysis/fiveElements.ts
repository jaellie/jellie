/**
 * Layer B — Five Element (五行) relationships and distribution.
 * All generation/control logic in the project must go through these helpers.
 */
import elementData from "../../../data/saju/fiveElements.json";
import {
  type FiveElement,
  type FourPillars,
  type Pillar,
  type PillarPosition,
  branchInfo,
  stemInfo,
} from "../types";

export const ELEMENTS: FiveElement[] = elementData.order as FiveElement[];

type ElementDef = { hanja: string; ko: string; generates: FiveElement; controls: FiveElement };
const DEFS = elementData.elements as Record<FiveElement, ElementDef>;

export function elementHanja(e: FiveElement): string {
  return DEFS[e].hanja;
}

/** The element that `element` generates (e.g. WOOD → FIRE). */
export function getGeneratingElement(element: FiveElement): FiveElement {
  return DEFS[element].generates;
}
/** The element that generates `element` (e.g. WOOD ← WATER). */
export function getGeneratedByElement(element: FiveElement): FiveElement {
  return ELEMENTS.find((e) => DEFS[e].generates === element)!;
}
/** The element that `element` controls (e.g. WOOD → EARTH). */
export function getControllingElement(element: FiveElement): FiveElement {
  return DEFS[element].controls;
}
/** The element that controls `element` (e.g. WOOD ← METAL). */
export function getControlledElement(element: FiveElement): FiveElement {
  return ELEMENTS.find((e) => DEFS[e].controls === element)!;
}

export type ElementRelationship = "SAME" | "GENERATES" | "GENERATED_BY" | "CONTROLS" | "CONTROLLED_BY";

/** Relationship of `a` towards `b`. */
export function getElementRelationship(a: FiveElement, b: FiveElement): ElementRelationship {
  if (a === b) return "SAME";
  if (getGeneratingElement(a) === b) return "GENERATES";
  if (getGeneratingElement(b) === a) return "GENERATED_BY";
  if (getControllingElement(a) === b) return "CONTROLS";
  return "CONTROLLED_BY";
}

// ---- Distribution --------------------------------------------------------

export interface FiveElementDistribution {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export const ELEMENT_KEY: Record<FiveElement, keyof FiveElementDistribution> = {
  WOOD: "wood",
  FIRE: "fire",
  EARTH: "earth",
  METAL: "metal",
  WATER: "water",
};

export function emptyDistribution(): FiveElementDistribution {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}

export function distributionValue(d: FiveElementDistribution, e: FiveElement): number {
  return d[ELEMENT_KEY[e]];
}

/**
 * Weighting model (documented in docs/saju-engine.md):
 *  - each visible stem = 1.0
 *  - each branch = 1.0 split across its hidden stems by their weights
 *  - the month branch is multiplied by 2.0 (월령 / seasonal command)
 * Hour pillar is skipped when unknown.
 */
export const DISTRIBUTION_WEIGHTS = { stem: 1, branch: 1, monthBranchMultiplier: 2 };

export function addPillarElements(d: FiveElementDistribution, p: Pillar, branchMultiplier = 1, stemWeight = DISTRIBUTION_WEIGHTS.stem): void {
  d[ELEMENT_KEY[stemInfo(p.heavenlyStem).element]] += stemWeight;
  for (const h of branchInfo(p.earthlyBranch).hiddenStems) {
    d[ELEMENT_KEY[stemInfo(h.stem).element]] += DISTRIBUTION_WEIGHTS.branch * branchMultiplier * h.weight;
  }
}

/** Raw weighted counts. */
export function rawElementDistribution(pillars: FourPillars): FiveElementDistribution {
  const d = emptyDistribution();
  const positions: PillarPosition[] = ["year", "month", "day", "hour"];
  for (const pos of positions) {
    const p = pillars[pos];
    if (!p) continue;
    addPillarElements(d, p, pos === "month" ? DISTRIBUTION_WEIGHTS.monthBranchMultiplier : 1);
  }
  return d;
}

/** Scale to percentages (sum = 100). */
export function normalizeDistribution(d: FiveElementDistribution): FiveElementDistribution {
  const total = d.wood + d.fire + d.earth + d.metal + d.water;
  if (total === 0) return emptyDistribution();
  const f = 100 / total;
  return { wood: d.wood * f, fire: d.fire * f, earth: d.earth * f, metal: d.metal * f, water: d.water * f };
}

export function pillarElementDistribution(p: Pillar): FiveElementDistribution {
  const d = emptyDistribution();
  addPillarElements(d, p);
  return normalizeDistribution(d);
}
