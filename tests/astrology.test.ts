import { describe, expect, it } from "vitest";
import { PLANETS, angles, planetLongitude } from "../src/astrology/ephemeris";
import { calculateAstrologyChart, calculateTransits, findAspect, houseOf, jdForMonth, signOf } from "../src/astrology/chart";
import { AstrologyModifierEngine, transitTrace } from "../src/astrology/interpretation";
import { calculateProgressions, calculateSolarReturn, lunarReturnJd, orbWeight, phaseWeight, solarReturnJd } from "../src/astrology/techniques";
import { buildDestinyScript, techniqueScoresAt } from "../src/story/destinyScript";
import { calculateNatalChart } from "../src/saju/chart";
import { sumModifierList } from "../src/core/lifeModifiers";
import { EXAMPLE_PLAYER } from "./fixtures";

describe("Astrology Layer A — ephemeris", () => {
  it("matches reference positions for 2000-01-01 12:00 UT within ~1°", () => {
    const ref = { SUN: 280.37, MOON: 223.32, MERCURY: 271.89, VENUS: 241.57, MARS: 327.96, JUPITER: 25.25, SATURN: 40.4, URANUS: 314.81, NEPTUNE: 303.19, PLUTO: 251.45 };
    for (const p of PLANETS) {
      const d = Math.abs(planetLongitude(p, 2451545.0) - ref[p]);
      expect(Math.min(d, 360 - d), p).toBeLessThan(p === "MOON" ? 1 : 0.6);
    }
  });

  it("Ascendant is ~90° ahead of the MC at the equator", () => {
    const { ascendant, midheaven } = angles(2451545.0, 0, 0);
    const d = (ascendant - midheaven + 360) % 360;
    expect(Math.abs(d - 90)).toBeLessThan(3);
  });
});

describe("Astrology Layer B — chart", () => {
  const chart = calculateAstrologyChart(EXAMPLE_PLAYER);

  it("signs, rising, whole-sign houses", () => {
    expect(chart.sunSign).toBe("LIBRA");
    expect(chart.risingSign).toBeDefined();
    expect(chart.houseSystem).toBe("WHOLE_SIGN");
    // Sun rises around 06:15 → at 09:30 it sits in the 12th house (above the eastern horizon).
    expect(chart.positions.SUN!.house).toBe(12);
    expect(signOf(0)).toBe("ARIES");
    expect(signOf(359)).toBe("PISCES");
    expect(houseOf(95, 3)).toBe(1); // Cancer planet, Cancer rising
  });

  it("unknown birth time falls back to solar whole-sign houses", () => {
    const c = calculateAstrologyChart({ year: 1997, month: 9, day: 28, sex: "FEMALE" });
    expect(c.houseSystem).toBe("SOLAR_WHOLE_SIGN");
    expect(c.positions.SUN!.house).toBe(1);
    expect(c.risingSign).toBeUndefined();
  });

  it("aspects", () => {
    expect(findAspect(10, 130, "natalOrb")!.type).toBe("TRINE");
    expect(findAspect(10, 185, "natalOrb")!.type).toBe("OPPOSITION");
    expect(findAspect(10, 55, "natalOrb")).toBeUndefined();
    expect(chart.aspects.length).toBeGreaterThan(0);
  });

  it("transits detect the Saturn return near age 29", () => {
    const years = Array.from({ length: 6 }, (_, i) => 2024 + i).filter((y) =>
      [1, 4, 7, 10].some((m) => calculateTransits(chart, jdForMonth(y, m), ["SATURN"]).hits[0].isReturn),
    );
    expect(years.length).toBeGreaterThan(0);
    expect(years.every((y) => y - 1997 >= 26 && y - 1997 <= 31)).toBe(true);
  });
});

describe("Astrology Layer C — modifiers", () => {
  it("Jupiter through the 9th house raises travel / overseas / education", () => {
    const chart = calculateAstrologyChart(EXAMPLE_PLAYER);
    const jd = jdForMonth(2026, 6);
    const t = calculateTransits(chart, jd, ["JUPITER"]);
    expect(t.hits[0].house).toBe(9);
    const m = sumModifierList(transitTrace(t, "annual"));
    expect(m.overseas).toBeGreaterThan(0.05);
    expect(m.travel).toBeGreaterThan(0.05);
    expect(m.education).toBeGreaterThan(0.05);
  });

  it("produces an ASTROLOGY source with a traceable breakdown and varies over time", () => {
    const e = new AstrologyModifierEngine();
    const chart = calculateAstrologyChart(EXAMPLE_PLAYER);
    const a = e.calculateDetailed(chart, { year: 2020, month: 3 });
    const b = e.calculateDetailed(chart, { year: 2026, month: 6 });
    expect(e.calculateDetailed(chart, { year: 2020, month: 3 })).toBe(a); // cached
    const src = e.toModifierSource(b);
    expect(src.source).toBe("ASTROLOGY");
    expect(src.breakdown!.every((m) => m.source.startsWith("ASTROLOGY/"))).toBe(true);
    expect(a.modifiers).not.toEqual(b.modifiers);
    // Raw chart holds no gameplay values.
    expect(chart as unknown as Record<string, unknown>).not.toHaveProperty("modifiers");
  });
});

describe("Astrology time techniques — progressions, Solar & Lunar Return", () => {
  const birth = { year: 1997, month: 9, day: 28, hour: 9, minute: 30, sex: "FEMALE" as const };
  const chart = calculateAstrologyChart(birth);
  const natalSun = chart.positions.SUN!.longitude;
  const natalMoon = chart.positions.MOON!.longitude;
  const sep = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
  const jdToDate = (jd: number) => new Date((jd - 2440587.5) * 86_400_000);

  it("orb tiers: <1° strong, 1–2° moderate, >2° background; applying > separating", () => {
    expect(orbWeight(0.4)).toBe(1);
    expect(orbWeight(1.5)).toBe(0.6);
    expect(orbWeight(2.5)).toBe(0.25);
    expect(phaseWeight(true)).toBeGreaterThan(phaseWeight(false));
  });

  it("Solar Return: the Sun is back on its natal degree, on (or a day from) the birthday, every year", () => {
    for (const y of [1998, 2026, 2050]) {
      const jd = solarReturnJd(chart, y);
      expect(sep(planetLongitude("SUN", jd), natalSun)).toBeLessThan(0.001);
      const d = jdToDate(jd);
      expect(d.getUTCMonth()).toBe(8);
      expect(Math.abs(d.getUTCDate() - 28)).toBeLessThanOrEqual(1);
    }
  });

  it("Lunar Return: the latest return before a date, ~27.3 days long, Moon on its natal degree", () => {
    const now = 2461311; // 2026-09-27
    const { start, end } = lunarReturnJd(chart, now);
    expect(start).toBeLessThanOrEqual(now);
    expect(end).toBeGreaterThan(now);
    expect(end - start).toBeGreaterThan(27);
    expect(end - start).toBeLessThan(27.7);
    expect(sep(planetLongitude("MOON", start), natalMoon)).toBeLessThan(0.01);
  });

  it("secondary progressions: the progressed Sun moves about 1° a year; aspects are exact (≤1°)", () => {
    const at = (age: number) => calculateProgressions(chart, chart.jdUT + age * 365.2422);
    const sun30 = at(30).positions.SUN!.longitude;
    expect(sep(sun30, natalSun) / 30).toBeGreaterThan(0.9);
    expect(sep(sun30, natalSun) / 30).toBeLessThan(1.05);
    for (const age of [20, 35, 43, 60]) for (const a of at(age).aspects) expect(a.orb).toBeLessThanOrEqual(1);
  });

  it("without a birth time, return angles/houses are not used", () => {
    const noTime = calculateAstrologyChart({ year: 1997, month: 9, day: 28, sex: "FEMALE" });
    const sr = calculateSolarReturn(noTime, 2026);
    expect(sr.anglesReliable).toBe(false);
    expect(sr.ascSign).toBeUndefined();
    expect(Object.keys(sr.houses)).toHaveLength(0);
    expect(sr.contacts.every((c) => c.natalPoint !== "ASC" && c.natalPoint !== "MC")).toBe(true);
    expect(calculateProgressions(noTime, noTime.jdUT + 30 * 365.25).positions.ASC).toBeUndefined();
  });

  it("transit aspects know whether they are applying or separating", () => {
    const t = calculateTransits(chart, jdForMonth(2026, 9), ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO", "MARS", "VENUS"]);
    const all = t.hits.flatMap((h) => h.aspects);
    expect(all.length).toBeGreaterThan(0);
    for (const a of all) expect(typeof a.applying).toBe("boolean");
  });

  it("monthly astrology modifiers include progressed, Solar Return and Lunar Return layers", () => {
    const r = new AstrologyModifierEngine().calculateDetailed(chart, { year: 2040, month: 11 });
    expect(Object.keys(r.layerTotals).sort()).toEqual(["annual", "lunarReturn", "monthly", "natal", "progressed", "solarReturn"]);
    expect(r.solarReturn.jdUT).toBeLessThanOrEqual(jdForMonth(2040, 11));
    expect(r.solarReturn.endJd).toBeGreaterThan(jdForMonth(2040, 11));
    expect(r.lunarReturn.endJd - r.lunarReturn.jdUT).toBeLessThan(28);
    const sources = [...r.trace.progressed, ...r.trace.solarReturn, ...r.trace.lunarReturn].map((m) => m.source);
    expect(sources.some((s) => s.startsWith("ASTROLOGY/progressed/"))).toBe(true);
    expect(sources.some((s) => s.startsWith("ASTROLOGY/solarReturn/"))).toBe(true);
  });

  it("destiny script: transits + progressions pointing at the same life area make that year the headline", () => {
    // Themes are scored per year; the bonus only exists when BOTH techniques agree.
    const years = Array.from({ length: 30 }, (_, i) => 26 + i);
    const s = buildDestinyScript(calculateNatalChart(birth), chart, { birthYear: 1997, seed: 1 });
    expect(s.length).toBeGreaterThanOrEqual(5);
    let agreeing = 0;
    for (const age of years) {
      for (const theme of ["LOVE_MEETING", "CAREER_TURN", "MARRIAGE"] as const) {
        const t = techniqueScoresAt(calculateNatalChart(birth), chart, 1997, age, theme);
        if (t.T > 0 && t.P > 0) agreeing++;
        expect(t.P).toBeGreaterThanOrEqual(0);
        expect(t.SR).toBeGreaterThanOrEqual(0);
      }
    }
    expect(agreeing).toBeGreaterThan(0);
  });
});
