/**
 * Core Saju (四柱八字) primitives: stems, branches, elements, polarity, pillars.
 * Reference data lives in data/saju/*.json; this module only types and indexes it.
 */
import stemData from "../../data/saju/heavenlyStems.json";
import branchData from "../../data/saju/earthlyBranches.json";

export type HeavenlyStem = "JIA" | "YI" | "BING" | "DING" | "WU" | "JI" | "GENG" | "XIN" | "REN" | "GUI";

export type EarthlyBranch =
  | "ZI"
  | "CHOU"
  | "YIN"
  | "MAO"
  | "CHEN"
  | "SI"
  | "WU"
  | "WEI"
  | "SHEN"
  | "YOU"
  | "XU"
  | "HAI";

export type FiveElement = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";
export type YinYang = "YANG" | "YIN";

export interface Pillar {
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** Absent when the birth time is unknown. */
  hour?: Pillar;
}

export type PillarPosition = "year" | "month" | "day" | "hour";
export const PILLAR_POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];

export interface StemInfo {
  id: HeavenlyStem;
  hanja: string;
  ko: string;
  element: FiveElement;
  yinYang: YinYang;
}

export interface BranchInfo {
  id: EarthlyBranch;
  hanja: string;
  ko: string;
  animal: string;
  element: FiveElement;
  yinYang: YinYang;
  /** 지장간, ordered residual → main; weights sum to 1. */
  hiddenStems: Array<{ stem: HeavenlyStem; weight: number }>;
}

export const STEMS: readonly StemInfo[] = stemData.stems as StemInfo[];
export const BRANCHES: readonly BranchInfo[] = branchData.branches.map((b) => ({
  ...b,
  hiddenStems: b.hiddenStems.map(([stem, weight]) => ({ stem: stem as HeavenlyStem, weight: weight as number })),
})) as BranchInfo[];

export const STEM_IDS = STEMS.map((s) => s.id);
export const BRANCH_IDS = BRANCHES.map((b) => b.id);

const stemIndex = new Map(STEMS.map((s, i) => [s.id, i]));
const branchIndex = new Map(BRANCHES.map((b, i) => [b.id, i]));

export function stemInfo(stem: HeavenlyStem): StemInfo {
  return STEMS[stemIndex.get(stem)!];
}
export function branchInfo(branch: EarthlyBranch): BranchInfo {
  return BRANCHES[branchIndex.get(branch)!];
}
export function indexOfStem(stem: HeavenlyStem): number {
  return stemIndex.get(stem)!;
}
export function indexOfBranch(branch: EarthlyBranch): number {
  return branchIndex.get(branch)!;
}
export function stemAt(index: number): HeavenlyStem {
  return STEM_IDS[((index % 10) + 10) % 10];
}
export function branchAt(index: number): EarthlyBranch {
  return BRANCH_IDS[((index % 12) + 12) % 12];
}

/** Main qi (정기) of a branch — the last hidden stem. */
export function mainHiddenStem(branch: EarthlyBranch): HeavenlyStem {
  return branchInfo(branch).hiddenStems.at(-1)!.stem;
}

// ---- Sexagenary (60-cycle, 六十甲子) -------------------------------------

/** 0 = 甲子 … 59 = 癸亥. */
export function pillarFromCycleIndex(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  return { heavenlyStem: stemAt(i), earthlyBranch: branchAt(i) };
}

export function cycleIndexOfPillar(p: Pillar): number {
  const s = indexOfStem(p.heavenlyStem);
  const b = indexOfBranch(p.earthlyBranch);
  // Solve i ≡ s (mod 10), i ≡ b (mod 12); only valid when s and b share parity.
  for (let i = s; i < 60; i += 10) if (i % 12 === b) return i;
  throw new Error(`Invalid pillar ${p.heavenlyStem}/${p.earthlyBranch}: stem and branch parity differ`);
}

export function shiftPillar(p: Pillar, steps: number): Pillar {
  return pillarFromCycleIndex(cycleIndexOfPillar(p) + steps);
}

export function pillarToHanja(p: Pillar): string {
  return stemInfo(p.heavenlyStem).hanja + branchInfo(p.earthlyBranch).hanja;
}
export function pillarToKorean(p: Pillar): string {
  return stemInfo(p.heavenlyStem).ko + branchInfo(p.earthlyBranch).ko;
}
