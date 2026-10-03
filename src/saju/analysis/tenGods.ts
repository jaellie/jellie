/**
 * Layer B — Ten Gods (十神), always relative to the Day Master.
 */
import tenGodData from "../../../data/saju/tenGods.json";
import { type FourPillars, type HeavenlyStem, type Pillar, type PillarPosition, branchInfo, mainHiddenStem, stemInfo } from "../types";
import { getElementRelationship } from "./fiveElements";

export type TenGod =
  | "BI_GYEON"
  | "GYEOB_JAE"
  | "SIK_SHIN"
  | "SANG_GWAN"
  | "JEONG_JAE"
  | "PYEON_JAE"
  | "JEONG_GWAN"
  | "CHIL_SAL"
  | "JEONG_IN"
  | "PYEON_IN";

/** Five families: 比劫 / 食傷 / 財 / 官 / 印 */
export type TenGodGroup = "PEER" | "OUTPUT" | "WEALTH" | "OFFICER" | "RESOURCE";

export interface TenGodDistribution {
  peer: number;
  competition: number;
  expression: number;
  creativity: number;
  directWealth: number;
  indirectWealth: number;
  directOfficer: number;
  sevenKillings: number;
  directResource: number;
  indirectResource: number;
}

export interface TenGodInfo {
  id: TenGod;
  hanja: string;
  ko: string;
  en: string;
  relation: "SAME" | "DM_GENERATES" | "DM_CONTROLS" | "CONTROLS_DM" | "GENERATES_DM";
  samePolarity: boolean;
  distributionKey: keyof TenGodDistribution;
  group: TenGodGroup;
}

export const TEN_GODS: TenGodInfo[] = tenGodData.tenGods as TenGodInfo[];
const byId = new Map(TEN_GODS.map((t) => [t.id, t]));

export function tenGodInfo(id: TenGod): TenGodInfo {
  return byId.get(id)!;
}

const RELATION_FROM_ELEMENT = {
  SAME: "SAME",
  GENERATES: "DM_GENERATES",
  CONTROLS: "DM_CONTROLS",
  CONTROLLED_BY: "CONTROLS_DM",
  GENERATED_BY: "GENERATES_DM",
} as const;

/** Ten God of `target` stem as seen from `dayMaster` stem. */
export function getTenGod(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGod {
  const dm = stemInfo(dayMaster);
  const t = stemInfo(target);
  const relation = RELATION_FROM_ELEMENT[getElementRelationship(dm.element, t.element)];
  const samePolarity = dm.yinYang === t.yinYang;
  return TEN_GODS.find((g) => g.relation === relation && g.samePolarity === samePolarity)!.id;
}

export function emptyTenGodDistribution(): TenGodDistribution {
  return {
    peer: 0,
    competition: 0,
    expression: 0,
    creativity: 0,
    directWealth: 0,
    indirectWealth: 0,
    directOfficer: 0,
    sevenKillings: 0,
    directResource: 0,
    indirectResource: 0,
  };
}

export interface PillarTenGods {
  position: PillarPosition;
  /** undefined for the Day Master itself (日干). */
  stem?: TenGod;
  /** Ten God of the branch's main qi (정기). */
  branch: TenGod;
  hidden: Array<{ stem: HeavenlyStem; tenGod: TenGod; weight: number }>;
}

export function pillarTenGods(dayMaster: HeavenlyStem, pillar: Pillar, position: PillarPosition): PillarTenGods {
  return {
    position,
    stem: position === "day" ? undefined : getTenGod(dayMaster, pillar.heavenlyStem),
    branch: getTenGod(dayMaster, mainHiddenStem(pillar.earthlyBranch)),
    hidden: branchInfo(pillar.earthlyBranch).hiddenStems.map((h) => ({
      stem: h.stem,
      tenGod: getTenGod(dayMaster, h.stem),
      weight: h.weight,
    })),
  };
}

/**
 * Weighted Ten God distribution, same weighting as the element distribution
 * (stem 1, branch 1 split by hidden stems, month branch ×2). The Day Master's
 * own stem is excluded. Returned as percentages (sum = 100).
 */
export function tenGodDistributionForPillars(
  dayMaster: HeavenlyStem,
  pillars: Array<{ pillar: Pillar; position?: PillarPosition }>,
): TenGodDistribution {
  const d = emptyTenGodDistribution();
  for (const { pillar, position } of pillars) {
    if (position !== "day") d[tenGodInfo(getTenGod(dayMaster, pillar.heavenlyStem)).distributionKey] += 1;
    const mult = position === "month" ? 2 : 1;
    for (const h of branchInfo(pillar.earthlyBranch).hiddenStems) {
      d[tenGodInfo(getTenGod(dayMaster, h.stem)).distributionKey] += mult * h.weight;
    }
  }
  const total = Object.values(d).reduce((a, b) => a + b, 0);
  if (total > 0) for (const k of Object.keys(d) as Array<keyof TenGodDistribution>) d[k] = (d[k] * 100) / total;
  return d;
}

export function natalTenGodDistribution(dayMaster: HeavenlyStem, fp: FourPillars): TenGodDistribution {
  const list: Array<{ pillar: Pillar; position: PillarPosition }> = [
    { pillar: fp.year, position: "year" },
    { pillar: fp.month, position: "month" },
    { pillar: fp.day, position: "day" },
  ];
  if (fp.hour) list.push({ pillar: fp.hour, position: "hour" });
  return tenGodDistributionForPillars(dayMaster, list);
}

/** Collapse the 10-way distribution into the 5 families. */
export function tenGodGroupTotals(d: TenGodDistribution): Record<TenGodGroup, number> {
  return {
    PEER: d.peer + d.competition,
    OUTPUT: d.expression + d.creativity,
    WEALTH: d.directWealth + d.indirectWealth,
    OFFICER: d.directOfficer + d.sevenKillings,
    RESOURCE: d.directResource + d.indirectResource,
  };
}

export function tenGodsOfPillarStem(dayMaster: HeavenlyStem, p: Pillar): { stem: TenGod; branch: TenGod } {
  return { stem: getTenGod(dayMaster, p.heavenlyStem), branch: getTenGod(dayMaster, mainHiddenStem(p.earthlyBranch)) };
}
