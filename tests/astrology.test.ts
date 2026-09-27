import { describe, expect, it } from "vitest";
import { PLANETS, angles, planetLongitude } from "../src/astrology/ephemeris";
import { calculateAstrologyChart, calculateTransits, findAspect, houseOf, jdForMonth, signOf } from "../src/astrology/chart";
import { AstrologyModifierEngine, transitTrace } from "../src/astrology/interpretation";
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
