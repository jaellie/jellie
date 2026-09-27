import type { BirthData } from "../src/saju/calendar/fourPillars";
import type { FourPillars, HeavenlyStem, EarthlyBranch } from "../src/saju/types";

/** 己卯 丙子 戊午 戊午 — widely cited reference chart. */
export const Y2K_NOON: BirthData = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, sex: "MALE" };
/** 丁丑 己酉 癸酉 丁巳 — the task's example player. */
export const EXAMPLE_PLAYER: BirthData = { year: 1997, month: 9, day: 28, hour: 9, minute: 30, sex: "FEMALE" };
/** 乙亥 戊寅 戊辰 丁巳 — double 驛馬 (寅 from 辰-day, 巳 from 亥-year), strong 官 + 印. */
export const STRONG_YEOKMA: BirthData = { year: 1995, month: 2, day: 6, hour: 10, minute: 0, sex: "MALE" };
/** 甲戌 丙子 壬辰 乙巳 — no 驛馬, no 桃花. */
export const NO_YEOKMA: BirthData = { year: 1995, month: 1, day: 1, hour: 10, minute: 0, sex: "MALE" };

export function pillars(y: string, m: string, d: string, h?: string): FourPillars {
  const p = (s: string) => {
    const [stem, branch] = s.split("/");
    return { heavenlyStem: stem as HeavenlyStem, earthlyBranch: branch as EarthlyBranch };
  };
  return { year: p(y), month: p(m), day: p(d), hour: h ? p(h) : undefined };
}
