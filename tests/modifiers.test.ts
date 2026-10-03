import { describe, expect, it } from "vitest";
import { combineModifiers, emptyModifiers, mergeModifierSources, MODIFIER_CLAMP, sumModifierList, toMultiplier } from "../src/core/lifeModifiers";
import { SeededRandom } from "../src/core/rng";
import { calculateNatalChart, type SajuChart } from "../src/saju/chart";
import { natalModifierTrace } from "../src/saju/interpretation/natal";
import { SajuModifierEngine, interpretSajuForSimulation } from "../src/saju/interpretation/sajuModifierEngine";
import { transitModifierTrace } from "../src/saju/interpretation/transit";
import { synergyModifierTrace } from "../src/saju/interpretation/synergy";
import { calculateAnnualFortune } from "../src/saju/analysis/fortune";
import { EXAMPLE_PLAYER, NO_YEOKMA, STRONG_YEOKMA } from "./fixtures";

function withShinsal(chart: SajuChart, id: string, strength: number): SajuChart {
  return { ...chart, shinsal: chart.shinsal.map((s) => (s.id === id ? { ...s, strength, present: strength > 0 } : s)) };
}
function withGroup(chart: SajuChart, group: keyof SajuChart["tenGods"]["groups"], share: number): SajuChart {
  return { ...chart, tenGods: { ...chart.tenGods, groups: { ...chart.tenGods.groups, [group]: share } } };
}
const natal = (c: SajuChart) => sumModifierList(natalModifierTrace(c));

describe("LifeModifiers core", () => {
  it("combine sums and clamps; merge applies weights", () => {
    const c = combineModifiers({ mobility: 1 }, { mobility: 1 }, { career: 0.2 });
    expect(c.mobility).toBe(MODIFIER_CLAMP);
    expect(c.career).toBeCloseTo(0.2);
    const m = mergeModifierSources([
      { source: "SAJU", modifiers: { education: 0.3 } },
      { source: "ASTROLOGY", modifiers: { education: 0.2 }, weight: 0.5 },
    ]);
    expect(m.education).toBeCloseTo(0.4);
    expect(toMultiplier(0)).toBe(1);
    expect(emptyModifiers().romance).toBe(0);
  });
});

describe("SajuModifierEngine", () => {
  const base = calculateNatalChart(NO_YEOKMA);

  it("Yeokma → mobility / travel / overseas increase", () => {
    const a = natal(withShinsal(base, "YEOKMA", 0));
    const b = natal(withShinsal(base, "YEOKMA", 1));
    for (const k of ["mobility", "travel", "relocation", "overseas"] as const) expect(b[k]).toBeGreaterThan(a[k]);
  });

  it("Gwan (Officer) → career increases", () => {
    expect(natal(withGroup(base, "OFFICER", 45)).career).toBeGreaterThan(natal(withGroup(base, "OFFICER", 5)).career);
  });

  it("In (Resource) → education increases", () => {
    expect(natal(withGroup(base, "RESOURCE", 45)).education).toBeGreaterThan(natal(withGroup(base, "RESOURCE", 5)).education);
  });

  it("Dohwa → social and romantic opportunity increase", () => {
    const a = natal(withShinsal(base, "DOHWA", 0));
    const b = natal(withShinsal(base, "DOHWA", 1));
    expect(b.romance).toBeGreaterThan(a.romance);
    expect(b.social).toBeGreaterThan(a.social);
  });

  it("a real double-驛馬 chart has higher mobility tendency than one without", () => {
    const strong = interpretSajuForSimulation(calculateNatalChart(STRONG_YEOKMA)).tendencies;
    const none = interpretSajuForSimulation(base).tendencies;
    expect(strong.mobility).toBeGreaterThan(0.2);
    expect(none.mobility).toBeLessThan(strong.mobility);
  });

  it("官 + 印 + 驛馬 synergy opens an overseas/education pool (natal), and is time-dependent", () => {
    const chart = calculateNatalChart(STRONG_YEOKMA);
    const natalOnly = synergyModifierTrace(chart);
    expect(natalOnly.active.map((s) => s.id)).toContain("OFFICER_RESOURCE_YEOKMA");
    const sum = sumModifierList(natalOnly.trace);
    expect(sum.overseas).toBeGreaterThan(0);
    expect(sum.education).toBeGreaterThan(0);
    // With Daeun/annual blended in, the synergy switches on in some years and off in others.
    const engine = new SajuModifierEngine();
    const activeYears = Array.from({ length: 50 }, (_, i) => 2005 + i).filter((y) =>
      engine.calculateDetailed(chart, { year: y, month: 6 }).activeSynergies.some((s) => s.id === "OFFICER_RESOURCE_YEOKMA"),
    );
    expect(activeYears.length).toBeGreaterThan(0);
    expect(activeYears.length).toBeLessThan(50);
  });

  it("an annual 驛馬 year raises mobility vs a neutral year (子-year chart: 寅 year 2022)", () => {
    const chart = calculateNatalChart({ year: 1996, month: 6, day: 15, hour: 12, minute: 0, sex: "MALE" }); // 丙子 year
    expect(chart.fourPillars.year.earthlyBranch).toBe("ZI");
    const y2022 = sumModifierList(transitModifierTrace(calculateAnnualFortune(chart, 2022), "annual"));
    const y2021 = sumModifierList(transitModifierTrace(calculateAnnualFortune(chart, 2021), "annual"));
    expect(y2022.mobility).toBeGreaterThan(y2021.mobility);
  });

  it("combines natal + Daeun + annual + monthly layers with a full trace", () => {
    const engine = new SajuModifierEngine();
    const chart = calculateNatalChart(EXAMPLE_PLAYER);
    const r = engine.calculateDetailed(chart, { year: 2026, month: 9 });
    expect(r.trace.natal.length).toBeGreaterThan(0);
    expect(r.trace.daeun.length).toBeGreaterThan(0);
    expect(r.trace.annual.length).toBeGreaterThan(0);
    expect(r.trace.monthly.length).toBeGreaterThan(0);
    expect(r.trace.natal.every((m) => m.source.startsWith("SAJU/"))).toBe(true);
    expect(engine.natalTrace(chart)).toBe(engine.natalTrace(chart)); // cached
    // monthly is lightweight relative to annual
    const mag = (l: typeof r.layerTotals.annual) => Object.values(l).reduce((s, v) => s + Math.abs(v), 0);
    expect(mag(r.layerTotals.monthly)).toBeLessThan(mag(r.layerTotals.annual));
    expect(engine.calculate(chart, { year: 2026, month: 9 })).toEqual(r.modifiers);
    expect(engine.toModifierSource(r).source).toBe("SAJU");
  });

  it("raw chart data stays separate from gameplay interpretation", () => {
    const chart = calculateNatalChart(EXAMPLE_PLAYER) as unknown as Record<string, unknown>;
    for (const key of ["romance", "career", "wealth", "mobility", "modifiers"]) expect(chart).not.toHaveProperty(key);
    expect(chart).toHaveProperty("fourPillars");
    expect(chart).toHaveProperty("shinsal");
  });
});

describe("SeededRandom", () => {
  it("is deterministic per seed and differs across seeds", () => {
    const a = new SeededRandom(42), b = new SeededRandom(42), c = new SeededRandom(43);
    const sa = Array.from({ length: 5 }, () => a.next());
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(sa);
    expect(Array.from({ length: 5 }, () => c.next())).not.toEqual(sa);
  });

  it("weighted selection follows weights and never picks zero weight", () => {
    const r = new SeededRandom(1);
    const counts = { a: 0, b: 0, z: 0 };
    for (let i = 0; i < 20000; i++) counts[r.weighted([{ item: "a" as const, weight: 3 }, { item: "b" as const, weight: 1 }, { item: "z" as const, weight: 0 }])]++;
    expect(counts.z).toBe(0);
    expect(counts.a / counts.b).toBeGreaterThan(2.7);
    expect(counts.a / counts.b).toBeLessThan(3.3);
  });
});
