import { describe, expect, it } from "vitest";
import { calculateNatalChart, getCurrentFortune } from "../src/saju/chart";
import { annualPillar, monthlyPillar } from "../src/saju/analysis/fortune";
import { daeunDirection, activeDaeun } from "../src/saju/analysis/daeun";
import { pillarToHanja } from "../src/saju/types";
import { EXAMPLE_PLAYER, Y2K_NOON } from "./fixtures";

describe("Daeun", () => {
  it("direction: yang-year male / yin-year female → forward", () => {
    expect(daeunDirection("YANG", "MALE")).toBe("FORWARD");
    expect(daeunDirection("YIN", "FEMALE")).toBe("FORWARD");
    expect(daeunDirection("YIN", "MALE")).toBe("BACKWARD");
    expect(daeunDirection("YANG", "FEMALE")).toBe("BACKWARD");
  });

  it("己卯-year male born 2000-01-01 runs backward from 丙子, starting ~8 years", () => {
    const d = calculateNatalChart(Y2K_NOON).daeun;
    expect(d.direction).toBe("BACKWARD");
    expect(d.solarTermName).toBe("大雪");
    expect(d.periods.slice(0, 3).map((p) => pillarToHanja(p.pillar))).toEqual(["乙亥", "甲戌", "癸酉"]);
    expect(d.exactStartAge).toBeGreaterThan(7.5);
    expect(d.exactStartAge).toBeLessThan(9);
    expect(d.conventionalStartAge).toBe(8);
  });

  it("same birth, female → forward from 丙子 with an early start (小寒 is ~5 days later)", () => {
    const d = calculateNatalChart({ ...Y2K_NOON, sex: "FEMALE" }).daeun;
    expect(d.direction).toBe("FORWARD");
    expect(d.solarTermName).toBe("小寒");
    expect(d.periods.slice(0, 3).map((p) => pillarToHanja(p.pillar))).toEqual(["丁丑", "戊寅", "己卯"]);
    expect(d.exactStartAge).toBeGreaterThan(1.2);
    expect(d.exactStartAge).toBeLessThan(2.2);
  });

  it("periods are contiguous 10-year chapters and are looked up by age", () => {
    const d = calculateNatalChart(EXAMPLE_PLAYER).daeun;
    for (let i = 1; i < d.periods.length; i++) expect(d.periods[i].startAge).toBeCloseTo(d.periods[i - 1].endAge);
    expect(activeDaeun(d, d.startAge - 0.1)).toBeUndefined();
    expect(activeDaeun(d, d.startAge + 15)!.index).toBe(1);
  });
});

describe("Annual & Monthly fortune", () => {
  it("annual pillars follow the 60-cycle", () => {
    expect(pillarToHanja(annualPillar(2024))).toBe("甲辰");
    expect(pillarToHanja(annualPillar(2025))).toBe("乙巳");
    expect(pillarToHanja(annualPillar(2026))).toBe("丙午");
  });

  it("monthly pillars use the solar month of the 15th", () => {
    expect(pillarToHanja(monthlyPillar(2026, 3).pillar)).toBe("辛卯");
    expect(pillarToHanja(monthlyPillar(2026, 2).pillar)).toBe("庚寅");
    // January 2024 still belongs to the 癸卯 year → 乙丑 month
    expect(pillarToHanja(monthlyPillar(2024, 1).pillar)).toBe("乙丑");
    expect(pillarToHanja(monthlyPillar(2024, 12).pillar)).toBe("丙子");
  });

  it("current fortune: January uses the previous Saju year, and results are memoized", () => {
    const chart = calculateNatalChart(EXAMPLE_PLAYER);
    expect(pillarToHanja(getCurrentFortune(chart, { year: 2026, month: 1 }).annual.pillar)).toBe("乙巳");
    const a = getCurrentFortune(chart, { year: 2026, month: 6 });
    const b = getCurrentFortune(chart, { year: 2026, month: 6 });
    expect(a.annual).toBe(b.annual);
    expect(a.monthly).toBe(b.monthly);
    expect(a.age).toBeCloseTo(28.7, 1);
    expect(a.daeun).toBeDefined();
  });

  it("2026 丙午 activates 桃花 for a 酉-day chart", () => {
    const chart = calculateNatalChart(EXAMPLE_PLAYER);
    const f = getCurrentFortune(chart, { year: 2026, month: 6 });
    expect(f.annual.activatedShinsal.map((s) => s.id)).toContain("DOHWA");
  });
});
