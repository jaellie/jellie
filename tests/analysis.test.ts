import { describe, expect, it } from "vitest";
import {
  getControlledElement,
  getControllingElement,
  getElementRelationship,
  getGeneratedByElement,
  getGeneratingElement,
  normalizeDistribution,
  rawElementDistribution,
} from "../src/saju/analysis/fiveElements";
import { calculateDayMaster, calculateElementBalance, classifyStrength } from "../src/saju/analysis/dayMaster";
import { getTenGod, natalTenGodDistribution } from "../src/saju/analysis/tenGods";
import { findInteractions } from "../src/saju/analysis/relations";
import { calculateNatalShinsal, calculateTransitShinsal, shinsalStrength } from "../src/saju/analysis/shinsal";
import { branchInfo, stemInfo, mainHiddenStem } from "../src/saju/types";
import { calculateNatalChart } from "../src/saju/chart";
import { EXAMPLE_PLAYER, Y2K_NOON, pillars } from "./fixtures";

describe("Five Elements", () => {
  it("maps stems and branches to elements and polarity", () => {
    expect(stemInfo("JIA")).toMatchObject({ element: "WOOD", yinYang: "YANG" });
    expect(stemInfo("GUI")).toMatchObject({ element: "WATER", yinYang: "YIN" });
    expect(branchInfo("WU").element).toBe("FIRE");
    expect(branchInfo("CHOU").element).toBe("EARTH");
    expect(mainHiddenStem("YIN")).toBe("JIA");
    expect(mainHiddenStem("XU")).toBe("WU");
  });

  it("generation and control cycles", () => {
    expect(getGeneratingElement("WOOD")).toBe("FIRE");
    expect(getGeneratingElement("WATER")).toBe("WOOD");
    expect(getGeneratedByElement("WOOD")).toBe("WATER");
    expect(getControllingElement("WOOD")).toBe("EARTH");
    expect(getControllingElement("FIRE")).toBe("METAL");
    expect(getControlledElement("WOOD")).toBe("METAL");
    expect(getElementRelationship("WATER", "FIRE")).toBe("CONTROLS");
    expect(getElementRelationship("FIRE", "WATER")).toBe("CONTROLLED_BY");
    expect(getElementRelationship("EARTH", "METAL")).toBe("GENERATES");
    expect(getElementRelationship("METAL", "EARTH")).toBe("GENERATED_BY");
    expect(getElementRelationship("FIRE", "FIRE")).toBe("SAME");
  });

  it("distribution is normalized to 100 and weights the month branch", () => {
    const fp = pillars("JIA/ZI", "BING/YIN", "JIA/CHEN", "YI/CHOU");
    const d = normalizeDistribution(rawElementDistribution(fp));
    expect(d.wood + d.fire + d.earth + d.metal + d.water).toBeCloseTo(100);
    expect(d.wood).toBeGreaterThan(d.metal);
  });
});

describe("Day Master", () => {
  it("is the day stem", () => {
    const dm = calculateDayMaster(calculateNatalChart(Y2K_NOON).fourPillars);
    expect(dm).toMatchObject({ stem: "WU", element: "EARTH", yinYang: "YANG" });
    expect(dm.strength).toBeGreaterThan(0);
    expect(dm.strength).toBeLessThan(1);
  });

  it("strength classification and 억부 favorable elements", () => {
    // 甲 day surrounded by wood/water → strong
    const strong = pillars("REN/ZI", "JIA/YIN", "JIA/YIN", "YI/MAO");
    const dm = calculateDayMaster(strong);
    expect(classifyStrength(dm.strength!)).toBe("STRONG");
    const bal = calculateElementBalance(strong, dm);
    expect(bal.favorable).toEqual(expect.arrayContaining(["FIRE", "EARTH", "METAL"]));
    expect(bal.unfavorable).toEqual(expect.arrayContaining(["WOOD", "WATER"]));
    // 甲 day surrounded by metal/earth → weak
    const weak = pillars("GENG/SHEN", "XIN/YOU", "JIA/SHEN", "WU/CHEN");
    const dmw = calculateDayMaster(weak);
    expect(classifyStrength(dmw.strength!)).toBe("WEAK");
    expect(calculateElementBalance(weak, dmw).favorable).toEqual(["WATER", "WOOD"]);
  });
});

describe("Ten Gods", () => {
  it("甲 Day Master full table", () => {
    const expected = {
      JIA: "BI_GYEON", YI: "GYEOB_JAE", BING: "SIK_SHIN", DING: "SANG_GWAN", WU: "PYEON_JAE",
      JI: "JEONG_JAE", GENG: "CHIL_SAL", XIN: "JEONG_GWAN", REN: "PYEON_IN", GUI: "JEONG_IN",
    } as const;
    for (const [stem, god] of Object.entries(expected)) expect(getTenGod("JIA", stem as keyof typeof expected)).toBe(god);
  });

  it("yin Day Master (癸)", () => {
    expect(getTenGod("GUI", "REN")).toBe("GYEOB_JAE");
    expect(getTenGod("GUI", "YI")).toBe("SIK_SHIN");
    expect(getTenGod("GUI", "BING")).toBe("JEONG_JAE");
    expect(getTenGod("GUI", "DING")).toBe("PYEON_JAE");
    expect(getTenGod("GUI", "WU")).toBe("JEONG_GWAN");
    expect(getTenGod("GUI", "JI")).toBe("CHIL_SAL");
    expect(getTenGod("GUI", "GENG")).toBe("JEONG_IN");
    expect(getTenGod("GUI", "XIN")).toBe("PYEON_IN");
  });

  it("distribution excludes the Day Master itself and sums to 100", () => {
    const c = calculateNatalChart(EXAMPLE_PLAYER);
    const d = natalTenGodDistribution("GUI", c.fourPillars);
    expect(Object.values(d).reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(c.tenGods.byPillar.find((p) => p.position === "day")!.stem).toBeUndefined();
    // 癸 with lots of metal → Resource dominates
    expect(c.tenGods.groups.RESOURCE).toBeGreaterThan(c.tenGods.groups.PEER);
  });
});

describe("Interactions (合沖刑害)", () => {
  it("finds clashes, harmonies and stem combinations", () => {
    const fp = pillars("JIA/ZI", "JI/CHOU", "GENG/WU", "BING/XU");
    const types = findInteractions([
      { label: "year", pillar: fp.year },
      { label: "month", pillar: fp.month },
      { label: "day", pillar: fp.day },
      { label: "hour", pillar: fp.hour! },
    ]).map((i) => `${i.type}:${i.between.join("+")}`);
    expect(types).toContain("STEM_COMBINATION:year+month"); // 甲己
    expect(types).toContain("SIX_HARMONY:year+month"); // 子丑
    expect(types).toContain("BRANCH_CLASH:year+day"); // 子午
    expect(types).toContain("STEM_CLASH:year+day"); // 甲庚
    expect(types).toContain("HALF_HARMONY:day+hour"); // 午戌 (fire)
    expect(types).toContain("HARM:month+day"); // 丑午
  });
});

describe("Shinsal", () => {
  it("驛馬: 子 year → 寅 elsewhere", () => {
    const r = calculateNatalShinsal(pillars("JIA/ZI", "BING/YIN", "JIA/WU", "YI/HAI"));
    const y = r.find((s) => s.id === "YEOKMA")!;
    expect(y.present).toBe(true);
    expect(y.source).toContain("year→month:YIN");
    expect(y.strength).toBeGreaterThan(0.5);
  });

  it("桃花 / 華蓋 / 天乙貴人", () => {
    // day 子 (water frame) → 桃花 酉, 華蓋 辰; 甲 day → 貴人 丑/未
    const fp = pillars("GUI/YOU", "WU/CHEN", "JIA/ZI", "YI/CHOU");
    const r = calculateNatalShinsal(fp);
    expect(shinsalStrength(r, "DOHWA")).toBeGreaterThan(0);
    expect(shinsalStrength(r, "HWAGAE")).toBeGreaterThan(0);
    expect(shinsalStrength(r, "CHEONEUL_GWIIN")).toBeGreaterThan(0);
  });

  it("absent shinsal have zero strength", () => {
    const r = calculateNatalShinsal(pillars("JIA/ZI", "BING/ZI", "JIA/ZI", "JIA/ZI"));
    expect(shinsalStrength(r, "YEOKMA")).toBe(0);
    expect(r.find((s) => s.id === "YEOKMA")!.present).toBe(false);
  });

  it("transit branch can activate a shinsal", () => {
    const fp = pillars("JIA/ZI", "BING/ZI", "JIA/ZI", "JIA/ZI");
    const t = calculateTransitShinsal(fp, "YIN", "annual");
    expect(t.find((s) => s.id === "YEOKMA")!.present).toBe(true);
  });
});
