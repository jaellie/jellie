/**
 * Layer B — modular Shinsal (神煞).
 *
 * Rules are data (data/saju/shinsal.json). Each rule has a `type` handled by
 * one small evaluator in RULE_EVALUATORS; adding a new rule type means adding
 * one evaluator, adding a new shinsal of an existing type needs no code.
 */
import shinsalData from "../../../data/saju/shinsal.json";
import rel from "../../../data/saju/relations.json";
import type { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem, PillarPosition } from "../types";

export interface ShinsalResult {
  id: string;
  nameKo: string;
  nameEn: string;
  hanja?: string;
  present: boolean;
  /** 0..1 */
  strength: number;
  /** e.g. ["day→hour:YIN", "year→month:YIN"] */
  source?: string[];
}

export interface ShinsalRule {
  id: string;
  nameKo: string;
  nameEn: string;
  hanja: string;
  type: string;
  reference: PillarPosition[];
  targets: Record<string, string | string[]>;
}

export const SHINSAL_RULES: ShinsalRule[] = shinsalData.rules as unknown as ShinsalRule[];
const POSITION_WEIGHTS = shinsalData.positionWeights as Record<PillarPosition, number>;
const REFERENCE_WEIGHTS = shinsalData.referenceWeights as Record<string, number>;

/** A branch/stem to test against, with a label and weight. */
export interface ShinsalCandidate {
  label: string;
  branch: EarthlyBranch;
  weight: number;
}

/** Given a reference pillar, return the target branches the rule looks for. */
type RuleEvaluator = (rule: ShinsalRule, ref: { stem: HeavenlyStem; branch: EarthlyBranch }) => EarthlyBranch[];

function samhapGroupOf(branch: EarthlyBranch): FiveElement | undefined {
  return rel.branchThreeHarmonies.find((g) => g.branches.includes(branch))?.element as FiveElement | undefined;
}

export const RULE_EVALUATORS: Record<string, RuleEvaluator> = {
  /** 역마/도화/화개 family: reference branch's 三合 frame → one target branch. */
  SAMHAP_GROUP_TARGET: (rule, ref) => {
    const group = samhapGroupOf(ref.branch);
    const t = group ? rule.targets[group] : undefined;
    return t ? [t as EarthlyBranch] : [];
  },
  /** 천을귀인 family: reference stem → target branches. */
  STEM_TO_BRANCHES: (rule, ref) => ((rule.targets[ref.stem] as string[] | undefined) ?? []) as EarthlyBranch[],
};

function evaluateRule(rule: ShinsalRule, fp: FourPillars, candidates: ShinsalCandidate[], excludeSelf: boolean): ShinsalResult {
  const evaluator = RULE_EVALUATORS[rule.type];
  if (!evaluator) throw new Error(`Unknown shinsal rule type "${rule.type}" for ${rule.id}`);
  let strength = 0;
  const source: string[] = [];
  for (const refPos of rule.reference) {
    const refPillar = fp[refPos];
    if (!refPillar) continue;
    const targets = evaluator(rule, { stem: refPillar.heavenlyStem, branch: refPillar.earthlyBranch });
    for (const c of candidates) {
      if (excludeSelf && c.label === refPos) continue;
      if (targets.includes(c.branch)) {
        strength += (REFERENCE_WEIGHTS[refPos] ?? 1) * c.weight;
        source.push(`${refPos}→${c.label}:${c.branch}`);
      }
    }
  }
  strength = Math.min(1, strength);
  return { id: rule.id, nameKo: rule.nameKo, nameEn: rule.nameEn, hanja: rule.hanja, present: strength > 0, strength, source };
}

/** Natal shinsal: targets searched among the chart's own branches. */
export function calculateNatalShinsal(fp: FourPillars, rules: ShinsalRule[] = SHINSAL_RULES): ShinsalResult[] {
  const candidates: ShinsalCandidate[] = (["year", "month", "day", "hour"] as PillarPosition[])
    .filter((p) => fp[p])
    .map((p) => ({ label: p, branch: fp[p]!.earthlyBranch, weight: POSITION_WEIGHTS[p] }));
  return rules.map((r) => evaluateRule(r, fp, candidates, true));
}

/**
 * Transit activation: does a Daeun/annual/monthly branch hit a shinsal target
 * of the natal chart? (e.g. a 역마 year for this person.)
 */
export function calculateTransitShinsal(
  fp: FourPillars,
  transitBranch: EarthlyBranch,
  label: string,
  rules: ShinsalRule[] = SHINSAL_RULES,
): ShinsalResult[] {
  return rules.map((r) => evaluateRule(r, fp, [{ label, branch: transitBranch, weight: 1 }], false));
}

export function shinsalStrength(results: ShinsalResult[], id: string): number {
  return results.find((r) => r.id === id)?.strength ?? 0;
}
