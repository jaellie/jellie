/**
 * Layer B — shared analysis of a "transit" pillar (Daeun / 세운 / 월운)
 * against the natal chart.
 */
import type { FourPillars, HeavenlyStem, Pillar, FiveElement } from "../types";
import { branchInfo, stemInfo } from "../types";
import { type FiveElementDistribution, pillarElementDistribution, getElementRelationship, type ElementRelationship } from "./fiveElements";
import { type ElementInteraction, findInteractions, type LabeledPillar } from "./relations";
import { type ShinsalResult, calculateTransitShinsal } from "./shinsal";
import { type TenGod, type TenGodDistribution, getTenGod, tenGodDistributionForPillars } from "./tenGods";
import { mainHiddenStem } from "../types";

export interface TenGodInteraction {
  part: "stem" | "branch";
  character: string;
  tenGod: TenGod;
  element: FiveElement;
  /** Relation of this element toward the Day Master's element. */
  relationToDayMaster: ElementRelationship;
  /** +1 favorable element, −1 unfavorable, 0 neutral (per ElementBalance). */
  favorability: -1 | 0 | 1;
}

export interface TransitPillarAnalysis {
  pillar: Pillar;
  elementDistribution: FiveElementDistribution;
  tenGodDistribution: TenGodDistribution;
  tenGodInteractions: TenGodInteraction[];
  elementInteraction: ElementInteraction[];
  /** Shinsal the transit branch activates for this chart (present ones only). */
  activatedShinsal: ShinsalResult[];
}

export function natalLabeledPillars(fp: FourPillars): LabeledPillar[] {
  const out: LabeledPillar[] = [
    { label: "year", pillar: fp.year },
    { label: "month", pillar: fp.month },
    { label: "day", pillar: fp.day },
  ];
  if (fp.hour) out.push({ label: "hour", pillar: fp.hour });
  return out;
}

export function analyzeTransitPillar(
  fp: FourPillars,
  dayMaster: HeavenlyStem,
  favorable: FiveElement[] | undefined,
  unfavorable: FiveElement[] | undefined,
  pillar: Pillar,
  label: string,
  extraContext: LabeledPillar[] = [],
): TransitPillarAnalysis {
  const dmEl = stemInfo(dayMaster).element;
  const fav = (e: FiveElement): -1 | 0 | 1 => (favorable?.includes(e) ? 1 : unfavorable?.includes(e) ? -1 : 0);
  const stemEl = stemInfo(pillar.heavenlyStem).element;
  const branchEl = branchInfo(pillar.earthlyBranch).element;
  return {
    pillar,
    elementDistribution: pillarElementDistribution(pillar),
    tenGodDistribution: tenGodDistributionForPillars(dayMaster, [{ pillar }]),
    tenGodInteractions: [
      {
        part: "stem",
        character: pillar.heavenlyStem,
        tenGod: getTenGod(dayMaster, pillar.heavenlyStem),
        element: stemEl,
        relationToDayMaster: getElementRelationship(stemEl, dmEl),
        favorability: fav(stemEl),
      },
      {
        part: "branch",
        character: pillar.earthlyBranch,
        tenGod: getTenGod(dayMaster, mainHiddenStem(pillar.earthlyBranch)),
        element: branchEl,
        relationToDayMaster: getElementRelationship(branchEl, dmEl),
        favorability: fav(branchEl),
      },
    ],
    elementInteraction: findInteractions([...natalLabeledPillars(fp), ...extraContext, { label, pillar }], [label]),
    activatedShinsal: calculateTransitShinsal(fp, pillar.earthlyBranch, label).filter((s) => s.present),
  };
}
